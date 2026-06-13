// src/public/app.js
// Frontend del piano. Sintetiza sonido con la Web Audio API (sin archivos
// de audio). Las notas se piden a /api/notes, que es la misma fuente de
// verdad que usan los tests (src/piano.js).

const pianoEl = document.getElementById('piano');
const statusEl = document.getElementById('status');
const waveformEl = document.getElementById('waveform');
const volumeEl = document.getElementById('volume');
const labelsEl = document.getElementById('labels');

// AudioContext se crea perezosamente tras la primera interacción del usuario
// (los navegadores bloquean el audio hasta que hay un gesto).
let audioCtx = null;
let masterGain = null;

// Notas que están sonando ahora mismo: nombre -> { osc, gain }
const active = new Map();
// Índice rápido: tecla del teclado -> nodo <button> de esa nota
const keyToButton = new Map();

// Teclados en español no tienen ";" en esa posición: la tecla física es "ñ".
// Mapeamos teclas alternativas a la tecla "oficial" de la nota.
const KEY_ALIASES = { ñ: ';' };

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = volumeEl.value / 100;
  masterGain.connect(audioCtx.destination);
}

function startNote(note, buttonEl) {
  ensureAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (active.has(note.name)) return; // ya suena (evita re-disparo)

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = waveformEl.value;
  osc.frequency.value = note.freq;

  // Envolvente ataque/sostenido: subida rápida para que no "cliquee".
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.9, now + 0.012);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();

  active.set(note.name, { osc, gain });
  if (buttonEl) buttonEl.classList.add('is-active');

  statusEl.textContent = `${note.name} · ${note.freq} Hz`;
  statusEl.classList.add('is-playing');
}

function stopNote(note, buttonEl) {
  const voice = active.get(note.name);
  if (!voice) return;

  const now = audioCtx.currentTime;
  // Release corto para evitar el "pop" al cortar.
  voice.gain.gain.cancelScheduledValues(now);
  voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
  voice.gain.gain.linearRampToValueAtTime(0, now + 0.08);
  voice.osc.stop(now + 0.1);

  active.delete(note.name);
  if (buttonEl) buttonEl.classList.remove('is-active');

  if (active.size === 0) {
    statusEl.classList.remove('is-playing');
  }
}

function renderPiano(notes) {
  pianoEl.innerHTML = '';
  notes.forEach((note) => {
    const btn = document.createElement('button');
    btn.className = `key ${note.isBlack ? 'key--black' : 'key--white'}`;
    btn.dataset.note = note.name;
    btn.setAttribute('aria-label', `${note.name}, tecla ${note.key}`);

    const label = document.createElement('span');
    label.className = 'key__label';
    label.textContent = note.key === ';' ? 'ñ/;' : note.key;
    btn.appendChild(label);

    // Mouse / touch: presionar = suena, soltar/salir = corta.
    btn.addEventListener('mousedown', () => startNote(note, btn));
    btn.addEventListener('mouseup', () => stopNote(note, btn));
    btn.addEventListener('mouseleave', () => stopNote(note, btn));
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startNote(note, btn);
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopNote(note, btn);
    });

    keyToButton.set(note.key, { note, btn });
    pianoEl.appendChild(btn);
  });
}

// ---- Teclado de la computadora ----
function resolveKey(e) {
  const k = e.key.toLowerCase();
  return KEY_ALIASES[k] || k;
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return; // ignorar auto-repeat al mantener apretado
  const entry = keyToButton.get(resolveKey(e));
  if (entry) {
    e.preventDefault();
    startNote(entry.note, entry.btn);
  }
});

window.addEventListener('keyup', (e) => {
  const entry = keyToButton.get(resolveKey(e));
  if (entry) {
    e.preventDefault();
    stopNote(entry.note, entry.btn);
  }
});

// ---- Controles ----
volumeEl.addEventListener('input', () => {
  if (masterGain) masterGain.gain.value = volumeEl.value / 100;
});

labelsEl.addEventListener('change', () => {
  document
    .querySelectorAll('.key__label')
    .forEach((el) => (el.style.visibility = labelsEl.checked ? 'visible' : 'hidden'));
});

// ---- Arranque: pedir las notas a la API ----
async function init() {
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderPiano(data.notes);
  } catch (err) {
    statusEl.textContent = `No se pudieron cargar las notas: ${err.message}`;
  }
}

init();
