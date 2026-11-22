# Auditoría de deuda técnica de RexFy

**Fecha:** 22 de noviembre de 2026  
**Alcance:** arquitectura de software, ingeniería de software, análisis y diseño, UX/UI y Product Management.  
**Repositorio auditado:** `app/` en `main` (`d142d1b`, 49 commits). Los prototipos HTML y `Rexfy.docx` del directorio padre se usaron como referencia de intención, no como código de producción.

## 1. Dictamen ejecutivo

RexFy es un MVP técnicamente competente, con una base superior a la de un prototipo: monolito modular razonable, contratos OpenAPI tipados, autorización por empresa/rol, migraciones, auditoría de acciones, control de concurrencia en la aceptación de ofertas, 65 pruebas API declaradas y un journey E2E que cubre el ciclo comercial principal.

No está todavía listo para operar como marketplace B2B con garantías de producción. La mayor deuda no está en el estilo del código sino en cuatro brechas sistémicas:

1. **Confiabilidad de operaciones críticas:** varias Server Actions ignoran errores y muestran una navegación aparentemente exitosa; tampoco existe una estrategia transversal de idempotencia.
2. **Confiabilidad operativa:** las notificaciones posteriores al `commit` pueden perderse, las migraciones de producción son manuales y faltan SLO, RTO/RPO, runbooks y pruebas de recuperación.
3. **Gobierno de producto:** la North Star y los funnels están documentados pero no instrumentados; por tanto no se puede validar la tesis, priorizar con evidencia ni medir retención/conversión.
4. **Coherencia de alcance:** la propuesta pública ya mezcla el marketplace de reciclables con manufactura distribuida, aunque esta última no está implementada y no pertenece al foco recomendado para el MVP.

### Evaluación de madurez

| Dimensión | Nota | Lectura |
|---|---:|---|
| Arquitectura de software | 6.4/10 | Buena elección macro; límites y transacciones se erosionan dentro del monolito |
| Ingeniería de software | 6.2/10 | Buen lint, tipos, migraciones y pruebas API; gates incompletos y build frágil |
| Análisis y diseño | 5.3/10 | Existe C4 y blueprint; faltan especificaciones ejecutables, ADRs y modelos de estado |
| UX/UI | 7.0/10 | Base visual, responsive y accesible sólida; resiliencia y feedback insuficientes |
| Product Management | 4.5/10 | Tesis y métricas correctas; sin discovery, instrumentación, modelo de negocio ni roadmap por outcomes |
| **Global** | **5.9/10** | **MVP funcional con deuda alta antes de producción y aprendizaje de mercado** |

La nota no es un promedio de “cantidad de código”. Pondera riesgo para integridad comercial, capacidad de aprendizaje, costo de cambio y operación sostenida.

## 2. Evidencia y verificaciones realizadas

| Control | Resultado | Evidencia / limitación |
|---|---|---|
| Estado Git | Pasa | Árbol inicialmente limpio, rama `main`, 49 commits |
| Ruff | Pasa | `uv run ruff check .` sin hallazgos |
| Formato Python | Pasa | 106 archivos ya formateados |
| Complejidad Python | Parcial | C90 pasa; PLR detectó 9 problemas, principalmente funciones con 6–10 argumentos |
| ESLint web | Pasa | Sin hallazgos |
| TypeScript | Pasa | `next typegen && tsc --noEmit` |
| Contrato OpenAPI | Pasa | Regeneración byte a byte idéntica; tipos web sincronizados |
| Build de producción | **Falla** | `next/font/google` no pudo descargar Manrope e IBM Plex Mono; el build depende de red externa |
| Pruebas API | No ejecutables en este entorno | 65 tests encontrados; requieren PostgreSQL y Docker Desktop no estaba activo. El runner quedó esperando conexión |
| E2E | No ejecutado completo | Requiere API, PostgreSQL y credenciales Clerk; CI lo omite si no existen secretos |
| Render público | Pasa con degradación | Portada y marketplace respondieron 200; API inactiva se comunica como “sin conexión” |
| Responsive | Pasa en muestra | Sin overflow horizontal a 390 y 1440 px en portada/marketplace |
| Accesibilidad automática | Pasa en muestra | Axe: 0 violaciones WCAG A/AA en portada móvil y marketplace móvil/escritorio |
| Auditoría npm | No concluyente | El endpoint de advisories respondió `ECONNRESET`; no sustituye un gate de CI |

