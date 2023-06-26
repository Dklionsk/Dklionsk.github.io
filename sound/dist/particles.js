import { Frame, Vec2 } from "./primitives.js";
export class Particle {
    constructor(position, velocity, radius) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
    }
}
export class Wall {
    constructor(frame, velocity) {
        this.frame = frame;
        this.velocity = velocity;
    }
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}
export class ParticleSystem {
    constructor(width, height, amplitude, magnitude, numParticles, radius) {
        this.width = width;
        this.height = height;
        this.amplitude = amplitude;
        this.particles = [];
        let minSpeed = -magnitude;
        let maxSpeed = magnitude;
        for (let i = 0; i < numParticles; i++) {
            let position = new Vec2(Math.random() * width, Math.random() * height);
            let velocity = new Vec2(random(minSpeed, maxSpeed), random(minSpeed, maxSpeed));
            let particle = new Particle(position, velocity, radius);
            this.particles.push(particle);
        }
        this.leftWall = new Wall(new Frame(0, 0, 0.02 * width, height), new Vec2(0.5 * width, 0));
    }
    update(delta) {
        this.collisions = 0;
        let maxWallX = this.amplitude;
        let wallVelocity = this.leftWall.velocity;
        this.leftWall.frame.x += this.leftWall.velocity.x * delta;
        if (this.leftWall.frame.x <= 0) {
            this.leftWall.frame.x = 0;
            this.leftWall.velocity.x *= -1;
        }
        else if (this.leftWall.frame.x >= maxWallX) {
            this.leftWall.frame.x = maxWallX;
            this.leftWall.velocity.x *= -1;
        }
        let leftEdge = this.leftWall.frame.x + this.leftWall.frame.width;
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            let x = particle.position.x;
            x += particle.velocity.x * delta;
            if (x <= leftEdge + particle.radius) {
                x = leftEdge + particle.radius;
                if (this.leftWall.velocity.x < 0) {
                    particle.velocity.x *= -1;
                }
                else {
                    particle.velocity.x = wallVelocity.x;
                }
            }
            else if (x >= this.width - particle.radius) {
                x = this.width - particle.radius;
                particle.velocity.x *= -1;
                this.collisions += 1;
            }
            particle.position.x = x;
            let y = particle.position.y;
            y += particle.velocity.y * delta;
            if (y <= particle.radius) {
                y = particle.radius;
                particle.velocity.y *= -1;
            }
            else if (y >= this.height - particle.radius) {
                y = this.height - particle.radius;
                particle.velocity.y *= -1;
            }
            particle.position.y = y;
        }
        for (let i = 0; i < this.particles.length - 1; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                let particle1 = this.particles[i];
                let particle2 = this.particles[j];
                let dx = particle2.position.x - particle1.position.x;
                let dy = particle2.position.y - particle1.position.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let overlap = particle1.radius + particle2.radius - distance;
                if (overlap >= 0) {
                    let temp = particle1.velocity;
                    particle1.velocity = particle2.velocity;
                    particle2.velocity = temp;
                    let displacementVector = new Vec2(dx / distance, dy / distance);
                    particle1.position.x -= (overlap / 2) * displacementVector.x;
                    particle1.position.y -= (overlap / 2) * displacementVector.y;
                    particle2.position.x += (overlap / 2) * displacementVector.x;
                    particle2.position.y += (overlap / 2) * displacementVector.y;
                }
            }
        }
    }
}
