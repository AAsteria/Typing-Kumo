const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');

const app = express();
const PORT = 3000;

// Serve static files from the TypingGame folder
app.use(express.static(path.join(__dirname)));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
