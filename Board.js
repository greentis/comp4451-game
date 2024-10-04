import * as THREE from 'three';
import {Tile} from './Tile.js';
import { TileProperties } from './TileProperties.js';
import {Game} from './main.js';
import { cover } from 'three/src/extras/TextureUtils.js';
//import * as math from 'mathjs';

var lerp = (a, b, t) => {return a + (b - a) * t;}
var distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
var sigmoid = (x) => {return 1 / (1 + Math.exp(-x));}

export class Board {
    constructor(game){
        this.game = game;

        this.body = new THREE.Object3D();
        var geometry = new THREE.PlaneGeometry( 100, 100 );
        var material = new THREE.MeshPhongMaterial( {color: 0x052010 ,side: THREE.DoubleSide} );
        this.mesh = new THREE.Mesh( geometry, material );
        this.body.add(this.mesh);
        this.mesh.rotateX(Math.PI/2);

        this.mesh.userData = this;
        

        this.grids = new Map();
        this.path = [];
        this.lightedGrid = new Array();
        this.adjacentTiles = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]; // pre-calculated adjacent tiles coordinates change

        //below variables are for polygonal generation only
        this.roomLength = 8; //control the Length of the map
        this.roomWidth = 8; //control the Width of the map
        this.roomSizeRange = 0; //control the variation of the size of the room(+/- roomSizeRange)
        this.roomPercentage = 0.7; //control around how many percentage of rock tile in the map will be turned into default tile
        this.wallThreshold = 0.8; //control the threshold of the wall tile conversion from rock tile
        this.coverThreshold = 0.3; //control the threshold of the cover tile conversion from rock tile
                                   //not that cover threshold should be smaller than wall threshold
            if(this.coverThreshold >= this.wallThreshold) this.coverThreshold = this.wallThreshold;
        //this.generate();
        this.generatePolygonal();
    }
    
    generate(){
        var width = 6;
        var length = 20;
        var boundary = 2;
        this.qmin = -width, this.qmax = width;
        this.rmin = -length, this.rmax = boundary;
        this.smin = -boundary, this.smax = length;

        this.forEachGrid((q, r)=>{
            var x = q * Math.cos(Math.PI / 6);
            var y = 0;
            var z = r + q * Math.cos(Math.PI / 3);
            var tile = new Tile(q, r, x, y, z,this.game, TileProperties.TYPE['Default']);
            
            // Add tile to map
            this.body.add(tile.body);
            this.grids.set(q.toString()+r.toString(), tile);
        });
                
    }

    generatePolygonal(){
        //generate the map with polygonal grid
        //1. set the size of the map by 3 radius
        //2. make the shape of map become irregular by changing some of the tile to void tile, while keeping remaining tile as rock tile
        //3. generate the default tile first
        //4. generate other type of tile(wall, cover, water e.t.c) based on the default tile
        //5. generate the tile based on the annotated map


        // 1. set the size of the map by 3 radius
        //generat random map with hexagon grid
        //setting random seed
        // cover all the map with rock first
        var seed = 235710;//401018;//Math.round(Math.random()* 900000 + 100000);
        console.log('This board have seed ', seed);
        if (this.roomSizeRange == 0) {
            var width = this.roomWidth;
            var length = this.roomLength;
        }else{
            var width = this.roomWidth + Math.round((seed % this.roomSizeRange) * perlinNoise2D(seed, 37, 13));
            var length = this.roomLength + Math.round( (seed % this.roomSizeRange) * perlinNoise2D(seed, 13, 37));
        }
        //var boundary = 20;
        console.log('width', width, 'length', length);
        this.qmin = -width, this.qmax = width;
        this.rmin = -length, this.rmax = length;
        //this.smin = -length, this.smax = boundary;
        var temp = {};
        var totalArea = 0;

        //2.1 initialize the temp array
        //change the type of all the non-void tile to rock
        for (let q = -width; q <= width; q++){
            temp[q] = {};
            for (let r = -length; r <= length; r++){
                temp[q][r] = TileProperties.TYPE['Rock'];
                if(!this.checkBoardBoundaries(q, r, width, length)) totalArea++;
            }
        }

       // 3. generate the default tile first
        //the outermost layer must be rock
        // select a random tile as the starting expanding point
        // when expanding, the rock tile near the expanding point have chance to be add into the expanding point list
        // the rock tile get added into the expanding point list will be turned into default tile
        // if the rock tile does not be turned into default tile, it will be added to the wall list
        // rock tile in the wall list will no longer be put into the expanding point list
        // and repeat the process to expand the map
        var expandedTile = new Set();
        var defaultTile = new Set();
        var wallTile = new Set();
        var startingTile ={q: Math.round(seed % (2 * width - 1) - width + 1), r:
                            Math.round(seed % (2* length - 1) - length + 1)}; 
        temp[startingTile.q][startingTile.r] = TileProperties.TYPE['Default']; 
        expandedTile.add(startingTile);
        defaultTile.add(startingTile);
        console.log('Starting Tile is ', startingTile.q, startingTile.r);
        
        // 3.1 expand the map
        // get the number of tile in defaultTile
        // if the number of tile in defaultTile is less than room percentage of the total number of tile in the map
        // then continue the expansion
        // else stop the expansion
        // the expansion will stop when the number of tile in defaultTile is greater than percentage of the total number of tile in the map
        // or the expandedTile list is empty
        var expandIteration = 1.0;
        while( defaultTile.size < (this.roomPercentage - (seed % 67)/1000.0) * totalArea){ //bug1
            // keep the expandedTile list as defaultTile list
            // clear the wallTile list
            //console.log('Iteration: ', expandIteration);
            //console.log('default tile', defaultTile);
            
            expandedTile = new Set(defaultTile);
            //set all of the tile in wallTile list to rock tile
            wallTile.forEach((t)=>{
                temp[t.q][t.r] = TileProperties.TYPE['Rock'];
            });
            wallTile = new Set();


            while (expandedTile.size > 0 && defaultTile.size < (this.roomPercentage + (seed % 7)/100.0) * totalArea){ //bug1
                
                //console.log('default tile', defaultTile.size, 'expanded tile', expandedTile.size);
                expandedTile.forEach((t)=>{
                    if (defaultTile.size >= (this.roomPercentage + (seed % 67)/1000.0) * totalArea){
                        //console.log('default tile', defaultTile.size, 'expanded tile', expandedTile.size);
                        expandedTile.clear();
                        return;
                    } 
                    
                    var adjacent = this.findAdjacent(t.q, t.r, width, length);
                    adjacent.forEach((a)=>{
                        if (this.checkBoardBoundaries(a.q, a.r, width, length)) return; //skip the tile if it is at the boundary of the board
                        //console.log('a',a);
                        if (temp[a.q][a.r] == TileProperties.TYPE['Wall']) return;
                        if (temp[a.q][a.r] == TileProperties.TYPE['Default']) return;

                        //checkValues should based on the seed, but not math.random()
                        //so that the map is generated same every time if same seed
                        //checkValues will increase as the iteration increase
                        //to have a lenient check on the tile to be turned into default tile
                        //so that avoid too few default tile in the map
                        var checkingValues = (expandIteration - 1) / 250.0 + perlinNoise2D(seed, a.q, a.r);
                        //console.log('q', a.q, 'r', a.r, 'checkingValues', checkingValues);

                        if (temp[a.q][a.r] != TileProperties.TYPE['Default'] && checkingValues > (1-this.roomPercentage)){
                            temp[a.q][a.r] = TileProperties.TYPE['Default'];
                            defaultTile.add(a);
                            expandedTile.add(a);
                        }else{
                            temp[a.q][a.r] = TileProperties.TYPE['Wall'];
                            //console.log('Wall Tile: q', a.q, 'r', a.r);
                            wallTile.add(a);
                        }
                    });
                    expandedTile.delete(t);
                });
            }
            expandIteration++;
            
        }
        
        console.log('iteration', expandIteration);
        console.log('room percentage', this.roomPercentage, "total area", totalArea, "range", (seed % 67)/1000.0);
        console.log('default tile', defaultTile.size);
        console.log('target area', (this.roomPercentage + (seed % 67)/1000.0) * totalArea);
        console.log('min area', (this.roomPercentage - (seed % 67)/1000.0) * totalArea);
        
        /*
        //testing perlin noise
        var test1 = {};
        for(let q = -width; q <= width; q++){
            test1[q] = {};
            for(let r = -length; r <= length; r++){
                test1[q][r] = perlinNoise2D(seed, q, r);
            }
        }
        console.log('perlinNoise2D', test1);
        //testomg perlin noise in wallTile
        var test = {};
        var seedWall = perlinNoise2D(123456, wallTile.size, defaultTile.size) * 1000000.0;
        console.log('seedWall', seedWall);
        wallTile.forEach((t)=>{
            if (test[t.q] == undefined) test[t.q] = {};
            test[t.q][t.r] = perlinNoise2D(seedWall, t.q, t.r);
        });
        console.log('perlinNoise2D in wallTile', test);
        */
        
        // 4. generate other type of tile(wall, cover, water e.t.c) based on the default tile
        // 4.1 convert some of the rock tile to wall tile
        //doing iteration in the wallTile list
        //for each tile in the wallTile list
        // it turn into wall tile if checkValues is greater than wallThreshold
        var seedWall = perlinNoise2D(seed, wallTile.size, defaultTile.size) * 1000000.0;
        console.log('wallTile size(before 3.1):', wallTile.size);
        var totalWallTile = wallTile.size;
        var rockTile = new Set();
        var rockIteration = 1.0;
        while ( rockTile.size < totalWallTile * (1 - this.wallThreshold) - (seedWall %37) / 1000.0){
            wallTile.forEach((t)=>{
                //console.log('perlinNoise2D', perlinNoise2D(seedWall, t.q, t.r));
                var checkingValues = (rockIteration - 1) / 250.0 + perlinNoise2D(seedWall, t.q, t.r);
                if (checkingValues > this.wallThreshold){
                    rockTile.add(t);
                    wallTile.delete(t);
                    temp[t.q][t.r] = TileProperties.TYPE['Rock'];
                    //console.log('Rock Tile: q', t.q, 'r', t.r);
                }
            });
            rockIteration++;
        }   
        /*console.log('wallTile size(after 3.1):', wallTile.size);
        console.log('rockTile size:', rockTile.size);
        console.log('rockTile', rockTile);*/
        
        // 4.2 convert some of the rock tile to cover tile
        //doing iteration in the rockTile list
        //for each tile in the rockTile list
        // it turn into cover tile if checkValues is smaller than coverThreshold
        //var totalRockTile = rockTile.size;
        var coverTile = new Set();
        var coverIteration = 1.0;
        while ( coverTile.size < totalWallTile * (this.coverThreshold) - (seedWall % 37) / 1000.0){
            wallTile.forEach((t)=>{
                var checkingValues = -1.0 * (coverIteration - 1) / 250.0 + perlinNoise2D(seedWall, t.q, t.r);
                //console.log('perlinNoise2D', perlinNoise2D(seed, t.q, t.r));
                //console.log('t.q', t.q, 't.r', t.r, 'checkingValues', checkingValues);
                if (checkingValues < this.coverThreshold){
                    coverTile.add(t);
                    wallTile.delete(t);
                    temp[t.q][t.r] = TileProperties.TYPE['Cover'];
                }
            });
            coverIteration++;
        }
        /*console.log('coverIteration', coverIteration);
        console.log('wallTile size(after 3.2):', wallTile.size);
        console.log('coverTile size:', coverTile.size);
        console.log('coverTile', coverTile);*/
        
        // 4.3.1 generate the water(pond) tile
        // 4.3.2 generate the water(river) tile

        // 4.4 
       

        // 5. generate the tile based on the annotated map
        this.forEachGrid((q, r)=>{
            var x = q * Math.cos(Math.PI / 6);
            var y = 0;
            var z = r + q * Math.cos(Math.PI / 3);
            var tile = new Tile(q, r, x, y, -z,this.game, temp[q][r]);
            
            // Add tile to map
            this.body.add(tile.body);
            this.grids.set(q.toString()+r.toString(), tile);
        });
        
        
    }

    getTile(q, r){
        //console.log('getTile: q: ', q, 'r: ', r);
        return this.grids.get(q.toString()+r.toString());
    }

    hexRound(q, r, s){
        var nq = Math.round(q), nr = Math.round(r), ns = Math.round(r);
        var dq = Math.abs(nq-q), dr = Math.abs(nr-r), ds = Math.abs(ns-s);

        if (dq > dr && dq > ds) nq = -nr - ns;
        else if (dr > ds) nr = -nq - ns;
        else ns = -nq - nr;
        return this.getTile(nq, nr);
    }

    checkBoardBoundaries(q, r, width, length){
        // return true if the tile locates at exactly the boundary of the board
        if (q == -width || q == width || r == -length || r == length) return true;
        return false;
    }

    findAdjacent(q, r, width, length){
        var adjacent = new Array();
        for (let i = 0; i < 6; i++){
            var q1 = q + this.adjacentTiles[i][0];
            var r1 = r + this.adjacentTiles[i][1];
            //cant use getTile here
            if (q1 < -width || q1 > width || r1 < -length || r1 > length) continue;
            adjacent.push({q: q1, r: r1});
            
        }
        return adjacent;
    }


    findPath_straight(q1, r1, q2, r2){
        //q1, r1: start q, r; q2,r2: end q, r
        //find straight line path from start to end(not concern the cost and unpasable tile)
        if (q1 == q2 && r1 == r2){
            return [];
        }
        var path = [];
        var currentTile = this.getTile(q1, r1);
        var endTile = this.getTile(q2, r2);
        path.push(currentTile);
        
        var temp = currentTile;
        var s1 = currentTile.s;
        var s2 = endTile.s;
        var N = distance(currentTile, endTile);
        for (var i = 0.0; i < N; i++){
            var q = lerp(q1, q2, i/N);
            var r = lerp(r1, r2, i/N);
            var s = lerp(s1, s2, i/N);
            var tile = this.hexRound(q, r, s);    
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
        


    findPath(q1, sr, q2, r2){
    //warning: havent test if this function works
        //q1, r1: start q, r; q2, r2: end q, r
        //A* algorithm
        //1. Initialize both open and closed list
        
        //2. Loop
        
    }

    clearMarkings(){
        this.lightedGrid.forEach((t)=>{
            if (t.state != 'selected') t.state = 'default';
            t.render();
        });
        this.path = [];

    }

    //
    // Private Helper Function
    // 
    forEachGrid(func){
        var vaildGrid = [];
        for (let q = this.qmin; q <= this.qmax; q++){
            for (let r = this.rmin; r <= this.rmax; r++){
                let s = 0 - q - r;
                if (s < this.smin || s > this.smax) continue;  
                func(q, r, s);
            }
        }
    }

    //
    // Event Handling
    //

    select(){}
    deselect(){}
    hovering(){}
    deHovering(){}
}

//helper function
var perlinNoise2D = (seed, x, y) => {
    //2D Perlin Noise
    //https://en.wikipedia.org/wiki/Perlin_noise
    //https://gist.github.com/banksean/304522
    //warning: this function is not perlind noise, but a random number generator instead

    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return Math.abs(h) / 2147483648.0;
};