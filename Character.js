// Parent of Player character & AI character
import * as THREE from 'three';
import {Game} from './main.js';
import {Board} from './Board.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
console.log("Character.js loaded successfully!")

export class Character{
    constructor(q, r, name, game){
        this.q = q; 
        this.r = r;
        this.name = name;
        this.game = game;
        //this.moveAble = false;
        this.moveRange = 5;

        const gltfLoader = new GLTFLoader();
        const url = 'assets/low_poly_kyle_crane/scene.gltf';
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(12,12,12);
            model.userData = this;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this;
                }
            });
            this.mesh = model;
            this.getTile().characterEnter(this);
        });

        //this.updateLight(this.getTile().x, this.getTile().z);
        
    }

    moveTo(q, r) {
        // Before Updating coordinate
        this.getTile().characterLeave();
        
        // calulate new facing direction
        // 1. get current tile
        var currentTile = this.getTile();
        // 2. get target tile
        var targetTile = this.game.board.getTile(q, r);
        // 3. calculate direction
        var direction = new THREE.Vector3();
        direction.subVectors(targetTile.mesh.position, currentTile.mesh.position);
        direction.y = 0;
        direction.normalize();
        // 4. set rotation
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        

        // Update coordinate
        this.q = q; this.r = r;

        // After Updating coordinate
        this.getTile().characterEnter(this);
        this.updateLight(targetTile.x, targetTile.z); //update light position
        
    }

    //
    // Event Handling
    //

    select(){
        //pop out all playerMove
        while(this.game.playerMove.length > 0){
            this.game.playerMove.pop().deselect();
        }
        this.game.playerMove.push(this);
        //console.log("playerMove' length: ",this.game.playerMove.length);
        console.log("playerMove: ",this.game.playerMove);
        this.getTile().selected();
    }

    deselect(){
        
        this.getTile().deselected();
    }

    getTile(){
        return this.game.board.getTile(this.q, this.r);
    }

    //helper function (todo: better open a new file for render related helper function)
    updateLight(x,z){
        this.game.lightPlayerList[this.game.player.indexOf(this)].position.set(x,1,z);
        console.log("light position: ",this.game.lightPlayerList[this.game.player.indexOf(this)].position);
    }

}