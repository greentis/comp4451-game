import * as THREE from 'three';
import {Animal} from './Animal.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class AnimalProperties {
    constructor(animal, typeID){
        this.id = typeID;
        this.animal = animal;
        this.name = 'Monkey'

        var url = 'assets/monkey/scene.gltf';
        switch (typeID) {
            case AnimalProperties.TYPE.Monkey:
                url = 'assets/monkey/scene.gltf';
                this.meshScale = 0.01;
                break;
            default:
                break;
        }

        let gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltf) => {
            var model = gltf.scene;
            model.scale.set(this.meshScale,this.meshScale,0.01);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData = this.animal;
                }
            });
            this.mesh = model;
            this.animal.body.add(this.mesh);
            this.animal.mesh=this.mesh;
            this.animal.mesh.name=this.name;
            this.animal.getTile().characterEnter(this.animal);
        })
    }
}

AnimalProperties.TYPE = {
    Monkey: 0
}

// Make TileProperties.TYPE Bidirectional
Object.keys(AnimalProperties.TYPE).forEach(e => {
    AnimalProperties.TYPE[AnimalProperties.TYPE[e]] = e;
});