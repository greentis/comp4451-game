import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';
import { Particle } from './ActionTracker.js';
import { infoBox } from './infoBox.js';



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
            this.light.decay = 1;
            this.light.distance = this.sightRange - 1;
            this.light.castShadow = true;
            this.mesh.add(this.light);
            this.mesh.name=name;
            this.body.add(this.mesh);
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
                this.updateActionState();
            }
            //console.log("hunter select", this.actionstate);
        }
        deselect(){
            //console.log("hunter deselect", this.actionstate);
            switch (this.actionstate) {
                case Hunter.ACTION.move:
                    this.actionstate = Hunter.ACTION.attack;
                    this.updateActionState();
                    return this;
                case Hunter.ACTION.attack:
                    this.actionstate = Hunter.ACTION.idle;
                    this.updateActionState();
                    return;
                case Hunter.ACTION.selected:
                    this.actionstate = Hunter.ACTION.idle;
                    this.updateActionState();
                    break;
                case Hunter.ACTION.idle:
                default:
                    this.actionstate = Hunter.ACTION.idle;
                    this.updateActionState();
                    break;
            }
        }
        deselect_forced(){
            this.game.movingPlayer = null;
            this.actionstate = Hunter.ACTION.idle;
            this.updateActionState();
            this.game.selectedObject = null;
        }
        updateActionState(){
            switch (this.actionstate) {
                case Hunter.ACTION.move:
                    this.getTile().setState('selected');
                    this.displayInfo();
                    break;
                case Hunter.ACTION.attack:
                    this.getTile().setState('aggressive');
                    this.displayInfo();
                    break;
                case Hunter.ACTION.selected:
                    this.getTile().setState('selected');
                    this.displayInfo();
                    this.game.movingPlayer = null;
                    break; 
                case Hunter.ACTION.idle:
                default:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    infoBox.format = infoBox.FORMAT.MissionInfo;
                    break;
            }
        }

        killed(){
            console.log(this.game.player);
            const index = this.game.player.findIndex(obj => obj.name == this.name);
            if (index !== -1) {
                this.game.player.splice(index, 1);
            }
            if (this.game.player.length == 0) this.game.missionFailed();
            super.killed();
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
    attack : 2,
    selected: 3
}