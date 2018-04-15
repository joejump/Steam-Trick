import $ from 'jquery';
import Clipboard from 'clipboard';
import normalizeUrl from 'normalize-url';
import OptionsSync from 'webext-options-sync';
import { getUserData } from './steam/user';
import { localizeHTML } from './libs/localization';
import { on as onMessage } from './libs/messaging';
import { parseDataFromHTML } from './steam/parser';
import parseTime from './libs/parse-time';
import { openInNewTab, showError } from './libs/utils';
import { checkAuth } from './steam/steam-utils';
import { pushElement, removeElement, getElement } from './libs/storage';
import { renderTemplates, renderDonateData, renderActivity } from './libs/html-templates';
import setAvatar from './steam/set-avatar';

const saveTemplate = (type, value) => pushElement(`templates-${type}`, value);
const removeTemplate = (type, index) => removeElement(`templates-${type}`, index);
const getTemplate = (type, index) => getElement(`templates-${type}`, index);

const fillPage = ({
    onlineState, personaName, stateMessage, id64, avatar
}) => {
    // class offline, online, in-game
    $('.user').addClass(onlineState);

    const $username = $('#username');
    if ($username.text(personaName).width() > 300) {
        $username.css('font-size', '18px');
    } else {
        $username.css('font-size', '25px');
    }

    $('.user .state-message').html(stateMessage);
    $('.user .id64 button').attr('data-clipboard-text', id64);
    $('.user .avatar img').attr('src', avatar);
};

