# EP-06 — Producto medible y enfocado

**Estado:** implementación técnica terminada; validación con usuarios pendiente  
**Owner:** Product Owner  
**Revisión de la decisión:** 22 de febrero de 2027

## 1. Decisión de foco del MVP

RexFy es, durante el horizonte actual, un mercado B2B de materiales recuperados en Colombia.
Conecta empresas generadoras, compradores que usan esos materiales como insumo y
transportadores que movilizan las órdenes. El recorrido prometido es publicación → contacto →
oferta → orden → transporte → entrega.

La manufactura distribuida queda fuera del MVP. No se presenta como producto disponible, no
tiene CTA y no consume capacidad de desarrollo. Se reconsiderará cuando coincidan estas señales:

- al menos 20 empresas activas entre generadores y compradores en una ventana de 30 días;
- al menos 10 órdenes completadas por mes durante dos meses;
- cinco entrevistas con talleres que demuestren un problema repetido no resuelto por el mercado
  de materiales;
- un responsable y una métrica de éxito para el experimento de manufactura.

La evidencia actual para esta decisión es el producto implementado: todos los casos críticos,
modelos y journeys operan sobre materiales recuperados. La manufactura solo aparecía como una
promesa futura en la landing y generaba una expectativa que el sistema no podía cumplir.

## 2. Taxonomía de eventos

Los eventos son first-party, se guardan en PostgreSQL y se confirman en la misma transacción que
el cambio de negocio. No dependen de cookies, fingerprinting ni un proveedor externo. La tabla
`product_events` es append-only desde la aplicación.

| Evento | Momento | Entidad | Rol contextual | Owner |
| --- | --- | --- | --- | --- |
| `user.registered` | Primera cuenta local creada | User | `unassigned` | Growth |
| `company.created` | Empresa y owner confirmados | Company | un evento por rol de mercado | Activation |
| `listing.published` | Material visible en marketplace | Listing | `generator` | Supply |
| `contact.started` | Primer thread comprador-publicación | Thread | `buyer` | Demand |
| `offer.sent` | Oferta formal confirmada | Offer | `buyer` o `generator` | Marketplace |
| `order.created` | Oferta aceptada y orden creada | Transaction | rol que acepta | Marketplace |
| `shipment.delivered` | Transportador marca entrega | Shipment | `transporter` | Logistics |

Todos los eventos incluyen nombre, `schema_version`, actor, empresa contextual cuando existe,
rol, timestamp UTC, tipo e ID de entidad, ciudad, categoría, cohorte mensual y propiedades
permitidas. Registro usa `unassigned` porque ocurre antes de crear una empresa.

No se permiten email, nombre, NIT, teléfono, dirección, mensajes ni notas. Los IDs internos se
usan para reconciliación y no salen del dashboard administrativo. Los segmentos con menos de tres
eventos no se muestran. Este tratamiento first-party es necesario para operar y mejorar el flujo;
si en el futuro se incorpora analytics de terceros, Marketing y Legal deberán aprobar propósito,
retención, consentimiento y contrato antes de activarlo.

## 3. Funnel principal

Ventana móvil: 30 días. Zona horaria: UTC. Cada paso cuenta entidades únicas, no requests, para
que reintentos e idempotencia no inflen el resultado.

| Paso | Numerador | Conversión |
| --- | --- | --- |
| Registro | usuarios con `user.registered` | Inicio |
| Empresa | empresas con `company.created` | empresas / registros |
| Activación | listings o threads con `listing.published` o `contact.started` | activaciones / empresas |
| Oferta | ofertas únicas con `offer.sent` | ofertas / activaciones |
| Orden | órdenes únicas con `order.created` | órdenes / ofertas |
| Entrega | envíos únicos con `shipment.delivered` | entregas / órdenes |

El endpoint `/admin/funnel` acepta filtros por rol, ciudad, categoría y cohorte. El dashboard
muestra los pasos y publica segmentos únicamente cuando superan el umbral de privacidad. QA
reconcilia una orden con sus eventos mediante los IDs de las entidades.

