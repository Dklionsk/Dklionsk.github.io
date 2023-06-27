import { Frame } from "./primitives.js";
import { CircleView, View } from "./drawing.js";
import { Animation } from "./animation.js";
import { ParticleSystem } from "./particles.js";
import { Canvas } from "./canvas.js";
function colorFromXPosition(x, minHue = 0, maxHue = 360) {
    let hue = minHue + x * (maxHue - minHue);
    return `hsl(${hue}, 100%, 50%)`;
}
class ParticleView extends CircleView {
    constructor(centerX, centerY, radius) {
        super(centerX, centerY, radius);
        this.fillColor = "red";
    }
}
class WallView extends View {
    constructor(frame, backgroundColor = "black") {
        super(frame, backgroundColor);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    let canvasElement = document.getElementById("canvas");
    const bodyStyle = window.getComputedStyle(document.body);
    const widthString = bodyStyle.getPropertyValue("width");
    const width = Number(widthString.slice(0, -2));
    canvasElement.width = width;
    canvasElement.height = width * 0.2;
    let numParticles = 500;
    let radius = 0.006 * canvasElement.width;
    let wallMaxX = 0.1 * canvasElement.width;
    let maxParticleSpeed = 0.05 * canvasElement.width;
    let particleSystem = new ParticleSystem(canvasElement.width, canvasElement.height, wallMaxX, maxParticleSpeed, numParticles, radius);
    let canvas = new Canvas(canvasElement);
    let rect = canvasElement.getBoundingClientRect();
    let view = new View(new Frame(0, 0, rect.width, rect.height));
    canvas.rootView = view;
    let particleViews = [];
    for (let particle of particleSystem.particles) {
        let particleView = new ParticleView(particle.position.x, particle.position.y, particle.radius);
        particleView.fillColor = colorFromXPosition(particle.position.x / canvasElement.width, 120, 360);
        particleViews.push(particleView);
        view.addSubview(particleView);
    }
    let wall = particleSystem.leftWall;
    let wallView = new WallView(new Frame(wall.frame.x, wall.frame.y, wall.frame.width, wall.frame.height));
    view.addSubview(wallView);
    canvas.draw();
    // Increase or decrease this to speed up or slow down the animation.
    let speedFactor = 0.75;
    let animation = new Animation(-1, (elapsed, delta) => {
        particleSystem.update(delta / 1000 * speedFactor);
        for (let i = 0; i < particleViews.length; i++) {
            let particle = particleSystem.particles[i];
            let circleView = particleViews[i];
            circleView.frame.x = particle.position.x - particle.radius;
            circleView.frame.y = particle.position.y - particle.radius;
        }
        wallView.frame.x = wall.frame.x;
    });
    canvas.addAnimation(animation);
});
