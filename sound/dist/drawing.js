import { Frame } from "./primitives.js";
export class View {
    constructor(frame, backgroundColor = "transparent", subviews = []) {
        this.frame = frame;
        this.backgroundColor = backgroundColor;
        this.subviews = subviews;
    }
    addSubview(subview) {
        this.subviews.push(subview);
    }
    draw(context) {
        context.fillStyle = this.backgroundColor;
        context.fillRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
        for (let subview of this.subviews) {
            subview.draw(context);
        }
    }
}
export class ShapeView extends View {
    constructor(frame, fillColor = "white", lineWidth = 0, strokeColor = "black") {
        super(frame);
        this.fillColor = fillColor;
        this.lineWidth = lineWidth;
        this.strokeColor = strokeColor;
    }
}
export class CircleView extends ShapeView {
    constructor(centerX, centerY, radius) {
        super(new Frame(centerX - radius, centerY - radius, 2 * radius, 2 * radius));
    }
    draw(context) {
        super.draw(context);
        context.beginPath();
        context.ellipse(this.frame.x + this.frame.width / 2, this.frame.y + this.frame.height / 2, this.frame.width / 2, this.frame.height / 2, 0, 0, 2 * Math.PI);
        context.fillStyle = this.fillColor;
        context.fill();
        if (this.lineWidth > 0) {
            context.lineWidth = this.lineWidth;
            context.strokeStyle = this.strokeColor;
            context.stroke();
        }
    }
}
