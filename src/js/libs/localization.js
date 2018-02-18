import $ from 'jquery';

export const getMessage = (msg) => {
    const string = chrome.i18n.getMessage(msg);

    if (string === '') {
        throw new Error(`No Message found for ${msg} in locales`);
    }

    return string;
};

export const localizeHTML = (textHTML, appendTo) => {
    // Localize by replacing __MSG_***__ meta tags
    const localizedHTML = textHTML.replace(/__MSG_(\w+)__/g, (match, v1) => (v1 ? getMessage(v1) : ''));

    if (localizedHTML !== textHTML) { $(appendTo).append(localizedHTML); }
};
