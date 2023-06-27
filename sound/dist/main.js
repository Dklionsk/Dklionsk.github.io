import { Frame } from "./primitives.js";
import { CircleView, View } from "./drawing.js";
import { Animation } from "./animation.js";
import { WaveSim } from "./waves.js";
import { Canvas } from "./canvas.js";
function colorFromXPosition(x, minHue = 0, maxHue = 360) {
    let hue = minHue + x * (maxHue - minHue);
    return `hsl(${hue}, 100%, 50%)`;
}
document.addEventListener("DOMContentLoaded", () => {
    let canvasElement = document.getElementById("canvas");
    const bodyStyle = window.getComputedStyle(document.body);
    const widthString = bodyStyle.getPropertyValue("width");
    const width = Number(widthString.slice(0, -2));
    canvasElement.width = width;
    canvasElement.height = Math.round(width * 0.2);
    let numParticles = 5000;
    let radius = 0.003 * canvasElement.width;
    let amplitude = 0.01 * canvasElement.width;
    let frequency = 10.0;
    let wavelength = 0.3;
    let waveSim = new WaveSim(canvasElement.width, canvasElement.height, numParticles, amplitude, frequency, wavelength);
    let canvas = new Canvas(canvasElement);
    let rect = canvasElement.getBoundingClientRect();
    let view = new View(new Frame(0, 0, rect.width, rect.height));
    canvas.rootView = view;
    let particleViews = [];
    for (let position of waveSim.positions) {
        let particleView = new CircleView(position.x, position.y, radius);
        particleView.fillColor = colorFromXPosition(position.x / canvasElement.width, 120, 360);
        particleViews.push(particleView);
        view.addSubview(particleView);
    }
    canvas.draw();
    let animation = new Animation(-1, (elapsed, delta) => {
        waveSim.update(elapsed / 1000, delta / 1000);
        for (let i = 0; i < particleViews.length; i++) {
            let position = waveSim.positions[i];
            let circleView = particleViews[i];
            circleView.frame.x = position.x - radius;
            circleView.frame.y = position.y - radius;
        }
    });
    canvas.addAnimation(animation);
});
