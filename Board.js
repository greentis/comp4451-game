import * as THREE from 'three';
import {Tile} from './Tile.js';
import {Game} from './main.js';

console.log("Board.js loaded successfully!")


export class Board {
    constructor(game){
        this.game = game;

        this.mesh = new THREE.Object3D();
        this.grids = new Map();
        this.generate();
       
    }
    
    generate(){
        var radius = 8;
        var spacing = 1;
        for (var q = -radius; q <= radius; q++){
            for (var r = -radius; r <= radius; r++){
                // Keep the radius = 6
                var s = 0 - q - r;
                if (Math.abs(s) > radius) continue;  
        
                // Tile contruction
                var x = q * spacing + r * spacing * Math.cos(Math.PI /3);
                var y = 0;
                var z = r * spacing * Math.cos(Math.PI /6);
                var tile = new Tile(q, r, x, y, z,this.game);

                // Add tile to map
                this.mesh.add(tile.mesh);
                this.grids.set(q.toString()+r.toString(), tile);
            }
        }
    }

    getTile(q, r){
        return this.grids.get(q.toString()+r.toString());
    }
}