const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const fs = require('fs');


app.use('/public', express.static('public'))
app.use('/three/build', express.static('node_modules/three/build'))

let data = fs.readFileSync('public/data/countries.geojson');
let dataObj = JSON.parse(data);

console.log(dataObj);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})