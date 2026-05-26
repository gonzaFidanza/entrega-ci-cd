# Spec: Endpoint de Saludo

## Identificador
`SPEC-001-saludo`

## Estado
✅ Implementada

## Descripción
El sistema debe exponer un endpoint HTTP que devuelva un mensaje de saludo personalizado junto con la fecha y hora actual en formato ISO 8601.

## Motivación
Permitir que clientes externos validen que el servicio está activo y funcionando, mientras se obtiene un saludo personalizado para uso en interfaces de usuario.

---

## Criterios de aceptación

### CA-1: Endpoint disponible
**Dado** que el servidor está corriendo,
**cuando** un cliente hace `GET /saludo`,
**entonces** la respuesta debe tener código HTTP `200 OK`.

### CA-2: Estructura de la respuesta
**Dado** un request a `GET /saludo`,
**cuando** la respuesta es exitosa,
**entonces** el body debe ser un JSON con los siguientes campos:
- `mensaje` (string): el saludo
- `fecha` (string): fecha actual en formato ISO 8601

### CA-3: Saludo por defecto
**Dado** un request a `GET /saludo` sin parámetros,
**cuando** se procesa,
**entonces** el campo `mensaje` debe ser exactamente `"Hola Mundo"`.

### CA-4: Saludo personalizado
**Dado** un request a `GET /saludo?nombre=Juan`,
**cuando** se procesa,
**entonces** el campo `mensaje` debe ser exactamente `"Hola Juan"`.

### CA-5: Health check
**Dado** que el servidor está corriendo,
**cuando** un cliente hace `GET /health`,
**entonces** debe responder `200 OK` con `{ "status": "ok" }`.

### CA-6: Ruta inexistente
**Dado** un request a una ruta que no existe (ej: `GET /noexiste`),
**cuando** se procesa,
**entonces** la respuesta debe ser `404 Not Found`.

---

## Trazabilidad

| Criterio | Test asociado | Archivo |
|----------|---------------|---------|
| CA-1 | `responde 200 al GET /saludo` | `tests/saludo.test.js` |
| CA-2 | `respuesta tiene estructura correcta` | `tests/saludo.test.js` |
| CA-3 | `devuelve "Hola Mundo" por defecto` | `tests/saludo.test.js` |
| CA-4 | `devuelve saludo personalizado con query` | `tests/saludo.test.js` |
| CA-5 | `health check responde ok` | `tests/saludo.test.js` |
| CA-6 | `ruta inexistente devuelve 404` | `tests/saludo.test.js` |

---

## Historial de cambios
- **v1.0** (inicial): definición de endpoint `/saludo` con saludo personalizado y health check.
