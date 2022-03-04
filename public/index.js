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

function cartDist(x1,y1,z1,x2,y2,z2){
    var a = x2 - x1;
    var b = y2 - y1;
    var c = z2 - z1;
    return Math.sqrt(a * a + b * b + c * c);
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
} );

var transparentMaterial = new THREE.MeshStandardMaterial( {
    color: 0x111111,
    opacity: 0.1,
    depthWrite : false,
} );

var cursorMaterial = new THREE.MeshStandardMaterial( {
    color: 0xff0000,
    opacity: 1,
    wireframe: true,
    depthTest: false
} );

var radarMaterial = new THREE.MeshStandardMaterial( {
    color: 0x888888,
    opacity: .1,
    depthWrite: false
} );

const borderMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff,
	linewidth: 1,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin:  'round' //ignored by WebGLRenderer

});
const whiteMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff,
	linewidth: 1,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin:  'round' //ignored by WebGLRenderer

});

const lineMaterial = new THREE.LineBasicMaterial( {
	color: 0xffffff,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin:  'round' //ignored by WebGLRenderer
} );

const backgroundLight = new THREE.AmbientLight( 0x777777 ); // soft white light
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
let worldRadius = 100;
let pointLocations = [];
let points = [];

let pointObjs = [];
let colors = [];
let startingColors;

const color = new THREE.Color();
for(let point of pointData.features){
    let elevation = point.properties.elevation /1000;
    //console.log(elevation);
    if(!point.properties.continent && point.geometry.coordinates[0] != -180){
        let pointCoords = arrPosFromLatLonRad(point.geometry.coordinates[1], point.geometry.coordinates[0], worldRadius + elevation);
        pointLocations.push(pointCoords[0], pointCoords[1], pointCoords[2]);


        pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
        color.setRGB(0, 1-Math.abs(elevation)/5, 1-Math.abs(elevation/10));
        colors.push(color.r, color.g, color.b);
    }

    if(point.properties.sovereignt){
        let pointCoords = arrPosFromLatLonRad(point.geometry.coordinates[1], point.geometry.coordinates[0], worldRadius + elevation/10);
        pointLocations.push(pointCoords[0], pointCoords[1], pointCoords[2]);

        pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
        color.setRGB(elevation, Math.sqrt(elevation), Math.sqrt(elevation/2));
        colors.push(color.r, color.g, color.b);
    }

    // if(point.properties.continent == "North America"){
    //     pointLocations.push(pointCoords);
    //     pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
    //     color.setRGB(0,.5,0);
    //     colors.push(color.r, color.g, color.b);
    // }
    // if( point.properties.sovereignt 
    //     && point.properties.sovereignt !== "Ukraine"
    //     && point.properties.sovereignt !== "Russia"
    //     && point.properties.sovereignt !== "Belarus"
    //     ){
    //         pointLocations.push(pointCoords);
    //         pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
    //         color.setRGB(.5,.5,.5);
    //         colors.push(color.r, color.g, color.b);
    // }
    // if( point.properties.sovereignt == "Russia"
    //     || point.properties.sovereignt == "Belarus"
    //     ){
    //         pointLocations.push(pointCoords);
    //         pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
    //         color.setRGB(1,0,0);
    //         colors.push(color.r, color.g, color.b);
    // }
    // if( point.properties.sovereignt == "Ukraine"
    //     ){
    //     pointLocations.push(pointCoords);
    //     pointObjs.push(pointCoords[0], pointCoords[1], pointCoords[2])
    //     color.setRGB(1,1,0);
    //     colors.push(color.r, color.g, color.b);
    // }
}
startingColors = colors;

let pointMaterial = new THREE.PointsMaterial( { size: 1, vertexColors: true } );
function changePointColor(index, r, g, b){
    colors[index] = r;
    colors[index+1] =  g;
    colors[index+2] = b;

    // for(let i = 0; i < 2000; i+=3){
    //     //console.log(colors[i]);
    //     colors[i] = 1;
    //     colors[i+1] = 0;
    //     colors[i+2] = 1;
    // }
    pointGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );    
    pointObjs.material = pointMaterial;
}

const pointGeometry = new THREE.BufferGeometry();
pointGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pointObjs, 3 ) );
pointGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
pointObjs = new THREE.Points(pointGeometry, pointMaterial);
scene.add(pointObjs);



