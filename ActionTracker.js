import * as THREE from 'three';

export class ActionTracker{
    constructor(char){/* 
        const geometry = new THREE.RingGeometry(
            0.3, 0.35, 32);
        const material = new THREE.MeshPhongMaterial({emissive:0x000000});
        this.mesh = new THREE.Mesh(geometry, material);
 */
        this.ctx = document.createElement('canvas').getContext('2d');
        document.body.appendChild(this.ctx.canvas);
        this.ctx.canvas.width = 100;
        this.ctx.canvas.height = 100;
        
        const texture = new THREE.CanvasTexture(this.ctx.canvas);
        // because our canvas is likely not a power of 2
        // in both dimensions set the filtering appropriately.
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(0.3,0.3,0.3);
        
        char.body.add(label)
         
        this.mesh = label;
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
        //console.log('draw');
        this.ctx.clearRect(0, 0, 100, 100);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(50, 50);
        this.ctx.lineTo(25, 0);
        this.ctx.lineTo(75, 0);
        this.ctx.fill();

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
    }
}

export class Particle{
    constructor(canvasFunction, parent, size, lifespan, x = 0, y = 0){
        const ctx = document.createElement('canvas').getContext('2d');
        document.body.appendChild(ctx.canvas);
        ctx.canvas.width = 100;
        ctx.canvas.height = 100;

        const texture = new THREE.CanvasTexture(ctx.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        const particleMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });

        canvasFunction(ctx);

        const particle = new THREE.Sprite(particleMaterial);

        particle.position.x = x;
        particle.position.y = y;
        particle.scale.set(size, size, size);
        parent.add(particle);

        this.ay = 0;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        let time = 0;
        const waitForMoveAnimation = async ()=>{
            return new Promise((resolve)=>{
                const animate = (timestamp)=>{
                    time++;
                    // ~ Animation ~
                    this.vy -= this.ay;
                    particle.position.y -= this.vy;
                    if (time < lifespan) { 
                        requestAnimationFrame(animate);
                    }
                    else{
                        resolve();
                    }
                }
                requestAnimationFrame(animate);
            })
        }

        // The mother function is async to be able to await
        waitForMoveAnimation().then(()=>{
            console.log("dead");
            parent.remove(particle);
        });
    }
}

ActionTracker.STATE = {
    none:0,
    move:2,
    attack:1
}