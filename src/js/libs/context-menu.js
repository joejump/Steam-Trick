import OptionsSync from 'webext-options-sync';
import normalizeUrl from 'normalize-url';
import api from './api';
import { showError, containsPermissions, permissionsRequest } from './utils';
import { pushElement } from './storage';
import { isSteamGroup } from '../steam/steam-utils';
import { getUserData } from '../steam/user';

const saveTemplate = async (type, value) => {
    const { saveTemplateAsk } = await new OptionsSync().getAll();
    if (saveTemplateAsk && window.confirm('Do you want to save template?')) {
        pushElement(`templates-${type}`, value);
    }
};

export default () => {
    // background
    const { joinToGroup, changeName, setAvatar } = window.exports;

    // Log creation status
    const onCreated = () => {
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError}`);
        }
    };

    // Create the context menu item.
    chrome.contextMenus.create({
        id: 'group',
        title: 'Join To Group',
        contexts: ['selection', 'link']
    }, onCreated);

    chrome.contextMenus.create({
        id: 'name',
        title: 'Change Profile Name',
        contexts: ['selection']
    }, onCreated);

    chrome.contextMenus.create({
        id: 'avatar',
        title: 'Change Avatar',
        contexts: ['image', 'link']
    }, onCreated);

    const handleGroup = async (text, time, user) => {
        const url = normalizeUrl(text, { removeQueryParameters: [/[\s\S]+/i] });

        if (!isSteamGroup(url)) {
            throw new Error('Not a steam group');
        }

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
    };

    const handleAvatar = async (url) => {
        try {
            await containsPermissions({
                origins: ['<all_urls>']
            });
        } catch (e) {
            await permissionsRequest({
                origins: ['<all_urls>']
            });
        }
        const blob = await api.get(url).then(body => body.blob());

        await setAvatar({ blob });
        saveTemplate('avatar', { blob });
    };

    const handleName = async (name, time, user, plus) => {
        const newName = plus ? `${user.personaName} ${name}` : name;

        const onload = () => {
            saveTemplate('name', { name, time, plus });
        };

        if (newName.length < 2 || newName.length > 32) {
            throw new Error(chrome.i18n.getMessage('Namelength'));
        }

        await changeName({
            user: {
                newName,
                personaName: user.personaName
            },
            time,
            onload
        });
    };

    // Add click event
    chrome.contextMenus.onClicked.addListener(async ({
        menuItemId, linkUrl, srcUrl, selectionText
    }) => {
        try {
            if (menuItemId === 'name' || menuItemId === 'group') {
                const options = await new OptionsSync().getAll();
                const user = await getUserData(options.sourceType, options.apikey);

                if (menuItemId === 'group') {
                    const time = options['context-template-group-time'];

                    await handleGroup((selectionText || linkUrl), time, user);
                } else if (menuItemId === 'name') {
                    const time = options['context-template-name-time'];
                    const plus = options['context-template-name-plus'];

                    await handleName(selectionText, time, user, plus);
                }
            }

            if (menuItemId === 'avatar') {
                const url = srcUrl || linkUrl;
                await handleAvatar(url);
            }
        } catch (e) {
            showError(e);
        }
    });
};
