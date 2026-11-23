# ADR-004 — Unit of Work, máquinas de estado y paginación keyset

**Estado:** aceptado e implementado  
**Fecha:** 23 de noviembre de 2026  
**Épica:** EP-07 Arquitectura mantenible

## Contexto

Los servicios de aplicación confirmaban transacciones por su cuenta, los estados se asignaban de
forma directa y las listas operativas devolvían colecciones completas o límites fijos. Esto hacía
difícil demostrar atomicidad, permitía que una transición nueva eludiera reglas previas y degradaba
las consultas a medida que crecían los historiales.

## Decisión

Las mutaciones comerciales seleccionadas se ejecutan dentro de un Unit of Work de petición que
confirma una vez o revierte todo. Las transiciones válidas de oferta, orden y envío se definen como
tablas puras en dominio y se verifican antes de asignar estado. Las listas operativas usan cursores
keyset ordenados por fecha e ID y devuelven `items` más `next_cursor`.

Se conserva el monolito modular y PostgreSQL como única fuente transaccional. Los comandos de
logística sustituyen firmas extensas, pero no crean una capa de abstracción genérica sobre cada
modelo ni repositorios sin una necesidad observable.

## Alternativas descartadas

- **Offset/limit:** sencillo, pero filas insertadas entre peticiones pueden duplicar o saltar
  resultados y el costo del offset crece con el historial.
- **Commit dentro de cada servicio:** oculta la frontera y permite confirmar una parte antes de que
  auditoría, outbox o respuesta terminen.
- **Triggers de base de datos para estados:** protegen una tabla, pero separan la regla del lenguaje
  del dominio y dificultan mensajes de conflicto específicos.
- **Microservicios por módulo:** añaden coordinación, observabilidad y consistencia distribuida sin
  que exista todavía una carga o estructura de equipos que lo requiera.

## Consecuencias

La atomicidad de los comandos críticos es visible y testeable; los estados imposibles se rechazan
en un solo lugar; las listas mantienen costo acotado y orden determinista. A cambio, cambiar el
contrato de una lista exige actualizar clientes, los cursores no permiten saltar a una página
arbitraria y los casos administrativos o workers que no usan el Unit of Work de petición deben
mantener explícita su propia frontera.
