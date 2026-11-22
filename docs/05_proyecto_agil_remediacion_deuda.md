# Proyecto ágil de remediación de deuda técnica de RexFy

**Horizonte inicial:** 12 semanas  
**Cadencia:** 6 sprints de 2 semanas  
**Fuente:** `docs/04_auditoria_deuda_tecnica.md`  
**Estado:** en ejecución

## Estado de ejecución

| Épica | Estado | Avance al 22 de noviembre de 2026 |
|---|---|---|
| EP-01 Operaciones visibles y resilientes | En validación | Mutaciones antes silenciosas devuelven estado visible; llamadas API tienen timeout y request ID; lecturas degradadas permiten reintentar; falta validar el journey autenticado con PostgreSQL activo |

La implementación de EP-01 corrigió además una condición insegura: una consulta fallida del envío ya no se interpreta como ausencia de envío ni habilita la confirmación de recepción.

## 1. Propósito y resultado esperado

El proyecto llevará a RexFy desde un MVP funcional con deuda alta a una versión candidata a producción, con operaciones confiables, medición de producto y controles operativos verificables. El trabajo no busca reescribir la aplicación ni dividirla en microservicios. Busca endurecer el monolito modular existente y reducir los riesgos que impiden operar, aprender y escalar con confianza.

Al finalizar el horizonte inicial, RexFy deberá demostrar que:

- ninguna operación crítica comunica éxito si la API la rechazó o no respondió;
- los reintentos no duplican ofertas, órdenes, envíos ni resoluciones;
- las notificaciones posteriores a una transacción son durables y recuperables;
- el build y los controles mínimos de calidad son reproducibles;
- el journey comercial principal se valida obligatoriamente;
- Producto puede observar activación, conversión, cierre y repetición por rol;
- existe un procedimiento probado para desplegar, migrar, recuperar y responder a incidentes;
- el posicionamiento del MVP distingue claramente el producto disponible de las capacidades futuras.

## 2. Objetivo de producto del proyecto

**Objetivo:** aumentar la confianza operativa y la capacidad de aprendizaje de RexFy para que un generador, un comprador y un transportista completen el flujo publicación → negociación → orden → transporte → entrega sin efectos duplicados, fallos silenciosos ni pérdida de trazabilidad.

### Indicadores de resultado

| Indicador | Línea base | Meta del proyecto |
|---|---:|---:|
| Mutaciones críticas que manejan explícitamente éxito y error | Incompleta | 100 % |
| Operaciones críticas protegidas contra reintentos | 0 con idempotency key transversal | 100 % del alcance definido |
| Build reproducible sin descargar fuentes | No | Sí |
| E2E comercial obligatorio en el pipeline acordado | No | Sí |
| Notificaciones de negocio con persistencia y reintento | No | Sí |
| Funnel principal instrumentado | No | Sí, desde registro hasta entrega |
| Métricas con fórmula, ventana y owner | Parcial | 100 % de KPIs publicados |
| Restore de staging ensayado | Sin evidencia | Exitoso y documentado |
| Violaciones WCAG A/AA automáticas en journeys cubiertos | 0 en muestra manual | 0 como gate continuo |
| P1 abiertos de la auditoría | 8 | 0 |

Las metas de latencia, disponibilidad y recuperación se fijarán en el Sprint 1 usando una línea base observada. No se asignarán números arbitrarios antes de medir el sistema.

## 3. Alcance

### Incluido

- manejo uniforme de errores, timeouts y estados degradados;
- idempotencia, constraints y control de concurrencia;
- outbox transaccional y entrega recuperable de notificaciones;
- build, CI, pruebas, accesibilidad y controles de supply chain;
- migraciones, restore, SLO, observabilidad y runbooks;
- instrumentación de producto y diccionario de métricas;
- decisión y validación del posicionamiento del MVP;
- modularización selectiva donde reduzca riesgo inmediato;
- documentación de arquitectura actual y decisiones relevantes.

### No incluido en el horizonte inicial

- migración a microservicios;
- reescritura completa del frontend o backend;
- implementación funcional de manufactura distribuida;
- ESG, recomendaciones, inteligencia de precios o pagos;
- cambios cosméticos sin evidencia de impacto en conversión, accesibilidad o tarea;
- refactors sin relación trazable con un riesgo, una métrica o un costo de cambio.

## 4. Supuestos de planificación

