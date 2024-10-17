import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { Hunter } from './Hunter.js';
import {Animal} from './Animal.js';

import { Board } from './Board.js';
import { TileProperties } from './TileProperties.js';
import { WeaponProperties } from './WeaponProperties.js';
import { Character } from './Character.js';
import { userInput } from './userInput.js';
//global variables

export class Game{
	constructor(){
	//
	// Base game elements
	//
		console.log("Start Game");
		// game scene
		this.createScene();
		
		// UI
		this.ui = new userInput(this);
		this.ui.makeInterface();

		// Event Handler
		this.selectedObject = null;
		this.activateEventHandler();

	//
	// For each mission
	//

		// Board & Tiles (Development phase)
			this.board = new Board(this);
			this.board.body.rotation.x = Math.PI * 0;
			this.board.body.rotation.y = 0;
			this.scene.add(this.board.body);

			this.movingPlayer = null;
			
		// Players (Development phase)
			var playerSpawnPoints = this.board.getPlayerSpawnPoint();
			this.player = new Set([
				new Hunter(playerSpawnPoints[0].q, playerSpawnPoints[0].r, 1, WeaponProperties.TYPE.Gun, this, 'Player 1'),
				new Hunter(playerSpawnPoints[1].q, playerSpawnPoints[1].r, 1, WeaponProperties.TYPE.Bomb, this, 'Player 2'),
				new Hunter(playerSpawnPoints[2].q, playerSpawnPoints[2].r, 1, WeaponProperties.TYPE.Saw, this, 'Player 3')
			]);
			var enemySpawnPoints = this.board.getEnemySpawnPoint();
			this.enemy = new Set([]);
			for (let i = 0; i < Object.keys(enemySpawnPoints).length; i++){
				for(let j = 0; j < Object.keys(enemySpawnPoints[i]).length; j++){
					
					//make a name according to [i][j]
					var name = 'Enemy ' + i + j;
					if (enemySpawnPoints[i] && enemySpawnPoints[i][j]) {
						this.enemy.add(new Animal(enemySpawnPoints[i][j][1].q, enemySpawnPoints[i][j][1].r, 1, this, name));
					}
				}
			}
			this.enemy.add(new Animal(-6, -9, 1, this, 'Monkey'));
			//console.log(this.enemy);
			/*this.enemy = new Set([
				new Animal(0, 5, 1, this, 'Monkey')
			]);*/
		// set the camera to the first player
		//this.camera.position.set(0, 5, 5);
		//this.camera.lookAt(0, 0, 0);
		
		
		// turn iteration
		// ---- Press 'f' key to skip turn
			this.isPlayerTurn = true;

		
		
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
		


		this.ambientLight = new THREE.AmbientLight( 0x000000 ); // soft white light
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
			// You can't click on object if its not player's turn
			if (!this.isPlayerTurn) return;

			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseVec, this.camera);
		
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			// Deactivate objects that is activated in previous call
			var previousObject = this.selectedObject;
			this.selectedObject = null;
		
			// Try activating the object in ascending order
			for (var i = 0; i < intersects.length; i++) {
				this.selectedObject = intersects[i].object.userData;
				if (!this.selectedObject.select) continue;
				if (this.selectedObject == previousObject) {
					if (previousObject) this.selectedObject = previousObject.deselect();
					break;
				}
				this.selectedObject.select();
				if (this.selectedObject != null && this.selectedObject == previousObject) {
					this.selectedObject = this.selectedObject.deselect();
					break;
				}
				if (previousObject) previousObject.deselect();
				break;
			}
			console.log(this.selectedObject);
		}, false);
		
		var hoveringObject = null;
		
		window.addEventListener('mousemove', (event)=>{
			// Do raycast to find all objects within sight
			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseVec, this.camera);
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			// Deactivate objects that is activated in previous call
			if (hoveringObject) hoveringObject.deHovering();
			hoveringObject = null;
			// Try activating the object in ascending order
			for (var i = 0; i < intersects.length; i++) {
				var newObject = intersects[i].object.userData;
				if (!newObject.hovering) continue;
				hoveringObject = newObject;
				newObject.hovering();
				break;
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
				case 'f':
					this.isPlayerTurn = false;

					// Deselects everything currently
					this.selectedObject.deselect();
					if (this.selectedObject.deselect_forced) this.selectedObject.deselect_forced();
					this.selectedObject = null;
					break;
				case 'r':	// for debug purpose to skip enemies turn
					this.isPlayerTurn = true;
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