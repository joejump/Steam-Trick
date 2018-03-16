import $ from 'jquery';
import Clipboard from 'clipboard';
import normalizeUrl from 'normalize-url';
import OptionsSync from 'webext-options-sync';
import { getNotificationCounts, getUserData } from './steam/user';
import { localizeHTML } from './libs/localization';
import { on as onMessage } from './libs/messaging';
import { parseDataFromHTML } from './steam/parser';
import { openInNewTab, showError } from './libs/utils';
import { pushElement, removeElement, getElement } from './libs/storage';
import { renderTemplatesTable, renderDonateData, renderActivity } from './libs/html-templates';

const saveTemplate = (type, value) => pushElement(`templates-${type}`, value);
const removeTemplate = (type, index) => removeElement(`templates-${type}`, index);
const getTemplate = (type, index) => getElement(`templates-${type}`, index);

const fillPage = (user) => {
    // class offline, online, in-game
    $('.user').addClass(user.onlineState);

    const $username = $('.user .username');
    if ($username.text(user.personaName).width() > 300) {
        $username.css('font-size', '18px');
    } else {
        $username.css('font-size', '25px');
    }

    $('.user .state-message').html(user.stateMessage);
    $('.user .id64 button').attr('data-clipboard-text', user.id64);
    $('.user .avatar img, .preview').attr('src', user.avatar);
};

const start = ({ user, options }) => {
    // background
    const {
        joinToGroup, changeName, activities
    } = chrome.extension.getBackgroundPage().exports;

    // options
    const audioVolume = options.audioVolume / 100;

    let { personaName } = user;

    // ID64
    (new Clipboard('.id64 button')).on('success', (e) => {
        e.clearSelection();
    });

    // MAIN
    const btnShowLoading = $btn => $btn.prop('disabled', true).addClass('loading');
    const btnHideLoading = $btn => $btn.prop('disabled', false).removeClass('loading');

    const getTime = (fieldset) => {
        const time = $(`${fieldset} input[type=time]`)[0].valueAsNumber / 1000;
        const hasTime = $(`${fieldset} .js-has-time`).is(':checked');
        return hasTime ? time : 0;
    };

    // Valid time is 0 or greater 10
    const checkTime = (selector, time) => {
        if (Number.isNaN(time) || (time < 10 && time !== 0)) {
            $(selector)[0].reportValidity();
            return false;
        }
        return true;
    };

    // group-fieldset
    const $groupField = $('#group-fieldset .js-field');
    $('#group-fieldset button').click(function () {
        const time = getTime('#group-fieldset');

        if (
            checkTime('#group-fieldset input[type=time]', time) &&
            $groupField[0].reportValidity()
        ) {
            const url = normalizeUrl($groupField.val(), { removeQueryParameters: [/[\s\S]+/i] });
            const $this = $(this);

            btnShowLoading($this);
            joinToGroup({
                time, url, user, onload: () => btnHideLoading($this)
            });

            // save template
            if ($('#group-fieldset .js-save').is(':checked')) {
                saveTemplate('group', { url, time });
            }
        }
    });

    // name-fieldset
    const $plus = $('#name-fieldset .plus');
    const $nameField = $('#name-fieldset .js-field');
    const deletePresentName = value =>
        (value.startsWith(personaName) ? value.slice(personaName.length + 1) : value);

    $('#name-fieldset button').click(async function () {
        const time = getTime('#name-fieldset');

        if (
            checkTime('#name-fieldset input[type=time]', time) &&
            $nameField[0].reportValidity()
        ) {
            const newName = $nameField.val();
            const $this = $(this);

            // save template
            if ($('#name-fieldset .js-save').is(':checked')) {
                // we want to save only a "New Name"
                const str = deletePresentName(newName);
                const plus = $plus.is(':checked');

                saveTemplate('name', { name: str, time, plus });
            }

            btnShowLoading($this);
            // change and update page
            const html = await changeName({
                user: {
                    newName,
                    personaName
                },
                time,
                onload: (data) => {
                    btnHideLoading($this);
                    fillPage(parseDataFromHTML(data));
                }
            });
            const player = parseDataFromHTML(html);
            const nickname = player.personaName;

            fillPage(player);
            personaName = nickname;
        }
    });
    $plus.change(() => {
        $nameField.val((i, value) =>
            ($plus.is(':checked') ? `${personaName} ${value}` : deletePresentName(value)));
    });
    $nameField.keyup(() => {
        $plus.prop('checked', $nameField.val().startsWith(personaName));
    });


    // TEMPLATES
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
    // If time is 0 we want to hide time input
    const setTime = (fieldset, time) => {
        $(`${fieldset} .js-has-time`).prop('checked', time !== 0);
        $(`${fieldset} input[type=time]`)[0].valueAsNumber = time * 1000;
    };

    const setNameTpl = ({ name, time, plus }) => {
        setTime('#name-fieldset', time);
        $nameField.val(!plus ? name : `${personaName} ${name}`);
        $nameField.trigger('keyup');
    };
    const setGroupTpl = ({ url, time }) => {
        setTime('#group-fieldset', time);
        $groupField.val(url);
    };
    // fill inputs
    $('#templates-panel').on('click', '.name tr, .group tr', async function () {
        const type = $(this).parents('.templates table').attr('class');
        const index = $(this).index() - 1;
        const tpl = await getTemplate(type, index);

        if (type === 'name') { setNameTpl(tpl); }
        if (type === 'group') { setGroupTpl(tpl); }
        $('a[href="#main-panel"]').trigger('click');
    });


    // DONATE
    const playAudio = (src, volume) => {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play();
    };

    let loaded = false;
    $('.tabs a[href="#donate-panel"]').click(async () => {
        if (!loaded) {
            loaded = true;
            playAudio('../audio/1.mp3', audioVolume);
            const data = await renderDonateData();
            $('#donate-panel .donators ul').html(data.users);
            $('#donate-panel .donate .referrals').append(data.referrals);
        }
    });

    $('#donate-panel .cash li a').click(() => {
        playAudio('../audio/2.mp3', audioVolume);
        setTimeout(() => openInNewTab('https://goo.gl/xKtbiU'), 2500);
    });

    (new Clipboard('.share a[data-clipboard-text]')).on('success', (e) => {
        e.clearSelection();
    });

    // ACTIVITIES
    const $activitiesList = $('#activities-list');
    const renderActivities = () => {
        const { cache } = renderActivities;

        activities.forEach((activity) => {
            if (cache[activity.timer.id]) {
                cache[activity.timer.id].children('.time').text(`${activity.seconds}s`);
            } else {
                const $li = $(renderActivity(activity));
                cache[activity.timer.id] = $li;
                $activitiesList.append($li);

                // delete if expired
                activity.timer.onFinish(() => {
                    cache[activity.timer.id].remove();
                    delete cache[activity.timer.id];
                });
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
        const index = $(this).parent().index();
        activities[index].timer.finish();
    });
    $activitiesList.on('click', 'li .add', function () {
        const index = $(this).parent().index();
        activities[index].timer.addMoreTime(10);
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
        await getNotificationCounts();
    } catch (e) {
        if (e.statusText === 'Unauthorized') { openInNewTab('https://steamcommunity.com/login'); }
    }

    const options = await new OptionsSync().getAll();

    try {
        user = await getUserData(options.sourceType, options.apikey);
    } catch (e) {
        showError('Error while fetching user data');
    }

    await waitDocument();
    localizeHTML(document.getElementById('unlocalizedPage').textContent, 'body');
    // fill page with data
    fillPage(user);
    // hide animation
    $('body').addClass('loaded');

    return { user, options };
};
getData().then(start);
