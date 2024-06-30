// Copyright 2024 Greg Arnell.

/*jslint node: true */
'use strict';

class ChromeStorageHelper {

    /**
     * Get the Chrome storage items.
     * @param {Object} options
     * @param {Object} options.populateDefaultImage true if the default image should be populated
     * @returns {Promise} promise with the Chrome storage items
     */
    static getItems(options = {populateDefaultImage: true}) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(
                {
                    images: [],
                    disabledDomains: [],
                    timing: null,
                    animationDuration: {
                        type: 'exact',
                        data: '3'
                    },
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
                    } else if (options.populateDefaultImage && !items.images.length) {
                        items.images = [{url: chrome.runtime.getURL('img/baby_head.png')}];
                    }

                    // In order to be backwards compatible, if the animationDuration field is a duration value,
                    // then change it to the object format.
                    if (typeof items.animationDuration === 'string') {
                        items.animationDuration = {type: 'exact', data: items.animationDuration}
                    }

                    resolve(items);
                }
            );
        });
    };

    /**
     * Save items in Chrome storage.
     * TODO: reduce the number of syncs because apparently there's a max: https://developer.chrome.com/extensions/storage#property-sync
     * @param {Object} items data to store
     * @returns {Promise} promise that will resolve when items are saved
     */
    static setItems(items) {
        chrome.storage.sync.remove('imageUrl');
        return chrome.storage.sync.set(items);
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
