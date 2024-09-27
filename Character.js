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
        
    }

    moveTo(q, r) {
        // Before Updating coordinate
        this.getTile().characterLeave();



        // After Updating coordinate
        this.q = q; this.r = r;
        this.getTile().characterEnter(this);
    }

    //
    // Event Handling
    //

    select(){
        this.getTile().selected();
    }

    deselect(){
        this.getTile().deselected();
    }

    getTile(){
        return this.game.board.getTile(this.q, this.r);
    }
}