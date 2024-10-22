import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { AnimalProperties } from './AnimalProperties.js';
import { Hunter } from './Hunter.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';

import { infoBox } from './infoBox.js';

export class Animal extends Character{
    constructor(q, r, typeID, game, name, groupid){
        super(q, r, 1, game, name);

        this.setType(AnimalProperties.TYPE.Monkey);
        this.action.setActionPoint(0);

        this.groupID = groupid; //groupID is used to determine the group of the animal
        this.actionstate = null;
        this.wake = false; // wake up when player is near or under attack
        
        
    }

    setType(typeID){
        this.properties = new AnimalProperties(this, typeID);
        //this.render();
    }

    getEnemy(){
        return this.game.enemy;
    }

    //helper function of AIControl
    updateWake(){
        //wake up when player is near or under attack
        let player = this.game.player;
        for(let p of player){
            if(this.lineOfSight(p.getTile(), false)){
                this.wake = true;
            }
        }
        if(this.health < this.maxHealth){
            this.wake = true;
        }

    }

    killed(){
        for(let e of this.game.enemy){
            if(e.group == this.groupID){
                e.wake = true;
            }
        }
        this.game.enemy.delete(this);
        infoBox.enemies = this.game.enemy;
        if (this.game.enemy.length == 0) this.game.missionCompleted();
        super.killed();
    }

    ambush(){
        super.ambush();
        this.weapon.body.visible = false;
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

    deselect(){
        super.deselect();
    }
}
