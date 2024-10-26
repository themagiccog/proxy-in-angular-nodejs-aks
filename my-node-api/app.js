const express = require('express');
const app = express();
const port = 3000;

const cors = require('cors');
app.use(cors());

app.get('/api', (req, res) => {
  res.send('api-home');
});

app.get('/api/hello', (req, res) => {
  res.send('hello-world-there');
});

app.listen(port, () => {
  console.log(`API is running on http://localhost:${port}`);
});
