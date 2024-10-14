import * as THREE from 'three';

export class Indicator{
    constructor(char){
        const geometry = new THREE.RingGeometry(
            0.3, 0.35, 32);
        const material = new THREE.MeshPhongMaterial({emissive:0x000000});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        this.character = char;
        char.body.add(this.mesh);
        
        
        this.mesh.position.y = 0.01;
        this.mesh.rotateX(-Math.PI/2);
        
        this.mesh.name = "indicator";
        this.setState(1);
    }

    setState(state){
        this.mesh.visible = true;
        switch (state){
            case Indicator.STATE.none:
                this.mesh.visible = false;
                break;
            case Indicator.STATE.move:
                this.mesh.material.emissive.set(0x9999ff);
                this.mesh.material.color.set(0x000055);
                break;
            case Indicator.STATE.attack:
                this.mesh.material.emissive.set(0x555500);
                this.mesh.material.color.set(0x555500);
                break;
        }
    }
}

Indicator.STATE = {
    none:0,
    move:1,
    attack:2
}