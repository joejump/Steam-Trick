import $ from 'jquery';
import OptionsSync from 'webext-options-sync';
import getWebApiKey from './steam/steam-web-api-key';
import { showError, openInNewTab } from './libs/utils';
import { checkAuth } from './steam/steam-utils';

// Check auth
checkAuth()
    .catch((e) => {
        showError(e);
        setTimeout(() => openInNewTab('https://steamcommunity.com/login'), 1000);
    });

$(document).ready(() => {
    const optionsSync = new OptionsSync();
    optionsSync.syncForm('#options-form');

    const hideFields = async () => {
        const options = await optionsSync.getAll();

        if (options.sourceType === 'json') {
            $('.apikey-block').show();
        } else {
            $('.apikey-block').hide();
        }
    };

    // Hide or show optional fields
    hideFields();
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (changes.options && areaName === 'sync') {
            hideFields();
        }
    });

    const setApiKey = async () => {
        const $keyField = $('#apikey');

        try {
            const key = await getWebApiKey();
            $keyField.val(key);
        } catch (e) {
            showError(e);
        }
        // FIXME: update value in storage
        optionsSync._handleFormUpdates({ target: $keyField[0] });
    };

    $('select[name="sourceType"]').change(function () {
        if (this.value === 'json') {
            setApiKey();
        }
    });

    $('#get-key').click((e) => {
        setApiKey();
        e.preventDefault();
    });
});
