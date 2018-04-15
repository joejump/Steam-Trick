import OptionsSync from 'webext-options-sync';
import normalizeUrl from 'normalize-url';
import $ from 'jquery';
import { pushElement } from './storage';
import { isSteamGroup } from '../steam/steam-utils';
import { getUserData } from '../steam/user';
import {
    showError,
    showNotification,
    containsPermissions,
    permissionsRequest,
    checkFileAccess
} from './utils';

const contextMenus = [
    {
        id: 'group',
        title: chrome.i18n.getMessage('groupJoin'),
        contexts: ['selection', 'link']
    },
    {
        id: 'name',
        title: chrome.i18n.getMessage('nameChange'),
        contexts: ['selection']
    },
    {
        id: 'avatar',
        title: chrome.i18n.getMessage('avatarChange'),
        contexts: ['image', 'link']
    }
];

export const remove = () => {
    chrome.contextMenus.removeAll();
};

export const create = () => {
    // Log creation status
    const onCreated = () => {
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError}`);
        }
    };
    // Create the context menus
    contextMenus.forEach(contextMenu => chrome.contextMenus.create(contextMenu, onCreated));

    let lastTemplate = {};
    const saveTemplate = async (type, value) => {
        const { saveTemplateAsk } = await new OptionsSync().getAll();

        if (saveTemplateAsk) {
            lastTemplate = { type, value };
            showNotification(chrome.i18n.getMessage('saveQuestion'), 'save-template');
        }
    };
    // save template if user click on notification
    chrome.notifications.onClicked.addListener((notificationId) => {
        if (notificationId === 'save-template') {
            pushElement(`templates-${lastTemplate.type}`, lastTemplate.value);
        }
    });

    // background
    const { joinToGroup, changeName, setAvatar } = chrome.extension.getBackgroundPage().exports;

    const handleGroup = async (text, time, user) => {
        const url = normalizeUrl(text, { removeQueryParameters: [/[\s\S]+/i] });

        if (!isSteamGroup(url)) {
            throw new Error(chrome.i18n.getMessage('notGroup'));
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

        if (url.startsWith('file:///') && !await checkFileAccess()) {
            throw new Error('Access to File URLs is denied');
        }

        const blob = await $.ajax({
            url,
            cache: false,
            xhrFields: { responseType: 'blob' }
        });

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
