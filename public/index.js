import * as THREE from "../three/build/three.module.js";

//For calculating xyz from lat and long:
function vectPosFromLatLonRad(lat,lon,radius){
    let phi   = (90-lat)*(Math.PI/180);
    let theta = (lon+180)*(Math.PI/180);
    let x = -((radius) * Math.sin(phi)*Math.cos(theta));
    let z = ((radius) * Math.sin(phi)*Math.sin(theta));
    let y = ((radius) * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

//For calculating xyz from lat and long:
function arrPosFromLatLonRad(lat,lon,radius){
    let phi   = (90-lat)*(Math.PI/180);
    let theta = (lon+180)*(Math.PI/180);
    let x = -((radius) * Math.sin(phi)*Math.cos(theta));
    let z = ((radius) * Math.sin(phi)*Math.sin(theta));
    let y = ((radius) * Math.cos(phi));
    return [x,y,z];
}



let iceAnimationState = false;
let iceAnimationDelay = 0;
let animationButton = document.getElementById('animate');
animationButton.addEventListener("click", animateIce);

function animateIce(){
    iceAnimationState = !iceAnimationState;
    if(iceAnimationState == false){
        animationButton.innerText ="Play Animation";
    }else{
        animationButton.innerText ="Pause Animation";
    }
}

function playIceAnimation(){
    if(iceAnimationState == true && iceAnimationDelay%10 == 0){
        dateIncrement();
    }
    iceAnimationDelay++;
}

const zeroPad = (num, places) => String(num).padStart(places, '0')
//3JS scene:
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("three").appendChild( renderer.domElement );

var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })
var blackMaterial = new THREE.MeshPhongMaterial( {
    color: 0xff0000,
    polygonOffset: true,
    polygonOffsetFactor: 1, // positive value pushes polygon further away
    polygonOffsetUnits: 1
} );
const greenMaterial = new THREE.LineBasicMaterial({
	color: 0x00ff00,
	linewidth: 5,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin:  'round' //ignored by WebGLRenderer

});
const whiteMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff,
	linewidth: 5,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin:  'round' //ignored by WebGLRenderer

});

const lineMaterial = new THREE.LineBasicMaterial( {
	color: 0xffffff,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin:  'round' //ignored by WebGLRenderer
} );


let countryData; 
async function fetchBorderJSON() {
    const response = await fetch('http://localhost:3000/border-data');
    const countryData = await response.json();
    return countryData;
}
await fetchBorderJSON().then(data => {
    countryData = data;
});

let iceDate = {"year": 1978, "month": 11, "monthString" : "November"};
let iceData;
async function fetchIceJSON(dateString) {
    const response = await fetch('http://localhost:3000/ice-data/'+dateString);
    const iceData = await response.json();
    return iceData;
}
await fetchIceJSON(iceDate.year +""+iceDate.month).then(data => {
    iceData = data;
});

let iceObjs = [];
let iceIndex = {"index": 0, "start" : 0, "end": 0, "previous": 0}

