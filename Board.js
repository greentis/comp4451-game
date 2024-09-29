import * as THREE from 'three';
import {Tile} from './Tile.js';
import {Game} from './main.js';
import { round } from 'three/webgpu';
//import * as math from 'mathjs';

console.log("Board.js loaded successfully!");


export class Board {
    constructor(game){
        this.game = game;

        this.mesh = new THREE.Object3D();
        this.grids = new Map();
        this.path = [];
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
    //warning: havent test if this function works
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
        for (var i = 0.0; i < 100.0; i++){
            var q = this.lerp(sq, eq, i/100.0);
            var r = this.lerp(sr, er, i/100.0);
            var s = this.lerp(ss, se, i/100.0);
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
        //sq, sr: start q, r; eq, er: end q, r
        //A* algorithm
        //1. Initialize both open and closed list
        var openList = [];
        var closedList = [];
        var startTile = this.getTile(sq, sr);
        var endTile = this.getTile(eq, er);
        openList.push(startTile);
        //2. Loop
        while (openList.length > 0){
            //a. find the tile with the least f on the open list, call it "current tile"
            var currentTile = openList[0];
            for (var i = 0; i < openList.length; i++){
                if (openList[i].f < currentTile.f){
                    currentTile = openList[i];
                }
            }
            //b. pop current off the open list, add it to the closed list
            var index = openList.indexOf(currentTile);
            openList.splice(index, 1);
            closedList.push(currentTile);
            //c. Found the goal
            if (currentTile == endTile){
                var path = [];
                var temp = currentTile;
                path.push(temp);
                while (temp.parent){
                    path.push(temp.parent);
                    temp = temp.parent;
                }
                return path.reverse();
            }
            //d. Generate children
            var neighbors = this.getNeighbors(currentTile);
            for (var i = 0; i < neighbors.length; i++){
                var neighbor = neighbors[i];
                //if the neighbor is in the closed list, ignore it
                if (closedList.includes(neighbor)){
                    continue;
                }
                //if the neighbor is not in the open list
                if (!openList.includes(neighbor)){
                    //compute its f, g, h
                    neighbor.g = currentTile.g + 1;
                    neighbor.h = this.heuristic(neighbor, endTile);
                    neighbor.f = neighbor.g + neighbor.h;
                    //set the parent to current tile
                    neighbor.parent = currentTile;
                    //add it to the open list
                    openList.push(neighbor);
                }
            }
        }
        this.path = path;
        return path;
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