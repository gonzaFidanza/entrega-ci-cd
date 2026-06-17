// src/piano.js
// Implementación de SPEC-004-piano (ver /specs/SPEC-004-piano.md)
//
// Módulo de lógica PURA: no depende de Express ni del navegador.
// Es la "fuente única de verdad" del teclado: tanto el endpoint /api/notes
// como el frontend (a través de él) consumen estos datos. Eso hace que la
// matemática de las frecuencias sea fácil de testear de forma aislada.

// Frecuencia de referencia: La4 (A4) = 440 Hz (estándar ISO 16).
const A4_FREQ = 440;

// Definición del teclado: 17 semitonos desde Do4 (C4) hasta Mi5 (E5).
// - semitones: distancia en semitonos respecto de A4 (negativo = más grave).
// - key: tecla de la computadora que dispara la nota (layout tipo Ableton).
// - isBlack: true para las teclas negras (sostenidos).
const KEYBOARD = [
  { name: 'C4', semitones: -9, key: 'a', isBlack: false },
  { name: 'C#4', semitones: -8, key: 'w', isBlack: true },
  { name: 'D4', semitones: -7, key: 's', isBlack: false },
  { name: 'D#4', semitones: -6, key: 'e', isBlack: true },
  { name: 'E4', semitones: -5, key: 'd', isBlack: false },
  { name: 'F4', semitones: -4, key: 'f', isBlack: false },
  { name: 'F#4', semitones: -3, key: 't', isBlack: true },
  { name: 'G4', semitones: -2, key: 'g', isBlack: false },
  { name: 'G#4', semitones: -1, key: 'y', isBlack: true },
  { name: 'A4', semitones: 0, key: 'h', isBlack: false },
  { name: 'A#4', semitones: 1, key: 'u', isBlack: true },
  { name: 'B4', semitones: 2, key: 'j', isBlack: false },
  { name: 'C5', semitones: 3, key: 'k', isBlack: false },
  { name: 'C#5', semitones: 4, key: 'o', isBlack: true },
  { name: 'D5', semitones: 5, key: 'l', isBlack: false },
  { name: 'D#5', semitones: 6, key: 'p', isBlack: true },
  { name: 'E5', semitones: 7, key: ';', isBlack: false },
];

/**
 * Calcula la frecuencia (Hz) de una nota a `semitones` semitonos de A4,
 * usando temperamento igual de 12 tonos: f = 440 * 2^(n/12).
 * @param {number} semitones distancia en semitonos respecto de A4
 * @returns {number} frecuencia en Hz, redondeada a 2 decimales
 */
function noteFrequency(semitones) {
  const freq = A4_FREQ * Math.pow(2, semitones / 12);
  return Math.round(freq * 100) / 100;
}

/**
 * Devuelve el teclado completo con la frecuencia ya calculada por nota.
 * @returns {Array<{name:string, freq:number, key:string, isBlack:boolean}>}
 */
function getNotes() {
  return KEYBOARD.map((n) => ({
    name: n.name,
    freq: noteFrequency(n.semitones),
    key: n.key,
    isBlack: n.isBlack,
  }));
}

module.exports = { A4_FREQ, noteFrequency, getNotes };
