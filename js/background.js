/**
 * Copyright 2019 Greg Arnell.
 **/

chrome.commands.onCommand.addListener(function(command) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, "show-baby-head");
    });
});
