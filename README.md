# Entrega CI/CD — 2da Instancia Integración y Entrega Continua

[![CI/CD Pipeline](https://github.com/USUARIO/entrega-ci-cd/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/USUARIO/entrega-ci-cd/actions)

**Piano interactivo** en Node.js + Express (tocable con mouse o con el teclado de la compu, sonido sintetizado con Web Audio) que sirve de excusa para demostrar un pipeline completo de **Integración y Entrega Continua**, con **Spec Driven Development** como metodología.

> El piano es la cara visible; lo importante es la cadena **spec ↔ test ↔ código ↔ pipeline** que lo respalda. Para ver cómo romper cada etapa a propósito (útil para defender el trabajo), mirá [`docs/COMO-ROMPER-EL-PIPELINE.md`](docs/COMO-ROMPER-EL-PIPELINE.md).

---

## Arquitectura del entorno (mapeo al esquema del PDF)

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│  CONTROL DE     │ código │   SERVIDOR DE IC     │binarios│  ENTORNOS DE    │
│  VERSIONES      │───────▶│   (GitHub Actions)   │───────▶│  ENTREGA        │
│  (GitHub)       │        │  - Build             │ imagen │  (Render)       │
│  Ramas y merges │        │  - Lint (ESLint)     │ Docker │  - Pruebas      │
└─────────────────┘        │  - Tests (Jest)      │        │  - Producción   │
        ▲                  │  - Docker build      │        └────────┬────────┘
        │                  │  - Deploy            │                 │
        │                  └──────────┬───────────┘                 │
        │                             │ resultados                  │
        │                             ▼                             │
        │                  ┌──────────────────────┐                 │
        └──────────────────│ MECANISMO DE FEEDBACK│◀────────────────┘
                           │  (Notificaciones de  │
                           │   GitHub + Badges)   │
                           └──────────┬───────────┘
                                      │
                              ┌───────▼────────┐
                              │     EQUIPO     │
                              │ (Desarrollador │
                              │   con build    │
                              │     local)     │
                              └────────────────┘
```

| Componente del esquema | Herramienta |
|---|---|
| Control de versiones | **Git + GitHub** |
| Servidor de IC | **GitHub Actions** |
| Build local | **Node.js + npm** |
| Pruebas automatizadas | **Jest + Supertest** |
| Entornos de entrega | **Render** (con Docker) |
| Inspección de código (extra) | **ESLint** |
| Gestor de entorno de ejecución (extra) | **Docker** |
| Gestor de paquetes (extra) | **npm** |
| Spec Driven Development (extra) | **Spec en markdown + trazabilidad spec↔test** |

---

## Estructura del proyecto

```
entrega-ci-cd/
├── .github/workflows/
│   └── ci-cd.yml             ← pipeline de GitHub Actions (servidor de CI)
├── specs/
│   ├── saludo.md             ← SPEC-001: endpoint de saludo
│   ├── SPEC-002-rate-limit.md
│   ├── SPEC-003-metrics.md
│   └── SPEC-004-piano.md     ← Spec del piano (criterios de aceptación, SDD)
├── src/
│   ├── app.js                ← Servidor Express (sirve el piano + APIs)
│   ├── piano.js              ← Lógica pura: notas y frecuencias (fuente de verdad)
│   └── public/               ← Frontend del piano (HTML/CSS/JS, Web Audio)
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── tests/
│   ├── saludo.test.js        ← Tests de SPEC-001 (1 por criterio)
│   └── piano.test.js         ← Tests de SPEC-004 (matemática de notas + API)
├── docs/
│   └── COMO-ROMPER-EL-PIPELINE.md  ← Guía didáctica: cómo hacer fallar cada etapa
├── .dockerignore
├── .eslintrc.json            ← Configuración de inspección de código
├── .gitignore
├── Dockerfile                ← Contenedor para deploy
├── package.json
└── README.md
```

---

## Cómo correr localmente (build local del desarrollador)

```bash
# 1. Instalar dependencias
npm install

# 2. Correr los tests
npm test

# 3. Correr la app
npm start

# 4. Abrir el piano en el navegador
#    http://localhost:3000/   ← tocá con el mouse o con el teclado (a w s e d f...)

# 5. Probar los endpoints
curl http://localhost:3000/api/notes   # definición del teclado (JSON)
curl http://localhost:3000/health      # health check
curl http://localhost:3000/saludo      # endpoint original (sigue vivo)
```

## Con Docker

```bash
docker build -t entrega-ci-cd .
docker run -p 3000:3000 entrega-ci-cd
```

---

## Flujo completo (qué pasa cuando hago un push)

1. Desarrollador hace cambio en el código y push a una rama
2. **GitHub Actions** detecta el push y arranca el pipeline
3. **Build**: instala dependencias con `npm ci`
4. **Lint**: ESLint analiza estáticamente el código
5. **Test**: Jest ejecuta los tests derivados de las specs (saludo + piano)
6. **Docker Build**: se construye la imagen del contenedor
7. **Deploy**: si todo lo anterior pasó y es push a `main`, se dispara el deploy en Render
8. **Feedback**: si algo falla, GitHub notifica por email; el badge del README cambia a rojo

---

## Spec Driven Development en este proyecto

La **spec** (`/specs/saludo.md`) es la fuente de verdad del comportamiento del sistema. Cada criterio de aceptación tiene un test directamente asociado, garantizando trazabilidad bidireccional **spec ↔ test ↔ código**.

**Flujo de trabajo SDD:**
1. Si querés cambiar comportamiento, **editás la spec primero**
2. Actualizás los tests para reflejar el nuevo criterio
3. Modificás el código para que los tests pasen
4. El pipeline valida toda la cadena

Esto da:
- Documentación viva (la spec siempre refleja el sistema porque los tests la validan)
- Cambios trazables: el commit que modifica la spec es el mismo PR que cambia el código
- Compatibilidad con agentes de IA (Claude Code, Copilot) que pueden generar código directo desde la spec
