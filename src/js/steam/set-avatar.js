import api from '../libs/api';
import { getSessionId } from './steam-utils';

const setAvatar = (blob, { id64 }) => getSessionId()
    .then((sessionid) => {
        const formData = new FormData();
        formData.append('MAX_FILE_SIZE', '1048576');
        formData.append('type', 'player_avatar_image');
        formData.append('sId', id64);
        formData.append('sessionid', sessionid);
        formData.append('doSub', 1);
        formData.append('json', 1);
        formData.append('avatar', blob);
        return formData;
    })
    .then(fd => api.post('https://steamcommunity.com/actions/FileUploader', fd))
    .then((json) => {
        // if success return new images (full, medium, 0);
        if (json.success) {
            return json.images;
        }
        throw new Error(json.message);
    });

export default setAvatar;
