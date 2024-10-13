import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';

const ACTION = {
    'idle' : 0,
    'move' : 1,
    'attack' : 2
}

export class Hunter extends Character{
    constructor(q, r, health, game, name){
        super(q, r, health, game, name);

        this.actionstate = ACTION['idle'];
        this.body = new THREE.Object3D();

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
        });
        
    }

    //
    // EventHandler (Overwrite)
    //
        select(){
            //pop out all playerMove
            super.select();
            this.game.movingPlayer = this;
            if (this.actionstate == ACTION['idle']) {
                this.actionstate = ACTION['move'];
                console.log('move');
            }
        }
        deselect(){
            
            switch (this.actionstate) {
                case ACTION['idle']:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    this.actionstate = ACTION['idle'];
                    console.log('idle');
                    break;
                case ACTION['move']:
                    this.getTile().setState('aggressive');
                    this.actionstate = ACTION['attack'];
                    console.log('attack');
                    return this;
                case ACTION['attack']:
                    super.deselect();
                    this.board.clearMarkings();
                    this.game.movingPlayer = null;
                    this.actionstate = ACTION['idle'];
                    console.log('idle');
                    return;
            }
        }

        hovering(){
            this.getTile().hovering();
        }
        deHovering(){
            this.getTile().deHovering();
        }
}