# LEG-ARC-001 — Arquitectura jurídica, documental y de producto

| Campo | Valor |
|---|---|
| Versión | 0.1 |
| Fecha | 24 de noviembre de 2026 |
| Dependencia | LEG-AUD-001 |
| Estado | Propuesta; no aprobada para contratación |

## 1. Principio de diseño

Cada promesa contractual debe corresponder a una capacidad del software y cada acción relevante del software debe tener dueño, regla, evidencia y documento. La arquitectura evita un único texto que mezcle servicio tecnológico, compraventa, mandato, pagos, transporte y gestión ambiental.

## 2. Arquitectura contractual propuesta

```text
Contrato marco de plataforma B2B
├── Reglas de cuenta, empresa, roles y seguridad
├── Anexo de intermediación y comisión
├── Reglas del marketplace y publicaciones
├── Anexo de materiales y cumplimiento ambiental
├── Reglas de negociación, orden, pesaje y aceptación
├── Anexo de pagos, facturación y reversos
├── Anexo logístico (cuando se use transporte)
├── Anexo de mandato (solo para un flujo que realmente lo requiera)
└── Política de privacidad y avisos

Por transacción
├── Publicación y soportes
├── Oferta/contraoferta
├── Orden comprador-vendedor
├── Servicio de transporte separado
├── Liquidación económica
├── Evidencia de entrega/pesaje/calidad
└── Facturas, certificados y expediente de reclamación
```

### 2.1 Relación entre partes

| Relación | Instrumento | Responsable principal |
|---|---|---|
| RexFy ↔ empresa usuaria | Contrato marco de plataforma | Operador RexFy |
| RexFy ↔ vendedor/generador | Intermediación + comisión; mandato solo si existe | Operador RexFy y empresa |
| Vendedor ↔ comprador | Orden/compraventa B2B | Las dos partes |
| Parte contratante ↔ transportador | Orden de transporte/logística | Contratante y transportador |
| RexFy/usuarios ↔ proveedor de pagos | Términos y autorizaciones del proveedor | Según arquitectura aprobada |
| Titular de datos ↔ responsable | Política, aviso y autorización aplicable | Responsable del tratamiento |

## 3. Catálogo documental

| Código | Documento | Prioridad | Estado |
|---|---|---:|---|
| LEG-001 | Identificación y ficha corporativa del operador | P0 | **PENDIENTE** |
| LEG-002 | Contrato marco B2B de plataforma | P0 | **PENDIENTE** |
| LEG-003 | Reglas del marketplace y contenido | P0 | **PENDIENTE** |
| LEG-004 | Anexo de intermediación, causación y comisión | P0 | **PENDIENTE** |
| LEG-005 | Orden de compraventa entre empresas | P0 | **PENDIENTE** |
| LEG-006 | Anexo de materiales, prohibiciones y soportes | P0 | **PENDIENTE** |
| LEG-007 | Pagos, facturación, retenciones, reversos y conciliación | P0 | **PENDIENTE proveedor/concepto** |
| LEG-008 | Política de tratamiento y avisos de privacidad | P0 | **PENDIENTE inventario** |
| LEG-009 | Acuerdos con encargados y transferencias/transmisiones | P0 | **PENDIENTE proveedores** |
| LEG-010 | Pesaje, calidad, aceptación y reclamaciones | P1 | **PENDIENTE operación** |
| LEG-011 | Logística, seguros y evidencia de entrega | P1 | **PENDIENTE modelo** |
| LEG-012 | Debida diligencia, fraude y materiales ilícitos | P1 | **PENDIENTE riesgo** |
| LEG-013 | Anexo de mandato limitado | P1 | **CONDICIONAL; no redactar si no se usa** |
| LEG-014 | Política B2C y comercio electrónico | P2 | **CONDICIONAL; antes de admitir B2C** |
| LEG-015 | Matriz de conservación y expediente probatorio | P0 | **PENDIENTE** |
| LEG-016 | Procedimiento de incidentes y notificación | P0 | **PENDIENTE** |

## 4. Decisiones de producto necesarias

### 4.1 Cuenta y capacidad

**OBLIGATORIO:** una persona se autentica, pero actúa por una empresa. El sistema debe distinguir titular de cuenta, empresa, rol, facultad para publicar/ofertar/aceptar y alcance de una invitación. Aceptaciones económicas críticas requieren reautenticación o control equivalente y un recibo descargable.

### 4.2 Publicación

Campos regulatorios mínimos:

- material y subcategoría;
- condición: producto, subproducto, residuo no peligroso, RAEE u otra;
- origen y titularidad declarada;
- ubicación y cantidad/unidad;
- contaminación y sustancia previa;
- uso/destino permitido;
- permisos, registros o soportes condicionados;
- fotos y ficha;
- declaración de exactitud y licitud;
- fecha de vencimiento y versión.

El motor debe aplicar `permitido`, `revisión obligatoria` o `prohibido`, con razón visible y auditoría.

### 4.3 Oferta y orden

La oferta debe contener elementos económicos y operativos suficientes. La aceptación crea una instantánea inmutable de publicación, oferta, anexos y reglas. Cambios posteriores son adendas o eventos, no edición destructiva.

### 4.4 Comisión

La configuración necesita, como mínimo:

```text
pagador
evento_de_causacion
porcentaje
base_incluye_material
base_incluye_ajuste_peso_calidad
base_incluye_transporte
base_incluye_impuestos
iva_comision
retenciones
regla_cancelacion
regla_devolucion
version_y_vigencia
```

El 10 % puede ser el valor comercial propuesto, pero no debe codificarse sin versión ni desglose. Toda liquidación debe ser reproducible.

