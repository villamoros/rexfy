# LEG-AUD-001 — Auditoría jurídica inicial

| Campo | Valor |
|---|---|
| Versión | 0.1 |
| Fecha de corte | 24 de noviembre de 2026 |
| Estado | Borrador para revisión jurídica, tributaria y ambiental |
| Alcance | Marketplace B2B de materiales recuperados en Colombia |
| Exclusiones | No es concepto legal, tributario, contable ni ambiental definitivo |

## 1. Resumen ejecutivo

RexFy puede estructurarse como una plataforma tecnológica B2B de intermediación, pero la calificación jurídica no depende del nombre usado en los términos sino de lo que efectivamente haga. Publicar ofertas, facilitar mensajería y aportar trazabilidad se acerca a servicios tecnológicos y, según la operación, al corretaje. Negociar, facturar, recaudar, disponer del dinero, contratar transporte o decidir sobre la conformidad del material puede introducir mandato, representación, obligaciones propias o responsabilidades adicionales.

No se recomienda lanzar contratación real hasta cerrar cinco bloqueos:

1. **PENDIENTE — Identidad del operador:** razón social, NIT, domicilio, matrícula, RUT, actividad económica, responsables y canales formales.
2. **PENDIENTE — Modelo contractual y tributario:** definir por flujo si RexFy solo conecta, actúa como corredor, recibe mandato o contrata por cuenta propia.
3. **PENDIENTE — Flujo de dinero:** seleccionar un proveedor regulado/capaz, validar recaudo, dispersión, reversos, conciliación, custodia y evidencia; no presentar el saldo como depósito o *escrow* sin soporte.
4. **OBLIGATORIO/CONDICIONAL — Admisión de materiales:** bloquear materiales ilegales o peligrosos y exigir soportes según tipo, origen, estado, destino y rol regulado.
5. **OBLIGATORIO — Datos y evidencia:** implantar privacidad, seguridad, versiones contractuales, aceptación demostrable y conservación de la transacción.

## 2. Hechos asumidos y límites

La auditoría parte de estas hipótesis, que deben validarse:

- La primera versión opera en Colombia y entre empresas.
- RexFy no compra ni toma propiedad de los materiales por defecto.
- Generador/vendedor y comprador negocian cantidad, calidad, precio y entrega.
- Puede intervenir un transportador independiente.
- Se ha propuesto una comisión comercial del 10 %, pero su base, causación, impuestos, ajustes y pagador no están definidos definitivamente.
- Se estudia usar un tercero para recaudo y dispersión; RexFy no debería custodiar recursos de usuarios.
- El catálogo puede incluir plástico, papel/cartón, metal/chatarra, madera, vidrio, textiles, RAEE y subproductos agroindustriales.
- No se ha probado que el operador esté sometido a SAGRILAFT ni que sea gestor ambiental, transportador o productor obligado por responsabilidad extendida.

Todo hecho no acreditado se trata como **PENDIENTE**, no como autorización.

## 3. Auditoría de afirmaciones y decisiones