Estas limitaciones se mantienen explícitas: esta auditoría no certifica seguridad, carga, recuperación ante desastres ni el journey autenticado en producción.

## 3. Registro priorizado de deuda

Escala: **P0** detiene operación o compromete datos; **P1** debe cerrarse antes de producción; **P2** debe entrar al roadmap próximo; **P3** mejora sostenible. No se observó un P0 demostrado, pero hay ocho P1.

| ID | Pri. | Área | Hallazgo y evidencia | Impacto | Remediación propuesta |
|---|---|---|---|---|---|
| DT-01 | P1 | Ingeniería / UX | Varias mutaciones ignoran `ApiResult`: verificación admin, archivo/borrado de fotos, aceptación/avance logístico, equipo y notificaciones (`apps/web/src/app/actions/*.ts`). | La UI redirige o revalida aunque la operación haya fallado; el usuario cree que cambió datos que siguen iguales. | Crear un wrapper de mutación que obligue a manejar `ok/error`; devolver estado visible y conservar formulario. Añadir tests de 401/403/409/500/red caída. |
| DT-02 | P1 | Arquitectura | No hay idempotency keys. La unicidad de “una oferta pendiente por thread” solo vive en código; `send_offer` no bloquea thread ni tiene índice parcial. Hay carreras similares en creación de thread/cotización. | Doble clic, reintento de red o concurrencia puede causar 500, duplicados o estados incompatibles. | Adoptar `Idempotency-Key` en publish/accept/shipment/resolve; tabla de requests o claves de negocio; constraints/índices y captura explícita de `IntegrityError`. |
| DT-03 | P1 | Arquitectura / Operación | El “outbox” es `Session.info` y se encola después del commit. Si Redis falla, `enqueue` registra y descarta (`notifications.py`, `tasks.py`). | Se confirma el negocio pero se pierde la notificación/email sin reintento durable ni reconciliación. | Outbox transaccional en PostgreSQL, dispatcher con estado/intentos, idempotencia y dead-letter/replay. |
| DT-04 | P1 | Ingeniería | El build descarga Google Fonts desde `next/font/google` (`layout.tsx`) y falló sin acceso a Google. | Builds no reproducibles; bloqueo de CI/deploy por dependencia externa no esencial. | Versionar/self-host WOFF2 con `next/font/local`; probar build con red restringida. |
| DT-05 | P1 | Calidad | El único E2E es un test monolítico de 206 líneas, solo Desktop Chrome y se omite por completo en CI sin secretos Clerk. | `main` puede quedar verde sin validar el flujo que define el producto; diagnóstico lento cuando falla. | Separar smoke público sin secretos, journeys por dominio y un happy path completo obligatorio en entorno controlado; añadir móvil y artefactos. |
| DT-06 | P1 | Product | No existe instrumentación de producto ni taxonomía de eventos, aunque se declaran North Star, funnels, retención y tiempos por rol. | No se puede demostrar PMF, detectar fuga del funnel ni priorizar por resultados. | Definir eventos/propiedades/identidad/consentimiento y dashboard: visita → registro → empresa → publicación/contacto → oferta → orden → entrega → repetición. |
| DT-07 | P1 | Product / UX | La landing presenta y ofrece “Registrar mi taller” para manufactura distribuida, funcionalidad “próximamente”, mientras el MVP documentado prioriza reciclables. | Mensaje de valor difuso, leads con expectativa incorrecta y expansión de alcance antes de validar liquidez. | Elegir posicionamiento del MVP; mover manufactura a waitlist medible o retirarla hasta tener señal. Un CTA primario por segmento. |
| DT-08 | P1 | Operación | README indica migraciones manuales antes de desplegar; no hay procedimiento expand/contract, rollback, backup/restore probado, RTO/RPO ni runbook. | Un cambio de esquema puede romper producción o prolongar una caída; riesgo de datos no cuantificado. | Pipeline de migración con aprobación, compatibilidad hacia atrás, backup/PITR verificado, dry-run y runbooks. |
| DT-09 | P2 | Arquitectura | Los servicios de aplicación importan modelos ORM/infraestructura directamente y se importan entre sí (`logistics`/`trust` dependen de `deals`; lógica de permisos se repite). | Límites de contexto débiles, ciclos conceptuales y pruebas más costosas. | No introducir microservicios; sí puertos/repositories mínimos, políticas compartidas y contratos de módulo. |
| DT-10 | P2 | Arquitectura | 30 `db.commit()` están distribuidos dentro de servicios. Los casos de uso controlan persistencia y side effects localmente. | Difícil componer operaciones atómicas, aplicar retries o garantizar invariantes transversales. | Unit of Work por caso de uso; servicios de dominio sin commit; commit único en frontera de aplicación. |
| DT-11 | P2 | Diseño | El dominio es principalmente enums y funciones; las máquinas de estado de oferta/orden/envío están implícitas en condicionales de varios módulos. | Transiciones difíciles de auditar; aumenta el riesgo de estados imposibles al crecer. | Diagramas de estado + tabla de transiciones; centralizar comandos/policies y tests de transición exhaustivos. |
| DT-12 | P2 | Escalabilidad | Threads, transacciones, mensajes, requests logísticos y varias listas admin no tienen paginación consistente; algunas están limitadas rígidamente a 100. | Tiempo/memoria crecen con actividad; historial truncado silenciosamente. | Cursor pagination estable, límites explícitos en contrato y UI incremental/virtualizada donde aplique. |
| DT-13 | P2 | Ingeniería | No hay tests unitarios/de componente web; el wizard de publicación tiene 751 líneas y concentra estado, persistencia local, compresión y UI. | Regresiones de formulario requieren E2E caro; alto costo de cambio. | Extraer schema/estado/compresión/pasos; Vitest + Testing Library para validación, draft, errores y navegación. |
| DT-14 | P2 | Ingeniería | No se mide cobertura ni mutation testing; 65 tests no permiten saber qué reglas/rutas quedan fuera. | Falsa confianza por conteo de tests. | Cobertura por rama con umbral inicial basado en baseline, luego elevar en dominio crítico; mutation tests selectivos en pricing/roles/estados. |
| DT-15 | P2 | Producto / Datos | KPIs mezclan ventanas: leads 30d con órdenes/revenue históricos; “empresa activa” solo cuenta empresas que enviaron mensajes; tasas son lifetime. | Decisiones de PM potencialmente erróneas por denominadores y cohortes inconsistentes. | Diccionario de métricas versionado: fórmula, ventana, timezone, población, exclusiones y owner; tests con datasets de frontera. |
| DT-16 | P2 | Análisis | C4 y blueprint son aspiracionales: incluyen componentes/entidades aún ausentes (Material, Document, Subscription, ESGReport) y guardrails no implantados. | La documentación no describe con precisión el sistema actual ni sus decisiones. | Separar “as-is” y “to-be”; actualizar diagramas desde código y mantener matriz capacidad → endpoint → tabla → evento → métrica. |
| DT-17 | P2 | Análisis / Gobierno | Se exige documentar decisiones con ADRs, pero no hay ADRs. Tampoco hay SLO/SLI, presupuestos de rendimiento o capacidad. | Decisiones se reabren y los NFR no son verificables. | ADRs para monolito, auth, storage, serverless, outbox e idempotencia; NFR cuantificados por journey. |
| DT-18 | P2 | Seguridad | La respuesta web observada no incluía CSP, `X-Content-Type-Options`, política de referrer ni frame protection; `next.config.ts` no configura headers. | Mayor superficie frente a XSS/clickjacking y menor defensa en profundidad. | Política de headers probada en CI; CSP compatible con Clerk y Sentry mediante nonces/allowlist mínima. |
| DT-19 | P2 | Supply chain | No hay Dependabot/Renovate, SAST, secret scanning definido en repo, SBOM ni gate de advisories. | Vulnerabilidades y dependencias obsoletas pueden permanecer invisibles. | Renovate/Dependabot, `npm audit`/OSV, `pip-audit`, Semgrep/CodeQL, Gitleaks y SBOM en release. |
| DT-20 | P2 | Resiliencia | `apiFetch` no define timeout/AbortSignal. Una conexión aceptada que no responde puede agotar Server Actions. | Latencia larga, workers ocupados y UX sin control. | Timeout por clase de operación, cancelación, retry solo para lecturas/idempotentes y request-id propagado. |
| DT-21 | P2 | Observabilidad | Hay JSON logs, request-id y Sentry opcional, pero no métricas/alertas, trazas end-to-end ni logging garantizado de excepciones. | Incidentes difíciles de detectar y correlacionar web → API → DB/worker. | OpenTelemetry o equivalente, métricas RED, colas/outbox, alertas y correlación de request/transaction IDs. |
| DT-22 | P2 | UX | El estado sin API en marketplace muestra solo “No pudimos conectar con el servidor”, sin retry, soporte ni contenido cacheado; en desktop deja gran área vacía. | Abandono ante fallos transitorios y poca guía de recuperación. | Estado de error accionable con reintento, status page/contacto, conservación de filtros y último resultado seguro. |
| DT-23 | P2 | UX / Producto | La landing móvil es clara pero muy larga; contenido futuro, cadena, pasos, roles y categorías compiten antes de la conversión. | Dilución del CTA y carga cognitiva para usuarios operativos móviles. | Test A/B cualitativo/cuantitativo de landing corta por rol; mover detalle secundario después de prueba social/confianza. |
| DT-24 | P2 | Accesibilidad | La muestra Axe pasó, pero no hay gate de accesibilidad, pruebas de teclado/screen reader ni `prefers-reduced-motion`. Los errores de `Field` no tienen `aria-describedby`. | Regresiones no detectadas y feedback de formulario menos claro para tecnología asistiva. | Axe en Playwright, pruebas de teclado, IDs de ayuda/error, anuncios de carga y política de movimiento reducido. |
| DT-25 | P2 | Operación / Contenedores | Dockerfile corre como root, usa tags mutables (`python:3.13-slim`, `uv:0.11`) y no declara healthcheck. | Menor reproducibilidad y hardening. | Pin por digest/versión, usuario no root, imagen multi-stage/minimal, healthcheck y escaneo de imagen. |
| DT-26 | P3 | Mantenibilidad | Hay funciones con 6–10 argumentos, páginas grandes (`admin`, `marketplace`, `orden`) y helpers repetidos (`token`, `text`, `_company_ids`). | Fricción creciente y cambios inconsistentes. | Value objects/command DTOs, módulos por feature y utilidades compartidas pequeñas, sin crear abstracciones genéricas prematuras. |

