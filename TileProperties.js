import * as THREE from 'three';
import {Tile} from './Tile.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { contain } from 'three/src/extras/TextureUtils.js';

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
        this.rotateX = 0;
        this.rotateY = 0;
        this.rotateZ = 0;
        this.tileScaling = 0;

        this.pathfindable = true;   // Can we walk on it?
        this.seeThroughable = true;  // Can we see through it?
        this.ambushable = false;    // HitRateCost *= 3 inside. Visual only: Animals hide in it, players gets harder to hit it
        this.hittable = true;       // Can explosions explode on it?
        this.passCost = 1.0;       // How much does it cost to pass through? (1.0 = normal)
        this.hitRateCost = 0.0;      // How much hitRate point it will reduce if bullet pass throught this tile? (5.0 = normal)

        this.strength = 2;           // The Damage required to destroy this tile

                                    // for starting bullet aim cost value: 100
        var url;

        this.meshScale = 0.8;

        //set the typeID to typeID % 100 if cant find the typeID in TileProperties.TYPE
        if (!Object.values(TileProperties.TYPE).includes(typeID)) {
            //console.log('TileProperties: typeID not found: ' + typeID);
            typeID = typeID % 100;
            //console.log('TileProperties: typeID set to: ' + typeID);
        }

        switch (typeID) {
            case TileProperties.TYPE.Void:
                this.name = 'Void'
                this.color = 0x000000;
                this.offsetY = -0.1;

                this.seeThroughable = true;
                this.hittable = false;
                this.passCost = 99999;
                this.hitRateCost = 0.0;

                this.strength = 99999;

                break;
            case TileProperties.TYPE.Bombed:
                    this.name = 'Bombed'
                    this.color = 0x322217;
                    this.offsetY = 0.1;
    
                    this.seeThroughable = true;
                    this.hittable = true;
                    this.passCost = 99999;
                    this.hitRateCost = 0;
                    this.tileScaling = 0.01;
    
                    this.strength = 99999;
    
                    break;
            case TileProperties.TYPE.Wall:
                this.name = 'Wall'
                this.color = 0x221114;

                this.seeThroughable = false; 
                this.hittable = false;
                this.passCost = 99999;
                this.hitRateCost = 99999;

                this.strength = 6;
                
                this.meshScale = 0.85;
                url = 'assets/high-rock/scene.gltf';
                break;
            case TileProperties.TYPE.Rock:
                this.name = 'Rock'
                this.color = 0x666666;
                this.offsetY = 0.5;

                this.seeThroughable = true;
                this.hittable = false;
                this.passCost = 99999;
                this.hitRateCost = 20;

                this.strength = 99999;
                
                //url = 'assets/high-rock/scene.gltf';
                
                break;
            case TileProperties.TYPE.Cover:
                this.name = 'Cover'
                this.color = 0x1b2410;


                this.hittable = true;
                this.seeThroughable = true;
                this.passCost = 99999;
                const height = Math.random()*0.3
                this.hitRateCost = parseFloat((40.0 - height * 50).toFixed(2));

                this.meshScale = 3.3 + Math.random()*0.4;
                this.offsetX = 0.1;
                this.offsetYm = -0.50 - height;
                this.offsetZ = -0.2;
                this.rotateX = -Math.PI/2+0.1;
                this.rotateY = Math.random()*Math.PI*2;
                this.rotateZ = -Math.PI/2+0.5;

                this.strength = 4;
                url = 'assets/rock/scene.gltf';
                break;
            case TileProperties.TYPE.Water:
                this.name = 'Water'
                this.color = 0x3555b5;
                this.tile.body.position.y=0;
                this.offsetY = 0;
                this.offsetYt = 0.12;
                this.tileScaling = 0.01;

                this.seeThroughable = true;
                this.hittable = true;
                this.passCost = 2.0;

                this.strength = 12;

                break;
            case TileProperties.TYPE.Bush:
                this.name = 'bush';
                this.color = 0x043606;
                this.offsetYm = 0;

                this.meshScale = 1.1;  
                this.seeThroughable = true;
                this.ambushable = true;
                this.hittable = true;
                this.passCost = 3.0;
                this.hitRateCost = 30.0;

                this.strength = 3;

                url = 'assets/bush/scene.gltf';
                break;
            case TileProperties.TYPE.TumbleWeedTree:
            case TileProperties.TYPE.TumbleWeed:
                this.name = 'TumbleWeed';
                this.color = 0x8b7d6b;
                this.offsetYm = 0;

                this.meshScale = 0.003;  
                this.seeThroughable = true;
                this.ambushable = true;
                this.hittable = true;
                this.passCost = 3.0;
                this.hitRateCost = 30.0;

                this.strength = 3;

                url = 'assets/tumbleweed/scene.gltf';
                break;
            case TileProperties.TYPE.Tree:
                this.name = 'tree';
                this.color = 0x083606;

                this.seeThroughable = true;
                this.hittable = true;
                this.passCost = 1000.0;
                this.hitRateCost = 50;

                this.meshScale = 0.012;
                this.rotateY = Math.random()*Math.PI*2;
                url = 'assets/tree/scene.gltf';

                this.strength = 8;
                break;
            case TileProperties.TYPE.Default:
                if(Math.random()<0.1){
                    const loader = new THREE.TextureLoader();
                    const texture = loader.load( './assets/grass.png' );
                    texture.colorSpace = THREE.SRGBColorSpace;
    
                    const labelMaterial = new THREE.SpriteMaterial({
                        map: texture,
                        transparent: true
                      });
                    const label = new THREE.Sprite(labelMaterial);
                    this.tile.body.add(label);
                    this.mesh=label;
                }
                break;
            case TileProperties.TYPE.DefaultDesert:
                this.name = 'Desert'
                this.color = 0x8b7d6b;
                this.tileScaling = 0.006;
                break;
            case TileProperties.TYPE.DefaultBlackForest:
                this.name = 'BlackForest'
                this.color = 0x083606; //dark green
                this.tileScaling = 0.002;

                this.meshScale = 0.03;
                this.rotateX = 0; 
                this.rotateY = Math.random()*Math.PI*2;
                this.rotateZ = 0;
                this.offsetX = (Math.random()-0.5)*0.25;
                this.offsetZ = (Math.random()-0.5)*0.25;
                var random = Math.random();
                if(random<0.2){
                    url = 'assets/mushrooms/scene.gltf';
                    const gltfLoader = new GLTFLoader();
                    gltfLoader.load(url, (gltf) => {
                        var model = gltf.scene;
                        model.scale.set(this.meshScale,this.meshScale,this.meshScale);
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.userData = this.tile;
                            }
                        });
                        model.rotateX(this.rotateX);
                        model.rotateZ(this.rotateZ);
                        model.position.x = this.offsetX;
                        model.position.z=this.offsetZ;
            
                        this.mesh = new THREE.Group();
                        this.mesh.add(model);
                        this.mesh.position.y=this.offsetYm;
                        this.mesh.rotateY(this.rotateY);
                        this.tile.body.add(this.mesh);
                        
                    });
                    url = null;
                }
                if(random > 0.9){
                    const loader = new THREE.TextureLoader();
                    const texture = loader.load( './assets/grass.png' );
                    texture.colorSpace = THREE.SRGBColorSpace;
    
                    const labelMaterial = new THREE.SpriteMaterial({
                        map: texture,
                        transparent: true
                      });
                    const label = new THREE.Sprite(labelMaterial);
                    this.tile.body.add(label);
                    this.mesh=label;
                }
                break;
            default:
                
                break;
        }
        if(!url)return;
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(this.meshScale,this.meshScale,this.meshScale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.tile;
                }
            });
            model.rotateX(this.rotateX);
            model.rotateZ(this.rotateZ);
            model.position.x = this.offsetX;
            model.position.z=this.offsetZ;

            this.mesh = new THREE.Group();
            this.mesh.add(model);
            this.mesh.position.y=this.offsetYm;
            this.mesh.rotateY(this.rotateY);
            this.tile.body.add(this.mesh);
            
        });
    }
    
    destroy(){
        if (!this.mesh) {
            this.tile.body.remove(this.mesh);
            return;
        }
        let y = this.mesh.position.y;
        let vy = 0.1;
        let ay = -0.015;
        const animate = ()=>{
            let time = 0;
            return new Promise((resolve)=>{
                const animate = (timestamp)=>{
                    time++;
                    // ~ Animation ~
                    vy += ay;
                    y += vy;
                    this.mesh.position.y = y;
    
                    if (time < 100) { 
                        requestAnimationFrame(animate);
                    }
                    else{
                        resolve();
                    }
                }
                requestAnimationFrame(animate);
            })
        }
        // The mother function is async to be able to await
        animate().then(()=>{
            this.tile.body.remove(this.mesh);
        });
    }
}

TileProperties.TYPE = {
    Bombed: -3,
    Hold: -2, 
    Void: -1,
    Default: 0,
    Wall: 1,
    Rock: 2,
    Cover: 3,
    Water: 4,
    Bush: 5,
    Tree: 6,
    DefaultDesert: 100,
    DefaultWetland: 200,
    DefaultBlackForest: 300,
    TumbleWeed: 105,
    TumbleWeedTree: 106,
    
}

// Make TileProperties.TYPE Bidirectional
Object.keys(TileProperties.TYPE).forEach(e => {
    TileProperties.TYPE[TileProperties.TYPE[e]] = e;
});