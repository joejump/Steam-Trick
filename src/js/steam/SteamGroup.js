import api from '../libs/api';
import { switchToHttps } from '../libs/utils';
import { checkError, getSessionId } from './steam-utils';

export default class SteamGroup {
    constructor(groupURL, user) {
        this.groupURL = switchToHttps(groupURL);
        this.user = user;
        this.chain = this._init();
    }
    join() {
        return this.chain
            .then(() => {
                const fd = new FormData();
                fd.append('sessionID', this.sessionId);
                fd.append('action', 'join');

                // Send form to Steam
                return api.post(this.groupURL, fd);
            })
            .then(html => checkError(html, '#message > h3'));
    }
    leave() {
        const fd = new FormData();
        fd.append('sessionID', this.sessionId);
        fd.append('action', 'leaveGroup');
        fd.append('groupId', this.groupID64);

        return api.post(`${this.user.profileURL}home_process`, fd);
    }

    _init() {
        return Promise.all([
            getSessionId().then((sessionId) => {
                this.sessionId = sessionId;
            }),
            this._getData()
        ]);
    }

    // Get info about group using Steam XML API
    _getData() {
        return api.get(`${this.groupURL}/memberslistxml/?xml=1`)
            .then((xml) => {
                this.groupName = xml.querySelector('groupName').textContent;
                this.groupID64 = xml.querySelector('groupID64').textContent;
                this.avatarIcon = xml.querySelector('avatarIcon').textContent;
            });
    }
}