| # | Afirmación o decisión | Estado | Resultado de auditoría y acción |
|---|---|---|---|
| 1 | “RexFy es solo un marketplace” | **CONDICIONAL** | La etiqueta no controla la realidad. Limitar facultades en producto y contratos; documentar quién oferta, acepta, factura, cobra, entrega y responde. |
| 2 | “La relación siempre es corretaje” | **CONDICIONAL** | El artículo 1340 del Código de Comercio describe al corredor sin mandato ni representación. Si RexFy actúa por cuenta de una parte, puede existir mandato u otra relación. Modelar por flujo. |
| 3 | “Un mandato general cubre toda la plataforma” | **NO RECOMENDADO** | El mandato implica ejecutar actos de comercio por cuenta de otro y tiene límites. Usarlo solo mediante anexo expreso, facultades concretas y trazabilidad de instrucciones. |
| 4 | “La plataforma nunca responde por la operación” | **INCORRECTO COMO REGLA ABSOLUTA** | Las exclusiones no borran obligaciones propias, promesas, fallas de seguridad ni actos ejecutados por RexFy. Redactar responsabilidades por control y conducta reales. |
| 5 | “La comisión es 10 % del negocio” | **PENDIENTE** | Falta definir causación, pagador, base antes/después de ajustes, IVA, transporte, retenciones, pasarela, notas y cancelaciones. No mostrar un “neto 90 %” universal. |
| 6 | “RexFy puede retener el dinero 48 horas” | **PENDIENTE/ALTO RIESGO** | Un plazo comercial no autoriza custodia. Validar arquitectura y contrato con proveedor de pagos, titularidad de fondos, dispersión, reversos y régimen aplicable. |
| 7 | “Un split de pagos resuelve toda la regulación” | **INCORRECTO** | La capacidad técnica no sustituye análisis contractual, financiero, tributario, antifraude, conciliación ni manejo de devoluciones. Exigir dictamen y documentación del proveedor. |
| 8 | “El vendedor siempre factura el valor total y RexFy solo su comisión” | **CONDICIONAL** | Puede ser coherente con intermediación simple; en mandato, el artículo 1.6.1.4.9 del Decreto 1625 de 2016 contiene reglas particulares de facturación y certificación. Diseñar cada flujo con asesor tributario. |
| 9 | “El 10 % se descuenta sin documento adicional” | **INCORRECTO/INCOMPLETO** | Debe existir aceptación previa, liquidación trazable, factura/documento que corresponda, tratamiento de IVA y retenciones, y reglas de notas o reversos. |
| 10 | “Toda chatarra tiene retención de IVA del 100 %” | **INCORRECTO** | El artículo 437-4 aplica a chatarra de partidas 72.04, 74.04 y 76.02 cuando se vende a siderúrgicas. Requiere clasificación y rol del comprador. El 437-5 regula tabaco, no chatarra. |
| 11 | “Todo RAEE necesita la misma licencia” | **INCORRECTO** | Ley 1672 y Resolución 851 de 2022 diferencian productores/importadores, comercializadores, consumidores y gestores. Exigir el soporte del rol y actividad, no una licencia genérica a todos. |
| 12 | “Todo empaque exige certificado de aprovechamiento” | **INCORRECTO COMO REGLA UNIVERSAL** | La Resolución 1407 de 2018 se centra en obligaciones de productores dentro de planes de gestión. Verificar rol, material, plan y evidencia concreta. |
| 13 | “Toda madera reutilizada exige salvoconducto” | **INCORRECTO COMO REGLA UNIVERSAL** | El régimen forestal depende de origen, producto, primera movilización y autorización. Exigir origen lícito y aplicar documento específico cuando corresponda. |
| 14 | “Todos los subproductos agroindustriales se pueden comercializar igual” | **INCORRECTO** | El uso previsto cambia el régimen: alimentación animal puede involucrar ICA; alimentos para consumo humano, INVIMA; otros usos tienen riesgos diferentes. El destino debe ser obligatorio. |
| 15 | “Los textiles requieren certificado de destrucción en todos los casos” | **NO ACREDITADO** | Puede ser requisito contractual o de marca, no una obligación universal identificada. Marcar como condicional y validar propiedad intelectual, confidencialidad, seguridad y disposición. |
| 16 | “Una tolerancia fija de pesaje sirve para todos” | **INCORRECTO** | Instrumentos usados en transacciones pueden estar sometidos a control metrológico. Separar precisión legal/técnica del instrumento y tolerancia comercial acordada por material. |
| 17 | “La Ley 1581 no aplica porque es B2B” | **INCORRECTO** | Los datos de personas naturales —usuarios, representantes y contactos— pueden ser personales aunque estén en contexto empresarial. Inventariar finalidades y bases; implementar derechos y seguridad. |
| 18 | “SAGRILAFT aplica automáticamente al marketplace” | **INCORRECTO** | La aplicabilidad depende de supervisión, sector, ingresos/activos y supuestos vigentes. La regulación societaria fue actualizada en 2026; obtener concepto con hechos del operador. |
| 19 | “Arbitraje obligatorio es siempre la mejor salida” | **NO RECOMENDADO COMO REGLA ÚNICA** | Requiere pacto y materia arbitrable; puede ser desproporcionado para montos bajos. Usar ruta escalonada y reservarlo para operaciones/segmentos adecuados. |
| 20 | “Por ser B2B nunca aplica el Estatuto del Consumidor” | **CONDICIONAL** | La relación empresarial no elimina automáticamente todo supuesto de consumidor. Antes de admitir personas naturales o uso como destinatario final, activar revisión y controles B2C. |
| 21 | “Un clic basta para cualquier contrato” | **INCOMPLETO** | La Ley 527 reconoce mensajes de datos, pero se necesita atribución, acceso al texto, integridad, conservación, incorporación clara de anexos y prueba de aceptación. |
| 22 | “El transportador es solo un usuario más” | **CONDICIONAL** | Si ofrece transporte debe demostrar identidad, capacidad, seguros y requisitos aplicables. RexFy no debe presentarlo como validado sin definir y ejecutar el estándar de validación. |

## 4. Modelo relacional recomendado para la primera versión

