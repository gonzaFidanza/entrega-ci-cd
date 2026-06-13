# Cómo romper el pipeline (a propósito) 🔨

Esta guía es para **defender el trabajo**: el profesor puede pedir "rompé la
build", "hacé que no pase un test", "hacé fallar el deploy". Acá está, etapa
por etapa, **qué tocar, qué error vas a ver y por qué**. Es el mapa mental de
cómo funciona la Integración y Entrega Continua.

El pipeline vive en [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)
y tiene estos jobs encadenados:

```
build ──┬── lint ───────┐
        ├── test ────────┼── docker ── deploy ── notify (siempre corre)
        └── sync-specs ──┘
```

Cada job depende del anterior (`needs:`). **Si un job del que dependés falla,
los siguientes ni se ejecutan** (se marcan como `skipped`). Esa es la idea
central de CI: cortar la cadena apenas algo está mal, lo más temprano posible
("fail fast").

> Consejo para la demo: hacé los cambios en una **rama** y abrí un Pull Request.
> Así el profesor ve el pipeline correr en rojo sin ensuciar `main`.

---

## 1. Romper el BUILD (instalación de dependencias)

**Qué hace:** `pnpm install --frozen-lockfile` — instala exactamente lo que
dice el lockfile.

**Cómo romperlo:**
- Editá `package.json` y agregá una dependencia que no existe:
  ```json
  "dependencies": { "express": "^4.19.2", "paquete-que-no-existe-12345": "^9.9.9" }
  ```
  → falla al resolver el paquete.
- O cambiá la versión de `express` en `package.json` **sin** actualizar
  `pnpm-lock.yaml`. Con `--frozen-lockfile`, pnpm exige que coincidan y aborta:
  `ERR_PNPM_OUTDATED_LOCKFILE`.

**Por qué es didáctico:** `--frozen-lockfile` garantiza builds
**reproducibles** (lo mismo en tu compu y en el servidor de CI). Si dejás que
el lockfile y el manifest divergan, perdés esa garantía y CI te frena.

---

## 2. Romper el LINT (inspección estática de código)

**Qué hace:** `pnpm lint` → ESLint sobre `src/` y `tests/` con las reglas de
[`.eslintrc.json`](../.eslintrc.json).

**Cómo romperlo:**
- Sacá un punto y coma en `src/app.js` → la regla `"semi": ["error", "always"]`
  lo marca como **error** y el job devuelve exit code 1.
- Usá comillas dobles donde van simples → da *warning* (no rompe), pero subir
  el nivel de la regla a `"error"` sí lo haría.

**Por qué es didáctico:** el lint no prueba que el programa *funcione*, prueba
que cumpla las **convenciones de calidad** del equipo antes de gastar tiempo en
ejecutar tests. Es la primera barrera de calidad.

---

## 3. Romper los TESTS (lo más educativo para SDD)

**Qué hace:** `pnpm test` → Jest corre `tests/*.test.js` con cobertura.

**Tres formas, de menos a más interesante:**

**a) Romper el código, dejar el test.** En `src/piano.js` cambiá la frecuencia
de referencia:
```js
const A4_FREQ = 442; // antes 440
```
→ el test `A4 ... es exactamente 440 Hz` falla:
`Expected: 440, Received: 442`. El test detecta la regresión.

**b) Romper la lógica de notas.** En `src/piano.js`, cambiá la fórmula:
```js
const freq = A4_FREQ * Math.pow(2, semitones / 6); // debería ser /12
```
→ fallan los tests de octava (`C5 ... doble que C4`), porque ya no se cumple el
temperamento igual.

**c) Romper el contrato de la API.** En `src/app.js` cambiá la clave de la
respuesta:
```js
res.status(200).json({ teclas: getNotes() }); // antes "notes"
```
→ falla `coincide con getNotes()` **y** el frontend deja de cargar las teclas.
Esto muestra que el test protege el **contrato** entre backend y frontend.

