import { getCookie } from '../libs/utils';

const getSteamCookie = details => getCookie(Object.assign({}, { url: 'http://steamcommunity.com' }, details));

// getSessionId form cookies
export const getSessionId = async () => {
    const { value: sessionId } = await getSteamCookie({ name: 'sessionid' });
    return sessionId;
};

export const getId64 = async () => {
    const { value: steamLogin } = await getSteamCookie({ name: 'steamLogin' });
    const id64 = steamLogin.split('%')[0];
    return id64;
};

// Check Steam error which can be in html after request
export const checkError = (html, selector) => {
    const errorText = html.querySelector(selector);
    if (errorText !== null) {
        return Promise.reject(new Error(errorText.textContent));
    }
    return Promise.resolve(html);
};
