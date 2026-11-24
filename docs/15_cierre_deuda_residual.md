# Cierre de hallazgos que estaban parciales

**Fecha de revisión:** 23 de noviembre de 2026
**Criterio:** un hallazgo solo figura como resuelto cuando existe implementación y evidencia
repetible. La preparación de un procedimiento no sustituye una ejecución real.

## Matriz de cierre

| Hallazgo | Estado | Evidencia |
| --- | --- | --- |
| DT-07 Foco de producto | Resuelto | Landing y metadata describen exclusivamente el marketplace B2B de materiales recuperados. |
| DT-08 Recuperación operativa | Requiere ejecución externa | Workflow protegido, backup, restore, canary y journey están implementados; GitHub registra cero ejecuciones del drill. |
| DT-09 Límites de arquitectura | Resuelto | Políticas compartidas, acoplamientos `trust/logistics → deals` eliminados, ADR-007 y tests de dependencias. |
| DT-10 Frontera transaccional | Resuelto | Mutaciones HTTP ordinarias usan `UnitOfWork`; commits restantes corresponden a identidad concurrente, saga de storage y worker. |
| DT-14 Cobertura y mutación | Resuelto | Cobertura global de ramas con umbral de 60%; baseline observado 89,59%; workflow semanal/manual de mutación sobre reglas críticas. |
| DT-16 Arquitectura aspiracional | Resuelto | C4 separa entidades existentes de capacidades futuras y enlaza la arquitectura implementada. |
| DT-17 ADR y NFR | Resuelto | ADRs 005–007, SLO/SLI, presupuesto de error y runbooks versionados. |
| DT-21 Observabilidad | Resuelto | `traceparent` web/API, trace-id persistido en outbox, logs de excepción y entrega, readiness, SLO y alerta durable por issue. |
| DT-22 Recuperación UX | Resuelto | Retry, status page, soporte, filtros en URL y último resultado seguro por consulta durante 30 minutos. |
| DT-23 Landing y validación | Requiere participantes | Landing acortada y capacidades futuras retiradas; SP-02 exige tres sesiones reales y no puede cerrarse con datos simulados. |
| DT-26 Hotspots y duplicación | Resuelto | Comandos, políticas compartidas y consola/marketplace divididos por responsabilidad; landing reducida. |

## Evidencia pendiente de DT-08

Owner: Platform. Ejecutar en GitHub Actions:

1. autorizar el entorno `staging-restore` y confirmar que el destino puede reemplazarse;
2. lanzar **Authorized staging restore drill** con `RESTORE-STAGING`;
3. conservar el artefacto, duración, RTO y RPO aprobados;
4. provocar en staging la alerta `outbox_stale`, registrar recepción y reconocimiento;
5. verificar drenaje sin duplicados y enlazar ambos runs aquí.

| Evidencia | Valor |
| --- | --- |
| Restore run | Pendiente |
| Resultado y fecha | Pendiente |
| RTO observado | Pendiente |
| RPO observado | Pendiente |
| Alert run / issue | Pendiente |
| Ack y recuperación | Pendiente |

## Evidencia pendiente de DT-23

Owner: Product/UX. Usar el protocolo de `09_producto_medicion.md` sin guardar PII.

| Fecha | Perfil anonimizado | Dispositivo | Tarea | Resultado/tiempo | Hallazgo | Decisión/PBI |
| --- | --- | --- | --- | --- | --- | --- |
| Pendiente | Generador | Móvil | Crear empresa y publicar PET | Pendiente | Pendiente | Pendiente |
| Pendiente | Comprador | Móvil | Encontrar PET y aceptar oferta | Pendiente | Pendiente | Pendiente |
| Pendiente | Transportador | Móvil | Cotizar y actualizar entrega | Pendiente | Pendiente | Pendiente |

La deuda no se declarará totalmente cerrada hasta completar estas dos evidencias externas.
