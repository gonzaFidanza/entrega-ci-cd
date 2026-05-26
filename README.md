# Entrega CI/CD — 2da Instancia Integración y Entrega Continua

[![CI/CD Pipeline](https://github.com/USUARIO/entrega-ci-cd/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/USUARIO/entrega-ci-cd/actions)

API mínima en Node.js + Express que demuestra un pipeline completo de **Integración y Entrega Continua**, con **Spec Driven Development** como metodología.

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
│   └── saludo.md             ← Spec con criterios de aceptación (SDD)
├── src/
│   └── app.js                ← Implementación
├── tests/
│   └── saludo.test.js        ← Tests automatizados (1 por criterio)
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

# 4. Probar el endpoint
curl http://localhost:3000/saludo
curl "http://localhost:3000/saludo?nombre=Profesor"
curl http://localhost:3000/health
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
5. **Test**: Jest ejecuta los 6 tests derivados de la spec
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