- Los sprints duran dos semanas y producen un incremento demostrable.
- Los puntos son estimaciones relativas, no horas ni compromisos contractuales.
- La velocidad se calibra después de dos sprints. El Product Owner ajusta alcance, no calidad.
- Cada PBI tiene un owner funcional por rol; la asignación nominal ocurre al planificar el sprint.
- Los P1 se atienden antes que la expansión funcional del producto.
- Un hallazgo puede requerir discovery técnico dentro del PBI, pero no puede cerrarse sin evidencia verificable.
- Si el equipo tiene menos capacidad que la asumida, se conserva el orden y se extiende el horizonte.

## 5. Equipo y responsabilidades

| Rol | Responsabilidad en el proyecto |
|---|---|
| Sponsor | Aprueba objetivo, presupuesto, tolerancia al riesgo y decisión de salida a producción |
| Product Owner | Ordena el backlog, define outcomes, valida métricas y resuelve decisiones de alcance |
| Scrum Master o Delivery Lead | Facilita flujo, elimina impedimentos y protege retrospectivas y mejora continua |
| Tech Lead | Define límites técnicos, estrategia de idempotencia, transacciones, ADRs y readiness |
| Backend | Integridad de dominio, outbox, datos, paginación y observabilidad API |
| Frontend | Manejo de errores, resiliencia, accesibilidad, analytics y pruebas de componentes |
| QA | Estrategia de pruebas, automatización E2E, concurrencia, accesibilidad y evidencia de aceptación |
| Platform o DevOps | Pipeline, migraciones, restore, seguridad de supply chain, SLO y alertas |
| UX Research y Diseño | Pruebas por rol, estados degradados, landing y criterios de usabilidad |
| Data o Product Analytics | Taxonomía, calidad de eventos, diccionario y dashboards de producto |

Una persona puede asumir varios roles. La responsabilidad no desaparece si no existe un cargo dedicado.

## 6. Épicas

| Épica | Resultado | Auditoría relacionada | Prioridad |
|---|---|---|---|
| EP-01 Operaciones visibles y resilientes | El usuario conoce el resultado real de cada acción y puede recuperarse de fallos | DT-01, DT-20, DT-22 | P1 |
| EP-02 Integridad transaccional | Reintentos y concurrencia no crean efectos duplicados ni estados inválidos | DT-02, DT-10, DT-11 | P1 |
| EP-03 Mensajería durable | Ninguna notificación confirmada se pierde por una caída de Redis o SMTP | DT-03, DT-21 | P1 |
| EP-04 Calidad y entrega continua | Build y journeys críticos son reproducibles y obligatorios | DT-04, DT-05, DT-13, DT-14, DT-19, DT-24 | P1 |
| EP-05 Operación y seguridad | Deploy, migración, restore, observabilidad y hardening tienen controles verificables | DT-08, DT-17, DT-18, DT-21, DT-25 | P1 |
| EP-06 Producto medible y enfocado | Producto mide el funnel y comunica un MVP coherente | DT-06, DT-07, DT-15, DT-23 | P1 |
| EP-07 Arquitectura mantenible | Los módulos y datos escalan sin reescritura | DT-09, DT-10, DT-11, DT-12, DT-16, DT-26 | P2 |

## 7. Backlog priorizado

### Backlog maestro

El backlog maestro cubre toda la deuda auditada. El plan de sprints selecciona los candidatos del horizonte inicial; los elementos de arquitectura que no sean necesarios para cerrar un P1 permanecen ordenados para el siguiente incremento. Ningún sprint compromete automáticamente todos los elementos de la tabla.

