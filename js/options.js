/**
 * Copyright 2016 Greg Arnell.
 */

/*jslint node: true */
'use strict';

/**
 * Encapsulates the loading and saving of the options page.
 */
function FBHOptions() {
    var me = this;

    $('#save').click(function () {
        me.saveOptions();
    });
    $('#addImageUrl').click(function () {
        me.addImageUrlField();
    });
    $('#resetHighScore').click(function () {
        me.resetHighScore();
    });
}

FBHOptions.prototype = {
    imageUrlFields: [],

    /**
     * Update status to let user know if options were saved.
     * @param {String} status Status message to display next to the save button
     */
    showStatus: function (status) {
        var statusDiv = $('#status');
        if (status) {
            statusDiv.addClass('error');
            statusDiv.html(status);
        } else {
            statusDiv.removeClass('error');
            statusDiv.html('Options saved.');
            setTimeout(function () {
                if (!statusDiv.hasClass('error')) {
                    statusDiv.html('');
                }
            }, 2500);
        }
    },

    /**
     * Saves options with ChromeStorageHelper
     */
    saveOptions: function () {
        var me = this,
            images = [],
            timingType = $('input[name="timing"]:checked').val(),
            timingData, imageUrl, lowercaseUrl;

        for (var i = 0; i < me.imageUrlFields.length; i++) {
            imageUrl = me.imageUrlFields[i].getValue();
            lowercaseUrl = imageUrl.toLowerCase();
            if (imageUrl && (!lowercaseUrl.indexOf('https://') || !lowercaseUrl.indexOf('http://'))) {
                images.push({url:imageUrl});
            }
        }

        switch (timingType) {
            case 'every':
                timingData = $('#everyValue').val();
                if (isNaN(timingData) || !Number(timingData)) {
                    me.showStatus("Error: Invalid value for 'Every' option! Should be a numeric amount.");
                    return;
                }
                break;
            case 'at':
                timingData = $('#atValue').val();
                if (!me.validateTime(timingData)) {
                    me.showStatus("Error: Invalid value for 'At' option! Should be a valid 24-hour clock time.");
                    return;
                }
                break;
        }

        ChromeStorageHelper.setItems(
            {
                images: images,
                timing: {
                    type: timingType,
                    data: timingData
                }
            },
            function () {
                me.showStatus();
                me.restoreOptions();
            }
        );
    },

    /**
     * Checks if the passed time string is a valid 24 hour time.
     * @param   {String} time String of the format "13:37"
     * @returns {true}   if the string is a valid time.
     */
    validateTime: function (time) {
        var splitTime, hours, mins;

        if (typeof time !== 'string') {
            return false;
        }
        splitTime = time.split(':');
        if (splitTime.length !== 2 || !splitTime[0].length || !splitTime[1].length) {
            return false;
        }
        hours = Number(splitTime[0]);
        mins = Number(splitTime[1])
        return Math.ceil(hours) === hours && hours >= 0 && hours <=23
            && Math.ceil(mins) === mins && mins >= 0 && mins <= 59;
    },

    /**
     * Restores select box and checkbox state using the preferences stored in chrome.storage.
     */
    restoreOptions: function () {
        var me = this;

        ChromeStorageHelper.getItems(
            function (items) {
                for (var i = 0; i < me.imageUrlFields.length; i++) {
                    me.imageUrlFields[i].destroy();
                }
                me.imageUrlFields = [];
                if (items.images.length) {
                    for (var i = 0; i < items.images.length; i++) {
                        me.addImageUrlField(items.images[i].url);
                    }
                } else {
                    me.addImageUrlField('');
                }
                if (items.timing) {
                    $('#' + items.timing.type).prop('checked', true);
                    $('#' + items.timing.type + 'Value').val(items.timing.data);
                }
            },
            false
        );
    },

    /**
     * Add an additional image url field
     * @param {String} [value] The image url value to populate the field with.
     */
    addImageUrlField: function (value) {
        var imageUrlField = new ImageUrlField();

        imageUrlField.appendTo($('#imageUrls'));
        imageUrlField.setValue(value);
        this.imageUrlFields.push(imageUrlField);
        if (!value) {
            imageUrlField.focus();
        }
    },

    /**
     * "Reset High Score" button handler
     */
    resetHighScore: function () {
        ChromeStorageHelper.getItems(function(items) {
            var confirmed = confirm("Press OK to reset your high score.\nCurrent score: " + items.hitHighScore);
            if (confirmed) {
                ChromeStorageHelper.setItems({
                    hitHighScore: 0
                });
            }
        });
    }
};

