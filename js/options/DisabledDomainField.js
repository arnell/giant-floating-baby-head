/**
 * Copyright 2022 Greg Arnell.
 */

/*jslint node: true */
'use strict';

/**
 * A form input field widget that encapsulates the entry and validation of a disabled domain field.
 */
class DisabledDomainField extends ValidatedField {
    constructor() {
        super('example.com');
    }

    /**
     * Handler for the change event of the field value.
     * @override
     */
    onFieldChange() {
        const domain = this.getValue();
        if (!domain) {
            this.setStatus();
            return;
        }
        if (!domain.match(/[^/]+\.[^/]+/)) {
            this.setStatus('red', 'This domain doesn\'t look right. It should be of the form <em>example.com</em>.');
            return;
        }
    }
}