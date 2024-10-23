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
        
        
        this.render();
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
                this.mesh.material.color.set(0x0000ff);
                break;
            case ActionTracker.STATE.attack:    // turnActionState = 2;
                this.mesh.material.color.set(0xff7700);
                break;
        }
    }

    reduceActionPoint(k){
        this.actionPoint -= k;
        if (this.actionPoint < 0) this.actionPoint = 0;
        this.setActionPoint(this.actionPoint);
    }

    render(){
        this.mesh.position.y = 0.01 + this.character.getTile().properties.offsetYt;
    }
}

ActionTracker.STATE = {
    none:0,
    move:2,
    attack:1
}