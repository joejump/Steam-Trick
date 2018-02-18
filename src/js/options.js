'use strict';
$(function ($) {
    const getFromStorage = (item, type = 'local') =>
        new Promise(resolve => chrome.storage[type].get(item, resolve));
    
    const setInStorage = (item, type = 'local') =>
        new Promise(resolve => chrome.storage[type].set(item, resolve));

    const saveOptions = (key, value) => {
        return getFromStorage('options')
            .then(storage => {
                const {options = {}} = storage;
		        options[key] = value;
                return setInStorage({options});
            });
    };

    const isChacked = (checkboxElement) => 
        checkboxElement.checked;

    const merge = (...objects) => {
        return objects.reduce((prev, obj) => {
            Object.keys(obj).forEach(item => {
                if (Array.isArray(obj[item])) {
                    if (!prev[item]) prev[item] = [];
                    prev[item].push(...obj[item]);
                }
                else if (typeof obj[item] === 'object') {
                    prev[item] = merge(prev[item] || {}, obj[item]);
                }
                else {
                    prev[item] = obj[item];
                }
            });
            return prev;
        }, {})
    }

    getFromStorage('options')
    .then(({options = {}}) => {
        console.log(options);
        
        $('#checkboxStorage').change(function () {
            const chacked = isChacked(this);
            
        }).attr('checked', options.syncStorage);
    })
});
