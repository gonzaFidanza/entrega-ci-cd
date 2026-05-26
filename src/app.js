// src/app.js
// Implementación de SPEC-001-saludo (ver /specs/saludo.md)
const express = require('express');

const app = express();

// CA-1, CA-2, CA-3, CA-4: endpoint de saludo
app.get('/saludo', (req, res) => {
  const nombre = req.query.nombre || 'Mundo';
  res.status(200).json({
    mensaje: `Hola ${nombre}`,
    fecha: new Date().toISOString(),
  });
});

// CA-5: health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CA-6: ruta inexistente
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Solo arranca el servidor si se ejecuta directamente (no durante los tests)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
