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

const globeRadius = 105;

function latLonFromXYZ(x, y, z){

    let phi = Math.acos(z/globeRadius);
    let theta = Math.asin(y/globeRadius*Math.sin(phi))
    let lat = theta*(180/Math.PI);
    let lon = (90 - phi*(180/Math.PI))

    return [lat, lon];
}

function eulerAngFromXYZ(x, y, z){

    let phi = Math.acos(z/globeRadius);
    let theta = Math.asin(y/globeRadius*Math.sin(phi))

    return [phi, theta];
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
renderer.setClearColor( 0x111111, 1 );
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("three").appendChild( renderer.domElement );

var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })
var blackMaterial = new THREE.MeshStandardMaterial( {
    color: 0x222222,
    opacity: 1
    // polygonOffset: true,
    // polygonOffsetFactor: 1, // positive value pushes polygon further away
    // polygonOffsetUnits: 1
} );

var transparentMaterial = new THREE.MeshStandardMaterial( {
    color: 0x111111,
    opacity: 0,
    depthWrite : false
    // polygonOffset: true,
    // polygonOffsetFactor: 1, // positive value pushes polygon further away
    // polygonOffsetUnits: 1
} );

var cursorMaterial = new THREE.MeshStandardMaterial( {
    color: 0xffffff,
    opacity: 1
    // polygonOffset: true,
    // polygonOffsetFactor: 1, // positive value pushes polygon further away
    // polygonOffsetUnits: 1
} );