| Orden | PBI | Épica | Resultado verificable | Puntos | Dependencias | Owner principal |
|---:|---|---|---|---:|---|---|
| 1 | US-01 Manejar el resultado de todas las mutaciones | EP-01 | Ninguna Server Action redirige o revalida tras un error | 8 | Ninguna | Frontend |
| 2 | US-02 Aplicar timeout y correlación en llamadas API | EP-01 | Todas las llamadas tienen timeout, cancelación y request ID | 5 | Ninguna | Frontend / Backend |
| 3 | US-03 Eliminar la descarga de fuentes durante el build | EP-04 | Build exitoso con red externa restringida | 3 | Ninguna | Frontend |
| 4 | US-04 Crear smoke público obligatorio | EP-04 | CI falla si portada, marketplace o health no responden correctamente | 5 | US-03 | QA |
| 5 | EN-01 Diseñar el estándar de idempotencia | EP-02 | ADR y contrato aprobados para claves, retención y respuestas repetidas | 5 | Ninguna | Tech Lead |
| 6 | US-05 Hacer idempotente la aceptación de ofertas | EP-02 | El mismo comando repetido produce una sola transacción | 8 | EN-01 | Backend |
| 7 | US-06 Proteger creación de thread, envío y cotización | EP-02 | Concurrencia devuelve resultado estable o 409, nunca 500 por constraint | 8 | EN-01 | Backend |
| 8 | US-07 Hacer idempotentes shipment y resolución de disputa | EP-02 | Reintentos no duplican shipment, evento ni resolución | 8 | EN-01 | Backend |
| 9 | EN-02 Crear outbox transaccional | EP-03 | Evento y cambio de negocio se confirman en la misma transacción | 13 | EN-01 | Backend |
| 10 | US-08 Despachar, reintentar y reproducir notificaciones | EP-03 | Fallos temporales se reintentan y fallos agotados quedan recuperables | 8 | EN-02 | Backend / Platform |
| 11 | US-09 Observar salud del outbox | EP-03 | Dashboard y alertas muestran pendiente, antigüedad, reintentos y fallos | 5 | US-08 | Platform |
| 12 | EN-03 Automatizar migración segura | EP-05 | Pipeline ejecuta prechecks, migración aprobada y verificación posterior | 8 | Ninguna | Platform |
| 13 | US-10 Probar backup y restore | EP-05 | Restore de staging cumple el objetivo acordado y deja evidencia | 5 | EN-03 | Platform |
| 14 | EN-04 Definir taxonomía de eventos de producto | EP-06 | Eventos, propiedades, identidad, consentimiento y owners aprobados | 5 | Decisión de analytics | Product / Data |
| 15 | US-11 Instrumentar el funnel principal | EP-06 | Registro → empresa → publicación/contacto → oferta → orden → entrega es medible | 8 | EN-04 | Frontend / Backend |
| 16 | US-12 Corregir y documentar KPIs | EP-06 | Cada KPI tiene fórmula, ventana, denominador, timezone y tests | 8 | EN-04 | Product / Data |
| 17 | SP-01 Resolver el foco del MVP | EP-06 | Decisión documentada sobre reciclables y manufactura, con evidencia y fecha de revisión | 3 | Ninguna | Product Owner |
| 18 | US-13 Alinear la landing con el foco aprobado | EP-06 | Propuesta, CTA y contenido futuro no crean expectativas incorrectas | 5 | SP-01 | Product / UX / Frontend |
| 19 | EN-05 Instalar pruebas web unitarias y de componentes | EP-04 | Pipeline ejecuta pruebas rápidas con cobertura visible | 5 | Ninguna | Frontend / QA |
| 20 | US-14 Separar el wizard de publicación | EP-04 | Estado, schema, media y pasos pueden probarse de forma independiente | 8 | EN-05 | Frontend |
| 21 | US-15 Dividir y hacer obligatorio el E2E comercial | EP-04 | Smoke, journeys por dominio y happy path completo reportan pass o fail, no skip silencioso | 8 | US-04 | QA |
| 22 | US-16 Añadir móvil y accesibilidad al pipeline | EP-04 | Journey móvil, Axe y teclado son gates con artefactos de fallo | 5 | US-15 | QA / UX |
| 23 | EN-06 Establecer headers de seguridad | EP-05 | CSP y headers acordados pasan pruebas sin romper Clerk/Sentry | 5 | Ninguna | Frontend / Security |
| 24 | EN-07 Automatizar controles de supply chain | EP-05 | Dependencias, secretos, SAST y SBOM se validan en CI/release | 8 | Ninguna | Platform |
| 25 | EN-08 Definir SLO, métricas y alertas | EP-05 | SLI y alertas cubren web, API, DB, outbox y journey comercial | 8 | US-02, US-09 | Tech Lead / Platform |
| 26 | EN-09 Documentar arquitectura actual y ADRs | EP-07 | Diagramas as-is y ADRs reflejan decisiones implementadas | 5 | EN-01, EN-02 | Tech Lead |
| 27 | US-17 Paginar historiales y listas operativas | EP-07 | Threads, mensajes, órdenes, logística y admin usan paginación estable | 13 | Contrato API acordado | Backend / Frontend |
| 28 | EN-10 Introducir Unit of Work en casos críticos | EP-07 | Los casos seleccionados tienen una única frontera transaccional | 13 | EN-02 | Backend |
| 29 | EN-11 Formalizar máquinas de estado | EP-07 | Oferta, orden y envío tienen transiciones explícitas y tests exhaustivos | 8 | EN-10 | Backend / QA |
| 30 | EN-12 Endurecer imagen de contenedor | EP-05 | Imagen pinneada, no root, con healthcheck y escaneo | 5 | EN-07 | Platform |
| 31 | EN-13 Reducir duplicación y firmas extensas | EP-07 | DTOs/comandos y helpers reducen hotspots sin aumentar acoplamiento | 5 | EN-10 | Tech Lead |
| 32 | SP-02 Validar landing y tareas móviles con usuarios | EP-06 | Hallazgos de al menos los tres roles se convierten en decisiones de backlog | 8 | US-13 | UX Research |

