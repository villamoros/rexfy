# ADR-007 — Acceso a datos en el monolito modular

**Estado:** aceptada
**Fecha:** 23 de noviembre de 2026

## Contexto

RexFy despliega una API FastAPI y un worker que comparten PostgreSQL. La capa de aplicación usa
modelos SQLAlchemy para consultas, bloqueos y escrituras dentro de una única transacción. Presentar
esa implementación como una arquitectura hexagonal con repositorios independientes generaba una
distancia entre el diagrama y el código, sin que existan dos motores de persistencia ni una necesidad
demostrada de sustituir PostgreSQL.

## Decisión

Se adopta un monolito modular con *transaction scripts* tipados:

- `presentation` traduce HTTP, autentica y abre el `UnitOfWork`;
- `application` orquesta casos de uso y puede consultar modelos SQLAlchemy dentro de la frontera
  PostgreSQL;
- `domain` conserva máquinas de estado y reglas puras, sin FastAPI, SQLAlchemy ni infraestructura;
- `infrastructure` contiene modelos, sesiones y adaptadores de servicios externos;
- las políticas transversales de autorización y locking viven en `application/policies.py`;
- ningún servicio de aplicación confirma una petición ordinaria: el `UnitOfWork` realiza el commit;
- almacenamiento, identidad, correo y el worker mantienen fronteras de fallo explícitas.

Una prueba arquitectónica basada en AST impide que `domain` importe framework o infraestructura y
que `application`/`infrastructure` dependan de la presentación HTTP. Esta regla forma parte del CI.

## Consecuencias

- La arquitectura publicada coincide con la implementación y sus límites quedan automatizados.
- Se evita crear una interfaz de repositorio por cada tabla sin una segunda implementación real.
- Cambiar de ORM o motor implicaría trabajo deliberado; no se afirma portabilidad inexistente.
- Si aparece otro datastore, un segundo servicio o pruebas que necesiten sustituir persistencia sin
  PostgreSQL, se introducirá un puerto por agregado en ese punto y no como abstracción preventiva.

## Alternativas descartadas

- Repositorios genéricos: ocultan consultas y locks relevantes sin reducir acoplamiento real.
- Microservicios por módulo: agregan consistencia distribuida y operación sin necesidad de escala.
- Mantener límites solo documentales: permite regresiones silenciosas y recrea la deuda original.