### 4.1 Regla base

**RECOMENDADO:** servicio tecnológico + intermediación B2B. RexFy facilita descubrimiento, comunicación, evidencia y coordinación; vendedor y comprador celebran la compraventa. El transportador celebra un servicio separado con la parte identificada en la orden.

### 4.2 Cuándo aparece otra figura

| Conducta de RexFy | Posible consecuencia | Control |
|---|---|---|
| Solo muestra ofertas y conecta | Servicio tecnológico; posible corretaje según conducta y remuneración | Definir alcance, comisión y ausencia de representación |
| Acepta o negocia por una parte | Mandato/representación o responsabilidad propia | Anexo de mandato, facultades, límites e instrucciones |
| Emite documento por cuenta de tercero | Reglas tributarias de mandato/facturación | Flujo separado y validación contable |
| Recibe y decide sobre fondos | Riesgo contractual, financiero y de custodia | Tercero idóneo, sin control discrecional de RexFy |
| Compra y revende material | RexFy puede ser comerciante vendedor/comprador | No habilitar sin rediseño integral |
| Almacena, trata o dispone residuos | Posible rol ambiental operativo | No habilitar sin permisos y operación aprobada |
| Selecciona/contrata al transportador en nombre propio | Obligaciones logísticas propias | Contrato, seguros y responsabilidades específicos |

## 5. Clasificación inicial de materiales

Esta matriz es una compuerta de producto, no una autorización ambiental.

### 5.1 Permitidos en flujo ordinario, sujetos a verificación

- Plástico, papel/cartón, vidrio y metales no peligrosos, limpios y trazables.
- Madera reutilizada con origen lícito y sin tratamiento/contaminación de riesgo acreditada.
- Textiles no contaminados y cuya venta no vulnere propiedad, marca, secreto o destrucción pactada.

**OBLIGATORIO:** descripción, fotografías, cantidad, unidad, ubicación, titular/origen declarado, contaminación, ficha o especificación, destino previsto y aceptación del comprador.

### 5.2 Condicionados

| Material/condición | Control mínimo antes de publicar o cerrar |
|---|---|
| RAEE | Rol del oferente, categoría, estado, datos borrados cuando aplique, destino y gestor/sistema autorizado según actividad |
| Chatarra metálica | Origen, clasificación, partida cuando sea relevante, comprador, alertas de bienes robados y regla tributaria específica |
| Madera/producto forestal | Especie/producto, procedencia, documento de movilización o aprovechamiento cuando aplique |
| Subproducto agroindustrial | Uso previsto; inocuidad, contaminantes y permisos/registro ICA o INVIMA si el destino lo exige |
| Envases/embalajes contaminados | Sustancia previa, descontaminación, ficha de seguridad y clasificación como peligroso/no peligroso |
| Baterías, aceites, químicos, luminarias y similares | Flujo especializado; no publicar hasta verificar régimen posconsumo/peligroso y gestores habilitados |
| Textil con marca o información sensible | Autorización, desmarcado/destrucción y evidencia según contrato/origen |

### 5.3 Prohibidos en la primera versión

- Material de origen ilícito, hurtado o sin trazabilidad mínima.
- Residuos hospitalarios, explosivos, radiactivos o peligrosos sin un flujo especializado aprobado.
- Sustancias o bienes cuya comercialización esté prohibida o reservada.
- Material que contenga datos, secretos, activos de marca o elementos de seguridad sin saneamiento/autorización.
- Publicaciones que oculten contaminación, falsifiquen permisos o promuevan disposición ilegal.

## 6. Pagos, comisión y facturación

### 6.1 Recomendación de lanzamiento

**RECOMENDADO:** durante el piloto, usar un proveedor de pagos seleccionado después de una revisión contractual/técnica que permita pago y dispersión sin que RexFy custodie recursos. Si esa capacidad no está demostrada, mantener pago entre las partes y facturar únicamente el servicio efectivamente prestado por RexFy.

**PROHIBIDO HASTA VALIDACIÓN:** denominar el flujo “cuenta de depósito”, “fiducia”, “escrow”, “dinero protegido por RexFy” o prometer liberación garantizada si el contrato y el proveedor no lo soportan.

### 6.2 Fórmula por definir

La interfaz y liquidación deben separar:

1. valor bruto de material aceptado;
2. ajuste por peso/calidad acordado y evidenciado;
3. base de la comisión según contrato;
4. comisión de RexFy;
5. IVA de la comisión, si corresponde;
6. IVA/retenciones del material según sujeto, bien y operación;
7. transporte;
8. tarifa de proveedor de pago;
9. notas, devolución, reverso o compensación;
10. neto pagadero y responsable de cada factura/documento.

