import $ from 'jquery';
import localForege from 'localforage';
import parseTime from './parse-time';

const getTime = time => (time !== 0 ? parseTime(time) : '—');

export const renderTemplates = async (type, data) => {
    const templates = data || await localForege.getItem(`templates-${type}`) || [];

    if (templates.length > 0) {
        const removing = '<td class="remove">&#x2716;</td>';

        if (type === 'name') {
            const th = '<tr><th>Name</th><th class="time">Time</th><th class="symbol">+</th><th class="symbol">&#x2716;</th></tr>';
            const td = templates.reduce((prev, { name, plus, time }) =>
                `${prev}<tr class="item">
                    <td title="${name}">${name}</td>
                    <td>${getTime(time)}</td>
                    <td>${plus ? '+' : '—'}</td>
                    <td class="remove">&#x2716;</td>
                </tr>`, '');

            return `<table class="js-template name" data-type="name">${th}${td}</table>`;
        }

        if (type === 'group') {
            const th = '<tr><th>Name(URL)</th><th class="time">Time</th><th class="symbol">&#x2716;</th></tr>';
            const td = templates.reduce((prev, { url, groupName, time }) =>
                `${prev}<tr class="item"><td title="${url}">${groupName}</td><td>${getTime(time)}</td>${removing}</tr>`, '');

            return `<table class="js-template group" data-type="group">${th}${td}</table>`;
        }

        if (type === 'avatar') {
            const images = templates.reduce((prev, { blob }) => {
                const avatar = URL.createObjectURL(blob);

                return `${prev}<div class="item" title="Click to set.">
                    <img src="${avatar}">
                    <span class="remove">&#x2716;</span>
                </div>`;
            }, '');
            return `<div class="js-template avatar" data-type="avatar">${images}</div>`;
        }
    }

    return '<div class="empty">storage is empty</div>';
};

export const renderDonateData = async () => {
    const data = await $.getJSON('https://www.jasonbase.com/things/x34M');
    data.users.sort((a, b) => (+a.cost < +b.cost ? 1 : -1));

    const users = data.users.reduce((prev, user) => {
        const img = `<img src="${user.img}">`;
        const name = `<span class="name">${user.name}</span>`;
        const cost = `<span class="money">$${user.cost}</span></a>`;
        const href = `https://steamcommunity.com/profiles/${user.id64}`;

        const link = `<a href="${href}" target="_blank">${img}${name}${cost}</a>`;
        return `${prev}<li>${link}</li>`;
    }, '');

    const referrals = data.referrals.reduce((prev, { refLink, site }) => {
        const link = `<a href="${refLink}" target="_blank">${site}</a>`;
        return `${prev}<li>${link}</li>`;
    }, '');
    return { users, referrals };
};

export const renderActivity = (activitie) => {
    let li = '';
    const template = `<span class="add">+10</span>
                      <span class="time">${activitie.seconds}s</span>
                      <span class="finish">&#x2716;</span>`;

    if (activitie.type === 'name') {
        li = `<li class="type-name">
                    <span class="name">${activitie.newName}</span>
                    ${template}
                </li>`;
    }

    if (activitie.type === 'group') {
        const { avatarIcon, groupURL, groupName } = activitie;

        li = `<li class="type-group">
                    <img class="icon" src=${avatarIcon}>                   
                    <a href="${groupURL}" target="_blank" class="name">${groupName}</a>
                    ${template}
                </li>`;
    }
    return li;
};
