import * as THREE from 'three';
import {Tile} from './Tile.js';
import { TileProperties } from './TileProperties.js';
import {Game} from './main.js';
import { cover } from 'three/src/extras/TextureUtils.js';
import { noise } from './perlin.js';
import { Hunter } from './Hunter.js';
//import * as math from 'mathjs';

var lerp = (a, b, t) => {return a + (b - a) * t;}
var distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
// distanceQR: calculate the distance between two hexagon tile in q,r coordinate given only
var distanceQR = (t1, t2) => {var t1s = -t1.q - t1.r; var t2s = -t2.q - t2.r; return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1s - t2s));}
// getHeights: get the height of the tile based on the type of the tile
var distanceToBoundary = (q, r, width, length) => {
    return Math.min(width - Math.abs(q), length - Math.abs(r));
}

var getHeights = (a) => {
    switch (a){
        case TileProperties.TYPE.Void:
            return 10.0;
        case TileProperties.TYPE.Rock:
            return 0.6;
        case TileProperties.TYPE.Default:
            return 0.0;
        case TileProperties.TYPE.Wall:
            return 0.4;
        case TileProperties.TYPE.Cover:
            return 0.3;
        case TileProperties.TYPE.Water:
            return 0.0;
        default:
            return 0.0;
    }
}
//xxhash: a simple hash function
var xxhash = (seed, x, y) => {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return Math.abs(h) / 2147483648.0;
};


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
            var tile = new Tile(q, r, x, y, z,this.game, TileProperties.TYPE.Default);
            
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

        
        //below variables are for polygonal generation only
        this.roomLength = 18; //control the Length of the map
        this.roomWidth = 18; //control the Width of the map
        this.roomSizeRange = 0; //control the variation of the size of the room(+/- roomSizeRange)
        this.roomPercentage = 0.7; //control around how many percentage of rock tile in the map will be turned into default tile
        this.wallThreshold = 0.7; //control the threshold of the wall tile conversion from rock tile
        this.coverThreshold = 0.4; //control the threshold of the cover tile conversion from rock tile
                                   //not that cover threshold should be smaller than wall threshold
            if(this.coverThreshold >= this.wallThreshold) this.coverThreshold = this.wallThreshold;
        this.rainFall = 0.1; //control the rain fall of the map, tile with height below rain fall will be turned into water tile
        this.riverSource = 0.85; //control the source of the river, tile with height higher than river source will start the river tracing 
        this.vegetationCoverage = 0.1; //control the coverage of the vegetation in the map
        this.playerToBoard = 3; //control the maximum number of tile from player to the board boundary allowed

        // 1. set the size of the map by 3 radius
        //generat random map with hexagon grid
        //setting random seed
        // cover all the map with rock first
        var seed = 710; 71045;//Math.round(Math.random()* 900000 + 100000);
        seed = seed % 65536; //make sure the seed is within 0 - 65536, so that noise.seed() can accept it
        console.log('This board have seed ', seed);
        var perlinNoise = new noise();
        perlinNoise.seed(seed);

        if (this.roomSizeRange == 0) {
            var width = this.roomWidth;
            var length = this.roomLength;
        }else{
            var width = this.roomWidth + Math.round((seed % this.roomSizeRange) * xxhash(seed, 37, 13));
            var length = this.roomLength + Math.round( (seed % this.roomSizeRange) * xxhash(seed, 13, 37));
        }
        //var boundary = 20;
        //console.log('width', width, 'length', length);
        this.qmin = -width, this.qmax = width;
        this.rmin = -length, this.rmax = length;
        //this.smin = -length, this.smax = boundary;

        this.temp = {};
        this.totalArea = 0;
        var startingTile ={q: Math.round(seed % (2 * width - 1) - width + 1), r:
            Math.round(seed % (2* length - 1) - length + 1)}; 
        console.log('Starting Tile is ', startingTile.q, startingTile.r); 
        

        // 2. make the shape of map become irregular by changing some of the tile to void tile, while keeping remaining tile as rock tile
        //2.1 initialize the temp array
        for (let q = -width; q <= width; q++){
            this.temp[q] = {};
            for (let r = -length; r <= length; r++){
                this.temp[q][r] = TileProperties.TYPE.Void;
            }
        }
        this.temp[startingTile.q][startingTile.r] = TileProperties.TYPE.Rock;

        //2.2 change the type of all the non-void tile to rock
        // we using expansion method to expand the rock tile from the starting tile
        // proabability of the void tile to be turn into rock tile is:
        // p = k_1 * (1 - countNonVoid / (width * 2 + 1) * (length * 2 + 1))
        //   + k_2 * (# of nonVoid tile in adjacent tiles) 
        //   + k_3 * ( checkingValues based on the seed and q,r)
        //   + k_4 * xxhash(seed * target, q, r)
        //   + 0.01 * iteration
        // checkingValues = distance(voidStartingTile, (q,r)) * 0.15 - 1 + xxhash(seed, q, r) 
        // the iteration will end when countNonVoid > target values
        // target values = (0.2 + 0.6 * roomPercentage + 0.2 * (seed % 80) / 100.0) *(width * 2 + 1) * (length * 2 + 1)
        var countNonVoid = 0.0;
        var k1 = 0.15;   //factor of total nonVoid tile
        var k2 = 0.07;  //factor of neighbor nonVoid tile
        var k3 = 2.25; //factor of checkingValues
        var k4 = 0.4; //factor of hash noise value
        var target = //(width * 2 + 1) * (length * 2 + 1); 
                    Math.round((0.2 + 0.6 * this.roomPercentage + 0.2 * (seed % 80) / 100.0) * (width * 2 + 1) * (length * 2 + 1));
        //console.log('target', target);

        //generate a void value map based on perlin noise for later used in k3 component of the probability
        var voidMap = {};
        for (let q = -width; q <= width; q++){
            voidMap[q] = {};
            for (let r = -length; r <= length; r++){
                voidMap[q][r] = perlinNoise.perlin2(seed*target, q/width, r/length);
            }
        }


        var expandedTile = new Set();
        var holdTile = new Set();
        var nonVoidTile = new Set();
        expandedTile.add(startingTile);
        nonVoidTile.add(startingTile);

        var iteration = 1.0;
        while (countNonVoid < target){
            //console.log('Iteration: ', iteration);
            //console.log('countNonVoid', countNonVoid, 'target', target);
            if (iteration > 1000) break;

            expandedTile = new Set(nonVoidTile);
            holdTile.forEach((t)=>{
                this.temp[t.q][t.r] = TileProperties.TYPE.Void;
            });
            holdTile = new Set();

            while (expandedTile.size > 0){
                expandedTile.forEach((t)=>{
                    if (countNonVoid >= target){
                        expandedTile.clear();
                        return;
                    }
                    
                    var adjacent = this.findAdjacent(t.q, t.r, width, length, false);
                    adjacent.forEach((a)=>{
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Hold) return;
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Rock) return;

                        //console.log('a',a);
                        var checkingValues = voidMap[a.q][a.r] - 1;
                        var neighborNonVoid = 0;
                        var adjacent1 = this.findAdjacent(a.q, a.r, width, length);
                        adjacent1.forEach((a1)=>{
                            if (this.temp[a1.q][a1.r] == TileProperties.TYPE.Rock) neighborNonVoid++;
                        });


                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Void){
                            var p = k1 * (1 - countNonVoid / ((width * 2 + 1) * (length * 2 + 1))) 
                                    + k2 * neighborNonVoid
                                    + k3 * checkingValues
                                    + k4 * xxhash(seed * target, a.q, a.r)
                                    + 0.01 * iteration;
                            //console.log('p', p);
                            if (p > 0.5){
                                this.temp[a.q][a.r] = TileProperties.TYPE.Rock;
                                nonVoidTile.add(a);
                                countNonVoid++;
                            }else{
                                this.temp[a.q][a.r] = TileProperties.TYPE.Hold;
                                holdTile.add(a);
                            }
                        }
                    });
                    expandedTile.delete(t);
                });
            }
            iteration++;
        }
        //console.log('Iteration of step 2.2: ', iteration);
        
        //change all hold tile to void tile
        holdTile.forEach((t)=>{
            this.temp[t.q][t.r] = TileProperties.TYPE.Void;
        });
        holdTile.clear();
        

        for (let q = -width; q <= width; q++){
            for (let r = -length; r <= length; r++){
                if(this.temp[q][r] == TileProperties.TYPE.Void) continue;
                if(!this.checkBoardBoundaries(q, r, width, length, this.temp)) this.totalArea++;
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
        expandedTile = new Set();
        var defaultTile = new Set();
        var wallTile = new Set();

        expandedTile.add(startingTile);
        defaultTile.add(startingTile);
        this.temp[startingTile.q][startingTile.r] = TileProperties.TYPE.Default;
        
        // 3.1 expand the map
        // get the number of tile in defaultTile
        // if the number of tile in defaultTile is less than room percentage of the total number of tile in the map
        // then continue the expansion
        // else stop the expansion
        // the expansion will stop when the number of tile in defaultTile is greater than percentage of the total number of tile in the map
        // or the expandedTile list is empty
        var expandIteration = 1.0;
        var lastWallTile = new Set([...wallTile]);
        while( defaultTile.size < (this.roomPercentage - (seed % 67)/1000.0) * this.totalArea){ //bug1
            // keep the expandedTile list as defaultTile list
            // clear the wallTile list
            //console.log('Iteration: ', expandIteration);
            //console.log('default tile', defaultTile);
            if (expandIteration > 1000) break;
            
            expandedTile = new Set(defaultTile);
            //set all of the tile in wallTile list to rock tile
            lastWallTile = new Set([...wallTile]);
            wallTile.forEach((t)=>{
                this.temp[t.q][t.r] = TileProperties.TYPE.Rock;
            });
            wallTile = new Set();


            while (expandedTile.size > 0 && defaultTile.size < (this.roomPercentage + (seed % 7)/100.0) * this.totalArea){ //bug1
                
                //console.log('default tile', defaultTile.size, 'expanded tile', expandedTile.size);
                expandedTile.forEach((t)=>{
                    if (defaultTile.size >= (this.roomPercentage + (seed % 67)/1000.0) * this.totalArea){
                        //console.log('default tile', defaultTile.size, 'expanded tile', expandedTile.size);
                        expandedTile.clear();
                        return;
                    } 
                    
                    var adjacent = this.findAdjacent(t.q, t.r, width, length);
                    adjacent.forEach((a)=>{
                        if (this.checkBoardBoundaries(a.q, a.r, width, length,this.temp)) return; //skip the tile if it is at the boundary of the board
                        //console.log('a',a);
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Wall) return;
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Default) return;

                        //checkValues should based on the seed, but not math.random()
                        //so that the map is generated same every time if same seed
                        //checkValues will increase as the iteration increase
                        //to have a lenient check on the tile to be turned into default tile
                        //so that avoid too few default tile in the map
                        var checkingValues = (expandIteration - 1) / 250.0 + xxhash(seed, a.q, a.r);
                        //console.log('q', a.q, 'r', a.r, 'checkingValues', checkingValues);

                        if (this.temp[a.q][a.r] != TileProperties.TYPE.Default && checkingValues > (1-this.roomPercentage)){
                            this.temp[a.q][a.r] = TileProperties.TYPE.Default;
                            defaultTile.add(a);
                            expandedTile.add(a);
                            lastWallTile.delete(a);
                        }else{
                            this.temp[a.q][a.r] = TileProperties.TYPE.Wall;
                            //console.log('Wall Tile: q', a.q, 'r', a.r);
                            wallTile.add(a);
                        }
                    });
                    expandedTile.delete(t);
                });
            }
            expandIteration++;
        }
        if(lastWallTile.size != 0){
            wallTile = new Set([...lastWallTile]);
        }

        //console.log('iteration at step 3.1', expandIteration);
        //console.log('room percentage', this.roomPercentage, "total area", this.totalArea, "range", (seed % 67)/1000.0);
        //console.log('default tile', defaultTile.size);
        //console.log('target area', (this.roomPercentage + (seed % 67)/1000.0) * this.totalArea);
        //console.log('min area', (this.roomPercentage - (seed % 67)/1000.0) * this.totalArea);
        //console.log('wallTile size(before 4.1):', wallTile.size);
        
        // 4. generate other type of tile(wall, cover, water e.t.c) based on the default tile
        // 4.1 convert some of the rock tile to wall tile
        //doing iteration in the wallTile list
        //for each tile in the wallTile list
        // it turn into wall tile if checkValues is greater than wallThreshold
        var seedWall = xxhash(seed, wallTile.size, defaultTile.size) * 1000000.0;
        var totalWallTile = wallTile.size;
        var rockTile = new Set();
        var rockIteration = 1.0;
        while ( rockTile.size < totalWallTile * (1 - this.wallThreshold) - (seedWall %37) / 1000.0){
            if (rockIteration > 1000) break;

            wallTile.forEach((t)=>{
                //console.log('xxhash', xxhash(seedWall, t.q, t.r));
                var checkingValues = (rockIteration - 1) / 250.0 + xxhash(seedWall, t.q, t.r);
                if (checkingValues > this.wallThreshold){
                    rockTile.add(t);
                    wallTile.delete(t);
                    this.temp[t.q][t.r] = TileProperties.TYPE.Rock;
                    //console.log('Rock Tile: q', t.q, 'r', t.r);
                }
            });
            rockIteration++;
        }   
        //console.log('wallTile size(after 4.1):', wallTile.size);
        //console.log('rockTile size:', rockTile.size);
        //console.log('rockTile', rockTile);
        
        // 4.2 convert some of the rock tile to cover tile
        //doing iteration in the rockTile list
        //for each tile in the rockTile list
        // it turn into cover tile if checkValues is smaller than coverThreshold
        //var totalRockTile = rockTile.size;
        var coverTile = new Set();
        var coverIteration = 1.0;
        while ( coverTile.size < totalWallTile * (this.coverThreshold) - (seedWall % 37) / 1000.0){
            if (coverIteration > 1000) break;
            wallTile.forEach((t)=>{
                var checkingValues = -1.0 * (coverIteration - 1) / 250.0 + xxhash(seedWall, t.q, t.r);
                //console.log('xxhash', xxhash(seed, t.q, t.r));
                //console.log('t.q', t.q, 't.r', t.r, 'checkingValues', checkingValues);
                if (checkingValues < this.coverThreshold){
                    coverTile.add(t);
                    wallTile.delete(t);
                    this.temp[t.q][t.r] = TileProperties.TYPE.Cover;
                }
            });
            coverIteration++;
        }
        //console.log('coverIteration', coverIteration);
        //console.log('wallTile size(after 4.2):', wallTile.size);
        //console.log('coverTile size:', coverTile.size);
        //console.log('coverTile', coverTile);
        
        // 4.3.0 generate the height map of the tile
        // the height of the tile is based on the perlin noise
        var heightMap = {};
        for (let q = -width; q <= width; q++){
            heightMap[q] = {};
            for (let r = -length; r <= length; r++){
                heightMap[q][r] = perlinNoise.perlin2(seed, q/width, r/length) 
                                + xxhash(seed, q, r)*0.25 
                                + getHeights(this.temp[q][r])
                                - 0.35;
            }
        }
        
        // 4.3.1 generate the water(pond) tile
        // the water tile is based on the height of the tile
        // if the height of the tile is below the rain fall, then it will be turned into water tile
        var waterTile = new Set();
        for (let q = -width; q <= width; q++){
            for (let r = -length; r <= length; r++){
                if (heightMap[q][r] < this.rainFall){
                    this.temp[q][r] = TileProperties.TYPE.Water;
                    waterTile.add({q: q, r: r});
                }
            }
        }
        //console.log('waterTile size:', waterTile.size);

        // 4.3.2 generate the water(river) tile
        // the river tile is based on the height of the tile
        // if the height of the tile is higher than the river source, then it will start the river tracing
        //river tracing: the river will start from the tile with height higher than the river source
        // for each source, it will find the most lowest tile in the adjacent tiles
        // and use that tile as the next source
        // repeat the process until the river reach the boundary of the map or all of the adjacent tiles are higher than the tile
        var riverTile = new Set();
        var riverSource = new Set();
        for (let q = -width; q <= width; q++){
            for (let r = -length; r <= length; r++){
                //avoid the void tile & boundary tile
                if (this.temp[q][r] == TileProperties.TYPE.Void) continue;
                if(this.checkBoardBoundaries(q, r, width, length, this.temp)) continue;
                if (heightMap[q][r] > this.riverSource){
                    this.temp[q][r] = TileProperties.TYPE.Water;
                    riverSource.add({q: q, r: r});
                    riverTile.add({q: q, r: r});
                }
            }
        }

        riverSource.forEach((s)=>{
            var riverEnd = false;
            var lowestHeight = heightMap[s.q][s.r];
            var source = s;
            while(!riverEnd){
                var temp = source;
                var adjacent = this.findAdjacent(source.q, source.r, width, length);
                adjacent.forEach((a)=>{
                    if(this.checkBoardBoundaries(a.q, a.r, width, length, this.temp)) return;

                    var height = heightMap[a.q][a.r];
                    
                    if (height < lowestHeight){
                        lowestHeight = height;
                        temp = a;
                    }
                });
                if (source.q == temp.q && source.r == temp.r){
                    riverEnd = true;
                }else{
                    this.temp[temp.q][temp.r] = TileProperties.TYPE.Water;
                    riverTile.add(temp);
                    source = temp;
                }
            }
        });
        //console.log('riverTile size:', riverTile.size);

        // 4.4 generate the vegetation tile
        // vegetation tile can be tree tile or bush tile
        // the vegetation tile is convert from non-boundary rock, default, cover, water(pond) tile
        // generate a vegetaion map based on the xxhash value
        var vegetationMap = {};
        var vegetationTile = new Set();
        for (let q = -width; q <= width; q++){
            vegetationMap[q] = {};
            for (let r = -length; r <= length; r++){
                vegetationMap[q][r] = xxhash(seed * this.vegetationCoverage * 137.0, q, r);
                if (this.temp[q][r] == TileProperties.TYPE.Void) vegetationMap[q][r] = 10.0;
                if (this.checkBoardBoundaries(q, r, width, length, this.temp)) vegetationMap[q][r] = 10.0; 

                if (vegetationMap[q][r] < this.vegetationCoverage){
                    vegetationTile.add({q: q, r: r});
                }
            }
        }
        

        // 4.4.1 generate the tree tile
        // 4.4.2 generate the bush tile
        // we consider turning the vegetation tile into tree tile or bush tile based on the tree value and bush value
        var treeHashTable = {
            [TileProperties.TYPE.Rock]: 0.2,
            [TileProperties.TYPE.Default]: 0.35,
            [TileProperties.TYPE.Cover]: 0.15,
            [TileProperties.TYPE.Water]: 0.15,
            [TileProperties.TYPE.Wall]: 0.15,
        };
        var bushHashTable = {
            [TileProperties.TYPE.Rock]: 0.0,
            [TileProperties.TYPE.Default]: 0.3,
            [TileProperties.TYPE.Cover]: 0.2,
            [TileProperties.TYPE.Water]: 0.5
        };
        
        
        vegetationTile.forEach((t)=>{
            var treeValue = 0.0;
            var bushValue = 0.0;

            var k1 = 1.0; //factor based on the type of adjacent tile and itself
            var k2 = 0.8; //factor based on the height of the tile
            var k3 = 0.5; //factor based on the perlin noise
            //factor 1: based on the type of adjacent tile and itself
            var adjacent = this.findAdjacent(t.q, t.r, width, length);
            treeValue += treeHashTable[this.temp[t.q][t.r]];
            bushValue += bushHashTable[this.temp[t.q][t.r]];
            adjacent.forEach((a)=>{
                treeValue += treeHashTable[this.temp[a.q][a.r]];
                bushValue += bushHashTable[this.temp[a.q][a.r]];
            });
            treeValue *= k1;
            bushValue *= k1;
           
            //factor 2: based on the height of the tile
            var height = heightMap[t.q][t.r];
            treeValue += (1 - height) * k2;
            bushValue += ((height - 0.45) ** 2 - 0.25)* k2;

            //factor 3: based on the perlin noise
            treeValue += perlinNoise.perlin2(seed * 137, t.q/width, t.r/length) * k3;
            bushValue += perlinNoise.perlin2(seed * 137, t.q/width, t.r/length) * k3;

            if(treeValue>bushValue){
                this.temp[t.q][t.r] = TileProperties.TYPE.Tree;
            }
            else{
                this.temp[t.q][t.r] = TileProperties.TYPE.Bush;
            }
        });

        // 4.4.3 convert the vegetation tile back to river tile if it is in the river tile originally
        // the vegetation tile in the river tile will be turned back to river tile
        riverTile.forEach((t)=>{
            if(this.temp[t.q][t.r] == TileProperties.TYPE.Tree || this.temp[t.q][t.r] == TileProperties.TYPE.Bush){
                this.temp[t.q][t.r] = TileProperties.TYPE.Water;
            }
        });
       

        //quick test of perlin noise
        var test = {};
        for(let q = -width; q <= width; q++){
            test[q] = {};
            for(let r = -length; r <= length; r++){
                test[q][r] = perlinNoise.perlin2(seed, q/width, r/length);
            }
        }
        console.log('perlin noise', test);

        


        //5. calculate the spawn point of the player in the map
        // the player will be added to the default tile or water tile(if no default tile)
        //random select spawn point for character1 based on the annotated map and seed
        this.playerSpawnPoints = {};
        for(let i = 0; i < 3; i++){ 
            //WARNING: this assume the character number is always 3, ignore some character may died already
            this.playerSpawnPoints[i] = {};
        }

        //5.1 find the spawn point for player 0
        var iteration = 0;
        var spawnPlayerDone = false;
        this.playerSpawnPoints[0] = {q: startingTile.q, r: startingTile.r};
        while(!spawnPlayerDone && distanceToBoundary(this.playerSpawnPoints[0].q, this.playerSpawnPoints[0].r, width, length) >= this.playerToBoard){
            if (iteration > 1000){
                //set the spawn point to the starting tile as the last resort
                this.playerSpawnPoints[0] = {q: startingTile.q, r: startingTile.r};
                break;
            }
            var q = Math.round(xxhash((seed +  iteration* 73) *163, this.playerSpawnPoints[0].q, this.playerSpawnPoints[0].r) * 2 * this.rmax - this.rmax + 1);
            var r = Math.round(xxhash((seed + iteration * 73) * 163, this.playerSpawnPoints[0].q, this.playerSpawnPoints[0].r) * 2 * this.rmax - this.rmax + 1);


            if (this.temp[q][r] == TileProperties.TYPE.Default){
                this.playerSpawnPoints[0] = {q: q, r: r};
                spawnPlayerDone = true;
            }else if (this.temp[q][r] == TileProperties.TYPE.Water && iteration > 250){
                this.playerSpawnPoints[0] = {q: q, r: r};
                spawnPlayerDone = true;
            }
            iteration++;
        }
        //console.log('iteration at step 6', iteration);
        console.log('Player Spawn Point 0: ', this.playerSpawnPoints[0]);

        //5.2 find the spawn point for other players
        // the spawn point for these characters will follow below rules:
        // 1. try the bottom left adjacent (q-1,r-1) of the player 0 spawn point
        // 2. if the tile is not default or water, then move clockwise to the next adjacent tile
        // 3. if all of the adjacent tile is not default or water, then move to the bottom left tile of next ring(q-2,r-2)
        // 4. then start again with clockwise movement
        // 5. repeat the process until find the spawn point
        
        var player0 = this.playerSpawnPoints[0];
        for (let i = 1; i < 3; i++){
            var playerFound = false;
            var ring = 1;
            while(!playerFound){
                var ringTiles = this.ringTiles(player0, ring);
                for (let j = 0; j < ringTiles.length; j++){
                    var q = ringTiles[j].q;
                    var r = ringTiles[j].r;
                    if(this.checkBoardBoundaries(q, r, width, length, this.temp)) continue;
                    if (this.temp[q][r] == TileProperties.TYPE.Default || this.temp[q][r] == TileProperties.TYPE.Water){
                        //check if that tile occupied by other player already
                        var occupied = false;
                        for (let k = 0; k < i; k++){
                            if (this.playerSpawnPoints[k].q == q && this.playerSpawnPoints[k].r == r){
                                occupied = true;
                                break;
                            }
                        }
                        if (occupied) continue;
                        
                        this.playerSpawnPoints[i] = {q: q, r: r};
                        playerFound = true;
                        break;
                    }
                }
                ring++;
                if(ring > 5){
                    //set the spawn point to the starting tile nearby as the last resort
                    //force turning that tile into default tile
                    this.playerSpawnPoints[i] = {q: startingTile.q-i, r: startingTile.r+i};
                    this.temp[startingTile.q-i][startingTile.r+i] = TileProperties.TYPE.Default;
                    break;
                }
            }
        }
        //console.log('testing for ringTiles1', this.ringTiles({q: 0, r: 0}, 1));
        //console.log('testing for ringTiles2', this.ringTiles({q: 0, r: 0}, 2));
        //console.log('testing for ringTiles3', this.ringTiles({q: 0, r: 0}, 3));
        console.log('player spawn points', this.playerSpawnPoints);


        // 6. generate the tile based on the annotated map
        this.forEachGrid((q, r)=>{
            //skip the tile if it is void tile
            if (this.temp[q][r] == TileProperties.TYPE.Void || this.temp[q][r] == TileProperties.TYPE.Hold ) return;

            var x = q * Math.cos(Math.PI / 6);
            var y = 0;
            var z = r + q * Math.cos(Math.PI / 3);
            var tile = new Tile(q, r, x, y, -z,this.game, this.temp[q][r]);
            
            // Add tile to map
            this.body.add(tile.body);
            this.grids.set(q.toString()+r.toString(), tile);
        });


    }

    getPlayerSpawnPoint(){
        return this.playerSpawnPoints;
    }

    getTile(q, r){
        //console.log('getTile: q: ', q, 'r: ', r);
        return this.grids.get(q.toString()+r.toString());
    }

    ringTiles = (center, radius) => {
        // get all of the tiles in the ring of the center tile with the radius
        // the ring is the hexagon ring around the center tile
        // if the radius is 0, then return the center tile
        // if the radius is 1, then return the adjacent tiles of the center tile
        var ringTiles = new Array();
        if (radius == 0){
            ringTiles.add(center);
            return ringTiles;
        }
        var q = center.q;
        var r = center.r;

        for (let i = 0; i < radius + 1; i++){
            ringTiles.push({q: q - radius + i, r: r + radius});
        }
        for (let i = 1; i < radius + 1; i++){
            ringTiles.push({q: q + i, r: r + radius - i});
        }
        for (let i = 1; i < radius + 1; i++){
            ringTiles.push({q: q + radius, r: r - i});
        }
        for (let i = 1; i < radius + 1; i++){
            ringTiles.push({q: q + radius - i, r: r - radius});
        }
        for (let i = 1; i < radius + 1; i++){
            ringTiles.push({q: q - i, r: r - radius + i});
        }
        for (let i = 1; i < radius; i++){
            ringTiles.push({q: q - radius, r: r + i});
        }

        return ringTiles;
    }



    hexRound(q, r, s){
        var nq = Math.round(q), nr = Math.round(r), ns = Math.round(r);
        var dq = Math.abs(nq-q), dr = Math.abs(nr-r), ds = Math.abs(ns-s);

        if (dq > dr && dq > ds) nq = -nr - ns;
        else if (dr > ds) nr = -nq - ns;
        else ns = -nq - nr;
        return this.getTile(nq, nr);
    }

    checkBoardBoundaries(q, r, width, length,temp){
        // return true if the tile locates at exactly the boundary of the board
        if (q <= -width || q >= width || r <= -length || r >= length) return true;
        //return true if one of the neighbor of the tile is void tile
        var adjacent = this.findAdjacent(q, r, width, length, false);
        for (let i = 0; i < adjacent.length; i++){
            if (temp[adjacent[i].q][adjacent[i].r] == TileProperties.TYPE.Void) return true;
        }
        return false;
    }

    findAdjacent(q, r, width, length, checkVoid = true){
        var adjacent = new Array();
        for (let i = 0; i < 6; i++){
            var q1 = q + this.adjacentTiles[i][0];
            var r1 = r + this.adjacentTiles[i][1];
            //cant use getTile here
            if (q1 < -width || q1 > width || r1 < -length || r1 > length) continue;
            if(checkVoid && this.temp[q1][r1] == TileProperties.TYPE.Void) continue;
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
        
        var temp1 = currentTile;
        var s1 = currentTile.s;
        var s2 = endTile.s;
        var N = distance(currentTile, endTile);
        for (var i = 0.0; i < N; i++){
            var q = lerp(q1, q2, i/N);
            var r = lerp(r1, r2, i/N);
            var s = lerp(s1, s2, i/N);
            var tile = this.hexRound(q, r, s);    
            if (tile != temp1){
                path.push(tile);
                temp1 = tile;
            }
            if (tile == endTile){
                break;
            }
        }
        this.path = path;
        return path;
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
            var tile = new Tile(q, r, x, y, z,this.game, TileProperties.TYPE.Default);
            
            // Add tile to map
            this.body.add(tile.body);
            this.grids.set(q.toString()+r.toString(), tile);
        });
                
    }

    //
    // Event Handling
    //

    select(){}
    deselect(){}
    hovering(){}
    deHovering(){}
}

