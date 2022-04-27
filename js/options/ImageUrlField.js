/**
 * Copyright 2022 Greg Arnell.
 */

/*jslint node: true */
'use strict';


/**
 * A form input field widget that encapsulates the entry and validation of an image url.
 */
class ImageUrlField extends ValidatedField {
    constructor() {
        super('https://example.com/image.png');
    }

    /**
     * Handler for the change event of the field value.
     * @override
     */
    onFieldChange() {
        const url = this.getValue();

        if (!url) {
            this.setStatus();
            return;
        }

        const lowercaseUrl = url.toLowerCase();
        if (lowercaseUrl.indexOf('http://') !== 0 && lowercaseUrl.indexOf('https://') !== 0) {
            this.setStatus('red', 'Image URLs must begin with "https://". Invalid URLs will not be saved.');
            return;
        }
        const image = new Image();
        image.onload = () => {
            if (lowercaseUrl.indexOf('http:') === 0) {
                this.setStatus('darkorange', 'Image URLs with HTTP protocol will not display on most websites.  HTTPS is <em>highly</em> recommended.');
            } else {
                this.setStatus('green', '&#10004;');
            }
        };
        image.onerror = () => {
            this.setStatus('red', 'Unable to load image.');
        };
        image.src = this.getValue();
    }
}