La comisión no debe aplicarse a impuestos, transporte o costos trasladados salvo pacto claro y revisión tributaria.

### 6.3 Chatarra: corrección especial

El artículo 437-4 del Estatuto Tributario no convierte toda operación de metal en una retención del 100 %. La regla verificada se refiere al IVA de chatarra en partidas 72.04, 74.04 y 76.02 vendida a siderúrgicas, que es retenido por la siderúrgica. El artículo 437-5 corresponde a tabaco. El producto debe pedir los datos necesarios para determinar el supuesto y dejar el cálculo final al motor/regla aprobada por asesor tributario.

## 7. Pesaje, calidad, entrega y transporte

**OBLIGATORIO/CONDICIONAL:** cuando el precio dependa del peso, conservar:

- instrumento, propietario/operador, ubicación y fecha;
- identificación o serial cuando exista;
- evidencia de control metrológico aplicable;
- peso bruto, tara, neto, unidad y comprobante;
- muestras/fotos y criterios de humedad, contaminación o calidad;
- tolerancia comercial previamente aceptada, distinta de la precisión del equipo;
- plazo y mecanismo de objeción;
- versión original y cualquier ajuste, sin sobrescritura silenciosa.

El cierre debe identificar quién entrega, recibe, asume cargue/descargue, riesgo, seguros, daños, tiempos y costo. Evitar usar Incoterms de forma improvisada en operaciones nacionales; definir reglas propias y claras.

## 8. Privacidad, seguridad y evidencia digital

**OBLIGATORIO:** antes del lanzamiento comercial:

- identificar responsable y encargados del tratamiento;
- inventariar datos, finalidades, bases y destinatarios;
- publicar política y avisos, y capturar autorización cuando sea necesaria;
- habilitar consultas, actualización, supresión y reclamos;
- fijar conservación y eliminación por categoría;
- contratar encargados con instrucciones, seguridad, subencargados e incidentes;
- proteger credenciales, documentos ambientales, bancarios y de identidad;
- definir respuesta a incidentes y preservar evidencia;
- separar comunicaciones transaccionales y comerciales;
- evitar exponer datos de contacto sin necesidad.

**OBLIGATORIO para aceptaciones:** conservar ID de usuario/empresa, capacidad/rol, documento y versión, fecha/hora, acción afirmativa, operación, anexos incorporados, hash o mecanismo de integridad, y registro técnico proporcionado. La IP por sí sola no demuestra identidad ni voluntad.

## 9. Debida diligencia y prevención de fraude

Aunque SAGRILAFT no sea aplicable al operador, se recomienda un programa proporcional:

- identidad y existencia de empresa;
- representación/capacidad del usuario;
- titularidad de cuenta o beneficiario de pago;
- origen y titularidad declarada del material;
- listas/sanciones y PEP bajo criterio aprobado;
- señales de chatarra robada, documentos alterados, precios anómalos y cuentas de terceros;
- debida diligencia reforzada por material, cuantía, jurisdicción o conducta;
- suspensión, reporte interno, conservación y revisión humana;
- no afirmar “verificado” sin indicar alcance y fecha.

**PENDIENTE:** determinar con los datos reales del operador si aplica el sistema integral de prevención administrado por Supersociedades y su transición 2026–2027.

## 10. Controversias y reclamaciones

Ruta recomendada:

1. negociación entre comprador y vendedor con expediente inalterable;
2. soporte de RexFy sobre funcionamiento y evidencia de plataforma;
3. conciliación cuando sea pertinente;
4. arbitraje si hay pacto escrito, materia arbitrable y proporcionalidad;
5. jurisdicción competente en los demás casos.

RexFy no debe decidir como perito la calidad del material si no ha asumido ese rol. Puede facilitar evidencia, congelar acciones de plataforma y aplicar sus reglas de uso, diferenciando esto de resolver la compraventa.

## 11. Registro de riesgos

