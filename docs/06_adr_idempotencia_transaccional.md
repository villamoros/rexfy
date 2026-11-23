# ADR-001: Idempotencia transaccional de comandos críticos

**Estado:** aceptado  
**Fecha:** 22 de noviembre de 2026  
**Épica:** EP-02 Integridad transaccional  
**Hallazgos:** DT-02, DT-10 y DT-11

## Contexto

RexFy aceptaba comandos de negocio sin una identidad estable. Un doble clic, un reintento de red o dos solicitudes simultáneas podían repetir mensajes y notificaciones, intentar crear dos órdenes o envíos, o propagar como `500` una restricción única de PostgreSQL. Las validaciones en Python no bastan porque dos transacciones pueden leer el mismo estado antes de escribir.

## Decisión

Los comandos críticos reciben el encabezado obligatorio `Idempotency-Key`. La web crea una clave UUID al enviar el formulario, la conserva durante reintentos de esa intención y crea otra para una operación posterior.

La identidad efectiva es la tupla `(usuario, alcance, clave)`. El backend calcula además SHA-256 sobre una representación JSON canónica del path y del payload:

- una clave nueva ejecuta el comando y guarda su recurso resultante dentro de la misma transacción;
- la misma clave y el mismo hash reproducen el recurso ya confirmado sin repetir auditoría ni notificaciones;
- la misma clave con un payload diferente responde `409 Conflict`;
- la clave se conserva 24 horas; después puede reutilizarse;
- una clave mide entre 8 y 255 caracteres y solo admite letras, números, punto, guion, guion bajo y dos puntos.

Una advisory lock transaccional de PostgreSQL serializa solicitudes con la misma identidad. El registro idempotente y el efecto de negocio se confirman o revierten juntos. No se guarda una respuesta HTTP opaca: se guarda el tipo y el UUID del recurso para volver a aplicar autorización y serialización vigentes.

## Protección de invariantes con claves distintas

La idempotencia no reemplaza el control de concurrencia de negocio. Se aplican bloqueos de fila antes de decidir y escribir:

- publicación para crear una conversación y aceptar una oferta;
- publicación y conversación para emitir o contraofertar;
- orden para crear la única solicitud de transporte;
- envío para cotizar y avanzar su estado;
- disputa para resolverla.

PostgreSQL mantiene además las restricciones naturales de conversación, orden, envío y cotización. Una nueva restricción parcial garantiza una sola oferta `pending` por conversación. La migración conserva la oferta pendiente más reciente y marca las anteriores como `countered` antes de crear el índice.

## Alcances iniciales

| Alcance | Recurso reproducido |
|---|---|
| `threads.start` | conversación |
| `messages.send` | mensaje |
| `offers.send` | oferta |
| `offers.accept` | orden |
| `shipments.request` | envío |
| `transport_quotes.submit` | cotización de transporte |
| `shipments.advance` | evento de envío |
| `disputes.resolve` | disputa |

## Respuestas

- Repetición válida: mismo código de éxito y mismo resultado semántico del primer comando.
- Payload diferente: `409` con explicación y sin efectos nuevos.
- Carrera con otra clave que perdió el invariante: `409`, nunca un `500` de constraint.
- Clave ausente o inválida: `422` antes de ejecutar el caso de uso.

## Consecuencias

La solución depende deliberadamente de PostgreSQL, que ya es la base soportada. Los registros vencidos pueden eliminarse con `purge_expired`; la automatización periódica se conectará al trabajo operativo posterior. La entrega durable de notificaciones sigue perteneciendo a EP-03, pero EP-02 evita producirlas dos veces ante la repetición del mismo comando.

## Evidencia requerida

- pruebas de repetición y conflicto por hash;
- prueba concurrente con sesiones independientes para aceptación de oferta;
- verificación de una sola orden, un solo descuento de inventario y un solo evento;
- migración Alembic válida y análisis estático de API y web;
- journey autenticado completo cuando PostgreSQL esté disponible.
