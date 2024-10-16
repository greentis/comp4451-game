import * as THREE from 'three';

export class ActionTracker{
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
        this.actionPoint = 0;
    }

    setActionPoint(state){
        this.mesh.visible = true;
        this.actionPoint = state;
        switch (state){
            case ActionTracker.STATE.none:      // turnActionState = 0;
                this.mesh.visible = false;
                break;
            case ActionTracker.STATE.move:      // turnActionState = 1;
                this.mesh.material.emissive.set(0x7777ff);
                this.mesh.material.color.set(0x000055);
                break;
            case ActionTracker.STATE.attack:    // turnActionState = 2;
                this.mesh.material.emissive.set(0xbbbb00);
                this.mesh.material.color.set(0x555500);
                break;
        }
    }

    reduceActionPoint(k){
        this.actionPoint -= k;
        if (this.actionPoint < 0) this.actionPoint = 0;
        this.setActionPoint(this.actionPoint);
    }
}

ActionTracker.STATE = {
    none:0,
    move:2,
    attack:1
}