### 4.5 Pago

Orden de preferencia:

1. **RECOMENDADO:** proveedor que soporte el modelo y disperse directamente con conciliación, sujeto a contrato y concepto.
2. **TRANSITORIO:** pago entre partes; RexFy factura su servicio por separado.
3. **NO HABILITAR SIN REDISEÑO:** fondos bajo control/custodia discrecional de RexFy.

La selección del proveedor requiere evidencia escrita sobre onboarding, beneficiarios, titularidad de fondos, tiempos, split, devoluciones, contracargos, reservas, cuentas, conciliación, fraude, datos y terminación. La página comercial del proveedor no basta.

### 4.6 Pesaje y conformidad

Guardar evento de pesaje, comprobante, instrumento, bruto/tara/neto, calidad, fotos, actor y objeción. La orden debe indicar cuál medición prevalece y cómo se resuelve discrepancia. Nunca ocultar el valor original al aplicar un ajuste.

### 4.7 Logística

Separar:

- solicitud de cotización;
- oferta del transportador;
- aceptación y contratante;
- vehículo/conductor cuando corresponda;
- cargue, custodia, riesgo y seguros;
- hitos de retiro/entrega;
- novedad, daño o pérdida;
- prueba de entrega.

## 5. Trazabilidad y evidencia

### 5.1 Registro mínimo por evento jurídico

```json
{
  "eventType": "TERMS_ACCEPTED",
  "occurredAt": "ISO-8601",
  "userId": "interno",
  "companyId": "interno",
  "authorityRole": "rol vigente",
  "documentCode": "LEG-002",
  "documentVersion": "x.y",
  "documentDigest": "hash",
  "transactionId": "si aplica",
  "action": "acción afirmativa exacta",
  "evidence": {
    "sessionId": "interno",
    "requestId": "interno",
    "ip": "dato auxiliar protegido",
    "userAgent": "dato auxiliar protegido"
  }
}
```

No registrar secretos, tokens ni documentos completos en logs generales. El expediente jurídico debe tener control de acceso, retención y exportación propios.

### 5.2 Versiones

- Ningún documento publicado se sobrescribe.
- Cada versión tiene aprobación, vigencia, resumen de cambios y hash.
- Cambios materiales requieren nueva aceptación; cambios menores se notifican según regla aprobada.
- Una transacción conserva la versión que la gobernó.
- El usuario puede descargar o consultar el texto aceptado.

## 6. Footer y centro legal

### 6.1 Ya implementado en producto

- enlace global al centro legal;
- explicación prudente del rol de plataforma;
- acceso a modelo, materiales, pagos, privacidad y reclamaciones;
- estado visible de documentación en preparación;
- estado técnico del servicio.

### 6.2 Antes del lanzamiento comercial

**OBLIGATORIO:** publicar razón social, NIT, domicilio, correo/canal formal, teléfono cuando aplique, responsable de privacidad y documentos vigentes. No inventar esos datos ni ocultarlos detrás de autenticación.

**CONDICIONAL:** la información exigida para comercio electrónico con consumidores debe activarse íntegramente antes de habilitar B2C.

## 7. Plan de implementación legal-producto

### Fase A — Cierre de hechos (P0)

1. Aprobar identidad del operador y alcance territorial.
2. Elegir modelo relacional por flujo.
3. Aprobar catálogo piloto y materiales excluidos.
4. Seleccionar arquitectura/proveedor de pago.
5. Obtener concepto tributario sobre facturación, IVA, retenciones y comisión.
6. Inventariar datos y proveedores.

**Criterio de salida:** matriz de decisiones firmada por negocio, legal, tributario, producto y tecnología.

### Fase B — Documentos y controles (P0)

1. Redactar documentos LEG-002 a LEG-009 y LEG-015/016.
2. Implementar taxonomía y compuertas de materiales.
3. Implementar desglose de liquidación.
4. Versionar y capturar aceptación.
5. Implementar derechos de datos, conservación e incidentes.
6. Validar end-to-end cada promesa contractual.

**Criterio de salida:** pruebas muestran que ninguna operación evita la regla jurídica aplicable.

### Fase C — Piloto controlado (P1)

1. Empresas aprobadas y materiales ordinarios limitados.
2. Revisión humana de publicaciones condicionadas.
3. Pago sin custodia de RexFy.
4. Monitoreo de fraude, disputas, peso, calidad y logística.
5. Revisión de expedientes y conciliación contable.

**Criterio de salida:** muestra de operaciones reproducible y sin hallazgos críticos abiertos.

### Fase D — Expansión condicionada

RAEE, residuos peligrosos, nuevos usos agroindustriales, custodia de dinero, mandato, almacenamiento, transformación o B2C requieren una auditoría incremental previa; no son extensiones automáticas del piloto.

## 8. Criterios de “listo legal”

Una historia regulada solo está terminada cuando:

- identifica obligación, condición y fuente;
- define actor responsable y evidencia;
- su interfaz no induce a error;
- tiene validación backend y no solo frontend;
- registra versión/aceptación/evento;
- maneja rechazo, excepción y reclamación;
- protege/minimiza datos;
- posee pruebas unitarias, integración y recorrido end-to-end;
- fue aprobada por el especialista correspondiente;
- puede auditarse sin reconstrucción manual especulativa.

## 9. Próxima decisión

El siguiente paso jurídico no es producir contratos definitivos con campos inventados. Es realizar un taller de cierre de hechos sobre las doce preguntas de LEG-AUD-001, obtener los conceptos tributario y de pagos, y aprobar la matriz de modelo. Con esa entrada se pueden redactar los documentos P0 y convertir cada cláusula en criterios de aceptación del producto.
