export class Canvas {
    constructor(canvas, rootView = null, animations = []) {
        this.canvas = canvas;
        this.rootView = rootView;
        this.animations = animations;
        let context = canvas.getContext("2d");
        let rect = canvas.getBoundingClientRect();
        // Scale up the canvas and drawing context to handle high-DPI displays.
        let devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        context.scale(devicePixelRatio, devicePixelRatio);
        // Shrink the canvas back down with CSS.
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
    }
    draw() {
        let context = this.canvas.getContext("2d");
        let rect = this.canvas.getBoundingClientRect();
        context.clearRect(0, 0, rect.width, rect.height);
        this.rootView.draw(context);
    }
    requestNextFrame() {
        let canvas = this;
        window.requestAnimationFrame((timeStamp) => {
            canvas.step(timeStamp);
        });
    }
    step(timeStamp) {
        // this is undefined
        let animations = this.animations;
        this.animations = [];
        for (let animation of animations) {
            animation.step(timeStamp);
            if (!animation.isComplete) {
                this.animations.push(animation);
            }
        }
        this.draw();
        if (this.animations.length > 0) {
            this.requestNextFrame();
        }
    }
    addAnimation(animation) {
        this.animations.push(animation);
        this.requestNextFrame();
    }
}
