import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';
import { AnimationMixer } from 'three';

export class AnimalProperties {
    constructor(animal, typeID){
        this.id = typeID;
        this.animal = animal;
        this.rotateY = 0;
        this.y = 0;
        //this.animal.name = 'Monkey';

        // Height Attribute must be before weapon creation
        this.height = 2;
        
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
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun, this.height);
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
                this.height = 1.2;
                this.rotateY = Math.PI;
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Bomb, this.height);
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
                this.height = 0.7;
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Saw, this.height);
                break;
            case AnimalProperties.TYPE.Pumpkin:
                    url = 'assets/pumkin/scene.gltf';
                    this.meshScale = 0.4;
                    //this.meshScaleZ = 0.025;
                    this.animal.health = 2;
                    this.animal.actionPriority = {
                        cover:6,
                        attack:4, // default 4
                        escape:1
                    };
                    this.y = 0.4
                    this.height = 0.7;
                    this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun, this.height);
                    break;
            case AnimalProperties.TYPE.Boss:
                url = 'assets/bear_roooaaar/scene.gltf';
                this.meshScale = 1.25;
                //this.meshScaleZ = 0.01;
                this.animal.health = 12;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
                    escape:0
                };
                this.height = 2;
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Saw, this.height);
                this.animal.weapon.damage = 8;
                this.animal.moveRange = 12;
                break;
            default:
                this.animal.health = 1;
                this.animal.actionPriority = {
                    cover:0,
                    attack:0,
                    escape:1
                };
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun, this.height);
                break;
        }

        this.animal.maxHealth = this.animal.health;

        let gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(this.meshScale,this.meshScale,this.meshScale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.animal;
                }
            });
            
            model.rotateY(this.rotateY);
            model.position.y = this.y;

            this.mesh = new THREE.Group();
            this.mesh.add(model);
            this.animal.body.add(this.mesh);
            this.animal.mesh=this.mesh;
            this.animal.mesh.name=this.name;
            this.animal.getTile().characterEnter(this.animal);

        })

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
    Rabbit: 2,
    Pumpkin: 3,
    Boss: 100
}

AnimalProperties.TYPEID = {
    0: "Monkey",
    1: "Bear",
    2: "Rabbit",
    100: "Boss",
}

/* // used for map generation in Board.js
//WARNING: the mapping move to the Board.js(EpTable), please remember update it whenever you change the animal type
AnimalProperties.ENEMYPOINTS = {
    Monkey: 2
    
} */
