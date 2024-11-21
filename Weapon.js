import * as THREE from 'three';

import { Tile } from './Tile.js';
import { WeaponProperties } from '/WeaponProperties.js';
import { infoBox } from './infoBox.js';
import Particle from './particles/Particle.js'
import CanvasParticle from './particles/CanvasParticle.js';
import SphereParticle from './particles/SphereParticle.js';
import { TileProperties } from './TileProperties.js';


const distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
const lerp = (a, b, t) => {return a + (b - a) * t;}

export class Weapon{
    constructor(character, typeID, height = 1.5){
        this.character = character;
        this.body = new THREE.Group();
        this.character.body.add(this.body);
        this.height = height;
        this.setType(typeID);
        
        this.game = this.character.game;
        this.damage;
        this.name;
        this.range;
        this.blastRadius;
        
    }

    setType(typeID){
        this.properties = new WeaponProperties(this, typeID);
        //this.render();
    }

    setDamage(damage){
        this.damage = damage;
    }

    convertToObstacleDamage(damage){
        let result = damage * this.properties.obstacleDamageMultiplier;
        return result == 0 ? 1 : result;
    }

    dealsDamage(tile){

        function attenuationFunc(damage, radius, dist){
            if (radius == 0) return damage;
            let ak = damage - Math.max(0, Math.round(damage * lerp(0.0, 1.0, (dist+0.0)/radius)-0.51));
            return ak;
        }

        let affects = tile.getTilesWithinRange(this.blastRadius);
        
        affects.forEach(t => {
            for (let i = 0; i < Math.random() * this.properties.Pvar + this.properties.Pmin; i++) {
                let p
                if (this.name === 'Gun') {
                    p = new CanvasParticle(t.body, 0.1, 40);
                    p.setMatrix(Particle.addRandomVelocity(this.properties.particleMatrix));
                }
                else if (this.name === 'Bomb') {
                    p = new SphereParticle(t.body, 1.5, 80);
                    p.setMatrix(Particle.addRandomVelocity(this.properties.particleMatrix));
                }
                else if (this.name === 'Saw') {
                    p = new CanvasParticle(t.body, 0.25, 20, "cross");
                    p.setMatrix(Particle.addRandomVelocity(this.properties.particleMatrix,0.03,0.03,0.03));
                }
            }
            t.takeDamage(
                this.convertToObstacleDamage(attenuationFunc(this.damage, this.blastRadius, distance(t, tile))),
                this.name
            );
            if (!t.character) {
                return;
            }
            if (t.character.constructor == this.character.constructor) return;
            t.character.takeDamage(attenuationFunc(this.damage, this.blastRadius, distance(t, tile)), this.character);
        });
        //console.log(this.name, " hits ", tile.mesh.name);
        
    }
}