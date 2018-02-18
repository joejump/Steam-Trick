import localforage from 'localforage';
import { getKey } from './utils';

const reset = async (key, callback) => {
    // спершу зробити без занурення(a.a.a.a)
    try {
        const value = await localforage.getItem(key);
        const result = callback(value);
        return localforage.setItem(key, result);
    } catch (e) {
        console.error(e);
    }
};

export const pushElement = (key, ...items) =>
    reset(key, (value) => {
        const arr = value || [];
        if (!Array.isArray(arr)) { throw new Error(`${key} is not an array`); }
        arr.push(...items);
        return arr;
    });

export const removeElement = (key, index) =>
    reset(key, (arr) => {
        arr.splice(index, 1);
        return arr;
    });

export const getElement = async (key, index) => {
    const arr = await localforage.getItem(key);
    return arr[index];
};
