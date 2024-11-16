import * as THREE from 'three';
import Particle from './Particle.js';

const drawTriangle = (ctx)=>{
    ctx.fillStyle = "#ff7700";
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(25, 0);
    ctx.lineTo(75, 0);
    ctx.fill();
}

const drawCircle = (ctx)=>{
    ctx.fillStyle = "#ff7700";
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, 2 * Math.PI);
    ctx.fill();
}

const drawCross = (ctx)=>{
    ctx.fillStyle = "#ff7700";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(100, 100);
    ctx.moveTo(100, 0);
    ctx.lineTo(0, 100);
    ctx.stroke();
}

export default class CanvasParticle extends Particle{
    constructor(parent, size, lifespan, canvasFunction = "circle", matrix = Particle.get3DMatrix()){

        super(parent, size, lifespan, matrix);

        const particleMaterial = this.makeParticleMaterial(canvasFunction);

        this.makeParticle(new THREE.Sprite(particleMaterial), parent, size);

        

        // The mother function is async to be able to await
        this.waitForMoveAnimation().then(
            this.canvas.remove()
        );
    }

    makeParticleMaterial(canvasFunction){
        this.canvas = document.createElement('canvas')
        const ctx = this.canvas.getContext('2d');

        //document.body.appendChild(ctx.canvas);
        ctx.canvas.width = 100;
        ctx.canvas.height = 100;

        if (canvasFunction === "triangle") drawTriangle(ctx);
        else if (canvasFunction === "cross") drawCross(ctx);
        else drawCircle(ctx);

        const texture = new THREE.CanvasTexture(ctx.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        return new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
    }
}