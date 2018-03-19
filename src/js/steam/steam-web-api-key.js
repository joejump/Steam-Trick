import api from '../libs/api';
import { getSessionId } from './steam-utils';

const parseKey = (html) => {
    if (html.querySelector('#mainContents h2').textContent === 'Access Denied') {
        throw new Error('Access Denied');
    }

    const keyElement = html.querySelector('#bodyContents_ex > p:nth-child(2)');
    return keyElement ?
        keyElement.textContent.split(' ')[1] :
        '';
};

const getKey = async () => parseKey(await api.get('https://steamcommunity.com/dev/apikey'));

const registerkey = async (sessionId) => {
    const form = new FormData();
    form.append('domain', 'localhost');
    form.append('agreeToTerms', 'agreed');
    form.append('sessionid', sessionId);
    form.append('submit', 'Register');

    const html = await api.post('https://steamcommunity.com/dev/registerkey', form);
    return parseKey(html);
};

export default async () => {
    const sessionId = await getSessionId();
    const key = await getKey() || await registerkey(sessionId);

    return key;
};
