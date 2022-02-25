//Node imports:
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const fs = require('fs');

//Load the JSON data:
let data = fs.readFileSync('public/data/countries2.geojson');
let dataObj = JSON.parse(data);

app.use('/public', express.static('public'));
app.use('/three/', express.static('node_modules/three/'));

app.get('/', (req, res) => {

  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/version', (req, res) => {
  const myVersion = 'My version is 0.5';
  res.json(myVersion);
});

app.get('/country-data', (req, res) => {
  res.json(dataObj);
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});