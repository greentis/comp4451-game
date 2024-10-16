// Abstract Parent Class of Player character & AI character
import * as THREE from 'three';
import {Game} from './main.js';
import { Tile } from './Tile.js';
import {Board} from './Board.js';
import { TileProperties } from './TileProperties.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';
import { ActionTracker } from './ActionTracker.js';

// private method
const lerp = (a, b, t) => {return a + (b - a) * t;}
const distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
const neighboringTile = (tile, game) => {
    var q = tile.q; var r = tile.r;
    var tiles = [];
    for (let i = -1; i <= 1; i++){
        for (let j = -1; j <= 1; j++){
            if (Math.abs(i + j) == 2 || (i == 0 && j == 0)) continue;
            var t = game.board.getTile(q + i, r + j); 
            if (t) tiles.push(t);
        }
    }
    return tiles;
}

export class Character{
    constructor(q, r, health, game, name = 'Steve'){
        // This is an ABSTRACT CLASS now
        if (this.constructor == Character) throw new Error("Abstract classes can't be instantiated.");
        
        this.q = q; 
        this.r = r;
        this.name = name;
        this.game = game;
        this.board = game.board;
        

        this.health = health;

        // Constants
        //this.moveAble = false;
        this.moveRange = 8;
        this.sightRange = 8;
        this.body = new THREE.Group();
        this.action = new ActionTracker(this);
        
        this.action.setActionPoint(0);
    }

    // This function returns:
    //     a set, if the lineOfSight establishes
    //     false, if there are no valid lineOfSight
    // for checking an attack hits the tile, use isSolid = true
    // for checking what board elements the players SEES, use isSolid = false
    lineOfSight(tile, isSolid = true){
        var path = new Set();
        var N = distance(this.getTile(), tile) + 0.0;
        
        var t;
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
            t = this.board.getTile(nq, nr);

            // Check if this is valid

            if (t != this.getTile()){
                if (!t.properties.seeThroughable && !t.properties.hittable) return false;
                path.add(t);
                if (isSolid){
                    if (t.character != null) break;
                    if (!t.properties.seeThroughable && t.properties.hittable) break;
                }
                else {
                    if (!t.properties.seeThroughable) break;
                }
            }
            
        }
        
        // Not reaching the target tile
        if (t != tile) return false;
        
        if (path.size == 0 || path.size > this.sightRange || !path.has(tile)) return false;

        // Return the Path
        return path;
    }

    // This function returns an array of the path in order
    // An array with .length == 0 indicates that there is no valid path
    // between the character and the target tile
    // ** There are no path between the same tile
    findValidPath(tile, moveRange = this.moveRange){
        function weightedDist(t1, t2){
            if (t2.character) return 100;
            return t2.properties.passCost;
        }
        //return this.lineOfSight(tile);


        // Queue
        var start = this.getTile();

        var choice = [start];
        var came_from = {};      came_from[start.mesh.name] = null;
        var path_cost = {};      path_cost[start.mesh.name] = 0;
        var heuristic_cost = {}; heuristic_cost[start.mesh.name] = weightedDist(start, tile);

        var current;
        var cost;
        var timeout = 0;
        var path = [];
        while (choice.length > 0 && timeout < 300) {
            
            timeout++;
            // Pop the element with least heuristic cost from the array
                current = choice.shift();
            
            if (current == tile) {
                current = tile;
                timeout = 0;
                while (current != null && timeout < 300) {
                    timeout++;
                    
                    path.push(current);
                    current = came_from[current.mesh.name];
                }
                //path.push(start);
                path.reverse();
                path.shift();
                return path;
            }

            for (let next of neighboringTile(current, this.game)) {
                // To reach the tile next, the cost needed:
                cost = path_cost[current.mesh.name] + weightedDist(current, next);
                if (cost > moveRange) continue;
                // Add or Update the path cost of the next if: 
                if (!Object.keys(path_cost).includes(next.mesh.name) || cost < path_cost[next.mesh.name]) {
                    // The tile next now have cost = cost
                        path_cost[next.mesh.name] = cost;
                    // Heuristic guess of the cost of the tile next
                        heuristic_cost[next.mesh.name] = cost + weightedDist(next, tile);
                        choice.push(next);
                    // For backward propagation
                        came_from[next.mesh.name] = current;
                        //console.log(timeout , next.mesh.name, came_from[next.mesh.name]);
                }
            }

            // Keep arrray choice as priority queue
                choice.sort((t1, t2)=>{
                    return heuristic_cost[t1.mesh.name] - heuristic_cost[t2.mesh.name];
                });
                
        }
        
        return [];
    }

    async moveTo(tile) {
        

        var path = this.findValidPath(tile);
        
        if (!path) return false;
        let x,y,z;
        for (let t of path){
            // Before Updating coordinate
            this.body.position.x = x = this.getTile().body.position.x;
            this.body.position.y = y = this.getTile().body.position.y;
            this.body.position.z = z = this.getTile().body.position.z;
            this.getTile().characterLeave();
            this.game.scene.add(this.body);
            // Adjust the character facing
            this.facing(t.q, t.r);

            // Update coordinate
            this.q = t.q; this.r = t.r;

            let start;
            const waitForMoveAnimation = ()=>{
                return new Promise((resolve)=>{
                    // the animation frame function
                    const animate = (timestamp)=>{
                        // record the starting time
                        if (!start) start = timestamp;

                        // time represents time passed since start
                        const time = timestamp - start;

                        // ~ Animation ~
                        this.body.position.x = lerp(x, t.x, time/200);
                        this.body.position.z = lerp(z, t.z, time/200);

                        if (time < 200) { 
                            // Call another animation frame
                            requestAnimationFrame(animate);
                        }
                        else{
                            // Stop the animation after 0.2 seconds
                            resolve();
                        }
                    }

                    // Call the first animation frame
                    requestAnimationFrame(animate);
                })
            }

            // The mother function is async to be ableto await
            await waitForMoveAnimation();

            // After Updating coordinate
            this.body.position.x = 0;
            this.body.position.y = 0;
            this.body.position.z = 0;
            this.getTile().characterEnter(this);
        }
        this.action.reduceActionPoint(1);
        return true;
    }

    
      
      

    attack(tile){
        this.action.reduceActionPoint(2);

        let path = this.lineOfSight(tile, true);
        
        // TODO: calculate the hit rate
        console.log(this.name, " is attacking ", tile.mesh.name);
        this.weapon.dealsDamage(tile, this);
    }

    takeDamage(damage){
        this.health -= damage;
        console.log(this.health);
        if (this.health <= 0) {
            this.body.visible = false;
            if (this.game.enemy.has(this)) this.game.enemy.delete(this);
            console.log(this.name, " is dead");
            delete this;
        }
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
        this.getTile().selected();
    }

    deselect(){
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