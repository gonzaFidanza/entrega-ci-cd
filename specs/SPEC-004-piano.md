---
id: SPEC-004
title: Piano interactivo
status: done
priority: high
---

# Spec: Piano interactivo

## Identificador
`SPEC-004-piano`

## Estado
✅ Implementada

## Descripción
El sistema debe servir una interfaz web de un piano que se pueda tocar tanto
con el mouse como con el teclado de la computadora. El sonido se sintetiza en
el navegador con la Web Audio API (sin archivos de audio). El backend expone
la definición del teclado (notas, frecuencias y mapeo de teclas) en un endpoint
JSON que es la **fuente única de verdad** consumida por el frontend y por los
tests.

## Motivación
Demostrar el pipeline de CI/CD sobre una aplicación más rica que un simple
endpoint: incluye lógica pura testeable (matemática de frecuencias por
temperamento igual), una API y un frontend estático, todo validado por la
misma cadena spec ↔ test ↔ código.

---

## Criterios de aceptación

### CA-1: API de notas disponible
**Dado** que el servidor está corriendo,
**cuando** un cliente hace `GET /api/notes`,
**entonces** la respuesta debe ser `200 OK` con un JSON `{ notes: [...] }`
que contenga las 17 notas del teclado.

### CA-2: Frecuencias por temperamento igual
**Dado** la función `noteFrequency(semitones)`,
**cuando** se calcula la frecuencia,
**entonces** debe seguir `f = 440 · 2^(n/12)`: `A4` (n=0) = `440 Hz`,
subir 12 semitonos duplica la frecuencia y `C5` debe ser el doble de `C4`.

### CA-3: Rango del teclado
**Dado** la definición del teclado,
**cuando** se enumera,
**entonces** debe tener exactamente 17 teclas desde `C4` hasta `E5`,
con 10 teclas blancas y 7 negras.

### CA-4: Estructura de cada nota
**Dado** cualquier nota del teclado,
**cuando** se inspecciona,
**entonces** debe tener `name` (string), `freq` (número > 0), `key` (tecla de
la computadora, string) e `isBlack` (boolean); y las teclas de la computadora
deben ser únicas (sin colisiones).

### CA-5: Frontend del piano
**Dado** que el servidor está corriendo,
**cuando** un cliente hace `GET /`,
**entonces** debe responder `200 OK` con el HTML del piano.

---

## Trazabilidad

| Criterio | Test asociado | Archivo |
|----------|---------------|---------|
| CA-1 | `GET /api/notes responde 200 con un array` / `coincide con getNotes()` | `tests/piano.test.js` |
| CA-2 | `A4 ... 440 Hz` / `12 semitonos duplica` / `C5 ... doble que C4` | `tests/piano.test.js` |
| CA-3 | `17 teclas (C4 a E5)` / `10 blancas y 7 negras` | `tests/piano.test.js` |
| CA-4 | `cada nota tiene name, freq>0, key e isBlack` / `teclas ... únicas` | `tests/piano.test.js` |
| CA-5 | `la raíz "/" sirve el HTML del piano` | `tests/piano.test.js` |

---

## Historial de cambios
- **v1.0** (inicial): piano interactivo (mouse + teclado) con síntesis Web Audio,
  endpoint `/api/notes` y lógica de frecuencias en `src/piano.js`.
