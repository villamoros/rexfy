# ADR-003 — Outbox transaccional para mensajería durable

**Estado:** aceptado e implementado

**Fecha:** 22 de noviembre de 2026
**Épica:** EP-03 Mensajería durable

## Contexto

RexFy guardaba la notificación en PostgreSQL y, después del commit, intentaba publicar el correo en Redis/RQ. Si Redis no estaba disponible, el cambio de negocio quedaba confirmado pero el correo se perdía. Las invitaciones de equipo tenían la misma ventana de pérdida y no existían reintentos persistentes, estado terminal, replay ni visibilidad operativa.

## Decisión

Cada efecto de correo se registra en `outbox_events` dentro de la misma transacción PostgreSQL que su cambio de negocio. Un worker independiente consulta eventos vencidos directamente en PostgreSQL mediante `FOR UPDATE SKIP LOCKED`; Redis deja de formar parte de la ruta de entrega.

El ciclo de vida es `pending → processing → processed`, con `retry` para fallos temporales y `failed` cuando se agotan ocho intentos. Los reintentos usan esperas de 1 min, 5 min, 15 min, 1 h, 6 h, 12 h y 24 h. Un lease de cinco minutos permite recuperar eventos cuyo worker murió mientras los procesaba.

`outbox_deliveries` conserva el resultado por evento y destinatario. Un destinatario confirmado no se vuelve a enviar al reintentar o reproducir el evento. Cada correo lleva además un `Message-ID` determinista para que los proveedores que deduplican puedan reconocer una repetición.

El replay manual solo acepta eventos `failed`, conserva las entregas ya confirmadas y registra `outbox.replayed` en la auditoría. Los administradores pueden ver pendientes, eventos en proceso, reintentos, agotados, vencidos y entregados en 24 horas.

## Garantías y límite conocido

- El cambio de negocio y el evento de outbox se confirman o revierten juntos.
- Varios workers pueden competir sin reclamar simultáneamente el mismo evento.
- Un fallo de Redis no afecta la mensajería; Redis sigue limitado al rate limiting.
- Un fallo SMTP produce reintento persistente y, al agotarse, recuperación manual auditada.
- La entrega es **al menos una vez**. SMTP no ofrece una transacción distribuida con PostgreSQL: si el proceso muere después de que SMTP acepta el correo y antes de guardar `delivered_at`, puede ocurrir una repetición. El ledger y el `Message-ID` determinista reducen esa ventana, pero no prometen exactamente una vez fuera de la base de datos.

## Operación

Ejecutar un worker por entorno con:

```bash
uv run python -m app.worker
```

Diagnóstico:

1. Revisar `/admin/outbox/health`; `failed > 0`, `due` sostenido o una antigüedad creciente requieren atención.
2. Consultar `/admin/outbox` y corregir primero la causa indicada en `last_error`.
3. Usar `POST /admin/outbox/{id}/replay` desde la consola administrativa únicamente después de corregir la dependencia.
4. Confirmar que el evento llegue a `processed` y que no aumente `failed`.

Las variables operativas son `REXFY_OUTBOX_POLL_SECONDS`, `REXFY_OUTBOX_BATCH_SIZE`, `REXFY_OUTBOX_MAX_ATTEMPTS` y `REXFY_OUTBOX_PROCESSING_TIMEOUT_SECONDS`.

## Consecuencias

La entrega ya no desaparece silenciosamente y puede inspeccionarse y recuperarse. A cambio, PostgreSQL recibe consultas periódicas del worker y las tablas de outbox necesitan una política futura de retención para eventos y entregas procesados.
