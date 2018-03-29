import CountDownTimer from './CountDownTimer';
import { send as sendMessage } from './messaging';

export default class SNCTimer extends CountDownTimer {
    constructor(time, mainProperties) {
        super(time);
        this.propertyes = mainProperties;

        // identify timer by id
        this.id = SNCTimer.activitiesId;
        SNCTimer.activitiesId += 1;

        super.onTick((seconds) => {
            // Update info
            this.propertyes.seconds = seconds;
            sendMessage({ type: 'activities-list' });
        });
        this.onFinishFunc = [];
    }

    async start() {
        // save object with specific id to activities
        const obj = Object.assign(this.propertyes, { timer: this });
        SNCTimer.activities[this.id] = obj;

        // start timer
        await super.start();

        // delete object from activities
        delete SNCTimer.activities[this.id];

        this.onFinishFunc.forEach(fun => fun.call(this));
    }

    addMoreTime(time) {
        this.duration += parseInt(time, 10);
        return this.duration;
    }

    async finish() {
        this.duration = 0;
        await this._promise;
        return this;
    }

    onFinish(fun) {
        this.onFinishFunc.push(fun);
    }

    stop() {
        this.stopped = true;
        return this.finish();
    }
}
// list of started actions
SNCTimer.activities = {};
SNCTimer.activitiesId = 0;
