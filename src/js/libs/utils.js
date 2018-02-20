// Details to identify the cookie being retrieved.
export const getCookie = details =>
    new Promise((resolve, reject) => {
        chrome.cookies.get(details, cookie => (
            (cookie !== null) ? resolve(cookie) : reject(new Error('We don\'t have a cookie'))
        ));
    });
export const showError = (text) => {
    chrome.notifications.create({
        type: 'basic', iconUrl: 'img/128.png', title: 'error', message: text.trim()
    });
};

export const openInNewTab = (url) => {
    window.open(url, '_blank').focus();
};

// From https://github.com/lorenwest/node-config/blob/master/lib/config.js#L131-L152
// export const getKey = (object, property) => {
//     const elems = Array.isArray(property) ? property : property.split('.');
//     const name = elems[0];
//     const value = object[name];

//     if (elems.length <= 1) {
//         return value;
//     }

//     if (typeof value !== 'object') {
//         return undefined;
//     }

//     return getKey(value, elems.slice(1));
// };
