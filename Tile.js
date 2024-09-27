import * as THREE from 'three';
import {Game} from './main.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
console.log("Tile.js loaded successfully!")

export class Tile {
    constructor(q, r, x, y, z, game){
        // constructor
        this.q = q;
        this.r = r;
        this.s = 0 - q - r;
        this.x = x;
        this.y = y;
        this.z = z;
        this.game = game;

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
        this.mesh.name = 'tile';
        this.mesh.userData = this;
        this.render();
    }

    render(){
        this.mesh.scale.set(0.1, 0.1, 0.1);
        this.mesh.material.emissive.set(0x000000);

        if (this.state == 'selected') {
            this.mesh.scale.set(0.12, 0.12, 0.12);
            this.mesh.material.emissive.set(0x44FF44);
        }
        else if (this.state == 'highlighted') {
            this.mesh.material.emissive.set(0x0000DD);
        }

    }

    characterEnter(character){
        this.character = character;
        this.mesh.add(character.mesh);
    }

    characterLeave(){
        this.mesh.remove(this.character.mesh);
        this.character = null;
    }

    //
    // Event Handling
    //

    select(){
        if (this.character) this.character.select();
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
        this.render();
    }
    deHovering(){
        if (this.state != 'selected'){
            this.state = 'default';
        }
        this.render();
    }
}
