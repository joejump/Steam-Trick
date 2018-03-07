import localForege from 'localforage';
import parseTime from './parse-time';

const REMOVE_SYMBOL = '&#x2716;';

export const renderTemplatesTable = async (type, data) => {
    const templates = data || await localForege.getItem(`templates-${type}`);
    if (templates === null) { return '<div>table is empty</div>'; }

    const removing = `<td class="remove">${REMOVE_SYMBOL}</td>`;
    let table = '';
    let iterate;
    if (type === 'name') {
        table += `<tr><th>Name</th><th class="time">Time</th><th class="symbol">+</th><th class="symbol">${REMOVE_SYMBOL}</th></tr>`;
        iterate = ({ name, time, andNew }) => {
            table += `<tr><td>${name}</td><td>${parseTime(time)}</td><td>${andNew ? '+' : '-'}</td>${removing}</tr>`;
        };
    } else if (type === 'group') {
        table += `<tr><th>Name(URL)</th><th class="time">Time</th><th class="symbol">${REMOVE_SYMBOL}</th></tr>`;
        iterate = ({ url, time }) => {
            table += `<tr><td>${url}</td><td>${parseTime(time)}</td>${removing}</tr>`;
        };
    }

    // else if (type === 'image') {
    //     table += `<tr><th>Image</th><th>Name</th>
    //               <th>Size</th><th class="symbol">${REMOVE_SYMBOL}</th></tr>`;
    //     iterate = ({ blob }) => {
    //         const src = URL.createObjectURL(blob);
    //         const { name, size } = blob;
    //         table += `<tr><td><img src=${src}></td><td>${name}</td>
    //                       <td>${size / 1000}kb</td>${removing}</tr>`;
    //     };
    // }

    templates.forEach(iterate);
    return `<table class="${type}">${table}</table>`;
};

// let loaded = false;
export const renderDonatePanel = () => {
    // if (!loaded) {
    //     loaded = true;
    //     //playAudio('audio/1.mp3', 1);

    //     $.getJSON('https://www.jasonbase.com/things/x34M', (data) => {
    //         const link = `${STEAM_URL}profiles/`;
    //         const frag = document.createDocumentFragment();

    //         data.users.sort((a, b) => (+a.cost < +b.cost ? 1 : -1));
    //         data.users.forEach((user, i) => {
    //             const li = document.createElement('li');
    //             li.innerHTML = `<a href="${link + user.id64}" target="_blank">`
    //                 + `<img src="${user.img}">`
    //                 + `<span class="name">${user.name}</span>`
    //                 + `<span class="money">${`$${user.cost}`}</span></a>`;
    //             li.classList.add('underline');
    //             frag.appendChild(li);
    //         });
    //         $('.donation-list').append(frag);

    //         // the best donator
    //         const user = data.users[0];
    //         const $donator = $('.best-donator');
    //         $donator.children('.name').text(user.name);
    //         $donator.children('.money').text(`$${user.cost}`);
    //         $donator.children('img').attr('src', user.img);
    //         $donator.attr('href', link + user.id64);
    //     });
    // }
};
