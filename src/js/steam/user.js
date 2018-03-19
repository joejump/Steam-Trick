import $ from 'jquery';
import { parseDataFromHTML, parseDataFromJSON, parseDataFromXML } from './parser';
import { getId64 } from './steam-utils';

export const getNotificationCounts = () =>
    $.getJSON('https://steamcommunity.com/actions/GetNotificationCounts');

export const getUserData = async (sourceType, apiKey) => {
    if (sourceType === 'html') {
        const html = await $.get('https://steamcommunity.com/my/edit');
        return parseDataFromHTML(html);
    }

    if (sourceType === 'json') {
        if (!apiKey) {
            throw new Error('Api key does not exist. Go to options');
        }

        const id64 = await getId64();
        const API_URL = 'https://api.steampowered.com/';

        const {
            response: { players: [player] }
        } = await $.getJSON(`${API_URL}ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${id64}`);
        return parseDataFromJSON(player);
    }

    return parseDataFromXML(await $.get('https://steamcommunity.com/my?xml=1'));
};
