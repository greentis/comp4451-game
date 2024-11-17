import * as THREE from 'three';
import {Tile} from './Tile.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import Particle from './particles/Particle.js';

export class WeaponProperties {
    constructor(weapon, typeID){
        this.id = typeID;
        this.weapon = weapon;
        this.weapon.name = 'Gun';

        this.weapon.damage = 5;
        this.weapon.range = 8;
        this.weapon.blastRadius = 0;
        this.weapon.body.rotation.y = 0;

        this.obstacleDamageMultiplier = 1;

        // The particle controller
        // Pmin: minimum number of particles
        // Pvar: varying range of number of particles
        // particleMatrix: a matrix that maps to:
        //  [[x, y, z], [vx, vy, vz], [ax, ay, az]]
        this.Pmin = 8;
        this.Pvar = 4;
        this.particleMatrix = 
        Particle.addVelocity(
                Particle.addGravity(
                    Particle.setInitialPosition(
                        Particle.get3DMatrix()
                    , 0, 1, 0)
                )
        ,0,0.2,0)
        let url ="";
        switch (typeID) {
            case WeaponProperties.TYPE.Bomb:
                this.weapon.name = 'Bomb';
                this.weapon.blastRadius = 2;

                url="assets/grenade/scene.gltf";
                this.meshScale = 0.036;
                this.weapon.body.position.y = this.weapon.height + 0.4;
                this.weapon.body.rotation.y = Math.PI/2;
                this.weapon.damage = 5;
                this.weapon.range = 6;
                

                this.Pmin = 1;
                this.Pvar = 0;
                this.particleMatrix = 
                Particle.addVelocity(
                            Particle.setInitialPosition(
                                Particle.get3DMatrix()
                            , 0, 1, 0)
                ,0,0,0)
                break;
            case WeaponProperties.TYPE.Gun:
                this.weapon.name = 'Gun';

                url="assets/gun/scene.gltf";
                this.meshScale = 0.18;
                this.weapon.body.position.y = this.weapon.height + 0.3;
                this.weapon.body.rotation.y = Math.PI;
                this.weapon.damage = 8;
                this.weapon.range = 10;
                this.obstacleDamageMultiplier = 0;
                break;
            case WeaponProperties.TYPE.Saw:
                this.weapon.name = 'Saw';

                url="assets/saw/scene.gltf";
                this.meshScale = 0.4;
                this.weapon.body.position.y = this.weapon.height + 0.3;
                this.weapon.body.rotation.y = Math.PI/2;
                this.weapon.damage = 5;
                this.weapon.range = 2;
                this.obstacleDamageMultiplier = 2;

                this.Pmin = 10;
                this.Pvar = 10;
                this.particleMatrix = 
                Particle.addVelocity(
                    Particle.setInitialPosition(
                        Particle.get3DMatrix()
                    , 0, 1, 0)
                ,0,0,0)
                break;
            default:
                break;
        }
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(this.meshScale,this.meshScale,this.meshScale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.weapon;
                }
            });
            this.mesh = model;
            this.weapon.body.add(this.mesh);
            this.weapon.mesh=this.mesh;
            this.weapon.mesh.name=this.name;
        });
    }
}

WeaponProperties.TYPE = {
    Gun: 0,
    Bomb: 1,
    Saw: 2
}