import * as THREE from 'three';

import { Tile } from './Tile.js';
import { Character } from './Character.js';
import { WeaponProperties } from '/WeaponProperties.js';
import { infoBox } from './infoBox.js';
import Particle from './particles/Particle.js'
import CanvasParticle from './particles/CanvasParticle.js';
import SphereParticle from './particles/SphereParticle.js';
import { TileProperties } from './TileProperties.js';


const distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}
const lerp = (a, b, t) => {return a + (b - a) * t;}

const destroyableTable = {
    "Gun": [TileProperties.TYPE.Default, TileProperties.TYPE.Cover, TileProperties.TYPE.Bush],
    "Bomb": [TileProperties.TYPE.Default, TileProperties.TYPE.Wall, TileProperties.TYPE.Rock,TileProperties.TYPE.Cover, TileProperties.TYPE.Bush, TileProperties.TYPE.Tree],
    "Saw": [TileProperties.TYPE.Default, TileProperties.TYPE.Wall, TileProperties.TYPE.Rock,TileProperties.TYPE.Cover, TileProperties.TYPE.Bush, TileProperties.TYPE.Tree],
}
export class Weapon{
    constructor(character, typeID, damage = 1,game=null){
        this.character = character;
        this.body = new THREE.Group();
        this.setType(typeID);
        
        this.character.body.add(this.body);
        this.damage = damage;
        this.game = game;
        this.name;
    }

    setType(typeID){
        this.properties = new WeaponProperties(this, typeID);
        //this.render();
    }

    convertToObstacleDamage(damage){
        if (this.name === 'Gun') return 1;
        else if (this.name === 'Bomb') return damage;
        else if (this.name === 'Saw') return damage*2;
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
            for (let i = 0; i < Math.random() * this.properties.Pvar + this.properties.Pmin; i++) {
                let p
                if (this.name === 'Gun') {
                    p = new CanvasParticle(t.body, 0.2, 100);
                    p.setMatrix(Particle.addRandomVelocity(this.properties.particleMatrix));
                }
                else if (this.name === 'Bomb') {
                    p = new SphereParticle(t.body, 2, 100);
                    p.setMatrix(Particle.addRandomVelocity(this.properties.particleMatrix));
                }
                else if (this.name === 'Saw') {
                    p = new CanvasParticle(t.body, 0.2, 20, "cross");
                    p.setMatrix(Particle.addRandomVelocity(this.properties.particleMatrix,0.05,0.02,0.05));
                }
            }
            t.takeDamage(
                this.convertToObstacleDamage(attenuationFunc(this.damage, this.blastRadius, distance(t, tile))),
                this.name
            );
            if (!t.character) {
                return;
            }
            if (t.character.constructor == damager.constructor) return;
            t.character.takeDamage(attenuationFunc(this.damage, this.blastRadius, distance(t, tile)));
            infoBox.note = "Successful Hit!";
        });
        //console.log(this.name, " hits ", tile.mesh.name);
        
    }
}