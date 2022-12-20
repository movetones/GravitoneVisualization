/*

Laser Pointer Demo

This THREE.js model renders a Gravitone at the center of a musical arena
and equips the user with a laser pointer to aim at note positions on a 
blank staff background.

Matt Ruffner 2022
MoveTones, LLC

*/
import { OBJLoader} from 'https://unpkg.com/three@0.119.1/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.119.1/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'https://unpkg.com/three@0.119.1/build/three.module.js';


let camera, scene, renderer, controls, group, line;


// instantiate a loader
const loader = new OBJLoader();

// load a resource
loader.load(
	// resource URL
	'3dmodels/Gravitone.obj',
	// called when resource is loaded
	function ( object ) {
    var i = 0;
    object.traverse( function (obj) {
      if (obj.isMesh){
        obj.material = new THREE.MeshPhysicalMaterial({ color: 0xFFB620 });
        // hacky way to color parts of the Gravitone OBJ CAD model
        if (i==0) obj.material.color.set(0xFFB620);
        if (i==1) obj.material.color.set(0xFFB620);
        if (i==2) obj.material.color.set(0x1015FF);
        i++;
        obj.position.sub(new THREE.Vector3(10.5, 0, -2.2));
      }
    } );
		group.add( object );
		//group.position.set(0,0,0);
	  //group.translatex(-15);
    //group.translateY(-5);

	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);


const createWorld = () => {
  group = new THREE.Group();
  
  var surroundingCylinder = new THREE.CylinderGeometry(25, 25, 20, 100, 1, true);
  var materialOuter = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load("images/blankstaff.png")
  });
  var materialInner = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load("images/blankstaff.png"),
    side: THREE.BackSide
  });

  var meshOuter = new THREE.Mesh(surroundingCylinder, materialOuter);
  var meshInner = new THREE.Mesh(surroundingCylinder, materialInner);
  meshOuter.add(meshInner);
  scene.add(meshOuter);

  const axesHelper = new THREE.AxesHelper( 4 );

  scene.add( axesHelper );
  scene.add(group);
  
  camera.lookAt(group.position);
};

const init = () => {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000.0);
  camera.position.set(-5, 5, 7);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);

  const light =  new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );

  scene.add(light);

  const amlight = new THREE.AmbientLight( 0xdddddd ); // soft white light
  scene.add(amlight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  
  createWorld();
}

const animate = () => {
  requestAnimationFrame(animate);
  
  controls.update();

  renderer.render(scene, camera); 
}

init();
animate();

var exampleSocket = new WebSocket("ws://localhost:5678/");
var lp = 0;

exampleSocket.onmessage = function(event) {
  console.log(event.data)
  var jsonObj = JSON.parse(event.data);
  
  if ( !jsonObj.hasOwnProperty("data") ){
    /*if( jsonObj.b2 ){
      group.children[1].material.color.setHex(0xaa1919);
    } else {
     group.children[1].material.color.setHex(0xff9999);
    }*/
    return;
  } 
  
  jsonObj = jsonObj.data;

  // You'll need to edit the order of the quaternions below so that the 3D object matches up with your sensor.
  var targetQuaternion = new THREE.Quaternion(jsonObj.quat_z, jsonObj.quat_y, jsonObj.quat_w, jsonObj.quat_x);       
 // mesh.quaternion.slerp(targetQuaternion, 1);
  
  var q0 = jsonObj.quat_w;
  var q1 = jsonObj.quat_x;
  var q2 = jsonObj.quat_y;
  var q3 = jsonObj.quat_z;
  
  var q2sqr = q2 * q2;

  // roll (x-axis rotation)
  var t0 = +2.0 * (q0 * q1 + q2 * q3);
  var t1 = +1.0 - 2.0 * (q1 * q1 + q2sqr);
  //roll = Math.atan2(t0, t1);

  // pitch (y-axis rotation)v.lengthSq is not a function
  var t2 = +2.0 * (q0 * q2 - q3 * q1);
  t2 = t2 > 1.0 ? 1.0 : t2;
  t2 = t2 < -1.0 ? -1.0 : t2;
  //pitch = Math.asin(t2);

  // yaw (z-axis rotation)
  var t3 = +2.0 * (q0 * q3 + q1 * q2);
  var t4 = +1.0 - 2.0 * (q2sqr + q3 * q3);
  //yaw = Math.atan2(t3, t4);
  
  group.quaternion.slerp(targetQuaternion, 1);
  
  //group.quaternion.raycast({raycaster: raycaster});
  

  var startPos = new THREE.Vector3(0, 0, 0);
  var distance = 100;
  var direction = new THREE.Vector3(-1,0,0);
  direction.applyQuaternion(targetQuaternion);

  var newPos = new THREE.Vector3();
  newPos.addVectors ( startPos, direction.multiplyScalar( distance ) );
  
  scene.remove( line );
  
  var geometry = new THREE.Geometry();
  geometry.vertices.push( startPos );
  geometry.vertices.push( newPos );
  var material = new THREE.LineBasicMaterial( { color : 0xff0000, linewidth: 4 } );
  line = new THREE.Line( geometry, material );
  
  scene.add( line );
  
  
  renderer.render(scene, camera);
}
