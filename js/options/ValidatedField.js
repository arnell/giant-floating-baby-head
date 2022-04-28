// Copyright 2022 Greg Arnell.

/*jslint node: true */
'use strict';

/**
 * A form input field widget that encapsulates the entry and validation of a field
 */
 class ValidatedField {
     /**
      * @param {String} placeholder Placeholder text for the input field
      */
    constructor(placeholder) {
        this.id = 'validatedField-' + ValidatedField.#nextId++;
        this.placeholder = placeholder;
        this.changeTimeoutId = null;
    }

    static #nextId = 0;
    static #html = '<div id="{id}" class="validatedField"><input type="text" class="validatedFieldInput" placeholder="{placeholder}"><span class="status"></span></div>';

    /**
     * Add this field to the supplied jQuery object.
     * @param {jQuery} div The jQuery object that the field should be appended to.
     */
    appendTo(div) {
        div.append(ValidatedField.#html
            .replace('{id}', this.id)
            .replace('{placeholder}', this.placeholder));
        this.el = $('#' + this.id);
        this.field = this.el.children('input');
        this.field.keyup(() => {
            clearTimeout(this.changeTimeoutId);
            this.setStatus();
            this.changeTimeoutId = setTimeout(() => this.onFieldChange(), 600);
        });
    }

    /**
     * Handler for the change event of the field value.
     * To be implemented by a subclass
     */
    onFieldChange() {

    }

    /**
     * Set the field status
     * @param {String} [color] The border color that should be applied to the field and text
     * @param {String} [text]  The help text that should appear next to the field.
     */
    setStatus(color, text) {
        const status = this.el.children('.status');
        if (text) {
            status.css('color', color);
            status.html(text);
            status.show();
            this.field.css('border-color', color);
        } else {
            status.hide();
            this.field.css('border-color', color || 'black');
        }
    }

    /**
     * Set the value of the field. onFieldChange will be called after setting the value.
     * @param {String} value The value to set for the field.
     */
    setValue(value) {
        this.field.val(value);
        this.onFieldChange();
    }

    /**
     * Get the current value from the field.
     * @returns {String} the value
     */
    getValue() {
        return this.field.val();
    }

    /**
     * Focus the field
     */
    focus() {
        this.field.focus();
    }

    /**
     * Removes this field from the dom.
     */
    destroy() {
        this.el.remove();
    }
}
