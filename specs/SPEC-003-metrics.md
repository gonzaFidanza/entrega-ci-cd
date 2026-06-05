---
id: SPEC-003
title: Métricas Prometheus
status: draft
priority: low
---

# Spec: Endpoint de métricas

## Identificador
`SPEC-003-metrics`

## Estado
📝 Draft

## Descripción
Exponer un endpoint `/metrics` en formato Prometheus para que el monitor
pueda hacer scrape de latencia, cantidad de requests y estado del proceso.

## Motivación
Habilitar observabilidad de la app desplegada en Render sin depender de
logs textuales.

---

## Criterios de aceptación

### CA-1: Endpoint disponible
**Dado** que el servidor está corriendo,
**cuando** un cliente hace `GET /metrics`,
**entonces** la respuesta debe tener código `200 OK` y `Content-Type`
`text/plain; version=0.0.4`.

### CA-2: Contadores básicos
**Dado** un request a `/metrics`,
**cuando** se procesa,
**entonces** el body debe contener al menos:
- `http_requests_total`
- `http_request_duration_seconds`
- `process_resident_memory_bytes`

### CA-3: Sin auth pública
**Dado** que `/metrics` puede exponer información interna,
**cuando** se accede desde fuera de la red privada,
**entonces** debe rechazarse con `403 Forbidden`.

---

## Historial de cambios
- **v0.1** (draft): primera versión de la spec, sin implementación.
