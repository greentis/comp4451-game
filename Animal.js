import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class Animal extends Character{
    constructor(q, r, game, name){
        super(q, r, game, name);

        const gltfLoader = new GLTFLoader();
        const url = 'assets/monkey/scene.gltf';
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(0.008,0.008,0.008);
            model.userData = this;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this;
                }
            });
            this.mesh = model;
            this.getTile().characterEnter(this);
        });
    }
}