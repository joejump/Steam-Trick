import $ from 'jquery';

export const parseDataFromHTML = (html) => {
    const $html = $(html);

    const personaName = $html.find('#personaName').val();
    const id64 = $html.find('#avatar_upload_form > input[name="sId"]').val();
    const profileURL = $html.find('.playerAvatar > a:first').attr('href');
    const avatar = $html.find('#avatar_medium_img').attr('src');

    return {
        profileURL,
        id64,
        personaName,
        avatar
    };
};

export const parseDataFromXML = (xml) => {
    const $xml = $(xml);

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
};

export const parseDataFromJSON = (player) => {
    const {
        profileurl: profileURL,
        steamid: id64,
        personaname: personaName,
        avatarmedium: avatar
    } = player;

    return {
        profileURL,
        id64,
        personaName,
        avatar
    };
};
