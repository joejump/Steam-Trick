import $ from 'jquery';
import Clipboard from 'clipboard';
import normalizeUrl from 'normalize-url';
import OptionsSync from 'webext-options-sync';
import { getNotificationCounts, getUserData } from './steam/user';
import { openInNewTab } from './libs/utils';
import { localizeHTML } from './libs/localization';
import { pushElement, removeElement, getElement } from './libs/storage';
import { renderTemplatesTable, renderDonatePanel } from './libs/html-templates';
import { on as onMessage } from './libs/messaging';
// import parseTime from './libs/parse-time';

const saveTemplate = (type, value) => pushElement(`templates-${type}`, value);
const removeTemplate = (type, index) => removeElement(`templates-${type}`, index);
const getTemplate = (type, index) => getElement(`templates-${type}`, index);

// TODO click on file input

const start = (user, options) => {
    const {
        joinToGroup, changeName, actionsList // , changeAvatar
    } = chrome.extension.getBackgroundPage().exports;

    const audioVolume = options.audioVolume / 100;

    onMessage((message) => {
        if (message.type === 'actions-list-updated') {
            console.log(actionsList);
            // TODO list
        }
    });

    const btnShowLoading = ($btn) => {
        $btn.prop('disabled', true)
            .addClass('btn-loading');
    };

    const btnHideLoading = ($btn) => {
        $btn.prop('disabled', false)
            .removeClass('btn-loading');
    };

    // let imageFile = null;
    // const uploadImage = async () => {
    //     if (imageFile) {
    //         const $image = $('.user .avatar img, .preview');
    //         const $btn = $('#image-fieldset button');

    //         $image.attr('src', '/img/loading.gif');
    //         btnShowLoading($btn);

    //         const images = await changeAvatar({
    //             blob: imageFile,
    //             user,
    //             onload: () => btnHideLoading($btn)
    //         });
    //         $image.attr('src', images.medium);

    //         // save template
    //         if ($('#image-fieldset .js-save').is(':checked')) {
    //             saveTemplate('image', { blob: imageFile });
    //         }
    //     }
    // };

    // $('#image-fieldset button').click(uploadImage);
    // $('#image-fieldset input[type="file"]').change(function () {
    //     [imageFile] = this.files;
    //     $('.preview').attr('src', URL.createObjectURL(imageFile));

    //     if (true) {
    //         uploadImage();
    //     }
    // });
    const getTime = (selector) => {
        const time = $(`${selector} input[type=time]`).get(0).valueAsNumber / 1000;
        return $(`${selector} .js-has-time`).is(':checked') ? time : 0;
    };
    const checkTime = (selector, time) => {
        if (Number.isNaN(time) || (time < 10 && time !== 0)) {
            const input = $(`${selector} input[type=time]`)[0];
            input.reportValidity();
            return false;
        }
        return true;
    };

    $('#group-fieldset button').click(async function () {
        const $field = $('#group-fieldset .js-field');
        const url = normalizeUrl($field.val(), { removeQueryParameters: [/[\s\S]+/i] });
        const time = getTime('#group-fieldset');

        if (checkTime('#group-fieldset', time) && $field[0].reportValidity()) {
            // save template
            if ($('#group-fieldset .js-save').is(':checked')) {
                saveTemplate('group', { url, time });
            }

            const $this = $(this);
            btnShowLoading($this);
            await joinToGroup({
                time,
                url,
                user,
                onload: () => {
                    btnHideLoading($this);
                }
            });
        }
    });

    $('#name-fieldset button').click(async function () {
        const andNew = $('#name-fieldset .js-add-old-name').is(':checked');
        const time = getTime('#name-fieldset');
        const $field = $('#name-fieldset .js-field');

        if (checkTime('#name-fieldset', time) && $field[0].reportValidity()) {
            const name = $field.val();

            // save template
            if ($('#name-fieldset .js-save').is(':checked')) {
                saveTemplate('name', { name, time, andNew });
            }

            // TODO
            const newName = andNew ? `${user.personaName} ${name}` : name;
            const $this = $(this);
            btnShowLoading($this);
            await changeName({
                time,
                user,
                newName,
                onload: () => btnHideLoading($this)
            });
        }
    });

    // If time is 0 we want to hide time input
    const setTime = (element, time) => {
        $(`${element} .js-has-time`).prop('checked', time !== 0);
        $(`${element} input[type=time]`).get(0).valueAsNumber = time * 1000;
    };

    const setNameTpl = ({ name, time, andNew }) => {
        setTime('#name-fieldset', time);
        $('#name-fieldset .js-add-old-name').prop('checked', andNew);
        $('#name-fieldset .js-field').val(name);
    };

    const setGroupTpl = ({ url, time }) => {
        setTime('#group-fieldset', time);
        $('#group-fieldset .js-field').val(url);
    };

    // const setImageTpl = ({ blob }) => {
    //     imageFile = blob;
    //     $('.preview').attr('src', URL.createObjectURL(imageFile));
    // };

    // fill inputs
    $('#templates-panel').on('click', '.name tr, .group tr', async function () {
        const type = $(this).parents('.templates table').attr('class');
        const index = $(this).index() - 1;
        const tpl = await getTemplate(type, index);

        if (type === 'name') { setNameTpl(tpl); }
        if (type === 'group') { setGroupTpl(tpl); }
        // if (type === 'image') { setImageTpl(tpl); }
        $('a[href="#main-panel"]').trigger('click');
    });

    const clipboard = new Clipboard('.id64 button');

    clipboard.on('success', (e) => {
        console.info('Action:', e.action);
        console.info('Text:', e.text);
        console.info('Trigger:', e.trigger);

        e.clearSelection();
    });

    clipboard.on('error', (e) => {
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
    });

    const playAudio = (src, volume) => {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play();
    };

    $('.tabs a[href="#donate-panel"]').click(renderDonatePanel);

    $('.show-donation-list').click(function () {
        $('#donate, .best-donator').add(this).hide();
        $('.donation-list, .donation-list + .remove').fadeIn(500);
    });

    $('.donation-list + .remove').click(function () {
        $('.donation-list').add(this).hide();
        $('#donate, .best-donator, .show-donation-list').fadeIn(500);
    });

    $('#donate-panel #donate').click((e) => {
        playAudio('audio/2.mp3', audioVolume);
        setTimeout(() => openInNewTab('https://goo.gl/xKtbiU'), 2500);
        e.preventDefault();
    });

    const renderTemplatesPanel = async (type) => {
        $('#templates-panel .templates').html(await renderTemplatesTable(type));
    };
    $('.tabs a[href="#templates-name"], .tabs a[href="#templates-group"]')
        .click(function (e) {
            const type = this.hash.replace('#templates-', '');
            renderTemplatesPanel(type);
            e.preventDefault();
        });
    $('#templates-panel .templates').on('click', '.remove', async function (e) {
        e.stopPropagation();
        const index = $(this).parent('tr').index() - 1;
        const type = $(this).parents('.templates table').attr('class');

        const templates = await removeTemplate(type, index);
        renderTemplatesPanel(type, templates);
    });

    // Tabs
    $('.tab').click(function (e) {
        // If we have sub-tabs and don't click on them
        if ($('.sub', this).length && !$(e.target).parents('.sub').length) { return; }

        $('.tab, .panel').removeClass('active');
        $(this).add($('a[href]', this)[0].hash).addClass('active');

        e.stopImmediatePropagation();
        e.preventDefault();
    });
};

