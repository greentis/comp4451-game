import * as THREE from 'three';

import { Character } from './Character.js';
import { AnimalProperties } from './AnimalProperties.js';
import { Hunter } from './Hunter.js';

import { infoBox } from './infoBox.js';

export class Animal extends Character{
    constructor(q, r, typeID, game, name, groupid){
        super(q, r, 1, game, name);
        //this.setType(AnimalProperties.TYPE.Monkey);
        this.setType(typeID);

        this.setActionPoint(0);

        this.groupID = groupid; //groupID is used to determine the group of the animal
        this.actionstate = null;
        this.wake = false; // wake up when player is near or under attack
        
        this.getTile().characterEnter(this);

        
    }

    setType(typeID){
        this.properties = new AnimalProperties(this, typeID);
        //this.render();
    }

    getEnemy(){
        return this.game.enemy;
    }

    playAnimation(){
        
        console.log("checkpoint 1")
        this.mixer = new THREE.AnimationMixer(this.mesh);
        console.log("checkpoint 2")
        this.clips = this.mesh.animations;
        console.log("checkpoint 3")
        this.action = this.mixer.clipAction(this.clips[0]);
        console.log("checkpoint 4")
        this.action.play();
        console.log("checkpoint 5")
    }

    //helper function of AIControl
    updateWake(){
        //wake up when player is near or under attack
        let player = this.game.player;
        for(let p of player){
            if(this.lineOfSight(p.getTile(), false)){
                this.wake = true;
                this.facing(p.getTile().q,p.getTile().r);
            }
        }
        if(this.health < this.maxHealth){
            this.wake = true;
        }
        if(this.wake) this.action.drawIndicator("!");
    }

    killed(damager){
        for(let e of this.game.enemy){
            if(e.group == this.groupID){
                e.wake = true;
            }
        }
        this.game.enemy.delete(this);
        infoBox.enemies = this.game.enemy;
        console.log(this.game.enemy.size, " enemies remaining", this.game.enemy.size == 0)
        
        super.killed(damager).then(() => {
            if (this.game.enemy.size == 0) this.game.missionCompleted();
        });
    }

    ambush(){
        super.ambush();
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

    playAnimation(actionName) {
        /*const clip = this.animations.find(clip => clip.name === actionName);
        if (!clip) {
            console.error(`Animation clip '${actionName}' not found`);
            return;
        }
        const action = this.mixer.clipAction(clip);
        action.reset();
        action.play();
        */
    }

}
