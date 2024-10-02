import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class Hunter extends Character{
    constructor(q, r, game, name){
        super(q, r, game, name);

        const gltfLoader = new GLTFLoader();
        const url = 'assets/low_poly_kyle_crane/scene.gltf';
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(1.2,1.2,1.2);
            model.userData = this;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this;
                }
            });
            this.mesh = model;
            this.light = new THREE.PointLight(0xc08844, 40);
            this.light.position.y = 0.5;
            this.light.decay = 0.5;
            this.light.distance = this.sightRange - 0.5;
            this.light.castShadow = true;
            this.mesh.add(this.light);
            this.getTile().characterEnter(this);
        });
    }
}