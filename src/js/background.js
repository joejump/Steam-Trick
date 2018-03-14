import OptionsSync from 'webext-options-sync';
import SteamGroup from './steam/SteamGroup';
import SteamSettings from './steam/SteamSettings';
import CountDownTimer from './libs/CountDownTimer';
import setAvatar from './steam/set-avatar';
import { send as sendMessage } from './libs/messaging';

// defaults options
new OptionsSync().define({
    defaults: {
        audioVolume: '40',
        sourceType: 'xml'
    }
});

class SNCTimer extends CountDownTimer {
    constructor(time, mainProperties) {
        super(time);
        super.onTick((seconds) => {
            this.propertyes.seconds = seconds;
            sendMessage({ type: 'activities-list' });
        });

        this.propertyes = mainProperties;
    }
    async start() {
        const index = SNCTimer.activities.push(Object.assign(
            this.propertyes,
            { timer: this }
        )) - 1;

        await super.start();
        SNCTimer.activities.splice(index, 1);
    }
    addMoreTime(time) {
        this.duration += time;
        return this.duration;
    }
    finish() {
        this.duration = 0;
        return this._promise;
    }
    stop() {
        this.stopped = true;
        return this.finish();
    }
}
// list of started actions
SNCTimer.activities = [];

const joinToGroup = async ({
    time, url, user, onload
}) => {
    const group = new SteamGroup(url, user);
    if (time === 0) return group.join();
    // Join to group
    await group.join();
    if (onload) onload();

    const timer = new SNCTimer(time, { url });
    await timer.start();
    // After some time leave it
    return group.leave();
};

const changeName = async ({
    time, user: { newName, personaName }, onload
}) => {
    const { cache } = changeName;
    const steamSettings = new SteamSettings({ personaName: newName });
    const annul = () => {
        cache.oldName = '';
        cache.timer = null;
        chrome.browserAction.setBadgeText({ text: '' });
    };
    let html;

    // stop previous timer if it exist
    if (cache.timer) cache.timer.stop();

    if (time === 0) {
        html = await steamSettings.send();
        annul();
        onload();
        return html;
    }

    if (!cache.oldName) cache.oldName = personaName;

    const timer = new SNCTimer(time, { newName, oldName: cache.oldName });
    timer.onTick(seconds => chrome.browserAction.setBadgeText({ text: seconds }));
    cache.timer = timer;

    html = await steamSettings.send();
    onload(html);
    await timer.start();

    // if we apply twice this func, code bellow will execute only once with first oldName
    if (!timer.stopped) {
        // return old username to steam
        steamSettings.setNewSettings({ personaName: cache.oldName });

        html = await steamSettings.send();
        annul();
    }
    return html;
};
changeName.cache = {
    oldName: '',
    timer: null
};

const changeAvatar = async ({ blob, user, onload }) => {
    if (blob.size < 1048576) {
        const images = await setAvatar(blob, user);
        if (onload) onload();
        return images;
    }
    throw new Error('MAX FILE SIZE');
};

// This functions will be available in popup window
window.exports = {
    joinToGroup,
    changeName,
    changeAvatar,
    activities: SNCTimer.activities
};

chrome.browserAction.setBadgeText({ text: '' });
