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
// 4: rock tile
const TILE_TYPE = {
	normal: [0,0x000000],
	wall: [1,0x0000FF],
	cover: [2,0x00FF00],
	water: [3,0x00FFFF],
    rock: [4,0xFF0000]
};

export class Board {
    constructor(game){
        this.game = game;

        this.mesh = new THREE.Object3D();
        this.grids = new Map();
        this.path = [];
       

        //below variables are for polygonal generation only
        this.minq = 10; this.maxq = 10;
        this.minr = 10; this.maxr = 20;
        this.mins = 10; this.maxs = 15; 
        //this.generate();
        this.generatePolygonal();
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
        // 1. set the size of the map by 3 radius
        // 2. generate the continous structure of the map first(i.e. Rock, Water(Pond))
        // 3. generate the segmented structure of the map(i.e. Wall, Cover, Water(river))
        // 4. combine the two structure together to get the annotated map


        // 1. set the size of the map by 3 radius
        //generat random map with hexagon grid
        //setting random seed
        var seed = Math.random();
        console.log(seed);
        var radius_q = Math.round(this.minq + (this.maxq - this.minq) * seed);
        var radius_r = Math.round(this.minr + (this.maxr - this.minr) * seed);
        var radius_s = Math.round(this.mins + (this.maxs - this.mins) * seed);
        //create a temp array to store all the type of tile in the map temporarily
        // temp should be 2D array 
        var LargestRadius = Math.max(radius_q, radius_r, radius_s);
        var temp = [];
        for(var i = -LargestRadius; i <= LargestRadius; i++){
            temp[i] = [];
            for (var j = -LargestRadius; j <= LargestRadius; j++){
                temp[i][j] = TILE_TYPE.normal;
        
            }
        }

       // 2. generate the continous structure of the map first(i.e. Rock, Water(Pond))
        //the outermost layer must be rock
        for (var q = -radius_q; q <= radius_q; q++){
            for (var r = -radius_r; r <= radius_r; r++){
                for (var s = -radius_s; s <= radius_s; s++){
                    if( Math.abs(-q -r) > radius_s || Math.abs(-r - s) > radius_q || Math.abs(-s - q) > radius_r){
                        continue;
                    }

                    //generate the rock tile
                    if(Math.random() < 0.1){
                        temp[q][r] = TILE_TYPE.rock;
                    }
                }
            }
        }

        // 3. generate the segmented structure of the map(i.e. Wall, Cover, Water(river))

        // 4. combine the two structure together to get the annotated map

        // 5. generate the tile based on the annotated map
        for (var q = -radius_q; q <= radius_q; q++){
            for (var r = -radius_r; r <= radius_r; r++){
                for (var s = -radius_s; s <= radius_s; s++){
                    if( Math.abs(-q -r) > radius_s || Math.abs(-r - s) > radius_q || Math.abs(-s - q) > radius_r){
                        continue;
                    }

                    //tile construction
                    var x = q  + r  * Math.cos(Math.PI /3);
                    var y = 0;
                    var z = r * Math.cos(Math.PI /6);
                    var tile = new Tile(q, r, x, y, z, this.game, temp[q][r][1], temp[q][r][0]);
                    
                    //add tile to map
                    this.mesh.add(tile.mesh);
                    this.grids.set(q.toString()+r.toString(), tile);
                }
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