import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';



export class Hunter extends Character{
    constructor(q, r, health, game, name){
        super(q, r, health, game, name);

        this.actionstate = Hunter.ACTION['idle'];

        this.weapon = new Weapon(this, WeaponProperties.TYPE.Bomb, 5);

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
            this.light.position.y = 0.5;
            this.light.decay = 0.5;
            this.light.distance = this.sightRange - 0.5;
            this.light.castShadow = true;
            this.mesh.add(this.light);
            this.mesh.name=name;
            this.body.add(this.mesh);
            this.getTile().characterEnter(this);

            console.log(this.body.children, this.mesh);
        });
        
    }

    //
    // EventHandler (Overwrite)
    //
        select(){
            //pop out all playerMove
            super.select();
            this.game.movingPlayer = this;
            if (this.actionstate == Hunter.ACTION['idle']) {
                this.actionstate = Hunter.ACTION['move'];
                console.log('move');
            }
        }
        deselect(){
            
            switch (this.actionstate) {
                case Hunter.ACTION.idle:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    this.actionstate = Hunter.ACTION.idle;
                    console.log('idle');
                    break;
                case Hunter.ACTION.move:
                    this.getTile().setState('aggressive');
                    this.actionstate = Hunter.ACTION.attack;
                    console.log('attack');
                    return this;
                case Hunter.ACTION.attack:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    this.actionstate = Hunter.ACTION.idle;
                    console.log('idle');
                    return;
            }
        }
        deselect_forced(){
            super.deselect();
            this.board.clearMarkings();
            this.game.movingPlayer = null;
            this.actionstate = Hunter.ACTION.idle;
            console.log('idle');
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