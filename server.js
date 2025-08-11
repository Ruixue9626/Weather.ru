// server.js
// Express server that proxies requests to WeatherAPI using the WEATHER_API_KEY env var.
// Requires Node 18+ (for global fetch). Deploy on Render and set WEATHER_API_KEY in env vars.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY;

if (!API_KEY) {
  console.error("ERROR: Please set the WEATHER_API_KEY environment variable.");
  // still start so error message is visible in logs
}

app.use(express.static(path.join(__dirname, 'public')));

// Simple weather proxy: /weather?city=Taipei
app.get('/weather', async (req, res) => {
  try {
    const city = req.query.city || 'Taipei';
    if (!API_KEY) {
      return res.status(500).json({ error: "Server missing WEATHER_API_KEY in environment." });
    }
    const q = encodeURIComponent(city);
    const url = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${q}&aqi=no`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(resp.status).json({ error: "Upstream error", details: txt });
    }
    const data = await resp.json();
    // return only needed fields
    const out = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        localtime: data.location.localtime
      },
      current: {
        temp_c: data.current.temp_c,
        is_day: data.current.is_day,
        condition: data.current.condition,
        wind_kph: data.current.wind_kph,
        humidity: data.current.humidity
      }
    };
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