const start = ({ user, options }) => {
    // background
    const {
        joinToGroup, changeName, activities
    } = chrome.extension.getBackgroundPage().exports;

    // ID64
    (new Clipboard('.id64 button')).on('success', (e) => {
        e.clearSelection();
    });

    // MAIN
    const btnShowLoading = $btn => $btn.prop('disabled', true).addClass('loading');
    const btnHideLoading = $btn => $btn.prop('disabled', false).removeClass('loading');

    // return 0 when we "hide" time
    const getTime = (fieldset) => {
        const time = $(`${fieldset} .time`).val();
        const hasTime = $(`${fieldset} .js-has-time`).is(':checked');

        return hasTime ? time : 0;
    };

    // Show formatted time
    $('.time').on('input', function () {
        $(this).siblings('.formatted-time').text(parseTime(this.value));
    });
    $('.time').trigger('input');

    // group-fieldset
    const $groupField = $('#group-fieldset .js-field');
    $('#group-fieldset button').click(async function () {
        const time = getTime('#group-fieldset');

        // validation
        if (
            !$groupField[0].reportValidity()
        ) { return; }

        const url = normalizeUrl($groupField.val(), { removeQueryParameters: [/[\s\S]+/i] });
        const $this = $(this);

        // will be executed after request
        const onload = (groupName) => {
            btnHideLoading($this);
            // save template
            if ($('#group-fieldset .js-save').is(':checked')) {
                saveTemplate('group', { groupName, url, time });
            }
        };

        try {
            btnShowLoading($this);
            await joinToGroup({
                time,
                url,
                user,
                onload
            });
        } catch (e) {
            showError(e);
            btnHideLoading($this);
        }
    });

    // name-fieldset
    const $nameField = $('#name-fieldset .js-field');
    const $nameFieldPlus = $('#name-fieldset .plus');
    const $username = $('#username');

    const deletePresentName = (value) => {
        const username = $username.text();
        return value.startsWith(username) ? value.slice(username.length + 1) : value;
    };

    $('#name-fieldset button').click(async function () {
        const time = getTime('#name-fieldset');

        // validation
        if (
            !$nameField[0].reportValidity()
        ) { return; }

        const newName = $nameField.val();
        const $this = $(this);

        // will be executed afrer request
        const onload = () => {
            btnHideLoading($this);

            // save template
            if ($('#name-fieldset .js-save').is(':checked')) {
                // we want to save only a "New Name"
                const str = deletePresentName(newName);
                const plus = $nameFieldPlus.is(':checked');

                saveTemplate('name', { name: str, time, plus });
            }
        };
        try {
            btnShowLoading($this);
            // change and update page
            const html = await changeName({
                user: {
                    newName,
                    personaName: $username.text()
                },
                time,
                onload
            });
            // update data on page
            const player = parseDataFromHTML(html);
            const nickname = player.personaName;

            fillPage(player);
            $username.text(nickname);
        } catch (e) {
            showError(e);
            btnHideLoading($this);
        }
    });
    $nameFieldPlus.change(() => {
        $nameField.val((i, value) =>
            ($nameFieldPlus.is(':checked') ? `${$username.text()} ${value}` : deletePresentName(value)));
    });
    $nameField.keyup(() => {
        $nameFieldPlus.prop('checked', $nameField.val().startsWith($username.text()));
    });


    // TEMPLATES
    const renderTemplatesPanel = async (type, data) => {
        $('#templates-panel .templates').html(await renderTemplates(type, data));
    };
    $('.tabs a[href^="#templates-"]')
        .click(function (e) {
            const type = this.hash.replace('#templates-', '');
            renderTemplatesPanel(type);

            e.preventDefault();
        });

    // If time is 0 we want to hide time input
    const setTime = (fieldset, time) => {
        const hasTime = time !== 0;

        $(`${fieldset} .js-has-time`).prop('checked', hasTime);
        $(`${fieldset} .time`).val(time);
    };

    const setNameTpl = ({ name, time, plus }) => {
        const username = !plus
            ? name
            : `${$username.text()} ${name}`;

        setTime('#name-fieldset', time);

        $nameField.val(username);
        $nameField.trigger('keyup');
    };
    const setGroupTpl = ({ url, time }) => {
        setTime('#group-fieldset', time);
        $groupField.val(url);
    };
    const setAvatarTpl = async (tpl) => {
        const { medium } = await setAvatar(tpl);
        $('.user .avatar img').attr('src', medium);
    };

    // fill inputs
    $('#templates-panel').on('click', '.item', async function () {
        const type = $(this).parents('.js-template').data('type');
        const index = (type === 'avatar') ? $(this).index() : $(this).index() - 1;

        const tpl = await getTemplate(type, index);

        if (type === 'name') { setNameTpl(tpl); }
        if (type === 'group') { setGroupTpl(tpl); }
        if (type === 'avatar') { setAvatarTpl(tpl); }

        if (options.quickSet) {
            $(`#${type}-fieldset button`).trigger('click');
        }

        // open main panel
        $('a[href="#main-panel"]').trigger('click');
        $(`#${type}-fieldset .js-save`).prop('checked', false);
    });

    $('#templates-panel .templates').on('click', '.remove', async function (e) {
        e.stopPropagation();

        const type = $(this).parents('.js-template').data('type');
        const $item = $(this).parent('.item');
        const index = (type === 'avatar') ? $item.index() : $item.index() - 1;

        await removeTemplate(type, index);
        renderTemplatesPanel(type);
    });


    // DONATE
    const playAudio = (src, volume) => {
        const audio = new Audio(src);
        audio.volume = volume / 100;
        audio.play();
    };

    let loaded = false;
    $('.tabs a[href="#donate-panel"]').click(async () => {
        if (!loaded) {
            loaded = true;
            playAudio('../audio/1.mp3', options.audioVolume);

            const { users, referrals } = await renderDonateData();
            $('#donate-panel .donators ul').html(users);
            $('#donate-panel .donate .referrals').append(referrals);
        }
    });

    $('#donate-panel .cash li a').click((e) => {
        e.preventDefault();

        setTimeout(() => openInNewTab('https://goo.gl/xKtbiU'), 2500);
        playAudio('../audio/2.mp3', options.audioVolume);
    });

    (new Clipboard('.share a[data-clipboard-text]')).on('success', (e) => {
        e.clearSelection();
    });

    // ACTIVITIES
    const $activitiesList = $('#activities-list');
    const renderActivities = () => {
        const { cache } = renderActivities;

        $.each(activities, (i, activity) => {
            const {
                timer,
                seconds,
                oldName,
                timer: { id }
            } = activity;

            if (cache[id]) {
                cache[id].children('.time').text(`${seconds}s`);
            } else {
                if (oldName) {
                    $username.text(oldName);
                }

                const $li = $(renderActivity(activity));
                $li.data('id', id);

                cache[id] = $li;
                $activitiesList.append($li);

                // delete if expired
                timer.onFinish(() => {
                    cache[id].remove();
                    delete cache[id];

                    if ($.isEmptyObject(cache)) {
                        $('.tabs').removeClass('activities');
                    }
                });
                // show activities tab
                $('.tabs').addClass('activities');
            }
        });
    };
    renderActivities.cache = {};

    onMessage((message) => {
        if (message.type === 'activities-list') {
            renderActivities();
        }
    });
    $activitiesList.on('click', 'li .finish', function () {
        const id = $(this).parent().data('id');
        activities[id].timer.finish();
    });
    $activitiesList.on('click', 'li .add', function () {
        const id = $(this).parent().data('id');
        activities[id].timer.addMoreTime(10);
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

const getData = async () => {
    const waitDocument = () => new Promise(resolve => $(resolve));
    let user;

    try {
        await checkAuth();
    } catch (e) {
        showError(e);
        setTimeout(() => openInNewTab('https://steamcommunity.com/login'), 1000);
    }

    const options = await new OptionsSync().getAll();

    try {
        user = await getUserData(options.sourceType, options.apikey);
    } catch (e) {
        showError(e);
    }

    await waitDocument();

    // localize HTML
    localizeHTML($('#unlocalizedPage').text(), 'body');
    // fill page with data
    fillPage(user);
    // hide animation
    $('body').addClass('loaded');

    $('input[type="range"].time').prop('max', options.popupMaxRangeTime || 1800);

    return { user, options };
};
getData().then(start);