`US` representa valor observable para usuario u operación, `EN` un habilitador técnico y `SP` un spike de decisión. Los puntos deberán revisarse durante refinamiento.

## 8. Criterios de aceptación de los PBIs críticos

### US-01 Manejar el resultado de todas las mutaciones

**Historia:** Como usuario que realiza una operación, quiero recibir el resultado real para saber si debo continuar, corregir información o reintentar.

**Criterios de aceptación:**

1. Dado que la API responde 2xx, cuando la acción termina, entonces la UI confirma el éxito y actualiza el estado correcto.
2. Dado un 400 o 422, cuando la acción termina, entonces se conservan los datos y se muestran errores junto al campo correspondiente.
3. Dado un 401 o 403, entonces la UI distingue sesión vencida de falta de permisos.
4. Dado un 409, entonces se explica el conflicto y se ofrece refrescar o continuar desde el estado vigente.
5. Dado un 500, timeout o red caída, entonces no se comunica éxito ni se descarta el formulario.
6. Todas las Server Actions de admin, listings, deals, logistics, notifications y team están cubiertas por test de error.

### US-05 Hacer idempotente la aceptación de ofertas

**Historia:** Como participante de una negociación, quiero que un reintento acepte la oferta una sola vez para evitar órdenes o inventario duplicados.

**Criterios de aceptación:**

1. Dos solicitudes simultáneas con la misma clave crean una sola transacción.
2. Una repetición devuelve el mismo resultado semántico y no repite notificaciones.
3. Una misma clave con payload diferente es rechazada.
4. La cantidad de una publicación no recurrente se descuenta una sola vez.
5. Existen pruebas de concurrencia a nivel de base de datos.

### EN-02 Crear outbox transaccional

**Criterios de aceptación:**

1. El registro de outbox se confirma en la misma transacción que el cambio de negocio.
2. Un rollback elimina ambos efectos.
3. El dispatcher puede procesar mensajes más de una vez sin duplicar el efecto externo.
4. Se registran intentos, próximo intento, último error y estado terminal.
5. Existe una operación segura de replay y queda auditada.

### US-10 Probar backup y restore

**Criterios de aceptación:**

1. El runbook identifica fuente, destino, credenciales, verificación y rollback.
2. Un restore completo se ejecuta en staging desde un backup real autorizado.
3. Se verifican migraciones, integridad referencial y un journey de lectura/escritura.
4. El tiempo y la pérdida potencial observados se usan para aprobar RTO y RPO.
5. La evidencia queda asociada al release readiness review.

### US-11 Instrumentar el funnel principal

**Historia:** Como Product Owner, quiero observar el funnel por rol para priorizar los puntos de fuga con evidencia.

**Criterios de aceptación:**

1. Cada evento tiene nombre, actor, empresa, rol, timestamp, entidad y versión de schema.
2. No se envía PII que no sea necesaria para el análisis.
3. Los eventos de backend críticos se emiten después del commit o mediante outbox.
4. El dashboard segmenta por rol, ciudad, categoría y cohorte temporal cuando exista volumen suficiente.
5. QA puede reconciliar una transacción de prueba con los eventos esperados.

### US-15 Dividir y hacer obligatorio el E2E comercial

**Criterios de aceptación:**

1. Existe un smoke público que no depende de Clerk.
2. Auth, publicación, negociación, logística y trust pueden diagnosticarse por separado.
3. El happy path completo se ejecuta en el entorno acordado y su omisión aparece como fallo o estado explícitamente no aprobable.
4. Los fallos conservan trace, screenshot, video o logs necesarios.
5. Los datos de prueba se eliminan o expiran de manera verificable.

