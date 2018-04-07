import { getSessionId, getId64 } from './steam-utils';

export default async ({ blob }) => {
    const MAX_FILE_SIZE = 1048576;
    if (blob.size > MAX_FILE_SIZE) {
        throw new Error(`Max image size is ${MAX_FILE_SIZE / 1000}kb`);
    }
    const sessionid = await getSessionId();
    const id64 = await getId64();

    const formData = new FormData();
    formData.append('MAX_FILE_SIZE', MAX_FILE_SIZE);
    formData.append('type', 'player_avatar_image');
    formData.append('sId', id64);
    formData.append('sessionid', sessionid);
    formData.append('doSub', 1);
    formData.append('json', 1);
    formData.append('avatar', blob);

    const data = await fetch('https://steamcommunity.com/actions/FileUploader', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    });

    const json = await data.json();

    // if success return new images (full, medium, 0);
    if (!json.success) {
        throw new Error(json.message);
    }
    return json.images;
};

