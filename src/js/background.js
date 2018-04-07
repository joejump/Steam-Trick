import OptionsSync from 'webext-options-sync';
import SteamGroup from './steam/SteamGroup';
import SteamSettings from './steam/SteamSettings';
import SNCTimer from './libs/SNCTimer';
import { showNotification } from './libs/utils';
import { pushElement } from './libs/storage';
import createContextMenu from './libs/context-menu';
import setAvatar from './steam/set-avatar';

// defaults options
new OptionsSync().define({
    defaults: {
        audioVolume: '40',
        sourceType: 'xml',
        quickSet: false,
        contextMenu: true,

        'context-template-group-time': 0,
        saveTemplateAsk: true
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
    setAvatar,
    activities: SNCTimer.activities
};


const initContextMenu = async () => {
    const { contextMenu } = await new OptionsSync().getAll();
    if (!contextMenu) { return; }

    createContextMenu();
};

initContextMenu();

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
    if (details.reason === 'update') {
        const thisVersion = chrome.runtime.getManifest().version;
        showNotification(`Updated from ${details.previousVersion} to ${thisVersion}!`);

        // compatibility with previous version
        if (details.previousVersion === '1.2.0.2') {
            chrome.storage.local.get(({ templates }) => {
                templates.forEach((template) => {
                    const { type } = template;
                    const time = (template.time === null) ? 0 : template.time;

                    if (template.type === 'name') {
                        const { newName: name, myAndNew: plus } = template;

                        pushElement(`templates-${type}`, {
                            name,
                            time,
                            plus
                        });
                    }
                    if (template.type === 'group') {
                        const { url: groupName, url } = template;

                        pushElement(`templates-${type}`, {
                            groupName,
                            time,
                            url: `https://steamcommunity.com/groups/${url}`
                        });
                    }
                });
            });
        }
    }
});

chrome.browserAction.setBadgeText({ text: '' });
