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


        this.offsetY = 0;
        this.rotateY = 0;
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
                    , 0, 0.6, 0)
                )
        ,0,0.2,0)
        this.url ="";
        switch (typeID) {
            case WeaponProperties.TYPE.Bomb:
                this.weapon.name = 'Bomb';
                this.weapon.blastRadius = 2;

                this.url="assets/grenade/scene.gltf";
                this.meshScale = 0.025;
                this.offsetY = this.weapon.height + 0.2;
                this.rotateY = Math.PI/2;
                this.weapon.damage = 5;
                this.weapon.range = 6;
                

                this.Pmin = 1;
                this.Pvar = 0;
                this.particleMatrix = 
                Particle.addVelocity(
                            Particle.setInitialPosition(
                                Particle.get3DMatrix()
                            , 0, 0.6, 0)
                ,0,0,0)
                break;
            case WeaponProperties.TYPE.Gun:
                this.weapon.name = 'Gun';

                this.url="assets/gun/scene.gltf";
                this.meshScale = 0.125;
                this.offsetY = this.weapon.height + 0.15;
                this.rotateY = Math.PI;
                this.weapon.damage = 8;
                this.weapon.range = 10;
                this.obstacleDamageMultiplier = 0;
                break;
            case WeaponProperties.TYPE.Saw:
                this.weapon.name = 'Saw';

                this.url="assets/saw/scene.gltf";
                this.meshScale = 0.3;
                this.offsetY = this.weapon.height + 0.15;
                this.rotateY = Math.PI/2;
                this.weapon.damage = 6;
                this.weapon.range = 3;
                this.obstacleDamageMultiplier = 2;

                this.Pmin = 10;
                this.Pvar = 10;
                this.particleMatrix = 
                Particle.addVelocity(
                    Particle.setInitialPosition(
                        Particle.get3DMatrix()
                    , 0, 0.6, 0)
                ,0,0,0)
                break;
            default:
                break;
        }
        
        this.renderMesh();
    }

    async renderMesh(){
        //await new Promise(resolve => setTimeout(resolve, 1000));

        const gltfLoader = new GLTFLoader();
        gltfLoader.load(this.url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(this.meshScale,this.meshScale,this.meshScale);
            model.rotateY(this.rotateY);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.weapon;
                }
            });
            this.mesh = model;
            this.weapon.body.add(this.mesh);
            this.weapon.mesh=this.mesh;
            this.weapon.mesh.name=this.name;
            this.weapon.body.position.y = this.offsetY;
        });
    }
}

WeaponProperties.TYPE = {
    Gun: 0,
    Bomb: 1,
    Saw: 2
}