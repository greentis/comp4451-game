// Abstract Parent Class of Player character & AI character
import * as THREE from 'three';
import {Game} from './main.js';
import { Tile } from './Tile.js';
import {Board} from './Board.js';
import { TileProperties } from './TileProperties.js';

// private method
var lerp = (a, b, t) => {return a + (b - a) * t;}
var distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
var neighboringTile = (tile, game) => {
    q = tile.q; r = tile.r;
    var tiles = [];
    for (let i = -1; i <= 1; i++){
        for (let j = -1; j <= 1; j++){
            if (i + j == 2 || i + j == 0) continue;
            var t = game.board.getTile(q + i, r + j); 
            if (t) tiles.push(t);
        }
    }
    return tiles;
}

export class Character{
    constructor(q, r, game, name = 'Steve'){
        // This is an ABSTRACT CLASS now
        if (this.constructor == Character) throw new Error("Abstract classes can't be instantiated.");
        
        this.q = q; 
        this.r = r;
        this.name = name;
        this.game = game;
        this.board = game.board;
        //this.moveAble = false;
        this.moveRange = 5;
        this.sightRange = 8;
    }

    lineOfSight(tile, isSolid = true){
        var path = new Set();
        var N = distance(this.getTile(), tile) + 0.0;
        
        for (let i = 1; i <= N; i++){
            // Progression
            var q = lerp(this.q, tile.q, i/N);
            var r = lerp(this.r, tile.r, i/N);
            var s = lerp(-this.q-this.r, -tile.q-tile.r, i/N);
            
            // Rounding
            var nq = Math.round(q), nr = Math.round(r), ns = Math.round(s);
            var dq = Math.abs(nq-q), dr = Math.abs(nr-r), ds = Math.abs(ns-s);
            if (dq > dr && dq > ds) nq = -nr - ns;
            else if (dr > ds) nr = -nq - ns;
            else ns = -nq - nr;
            
            // Appending
            var t = this.board.getTile(nq, nr);

            // Check if this is valid

            if (t != this.getTile()){
                if (isSolid){
                    if (!t.properties.pathfindable && !t.properties.hittable) return false;
                }
                else {
                    if (!t.properties.seeThroughable) return false;
                }
                path.add(t);
                if (isSolid){
                    if (t.character != null) break;
                    if (!t.properties.pathfindable && t.properties.hittable) break;
                }
                else {
                    
                }
            }
            
        }
        
        
        if (path.size == 0 || path.size > this.sightRange || !path.has(tile)) return false;

        // Return the Path
        return path;
    }

    findValidPath(tile){
        function weightedDist(t1, t2){
            return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));
        }
        //return this.lineOfSight(tile);

        // Queue
        
        var start = this.getTile();

        var choice = [];         choice.push[start];
        var came_from = {};      came_from[start] = null;
        var path_cost = {};      cost_so_far[start] = 0;
        var heuristic_cost = {}; heuristic_cost[start] = 0;

        var current;
        var cost;
        while (choice.length > 0) {
            // Pop the element with least heuristic cost from the array
                current = choice.shift();

            if (current == tile) break;


            for (let next of neighboringTile(current, this.game)) {
                // To reach the tile next, the cost needed:
                cost = path_cost[current] + weightedDist(current, next);

                // Add or Update the path cost of the next if: 
                if (!Object.keys(path_cost).includes(next) || cost < path_cost[next]) {
                    // The tile next now have cost = cost
                        cost_so_far[next] = cost;
                    // Heuristic guess of the cost of the tile next
                        heuristic_cost[next] = cost + weightedDist(next, tile);
                        choice.push(next);
                    // For backward propagation
                        came_from[next] = current;
                }
            }

            // Keep arrray choice as priority queue
                choice.sort((t1, t2)=>{
                    return heuristic_cost[t1] - heuristic_cost[t2];
                });
        }
        
        // Back traverse
        current = tile;
        var path = []
        while (current != start) {
            path.push(current);
            current = came_from[current];
        }
        //path.push(start);
        path.reverse();

        return path;
    }

    moveTo(tile) {
        var path = this.findValidPath(tile);
        
        if (!path) return false;

        path.forEach((t)=>{
            // Before Updating coordinate
            this.getTile().characterLeave();
            
            // Adjust the character facing
            this.facing(t.q, t.r);

            // Update coordinate
            this.q = t.q; this.r = t.r;

            // After Updating coordinate
            this.getTile().characterEnter(this);
        });
        return true;
    }

    facing(q, r){
        var tile = this.game.board.getTile(q, r);
        this.mesh.rotation.y = Math.atan2(tile.x - this.getTile().x, tile.z - this.getTile().z);
    }
    
    getTile(){
        return this.game.board.getTile(this.q, this.r);
    }

    //
    // Event Handling
    //

    select(){
        this.game.selectedObject = this;
        this.getTile().selected();
    }

    deselect(){
        if (this.game.selectedObject == this) this.game.selectedObject = null;
        this.getTile().deselected();
    }

    hovering(){
        this.getTile().hovering();
    }
    
    deHovering(){
        this.getTile().deHovering();
    }

    

    //helper function (todo: better open a new file for render related helper function)
    

}