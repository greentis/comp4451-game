import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';

import { Hunter } from './Hunter.js';
import { Animal } from './Animal.js';
import { AIAgent } from './Aiagent.js';
import { Board } from './Board.js';
import { TileProperties } from './TileProperties.js';
import { WeaponProperties } from './WeaponProperties.js';

import { infoBox } from './infoBox.js';
import { AnimalProperties } from './AnimalProperties.js';
//global variables

export function disposeNode( node, recursive = false ) {
	//console.log("disposeNode");
	if ( !node ) return;
	if ( recursive && node.children)
	  for ( const child of node.children )
		disposeNode( child , recursive );
	node.geometry && node.geometry.dispose();
	if ( !node.material ) return;
	const materials = node.material.length === undefined ? [ node.material ] : node.material
	for ( const material of materials ) {
		for ( const key in material ) {
		  const value = material[key];
		  if ( value && typeof value === 'object' && 'minFilter' in value )
			value.dispose();
		}
		material && material.dispose();    
	}

  }

export class Game{
	constructor(){
	//
	// Base game elements
	//
		console.log("Start Game");
		// game scene
		this.createScene();
		
		// Event Handler
		this.selectedObject = null;
		this.activateEventHandler();

		this.missionNo = 1;

	//
	// For each mission
	//
		this.generateMission();
		
	}

	missionCompleted(){
		if (!this.gameOn) return;
		this.gameOn = false;
		this.missionNo++;
		infoBox.format = infoBox.FORMAT.UpgradePanel;
	}

	missionFailed(){
		if (!this.gameOn) return;
		this.gameOn = false;
		infoBox.format = infoBox.FORMAT.Gameover;
	}

	startNewMission(){
		this.clearScene();
		//this.generateMap();
		this.generateMission();
		this.gameOn = true;
	}

	clearScene(){
		this.selectedObject = null;
		this.previousObject = null;
		this.hoveringObject = null;

		// Remove all objects from the scene
		
		this.scene.remove(this.board.body);
		//disposeNode(this.board.body, true);
		
		this.camera.position.set(0, 3, 5);
	}


	generateMission(){
		// Board & Tiles (Development phase)
		infoBox.missionNo = this.missionNo;
		this.board = new Board(this, this.missionNo);
		this.board.body.rotation.x = Math.PI * 0;
		this.board.body.rotation.y = 0;
		this.scene.add(this.board.body);

		this.movingPlayer = null;
		this.isPlayerTurn = true;
		this.gameOn = true;

		this.board.buildTiles().then(
			()=>{
				this.genearateCharacter();
			}
		)
		
		
	}
	async genearateCharacter(){
		// Players (Development phase)
		await new Promise(resolve => setTimeout(resolve, 500));

		var playerSpawnPoints = this.board.getPlayerSpawnPoint();
		console.log("playerSpawnPoints", playerSpawnPoints);
		this.player = [
			new Hunter(playerSpawnPoints[0].q, playerSpawnPoints[0].r, 10, WeaponProperties.TYPE.Gun, this, '🏹Hunter'),
			new Hunter(playerSpawnPoints[2].q, playerSpawnPoints[2].r, 15, WeaponProperties.TYPE.Saw, this, '🗡️Lumberjack'),
			new Hunter(playerSpawnPoints[1].q, playerSpawnPoints[1].r, 10, WeaponProperties.TYPE.Bomb, this, '💣Bomb Mage'),
			
		];

		await new Promise(resolve => setTimeout(resolve, 500));

		var enemySpawnPoints = this.board.getEnemySpawnPoint();
		this.enemy = new Set([]);
		for (let i = 0; i < Object.keys(enemySpawnPoints).length; i++){
			for(let j = 0; j < Object.keys(enemySpawnPoints[i]).length; j++){
				
				//make a name according to [i][j]
				var name = 'Enemy ' + i + j;
				if (enemySpawnPoints[i] && enemySpawnPoints[i][j]) {
					console.log("type", enemySpawnPoints[i][j][0], AnimalProperties.TYPEID[enemySpawnPoints[i][j][0]]);
					this.enemy.add(new Animal(enemySpawnPoints[i][j][1].q, enemySpawnPoints[i][j][1].r, enemySpawnPoints[i][j][0], this, name, i));
				}
			}
		}

		infoBox.players = this.player;
		infoBox.enemies = this.enemy;

		this.aiAgent = new AIAgent(this);
		this.aiAgent.printWakeAll();

		var playerTile = this.board.getTile(this.player[0].q, this.player[0].r);
		//this.camera.position.set(playerTile.x + 1, playerTile.y + 3, playerTile.z);
		//this.camera.lookAt(playerTile.x, playerTile.y, playerTile.z);
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
		


		this.ambientLight = new THREE.AmbientLight( 0xBBBBBB ); // soft white light, 0x000000
		this.scene.add( this.ambientLight );

		//this.scene.fog = new THREE.Fog( 0xdfaaaa, 0.001 , 30);

		this.camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 1000 );
		
