import * as THREE from 'three';
import {Game} from './main.js';
import { TileProperties } from './TileProperties.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Character } from './Character.js';
import { Hunter } from './Hunter.js';

export class Tile {
    constructor(q, r, x, y, z, game, typeID = TileProperties.TYPE.Default){
        // constructor
        this.q = q;
        this.r = r;
        this.s = 0 - q - r;
        this.x = x;
        this.y = y;
        this.z = z;
        this.game = game;
        this.board = game.board;
        

        // pointer
        this.character = null;

        // constant
        this.gap = 0.5;

        // this.mesh constructed here
        this.body = new THREE.Object3D();
        this.geometry = new THREE.CylinderGeometry(5.8- this.gap, 5.8 - this.gap,100,6);
        this.material = new THREE.MeshPhongMaterial({emissive:0x000000});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.body.add(this.mesh);
        this.body.position.x = this.x;
        this.body.position.y = this.y;
        this.body.position.z = this.z;
        this.mesh.rotateY(Math.PI/6);
        this.mesh.userData = this;

        this.setType(typeID);
        
        // render
        this.state = 'default';
        this.render();
    }

    setType(typeID){
        this.properties = new TileProperties(this, typeID);
        this.mesh.name = this.properties.name + ' Tile (' + this.q.toString() + ', ' + this.r.toString() + ')';
        //this.render();
    }

    render(){
        this.mesh.scale.set(0.1, 0.1, 0.1);
        this.mesh.material.emissive.set(this.properties.emissive);
        this.mesh.material.color.set(this.properties.color);
        this.body.position.y = this.y + this.properties.offsetY;
        this.mesh.position.y = this.y - 5;
        if (!this.properties.pathfindable && !this.properties.hittable) return;
        if (this.state == 'selected') {
            this.body.position.y += 0.1;
            this.mesh.material.emissive.set(0x44FF44);
        }
        else if (this.state == 'highlighted') {
            this.mesh.material.emissive.set(0x0000BB);
        }
        else if (this.state == 'pathed') {
            this.mesh.material.emissive.set(0x00ABDD);
        }
        else if (this.state == 'aggressive' || this.state == 'aimed') {
            this.body.position.y += 0.1;
            this.mesh.material.emissive.set(0xCC2222);
        }

    }

    characterEnter(character){
        this.character = character;
        console.log(character.mesh.name);
        this.body.add(character.mesh);
        this.deHovering();
    }

    characterLeave(){
        this.body.remove(this.character.mesh);
        this.state = 'default';
        this.character = null;
    }

    isVisible(){
        for (var player of this.game.player){
            var sight = player.lineOfSight(this,false);
            if(!sight) continue;
            return true;
        }
        for (var player of this.game.player){
            var path = player.findValidPath(this);
            if(path.length == 0) continue;
            if (path.includes(this)) return true;
        }
        return false;
    }
    //
    // Event Handling
    //

    select(){
        
        if (!this.isVisible()) {
            console.log(this.mesh.name);
            this.game.selectedObject = null;
            return;
        }
        if (this.character) {
            // Attempt to attack this grid
            if(this.game.movingPlayer && 
                this.game.movingPlayer.actionstate == Hunter.ACTION.attack) {
                let hunter = this.game.movingPlayer;
                if(hunter.lineOfSight(this, true)){
                    hunter.attack(this);
                    this.game.movingPlayer = null;
                }
                hunter.deselect_forced();
                return;
            }
            // This tile has a character on it
            // Select that character instead
            this.game.selectedObject = this.character;
            this.character.select();
        }
        else if (this.game.movingPlayer){
            // A player is already selecter
            // Here Determines the next action of the character
            // Move / Attack / Deselect
            var hunter = this.game.movingPlayer;
            switch(hunter.actionstate){
                case Hunter.ACTION.move:
                    if(hunter.moveTo(this)){
                        // This grid will be pathfindable &&
                        // not the grid the original character is standing
                        this.game.movingPlayer = null;
                    }
                    break;
                case Hunter.ACTION.attack:
                    if(hunter.lineOfSight(this, true)){
                        hunter.attack(this);
                        this.game.movingPlayer = null;
                    }
                    break;
                default: throw new Error("game.movingPlayer is in idle state!");
            }
            hunter.deselect_forced();
            
            
            this.game.selectedObject = null;
        }
        else {
            console.log(this.mesh.name);
            this.game.selectedObject = null;
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

    setState(state){
        this.state = state;
        this.render();
    }

    hovering(){
        if (this.state == 'selected' || this.state == 'aggressive') return;
        if (!this.isVisible()) return;
        if (this.game.movingPlayer){
            if (this.game.movingPlayer.actionstate == Hunter.ACTION.move){
                var path = this.game.movingPlayer.findValidPath(this);
                if (!path) return;
                path.forEach((t)=>{
                    t.state = 'pathed';
                    t.render();
                });
                this.game.board.lightedGrid = path;
                this.game.movingPlayer.facing(this.q, this.r);
            }
            else if (this.game.movingPlayer.actionstate == Hunter.ACTION.attack){
                var path = this.game.movingPlayer.lineOfSight(this, true);
                if (!path) return;
                path.forEach((t)=>{
                    t.state = 'pathed';
                    t.render();
                });
                this.game.board.lightedGrid = path;
                this.game.movingPlayer.facing(this.q, this.r);
                this.state = 'aimed';
                this.render();
                return;
            }
        }
        this.state = 'highlighted';
        this.render();
    }

    deHovering(){
        if (this.state == 'selected' || this.state == 'aggressive') return;
        this.state = 'default';

        //clear the path
        if (this.game.movingPlayer){
            this.game.board.clearMarkings();
        }
        this.render();
    }
}

Tile.STATE = {
    'default' : 'default',
    'selected' : 'selected',
    'highlighted' : 'highlighted',
    'pathed' : 'pathed',
    'aggressive' : 'aggressive',
}