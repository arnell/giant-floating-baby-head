/**
 * Copyright 2022 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

class ChromeStorageHelper {

    static getItems(callback, populateDefaultImage) {
        chrome.storage.sync.get(
            {
                images: [],
                disabledDomains: [],
                timing: null,
                hitHighScore: 0,
                totalHits: 0,
                // backwards compatibility:
                imageUrl: null
            },
            (items) => {
                // In order to be backwards compatible, if the deprecated 'imageUrl' is still defined,
                // then set the images to a new array with the imageUrl as the only element.
                if (items.imageUrl) {
                    items.images = [{url: items.imageUrl}];
                } else if (populateDefaultImage && !items.images.length) {
                    items.images = [{url: chrome.runtime.getURL('img/baby_head.png')}];
                }
                callback.call(window, items);
            }
        );
    };

    //TODO: reduce the number of syncs because apparently there's a max: https://developer.chrome.com/extensions/storage#property-sync
    static setItems(data, callback) {
        chrome.storage.sync.remove('imageUrl');
        chrome.storage.sync.set(data, callback);
    };

    /**
     * Simple check to verify if the extension is enabled.
     * Performs a chrome.storage.local.get that will throw an exception if the extension is
     * disabled or uninstalled.
     * @returns {boolean} true if the extension is enabled, false otherwise
     */
    static isExtensionEnabled() {
        try {
            chrome.storage.local.get({}, () => {});
            return true;
        } catch (e) {
            return false;
        }
    };
}
