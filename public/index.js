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


let countryData; //A variable that will hold the countries.geojson file
//async function for retrieving the geoJSON country file:
async function fetchJSON() {
    const response = await fetch('http://localhost:3000/country-data');
    const countryData = await response.json();
    return countryData;
}
await fetchJSON().then(data => {
    countryData = data;
});


//3JS scene:
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const countryPoints =   { "data":
                            [
                                {
                                    "country" : "name",
                                    "geometryLatLon" : [],
                                    "geometryXYZ" : [],
                                }
                            ]
                        }


var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })
var blackMaterial = new THREE.MeshPhongMaterial( {
    color: 0xff0000,
    polygonOffset: true,
    polygonOffsetFactor: 1, // positive value pushes polygon further away
    polygonOffsetUnits: 1
} );



var sphereGeometry = new THREE.SphereGeometry( 99.9, 24, 24 );

var sphereBackground = new THREE.Mesh( sphereGeometry, blackMaterial );
var wireframe = new THREE.LineSegments( sphereGeometry, wireframeMaterial );
scene.add( sphereBackground );
//sphereBackground.add( wireframe );

const material = new THREE.LineBasicMaterial({
	color: 0xffffff
});
for(let country of countryData.features){
    countryPoints.data[countryPoints.length] = country.properties.ADMIN;
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
                const line = new THREE.Line( geometry, material );
                scene.add(line);
            }
            else{
                const points = [];
                for(let point of boundaries){
                    points.push(vectPosFromLatLonRad(point[1], point[0], 100));
                }
                const geometry = new THREE.BufferGeometry().setFromPoints( points );
                const line = new THREE.Line( geometry, material );
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
//controls.update() must be called after any manual changes to the camera's transform
let orbitAngle = {"x":0, "y":0, "radius": 300};

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
    
    console.log(orbitAngle.radius);
}

//Set the camera position and direction:
camera.up = new THREE.Vector3(0,1,0);

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

function animate() {
    requestAnimationFrame( animate );
    //sphereBackground.rotation.y +=0.001;
    camera.lookAt(0,0,0);
    renderer.render( scene, camera );
    window.addEventListener('resize', onWindowResize, false);
    cameraPosition();
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mousewheel', onScroll, false );


};

//Window resize event handler:
function onWindowResize(event) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}


animate();