		// camera.up.set(x, y, z);
		this.camera.position.set(0, 3, 5);
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.screenSpacePanning = false;
		this.controls.maxPolarAngle = Math.PI /3;
		this.controls.minPolarAngle = Math.PI /3;
		//this.controls = new FirstPersonControls(this.camera, this.renderer.domElement)


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
			if (!this.isPlayerTurn || !this.gameOn) return;
			if (event.clientY <= 100) return;
			if (infoBox.format == infoBox.FORMAT.UpgradePanel) return;

			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			
			
			raycaster.setFromCamera(mouseVec, this.camera);
		
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			// Deactivate objects that is activated in previous call
			this.previousObject = this.selectedObject;
			this.selectedObject = null;
		
			// Try activating the object in ascending order
			for (var i = 0; i < intersects.length; i++) {
				this.selectedObject = intersects[i].object.userData;
				if (!this.selectedObject.select) continue;
				if (this.selectedObject == this.previousObject) {
					if (this.previousObject) this.selectedObject = this.previousObject.deselect();
					break;
				}
				this.selectedObject.select();
				if (this.selectedObject != null && this.selectedObject == this.previousObject) {
					this.selectedObject = this.selectedObject.deselect();
					break;
				}
				if (this.previousObject) this.previousObject.deselect();
				break;
			}
			//console.log(this.selectedObject);
		}, false);
		
		this.hoveringObject = null;
		
		window.addEventListener('mousemove', (event)=>{
			if (!this.gameOn || event.clientY <= 100 ) return;
			if (infoBox.format == infoBox.FORMAT.UpgradePanel) return;
			// Do raycast to find all objects within sight
			mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseVec.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseVec, this.camera);
			var intersects = raycaster.intersectObjects(this.scene.children);
			
			// Deactivate objects that is activated in previous call
			
			// Try activating the object in ascending order
			for (var i = 0; i < intersects.length; i++) {
				var newObject = intersects[i].object.userData;
				if (!newObject.hovering) continue;
				if (this.hoveringObject) {
					if (this.hoveringObject == newObject) break;
					this.hoveringObject.deHovering();
				}
				this.hoveringObject = newObject;
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
					this.setToPlayerTurn(false);
					break;
				case 'r':	// for debug purpose to skip enemies turn
					this.setToPlayerTurn(true);
					break;
				case 'p':	// for debug purpose to skip enemies turn
					this.missionCompleted();
					break;
				case 'o':	// for debug purpose to skip enemies turn
					this.startNewMission();
					break;
				case 'l':
					this.missionFailed();
					break;
				default:
					console.log(event.key);
					break;
			}
			this.renderer.render( this.scene, this.camera );
		}
		, false);
	}

	setToPlayerTurn(set){

		this.isPlayerTurn = set;
		infoBox.note="Find and kill all animals!";
		console.log(set?"Player's":"Animal's", "turn");
		if (set){
			// Deselects everything currently
			if (this.selectedObject) {
				this.selectedObject.deselect();
				if (this.selectedObject.deselect_forced) this.selectedObject.deselect_forced();
				this.selectedObject = null;
			}

			this.player.forEach((player)=>{
				player.setActionPoint(2);
			});

			this.enemy.forEach((enemy)=>{
				enemy.setActionPoint(0);
			});

			if (!this.gameOn) return;
			// Change what UI displays
			infoBox.format = infoBox.FORMAT.MissionInfo;
		}
		else{
			this.player.forEach((player)=>{
				player.setActionPoint(0);
			});

			this.enemy.forEach((enemy)=>{
				enemy.setActionPoint(2);
			});
			console.log(this.gameOn)
			if (!this.gameOn) return;
			// Change what UI displays
			infoBox.format = infoBox.FORMAT.HunterStateTrack;
			console.log("cgheck", this.aiAgent);
			this.aiAgent.AIControl();
		}
	}
}

export const game = new Game();