## 4. Diccionario de KPIs

| KPI | Fórmula y denominador | Ventana | Timezone | Owner |
| --- | --- | --- | --- | --- |
| Toneladas reutilizadas | suma de cantidad normalizada a toneladas de órdenes `completed` | acumulado | UTC | Product |
| GMV | suma de `transaction.total` de órdenes creadas | 30 días | UTC | Marketplace |
| Órdenes | conteo de órdenes creadas | 30 días | UTC | Marketplace |
| Tasa completada | órdenes creadas en ventana con estado `completed` / órdenes creadas en ventana | 30 días | UTC | Operations |
| Publicaciones nuevas | listings con `published_at` en ventana | 30 días | UTC | Supply |
| Empresas activas | empresas distintas con al menos un evento de producto | 30 días | UTC | Growth |
| Attach logístico | órdenes creadas en ventana con shipment / órdenes creadas en ventana | 30 días | UTC | Logistics |
| Tasa de disputa | órdenes creadas en ventana con disputa / órdenes creadas en ventana | 30 días | UTC | Trust |
| Resolución de disputa | promedio `resolved_at - created_at` para disputas resueltas | acumulado | UTC | Trust |
| Empresas por verificar | empresas con `is_verified = false` | estado actual | UTC | Trust |
| Disputas abiertas | disputas con estado `open` | estado actual | UTC | Trust |

KPIs por empresa:

| Rol / KPI | Fórmula y denominador | Ventana | Timezone | Owner |
| --- | --- | --- | --- | --- |
| Generador / publicaciones activas | listings `published` de la empresa | estado actual | UTC | Supply |
| Generador / leads | threads recibidos | 30 días | UTC | Demand |
| Generador / primera respuesta | promedio entre primer mensaje comprador y primera respuesta | 30 días | UTC | Success |
| Generador / órdenes, toneladas e ingreso | conteo y sumas sobre órdenes vendidas | acumulado | UTC | Marketplace |
| Comprador / negociaciones abiertas | threads sin orden asociada | estado actual | UTC | Demand |
| Comprador / órdenes, toneladas y gasto | conteo y sumas sobre órdenes compradas | acumulado | UTC | Marketplace |
| Comprador / tiempo para asegurar | promedio entre primer contacto y orden | acumulado | UTC | Marketplace |
| Transportador / cotizaciones | cotizaciones enviadas y aceptadas | acumulado | UTC | Logistics |
| Transportador / win rate | cotizaciones aceptadas / cotizaciones enviadas | acumulado | UTC | Logistics |
| Transportador / viajes | shipments activos y entregados | estado actual / acumulado | UTC | Logistics |

Un denominador cero se representa como `null`, nunca como 0 %. Las pruebas de dashboard fijan
GMV, toneladas, tasas y KPIs por rol en `test_dashboard.py`; `test_analytics.py` fija ventana,
timezone, filtros, privacidad y reconciliación del funnel; `test_logistics.py` verifica entrega.

## 5. Protocolo de validación UX

SP-02 no se cierra sin participantes reales. La primera ronda requiere una persona de cada rol:
generador, comprador y transportador. En móvil, cada participante deberá completar su tarea sin
instrucciones del moderador:

1. generador: crear empresa y publicar PET;
2. comprador: encontrar PET, contactar y aceptar una oferta;
3. transportador: encontrar solicitud, cotizar y actualizar una entrega.

Registrar éxito, tiempo, errores, retrocesos, comprensión de la propuesta y expectativa sobre lo
que RexFy ofrece hoy. No guardar datos personales en analytics. Cada hallazgo debe convertirse en
una decisión: corregir ahora, incorporar al backlog con owner/prioridad, o descartar con razón.

La evidencia mínima será fecha, perfil anonimizado, dispositivo, tarea, resultado y enlace al PBI.
Hasta completar las tres sesiones, EP-06 permanece **en validación** aunque su instrumentación y
su landing estén implementadas.
