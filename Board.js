import * as THREE from 'three';
import {Tile} from './Tile.js';
import {Game} from './main.js';
import { round } from 'three/webgpu';
//import * as math from 'mathjs';

console.log("Board.js loaded successfully!");
//set up a 2D array to store different type of tiles
// 0: normal tile
// 1: wall tile
// 2: cover tile
// 3: water tile
const TILE_TYPE = {
	normal: [0,0x000000],
	wall: [1,0x0000FF],
	cover: [2,0x00FF00],
	water: [3,0x00FFFF]
};

export class Board {
    constructor(game){
        this.game = game;

        this.mesh = new THREE.Object3D();
        this.grids = new Map();
        this.path = [];
        this.generate();
        //this.generatePolygonal();
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

    generatePolygonal(){
        //using Polgonal Generation Algorithm
        //https://www.redblobgames.com/grids/hexagons/
        // so that we can have different type of tile
        // treat wall tile and water tile as river in the example above
        // treat cover tile as mountain in the example above
        // treat normal tile as grassland in the example above
        // 1. Create a hexagon
        // 2. Subdivide the hexagon
        // 3. Create a hexagon grid
        // 4. Assign type to each tile
        // 5. Add tile to map

        // 1. Create a hexagon
        var radius = 8;
        var spacing = 1;
        var hexagon = [];
        for (var i = 0; i < 6; i++){
            var angle = 2 * Math.PI / 6 * i;
            var x = Math.cos(angle);
            var y = Math.sin(angle);
            hexagon.push([x,y]);
        }

        // 2. Subdivide the hexagon
        var hexagon_sub = [];
        for (var i = 0; i < 6; i++){
            var x = (hexagon[i][0] + hexagon[(i+1)%6][0]) / 2;
            var y = (hexagon[i][1] + hexagon[(i+1)%6][1]) / 2;
            hexagon_sub.push([x,y]);
        }

        // 3. Create a hexagon grid
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

                // 4. Assign type to each tile
                // 5. Add tile to map
                var type = TILE_TYPE.normal;
                if (q >= 0 && r >= 0 && s >= 0){
                    type = TILE_TYPE.wall;
                }
                else if (q <= 0 && r <= 0 && s <= 0){
                    type = TILE_TYPE.cover;
                }
                else if (q >= 0 && r <= 0 && s <= 0){
                    type = TILE_TYPE.water;
                }
                tile.type = type;
                tile.defaultColor = type[1];
                tile.render();

                // Add tile to map
                this.mesh.add(tile.mesh);
                this.grids.set(q.toString()+r.toString(), tile);
            }
        }
    }



    getTile(q, r){
        return this.grids.get(q.toString()+r.toString());
    }

    distance(tile1, tile2){
        return Math.max(Math.abs(tile1.q - tile2.q), Math.abs(tile1.r - tile2.r),Math.abs(tile1.s - tile2.s));
    }

    lerp(a, b, t){
        //helper function for findPath_straight
        a = a +0.0; b = b + 0.0; //convert to float
        return a + (b - a) * t;
    }

    cubeRound(q, r, s){
        //helper function for findPath_straight
        var nq = Math.round(q);
        var nr = Math.round(r);
        var ns = Math.round(s);
        
        var q_diff = Math.abs(nq - q);
        var r_diff = Math.abs(nr - r);
        var s_diff = Math.abs(ns - s);

        if (q_diff > r_diff && q_diff > s_diff){
            nq = -nr - ns;
        }
        else if (r_diff > s_diff){
            nr = -nq - ns;
        }
        else{
            ns = -nq - nr;
        }
        return this.getTile(nq, nr);
    }

    findPath_straight(sq, sr, eq, er){
        //sq, sr: start q, r; eq, er: end q, r
        //find straight line path from start to end(not concern the cost and unpasable tile)
        if (sq == eq && sr == er){
            return [];
        }
        var path = [];
        var currentTile = this.getTile(sq, sr);
        var endTile = this.getTile(eq, er);
        path.push(currentTile);
        
        var temp = currentTile;
        var ss = currentTile.s;
        var se = endTile.s;
        var N = this.distance(currentTile, endTile);
        for (var i = 0.0; i < N; i++){
            var q = this.lerp(sq, eq, i/N);
            var r = this.lerp(sr, er, i/N);
            var s = this.lerp(ss, se, i/N);
            var tile = this.cubeRound(q, r,s);    
            if (tile != temp){
                path.push(tile);
                temp = tile;
            }
            if (tile == endTile){
                break;
            }
        }
        this.path = path;
        return path;
    }
        


    findPath(sq, sr, eq, er){
    //warning: havent test if this function works
        //sq, sr: start q, r; eq, er: end q, r
        //A* algorithm
        //1. Initialize both open and closed list
        
        //2. Loop
        
    }

    clearPath(){
        if (this.path){
            for (var i = 0; i < this.path.length; i++){
                var tile = this.path[i];
                tile.state = 'default';
                tile.render();
                
            }
        }
        this.path = [];

    }
}