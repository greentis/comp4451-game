import * as THREE from 'three';
import {Game} from './main.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
console.log("Tile.js loaded successfully!")

export class Tile {
    constructor(q, r, x, y, z, game, defaultColor = 0x000000,type = 0){
        // constructor
        this.q = q;
        this.r = r;
        this.s = 0 - q - r;
        this.x = x;
        this.y = y;
        this.z = z;
        this.game = game;
        this.defaultColor = defaultColor;
        this.type = type;

        // pointer
        this.character = null;

        // constant
        this.gap = 0.5;

        // this.mesh constructed here
        this.geometry = new THREE.CylinderGeometry(5.8- this.gap, 5.8 - this.gap,2,6);
        this.material = new THREE.MeshPhongMaterial({emissive:0x000000});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = this.x;
        this.mesh.position.z = this.z;
        this.mesh.rotateY(Math.PI/6);
        this.mesh.name = 'tile';
        this.mesh.userData = this;
        this.render();
    }

    render(){
        this.mesh.scale.set(0.1, 0.1, 0.1);
        this.mesh.material.emissive.set(this.defaultColor);

        if (this.state == 'selected') {
            this.mesh.scale.set(0.12, 0.12, 0.12);
            this.mesh.material.emissive.set(0x44FF44);
        }
        else if (this.state == 'highlighted') {
            this.mesh.material.emissive.set(0x0000DD);
        }
        else if (this.state == 'pathed') {
            this.mesh.material.emissive.set(0x00ABDD);
        }

    }

    characterEnter(character){
        this.character = character;
        this.mesh.add(character.mesh);
        this.deHovering();
    }

    characterLeave(){
        this.mesh.remove(this.character.mesh);
        this.character = null;
    }

    //
    // Event Handling
    //

    select(){
        console.log("Tile selected", this.q, this.r, 0-this.q-this.r, 'with type', this.type);
        
        if (this.character) {
            this.character.select();
            console.log("Character", this.character," with name", this.character.name);
        }
        else{
            // find out the pointer of characters in Game.player
            // and then move the character to this tile
            
            
            //console.log("this.game.PlayerMove.length", this.game.playerMove.length);
            if (this.game.playerMove.length > 0){
                //console.log("this.game.PlayerMove[-1]");
                var character = this.game.playerMove[this.game.playerMove.length-1];
                if(character.moveRange >= this.game.board.distance(character.getTile(), this)){
                    character.moveTo(this.q, this.r);
                    this.game.playerMove.pop();
                }

            }
        }


    }
    deselect(){
        if (this.character) this.character.deselect();
    }

    // For Character.js
    selected(){
        this.state = 'selected';
        this.render();
    }
    deselected(){
        this.state = 'default';
        this.render();
    }

    hovering(){
        if (this.state != 'selected'){
            this.state = 'highlighted';
        }

        //draw the path to this tile, if game.playerMove is not empty
        //using the last character in the game.playerMove
        //highlight the path to this tile and change these tile on path into state 'pathed'
        if (this.game.playerMove.length > 0){
            var character = this.game.playerMove[this.game.playerMove.length-1];
            this.game.board.findPath_straight(character.q, character.r, this.q, this.r);
            var path = this.game.board.path;
            //console.log("path", path);
            if (path){
                for (var i = 0; i < path.length; i++){
                    if(i > character.moveRange) break;
                    var tile = path[i];
                    tile.state = 'pathed';
                    tile.render();
                }
            }
            
        }
        this.render();
    }

    deHovering(){
        if (this.state != 'selected'){
            this.state = 'default';
        }

        //clear the path
        this.game.board.clearPath();
        this.render();
    }
}
