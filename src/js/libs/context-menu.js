export default () => {
    // Log creation status
    const onCreated = () => {
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError}`);
        }
    };

    // Create the context menu item.
    chrome.contextMenus.create({
        id: 'group',
        title: 'Join to group',
        contexts: ['selection', 'link']
    }, onCreated);

    chrome.contextMenus.create({
        id: 'avatar',
        title: 'Change avatar',
        contexts: ['image', 'link']
    }, onCreated);
};
