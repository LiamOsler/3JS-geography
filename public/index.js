import * as THREE from "../three/build/three.module.js";

//3JS scene:
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })

var blackMaterial = new THREE.MeshPhongMaterial( {
    color: 0xff0000,
    polygonOffset: true,
    polygonOffsetFactor: 1, // positive value pushes polygon further away
    polygonOffsetUnits: 1
} );

var sphereGeometry = new THREE.SphereGeometry( 1, 24, 24 );
var meshSphere = new THREE.Mesh( sphereGeometry, blackMaterial );
var wireframe = new THREE.LineSegments( sphereGeometry, wireframeMaterial );

scene.add( meshSphere );
meshSphere.add( wireframe );

var mesh = new THREE.Mesh( geometry, blackMaterial );
scene.add( mesh )
// wireframe
var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
var mat = new THREE.LineBasicMaterial( { color: 0xffffff } );
var wireframe = new THREE.LineSegments( geo, mat );
mesh.add( wireframe );

//Set the camera position and direction:
camera.up = new THREE.Vector3(0,1,0);
camera.position.y = 10;
camera.position.x = 10;

function animate() {
    requestAnimationFrame( animate );
    camera.lookAt(0, 0, 0);
    meshSphere.rotation.y +=0.001;
    mesh.rotation.x +=0.01;
    renderer.render( scene, camera );
};

animate();