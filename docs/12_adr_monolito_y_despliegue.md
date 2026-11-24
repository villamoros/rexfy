# ADR-005 — Monolito modular y topología de despliegue

**Estado:** aceptado e implementado
**Fecha:** 23 de noviembre de 2026

## Contexto

RexFy necesita evolucionar negociación, logística, confianza y operación sin asumir el costo de
consistencia distribuida de microservicios. La web se despliega en Vercel y la API requiere Python,
PostgreSQL, trabajo en segundo plano y migraciones controladas.

## Decisión

El backend continúa como monolito modular FastAPI y una única base PostgreSQL. La web Next.js es
una unidad de despliegue separada. El API container y el worker de outbox comparten código y esquema,
pero ejecutan procesos distintos. Redis se limita al rate limiting y no almacena estado de negocio.

Vercel aloja la web y puede enrutar al API configurado; no se fuerza el worker dentro de una Function.
Las migraciones se ejecutan como job controlado antes de promover el artefacto compatible. Ninguna
petición web ejecuta migraciones ni levanta procesos persistentes.

## Criterios para separar un servicio

Un módulo solo se extrae cuando tenga al menos una de estas evidencias: escalado independiente
sostenido, aislamiento de fallos necesario, requisitos de seguridad distintos o un equipo con
ownership autónomo. La cantidad de archivos o el nombre de un contexto no son evidencia suficiente.

## Consecuencias

Las transacciones permanecen locales y el despliegue es comprensible. A cambio, el API y el worker
deben mantener compatibilidad de esquema durante releases y los límites de módulo se protegen con
contratos y pruebas, no con fronteras de red.