function dateIncrement(){
    iceIndex.previous = iceIndex.start;
    let dateDisplay = document.getElementById("date");
    iceIndex.index++;
    iceIndex.start = iceIndex.end;
    iceDate.month++;
    if(iceDate.month >12){
        iceDate.year++;
        iceDate.month = 1;
    }
    fetchIceJSON(iceDate.year +""+zeroPad(iceDate.month,2)).then(data => {
        iceData = data;
    });

    switch(iceDate.month){
        case 1: iceDate.monthString =  "January";       break;
        case 2: iceDate.monthString =  "February";      break;
        case 3: iceDate.monthString =  "March";     break;
        case 4: iceDate.monthString =  "April";     break;
        case 5: iceDate.monthString =  "May";       break;
        case 6: iceDate.monthString =  "June";      break;
        case 7: iceDate.monthString =  "July";      break;
        case 8: iceDate.monthString =  "August";        break;
        case 9: iceDate.monthString =  "September";     break;
        case 10: iceDate.monthString = "October";       break;
        case 11: iceDate.monthString = "November";      break;
        case 12: iceDate.monthString = "December";      break;
    }

    dateDisplay.innerText = iceDate.monthString + " " + iceDate.year;

    for(let ice of iceData.features){
        for(let boundaries of ice.geometry.coordinates){
            const points = [];
            for(let point of boundaries){
                points.push(vectPosFromLatLonRad(point[1], point[0], 100));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints( points );
            const line = new THREE.Line( geometry, whiteMaterial );
            const iceObj = new THREE.Line(geometry, whiteMaterial);
            iceObjs.push(iceObj)
            iceIndex.end++;
        }
    }
}
function displayIce(){

     for(let i = iceIndex.previous; i < iceIndex.end; i++){
        scene.remove(iceObjs[i]);
     }

    for(let i = iceIndex.start; i < iceIndex.end; i++){
        scene.add(iceObjs[i]);
    }
}

//Background sphere and wireframe display options:
var sphereGeometry = new THREE.SphereGeometry( 99.9, 24, 24 );
var sphereBackground = new THREE.Mesh( sphereGeometry, blackMaterial );
scene.add( sphereBackground );
//sphereBackground.add( wireframe );
//Display the countries:
for(let country of countryData.features){
    //console.log(country.properties.ADMIN);
    //console.log(country);
    for(let boundaries of country.geometry.coordinates){
        for(let boundary of boundaries){
            //console.log(boundary.type);
            if(country.geometry.type == "MultiPolygon"){
                const points = [];
                for(let point of boundary){
                    points.push(vectPosFromLatLonRad(point[1], point[0], 100));
                }
                const geometry = new THREE.BufferGeometry().setFromPoints( points );
                const line = new THREE.Line( geometry, greenMaterial );
                scene.add(line);
            }
            else{
                const points = [];
                for(let point of boundaries){
                    points.push(vectPosFromLatLonRad(point[1], point[0], 100));
                }
                const geometry = new THREE.BufferGeometry().setFromPoints( points );
                const line = new THREE.Line( geometry, greenMaterial );

                scene.add(line);
            }
        }
    }
}

let mouseTrack = {"x":0, "y":0};
function onMouseMove(e){
    mouseTrack.x = e.clientX - window.innerWidth/2;  
    mouseTrack.y = e.clientY - window.innerHeight/2;

    if(Math.abs(mouseTrack.x) < 200){
        mouseTrack.x = 0;
    }
    if(Math.abs(mouseTrack.y) < 200){
        mouseTrack.y = 0;
    }
}

//console.log(countryPoints);
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
//Set the camera position and direction:
camera.up = new THREE.Vector3(0,1,0);
//controls.update() must be called after any manual changes to the camera's transform
let orbitAngle = {"x":0, "y":80, "radius": 300};
function onScroll(event){
    if(event.wheelDeltaY < 0){
        if(orbitAngle.radius > 200){
            orbitAngle.radius-=10;
        }
    }
    if(event.wheelDeltaY > 0){
        if(orbitAngle.radius < 400){
            orbitAngle.radius+=10;
        }
    }
}
function cameraPosition(){
    orbitAngle.x -= mouseTrack.x/1000;
    orbitAngle.y -= mouseTrack.y/1000;
    orbitAngle.y = Math.max(-85, Math.min(85, orbitAngle.y));

    let lat = Math.max(-85, Math.min(85, orbitAngle.y));
    let phi = THREE.Math.degToRad(90 - lat);
    let theta = THREE.Math.degToRad(orbitAngle.x);
    
    camera.position.x = orbitAngle.radius * Math.sin( phi ) * Math.cos( theta );
    camera.position.y = orbitAngle.radius * Math.cos( phi );
    camera.position.z = orbitAngle.radius * Math.sin( phi ) * Math.sin( theta );
}

function init(){
    dateIncrement();
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mousewheel', onScroll, false );
    document.addEventListener( 'click', dateIncrement, false );
}

function animate() {
    requestAnimationFrame(animate);
    cameraPosition();
    camera.lookAt(0,0,0);
    renderer.render( scene, camera );
    displayIce();
    playIceAnimation();

}

//Window resize event handler:
function onWindowResize(event) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

init();
animate();