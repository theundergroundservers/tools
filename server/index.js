const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(require('cors')());

// Path to your CSV file
const dataPath = path.join('../data', 'data.json');

// GET endpoint to serve the CSV file
app.get('/api/raw', (req, res) => {
  res.download(dataPath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send(err);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});