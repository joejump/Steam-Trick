// Details to identify the cookie being retrieved.
export const getCookie = details =>
    new Promise((resolve, reject) => {
        chrome.cookies.get(details, cookie => (
            (cookie !== null)
                ? resolve(cookie)
                : reject(new Error('We don\'t have a cookie. You have to be logged in'))
        ));
    });

export const showError = (error) => {
    const message = (error.message || error.toString()).trim();

    chrome.notifications.create({
        type: 'basic', iconUrl: '../img/warning.svg', title: 'Error :(', message
    });
};

export const showNotification = (arg, notificationId, callback) => {
    const opt = (typeof arg === 'string') ? { message: arg } : arg;
    const options = Object.assign(opt, {
        type: 'basic',
        iconUrl: '../img/128.png',
        title: chrome.runtime.getManifest().name
    });

    chrome.notifications.create(notificationId, options, callback);
};

export const openInNewTab = url =>
    window.open(url, '_blank').focus();

export const containsPermissions = permissions =>
    new Promise((resolve, reject) => {
        chrome.permissions.contains(permissions, (result) => {
            if (result) {
                resolve(result);
            }
            reject(new Error('The extension doesn\'t have the permissions'));
        });
    });

export const permissionsRequest = permissions =>
    new Promise((resolve, reject) => {
        chrome.permissions.request(permissions, (result) => {
            if (result) {
                resolve(result);
            }
            reject(new Error('The extension doesn\'t have the permissions'));
        });
    });

export const switchToHttps = str => str.replace(/^http:\/\//i, 'https://');

export const checkFileAccess = () =>
    new Promise((resolve) => {
        chrome.extension.isAllowedFileSchemeAccess((isAllowedAccess) => {
            resolve(isAllowedAccess);
        });
    });