const fillPage = (user) => {
    // class offline, online, in-game
    $('.user').addClass(user.onlineState);

    const $username = $('.user .username');
    if ($username.text(user.personaName).width() > 400) {
        $username.css('font-size', '18px');
    }

    $('.user .state-message').html(user.stateMessage);
    $('.user .id64 button').attr('data-clipboard-text', user.id64);
    $('.user .avatar img, .preview').attr('src', user.avatar);
};

const waitDocument = () => new Promise(resolve => $(resolve));

// Get data and to start an application
getNotificationCounts()

    // TODO: firefox sync storage error
    .then(() => Promise.all([getUserData(), /* new OptionsSync().getAll(), */waitDocument()]))
    .then(([user, options]) => {
        localizeHTML(document.getElementById('unlocalizedPage').textContent, 'body');
        // fill page with data
        fillPage(user);

        // hide animation
        $('body').addClass('loaded');

        start(user, options);
    })
    .catch((error) => {
        if (error.statusText === 'Unauthorized') {
            openInNewTab('https://steamcommunity.com/login');
        }
    });

// window.fillTemplates = () => {
//     const getRandomStr = (len) => {
//         let text = '';
//         const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//         for (let i = 0; i < len; i += 1) {
//             text += possible.charAt(Math.floor(Math.random() * possible.length));
//         }
//         return text;
//     };
//     const getRandomNumb = max => ~~(Math.random() * max);

//     saveTemplate('name', {
//         name: getRandomStr(getRandomNumb(32)),
//         time: getRandomNumb(3540),
//         andNew: !getRandomNumb(1)
//     });

//     saveTemplate('group', {
//         url: getRandomStr(getRandomNumb(32)),
//         time: getRandomNumb(2000)
//     });

//     // fetch('/img/128.png')
//     //     .then(res => res.blob())
//     //     .then((blob) => {
//     //         saveTemplate('image', {
//     //             blob
//     //         });
//     //     });
// };