## 4. Auditoría por disciplina

### 4.1 Arquitectura de software

**Fortalezas**

- La decisión de monolito modular es correcta para el MVP; evita microservicios prematuros.
- Separación visible en `domain`, `application`, `infrastructure` y `presentation`.
- PostgreSQL, Redis, storage externo y worker tienen adapters explícitos.
- Buenas decisiones puntuales: locks para aceptar ofertas, términos de transacción copiados como snapshot, auditoría, validación de JWT/`azp`, búsquedas con trigramas y contratos OpenAPI.

**Deuda principal**

- La separación es nominal más que arquitectónicamente forzada: application conoce ORM y servicios externos.
- `deals.py` concentra chat, ofertas, órdenes, disputas indirectas y locking; se vuelve contexto central acoplado.
- No hay frontera transaccional uniforme ni outbox durable.
- Los eventos del blueprint son una lista documental, no un modelo de integración/auditoría/product analytics.
- No existe versionado de API ni política de compatibilidad para consumidores futuros.

**Objetivo recomendado**

Mantener el monolito y endurecer sus límites. Un “modular monolith con contratos” aporta más valor ahora que DDD ceremonial o microservicios.

### 4.2 Ingeniería de software

**Fortalezas**

- CI ejecuta lint, formato, migraciones, tests, build y sincronización de OpenAPI.
- `uv.lock` y `package-lock.json` favorecen reproducibilidad.
- El backend contiene pruebas de autorización, concurrencia de aceptación, logística, trust, equipo, admin y métricas.
- Manejo de imágenes limita cantidad/tamaño y valida magic bytes.
- Tipado TypeScript estricto y tipos generados desde API reducen drift.

