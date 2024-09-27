import * as THREE from 'three';

import {Board} from './Board.js';
import {Character} from './Character.js';
console.log("main.js loaded successfully!")

export class Game{
	constructor(){
		this.createScene();

		this.board = new Board(this);
		this.scene.add(this.board.mesh);
		
		this.player = [];
		this.player.push(new Character(1, 0, this));

		this.activateEventHandler();
		
	}

	createScene(){
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);
		
		const light = new THREE.PointLight(0xCC7733, 5000);
		light.position.z = 30;
		this.scene.add(light);

		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera.position.z = 20;
		// camera.position.set(x, y, z);
		// camera.up.set(x, y, z);
		// camera.lookAt(x, y, z);
		
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		
		
		// Animation loop
		this.renderer.setAnimationLoop(()=>{
				// x rolls towards camera
				this.board.mesh.rotation.x = Math.PI * 0.2;
				// y turns anticlockwise
				this.board.mesh.rotation.y += 0.001;
			
				this.renderer.render( this.scene, this.camera );
		});
		document.body.appendChild( this.renderer.domElement );
		
	}

	activateEventHandler(){
		//
		// Eventhandler: mouseVec selection
		//
		
		// https://www.w3schools.com/jsref/dom_obj_event.asp
		
		var raycaster = new THREE.Raycaster();
		var mouseVec = new THREE.Vector2();
		
		window.addEventListener('click', (event)=>{
			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseVec, this.camera);
		
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			for (var i = 0; i < intersects.length; i++) {
				console.log(intersects[i].object.userData.onClick());
					break;
				try {
					intersects[i].object.userData.onClick();
					break;
				} catch (error) {
					// If the object have no hovering() function
				}
			}
		}, false);
		
		var hoveringList = [];
		
		window.addEventListener('mousemove', (event)=>{
			// Do raycast to find all objects within sight
			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseVec, this.camera);
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			// Deactivate objects that is activated in previous call
			for (var i = 0; i < hoveringList.length; i++) {
				hoveringList[i].deHovering();
			}
			hoveringList = [];
		
			// Try activating the object in ascending order
			for (var i = 0; i < intersects.length; i++) {
				try {
					intersects[i].object.userData.hovering();
					hoveringList.push(intersects[i].object.userData);
					break;
				} catch (error) {
					// If the object have no hovering() function
				}
			}
		}
		, false);
		
		window.addEventListener('keypress', (event)=>{
			console.log(event.key);
		}, false);
		
	}
}

const game = new Game();