### EN-08 Definir SLO, métricas y alertas

**Criterios de aceptación:**

1. Los SLI se calculan con datos disponibles y una ventana explícita.
2. Los SLO cubren disponibilidad y latencia de journeys, no solo uptime de procesos.
3. Las alertas se vinculan con un runbook y un owner de guardia.
4. Se ejecuta al menos un ejercicio controlado de alerta y recuperación.
5. Los presupuestos de error influyen en la decisión de desplegar o priorizar estabilidad.

## 9. Plan de sprints

El plan expresa orden y objetivo. El equipo comprometerá únicamente el sprint inmediato después del refinamiento y ajustará el resto con la velocidad observada.

### Sprint 1 Resultado visible y build confiable

**Objetivo:** eliminar fallos silenciosos básicos y establecer una línea base reproducible.

- US-01 Manejar el resultado de todas las mutaciones.
- US-02 Timeout y correlación API.
- US-03 Fuentes locales.
- US-04 Smoke público.
- Medición inicial de lead time, defectos y latencia.

**Review:** demostrar una mutación exitosa y cinco clases de error sin falso positivo, más build y smoke con red restringida.

### Sprint 2 Integridad ante reintentos y concurrencia

**Objetivo:** impedir duplicados en las operaciones de mayor impacto comercial.

- EN-01 Estándar de idempotencia.
- US-05 Aceptación de ofertas.
- US-06 Threads, mensajes y cotizaciones.
- US-07 Shipment y disputas, según capacidad.

**Review:** ejecutar dobles clics, reintentos y solicitudes concurrentes y mostrar un único efecto de negocio.

### Sprint 3 Notificaciones y recuperación operativa

**Objetivo:** mantener trazabilidad después del commit y reducir riesgo de despliegue/datos.

- EN-02 Outbox transaccional.
- US-08 Dispatcher, retries y replay.
- US-09 Salud del outbox.
- EN-03 Migración segura.
- US-10 Restore, si la capacidad lo permite.

**Review:** simular caída de Redis/SMTP, recuperar mensajes y demostrar una migración y restore en staging.

### Sprint 4 Producto medible y enfocado

**Objetivo:** convertir el funnel y la propuesta de valor en instrumentos de decisión.

- EN-04 Taxonomía de eventos.
- US-11 Funnel principal.
- US-12 Diccionario y corrección de KPIs.
- SP-01 Foco del MVP.
- US-13 Landing alineada, si la decisión está aprobada.

**Review:** seguir una transacción desde el registro hasta la entrega y verla correctamente en el dashboard.

### Sprint 5 Calidad web y experiencia móvil

**Objetivo:** reducir regresiones y validar las tareas críticas fuera del escritorio.

- EN-05 Pruebas web.
- US-14 Separar wizard.
- US-15 E2E obligatorio.
- US-16 Móvil y accesibilidad.
- SP-02 Primera ronda de validación con usuarios, si existe acceso a participantes.

**Review:** ejecutar pruebas rápidas, journey móvil y accesibilidad; demostrar un cambio del wizard protegido por tests.

### Sprint 6 Preparación para producción

**Objetivo:** decidir readiness con evidencia técnica, operativa y de producto.

- EN-06 Headers de seguridad.
- EN-07 Supply chain.
- EN-08 SLO, métricas y alertas.
- EN-09 Arquitectura actual y ADRs.
- EN-12 Contenedor endurecido.
- Cierre de P1 y release readiness review.

**Review:** presentar gates, alertas, runbooks, restore, métricas de producto y estado de riesgos residuales.

### Backlog posterior al horizonte inicial

EP-07 continúa con US-17, EN-10, EN-11 y EN-13. Puede adelantarse si la velocidad lo permite, pero no desplazará P1 ni controles de producción.

## 10. Priorización y política de flujo

El Product Owner ordenará el backlog con esta secuencia:

1. integridad de datos y acciones con falso éxito;
2. riesgos que bloquean producción o recuperación;
3. capacidad de medir el funnel y validar la tesis;
4. calidad que reduce la tasa de regresión;
5. escalabilidad y mantenibilidad;
6. mejoras cosméticas o conveniencia.

### Clases de servicio

