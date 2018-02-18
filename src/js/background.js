import SteamGroup from './steam/SteamGroup';
import SteamSettings from './steam/SteamSettings';
import CountDownTimer from './libs/CountDownTimer';
import setAvatar from './steam/set-avatar';

class SNCTimer extends CountDownTimer {
    constructor(time, mainProperties) {
        super(time);
        super.onTick((seconds) => { this.propertyes.seconds = seconds; });

        this.propertyes = mainProperties;
    }
    async start() {
        const index = SNCTimer.actionsList.push(this.propertyes) - 1;
        await super.start();
        SNCTimer.actionsList.splice(index, 1);
    }
}
// list of started actions
SNCTimer.actionsList = [];

const joinToGroup = async ({ time, url, user }) => {
    const group = new SteamGroup(url, user);
    if (time === 0) { return group.join(); }
    // Join to group
    await group.join();

    const timer = new SNCTimer(time, { url });
    await timer.start();
    // After some time leave it
    return group.leave();
};

const changeName = async ({ time, newName, user: { personaName } }) => {
    const steamSettings = new SteamSettings({ personaName: newName });

    if (time !== 0) { return steamSettings.send(); }

    const timer = new SNCTimer(time, { newName });
    timer.onTick(seconds => chrome.browserAction.setBadgeText({ text: seconds }));

    await steamSettings.send();
    await timer.start();

    // return old username to steam
    steamSettings.setNewSettings({ personaName });

    const end = await steamSettings.send();
    chrome.browserAction.setBadgeText({ text: '' });

    return end;
};


const changeAvatar = ({ blob, user }) => {
    if (blob.size < 1048576) {
        return setAvatar(blob, user);
    }
    return Promise.reject(new Error('MAX FILE SIZE'));
};

// This functions will be available in popup window
window.exports = {
    joinToGroup,
    changeName,
    changeAvatar,
    actionsList: SNCTimer.actionsList
};

chrome.browserAction.setBadgeText({ text: '' });
