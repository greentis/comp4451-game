import * as THREE from 'three';

import { Tile } from './Tile.js';
import { Character } from './Character.js';
import { WeaponProperties } from '/WeaponProperties.js';
import { infoBox } from './infoBox.js';
import { Particle } from './ActionTracker.js';

const distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
const lerp = (a, b, t) => {return a + (b - a) * t;}
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

        function attenuationFunc(damage, radius, dist){
            if (radius == 0) return damage;
            let ak = damage - Math.max(0, Math.round(damage * lerp(0.0, 1.0, (dist+0.0)/radius)-0.51));
            return ak;
        }

        let affects = tile.getTilesWithinRange(this.blastRadius);
        affects.forEach(t => {
            if (!t.character) {
                new Particle((ctx)=>{
                    ctx.fillStyle = "#ff7700";
                    ctx.beginPath();
                    ctx.moveTo(50, 50);
                    ctx.lineTo(25, 0);
                    ctx.lineTo(75, 0);
                    ctx.fill();
                }, t.body, 1, 100, 0, 2);
                return;
            }
            if (t.character.constructor == damager.constructor) return;
            t.character.takeDamage(attenuationFunc(this.damage, this.blastRadius, distance(t, tile)));
            infoBox.note = "Successful Hit!";
        });
        //console.log(this.name, " hits ", tile.mesh.name);
        
    }
}