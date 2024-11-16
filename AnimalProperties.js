import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';
import { AnimationMixer } from 'three';

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
                //this.meshScaleZ = 0.01;
                this.animal.health = 3;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
                    escape:1
                };
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun);
                break;
            case AnimalProperties.TYPE.Bear:
                url = 'assets/bear_roooaaar/scene.gltf';
                this.meshScale = 0.85;
                //this.meshScaleZ = 1.01;
                this.animal.health = 5;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
                    escape:1
                };
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Bomb);
                break;
            case AnimalProperties.TYPE.Rabbit:
                url = 'assets/rabbit_rigged/scene.gltf';
                this.meshScale = 0.025;
                //this.meshScaleZ = 0.025;
                this.animal.health = 2;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
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
            model.scale.set(this.meshScale,this.meshScale,this.meshScale);
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

            this.mixer = new AnimationMixer(model);
            this.animations = model.animations;
        })

        this.animal.maxHealth = this.animal.health;
    }

    /*this.playAnimation = function(actionName) {
        const action = this.mixer.clipAction(this.animations.find(clip => clip.name === actionName));
        action.reset();
        action.play();
    };*/
}

AnimalProperties.TYPE = {
    Monkey: 0, 
    Bear: 1, 
    Rabbit: 2
}

AnimalProperties.TYPEID = {
    0: "Monkey",
    1: "Bear",
    2: "Rabbit"
}

/* // used for map generation in Board.js
//WARNING: the mapping move to the Board.js(EpTable), please remember update it whenever you change the animal type
AnimalProperties.ENEMYPOINTS = {
    Monkey: 2
    
} */
