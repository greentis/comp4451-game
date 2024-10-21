import * as THREE from 'three';
import {Tile} from './Tile.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class WeaponProperties {
    constructor(weapon, typeID){
        this.id = typeID;
        this.weapon = weapon;
        this.weapon.name = 'Gun';

        this.weapon.blastRadius = 0;

        let url ="";
        switch (typeID) {
            case WeaponProperties.TYPE.Bomb:
                this.weapon.name = 'Bomb';
                this.weapon.blastRadius = 2;

                url="assets/grenade/scene.gltf";
                this.meshScale = 0.036;
                this.weapon.body.position.y = 2.4;
                this.weapon.body.rotation.y = Math.PI/2;
                break;
            case WeaponProperties.TYPE.Gun:
                this.weapon.name = 'Gun';

                url="assets/gun/scene.gltf";
                this.meshScale = 0.18;
                this.weapon.body.position.y = 2.3;
                this.weapon.body.rotation.y = -Math.PI/2;
                break;
            case WeaponProperties.TYPE.Saw:
                this.weapon.name = 'Saw';

                url="assets/saw/scene.gltf";
                this.meshScale = 0.4;
                this.weapon.body.position.y = 2.3;
                this.weapon.body.rotation.y = Math.PI;
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