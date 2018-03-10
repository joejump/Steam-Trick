import OptionsSync from 'webext-options-sync';
import { showError } from './libs/utils';

const optionsSync = new OptionsSync();
optionsSync.syncForm('#options-form');

const hide = (selector) => {
    document.querySelector(selector).style.display = 'none';
};
const show = (selector) => {
    document.querySelector(selector).style.display = 'initial';
};

const hideFields = async () => {
    const options = await optionsSync.getAll();

    if (options.sourceType === 'json') {
        show('#apikey-block');
    } else {
        hide('#apikey-block');
    }
};

// Hide or show optional fields
hideFields();
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.options && areaName === 'sync') {
        hideFields();
    }
});

document.querySelector('select[name="sourceType"]').addEventListener('change', function () {
    if (this.value === 'json') {
        chrome.permissions.request({
            origins: ['https://api.steampowered.com/*']
        }, (granted) => {
            if (!granted) { showError('You must allow it if you want to use JSON api'); }
        });
    }
});
