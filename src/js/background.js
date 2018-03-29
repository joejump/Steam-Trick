import OptionsSync from 'webext-options-sync';
import SteamGroup from './steam/SteamGroup';
import SteamSettings from './steam/SteamSettings';
import SNCTimer from './libs/SNCTimer';
// import setAvatar from './steam/set-avatar';
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
    time, user: { newName, personaName: oldName }, onload
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

    if (!cache.oldName) cache.oldName = oldName;

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

// This functions will be available in popup window
window.exports = {
    joinToGroup,
    changeName,
    activities: SNCTimer.activities
};

chrome.browserAction.setBadgeText({ text: '' });
