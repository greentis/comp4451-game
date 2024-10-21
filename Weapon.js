import * as THREE from 'three';

import { Tile } from './Tile.js';
import { Character } from './Character.js';
import { WeaponProperties } from '/WeaponProperties.js';
import { infoBox } from './infoBox.js';

export class Weapon{
    constructor(character, typeID, damage = 1){
        this.character = character;
        this.body = new THREE.Object3D();
        this.setType(typeID);
        
        this.character.body.add(this.body);
        this.damage = damage;
    }

    setType(typeID){
        this.properties = new WeaponProperties(this, typeID);
        //this.render();
    }

    dealsDamage(tile, hitRate, damager){
        if (hitRate < Math.random() * 100) {
            infoBox.note = "Missed Hit!";
            return;
        }
        let affects = tile.getTilesWithinRange(this.blastRadius);
        affects.forEach(t => {
            console.log("tile");
            if (!t.character) return;
            if (t.character.constructor == damager.constructor) return;
            t.character.takeDamage(this.damage);
            infoBox.note = "Successful Hit!";
        });
        //console.log(this.name, " hits ", tile.mesh.name);
        
    }
}