import { Frame } from "./primitives.js";
export class Animation {
    constructor(duration, animation, completion = () => { }) {
        this.duration = duration;
        this.animation = animation;
        this.completion = completion;
        this.isComplete = false;
    }
    step(timeStamp) {
        if (this.startTimeStamp === undefined) {
            this.startTimeStamp = timeStamp;
        }
        if (this.previousTimeStamp == timeStamp) {
            return;
        }
        const elapsed = timeStamp - this.startTimeStamp;
        const delta = this.previousTimeStamp === undefined ? 0 : timeStamp - this.previousTimeStamp;
        this.previousTimeStamp = timeStamp;
        this.animation(elapsed, delta);
        if (this.duration >= 0 && elapsed >= this.duration) {
            this.isComplete = true;
            this.completion();
        }
    }
}
export class TweenedAnimation extends Animation {
    constructor(target, toFrame, duration, completion = () => { }) {
        let startFrame = new Frame(target.frame.x, target.frame.y, target.frame.width, target.frame.height);
        let animation = (elapsed, delta) => {
            let progress = elapsed / this.duration;
            for (let propertyName of ["x", "y", "width", "height"]) {
                if (elapsed >= this.duration) {
                    target.frame[propertyName] = toFrame[propertyName];
                    continue;
                }
                let start = startFrame[propertyName];
                let end = toFrame[propertyName];
                target.frame[propertyName] = start + progress * (end - start);
            }
        };
        super(duration, animation, completion);
    }
}
