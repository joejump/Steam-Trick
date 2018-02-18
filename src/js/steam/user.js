import $ from 'jquery';

export const getNotificationCounts = () =>
    $.getJSON('https://steamcommunity.com/actions/GetNotificationCounts');

export const getUserData = () =>
    $.get('https://steamcommunity.com/my?xml=1')
        .then(xml => $(xml))
        .then(($xml) => {
            const customURL = $xml.find('customURL').text();
            const id64 = $xml.find('steamID64').text();
            const personaName = $xml.find('steamID').text();
            const avatar = $xml.find('avatarMedium:first').text();
            const stateMessage = $xml.find('stateMessage').text();
            const onlineState = $xml.find('onlineState').text();
            const profileURL = `https://steamcommunity.com/${customURL ? `id/${customURL}` : `profiles/${id64}`}`;

            return {
                profileURL,
                id64,
                personaName,
                avatar,
                stateMessage,
                onlineState
            };
        });
