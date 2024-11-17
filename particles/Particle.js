import * as THREE from 'three';

export default class Particle{
    constructor(parent, size, lifespan, matrix){
        this.parent = parent;
        this.size = size;
        this.lifespan = lifespan;
        this.dsize = 0;

        this.setMatrix(matrix);
    }

    setMatrix(matrix){
        this.x = matrix[0][0];
        this.y = matrix[0][1];
        this.z = matrix[0][2];

        this.vx = matrix[1][0];
        this.vy = matrix[1][1];
        this.vz = matrix[1][2];

        this.ax = matrix[2][0];
        this.ay = matrix[2][1];
        this.az = matrix[2][2];
    }

    makeParticle(particle){
        particle.position.x = this.x;
        particle.position.y = this.y;
        particle.position.z = this.z;
        particle.scale.set(this.size, this.size, this.size);

        this.parent.add(particle);
        this.particle = particle;
    }

    async waitForMoveAnimation(){
        let time = 0;
        return new Promise((resolve)=>{
            const animate = (timestamp)=>{
                time++;
                // ~ Animation ~
                this.vx += this.ax;
                this.vy += this.ay;
                this.vz += this.az;
                this.x += this.vx;
                this.y += this.vy;
                this.z += this.vz;
                this.particle.position.x = this.x;
                this.particle.position.y = this.y;
                this.particle.position.z = this.z;
                this.size += this.dsize;
                if (this.size < 0) this.size = 0;
                if (this.dsize != 0) this.particle.scale.set(this.size, this.size, this.size);

                if (time < this.lifespan) { 
                    requestAnimationFrame(animate);
                }
                else{
                    resolve();
                }
            }
            requestAnimationFrame(animate);
        }).then(()=>{
            console.log("dead");
            this.parent.remove(this.particle);
        })
    }

    static get3DMatrix(){
        return [
            [0.0,0.0,0.0],
            [0.0,0.0,0.0],
            [0.0,0.0,0.0]
        ];
    }

    static setInitialPosition(matrix, x=0, y=0, z=0){
        matrix[0][0] = x;
        matrix[0][1] = y;
        matrix[0][2] = z;
        return matrix;
    }

    static addGravity(matrix){
        matrix[2][1] += -0.015;
        return matrix;
    }

    static addVelocity(matrix, vx=0, vy=0, vz=0){
        matrix[1][0] += vx;
        matrix[1][1] += vy;
        matrix[1][2] += vz;
        return matrix;
    }

    static addAcceleration(matrix, ax=0, ay=0, az=0){
        matrix[2][0] += ax;
        matrix[2][1] += ay;
        matrix[2][2] += az;
        return matrix;
    }

    static addRandomVelocity(matrix, vxScale=0.125, vyScale=0, vzScale=0.125){
        matrix[1][0] += vxScale * Math.random() - vxScale/2;
        matrix[1][1] += vyScale * Math.random() - vyScale/2;
        matrix[1][2] += vzScale * Math.random() - vzScale/2;
        return matrix;
    }

    static addAngularVelocity(matrix, azimuth, elevation, velocity){
        matrix[2][0] += velocity * Math.cos(azimuth) * Math.cos(elevation);
        matrix[2][1] += velocity * Math.sin(azimuth) * Math.cos(elevation);
        matrix[2][2] += velocity * Math.sin(elevation);
        return matrix;
    }
}