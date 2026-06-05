---
id: SPEC-002
title: Rate limiting en endpoints públicos
status: in-progress
priority: medium
---

# Spec: Rate limiting

## Identificador
`SPEC-002-rate-limit`

## Estado
🚧 En progreso

## Descripción
Los endpoints públicos (`/saludo`, `/health`) deben aplicar un límite de
requests por IP para evitar abuso.

## Motivación
Prevenir scraping y mitigar ataques básicos de denegación de servicio sin
necesidad de infraestructura adicional.

---

## Criterios de aceptación

### CA-1: Límite por IP
**Dado** que una IP hace más de `60` requests a `/saludo` en una ventana
de `60` segundos,
**cuando** llega el request `61`,
**entonces** la respuesta debe ser `429 Too Many Requests`.

### CA-2: Header informativo
**Dado** cualquier respuesta del endpoint con rate limit aplicado,
**cuando** se envía la respuesta,
**entonces** debe incluir el header `X-RateLimit-Remaining`.

### CA-3: Health check excluido
**Dado** que `/health` se usa para monitoreo,
**cuando** una IP excede el límite,
**entonces** `/health` debe seguir respondiendo `200 OK`.

---

## Historial de cambios
- **v0.1** (draft): definición inicial.
- **v0.2** (in-progress): implementación con `express-rate-limit`.
