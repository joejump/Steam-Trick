// Small library to improve on fetch() usage
const api = (method, url, data, headers = {}) => {
    const handleResponse = (res) => {
        const contentType = res.headers.get('content-type');

        // Parse json
        if (contentType.includes('application/json')) {
            return res.json();
        }

        // Parse HTML or XML
        if (contentType.includes('text/html')) {
            return res.text().then(str => (new DOMParser()).parseFromString(str, 'text/html'));
        }
        if (contentType.includes('text/xml')) {
            return res.text().then(str => (new DOMParser()).parseFromString(str, 'text/xml'));
        }

        return res;
    };
    return fetch(url, {
        method: method.toUpperCase(),
        body: data,
        credentials: api.credentials,
        headers: Object.assign(headers)
    }).then(res => (res.ok ? handleResponse(res) : Promise.reject(res.statusText)));
};

// Defaults that can be globally overwritten
api.credentials = 'same-origin'; // 'include';

// Convenient methods
['get', 'post', 'put', 'delete'].forEach((method) => {
    api[method] = api.bind(null, method);
});

export default api;
