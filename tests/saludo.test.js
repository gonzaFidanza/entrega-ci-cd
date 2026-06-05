// tests/saludo.test.js
// Tests derivados de SPEC-001-saludo
const request = require('supertest');
const app = require('../src/app');

describe('SPEC-001-saludo: Endpoint de Saludo', () => {
  // CA-1
  test('CA-1: responde 200 al GET /saludo', async () => {
    const res = await request(app).get('/saludo');
    expect(res.statusCode).toBe(200);
  });

  // CA-2
  test('CA-2: respuesta tiene estructura correcta (mensaje y fecha)', async () => {
    const res = await request(app).get('/saludo');
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body).toHaveProperty('fecha');
    expect(typeof res.body.mensaje).toBe('string');
    // Fecha en formato ISO 8601
    expect(res.body.fecha).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  // CA-3
  test('CA-3: devuelve "Hola Mundo" por defecto', async () => {
    const res = await request(app).get('/saludo');
    expect(res.body.mensaje).toBe('Hola Mundofalla');
  });

  // CA-4
  test('CA-4: devuelve saludo personalizado con query param', async () => {
    const res = await request(app).get('/saludo?nombre=Juan');
    expect(res.body.mensaje).toBe('Hola Juan');
  });

  // CA-5
  test('CA-5: health check responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  // CA-6
  test('CA-6: ruta inexistente devuelve 404', async () => {
    const res = await request(app).get('/noexiste');
    expect(res.statusCode).toBe(404);
  });
});
