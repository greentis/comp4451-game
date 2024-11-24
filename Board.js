import * as THREE from 'three';
import {Tile} from './Tile.js';
import { TileProperties } from './TileProperties.js';
import {Game} from './main.js';
import { cover } from 'three/src/extras/TextureUtils.js';
import { noise } from './perlin.js';
import { Hunter } from './Hunter.js';
import { cond } from 'three/webgpu';
//import { Character } from './Character.js';
//import * as math from 'mathjs';


// distanceQR: calculate the distance between two hexagon tile in q,r coordinate given only
export const distanceQR = (t1, t2) => {var t1s = -t1.q - t1.r; var t2s = -t2.q - t2.r; return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1s - t2s));}
// getHeights: get the height of the tile based on the type of the tile
const distanceToBoundary = (q, r, width, length) => {
    return Math.min(width - Math.abs(q), length - Math.abs(r));
}

const getHeights = (a) => {
    switch (a){
        case TileProperties.TYPE.Void:
            return 10.0;
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
export const xxhash = (seed, x, y) => {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return Math.abs(h) / 2147483648.0;
};

// make a Ep table for enemy spawn point
// input: enemy type
// output: Ep (enemy spawn point)
var EpTable = {
    [0] : 2.5,
    [1] : 4.0,
    [2] : 1.5,
    [30]: 2.5,
    [31]: 4.0,
    [32]: 1.0,
}

export class Board {
    constructor(game,missionNo){
        this.game = game;
        this.body = new THREE.Group();
        var geometry = new THREE.PlaneGeometry( 100, 100 );
        //0x054509
        var material = new THREE.MeshBasicMaterial( {color: 0x000000 ,side: THREE.DoubleSide} );
        this.mesh = new THREE.Mesh( geometry, material );
        this.body.add(this.mesh);
        this.mesh.rotateX(Math.PI/2);

        this.mesh.userData = this;
        
        this.missionNo = parseInt(missionNo, 10);
        this.grids = new Map();
        this.path = [];
        this.lightedGrid = new Array();
        this.adjacentTiles = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]; // pre-calculated adjacent tiles coordinates change

        this.prepareTiles();
    }
    
    prepareTiles(){
        //theme
        var themeTable = {
            0: { //forest
                roomPercentage: 0.75,
                rainFall: 0.1,
                riverSource: 0.8,
                vegetationCoverage: 0.1,
                wallThreshold: 0.7,
                coverThreshold: 0.4,
                fogColour: 0x000000,
            },
            1: { //desert
                roomPercentage: 0.72,
                rainFall: 0.0,
                riverSource: 1.55,
                vegetationCoverage: 0.085,
                wallThreshold: 0.65,
                coverThreshold: 0.58,
                fogColour: 0x000000//0x8b7d6b,
            },
            2: { //wetland
                roomPercentage: 0.95,
                rainFall: 0.15,
                riverSource: 0.4,
                vegetationCoverage: 0.1,
                wallThreshold: 0.99,
                coverThreshold: 0.5,
                fogColour: 0x000000,
            },
            3: { //black forest
                roomPercentage: 0.75,
                rainFall: 0.1,
                riverSource: 2.2,
                vegetationCoverage: 0.15,
                wallThreshold: 0.95,
                coverThreshold: 0.5,
                fogColour: 0x000000//0x1F2920,
            },

        };


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


        //generate the map with polygonal grid
        //1. set the size of the map by 3 radius
        //2. make the shape of map become irregular by changing some of the tile to void tile, while keeping remaining tile as rock tile
        //3. generate the default tile first
        //4. generate other type of tile(wall, cover, water e.t.c) based on the default tile
        //5. calculate the spawn point of the player in the map
        //6. calculate the spawn point of the enemy in the map
        //7. generate the tile based on the annotated map

        //generat random map with hexagon grid
        //setting random this.seed
        // cover all the map with rock first
        this.missionNo = 1;
        //this.missionNo = 2;
        this.seed = Math.round(Math.random()* 900000 + 100000);
        //this.seed = 37221; //wetland problem
        //19235;44699;26695; //rock problem
        //64767; //enemy model cannot be loaded problem
        //19101; //hole
        this.seed = this.seed % 65536; //make sure the this.seed is within 0 - 65536, so that noise.this.seed() can accept it
        //if(printable) 
        console.log('This board have seed ', this.seed);
        var perlinNoise = new noise();
        perlinNoise.seed(this.seed);


        var printable = true;
        //below variables are for polygonal generation only
        //if(true || this.missionNo == 1){this.theme = parseInt(this.seed,10)%3;} //control the theme of the map
        if(this.missionNo == 1){this.theme = 0;}
        else if(this.missionNo == 2){this.theme = 1;}
        else if(this.missionNo == 3){this.theme = 2;}
        else{this.theme = parseInt(this.seed,10)%3;}
            if (this.theme == 2){ this.theme = 3;}
            console.log('Mission No:', this.missionNo, 'Theme:', this.theme);
        this.roomLength = 5 + 1*(Math.min(this.missionNo,3)); //control the Length of the map
        this.roomWidth = 5 + 1*(Math.min(this.missionNo,3)); //control the Width of the map
        this.roomSizeRange = 0; //control the variation of the size of the room(+/- roomSizeRange)
        this.roomPercentage = themeTable[this.theme].roomPercentage; //0.75; //control the percentage of the default tile in the map
        this.wallThreshold = themeTable[this.theme].wallThreshold; //0.7; //control the threshold of the wall tile conversion from rock tile
        this.coverThreshold = themeTable[this.theme].coverThreshold; //0.4; //control the threshold of the cover tile conversion from rock tile
                                   //not that cover threshold should be smaller than wall threshold
            if(this.coverThreshold >= this.wallThreshold) this.coverThreshold = this.wallThreshold;
        this.rainFall = themeTable[this.theme].rainFall; //0.1;//control the rain fall of the map, tile with height below rain fall will be turned into water tile
        this.riverSource = themeTable[this.theme].riverSource; //0.8;//control the river source of the map, tile with height above river source will be turned into water tile
        this.maxRiverPercentage = 0.60;//0.65 //control the maximum percentage of the river tile in the map
        this.vegetationCoverage = themeTable[this.theme].vegetationCoverage; //0.1;//control the vegetation coverage of the map, tile with vegetation coverage below the value will be turned into vegetation tile
        
        this.playerToBoard = 3; //control the maximum number of tile from player to the board boundary allowed
        //this.enemyDensity = 0.02 + 0.008*(this.missionNo); //control the density of the enemy per tile in the map(suggested value: < 0.05)
        this.enemyGroupAmount = Math.ceil(0.5 + 0.55*(Math.min(this.missionNo,5) - 1)); //control the number of enemy group in the map
        this.averagePerGroup = 2; //control the average number of enemy per group
        this.enemyToPlayer = 6; //control the minimum number of tile from enemy to the player allowed
        this.enemyToEnemy = 7; //control the minimum number of tile from enemy to the enemy allowed
        this.bossInterval = 100; //control the interval of the boss appearance

        this.levelDifficulty = 0.0 + (this.missionNo)*1.0; //control the difficulty of the level, the higher the value, the harder the level
                                    //default value is 1.0

        // 1. set the size of the map by 3 radius
        if(this.theme == 1){//set a larger room size for desert theme
            //this.roomLength += 2;
            //this.roomWidth += 1;
        }
        if (this.roomSizeRange == 0) {
            var width = this.roomWidth;
            var length = this.roomLength;
        }else{
            var width = this.roomWidth + Math.round((this.seed % this.roomSizeRange) * xxhash(this.seed, 37, 13));
            var length = this.roomLength + Math.round( (this.seed % this.roomSizeRange) * xxhash(this.seed, 13, 37));
        }
        //var boundary = 20;
        //console.log('width', width, 'length', length);
        this.qmax = width;
        this.rmax = length;
        //this.smin = -length, this.smax = boundary;


        this.temp = {};
        this.totalArea = 0;
        var startingTile ={q: Math.round(this.seed % (2 * width - 1) - width + 1), r:
            Math.round(this.seed % (2* length - 1) - length + 1)}; 
        if(printable) console.log('Starting Tile is ', startingTile.q, startingTile.r); 
        

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
        //   + k_3 * ( checkingValues based on the this.seed and q,r)
        //   + k_4 * xxhash(this.seed * target, q, r)
        //   + 0.01 * iteration
        // checkingValues = distance(voidStartingTile, (q,r)) * 0.15 - 1 + xxhash(this.seed, q, r) 
        // the iteration will end when countNonVoid > target values
        // target values = (0.2 + 0.6 * roomPercentage + 0.2 * (this.seed % 80) / 100.0) *(width * 2 + 1) * (length * 2 + 1)
        var countNonVoid = 0.0;
        var k1 = 0.15;   //factor of total nonVoid tile
        var k2 = 0.07;  //factor of neighbor nonVoid tile
        var k3 = 2.25; //factor of checkingValues
        var k4 = 0.4; //factor of hash noise value
        var target = //(width * 2 + 1) * (length * 2 + 1); 
                    Math.round((0.2 + 0.6 * this.roomPercentage + 0.2 * (this.seed % 80) / 100.0) * (width * 2 + 1) * (length * 2 + 1));
        //console.log('target', target);

        //generate a void value map based on perlin noise for later used in k3 component of the probability
        var voidMap = {};
        for (let q = -width; q <= width; q++){
            voidMap[q] = {};
            for (let r = -length; r <= length; r++){
                voidMap[q][r] = perlinNoise.perlin2(this.seed*target, q/width, r/length);
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
                                    + k4 * xxhash(this.seed * target, a.q, a.r)
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
        var debug31 = false;
        while( defaultTile.size < (this.roomPercentage - (this.seed % 67)/1000.0) * this.totalArea){ //bug1
            // keep the expandedTile list as defaultTile list
            // clear the wallTile list
            if(expandIteration >= 1000 && expandIteration <= 59) debug31 = true;
            else debug31 = false;
            if(debug31)console.log('Iteration: ', expandIteration, 'default tile size', defaultTile.size);
            if (expandIteration > 1000) break;
            
            expandedTile = new Set(defaultTile);
            //set all of the tile in wallTile list to rock tile
            lastWallTile = new Set([...wallTile]);
            wallTile.forEach((t)=>{
                this.temp[t.q][t.r] = TileProperties.TYPE.Rock;
            });
            wallTile = new Set();


            //while (expandedTile.size > 0 && defaultTile.size < (this.roomPercentage - (this.seed % 67)/1000.0) * this.totalArea){ //bug1
                
                if(debug31)console.log('3.1 whileloop 2nd: ,default tile', defaultTile.size, 'expanded tile', expandedTile.size);
                expandedTile.forEach((t)=>{
                    if (defaultTile.size >= (this.roomPercentage + (this.seed % 67)/1000.0) * this.totalArea){
                        //console.log('default tile', defaultTile.size, 'expanded tile', expandedTile.size);
                        expandedTile.clear();
                        return;
                    } 
                    
                    if(debug31)console.log("do the expansion");
                    var adjacent = this.findAdjacent(t.q, t.r, width, length);
                    adjacent.forEach((a)=>{
                        //if (this.checkBoardBoundaries(a.q, a.r, width, length,this.temp)) return; //skip the tile if it is at the boundary of the board
                        //if(debug31)console.log('a1',a);
                        if(this.temp[a.q][a.r] == TileProperties.TYPE.Void) return;
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Wall) return;
                        if(debug31)console.log('a2',a,'type',this.temp[a.q][a.r]);
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Default) return;
                        //if(debug31)console.log('a3',a);

                        //checkValues should based on the this.seed, but not math.random()
                        //so that the map is generated same every time if same this.seed
                        //checkValues will increase as the iteration increase
                        //to have a lenient check on the tile to be turned into default tile
                        //so that avoid too few default tile in the map
                        var checkingValues = (expandIteration - 1.0) / 250.0 + xxhash(this.seed, a.q, a.r);
                        if(debug31)console.log('q', a.q, 'r', a.r, 'checkingValues', checkingValues,'expandIteration', expandIteration);

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
            //}
            expandIteration++;
        }
        if(lastWallTile.size != 0){
            wallTile = new Set([...lastWallTile]);
        }

        if(this.checkBoardBoundaries(startingTile.q, startingTile.r, width, length, this.temp)){
            //set the starting tile to the rock tile if it is at the boundary
            this.temp[startingTile.q][startingTile.r] = TileProperties.TYPE.Rock;
            defaultTile.delete(startingTile);
            wallTile.add(startingTile);
        }

        if(printable){
            console.log('iteration at step 3.1', expandIteration);
            console.log('room percentage', this.roomPercentage, "total area", this.totalArea, "range", (this.seed % 67)/1000.0);
            console.log('# of default tile generated', defaultTile.size);
            console.log('target area', (this.roomPercentage + (this.seed % 67)/1000.0) * this.totalArea);
            //console.log('min area', (this.roomPercentage - (this.seed % 67)/1000.0) * this.totalArea);
            //console.log('wallTile size(before 4.1):', wallTile.size);
        }
        
        // 4. generate other type of tile(wall, cover, water e.t.c) based on the default tile
        // 4.1 convert some of the rock tile to wall tile
        //doing iteration in the wallTile list
        //for each tile in the wallTile list
        // it turn into wall tile if checkValues is greater than wallThreshold
        this.seedWall = xxhash(this.seed, wallTile.size, defaultTile.size) * 1000000.0;
        var totalWallTile = wallTile.size;
        var rockTile = new Set();
        var rockIteration = 1.0;
        while ( rockTile.size < totalWallTile * (1 - this.wallThreshold) - (this.seedWall %37) / 1000.0){
            if (rockIteration > 1000) break;

            wallTile.forEach((t)=>{
                //console.log('xxhash', xxhash(this.seedWall, t.q, t.r));
                var checkingValues = (rockIteration - 1) / 250.0 + xxhash(this.seedWall, t.q, t.r);
                if (checkingValues > this.wallThreshold){
                    rockTile.add(t);
                    wallTile.delete(t);
                    this.temp[t.q][t.r] = TileProperties.TYPE.Rock;
                    //console.log('Rock Tile: q', t.q, 'r', t.r);
                }
            });
            rockIteration++;
        }   
        if(printable){
            //console.log('wallTile size(after 4.1):', wallTile.size);
            console.log('rockTile size:', rockTile.size);
            //console.log('rockTile', rockTile);
        }

        // 4.2 convert some of the rock tile to cover tile
        //doing iteration in the rockTile list
        //for each tile in the rockTile list
        // it turn into cover tile if checkValues is smaller than coverThreshold
        //var totalRockTile = rockTile.size;
        var coverTile = new Set();
        var coverIteration = 1.0;
        while ( coverTile.size < totalWallTile * (this.coverThreshold) - (this.seedWall % 37) / 1000.0){
            if (coverIteration > 1000) break;
            wallTile.forEach((t)=>{
                var checkingValues = -1.0 * (coverIteration - 1) / 250.0 + xxhash(this.seedWall, t.q, t.r);
                //console.log('xxhash', xxhash(this.seed, t.q, t.r));
                //console.log('t.q', t.q, 't.r', t.r, 'checkingValues', checkingValues);
                if (checkingValues < this.coverThreshold){
                    coverTile.add(t);
                    wallTile.delete(t);
                    this.temp[t.q][t.r] = TileProperties.TYPE.Cover;
                }
            });
            coverIteration++;
        }
        if(printable){
            //console.log('coverIteration', coverIteration);
            console.log('wallTile size(after 4.2):', wallTile.size);
            console.log('coverTile size:', coverTile.size);
            //console.log('coverTile', coverTile);
        }

        // 4.3.0 generate the height map of the tile
        // the height of the tile is based on the perlin noise
        this.heightMap = {};
        for (let q = -width; q <= width; q++){
            this.heightMap[q] = {};
            for (let r = -length; r <= length; r++){
                this.heightMap[q][r] = perlinNoise.perlin2(this.seed, q/width, r/length) 
                                + xxhash(this.seed, q, r)*0.25 
                                + getHeights(this.temp[q][r])
                                - 0.35;
            }
        }
        
        // 4.3.1 generate the water(pond) tile
        // the water tile is based on the height of the tile
        // if the height of the tile is below the rain fall, then it will be turned into water tile
        var waterTileArea = 0;
        var waterTile = new Set();
        for (let q = -width; q <= width; q++){
            for (let r = -length; r <= length; r++){
                
                if (this.waterTileArea > this.maxRiverPercentage * this.totalArea) break;

                if (this.heightMap[q][r] < this.rainFall){
                    this.temp[q][r] = TileProperties.TYPE.Water;
                    waterTile.add({q: q, r: r});
                    waterTileArea++;
                }
            }
        }
        if(printable) console.log('waterTile size:', waterTile.size);

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
                if(waterTileArea > this.maxRiverPercentage * this.totalArea) break;
                //avoid the void tile & boundary tile
                if (this.temp[q][r] == TileProperties.TYPE.Void) continue;
                if(this.checkBoardBoundaries(q, r, width, length, this.temp)) continue;
                if (this.heightMap[q][r] > this.riverSource){
                    this.temp[q][r] = TileProperties.TYPE.Water;
                    riverSource.add({q: q, r: r});
                    riverTile.add({q: q, r: r});
                    waterTileArea += 1;
                }
            }
        }

        riverSource.forEach((s)=>{
            var riverEnd = false;
            var lowestHeight = this.heightMap[s.q][s.r];
            var source = s;
            if(waterTileArea > this.maxRiverPercentage * this.totalArea) return;

            while(!riverEnd){
                var temp = source;
                var adjacent = this.findAdjacent(source.q, source.r, width, length);
                if (waterTileArea > this.maxRiverPercentage * this.totalArea) break;
                
                adjacent.forEach((a)=>{
                    if(this.checkBoardBoundaries(a.q, a.r, width, length, this.temp)) return;

                    var height = this.heightMap[a.q][a.r];
                    
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
                    waterTileArea += 1;
                }
            }
        });
        if(printable) console.log('riverTile size:', riverTile.size);

        // 4.4 generate the vegetation tile
        // vegetation tile can be tree tile or bush tile
        // the vegetation tile is convert from non-boundary rock, default, cover, water(pond) tile
        // generate a vegetaion map based on the xxhash value
        var vegetationMap = {};
        var vegetationTile = new Set();
        for (let q = -width; q <= width; q++){
            vegetationMap[q] = {};
            for (let r = -length; r <= length; r++){
                vegetationMap[q][r] = xxhash(this.seed * this.vegetationCoverage * 137.0, q, r);
                if (this.temp[q][r] == TileProperties.TYPE.Void) vegetationMap[q][r] = 10.0;
                if (this.checkBoardBoundaries(q, r, width, length, this.temp)) vegetationMap[q][r] = 10.0; 

                if (vegetationMap[q][r] < this.vegetationCoverage){
                    vegetationTile.add({q: q, r: r});
                }
            }
        }
        if(printable) console.log('vegetationTile size:', vegetationTile.size);
        

        // 4.4.1 generate the tree tile
        // 4.4.2 generate the bush tile
        // we consider turning the vegetation tile into tree tile or bush tile based on the tree value and bush value      
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
            var height = this.heightMap[t.q][t.r];
            treeValue += (1 - height) * k2;
            bushValue += ((height - 0.45) ** 2 - 0.25)* k2;

            //factor 3: based on the perlin noise
            treeValue += perlinNoise.perlin2(this.seed * 137, t.q/width, t.r/length) * k3;
            bushValue += perlinNoise.perlin2(this.seed * 137, t.q/width, t.r/length) * k3;

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
        /*var test = {};
        for(let q = -width; q <= width; q++){
            test[q] = {};
            for(let r = -length; r <= length; r++){
                test[q][r] = perlinNoise.perlin2(this.seed, q/width, r/length);
            }
        }
        console.log('perlin noise', test);
        */
        


        //5. calculate the spawn point of the player in the map
        // the player will be added to the default tile or water tile(if no default tile)
        //random select spawn point for character1 based on the annotated map and this.seed
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
            var q = Math.round(xxhash((this.seed +  iteration* 73) *163, this.playerSpawnPoints[0].q, this.playerSpawnPoints[0].r) * 2 * this.qmax - this.qmax );
            var r = Math.round(xxhash((this.seed + iteration * 73) * 163, this.playerSpawnPoints[0].q, this.playerSpawnPoints[0].r) * 2 * this.rmax - this.rmax );
            //console.log('q', q, 'r', r,'qmax', this.qmax, 'rmax', this.rmax);

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
        //console.log('Player Spawn Point 0: ', this.playerSpawnPoints[0]);

        //5.2 find the spawn point for other players
        // the spawn point for these characters will follow below rules:
        // 1. try the bottom left adjacent (q-1,r-1) of the player 0 spawn point
        // 2. if the tile is not default or water, then move clockwise to the next adjacent tile
        // 3. if all of the adjacent tile is not default or water, then move to the bottom left tile of next ring(q-2,r-2)
        // 4. then start again with clockwise movement
        // 5. repeat the process until find the spawn point
        
        var player0 = this.playerSpawnPoints[0];
        var playerLastResort = false;
        for (let i = 1; i < 3; i++){
            var playerFound = false;
            var ring = 1;
            while(!playerFound){
                var ringTiles = this.ringTiles(player0, ring);
                //console.log('player0', player0, 'ring', ring, 'ringTiles', ringTiles);
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

                        //if other player have no path to the player 0 spawn point, then restart the process
                        /*var path = findValidPath({q: q, r: r}, this.playerSpawnPoints[0]);
                        if (path.length == 0) continue;
                        */
                        
                        this.playerSpawnPoints[i] = {q: q, r: r};
                        playerFound = true;
                        break;
                    }
                    
                }
                ring++;
                if(ring > 3){
                    //set the spawn point to the player 0 spawn point as the last resort
                    //force turning that tile into default tile
                    this.playerSpawnPoints[1] = {q: player0.q-1, r: player0.r+1};
                    this.temp[startingTile.q-1][startingTile.r+1] = TileProperties.TYPE.Default;
                    this.playerSpawnPoints[2] = {q: player0.q+1, r: player0.r-1};
                    this.temp[startingTile.q+1][startingTile.r-1] = TileProperties.TYPE.Default;
                    console.log('temp (q-1,r+1)', this.temp[startingTile.q-1][startingTile.r+1], 'temp (q+1,r-1)', this.temp[startingTile.q+1][startingTile.r-1]);
                    playerLastResort = true;
                    break;
                }
                if (playerLastResort) break;
            }
        }
        //console.log('testing for ringTiles1', this.ringTiles({q: 0, r: 0}, 1));
        //console.log('testing for ringTiles2', this.ringTiles({q: 0, r: 0}, 2));
        //console.log('testing for ringTiles3', this.ringTiles({q: 0, r: 0}, 3));
        if(printable) console.log('player spawn points', this.playerSpawnPoints);

    
        // 6. calculate the spawn point of the enemy in the map
        // 6.1 divide the enemy into several groups
        // the enemies will be divided into several groups
        // note that the number of enemy in each group is based on the enemy group point(Egp)
        // each type of enemy have different enemy point(Ep)
        // the sum up of the Ep of all of the enemy in the group should be less than the Egp
        // under above restriction, enemy type(and number) of each group will be selected according to this.seed
        var debugTotalEp = 0.0;
        var enemyGroupNumber = this.enemyGroupAmount; 
                            //parseInt(Math.max(1, Math.round(this.enemyDensity / 4.4 * this.totalArea)),10);
        this.enemyGroup = {};
        var Egp = (this.averagePerGroup) * EpTable[0] + (this.levelDifficulty - 1) * EpTable[0]; //EpTable[0] is the enemy point of the average enemy

        var bossNo = 0;
        if((this.missionNo % this.bossInterval) == 0){
            console.log('missionNo', this.missionNo, 'bossInterval', this.bossInterval, 'mod', this.missionNo % this.bossInterval);
            this.enemyGroup[enemyGroupNumber] = {};
            this.enemyGroup[enemyGroupNumber][0] = {};
            this.enemyGroup[enemyGroupNumber][0][0] = 100; //boss enemy
            bossNo = 1;
        }

        for (let i = 0; i < enemyGroupNumber - bossNo; i++){ 
            this.enemyGroup[i] = {};
            var Ep = 0.0;
            var j = 0;
            var exceedcount = 0;
            while(Ep < Egp){
                var enemyType = Math.round(xxhash(this.seed * 4451, i**(Ep+j), (Ep*exceedcount)**(j + i)) * 123) % 3; //Object.keys(EpTable).length;
                if (this.theme == 3 && enemyType == 2) enemyType += 10*3; // enemyType = 32
                //console.log('enemyType', enemyType);
                if (exceedcount > 100) break;
                if (Ep + EpTable[enemyType]> Egp){ 
                    exceedcount++;
                    continue;
                }
                Ep += EpTable[enemyType];
                //console.log('Ep', Ep, 'Egp', Egp);

                this.enemyGroup[i][j] = {};
                this.enemyGroup[i][j][0] = enemyType;
                j++;

                debugTotalEp += EpTable[enemyType];
            }
        }
        
        //console.log('enemyGroup', this.enemyGroup);
        if(printable) console.log('total Ep', debugTotalEp, 'enemyGroupNumber', enemyGroupNumber, 'average Ep', debugTotalEp / enemyGroupNumber, 'Egp', Egp);
        
        // 6.2 calculate the spawn point of leader of each group
        // for each group, choose a random tile as the spawn point based on below rules:
        // 1. choose a group leader enemygroup[i][0]
        // 2. randomly select a tile as the spawn point
        // 3a. if the tile is not default or water/river or tree or bush, restart the process
        // 3b. if the tile is occupied by other group, restart the process
        // 3c. if the tile dont have path to the player spawn point, restart the process(using character.findValidPath)
        // 3d. if the tile is too close to the player spawn point, restart the process
        // 3e. if the tile is too close to the other group spawn point, restart the process
        // 3f. if the tile is occupied by other player, restart the process
        // 4. if all of the above condition of 3 is satisfied, then set the tile as the spawn point of the leader
        // otherwise, restart the process
        for (let i = 0; i < enemyGroupNumber; i++){
            var leaderFound = false;
            var iteration = 0;
            var lastResort = false;

            var failReason = -1.0;
            while(!leaderFound){
                iteration++; 
                console.log('iteration', iteration, 'failReason', failReason);
                if (iteration > 1000) {
                    //last resort, set the leader spawn point to a unoccupied tile nearby
                    lastResort = true;
                }
                //var q = Math.round(xxhash(this.seed * 4731, i, iteration**i) * 2 * this.qmax - this.qmax );
                //var r = Math.round(xxhash(this.seed * 7431, i + q**iteration, iteration**i) * 2 * this.rmax - this.rmax);
                var q = parseInt(Math.random() * 2 * this.qmax - this.qmax, 10);
                var r = parseInt(Math.random() * 2 * this.rmax - this.rmax, 10);
                console.log('q', q, 'r', r);
                
                
                if (!lastResort && this.checkBoardBoundaries(q, r, width, length, this.temp)){ failReason = 0.0; continue;}
                
                
                
                //condition 3a
                //skip if it is tree or bush
                if(iteration < 1200 && (this.temp[q][r] == TileProperties.TYPE.Tree || this.temp[q][r] == TileProperties.TYPE.Bush)){ failReason = 1.0; continue;}
                if (!lastResort && this.temp[q][r] != TileProperties.TYPE.Default && this.temp[q][r] != TileProperties.TYPE.Water
                ) { failReason = 1.5; continue;}
                //condition 3d
                if (distanceQR(this.playerSpawnPoints[0], {q: q, r: r}) < (this.enemyToPlayer - 0.01*iteration)){ failReason = 4.0; continue;}
                
                //condition 3b
                var occupied = false;
                for (let j = 0; j < i; j++){
                    if (this.enemyGroup[j][0][1].q == q && this.enemyGroup[j][0][1].r == r){
                        occupied = true;
                        break;
                    }
                }
                if (occupied) { failReason = 2.0; continue;}

                //condition 3c
                //var path = findValidPath({q: q, r: r}, this.playerSpawnPoints[0]);
                //if (path.length == 0) continue;
               

                //condition 3e
                var tooClose = false;
                for (let j = 0; j < i; j++){
                    if (distanceQR(this.enemyGroup[j][0][1], {q: q, r: r}) < (this.enemyToEnemy - 0.02*iteration)){
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose){ failReason = 5.0; continue;}

                //condition 3f
                var occupiedByPlayer = false;
                for (let j = 0; j < 3; j++){
                    if (this.playerSpawnPoints[j].q == q && this.playerSpawnPoints[j].r == r){
                        occupiedByPlayer = true;
                        break;
                    }
                }
                if (occupiedByPlayer){ failReason = 6.0; continue;}

                this.enemyGroup[i][0][1] = {q: q, r: r};
                leaderFound = true;
                console.log('type of tile that enemy spawn', this.temp[q][r]);
            }
            if (lastResort){
                this.temp[q][r] = TileProperties.TYPE.Default;
            }
        }
        if(printable)console.log('finish leader spawn point');

        // 6.3 calculate the spawn point of the other enemy in the group
        // the spawn point of these enemies will be based on the leader spawn point
        // 1. try the bottom left adjacent (q-1,r-1) of the leader spawn point
        // 2a. if the tile is not default or water/river or tree or bush, then move clockwise to the next adjacent tile
        // 2b. if the tile is occupied by other group, then move clockwise to the next adjacent tile
        // 2c. if the tile is occupied by other player, then move clockwise to the next adjacent tile
        // 2d. if the tile is too close to the player spawn point, then move clockwise to the next adjacent tile
        // 2e. if the tile is too close to the other group spawn point, then move clockwise to the next adjacent tile
        // 2f. if the tile have no path to leader spawn point, then move clockwise to the next adjacent tile
        // 3. if all of the above condition of 2 is satisfied, then set the tile as the spawn point of the enemy
        // otherwise, restart the process
        //console.log('check point6.3');
        for (let i = 0; i < enemyGroupNumber; i++){
            var leader = this.enemyGroup[i][0][1];
            
            for (let j = 1; j < Object.keys(this.enemyGroup[i]).length; j++){
                var enemyFound = false;
                var iteration = 0;
                var lastResort = false;
                //var ring = 1;
                while(!enemyFound){
                    iteration++;
                    if (iteration > 1000){
                        //last resort, set the enemy spawn point to a unoccupied tile nearby
                        lastResort = true;
                    }

                    for (let ring = 0; ring < 6; ring++){
                        var ringTiles = this.ringTiles(leader, ring);
                        
                        for (let k = 0; k < ringTiles.length; k++){
                            var q = ringTiles[k].q;
                            var r = ringTiles[k].r;
                            if (!lastResort && this.checkBoardBoundaries(q, r, width, length, this.temp)) continue;

                            //condition 2a
                            if(this.temp[q][r] == TileProperties.TYPE.Tree || this.temp[q][r] == TileProperties.TYPE.Bush) continue;
                            if (!lastResort && this.temp[q][r] != TileProperties.TYPE.Default && this.temp[q][r] != TileProperties.TYPE.Water) continue;
                            
                            
                            //condition 2b
                            var occupied = false;
                            //check the leader first
                            for (let l = 0; l < enemyGroupNumber; l++){
                                if (this.enemyGroup[l][0][1].q == q && this.enemyGroup[l][0][1].r == r){
                                    occupied = true;
                                    break;
                                }
                            }
                            if (occupied) continue;
                            //check the other enemy in the same group
                            for (let l = 0; l < j; l++){
                                if (this.enemyGroup[i][l][1].q == q && this.enemyGroup[i][l][1].r == r){
                                    occupied = true;
                                    break;
                                }
                            }
                            if (occupied) continue;
                            //check the other enemy in the previous group
                            for (let l = 0; l < i; l++){
                                for (let m = 1; m < Object.keys(this.enemyGroup[l]).length; m++){
                                    if (this.enemyGroup[l][m][1].q == q && this.enemyGroup[l][m][1].r == r){
                                        occupied = true;
                                        break;
                                    }
                                }
                            }
                            if (occupied) continue;
                        

                            //condition 2c
                            var occupiedByPlayer = false;
                            for (let l = 0; l < 3; l++){
                                if (this.playerSpawnPoints[l].q == q && this.playerSpawnPoints[l].r == r){
                                    occupiedByPlayer = true;
                                    break;
                                }
                            }
                            if (occupiedByPlayer) continue;
                            

                            //condition 2d
                            if (distanceQR(this.playerSpawnPoints[0], {q: q, r: r}) <= (this.enemyToPlayer - 0.01*iteration)) continue;
                            
                            //condition 2e
                            var tooClose = false;
                            for (let l = 0; l < enemyGroupNumber; l++){
                                if (l == i) continue;
                                if (!lastResort && distanceQR(this.enemyGroup[l][0][1], {q: q, r: r}) <= (this.enemyToEnemy - 0.02*iteration)){
                                    tooClose = true;
                                    break;
                                }
                            }
                            if (tooClose) continue;
                            

                            //condition 2f
                            //var path = findValidPath({q: q, r: r}, leader);
                            //if (path.length == 0) continue;
                            

                            this.enemyGroup[i][j][1] = {q: q, r: r};
                            //console.log('enemy group', this.enemyGroup[i][j][1]);
                            enemyFound = true;
                            break;
                        }
                        if (enemyFound) break;
                    }
                }
                if (lastResort){
                    this.temp[q][r] = TileProperties.TYPE.Default;
                }
            }
        }
        if(true || printable) console.log('enemy spawn points', this.enemyGroup);
        

        //7.3 turn all the rock tile that dont have adjacent tile despit the void tile or rock tile to void tile
        /*for (let q = -width - 1; q <= width + 1; q++){
            for(let r = -length - 1; r <= length + 1; r++){
                if (this.temp[q] == undefined) continue;
                if (this.temp[q][r] == undefined) continue;
                if (this.temp[q][r] != TileProperties.TYPE.Rock) continue;
                var adjacent = this.findAdjacent(q, r, width + 1, length + 1);
                var defaultAdjacent = false;
                adjacent.forEach((a)=>{
                    if (this.temp[a.q][a.r] == TileProperties.TYPE.Void || this.temp[a.q][a.r] == TileProperties.TYPE.Hold) return;
                    if (this.temp[a.q][a.r] == TileProperties.TYPE.Rock) return;
                    if (this.temp[a.q][a.r] == undefined) return;
                    defaultAdjacent = true;
                });
                if (!defaultAdjacent){
                    this.temp[q][r] = TileProperties.TYPE.Void;
                }
            }
        }*/

        // 7.1 turn all void tile which adjacent to non-rock tile to rock tile
        // the void tile which adjacent to the non-rock tile will be turned into rock tile
        // so that the map will be more connected
        // Also, turn the tile of the player and enemy spawn point to default tile
        var voidTile = new Set();
        var outerTile = new Set();
        for (let q = -width; q <= width; q++){
            for (let r = -length; r <= length; r++){
                if (this.temp[q][r] == TileProperties.TYPE.Void || this.temp[q][r] == TileProperties.TYPE.Hold) continue;

                //skip the tile if it is player spawn point or enemy spawn point
                var skip = false;
                for (let i = 0; i < 3; i++){
                    if (this.playerSpawnPoints[i].q == q && this.playerSpawnPoints[i].r == r){
                        skip = true;
                        this.temp[q][r] = TileProperties.TYPE.Default;

                        //turning the adjacent void tile to rock tile
                        var adjacent = this.findAdjacent(q, r, width, length);
                        adjacent.forEach((a)=>{
                            //console.log('(q,r)', q, r, 'adjacent', a.q, a.r, 'temp', this.temp[a.q][a.r]);
                            if (this.temp[a.q][a.r] == TileProperties.TYPE.Void){
                                this.temp[a.q][a.r] = TileProperties.TYPE.Rock;
                            }
                        });

                        break;
                    }
                }
                for (let i = 0; i < enemyGroupNumber; i++){
                    for (let j = 0; j < Object.keys(this.enemyGroup[i]).length; j++){
                        if (this.enemyGroup[i][j][1].q == q && this.enemyGroup[i][j][1].r == r){
                            skip = true;
                            this.temp[q][r] = TileProperties.TYPE.Default;
                            break;
                        }
                    }
                }
                if (skip) continue;

                //skip the tile if it is not void tile
               
                if(this.checkBoardBoundaries(q, r, width, length, this.temp)){
                    //this.temp[q][r] = TileProperties.TYPE.Default;
                    outerTile.add({q: q, r: r});
                    continue;
                }


                /*if (this.temp[q][r] == TileProperties.TYPE.Void){
                    var adjacent = this.findAdjacent(q, r, width, length);
                    var defaultAdjacent = false;
                    adjacent.forEach((a)=>{
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Void || this.temp[a.q][a.r] == TileProperties.TYPE.Hold) return;
                        if (this.temp[a.q][a.r] == TileProperties.TYPE.Rock) return;
                        defaultAdjacent = true;
                    });
                    if (defaultAdjacent){
                        this.temp[q][r] = TileProperties.TYPE.Rock;
                    }else{
                        voidTile.add({q: q, r: r});
                    }
                }*/
            }
        }
        for (let t of outerTile){
            this.temp[t.q][t.r] = TileProperties.TYPE.Default;
        }

        //7.2 turn all the default tile into target default tile with suitable theme
        // the default tile will be turned into target default tile based on the theme
        // the theme is based on the this.theme
        for(let q of Object.keys(this.temp)){
            for(let r of Object.keys(this.temp[q])){
                if (this.temp[q][r] == TileProperties.TYPE.Default){
                    this.temp[q][r] = this.theme*100;
                }
                else if ( this.temp[q][r] == TileProperties.TYPE.Bush){
                    if(this.theme == 1){ //replace some of the bush tile to cactus tile if the theme is desert
                        if (xxhash(this.seed, q, r) > 0.75){;
                            this.temp[q][r] = TileProperties.TYPE.Cactus;
                            continue;
                            //console.log('Cactus Tile: q', q, 'r', r);
                        }
                    }
                    else if (this.theme == 3){ //replace some of the bush tile to pumpkin tile if the theme is darkForest
                        if (xxhash(this.seed, q, r) > 0.2){
                            this.temp[q][r] = TileProperties.TYPE.Pumkin;
                            continue;
                            //console.log('Pumpkin Tile: q', q, 'r', r);
                        }
                    }
                    this.temp[q][r] = this.theme*100 + TileProperties.TYPE.Bush;
                    
                }
                else if ( this.temp[q][r] == TileProperties.TYPE.Tree){
                    this.temp[q][r] = this.theme*100 + TileProperties.TYPE.Tree;
                }

                //replace the tile to default tile if it is enemy spawn point && is pumpkin tile
                for (let i = 0; i < enemyGroupNumber; i++){
                    for (let j = 0; j < Object.keys(this.enemyGroup[i]).length; j++){
                        if (this.enemyGroup[i][j][1].q == q && this.enemyGroup[i][j][1].r == r){
                            //console.log('enemy spawn point: q', q, 'r', r, 'type', this.temp[q][r]);
                            if(this.temp[q][r] == TileProperties.TYPE.Pumkin){
                                this.temp[q][r] = this.theme*100;
                            }
                        }
                    }
                }
            }
        }
        if(themeTable[this.theme].fog !== 0x000000){
            //this.game.scene.fog = new THREE.Fog( themeTable[this.theme].fogColour, 5 , 16); //0.001,30
        }

        //7.3 add a outer layer to the temp map
        // the outer layer is used to avoid the out of boundary error
        // the outer layer is the void tile, unless that tile have adjacent tile which is not void tile or rock tiles       
        for (let q = -width - 1; q <= width + 1; q++){
            for(let r = -length - 1; r <= length + 1; r++){
                if (this.temp[q] == undefined) this.temp[q] = {};
                if (this.temp[q][r] == undefined) this.temp[q][r] = TileProperties.TYPE.Void;
                if(this.temp[q][r] != TileProperties.TYPE.Void) continue;
                //console.log('outer: q', q, 'r', r, 'type', this.temp[q][r]);

                var adjacent = this.findAdjacent(q, r, width + 1, length + 1);
                var defaultAdjacent = false;
                adjacent.forEach((a)=>{
                    if (this.temp[a.q][a.r] == undefined) return;
                    if (this.temp[a.q][a.r] == TileProperties.TYPE.Void || this.temp[a.q][a.r] == TileProperties.TYPE.Hold) return;
                    if (this.temp[a.q][a.r] == TileProperties.TYPE.Rock) return;
                    defaultAdjacent = true;
                });
                if (defaultAdjacent){
                    this.temp[q][r] = TileProperties.TYPE.Rock;
                    //console.log('q', q, 'r', r, 'defaultAdjacent', defaultAdjacent);
                }
            }
        }

        for (let q = -width - 1; q <= width + 1; q++){
            for(let r = -length - 1; r <= length + 1; r++){
                if (this.temp[q] == undefined) continue;
                if (this.temp[q][r] == undefined) continue;
                if (this.temp[q][r] != TileProperties.TYPE.Rock) continue;
                var adjacent = this.findAdjacent(q, r, width + 1, length + 1);
                var defaultAdjacent = false;
                adjacent.forEach((a)=>{
                    if (this.temp[a.q][a.r] == TileProperties.TYPE.Void || this.temp[a.q][a.r] == TileProperties.TYPE.Hold) return;
                    if (this.temp[a.q][a.r] == TileProperties.TYPE.Rock) return;
                    if (this.temp[a.q][a.r] == undefined) return;
                    defaultAdjacent = true;
                });
                if (!defaultAdjacent){
                    this.temp[q][r] = TileProperties.TYPE.Void;
                }
            }
        }

        
        
    }

    async buildTiles(){
        const generateTiles = async (tiles)=>{
            for(let t of tiles){
                let q = t.q;
                let r = t.r;
                if(this.temp[q] == undefined || this.temp[q][r] == undefined){
                    //console.log('error: q', q, 'r', r);
                    continue;
                }
                if (this.temp[q][r] == TileProperties.TYPE.Void || this.temp[q][r] == TileProperties.TYPE.Hold) continue;
                //console.log('tile', tile);
                
                var x = q * Math.cos(Math.PI / 6);
                var y = 0;
                var z = parseFloat(r) + q * Math.cos(Math.PI / 3);
                var tile = new Tile(parseFloat(q), parseFloat(r), x, y, -z,this.game, this.temp[q][r], this.theme);
                //console.log('q', q, 'r', r, 'type', this.temp[q][r], 'x', x, 'y', y, 'z', z);

                // Add tile to map
                this.body.add(tile.body);
                this.grids.set(q.toString()+r.toString(), tile);

                
            }
            await new Promise(resolve => setTimeout(resolve, 50));
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        //console.log('qmax', this.qmax, 'rmax', this.rmax);
        //console.log('temp', this.temp);
        var maxRing = this.rmax+1 + this.qmax+1;
        for (let r = 0; r <= maxRing; r++){
            await generateTiles(this.ringTiles({q: 0, r: 0}, r));
            //console.log('ring', r, this.ringTiles({q: 0, r: 0}, r));
        }
        //console.log(Object.keys(this.temp).sort().reverse()[0]);
    }

    
    createTiles(){
        for(let q of Object.keys(this.temp).sort()){
            for(let r of Object.keys(this.temp[q]).sort()){
                //console.log('q', q, 'r', r, 'type', this.temp[q][r]);
                //skip the tile if it is void tile
                if (this.temp[q][r] == TileProperties.TYPE.Void || this.temp[q][r] == TileProperties.TYPE.Hold) continue;
                //console.log('tile', tile);
                
                var x = q * Math.cos(Math.PI / 6);
                var y = 0;
                var z = parseFloat(r) + q * Math.cos(Math.PI / 3);
                var tile = new Tile(parseFloat(q), parseFloat(r), x, y, -z,this.game, this.temp[q][r], this.theme);
                //console.log('q', q, 'r', r, 'type', this.temp[q][r], 'x', x, 'y', y, 'z', z);

                // Add tile to map
                this.body.add(tile.body);
                this.grids.set(q.toString()+r.toString(), tile);

            }
        }
    }

    getDefaultThemeTileID(){
        return this.theme*100 + TileProperties.TYPE.Default
    }

    //
    // Private Helper Function
    // 
    forEachGrid(func){
        console.log('warning: forEachGrid is no longer used');
        /*
        var vaildGrid = [];
        for (let q = this.qmin; q <= this.qmax; q++){
            for (let r = this.rmin; r <= this.rmax; r++){
                let s = 0 - q - r;
                //if (s < this.smin || s > this.smax) continue;  
                if(q==-11 && r==0) console.log('q', q, 'r', r, 's', s);
                func(q, r, s);
            }
        }
        */
    }


    getPlayerSpawnPoint(){
        return this.playerSpawnPoints;
    }

    getEnemySpawnPoint(){
        return this.enemyGroup;
    }

    getSeed(){
        return this.seed;
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
            ringTiles.push(center);
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

    checkBoardBoundariesT(tile){
        var width = this.qmax;
        var length = this.rmax;
        var q = tile.q;
        var r = tile.r;
        // return true if the tile locates at exactly the boundary of the board
        if (q <= -width || q >= width || r <= -length || r >= length) return true;
        //return true if one of the neighbor of the tile is void tile
        var adjacent = this.findAdjacent(q, r, width, length, false);
        for (let i = 0; i < adjacent.length; i++){
            if (this.temp[adjacent[i].q][adjacent[i].r] == TileProperties.TYPE.Void) return true;
        }
        return false;
    }

    findAdjacent(q, r, width, length, checkVoid = true){
        var adjacent = new Array();
        for (let i = 0; i < 6; i++){
            var q1 = q + this.adjacentTiles[i][0];
            var r1 = r + this.adjacentTiles[i][1];
            //cant use getTile here
            if(this.temp[q1] == undefined) continue;
            if(this.temp[q1][r1] == undefined) continue;
            if (q1 < -width || q1 > width || r1 < -length || r1 > length) continue;
            if(checkVoid && this.temp[q1][r1] == TileProperties.TYPE.Void) continue;
            adjacent.push({q: q1, r: r1});
            
        }
        return adjacent;
    }

    addMarkings(tiles, state){
        tiles.forEach((t)=>{
            if (t.state != 'selected' && t.state != 'aggressive') t.setState(state);
            this.lightedGrid.push(t);
        });
    }

    clearMarkings(){
        this.lightedGrid.forEach((t)=>{
            if (t.state != 'selected' && t.state != 'aggressive') t.setState('default');
        });
        this.path = [];
        this.lightedGrid = Array();
    }

    


    
    generate(){
        var width = 6;
        var length = 6;
        var boundary = 2;
        this.qmin = -width, this.qmax = width;
        this.rmin = -length, this.rmax = boundary;
        this.smin = -boundary, this.smax = length;

        this.forEachGrid((q, r)=>{
            var x = q * Math.cos(Math.PI / 6);
            var y = 0;
            var z = r + q * Math.cos(Math.PI / 3);
            var tile = new Tile(q, r, x, y, z,this.game, TileProperties.TYPE.Default, this.theme);
            
            // Add tile to map
            this.body.add(tile.body);
            this.grids.set(q.toString()+r.toString(), tile);
        });
                
    }

    //
    // Event Handling
    //

    select(){console.log("Board base")}
    deselect(){}
    hovering(){}
    deHovering(){}
}

