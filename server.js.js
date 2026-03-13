const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Permitir llamadas desde cualquier origen (el HTML de Tutu)
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Tutu Automotores — Proxy BCRA' });
});

// Endpoint principal: GET /bcra/:cuit
app.get('/bcra/:cuit', async (req, res) => {
  const { cuit } = req.params;

  // Validar formato CUIT (solo números, 11 dígitos)
  const cuitLimpio = cuit.replace(/\D/g, '');
  if (cuitLimpio.length !== 11) {
    return res.status(400).json({ error: 'CUIT inválido. Debe tener 11 dígitos.' });
  }

  try {
    const bcraUrl = `https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${cuitLimpio}`;
    
    const response = await fetch(bcraUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TutuAutomotores/1.0'
      },
      timeout: 10000
    });

    // 404 = sin deudas registradas (situación 1 - normal)
    if (response.status === 404) {
      return res.json({ sinDeudas: true, nivel: 1 });
    }

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `El BCRA respondió con error ${response.status}` 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Error consultando BCRA:', err.message);
    res.status(500).json({ error: 'No se pudo conectar con el BCRA. Intentá de nuevo.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Tutu BCRA corriendo en puerto ${PORT}`);
});
