import * as THREE from 'three';
import Particle from './Particle.js';

export default class NumberParticle extends Particle{
    constructor(parent, size, lifespan, canvasFunction = "-0", matrix = Particle.get3DMatrix()){

        super(parent, size, lifespan, matrix);

        const particleMaterial = this.makeParticleMaterial(canvasFunction);

        this.makeParticle(new THREE.Sprite(particleMaterial), parent, size);

        

        // The mother function is async to be able to await
        this.waitForMoveAnimation().then(
            this.canvas.remove()
        );
    }

    makeParticleMaterial(text){
        this.canvas = document.createElement('canvas')
        const ctx = this.canvas.getContext('2d');

        //document.body.appendChild(ctx.canvas);
        ctx.canvas.width = 100;
        ctx.canvas.height = 100;

        ctx.fillStyle = "#ff0000";
        ctx.font = "128px serif";
        ctx.textAlign = "center";
        console.log(text);
        ctx.fillText(text, 50, 100);

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