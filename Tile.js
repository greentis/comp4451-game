import * as THREE from 'three';
import {Game} from './main.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
console.log("Tile.js loaded successfully!")

export class Tile {
    constructor(q, r, x, y, z, scale = 0.2){
        this.q = q;
        this.r = r;
        this.s = 0 - q - r;
        this.scale = scale;
        this.x = x;
        this.y = y;
        this.z = z;

        // this.mesh constructed here
        this.render();
    }

    render(){
        this.geometry = new THREE.CylinderGeometry(5,5,2,6);
        this.material = new THREE.MeshPhongMaterial({emissive:0x000000});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(this.scale, this.scale, this.scale);

        this.mesh.position.x = this.x;
        this.mesh.position.z = this.z;

        this.mesh.name = 'tile';
        this.mesh.userData = this;

    }

    onClick(){
        console.log(this.q, this.r, 'is Clicked!');
    }

    hovering(){
        this.mesh.material.emissive.set(0x0000DD);
    }

    deHovering(){
        this.mesh.material.emissive.set(0x000000);
    }
}
