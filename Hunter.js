import * as THREE from 'three';

import { Character } from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Weapon } from './Weapon.js';
import { WeaponProperties } from './WeaponProperties.js';
import Particle from './particles/Particle.js'
import { infoBox } from './infoBox.js';

const distance = (t1, t2) => {return Math.max(Math.abs(t1.q - t2.q), Math.abs(t1.r - t2.r), Math.abs(t1.s - t2.s));}

export class Hunter extends Character{
    constructor(q, r, health, weaponType, game, name){
        super(q, r, health, game, name);
        this.actionstate = Hunter.ACTION['idle'];

        this.weapon = new Weapon(this, weaponType);

        if (weaponType == WeaponProperties.TYPE.Saw){
            this.moveRange = 10;
        }

        // Radar Display
        const radar_radius = 1.2;
        const radar_interior_radius = 1.12;
        const material = new THREE.MeshPhongMaterial({color:0x156815, opacity: 0.8, transparent: true,});
        const radarGeometry = new THREE.RingGeometry(radar_interior_radius, radar_radius);
        this.radar = new THREE.Mesh(radarGeometry, material);
        const pointerGeometry = new THREE.RingGeometry(
            0, radar_radius, 32, 1, 0, Math.PI / 3);
        this.radar.add(new THREE.Mesh(pointerGeometry, material));
        this.radar.rotateX(-Math.PI/2);
        this.radar.visible = false;
        this.game.board.body.add(this.radar);
        this.sightRange = 10;
        this.properties = {
            hitRateCost: 100,
            height: 1.3
        }
        this.action.render();

        this.setActionPoint(2);
        this.getTile().characterEnter(this);
        // Hunter Model
        const gltfLoader = new GLTFLoader();
        // choose the model url according to the weapon type
        let url, scale;
        if (weaponType == WeaponProperties.TYPE.Saw){
            url = 'assets/low_poly_kyle_crane/scene.gltf';
            scale = 0.8;
        }
        else if (weaponType == WeaponProperties.TYPE.Gun){
            url = 'assets/hunter/scene.gltf';
            scale = 0.2;
        }
        else if (weaponType == WeaponProperties.TYPE.Bomb){
            url = 'assets/mage_bomber/scene.gltf';
            scale = 0.65;
        }
        else{
            console.error("Invalid weapon type, setting to default");
            url = 'assets/low_poly_kyle_crane/scene.gltf';
        }       
        console.log("Hunter: loading model from ", url);
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.userData = this;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this;
                }
            });
            this.mesh = model;
            this.light = new THREE.PointLight(0x764715, 40);
            this.light.position.y = 2;
            this.light.decay = 0.2;
            this.light.distance = this.sightRange - 1;
            this.light.castShadow = true;
            this.mesh.add(this.light);
            this.mesh.name=name;
            this.body.add(this.mesh);
        });
        
        
    }

    //
    // EventHandler (Overwrite)
    //
        playAnimation(){}

        select(){
            //pop out all playerMove
            this.game.movingPlayer = this;
            if (this.actionstate == Hunter.ACTION.idle) {
                this.actionstate = Hunter.ACTION.move;
                this.actionstate += (2 - this.action.actionPoint);
                //console.log('move');
                this.updateActionState();
            }
            //console.log("hunter select", this.actionstate);
        }
        deselect(){
            //console.log("hunter deselect", this.actionstate);
            switch (this.actionstate) {
                case Hunter.ACTION.move:
                    this.actionstate = Hunter.ACTION.attack;
                    this.updateActionState();
                    return this;
                case Hunter.ACTION.attack:
                    this.actionstate = Hunter.ACTION.idle;
                    this.updateActionState();
                    return;
                case Hunter.ACTION.selected:
                    this.actionstate = Hunter.ACTION.idle;
                    this.updateActionState();
                    break;
                case Hunter.ACTION.idle:
                default:
                    this.actionstate = Hunter.ACTION.idle;
                    this.updateActionState();
                    break;
            }
        }
        deselect_forced(){
            this.game.movingPlayer = null;
            this.actionstate = Hunter.ACTION.idle;
            this.updateActionState();
            this.game.selectedObject = null;
        }
        updateActionState(){
            switch (this.actionstate) {
                case Hunter.ACTION.move:
                    this.getTile().setState('selected');
                    this.updateRadar();
                    this.weapon.enlargeDisplay(false);
                    this.displayInfo();
                    break;
                case Hunter.ACTION.attack:
                    this.getTile().setState('aggressive');
                    this.updateRadar();
                    this.weapon.enlargeDisplay(true);
                    this.displayInfo();
                    break;
                case Hunter.ACTION.selected:
                    this.getTile().setState('selected');
                    this.updateRadar();
                    this.weapon.enlargeDisplay(false);
                    this.displayInfo();
                    this.game.movingPlayer = null;
                    break; 
                case Hunter.ACTION.idle:
                default:
                    super.deselect();
                    this.closeRadar();
                    this.board.clearMarkings();
                    this.weapon.enlargeDisplay(false);
                    this.game.movingPlayer = null;
                    if(!this.game.gameOn) return;
                    infoBox.format = infoBox.FORMAT.MissionInfo;
                    break;
            }
        }

        killed(damager){
            console.log(this.game.player);
            const index = this.game.player.findIndex(obj => obj.name == this.name);
            if (index !== -1) {
                this.game.player.splice(index, 1);
            }
            console.log(this.game.player.length, " players remaining")
            
            super.killed(damager).then(() => {
                if (this.game.player.length == 0) this.game.missionFailed();
            });
        }

        updateRadar(){
            this.radar.visible = true;
            this.radar.position.x = this.getTile().x;
            this.radar.position.z = this.getTile().z;
            this.radar.position.y = this.getTile().mesh.position.y + 5.01 + this.getTile().body.position.y;
            let tile = this.findClosestEnemy().getTile();
            this.radar.rotation.z = Math.atan2(tile.x - this.getTile().x, tile.z - this.getTile().z);
            //this.radar.rotation.z = 0;
            this.radar.rotation.z -= Math.PI /2 + Math.PI/6;
            //console.log(this.radar.position.y);
        }
        findClosestEnemy(){
            let minDist = 10000; let dist;
            let closestE = null;
            for (let e of this.game.enemy){
                dist = distance(this.getTile(), e.getTile())
                if (minDist > dist){
                    minDist = dist;
                    closestE = e;
                }
            };
            return closestE
        }

        closeRadar(){
            this.radar.visible = false;
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
    attack : 2,
    selected: 3
}