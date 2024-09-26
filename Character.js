// Parent of Player character & AI character
import * as THREE from 'three';
import {Game} from './main.js';
import {Board} from './Board.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
console.log("Character.js loaded successfully!")

export class Character{
    constructor(q, r, game){
        this.q = q; 
        this.r = r;
        this.game = game;
        this.render();
    }

    render(){
        const gltfLoader = new GLTFLoader();
        const url = 'assets/hunter/scene.gltf';
        gltfLoader.load(url, (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.scale.set(2,2,2);
            this.mesh.userData = this;
            this.getTile().mesh.add(this.mesh);
        })
        
    }

    getTile(){
        return this.game.board.getTile(this.q, this.r);
    }
}