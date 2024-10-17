import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';



export class Hunter extends Character{
    constructor(q, r, health, weaponType, game, name){
        super(q, r, health, game, name);

        this.actionstate = Hunter.ACTION['idle'];

        this.weapon = new Weapon(this, weaponType, 5);

        const gltfLoader = new GLTFLoader();
        const url = 'assets/low_poly_kyle_crane/scene.gltf';
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(1.2,1.2,1.2);
            model.userData = this;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this;
                }
            });
            this.mesh = model;
            this.light = new THREE.PointLight(0xc08844, 40);
            this.light.position.y = 2;
            this.light.decay = 0.5;
            this.light.distance = this.sightRange - 0.5;
            this.light.castShadow = true;
            this.mesh.add(this.light);
            this.mesh.name=name;
            this.body.add(this.mesh);
            this.getTile().characterEnter(this);

            console.log(this.body.children, this.mesh);
        });
        
        this.action.setActionPoint(2);
    }

    //
    // EventHandler (Overwrite)
    //
        select(){
            //pop out all playerMove
            this.game.movingPlayer = this;
            if (this.actionstate == Hunter.ACTION.idle) {
                this.actionstate = Hunter.ACTION.move;
                this.actionstate += (2 - this.action.actionPoint);
                //console.log('move');
                this.updateMarking();
            }
            else if (this.actionstate == Hunter.ACTION.attack) {
                console.log("new");
                this.actionstate = Hunter.ACTION.idle;
                this.updateMarking();
            }
        }
        deselect(){
            this.actionstate += (2 - this.action.actionPoint);
            switch (this.actionstate) {
                case Hunter.ACTION.move:
                    this.getTile().setState('aggressive');
                    this.actionstate = Hunter.ACTION.attack;
                    //console.log('attack');
                    return this;
                case Hunter.ACTION.attack:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    this.actionstate = Hunter.ACTION.idle;
                    //console.log('idle');
                    return;
                case Hunter.ACTION.idle:
                default:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    this.actionstate = Hunter.ACTION.idle;
                    //console.log('idle');
                    break;
            }
        }
        deselect_forced(){
            super.deselect();
            this.board.clearMarkings();
            this.game.movingPlayer = null;
            this.actionstate = Hunter.ACTION.idle;
            console.log('idle');
        }
        updateMarking(){
            switch (this.actionstate) {
                case Hunter.ACTION.move:
                    this.getTile().setState('selected');
                    break;
                case Hunter.ACTION.attack:
                    this.getTile().setState('aggressive');
                    break;
                case Hunter.ACTION.idle:
                default:
                    super.deselect();
                    this.board.clearMarkings();
                    break;
            }
        }

        hovering(){
            this.getTile().hovering();
        }
        deHovering(){
            this.getTile().deHovering();
        }
}

Hunter.ACTION = {
    idle : 0,
    move : 1,
    attack : 2
}