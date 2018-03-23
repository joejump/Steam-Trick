import OptionsSync from 'webext-options-sync';
import SteamGroup from './steam/SteamGroup';
import SteamSettings from './steam/SteamSettings';
import CountDownTimer from './libs/CountDownTimer';
// import setAvatar from './steam/set-avatar';
import { send as sendMessage } from './libs/messaging';
import { showNotification } from './libs/utils';

// defaults options
new OptionsSync().define({
    defaults: {
        audioVolume: '40',
        sourceType: 'xml'
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
    if (details.reason === 'update') {
        const thisVersion = chrome.runtime.getManifest().version;
        showNotification(`Updated from ${details.previousVersion} to ${thisVersion}!`);
    }
});

class SNCTimer extends CountDownTimer {
    constructor(time, mainProperties) {
        super(time);
        this.propertyes = mainProperties;

        // identify timer by id
        this.id = SNCTimer.activitiesId;
        SNCTimer.activitiesId += 1;

        super.onTick((seconds) => {
            this.propertyes.seconds = seconds;
            sendMessage({ type: 'activities-list' });
        });
        this.onFinishFunc = [];
    }
    async start() {
        const obj = Object.assign(this.propertyes, { timer: this });
        SNCTimer.activities[this.id] = obj;

        await super.start();

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

const joinToGroup = async ({
    time, url, user, onload
}) => {
    const group = new SteamGroup(url, user);
    // Join to group
    await group.join();

    if (onload) onload(group.groupName);

    if (time !== 0) {
        const mainProperties = Object.assign({ type: 'group' }, group);
        const timer = new SNCTimer(time, mainProperties);
        await timer.start();
        // After some time leave it
        await group.leave();
    }
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

    const mainProperties = {
        type: 'name',
        oldName: cache.oldName,
        newName
    };
    const timer = new SNCTimer(time, mainProperties);
    timer.onTick(seconds =>
        chrome.browserAction.setBadgeText({ text: seconds }));

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

// const changeAvatar = async ({ blob, user, onload }) => {
//     const images = await setAvatar({ blob, user });
//     if (onload) onload();
//     return images;
// };


// chrome.contextMenus.create({
//     title: 'Set as avatar',
//     contexts: ['image'],
//     onclick(e) {
//         if (e.mediaType === 'image') {
//
//         }
//     }
// });

// This functions will be available in popup window
window.exports = {
    joinToGroup,
    changeName,
    // changeAvatar,
    activities: SNCTimer.activities
};

chrome.browserAction.setBadgeText({ text: '' });
