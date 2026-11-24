# ADR-006 — Identidad administrada y almacenamiento de archivos

**Estado:** aceptado e implementado
**Fecha:** 23 de noviembre de 2026

## Contexto

RexFy necesita autenticar personas, autorizar acciones por empresa y almacenar imágenes de
publicaciones sin convertir credenciales externas en el modelo de autorización del dominio.

## Decisión de identidad

Clerk autentica la identidad humana y entrega el token. La API verifica issuer y firma, resuelve una
identidad local y aplica autorización con `User`, `CompanyMember`, rol y empresa actuante. Un token
válido no concede por sí solo acceso a una empresa. Los administradores de plataforma se distinguen
de los roles internos de cada compañía.

La indisponibilidad de Clerk produce una respuesta recuperable; no se acepta un perfil no verificado
ni se confía en atributos enviados por la web. Logs y analítica evitan guardar tokens o PII innecesaria.

## Decisión de almacenamiento

La aplicación usa un puerto de almacenamiento con implementación local para desarrollo y
S3-compatible para entornos desplegados. PostgreSQL conserva metadatos y ownership; el objeto
binario no forma parte de la transacción. Las mutaciones validan tipo, tamaño y pertenencia antes de
publicar o eliminar una referencia.

## Consecuencias

La autenticación puede evolucionar sin reescribir permisos empresariales y el proveedor de objetos
puede cambiar sin modificar el dominio. La consistencia archivo–metadata es compensatoria: una
operación que falle después de subir el objeto debe limpiarse o reconciliarse, no puede depender de
una transacción distribuida.
