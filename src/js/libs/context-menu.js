import OptionsSync from 'webext-options-sync';
import normalizeUrl from 'normalize-url';
import api from './api';
import { showError, containsPermissions, permissionsRequest } from './utils';
import { pushElement } from './storage';
import { isSteamGroup } from '../steam/steam-utils';
import { getUserData } from '../steam/user';

const saveTemplate = (type, value) => {
    if (window.confirm('Do you want to save template?')) {
        pushElement(`templates-${type}`, value);
    }
};

export default () => {
    // background
    const { joinToGroup, setAvatar } = window.exports;

    // Log creation status
    const onCreated = () => {
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError}`);
        }
    };

    // Create the context menu item.
    chrome.contextMenus.create({
        id: 'group',
        title: 'Join to group',
        contexts: ['selection', 'link']
    }, onCreated);

    chrome.contextMenus.create({
        id: 'avatar',
        title: 'Change avatar',
        contexts: ['image', 'link']
    }, onCreated);

    // Add click event
    chrome.contextMenus.onClicked.addListener(async ({
        menuItemId, linkUrl, srcUrl, selectionText
    }) => {
        try {
            const options = await new OptionsSync().getAll();

            if (menuItemId === 'group') {
                const text = selectionText || linkUrl;
                const url = normalizeUrl(text, { removeQueryParameters: [/[\s\S]+/i] });

                if (!isSteamGroup(url)) {
                    throw new Error('Not a steam group');
                }

                const user = await getUserData(options.sourceType, options.apikey);
                const time = options['context-template-group-time'];

                const onload = (groupName) => {
                    // save template
                    saveTemplate('group', { groupName, url, time });
                };

                await joinToGroup({
                    url,
                    time,
                    user,
                    onload
                });
            }

            if (menuItemId === 'avatar') {
                try {
                    await containsPermissions({
                        origins: ['<all_urls>']
                    });
                } catch (e) {
                    await permissionsRequest({
                        origins: ['<all_urls>']
                    });
                }
                const blob = await api.get(srcUrl).then(body => body.blob());

                await setAvatar({ blob });
                saveTemplate('avatar', { blob });
            }
        } catch (e) {
            showError(e);
        }
    });
};
