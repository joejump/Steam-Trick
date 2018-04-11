import $ from 'jquery';
import OptionsSync from 'webext-options-sync';
import getWebApiKey from './steam/steam-web-api-key';
import { showError, showNotification } from './libs/utils';
import { create as createContextMenu, remove as removeContextMenus } from './libs/context-menus';

// TODO: check auth
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

        if (options.contextMenu) {
            $('.context-menu-template').show();
        } else {
            $('.context-menu-template').hide();
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

    $('input[name="contextMenu"]').change(function () {
        if (this.checked) {
            createContextMenu();
        } else {
            removeContextMenus();
        }
        showNotification('You may need to restart your browser');
    });

    $('#get-key').click((e) => {
        setApiKey();
        e.preventDefault();
    });
});