//Background sphere and wireframe display options:
let sphereGeometry = new THREE.SphereGeometry( 90, 24, 24 );
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
                    const line = new THREE.Line( geometry, borderMaterial );
                    scene.add(line);
                }
                else{
                    const points = [];
                    for(let point of boundaries){
                        points.push(vectPosFromLatLonRad(point[1], point[0], 100));
                    }
                    const geometry = new THREE.BufferGeometry().setFromPoints( points );
                    const line = new THREE.Line( geometry, borderMaterial );

                    scene.add(line);
                }
            }
        }
    }
}

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
        if(orbitAngle.radius > 150){
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
scene.add( raycastSphere );
raycastSphere.visible = false;
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 3;
const pointer = new THREE.Vector2();
let intersectionStatus = false;
let pointStatus = false;
let selectedPoint;

let rayCursor = {"x": 0, "y":0, "z": 0};
function raycast(){
    raycaster.setFromCamera( pointer, camera );
	const sphereIntersection = raycaster.intersectObject( raycastSphere );
    if(sphereIntersection.length == 0){
        intersectionStatus = false;
    }
    else{
        intersectionStatus = true;
        for (let intersect of sphereIntersection){
            // rayCursor.x = intersect.point.x;
            // rayCursor.y = intersect.point.y;
            // rayCursor.z = intersect.point.z;
            //console.log(intersect.distance);
            //console.log(intersect.point);
        }
    }
    const pointIntersections = raycaster.intersectObject( pointObjs );

    if(pointIntersections.length == 0){
        pointStatus = false;
        //console.log(pointIntersections);
    }
    else{
        let lastPointIndex;
        let currentIndex;

        pointStatus = true;
        intersectionStatus = true;
        //console.log(pointIntersections);
        for (let intersect of pointIntersections){
            let cameraDist = cartDist(pointLocations[intersect.index], pointLocations[intersect.index+1],  pointLocations[intersect.index+2], camera.position.x, camera.position.y, camera.position.z)

            console.log(Math.abs(cameraDist));
            if(cameraDist < 150){
            rayCursor.x = pointLocations[intersect.index*3];
            rayCursor.y = pointLocations[intersect.index*3+1];
            rayCursor.z = pointLocations[intersect.index*3+2];
            }
        }
    }

}



//Background sphere and wireframe display options:
let cursorGeometry = new THREE.SphereGeometry(1, 4, 2 );
let sphereCursor = new THREE.Mesh( cursorGeometry, cursorMaterial );
scene.add( sphereCursor );

const cursorLight = new THREE.PointLight( 0xffffff, 1, 100 );
scene.add( cursorLight );

function displayRaycast(){
    if(intersectionStatus == true){
        sphereCursor.visible = true;
        let material = new THREE.MeshStandardMaterial( { 
            color: 0xffffff,
            opacity: 0.8,
            wireframe: true,
            depthTest: false
        } );
        sphereCursor.material = material;
        sphereCursor.lookAt(0,0,0);
        sphereCursor.position.x = rayCursor.x;
        sphereCursor.position.y = rayCursor.y;
        sphereCursor.position.z = rayCursor.z;
    }
    else{
        sphereCursor.visible = false;
    }
}


// const axesHelper = new THREE.AxesHelper( 200 );
// scene.add( axesHelper );

function clickInteraction(){
    if(placeRadar == true){
        let geometry = new THREE.BoxGeometry( 2, 2, 2 );
        let material = new THREE.MeshBasicMaterial( { color: 0x00ffff} );
        let cube = new THREE.Mesh( geometry, material );
        cube.position.x = rayCursor.x;
        cube.position.y = rayCursor.y;
        cube.position.z = rayCursor.z;

        cube.lookAt(0,0,0);
        cube.translateZ(5);

        scene.add( cube );


        let radarGeometry = new THREE.SphereGeometry(20, 24, 24 );
        let currRadar = new THREE.Mesh( radarGeometry, radarMaterial ); 
        currRadar.position.x = rayCursor.x;
        currRadar.position.y = rayCursor.y;
        currRadar.position.z = rayCursor.z;
        currRadar.lookAt(0,0,0);
        currRadar.translateZ(8);

        currRadar.castShadow = false;
        currRadar.receiveShadow = false;

        scene.add(currRadar);
    }
}



function animate() {
    requestAnimationFrame(animate);
    cameraPosition();
    camera.lookAt(0,0,0);

    raycast();
    displayRaycast();

    displayIce();
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
    dateIncrement();
    window.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mousewheel', onScroll, false );
    document.addEventListener( 'click', clickInteraction, false );
    
}

init();
animate();