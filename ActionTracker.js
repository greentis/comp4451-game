import * as THREE from 'three';

export class ActionTracker{
    constructor(char){
        this.character = char;

        
        

        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
        this.ctx.canvas.width = 100;
        this.ctx.canvas.height = 100;
        
        const texture = new THREE.CanvasTexture(canvas);
        // because our canvas is likely not a power of 2
        // in both dimensions set the filtering appropriately.
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(0.4,0.4,0.4);
        
        char.body.add(label)
         
        this.mesh = label;
        this.mesh.visible = false;
        
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
                if (this.wake) {
                    this.drawIndicator("!");
                }
                else{
                    this.mesh.visible = false;
                }
                break;
            case ActionTracker.STATE.move:      // turnActionState = 1;
                this.drawIndicator("#0000ff");
                break;
            case ActionTracker.STATE.attack:    // turnActionState = 2;
                this.drawIndicator("#ff7700");
                break;
        }
    }

    reduceActionPoint(k){
        this.actionPoint -= k;
        if (this.actionPoint < 0) this.actionPoint = 0;
        this.setActionPoint(this.actionPoint);
    }

    render(){
        this.mesh.position.y = 2.05// + this.character.getTile().properties.offsetYt;
    }

    

    drawIndicator(color){
        if (color == "!"){
            this.ctx.clearRect(0, 0, 100, 100);
            this.ctx.fillStyle = "#ff0000";
            this.ctx.font = "48px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("!", 50, 60);
        } else {
            //console.log('draw');
            this.ctx.clearRect(0, 0, 100, 100);
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(50, 50);
            this.ctx.lineTo(25, 0);
            this.ctx.lineTo(75, 0);
            this.ctx.fill();
        }
        
       
        const texture = new THREE.CanvasTexture(this.ctx.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
        this.mesh.material.copy(labelMaterial);

        this.mesh.visible = true;
    }
}

let ctxs = [];
for (let i = 0 ; i < 2; i ++){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.canvas.width = 100;
    ctx.canvas.height = 100;
    switch (i){
        case 0:
            ctx.fillStyle = "#0000ff";
            break;
        case 1:
            ctx.fillStyle = "#ff7700";
            break;
        case 2:
            ctx.fillStyle = "#ff0000";
            ctx.font = "48px serif";
            ctx.textAlign = "center";
            ctx.fillText("!", 50, 50);
            break;
        default:
            break;
    }
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(25, 0);
    ctx.lineTo(75, 0);
    ctx.fill();
    ctxs.push(ctx);
}

ActionTracker.INDICATOR = {
    move:ctxs[0],
    attack:ctxs[1],
    none:ctxs[2]
} 

ActionTracker.STATE = {
    none:0,
    move:2,
    attack:1
}