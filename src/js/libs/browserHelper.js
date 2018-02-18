export const getUA = () => window.navigator.userAgent;

export const getExtensionUrl = (...args) => chrome.extension.getURL(...args);
export const isFirefox = getUA().includes('Firefox/');
export const isChrome = getUA().includes('Chrome/');

export const getBrowser = () => {
    if (isFirefox) {
        return 'firefox';
    } else if (isChrome) {
        return 'chrome';
    }
    // TODO: make sure we're right, else, return false
    return 'opera';
};

const storage = isFirefox ? browser.storage.local : browser.storage.sync;

// export const getVersion = () => chrome.runtime.getManifest().version_name || chrome.runtime.getManifest().version;
// export const getName = () => chrome.runtime.getManifest().name;
// export const getIcons = () => {
//     const icons = chrome.runtime.getManifest().icons;
//     Object.keys(icons).forEach((key) => {
//         icons[key] = getExtensionUrl(icons[key]);
//     });

//     return icons;
// };

// export const getUpgradeMessage = () => getMessage('notification_upgrade').replace('{{version}}', getVersion());

// export const settings = {
//     get(property, cb) {
//         return this.getAll((settingsVal) => {
//             cb(getKey(settingsVal, property));
//         });
//     },
//     set(obj, cb) {
//         this.getAll((currSettings) => {
//             storage.set(Object.assign(currSettings, obj), () => {
//                 if (cb) {
//                     return this.getAll(cb);
//                 }

//                 return false;
//             });
//         });
//     },
//     getAll(done) {
//         storage.get(null, (obj) => {
//             done(obj);
//         });
//     }
// };
