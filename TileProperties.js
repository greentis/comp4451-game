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
        this.offsetX = 0;
        this.offsetYm = 0;
        this.offsetYt = 0;
        this.offsetZ = 0;
        this.tileScaling = 0;

        this.pathfindable = true;   // Can we walk on it?
        this.seeThroughable = true;  // Can we see through it?
        this.hittable = true;       // Can explosions explode on it?
        this.passCost = 1.0;       // How much does it cost to pass through? (1.0 = normal)
        this.hitRateCost = 5.0;      // How much hitRate point it will reduce if bullet pass throught this tile? (5.0 = normal)
                                    // for starting bullet aim cost value: 100
        var url;

        this.meshScale = 0.8;
        switch (typeID) {
            case TileProperties.TYPE.Void:
                this.name = 'Void'
                this.color = 0x000000;
                this.offsetY = 0.0;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = false;
                this.passCost = 99999;
                this.hitRateCost = 99999;

                break;
            case TileProperties.TYPE.Wall:
                this.name = 'Wall'
                this.color = 0x775533;

                this.pathfindable = false;
                this.seeThroughable = false; 
                this.hittable = false;
                this.passCost = 99999;
                this.hitRateCost = 99999;
                
                url = 'assets/high-rock/scene.gltf';
                break;
            case TileProperties.TYPE.Rock:
                this.name = 'Rock'
                this.color = 0x666666;
                this.offsetY = 0.5;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = false;
                this.passCost = 99999;
                this.hitRateCost = 99999;
                
                //url = 'assets/high-rock/scene.gltf';
                
                break;
            case TileProperties.TYPE.Cover:
                this.name = 'Cover'
                this.color = 0x664543;

                this.pathfindable = false;
                this.hittable = true;
                this.seeThroughable = true;
                this.passCost = 99999;
                this.hitRateCost = 25.0;

                this.meshScale = 3;
                //this.offsetX = 0.1;
                this.offsetYm = 0.3;
                this.offsetZ = -0.6;
                url = 'assets/rock/scene.gltf';
                break;
            case TileProperties.TYPE.Water:
                this.name = 'Water'
                this.color = 0x3555b5;
                this.offsetY = 0;
                this.offsetYt = 0.15;
                this.tileScaling = 0.01;

                this.pathfindable = true;
                this.seeThroughable = true;
                this.hittable = false;
                this.passCost = 2.0;
                this.hitRateCost = 5.0;

                break;
            case TileProperties.TYPE.Bush:
                this.name = 'bush';
                this.color = 0x00EE99;

                this.pathfindable = true;
                this.seeThroughable = false;
                this.hittable = true;
                this.passCost = 3.0;
                this.hitRateCost = 25.0;
                url = 'assets/bush/scene.gltf';
                break;
            case TileProperties.TYPE.Tree:
                this.name = 'tree';
                this.color = 0x00EE33;

                this.pathfindable = false;
                this.seeThroughable = false;
                this.hittable = true;
                this.passCost = 1000.0;
                this.hitRateCost = 500.0;

                this.meshScale = 0.012;
                url = 'assets/tree/scene.gltf';
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
            model.scale.set(this.meshScale,this.meshScale,this.meshScale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.tile;
                }
            });
            this.mesh = model;
            this.mesh.position.x = this.offsetX;
            this.mesh.position.y=this.offsetYm;
            this.mesh.position.z=this.offsetZ;
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