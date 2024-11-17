import * as THREE from 'three';
import Particle from './Particle.js';

export default class CanvasParticle extends Particle{
    constructor(parent, size, lifespan, color = 0x888888, matrix = Particle.get3DMatrix()){

        super(parent, size, lifespan, matrix);

        const particleMaterial = this.makeParticleMaterial(color);
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const mesh = new THREE.Mesh(geometry, particleMaterial)
        this.makeParticle(mesh);

        // The mother function is async to be able to await
        this.dsize = -0.05;
        this.waitForMoveAnimation()
    }

    makeParticleMaterial(color){
        return new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
    }
}