| Clase | Uso | Política |
|---|---|---|
| Expedite | P0 confirmado, corrupción o incidente activo | Interrumpe WIP con aprobación de Sponsor y Tech Lead |
| Fecha fija | Requisito regulatorio, migración o contrato con fecha real | Se planifica hacia atrás y explicita el costo de oportunidad |
| Estándar | PBIs del proyecto | Orden normal del Product Backlog |
| Intangible | Prevención y mantenibilidad P2/P3 | Capacidad reservada para evitar acumulación |

El equipo limitará el trabajo en progreso. Un PBI bloqueado conserva visibilidad y owner; no se reemplaza silenciosamente por trabajo nuevo.

## 11. Definition of Ready

Un PBI puede entrar a Sprint Planning cuando:

- expresa el resultado y el riesgo que reduce;
- tiene criterios de aceptación verificables;
- identifica dependencias, datos y ambientes necesarios;
- tiene tamaño que permite terminarlo dentro del sprint o está dividido;
- contempla seguridad, migración, observabilidad y accesibilidad cuando aplican;
- tiene owner funcional disponible para resolver preguntas;
- el equipo entiende cómo demostrarlo en la Sprint Review.

## 12. Definition of Done

Un PBI está terminado cuando:

- cumple todos sus criterios de aceptación;
- maneja éxito, validación, autorización, conflicto, timeout y dependencia caída según el caso;
- incluye pruebas en la capa adecuada y mantiene trazabilidad PBI → test;
- no introduce hallazgos de lint, tipos, formato, seguridad o accesibilidad;
- actualiza contratos, migraciones, analytics, documentación y runbooks afectados;
- emite telemetría correlacionable sin PII innecesaria;
- se desplegó en el entorno acordado y fue demostrado;
- el Product Owner aceptó el resultado observable;
- no quedan tareas necesarias ocultas fuera del backlog.

“Código terminado” sin pruebas, operación o feedback de error no cumple Done.

## 13. Ceremonias y artefactos

| Evento | Duración sugerida | Propósito |
|---|---:|---|
| Sprint Planning | 2 horas | Fijar objetivo, capacidad, PBIs y plan inicial |
| Daily | 15 minutos | Inspeccionar avance hacia el objetivo e impedimentos |
| Refinement | 60–90 minutos por semana | Preparar los siguientes PBIs y reducir incertidumbre |
| Sprint Review | 60 minutos | Demostrar resultados con evidencia y adaptar backlog |
| Retrospective | 60 minutos | Mejorar flujo, calidad y colaboración |
| Riesgos técnicos y de producto | 30 minutos semanal | Revisar riesgos, decisiones y mitigaciones |

Artefactos mínimos:

- Product Backlog con prioridad, owner, puntos, dependencia y vínculo DT;
- Sprint Backlog con objetivo y WIP visible;
- tablero de métricas de entrega y calidad;
- registro de riesgos y decisiones;
- ADRs y runbooks versionados;
- evidencia de Sprint Review y release readiness.

## 14. Métricas del proyecto

### Flujo de entrega

- lead time y cycle time por tipo de PBI;
- throughput por sprint;
- trabajo en progreso y edad del trabajo bloqueado;
- porcentaje planificado frente a terminado, usado para aprender y no para evaluar personas;
- defectos escapados y trabajo reabierto.

### Calidad y confiabilidad

- tasa de éxito de build, smoke y E2E;
- cobertura por rama en módulos críticos;
- frecuencia de falsos éxitos en UI;
- duplicados evitados o conflictos controlados;
- antigüedad y fallos del outbox;
- change failure rate y tiempo de recuperación;
- cumplimiento de SLO y consumo de error budget.

### Producto y UX

- activación por rol;
- tiempo hasta primera publicación, primer contacto y primera orden;
- conversión publicación → conversación → oferta → orden → entrega;
- tasa de finalización del wizard y abandono por paso;
- éxito de tarea móvil y errores por tarea;
- repetición de compra y logistics attach rate con definiciones consistentes.

## 15. Riesgos del proyecto

