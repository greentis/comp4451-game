import * as THREE from 'three';
import {Tile} from './Tile.js';


export class TileProperties {
    constructor(type){
        this.id = 0;
        this.name = 'Default'

        this.emissive = 0x000000;
        this.color = 0xFFFFFF;
        this.mesh = new THREE.Object3D();
        this.offsetY = 0.1;

        this.pathfindable = true;   // Can we walk on it?
        this.seeThroughable = true;  // Can we see through it?
        this.hittable = true;       // Can explosions explode on it?
        

        switch (type) {
            case 1:
                this.id = 1;
                this.name = 'Wall'
                this.emissive = 0x000000;
                this.color = 0x888888;
                this.offsetY = 1;

                this.pathfindable = false;
                this.seeThroughable = false; 
                this.hittable = false;
                break;
            case 2:
                this.id = 2;
                this.name = 'Rock'
                this.offsetY = 0.2;
                this.emissive = 0x000000;
                this.color = 0x0000FF;

                this.pathfindable = false;
                break;
            case 3:
            case 0:
            default:
                break;
        }
    }
}