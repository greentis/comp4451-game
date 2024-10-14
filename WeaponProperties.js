import * as THREE from 'three';
import {Tile} from './Tile.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class WeaponProperties {
    constructor(weapon, typeID){
        this.id = typeID;
        this.weapon = weapon;
        this.name = 'Gun';

        this.blastRadius = 1;

        let url ="";
        switch (typeID) {
            case WeaponProperties.TYPE.Bomb:
                this.name = 'Bomb';

                url="assets/grenade/scene.gltf";
                this.meshScale = 0.04;
                break;
            case WeaponProperties.TYPE.Gun:
                this.name = 'Gun';

                url="assets/gun/scene.gltf";
                this.meshScale = 0.02;
                break;
            default:
                break;
        }
        console.log(this.id);
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
    Knife: 2
}

// Make TileProperties.TYPE Bidirectional
Object.keys(WeaponProperties.TYPE).forEach(e => {
    WeaponProperties.TYPE[WeaponProperties.TYPE[e]] = e;
});