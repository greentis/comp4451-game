import * as THREE from 'three';

import {Character} from './Character.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { AnimalProperties } from './AnimalProperties.js';

export class Animal extends Character{
    constructor(q, r, health, game, name){
        super(q, r, health, game, name);

        this.body = new THREE.Object3D();
        this.setType(AnimalProperties.TYPE.Monkey);
    }

    setType(typeID){
        this.properties = new AnimalProperties(this, typeID);
        //this.render();
    }
}