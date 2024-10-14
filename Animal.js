import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { AnimalProperties } from './AnimalProperties.js';
import { Hunter } from './Hunter.js';

export class Animal extends Character{
    constructor(q, r, health, game, name){
        super(q, r, health, game, name);

        this.body = new THREE.Object3D();
        this.setType(AnimalProperties.TYPE.Monkey);
    }

    setType(typeID){
        this.properties = new AnimalProperties(this, typeID);
        //this.render();
    }

    //Event handler
    select(){
        // Case 1: Player can only select visible animal
        // Case 2: Hunter can only attack visible target
        if (this.getTile().isVisible()) {
            // Hunter attacking this animal
            if(this.game.movingPlayer && 
                this.game.movingPlayer.actionstate == Hunter.ACTION.attack) {
                let hunter = this.game.movingPlayer;
                if(hunter.lineOfSight(this.getTile(), true)){
                    hunter.attack(this.getTile());
                    this.game.movingPlayer = null;
                }
                hunter.deselect_forced();
            }
            // No hunter attempting to attack animal
            else{
                super.select();
            }
        }
        
    }
}