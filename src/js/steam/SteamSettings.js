import api from '../libs/api';
import { checkError } from './steam-utils';

export default class SteamSettings {
    constructor(newSettings) {
        this._chain = this._init();
        if (newSettings) {
            this.setNewSettings(newSettings);
        }
    }

    setNewSettings(settings) {
        this._chain = this._chain.then(() => {
            Object.entries(settings).forEach(([name, value]) => {
                this.formData.set(name, value);
            });
            return this.formData;
        });
    }

    // Send form to Steam
    send() {
        return this._chain
            .then(() => api.post(this.editURL, this.formData))
            .then(html => checkError(html, '#errorText'));
    }

    _init() { return this._getData(); }

    // Get HTML page form https://steamcommunity.com/my/edit
    _getData() {
        return api.get('https://steamcommunity.com/my/edit')
            .then(html => checkError(html, '#errorText'))
            .then((html) => {
                const form = html.getElementById('editForm');

                // Set background
                const backgroundId = form.querySelector('.formRow + script').textContent
                    .match(/(communityitemid)":"((\\"|[^"])*)/);
                form.querySelector('#profile_background').value = backgroundId ? backgroundId[2] : '';

                this.formData = new FormData(form);
                this.editURL = form.action;
            });
    }
}