**Deuda principal**

- Gate E2E condicional, sin frontend unit/component tests y sin cobertura.
- Server Actions inconsistentes al propagar errores.
- Builds dependientes de red; setup local depende demasiado de conocimiento implícito/Docker.
- No hay gobierno de repositorio (`CONTRIBUTING`, `CODEOWNERS`, `SECURITY`, plantilla de PR) ni automatización de dependencias.
- No hay pruebas de carga, resiliencia, migración/rollback ni restore.

### 4.3 Análisis y diseño de software

**Fortalezas**

- Existe contexto C4, mapa de contenedores/componentes, dominio inicial y criterios de aceptación macro.
- El modelo refleja los actores B2B y el flujo principal.
- La API y las migraciones permiten reconstruir buena parte del diseño real.

**Deuda principal**

- Faltan diagramas de secuencia de los journeys críticos y modelos de estados con invariantes.
- No existe catálogo de errores/estados HTTP ni decisiones de retry/idempotencia.
- Criterios de aceptación no están trazados a tests individuales.
- Documentación `to-be` parece `as-is`, lo que genera falsas expectativas.
- No hay modelo explícito de privacidad/retención para mensajes, direcciones, NIT, disputas y auditoría.

### 4.4 Diseño UX/UI

**Fortalezas**

