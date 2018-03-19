// Details to identify the cookie being retrieved.
export const getCookie = details =>
    new Promise((resolve, reject) => {
        chrome.cookies.get(details, cookie => (
            (cookie !== null) ? resolve(cookie) : reject(new Error('We don\'t have a cookie. You have to be logged in'))
        ));
    });
export const showError = (error) => {
    const message = (error.message) ? error.message : error.toString();

    chrome.notifications.create({
        type: 'basic', iconUrl: '../img/warning.svg', title: 'Error :(', message: message.trim()
    });
};
export const openInNewTab = (url) => {
    window.open(url, '_blank').focus();
};
