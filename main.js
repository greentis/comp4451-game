import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
// Animation loop
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

//
// Camera
//

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 20;
// camera.position.set(x, y, z);
// camera.up.set(x, y, z);
// camera.lookAt(x, y, z);

//
// Light
//

const light = new THREE.PointLight(0xCC7733, 1000);
light.position.z = 10;
scene.add(light);


//
// Render map
//
const map = new THREE.Object3D();
scene.add(map);


const geometry = new THREE.CylinderGeometry(
    5,5,2,6
);
for (var j = -3; j <= 3; j++){
    for (var i = -3; i <= 3; i++){
        const material = new THREE.MeshPhongMaterial({emissive:0x000000});
        const tile = new THREE.Mesh(geometry,material);
        tile.scale.set(0.2, 0.2, 0.2);
        tile.position.x = i * 0.9;
        tile.position.z = j * 3.6;
        if (i % 2 == 0) tile.position.z += 1.8;
        
        map.add(tile);
    }
}





function animate() {
    // x rolls towards camera
	map.rotation.x = Math.PI * 0.2;
    // y turns anticlockwise
	map.rotation.y += 0.001;

	renderer.render( scene, camera );

}