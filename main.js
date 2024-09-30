import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';

import {Board} from './Board.js';
import {Character} from './Character.js';
console.log("main.js loaded successfully!")

//global variables
const PLAYER_NUM = 2;


export class Game{
	constructor(){
		this.createScene();

		this.board = new Board(this);
		this.scene.add(this.board.mesh);
		
		this.player = [];
		this.player.push(new Character(1, 0, 'Curtis', this));
		this.player.push(new Character(0, 1, 'Kyle', this));
		this.playerMove = []; // List of characters that choose by player to move
			                  // should only contain 1 or 0 element
		//update light position
		for(var i = 0; i < PLAYER_NUM; i++){
			this.player[i].updateLight(this.board.getTile(this.player[i].q, this.player[i].r).x, this.board.getTile(this.player[i].q, this.player[i].r).z);
		}

		this.activateEventHandler();
	}

	createScene(){
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);
		
		/*this.light = new THREE.PointLight(0xAA5522, 40);
		this.light.position.y = 1;
		this.light.decay = 0.5;
		this.light.distance = 4.5;
		this.scene.add(this.light);
		*/
		//create a list of light with number of light = number of player
		this.lightPlayerList = [];
		for(var i = 0; i < PLAYER_NUM; i++){
			this.lightPlayerList.push(new THREE.PointLight(0xAA5522, 40));
			this.lightPlayerList[i].position.y = 1;
			this.lightPlayerList[i].decay = 0.5;
			this.lightPlayerList[i].distance = 4.5;
			this.scene.add(this.lightPlayerList[i]);
		}


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
					if (intersects[i].object.userData == previousObject){
						// if the object is character in the playerMove list
						// pop the object from the list
						if (intersects[i].object.userData == this.playerMove[this.playerMove.length-1]){
							//console.log("playerMove' length: ",this.game.playerMove.length);
							this.playerMove.pop();
						}
						//console.log("Same object selected");
						//console.log("main: playerMove: ",this.game.playerMove);
						break;
					}
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
		
		/*
		window.addEventListener('keypress', 
		(event)=>{
			console.log(event.key);
		}
		, false);*/

		// using Q and E to set camera rotation by calculating the new position of camera
		// so that it is like the plane is rotating, but not the camera
		// using the mousemove function as reference
		window.addEventListener('keypress',
		(event)=>{
			switch (event.key){
				case 'q':
					// get the current position of camera
					var currentPosition = new THREE.Vector3();
					currentPosition.copy(this.camera.position);
					// get the current lookAt position of camera
					var currentLookAt = new THREE.Vector3();
					currentLookAt.copy(this.controls.target);
					// calculate the new position of camera by using lookAt as the center of rotation
					// then rotate the current position by 5 degree
					currentPosition.sub(currentLookAt);
					currentPosition.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/36);
					currentPosition.add(currentLookAt);
					this.camera.position.copy(currentPosition);
					this.camera.lookAt(currentLookAt);
					break;
				case 'e':
					// get the current position of camera
					var currentPosition = new THREE.Vector3();
					currentPosition.copy(this.camera.position);
					// get the current lookAt position of camera
					var currentLookAt = new THREE.Vector3();
					currentLookAt.copy(this.controls.target);
					// calculate the new position of camera by using lookAt as the center of rotation
					// then rotate the current position by 5 degree
					currentPosition.sub(currentLookAt);
					currentPosition.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/36);
					currentPosition.add(currentLookAt);
					this.camera.position.copy(currentPosition);
					this.camera.lookAt(currentLookAt);
					break;
				//using WASD to move the camera
				case 'w':
					this.camera.position.z -= 0.1;
					break;
				case 's':
					this.camera.position.z += 0.1;
					break;
				case 'a':
					this.camera.position.x -= 0.1;
					break;
				case 'd':
					this.camera.position.x += 0.1;
					break;
				default:
					console.log(event.key);
					break;
			}
			this.renderer.render( this.scene, this.camera );
		}
		, false);
		
		
	}
}

const game = new Game();