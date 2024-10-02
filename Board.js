import * as THREE from 'three';
import {Tile} from './Tile.js';
import { TileProperties } from './TileProperties.js';
import {Game} from './main.js';
//import * as math from 'mathjs';

var lerp = (a, b, t) => {return a + (b - a) * t;}
var distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}

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

        //below variables are for polygonal generation only
        this.minq = 10; this.maxq = 10;
        this.minr = 10; this.maxr = 20;
        this.mins = 10; this.maxs = 15; 
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
        var seed = Math.round(Math.random()* 900000 + 100000);
        console.log('This board have seed ', seed);
        
        var width = 6;
        var length = 20;
        var boundary = 2;
        this.qmin = -width, this.qmax = width;
        this.rmin = -boundary, this.rmax = length;// create a temp array to store all the type of tile in the map temporarily
        this.smin = -length, this.smax = boundary;
        // temp should be 2D array 
        this.forEachGrid((q, r)=>{
            var x = q * Math.cos(Math.PI / 6);
            var y = 0;
            var z = r + q * Math.cos(Math.PI / 3);
            var tile = new Tile(q, r, x, y, -z,this.game, TileProperties.TYPE['Default']);
            
            // Add tile to map
            this.body.add(tile.body);
            this.grids.set(q.toString()+r.toString(), tile);
        });

       // 2. generate the continous structure of the map first(i.e. Rock, Water(Pond))
        //the outermost layer must be rock
        this.forEachGrid((q, r)=>{
            if(Math.random() < 0.05){
                this.getTile(q, r).setType(TileProperties.TYPE['Wall']);
                this.getTile(q, r).render();
            }
        });
        this.forEachGrid((q, r)=>{
            if(Math.random() < 0.05){
                this.getTile(q, r).setType(TileProperties.TYPE['Rock']);
                this.getTile(q, r).render();
            }
        });

        // 3. generate the segmented structure of the map(i.e. Wall, Cover, Water(river))

        // 4. combine the two structure together to get the annotated map

        // 5. generate the tile based on the annotated map
        
        
    }



    getTile(q, r){
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

    eraseMarkings(){
        if (this.path){
            for (var i = 0; i < this.path.length; i++){
                var tile = this.path[i];
                tile.state = 'default';
                tile.render();
                
            }
        }
        this.lightedGrid.forEach((t)=>{
            t.state = 'default';
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