| Riesgo | Prob. | Impacto | Respuesta | Owner |
|---|---:|---:|---|---|
| Capacidad insuficiente para 32 PBIs | Alta | Alto | Comprometer por sprint; proteger P1 y mover EP-07 al backlog posterior | Product Owner |
| Credenciales o ambientes bloquean E2E | Alta | Alto | Smoke sin secretos, ambiente de pruebas dedicado y gestión temprana de accesos | Platform / QA |
| Refactor transaccional introduce regresiones | Media | Alto | Caracterización, feature flags cuando aplique y cambios incrementales | Tech Lead |
| Analytics genera datos inconsistentes | Media | Alto | Schema versionado, QA de eventos y reconciliación con DB | Product / Data |
| Outbox duplica efectos externos | Media | Alto | Consumidores idempotentes y claves de deduplicación | Backend |
| Decisión de foco de producto se posterga | Media | Alto | Timebox del spike, decision owner y fecha límite | Sponsor / PO |
| Trabajo urgente desplaza prevención | Alta | Medio | Capacidad reservada y revisión explícita del costo de oportunidad | Delivery Lead |
| Pruebas con usuarios no consiguen participantes | Media | Medio | Reclutamiento desde Sprint 1 y alternativa de sesiones remotas moderadas | UX Research |

## 16. Gobierno de decisiones

| Decisión | Responsable | Consultados | Fecha límite sugerida |
|---|---|---|---|
| Foco del MVP y tratamiento de manufactura | Product Owner | Sponsor, UX, Tech Lead | Fin de Sprint 2 |
| Estándar de idempotencia | Tech Lead | Backend, QA, Platform | Primera semana de Sprint 2 |
| Tecnología de analytics y política de datos | Product Owner | Data, Security, Tech Lead | Fin de Sprint 3 |
| SLO, RTO y RPO | Sponsor y Tech Lead | Platform, Product, Support | Fin de Sprint 4 |
| Criterio de salida a producción | Sponsor | PO, Tech Lead, QA, Platform | Inicio de Sprint 6 |

Las decisiones se registran con contexto, opciones, consecuencias y fecha de revisión. Una decisión pendiente que bloquee un PBI debe aparecer como impedimento, no como supuesto oculto.

## 17. Release readiness review

La salida a producción se aprueba únicamente si:

- todos los P1 están cerrados o tienen una excepción firmada con fecha de expiración;
- build, smoke, pruebas críticas, seguridad y accesibilidad pasan;
- migración y rollback fueron ensayados;
- backup y restore tienen evidencia reciente;
- idempotencia y concurrencia fueron probadas en operaciones críticas;
- outbox, alertas y runbooks están activos;
- el funnel genera eventos reconciliables;
- los riesgos residuales tienen owner y respuesta;
- soporte y trust & safety conocen el flujo de escalamiento;
- Product Owner, Tech Lead, QA y Platform recomiendan el release al Sponsor.

## 18. Trazabilidad con la auditoría

| Hallazgo | PBIs que lo atienden |
|---|---|
| DT-01 | US-01 |
| DT-02 | EN-01, US-05, US-06, US-07 |
| DT-03 | EN-02, US-08, US-09 |
| DT-04 | US-03 |
| DT-05 | US-04, US-15, US-16 |
| DT-06 | EN-04, US-11 |
| DT-07 | SP-01, US-13 |
| DT-08 | EN-03, US-10 |
| DT-09 | EN-09, EN-10, EN-13 |
| DT-10 | EN-10 |
| DT-11 | EN-11 |
| DT-12 | US-17 |
| DT-13 | EN-05, US-14 |
| DT-14 | EN-05, US-15 |
| DT-15 | US-12 |
| DT-16 | EN-09 |
| DT-17 | EN-08, EN-09 |
| DT-18 | EN-06 |
| DT-19 | EN-07 |
| DT-20 | US-02 |
| DT-21 | US-09, EN-08 |
| DT-22 | US-01, US-02 |
| DT-23 | US-13, SP-02 |
| DT-24 | US-16 |
| DT-25 | EN-12 |
| DT-26 | EN-13 |

## 19. Primeras acciones

1. Nombrar Sponsor, Product Owner y Tech Lead responsables del proyecto.
2. Aprobar objetivo, alcance y política de prioridad P1.
3. Crear los PBIs en la herramienta de gestión conservando IDs y trazabilidad DT.
4. Refinar US-01, US-02, US-03 y US-04 con el equipo ejecutor.
5. Confirmar accesos a CI, Clerk, staging, PostgreSQL, Redis, storage y observabilidad.
6. Medir la línea base de build, pruebas, latencia, defectos y funnel disponible.
7. Iniciar reclutamiento de usuarios de los tres roles para Sprint 5.
8. Ejecutar Sprint Planning con capacidad real y publicar el Sprint Goal.