/**
 * A form input field widget that encapsulates the entry and validation of an image url.
 */
function ImageUrlField() {
    this.id = 'imageUrl-' + ImageUrlField.nextId++;
};

ImageUrlField.nextId = 0;

ImageUrlField.prototype = {
    id: null,

    html: '<div id="ID" class="imageUrl"><input type="text" class="imageUrlField" placeholder="https://example.com/image.png"><span class="imageStatus"></span>',

    changeTimeoutId: null,

    /**
     * Adds this image url field to the supplied jQuery object.
     * @param {jQuery} div The jQuery object that the image url field should be appended to.
     */
    appendTo: function (div) {
        var me = this,
            el, field;

        div.append(me.html.replace('ID', me.id));
        el = $('#' + me.id);
        me.el = el;
        field = el.children('.imageUrlField');
        me.field = field;
        field.keyup(function () {
            clearTimeout(me.changeTimeoutId);
            me.setImageUrlStatus();
            //TODO: add spinner for while loading image
            me.changeTimeoutId = setTimeout(function () {
                me.onFieldChange();
            }, 500);
        });
    },

    /**
     * Handler for the change event of the field value.
     */
    onFieldChange: function () {
        var me = this,
            el = me.el,
            field = me.field,
            url = field.val(),
            image = new Image(),
            lowercaseUrl;

        if (!url) {
            me.setImageUrlStatus();
            return;
        }

        lowercaseUrl = url.toLowerCase();
        if (lowercaseUrl.indexOf('http://') !== 0 && lowercaseUrl.indexOf('https://') !== 0) {
            me.setImageUrlStatus('red', 'Image URLs must begin with "https://". Invalid URLs will not be saved.');
            return;
        }
        image.onload = function () {
            if (lowercaseUrl.indexOf('http:') === 0) {
                me.setImageUrlStatus('darkorange', 'Image URLs with HTTP protocol will not display correctly on most websites.  HTTPS is <em>highly</em> recommended.');
            } else {
                me.setImageUrlStatus('green', '&#10004;');
            }
        };
        image.onerror = function () {
            me.setImageUrlStatus('red', 'Unable to load image.');
        };
        image.src = field.val();
    },

    /**
     * @private
     * Sets the url field status
     * @param {String} [color] The border color that should be applied to the field and text
     * @param {String} [text]  The help text that should appear next to the field.
     */
    setImageUrlStatus: function (color, text) {
        var imageStatus = this.el.children('.imageStatus'),
            field = this.field;
        if (text) {
            imageStatus.css('color', color);
            imageStatus.html(text);
            imageStatus.show();
            field.css('border-color', color);
        } else {
            imageStatus.hide();
            field.css('border-color', color || 'black');
        }
    },

    /**
     * Sets the value of the field. onFieldChange will be called after setting the value.
     * @param {String} value The value to set for the field.
     */
    setValue: function (value) {
        this.field.val(value);
        this.onFieldChange();
    },

    /**
     * Gets the current value from the field.
     * @returns {String} the value
     */
    getValue: function () {
        return this.field.val();
    },

    /**
     * Focuses the field
     */
    focus: function () {
        this.field.focus();
    },

    /**
     * Removes this field from the the dom.
     */
    destroy: function() {
        this.el.remove();
    }
};


$(document).ready(function () {
    window.FBHOptions = new FBHOptions();
    FBHOptions.restoreOptions();
});
