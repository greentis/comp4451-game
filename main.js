import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';

import {Board} from './Board.js';
import {Character} from './Character.js';
console.log("main.js loaded successfully!")

export class Game{
	constructor(){
		this.createScene();

		this.board = new Board(this);
		this.scene.add(this.board.mesh);
		
		this.player = [];
		this.player.push(new Character(1, 0, 'Curtis', this));

		this.activateEventHandler();
	}

	createScene(){
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);
		
		this.light = new THREE.PointLight(0xAA5522, 40);
		this.light.position.y = 1;
		this.light.decay = 0.5;
		this.light.distance = 4.5;
		this.scene.add(this.light);

		this.ambientLight = new THREE.AmbientLight( 0x404050 ); // soft white light
		this.scene.add( this.ambientLight );

		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera.position.set(0, 5, 5);
		// camera.up.set(x, y, z);
		this.camera.lookAt(0, 0, 0);
		
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.screenSpacePanning = false;
		this.controls.maxPolarAngle = Math.PI / 4;
		this.controls.minPolarAngle = Math.PI / 4;
		this.controls.maxZoom = 10;

		// Animation loop
		this.renderer.setAnimationLoop(()=>{
				// x rolls towards camera
				this.board.mesh.rotation.x = Math.PI * 0;
				// y turns anticlockwise
				this.board.mesh.rotation.y = 0;
			
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
		
		var selectingList = [];

		window.addEventListener('click', (event)=>{
			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseVec, this.camera);
		
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			// Deactivate objects that is activated in previous call
			var previousObject;
			for (var i = 0; i < selectingList.length; i++) {
				selectingList[i].deselect();
				previousObject = selectingList[i];
			}
			selectingList = [];
		
			// Try activating the object in ascending order
			for (var i = 0; i < intersects.length; i++) {
				try {
					if (intersects[i].object.userData == previousObject) break;
					intersects[i].object.userData.select();
					selectingList.push(intersects[i].object.userData);
					break;
				} catch (error) {
					// If the object have no select() function
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
		
		window.addEventListener('keypress', 
		(event)=>{
			console.log(event.key);
		}
		, false);
		
		
	}
}

const game = new Game();