- Sistema visual consistente: tokens, jerarquía clara, contraste y estados de foco.
- Responsive real sin overflow en la muestra; filtros colapsan en móvil.
- HTML semántico razonable, labels, `aria-live`, estados y navegación activa.
- Axe no encontró violaciones A/AA en las páginas públicas revisadas.
- El wizard guarda draft local y comprime imágenes en cliente.

**Deuda principal**

- La UX transaccional no siempre refleja fallos reales por errores ignorados.
- Estados degradados son correctos pero poco accionables.
- Falta validación accesible continua y pruebas con usuarios por rol/contexto operativo.
- El contenido móvil es extenso y mezcla presente/futuro.
- No existe evidencia de design research, usability testing ni métricas de tarea.

### 4.5 Product Management

**Fortalezas**

- Tesis vertical clara y correcta prioridad de liquidez, confianza y cierre operativo.
- North Star orientada a impacto real (toneladas reutilizadas).
- Métricas por rol y riesgos iniciales bien identificados.
- Scope por fases evita, en documento, saltar de inmediato a inteligencia/ESG.

**Deuda principal**

- Las “assumptions” no tienen plan de validación, evidencia, umbral ni fecha de decisión.
- No hay ICP priorizado por ciudad/vertical/tamaño, estrategia de cold start o marketplace liquidity playbook.
- Monetización, take rate/suscripción, pagos fuera de plataforma y prevención de desintermediación quedan abiertos.
- Roadmap es una lista de features, no outcomes con owners, dependencias, capacidad y kill criteria.
- No hay instrumentación; el PM no puede gobernar con los KPIs declarados.
- Falta definir operación humana de trust & safety, SLA de disputas y costo de soporte.

## 5. Riesgos de negocio derivados de la deuda

| Riesgo | Prob. | Impacto | Señal temprana |
|---|---:|---:|---|
| Usuario cree que aceptó/archivó/cambió algo, pero la API falló | Alta | Alto | Repetición de acción, tickets, estados inconsistentes |
| Pérdida silenciosa de notificaciones | Media | Alto | Órdenes sin respuesta, quejas de “nunca me avisó” |
| CI verde sin validar el journey comercial | Alta | Alto | Fallos después de deploy en auth/logística |
| Incapacidad de medir liquidez/retención | Alta | Alto | Roadmap guiado por opinión y volumen de features |
| Mensaje de mercado confuso por manufactura futura | Media | Medio/alto | Conversión baja y registros no activables |
| Migración/rollback defectuoso | Media | Muy alto | Deploy bloqueado, incompatibilidad entre web/API/schema |
| Degradación al crecer historial y mensajes | Media | Medio | p95 creciente, timeouts y páginas pesadas |
| Dependencia vulnerable no detectada | Media | Alto | Advisory tardío o incidente de supply chain |

## 6. Plan de remediación 90 días

### Días 0–15: proteger operación y confianza

1. Corregir DT-01: ninguna mutación puede redirigir/revalidar sin comprobar resultado.
2. Self-host de fuentes y build reproducible.
3. Timeout/cancelación en `apiFetch`, request-id web → API y estados de error accionables.
4. Headers de seguridad y escaneo básico de dependencias/secrets.
5. Definir procedimiento de migración/rollback y comprobar restore en staging.
6. Crear smoke público obligatorio y hacer visible si el E2E completo fue “passed” o “skipped”.

