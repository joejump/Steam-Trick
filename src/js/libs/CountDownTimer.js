import parse from './parse-time';

export default class CountDownTimer {
    constructor(duration, granularity = 500) {
        this.duration = duration;
        this.granularity = granularity;

        this.tickFtns = [];
        this.running = false;
    }
    start() {
        if (this.running) {
            return Promise.reject(new Error('Timer has already started'));
        }

        this.running = true;
        this._promise = new Promise((resolve) => {
            const start = Date.now();
            const timer = () => {
                let diff = this.duration - (((Date.now() - start) / 1000) | 0);

                if (diff > 0) {
                    setTimeout(timer, this.granularity);
                } else {
                    diff = 0;
                    this.running = false;

                    resolve();
                }

                const timeRemaining = parse(diff);
                this.tickFtns.forEach(fun => fun.call(this, timeRemaining));
            };
            timer();
        });
        return this._promise;
    }
    onTick(fun) {
        if (typeof fun === 'function') { this.tickFtns.push(fun); }
    }
    expired() {
        return !this.running;
    }
}