var radarMaterial = new THREE.MeshStandardMaterial( {
    color: 0x00ff00,
    opacity: .1,
    wireframe: true
    // polygonOffsetFactor: 1, // positive value pushes polygon further away
    // polygonOffsetUnits: 1
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

const backgroundLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( backgroundLight );


let countryData; 
async function fetchBorderJSON() {
    const response = await fetch('http://localhost:3000/border-data');
    const countryData = await response.json();
    return countryData;
}
await fetchBorderJSON().then(data => {
    countryData = data;
});

let pointData; 
async function fetchPointJSON() {
    const response = await fetch('http://localhost:3000/point-data');
    const pointData = await response.json();
    return pointData;
}
await fetchPointJSON().then(data => {
    pointData = data;
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
    if(iceDate.year > 1992){
        iceDate.year =1980;
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
let pointObjs = [];
function displayPoints(){
    for(let point of pointData.features){
        //console.log(point);
        if(point.properties.mapcolor7){
            let pointCoords = arrPosFromLatLonRad(point.geometry.coordinates[1], point.geometry.coordinates[0], 100)
            pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
        }
    }
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pointObjs, 3 ) );
    const pointMaterial = new THREE.PointsMaterial( { color: 0x444444 } );

    pointObjs = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointObjs);

}



//Background sphere and wireframe display options:
let sphereGeometry = new THREE.SphereGeometry( 99.9, 24, 24 );
let sphereBackground = new THREE.Mesh( sphereGeometry, blackMaterial );
scene.add( sphereBackground );


//sphereBackground.add( wireframe );
//Display the countries:
function displayBorders(){
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
}

let radarGeometry = new THREE.SphereGeometry(20, 24, 24 );
let radarObjs = [];
let placeRadar = true;
function displayRadar(){
    // for (let radar of radarObjs){
    //     radar.display;
    // }
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
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
//Set the camera position and direction:
camera.up = new THREE.Vector3(0,1,0);
//controls.update() must be called after any manual changes to the camera's transform
let orbitAngle = {"x":0, "y":80, "radius": 300};
function onScroll(event){
    if(event.wheelDeltaY < 0){
        if(orbitAngle.radius > 200){
            orbitAngle.radius-=10;
            scene.fog.far -= 10; 
            scene.fog.near -= 10; 
        }
    }
    if(event.wheelDeltaY > 0){
        if(orbitAngle.radius < 400){
            orbitAngle.radius+=10;
            scene.fog.far += 10; 
            scene.fog.near += 10; 

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



function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

let raycastGeometry = new THREE.SphereGeometry( 105, 24, 24 );
let raycastSphere = new THREE.Mesh( raycastGeometry, transparentMaterial );
//scene.add( raycastSphere );
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let intersectionStatus = false;
let rayCursor = {"x": 0, "y":0, "z": 0};
function raycast(){
    raycaster.setFromCamera( pointer, camera );
    
	const intersections = raycaster.intersectObject( raycastSphere );

    if(intersections.length == 0){
        intersectionStatus = false;
    }

    else{
        intersectionStatus = true;
        for (let intersect of intersections){
            rayCursor.x = intersect.point.x;
            rayCursor.y = intersect.point.y;
            rayCursor.z = intersect.point.z;
            
            // console.log(intersect.distance);
            // console.log(intersect.point);
        }
    }
}


//Background sphere and wireframe display options:
let cursorGeometry = new THREE.SphereGeometry(2, 24, 24 );
let sphereCursor = new THREE.Mesh( cursorGeometry, cursorMaterial );
scene.add( sphereCursor );

const cursorLight = new THREE.PointLight( 0xffffff, 1, 100 );
scene.add( cursorLight );

function displayRaycast(){
    if(intersectionStatus == true){
        sphereCursor.visible = true;
        cursorLight.position.x = rayCursor.x;
        cursorLight.position.y = rayCursor.y;
        cursorLight.position.z = rayCursor.z;
        sphereCursor.position.x = rayCursor.x;
        sphereCursor.position.y = rayCursor.y;
        sphereCursor.position.z = rayCursor.z;
    }
    else{
        sphereCursor.visible = false;
    }
}


const axesHelper = new THREE.AxesHelper( 200 );
scene.add( axesHelper );

function clickInteraction(){

    if(placeRadar == true){

        let geometry = new THREE.BoxGeometry( 2, 2, 10 );
        let material = new THREE.MeshBasicMaterial( { color: 0x00ffff} );
        let cube = new THREE.Mesh( geometry, material );
        cube.position.x = rayCursor.x;
        cube.position.y = rayCursor.y;
        cube.position.z = rayCursor.z;
        let rotation = eulerAngFromXYZ( cube.position.x,  cube.position.z, cube.position.y);

        // cube.rotation.y = -rotation[1] - Math.PI/2;
        // cube.rotation.z = -rotation[0];
        cube.lookAt(0,0,0);

        // cube.rotation.y = rotation[1];
        console.log(rotation);
        
        // // cube.rotation.x = rotation[0];
        // cube.rotation.x = rotation[1] - Math.PI;


        scene.add( cube );



        // let currRadar = new THREE.Mesh( radarGeometry, radarMaterial ); 
        // currRadar.position.x = rayCursor.x;
        // currRadar.position.y = rayCursor.y;
        // currRadar.position.z = rayCursor.z;
        // currRadar.rotation.y = rotation[0];

        // currRadar.renderDepth = 0.5;
        // scene.add(currRadar);
    }

    //console.log(sphereCursor.position);
    //  const light = new THREE.PointLight( 0xff0000, 1, 10 );
    //  light.position.set( sphereCursor.position.x +100, sphereCursor.position.y, sphereCursor.position.z );
    //  scene.add( light );
}



function animate() {
    requestAnimationFrame(animate);
    cameraPosition();
    camera.lookAt(0,0,0);

    raycast();
    displayRaycast();

    displayRadar();

    displayIce();
    playIceAnimation();

    renderer.render( scene, camera );
}

//Window resize event handler:
function onWindowResize(event) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function init(){
    scene.fog = new THREE.Fog(0x111111, 150, 300);


    displayBorders();
    displayPoints();
    dateIncrement();
    window.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mousewheel', onScroll, false );
    document.addEventListener( 'click', clickInteraction, false );
    
}

init();
animate();