**Criterio de salida:** build y smoke reproducibles; fallos 4xx/5xx/red visibles; rollback/restore documentado y ensayado.

### Días 16–30: integridad transaccional y medición

1. Idempotencia y constraints para aceptar oferta, crear shipment, cotizar, publicar y resolver disputa.
2. Outbox PostgreSQL durable con retries y métricas.
3. Taxonomía de analytics y primer funnel; instrumentar North Star y activación por rol.
4. Diccionario de métricas y corrección de ventanas/denominadores.
5. Decisión de foco: reciclables vs. waitlist de manufactura.

**Criterio de salida:** reintentos no duplican efectos; notificaciones pueden reejecutarse; funnel básico observable de punta a punta.

### Días 31–60: reducir costo de cambio

1. Unit of Work y transacciones en fronteras de caso de uso.
2. Extraer el wizard en schema/estado/pasos/media; añadir pruebas unitarias y de componente.
3. Formalizar máquinas de estado y tests exhaustivos.
4. Paginación cursor-based para conversaciones, órdenes, logística y admin.
5. ADRs y documentación `as-is`/`to-be`.

**Criterio de salida:** módulos críticos componibles, cobertura de reglas visible y listas estables con datos voluminosos.

### Días 61–90: preparación operativa y aprendizaje

1. SLO/SLI, alertas, trazas y runbooks de incidentes.
2. Pruebas de carga sobre búsqueda, thread, dashboard y aceptación concurrente.
3. Journey móvil y accesibilidad en CI; sesiones de usabilidad con los tres roles.
4. ICP/cold-start/monetización y roadmap por outcomes con kill criteria.
5. Hardening de contenedores y supply chain/SBOM.

**Criterio de salida:** readiness review con evidencia técnica, operativa y de producto, no solo checklist de features.

## 7. Backlog recomendado por owner

| Owner principal | Próximos entregables |
|---|---|
| Tech Lead | Idempotencia, UoW, outbox, ADRs, estrategia de migración |
| Backend | Constraints/races, paginación, outbox, métricas operativas |
| Frontend | Manejo uniforme de errores, timeout, modularización del wizard, headers |
| QA | Matriz por rol/estado, smoke obligatorio, móvil/a11y, cobertura y concurrencia |
| Product | ICP, foco del MVP, taxonomía de eventos, diccionario de métricas, monetización |
| UX Research/Design | Tests de tareas móviles, landing, degradación/errores, trust signals |
| Platform/DevOps | Restore, SLO, alertas, supply chain, imágenes endurecidas |

## 8. Definition of Done propuesta

Una capacidad no debería considerarse terminada hasta que:

- tiene criterio de aceptación y evento/métrica si cambia comportamiento de producto;
- maneja éxito, validación, autorización, conflicto, timeout y dependencia caída;
- es idempotente cuando el usuario o la red pueden reintentar;
- tiene pruebas en la capa adecuada y trazabilidad criterio → test;
- incluye migración compatible y rollback si toca datos;
- cumple teclado, semántica, contraste y anuncios accesibles;
- emite logs/métricas correlacionables sin PII innecesaria;
- actualiza documentación `as-is`, contrato y runbook relevante;
- pasa lint, tipos, formato, tests, build, seguridad y smoke obligatorios.

## 9. Decisiones que requieren Product + Tecnología

1. ¿RexFy es, durante los próximos 6–12 meses, un marketplace de reciclables o una red más amplia de manufactura? La landing y el roadmap hoy responden distinto.
2. ¿Qué acción define activación por rol y en cuánto tiempo debe ocurrir?
3. ¿Qué nivel de garantía comercial ofrece RexFy si no procesa pagos?
4. ¿Qué datos y documentos son necesarios para confianza sin elevar demasiado la fricción de onboarding?
5. ¿Qué SLA se promete para verificación, disputa y soporte?
6. ¿Qué volumen/latencia/disponibilidad definen “listo para producción”?

## 10. Conclusión

La deuda de RexFy es recuperable y, en gran parte, normal para un MVP construido rápidamente. La arquitectura macro no necesita ser reemplazada. El mayor retorno viene de endurecer los límites transaccionales, hacer visibles los fallos, convertir notificaciones en un proceso durable y conectar el producto a telemetría real. Después de eso, modularizar y escalar será una evolución controlada, no una reescritura.
