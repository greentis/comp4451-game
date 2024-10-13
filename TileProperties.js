import * as THREE from 'three';
import {Tile} from './Tile.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class TileProperties {
    constructor(tile, typeID){
        this.id = typeID;
        this.tile = tile;

        this.name = 'Default'

        this.emissive = 0x000000;
        this.color = 0x054509;
        
        this.offsetY = 0.25;

        this.pathfindable = true;   // Can we walk on it?
        this.seeThroughable = true;  // Can we see through it?
        this.hittable = true;       // Can explosions explode on it?
        this.passCost = 1.0;       // How much does it cost to pass through? (1.0 = normal)
        this.hitRateCost = 5.0;      // How much hitRate point it will reduce if bullet pass throught this tile? (5.0 = normal)
                                    // for starting bullet aim cost value: 100
        var url;
        switch (typeID) {
            case TileProperties.TYPE.Void:
                this.name = 'Void'
                this.color = 0x000000;
                this.offsetY = 0.0;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = false;
                this.passCost = 1000.0;
                this.hitRateCost = 1000.0;

                break;
            case TileProperties.TYPE.Wall:
                this.name = 'Wall'
                this.color = 0x775533;

                this.pathfindable = false;
                this.seeThroughable = false; 
                this.hittable = false;
                this.passCost = 1000.0;
                this.hitRateCost = 1000.0;
                
                break;
            case TileProperties.TYPE.Rock:
                this.name = 'Rock'
                this.color = 0x666666;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = false;
                this.passCost = 1000.0;
                this.hitRateCost = 1000.0;
                
                url = 'assets/high-rock/scene.gltf';
                
                break;
            case TileProperties.TYPE.Rock:
                this.name = 'Rock'
                this.color = 0x666666;

                this.pathfindable = false;
                
                this.offsetY = 1;
                
                break;
            case TileProperties.TYPE.Cover:
                this.name = 'Cover'
                this.color = 0x664543;
                this.offsetY = 0.9;

                this.pathfindable = false;
                this.hittable = true;
                this.seeThroughable = true;
                this.passCost = 1000.0;
                this.hitRateCost = 25.0;

                break;
            case TileProperties.TYPE.Water:
                this.name = 'Water'
                this.color = 0x4CBEE4;
                this.offsetY = 0.1;

                this.pathfindable = true;
                this.seeThroughable = true;
                this.hittable = false;
                this.passCost = 2.0;
                this.hitRateCost = 5.0;

                break;
            case TileProperties.TYPE.Bush:
                this.name = 'bush';
                this.color = 0x00EE99;
                this.offsetY = 0.9;

                this.pathfindable = true;
                this.seeThroughable = false;
                this.hittable = true;
                this.passCost = 3.0;
                this.hitRateCost = 25.0;

                break;
            case TileProperties.TYPE.Tree:
                this.name = 'tree';
                this.color = 0x00EE33;
                //this.offsetY = 1.2;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = true;
                this.passCost = 1000.0;
                this.hitRateCost = 500.0;

                /*
                // Mesh Loading
                const gltfLoader2 = new GLTFLoader();
                const url2 = 'assets/tree_-_tree/scene.gltf';
                gltfLoader2.load(url2, (gltf) => {
                    var model = gltf.scene;
                    model.scale.set(0.8,0.8,0.8);
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.userData = this.tile;
                        }
                    });
                    this.mesh = model;
                    this.tile.body.add(this.mesh);
                });
                */
                break;
            case TileProperties.TYPE.Bush:
                this.name = 'bush';
                this.color = 0x00EE99;
                this.offsetY = 0.9;

                this.pathfindable = true;
                this.seeThroughable = false;
                this.hittable = true;
                this.passCost = 3.0;
                this.hitRateCost = 25.0;

                break;
            case TileProperties.TYPE.Tree:
                this.name = 'tree';
                this.color = 0x00EE33;
                //this.offsetY = 1.2;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = true;
                this.passCost = 1000.0;
                this.hitRateCost = 500.0;

                /*
                // Mesh Loading
                const gltfLoader2 = new GLTFLoader();
                const url2 = 'assets/tree_-_tree/scene.gltf';
                gltfLoader2.load(url2, (gltf) => {
                    var model = gltf.scene;
                    model.scale.set(0.8,0.8,0.8);
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.userData = this.tile;
                        }
                    });
                    this.mesh = model;
                    this.tile.body.add(this.mesh);
                });
                */
                break;
            case TileProperties.TYPE.Default:
            default:
                this.mesh = new THREE.Object3D();
                this.tile.mesh.add(this.mesh);
                break;
        }
        if(!url) return;
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(0.8,0.8,0.8);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.tile;
                }
            });
            this.mesh = model;
            this.tile.body.add(this.mesh);
        });
    }
}

TileProperties.TYPE = {
    Hold: -2, 
    Void: -1,
    Default: 0,
    Wall: 1,
    Rock: 2,
    Cover: 3,
    Water: 4,
    Bush: 5,
    Tree: 6,
}

// Make TileProperties.TYPE Bidirectional
Object.keys(TileProperties.TYPE).forEach(e => {
    TileProperties.TYPE[TileProperties.TYPE[e]] = e;
});