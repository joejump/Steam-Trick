import { getCookie } from '../libs/utils';

// getSessionId form cookies
export const getSessionId = async () => {
    const { value: sessionId } = await getCookie({ url: 'http://steamcommunity.com', name: 'sessionid' });
    return sessionId;
};

// Check Steam error which can be in html after request
export const checkError = (html, selector) => {
    const errorText = html.querySelector(selector);
    if (errorText !== null) {
        return Promise.reject(new Error(errorText.textContent));
    }
    return Promise.resolve(html);
};