**Por qué es didáctico (SDD):** cada test está atado a un criterio de
aceptación de [`specs/SPEC-004-piano.md`](../specs/SPEC-004-piano.md). El test
es la traducción ejecutable de la spec. Si cambiás comportamiento sin actualizar
la spec y el test, el pipeline te frena: la documentación no puede mentir.

---

## 4. Romper el SYNC de SPECS a ClickUp

**Qué hace:** `bash scripts/sync-specs-clickup.sh` — refleja `specs/*.md` como
tareas en ClickUp. Solo corre en push a `main`.

**Cómo romperlo:**
- Borrá una línea del frontmatter de una spec, por ejemplo el `id:` →
  el script avisa `falta 'id' en frontmatter` y saltea esa spec.
- Invalidá el secret `CLICKUP_TOKEN` → la API responde 401 y el script corta
  (`set -euo pipefail` hace que cualquier error aborte).

**Por qué es didáctico:** muestra integración con herramientas externas vía
**secrets** (nunca hardcodeados en el repo) y el patrón "el repo es la única
fuente de verdad" (SDD de una sola vía: repo → board).

---

## 5. Romper el DOCKER BUILD

**Qué hace:** construye la imagen con el [`Dockerfile`](../Dockerfile) y
verifica que el contenedor arranque y responda en `/health`.

**Cómo romperlo:**
- Error de sintaxis en el `Dockerfile` (ej: `FRM node:20-alpine`) → falla
  `docker build`.
- Que la app **no levante**: si rompés `src/app.js` de forma que el server
  crashee al iniciar, el `curl --fail http://localhost:3000/health` falla y el
  job se cae.
- Quitar `COPY src ./src` → la imagen no tiene el código y el contenedor muere.

**Por qué es didáctico:** el build de Docker prueba que la app es **portable**
(corre en un entorno limpio, no solo "en mi máquina"). El health check dentro
del job es un **smoke test** del artefacto antes de desplegarlo.

---

## 6. Romper el DEPLOY a Render

**Qué hace:** dispara el deploy hook de Render, espera, y hace un smoke test
contra `https://entrega-ci-cd.onrender.com/health`. Solo en push a `main`.

**Cómo romperlo:**
- Invalidá el secret `RENDER_DEPLOY_HOOK` → el `curl` al hook falla.
- Apuntá el smoke test a una URL inexistente → `curl --fail` devuelve error tras
  los reintentos.

**Por qué es didáctico:** separa **construir** (CI) de **entregar** (CD). El
deploy solo ocurre si todo lo anterior pasó y estás en `main` (la condición
`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`). El smoke
test post-deploy confirma que lo que se publicó realmente responde.

---

## 7. El NOTIFY siempre corre (`if: always()`)

El último job manda a Discord un resumen por etapa, **haya fallado o no**.
No lo rompas para la demo: es justamente el **mecanismo de feedback**. Si hacés
fallar cualquier etapa de arriba, vas a ver el mensaje rojo en Discord con el
detalle de qué etapa cayó. Eso cierra el ciclo de CI/CD: cambio → validación →
feedback al equipo.

---

## Resumen para la defensa oral

| Si el profe pide... | Tocá... | Vas a ver... |
|---|---|---|
| "Rompé la build" | versión en `package.json` sin tocar el lockfile | `ERR_PNPM_OUTDATED_LOCKFILE` |
| "Hacé fallar el lint" | sacá un `;` en `src/app.js` | error `semi` de ESLint |
| "Hacé fallar un test" | cambiá `A4_FREQ` a 442 en `src/piano.js` | `Expected 440, Received 442` |
| "Rompé el contrato de la API" | renombrá `notes` en la respuesta | test de API + frontend rotos |
| "Hacé fallar el Docker" | typo en el `Dockerfile` | error de `docker build` |
| "Hacé fallar el deploy" | secret de Render inválido | `curl --fail` en rojo |

**La idea de fondo:** cada etapa es una **red de seguridad** distinta. El
pipeline corta apenas una red detecta un problema, y el equipo se entera al
instante. Cuanto antes falla, más barato es arreglarlo.
