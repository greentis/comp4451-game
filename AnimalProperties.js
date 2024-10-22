import * as THREE from 'three';
import {Animal} from './Animal.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';

export class AnimalProperties {
    constructor(animal, typeID){
        this.id = typeID;
        this.animal = animal;
        //this.animal.name = 'Monkey';
        
        var url = 'assets/monkey/scene.gltf';
        switch (typeID) {
            case AnimalProperties.TYPE.Monkey:
                url = 'assets/monkey/scene.gltf';
                this.meshScale = 0.01;
                this.animal.health = 5;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4,
                    escape:1
                };
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun);
                break;
            default:
                this.animal.health = 1;
                this.animal.actionPriority = {
                    cover:0,
                    attack:0,
                    escape:1
                };
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun);
                break;
        }

        let gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(this.meshScale,this.meshScale,0.01);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.animal;
                }
            });
            this.mesh = model;
            this.animal.body.add(this.mesh);
            this.animal.mesh=this.mesh;
            this.animal.mesh.name=this.name;
            this.animal.getTile().characterEnter(this.animal);
        })

        this.animal.maxHealth = this.animal.health;
    }
}

AnimalProperties.TYPE = {
    Monkey: 0
}


/* // used for map generation in Board.js
//WARNING: the mapping move to the Board.js(EpTable), please remember update it whenever you change the animal type
AnimalProperties.ENEMYPOINTS = {
    Monkey: 2
    
} */



// Make TileProperties.TYPE Bidirectional
Object.keys(AnimalProperties.TYPE).forEach(e => {
    AnimalProperties.TYPE[AnimalProperties.TYPE[e]] = e;
});