import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';
import { AnimationMixer } from 'three';

export class AnimalProperties {
    constructor(animal, typeID){
        this.id = typeID;
        this.animal = animal;
        let rotateY = 0;
        let offsetX = 0;
        let offsetZ = 0;
        let offsetY = 0;
        //this.animal.name = 'Monkey';

        // Height Attribute must be before weapon creation
        this.height = 1.3;
        this.hitRateCost = 50;
        
        var url = 'assets/monkey/scene.gltf';
        switch (typeID) {
            case AnimalProperties.TYPE.Monkey:
                url = 'assets/monkey/scene.gltf';
                this.meshScale = 0.0065;
                //this.meshScaleZ = 0.01;
                this.animal.health = 3;
                this.hitRateCost = 70;
                
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
                    escape:1
                };
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun, this.height);
                break;
            case AnimalProperties.TYPE.Bear:
                url = 'assets/bear_roooaaar/scene.gltf';
                this.meshScale = 0.65;
                //this.meshScaleZ = 1.01;
                this.animal.health = 5;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
                    escape:1
                };
                this.height = 0.9;
                rotateY = Math.PI;
                this.hitRateCost = 50;
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Bomb, this.height);
                break;
            case AnimalProperties.TYPE.Deer:
                url = 'assets/deer_polygonal/scene.gltf';
                this.meshScale = 2;
                //this.meshScaleZ = 0.025;
                this.animal.health = 2;
                this.animal.actionPriority = {
                    cover:6,
                    attack:4, // default 4
                    escape:1
                };
                this.height = 1;
                offsetX = 0.25;
                offsetZ = -0.3;
                offsetY = 0.6;
                this.hitRateCost = 20;
                this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Saw, this.height);
                break;
            case AnimalProperties.TYPE.Pumpkin:
                    url = 'assets/pumkin/scene.gltf';
                    this.meshScale = 0.3;
                    //this.meshScaleZ = 0.025;
                    this.animal.health = 2;
                    this.animal.actionPriority = {
                        cover:6,
                        attack:4, // default 4
                        escape:1
                    };
                    offsetY = 0.2;
                    this.height = 1.0;
                    this.animal.weapon = new Weapon(this.animal, WeaponProperties.TYPE.Gun, this.height);
                    break;
            case AnimalProperties.TYPE.Boss:
                url = 'assets/bear_roooaaar/scene.gltf';
                this.meshScale = 1.2;
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
            
            model.position.x += offsetX;
            model.position.z += offsetZ;
            model.position.y += offsetY;
            model.rotateY(rotateY);

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
    Deer: 2,
    Mushroom: 30,
    Pumpkin: 32,
    Boss: 100
}

AnimalProperties.TYPEID = {
    0: "Monkey",
    1: "Bear",
    2: "Deer",
    32: "Pumpkin",
    100: "Boss",
}

/* // used for map generation in Board.js
//WARNING: the mapping move to the Board.js(EpTable), please remember update it whenever you change the animal type
AnimalProperties.ENEMYPOINTS = {
    Monkey: 2
    
} */