| Riesgo | Probabilidad | Impacto | Tratamiento inicial |
|---|---:|---:|---|
| RexFy actúa distinto a lo declarado | Alta | Alto | Matriz de facultades y pruebas end-to-end |
| Custodia/recaudo sin estructura aprobada | Media | Crítico | Proveedor y concepto previo; no activar fondos retenidos |
| Facturación/retención incorrecta | Alta | Alto | Diseño por flujo y motor tributario validado |
| Material peligroso o ilícito | Media | Crítico | Taxonomía, bloqueo, soportes y revisión humana |
| RAEE gestionado por actor no habilitado | Media | Alto | Verificación por rol/actividad y destino |
| Fraude de identidad/origen | Alta | Alto | KYB proporcional, titularidad y señales de riesgo |
| Fuga de datos/documentos | Media | Alto | Minimización, acceso, cifrado, registro e incidentes |
| Peso/calidad disputados | Alta | Medio/alto | Evidencia, tolerancias y doble aceptación |
| Términos no demostrables | Media | Alto | Versionado, integridad y recibo descargable |
| Entrada accidental a B2C | Media | Alto | Restricción B2B y compuerta de revisión |
| “Verificado” induce confianza excesiva | Media | Alto | Lenguaje de alcance, fecha y fuente |

## 12. Información requerida al operador

Antes de redactar contratos finales se deben responder y acreditar:

1. ¿Cuál es la entidad operadora, NIT, domicilio, matrícula, RUT y actividad?
2. ¿Quién factura la comisión y cuál es su responsabilidad de IVA/renta/ICA?
3. ¿Quién paga el 10 %, sobre qué base, cuándo se causa y qué ocurre con ajustes/cancelaciones?
4. ¿RexFy representa a alguien, puede aceptar ofertas o solo transmite mensajes?
5. ¿Qué proveedor mueve el dinero y quién figura como comercio, beneficiario y titular temporal?
6. ¿Qué materiales exactos, estados y destinos admite el piloto?
7. ¿Algún operador almacenará, transformará o gestionará residuos?
8. ¿Cómo se verifica origen, permisos, pesaje, transporte y recepción?
9. ¿Cuál es la política real de conservación y dónde están los proveedores/datos?
10. ¿Qué autoridad sectorial/societaria supervisa al operador y cuáles son sus cifras?
11. ¿Cuáles son los seguros y límites de cada participante?
12. ¿Qué canales y responsables atenderán privacidad, soporte y notificaciones judiciales?

## 13. Fuentes oficiales consultadas

- Código de Comercio, Decreto 410 de 1971: <https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=41102>
- Ley 527 de 1999, mensajes de datos: <https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4276>
- Ley 1581 de 2012, protección de datos: <https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981>
- SIC, alcance de datos corporativos: <https://sedeelectronica.sic.gov.co/boletin-juridico/conceptos/ambito-de-aplicacion-de-la-ley-1581-de-2012-en-datos-corporativos>
- Ley 1480 de 2011, Estatuto del Consumidor: <https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306>
- Ley 1563 de 2012, arbitraje: <https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=48366>
- Decreto 1625 de 2016, compilación tributaria: <https://normograma.dian.gov.co/dian/compilacion/docs/decreto_1625_2016.htm>
- Estatuto Tributario DIAN, artículos 437-4 y 437-5: <https://normograma.dian.gov.co/dian/compilacion/docs/paneles/estatuto_tributario_indice.html>
- DIAN, concepto sobre facturación en mandato: <https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_0049_2025.htm>
- Ley 1672 de 2013, RAEE: <https://www.minambiente.gov.co/documento-normativa/ley-1672-de-2013/>
- Resolución 851 de 2022, RAEE: <https://www.minambiente.gov.co/documento-entidad/resolucion-851-de-2022/>
- Resolución 1407 de 2018, envases y empaques: <https://www.minambiente.gov.co/documento-normativa/resolucion-1407-de-2018/>
- Decreto 1076 de 2015, sector ambiente: <https://www.minambiente.gov.co/documento-normativa/decreto-1076-de-2015/>
- MinAmbiente, residuos peligrosos: <https://www.minambiente.gov.co/asuntos-ambientales-sectorial-y-urbana/residuos-peligrosos/>
- ICA, alimentos para animales: <https://www.ica.gov.co/areas/pecuaria/servicios/alimentos-para-animales>
- SIC, control metrológico de instrumentos de pesaje: <https://sedeelectronica.sic.gov.co/transparencia/normativa/control-metrologico-de-instrumentos-de-pesaje-de-funcionamiento-no-automatico-balanzas>
- Supersociedades, SAGRILAFT y actualización 2026: <https://www.supersociedades.gov.co/web/asuntos-economicos-societarios/sagrilaft>

## 14. Dictamen de etapa

La arquitectura es jurídicamente **viable en principio**, pero **no lista para contratación real**. El trabajo siguiente no es “redactar términos” de forma aislada: es decidir el modelo, cerrar los hechos pendientes y traducirlos simultáneamente a contratos, producto, contabilidad, proveedor de pagos y controles ambientales. La propuesta de esa arquitectura está en `02_arquitectura_juridica_documental.md`.
