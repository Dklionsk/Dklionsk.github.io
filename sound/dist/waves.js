import { Vec2 } from "./primitives.js";
function random(min, max) {
    return Math.random() * (max - min) + min;
}
export class WaveSim {
    constructor(width, height, numParticles, amplitude, frequency, wavelength) {
        this.width = width;
        this.height = height;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.wavelength = wavelength;
        this.startingPositions = [];
        this.positions = [];
        let extraWidth = 0.1 * width;
        let extraHeight = 0.1 * height;
        for (let i = 0; i < numParticles; i++) {
            let position = new Vec2(random(-extraWidth, width + extraWidth), random(-extraHeight, height + extraHeight));
            this.startingPositions.push(position);
            this.positions.push(new Vec2(position.x, position.y));
        }
    }
    update(t, delta) {
        for (let i = 0; i < this.positions.length; i++) {
            let startingPosition = this.startingPositions[i];
            let timeOffset = -(1.0 / this.wavelength) * startingPosition.x / this.width;
            this.positions[i].x = startingPosition.x + this.amplitude * Math.sin(this.frequency * (t + timeOffset));
        }
    }
}
