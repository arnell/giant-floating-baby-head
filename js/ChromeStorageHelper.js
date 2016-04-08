/**
 * Copyright 2016 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

function ChromeStorageHelper() {}

ChromeStorageHelper.getItems = function (callback, populateDefaultImage) {
    chrome.storage.sync.get(
        {
            images: [],
            timing: null,
            hitHighScore: 0,
            totalHits: 0,
            // backwards compatibility:
            imageUrl: null
        },
        function (items) {
            // In order to be backwards compatible, if the deprecated 'imageUrl' is still defined,
            // then set the images to a new array with the imageUrl as the only element.
            if (items.imageUrl) {
                items.images = [{url: items.imageUrl}];
            } else if (populateDefaultImage && !items.images.length) {
                items.images = [{url: chrome.extension.getURL('img/baby_head.png')}];
            }
            callback.call(window, items);
        }
    );
};

//TODO: reduce the number of syncs because apparently there's a max: https://developer.chrome.com/extensions/storage#property-sync
ChromeStorageHelper.setItems = function (data, callback) {
    chrome.storage.sync.remove('imageUrl');
    chrome.storage.sync.set(data, callback);
};
