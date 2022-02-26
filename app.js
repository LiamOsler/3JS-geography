//Node imports:
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const fs = require('fs');

//Load the JSON data:
let borderData = fs.readFileSync('public/data/countries_low_res.geojson');
let borderObj = JSON.parse(borderData);

function iceData(fileString){
  fileString = "public/data/arctic_ice/extent_N_"+fileString+"_geo.json";
  let iceData = fs.readFileSync(fileString);
  let iceObj = JSON.parse(iceData);
  return iceObj;
}

app.use('/public', express.static('public'));
app.use('/three/', express.static('node_modules/three/'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/version', (req, res) => {
  const myVersion = 'My version is 0.5';
  res.json(myVersion);
});

app.get('/border-data', (req, res) => {
  res.json(borderObj);
});

app.get('/ice-data/:query', (req, res) => {
  let reqDate = req.params;
  console.log(req.params);
  res.json(iceData(reqDate.query));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});