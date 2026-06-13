// tests/piano.test.js
// Tests derivados de SPEC-004-piano.
const request = require('supertest');
const app = require('../src/app');
const { noteFrequency, getNotes, A4_FREQ } = require('../src/piano');

describe('SPEC-004-piano: lógica de notas (temperamento igual)', () => {
  // CA-2
  test('CA-2: A4 (0 semitonos) es exactamente 440 Hz', () => {
    expect(noteFrequency(0)).toBe(A4_FREQ);
    expect(noteFrequency(0)).toBe(440);
  });

  // CA-2
  test('CA-2: subir 12 semitonos duplica la frecuencia (una octava)', () => {
    expect(noteFrequency(12)).toBeCloseTo(880, 1);
    expect(noteFrequency(-12)).toBeCloseTo(220, 1);
  });

  // CA-2
  test('CA-2: C5 suena al doble de frecuencia que C4', () => {
    const notes = getNotes();
    const c4 = notes.find((n) => n.name === 'C4');
    const c5 = notes.find((n) => n.name === 'C5');
    expect(c5.freq).toBeCloseTo(c4.freq * 2, 1);
  });
});

describe('SPEC-004-piano: definición del teclado', () => {
  const notes = getNotes();

  // CA-3
  test('CA-3: el teclado tiene 17 teclas (C4 a E5)', () => {
    expect(notes).toHaveLength(17);
  });

  // CA-3
  test('CA-3: hay 10 teclas blancas y 7 negras', () => {
    const blancas = notes.filter((n) => !n.isBlack);
    const negras = notes.filter((n) => n.isBlack);
    expect(blancas).toHaveLength(10);
    expect(negras).toHaveLength(7);
  });

  // CA-4
  test('CA-4: cada nota tiene name, freq>0, key e isBlack', () => {
    notes.forEach((n) => {
      expect(typeof n.name).toBe('string');
      expect(n.freq).toBeGreaterThan(0);
      expect(typeof n.key).toBe('string');
      expect(typeof n.isBlack).toBe('boolean');
    });
  });

  // CA-4
  test('CA-4: las teclas del teclado de la compu son únicas', () => {
    const keys = notes.map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('SPEC-004-piano: API /api/notes', () => {
  // CA-1
  test('CA-1: GET /api/notes responde 200 con un array de notas', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.notes)).toBe(true);
    expect(res.body.notes.length).toBe(17);
  });

  // CA-1
  test('CA-1: la respuesta de la API coincide con getNotes()', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.body.notes).toEqual(getNotes());
  });

  // CA-5
  test('CA-5: la raíz "/" sirve el HTML del piano', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('<title>Piano');
  });
});
