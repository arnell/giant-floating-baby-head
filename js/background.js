// Copyright 2022 Greg Arnell.

/**
 * Set up the command listener (there's only one command).
 */
chrome.commands.onCommand.addListener((command)  => {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, 'show-baby-head');
    });
});
