import $ from 'jquery';
import localForege from 'localforage';
import parseTime from './parse-time';

const getTime = time => (time !== 0 ? parseTime(time) : '—');

export const renderTemplatesTable = async (type, data) => {
    const templates = data || await localForege.getItem(`templates-${type}`);
    if (templates === null) { return '<div class="empty">storage is empty</div>'; }

    const removing = '<td class="remove">&#x2716;</td>';
    let table = '';
    let iterate;
    if (type === 'name') {
        table += '<tr><th>Name</th><th class="time">Time</th><th class="symbol">+</th><th class="symbol">&#x2716;</th></tr>';
        iterate = ({ name, plus, time }) => {
            table += `<tr><td>${name}</td><td>${getTime(time)}</td><td>${plus ? '+' : '—'}</td>${removing}</tr>`;
        };
    } else if (type === 'group') {
        table += '<tr><th>Name(URL)</th><th class="time">Time</th><th class="symbol">&#x2716;</th></tr>';
        iterate = ({ url, groupName, time }) => {
            table += `<tr><td title="${url}">${groupName}</td><td>${getTime(time)}</td>${removing}</tr>`;
        };
    }

    templates.forEach(iterate);
    return `<table class="${type}">${table}</table>`;
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
        li = `<li class="type-group">
                    <img class="icon" src=${activitie.avatarIcon}>                   
                    <span class="name">${activitie.groupName}</span>
                    ${template}
                </li>`;
    }
    return li;
};
