import * as THREE from 'three';

import { Tile } from './Tile.js';
import { Character } from './Character.js';
import { WeaponProperties } from '/WeaponProperties.js';

export class Weapon{
    constructor(character, typeID, damage = 1){
        this.character = character;
        this.body = new THREE.Object3D();
        this.setType(typeID);
        this.body.position.y += 2.5;
        this.body.rotation.y = Math.PI/2;
        this.character.body.add(this.body);
        this.damage = damage;
    }

    setType(typeID){
        this.properties = new WeaponProperties(this, typeID);
        //this.render();
    }

    dealsDamage(tile, damager){
        this.properties.blastRadius;
        console.log(this.properties.name, " hits ", tile.mesh.name);
        if (!tile.character) return;
        if (tile.character.constructor == damager.constructor) return;
        tile.character.takeDamage(this.damage);
    }
}