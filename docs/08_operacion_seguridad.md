# EP-05 — Operación y seguridad

## Decisiones operativas

- El build de Vercel nunca modifica la base de datos. La migración usa la URL directa,
  un `pg_advisory_lock`, una sola cabeza Alembic y una verificación posterior.
- Producción se despliega como artefacto prebuilt sin dominio, se prueba y después se
  promueve. El entorno `production` debe restringirse a `main` y exigir revisor.
- Los secretos solo viven en GitHub Environments. Checkout no conserva credenciales y
  las acciones externas están fijadas a commits revisados.
- Un rollback de aplicación usa `vercel rollback <deployment-id>`. Una migración se
  revierte con una migración compensatoria; nunca con un downgrade destructivo automático.

## Runbook de migración

1. Confirmar backup reciente, revisión objetivo y compatibilidad hacia atrás del cambio.
2. Ejecutar **Controlled database migration** para `staging`; revisar el artefacto JSON.
3. Ejecutar smoke y journey comercial. Repetir para `production` con aprobación.
4. El pipeline obtiene el estado, toma un lock exclusivo, aplica y comprueba `head`.
5. Si falla antes de promover, detener el release. Si ya se promovió, hacer rollback de
   aplicación y preparar una migración compensatoria.

Secretos requeridos por entorno: `DATABASE_URL_UNPOOLED`. No se debe usar el pooler para
migraciones. La URL jamás se imprime ni se guarda como artefacto.

## Runbook de backup y restore

Fuente: `BACKUP_SOURCE_DATABASE_URL`; destino: `RESTORE_DATABASE_URL`. Ambas credenciales
pertenecen al entorno protegido `staging-restore`, deben ser distintas y de mínimo privilegio.

1. Un revisor autoriza el backup real y confirma que staging puede ser reemplazado.
2. Lanzar **Authorized staging restore drill**, escribir `RESTORE-STAGING` y suministrar
   la URL web conectada a esa base.
3. El job crea un dump custom, valida su catálogo, limpia/restaura staging, lleva el esquema
   a `head`, fuerza constraints y ejecuta un canary transaccional.
4. El journey Playwright valida lectura/escritura real. Logs, catálogo y resultado quedan
   retenidos 90 días y se enlazan en el release readiness review.
5. Registrar duración observada como RTO. El RPO es la diferencia entre el timestamp del
   backup autorizado y el fin del restore. Producto y Platform aprueban ambos valores.
6. Ante fallo, staging se mantiene fuera de servicio, se conserva evidencia y se restaura
   el último backup previamente aprobado. Nunca se apunta producción al destino del drill.

## SLO, alertas y presupuesto de error

La fuente versionada es `ops/slo.json`; ventana móvil de 30 días y owner
`platform-on-call`. Los logs HTTP JSON aportan status, duración, request-id, trace-id y span-id;
el `traceparent` se conserva desde Next.js hasta la API y el evento del outbox para correlacionar
su entrega en el worker. Sentry aporta errores y trazas, `/health/ready` aporta DB/Redis, el panel admin aporta antigüedad del
outbox y Playwright aporta el journey comercial.

| SLI | Objetivo | Alerta | Runbook |
| --- | --- | --- | --- |
| Web: respuestas válidas y p95 | 99,9%; 2,5 s | burn 10%/1 h | rollback Vercel y revisar logs |
| API: no-5xx y p95 | 99,9%; 1 s | burn 10%/1 h | correlacionar trace-id/request-id/Sentry |
| DB: readiness y p95 | 99,95%; 500 ms | 2 fallos seguidos | conexiones, proveedor y migración |
| Outbox: procesamiento y edad | 99%; <= 5 min | edad > 5 min por 10 min | worker, SMTP y replay auditado |
| Journey comercial | 99%; 3 min | 2 fallos seguidos | artefacto Playwright por dominio |

El fast burn pagina; el slow burn crea ticket. Con más de 50% del presupuesto consumido se
congelan cambios no esenciales; con 100% solo se permiten mitigaciones y rollback hasta que
la ventana vuelva a estar dentro del objetivo.

El monitor programado abre automáticamente un issue con el enlace a la ejecución cuando falla.
El issue es el canal durable de alerta hasta que exista un proveedor de on-call dedicado.

## Ejercicio de alerta y release readiness

En staging: detener el worker diez minutos, confirmar alerta `outbox_stale`, reanudarlo y
verificar drenaje sin duplicados. Después provocar un fallo controlado del smoke, confirmar
notificación al owner y recuperar la versión anterior. Adjuntar timestamps, alerta, ack,
recuperación, RTO/RPO y enlaces de runs. La épica no se considera operativamente aprobada
hasta que los drills de restore y alerta tengan evidencia real; el código no falsifica esa
evidencia.

## Headers y contenedor

La web publica CSP, HSTS, `nosniff`, anti-framing, referrer y permissions policy. La CSP
permite los endpoints HTTPS/WSS usados por Clerk y Sentry, manteniendo bloqueados objetos y
ancestros. El API usa imágenes fijadas por digest, UID/GID 10001, filesystem de aplicación
sin privilegios y healthcheck HTTP. Trivy bloquea vulnerabilidades HIGH/CRITICAL corregibles.
