import api from '../libs/api';
import { getSessionId } from './steam-utils';


const setAvatar = async ({ blob, id64 }) => {
    const MAX_FILE_SIZE = 1048576;
    if (blob.size > MAX_FILE_SIZE) {
        throw new Error(`Max image size is ${MAX_FILE_SIZE / 1000}kb`);
    }
    const sessionid = await getSessionId();

    const formData = new FormData();
    formData.append('MAX_FILE_SIZE', MAX_FILE_SIZE);
    formData.append('type', 'player_avatar_image');
    formData.append('sId', id64);
    formData.append('sessionid', sessionid);
    formData.append('doSub', 1);
    formData.append('json', 1);
    formData.append('avatar', blob);

    const json = await api.post('https://steamcommunity.com/actions/FileUploader', formData);

    // if success return new images (full, medium, 0);
    if (!json.success) {
        throw new Error(json.message);
    }
    return json.images;
};

export default setAvatar;
