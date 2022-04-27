/**
 * Copyright 2022 Greg Arnell.
 */

/*jslint node: true */
'use strict';


/**
 * Encapsulates the loading and saving of the options page.
 */
 class FBHOptions {

    constructor() {
        this.imageUrlFields = [];
        this.disabledDomainFields = [];
        $('#save').click(() => this.saveOptions());
        $('#addImageUrl').click(() => this.addImageUrlField());
        $('#addDomain').click(() => this.addDisabledDomainField());
        $('#resetHighScore').click(() => this.resetHighScore());
    }

    /**
     * Update status to let user know if options were saved.
     * @param {String} status Status message to display next to the save button
     */
    showStatus(status) {
        const statusDiv = $('#saveStatus');
        if (status) {
            statusDiv.addClass('error');
            statusDiv.html(status);
        } else {
            statusDiv.removeClass('error');
            statusDiv.html('Options saved.');
            setTimeout(() => {
                if (!statusDiv.hasClass('error')) {
                    statusDiv.html('');
                }
            }, 2500);
        }
    }

    /**
     * Save options with ChromeStorageHelper
     */
    saveOptions() {
        const images = [];
        const disabledDomains = [];
        const timingType = $('input[name="timing"]:checked').val();

        for (let i = 0; i < this.imageUrlFields.length; i++) {
            const imageUrl = this.imageUrlFields[i].getValue();
            const lowercaseUrl = imageUrl.toLowerCase();
            if (imageUrl && (!lowercaseUrl.indexOf('https://') || !lowercaseUrl.indexOf('http://'))) {
                images.push({url:imageUrl});
            }
        }
        for (let i = 0; i < this.disabledDomainFields.length; i++) {
            let domain = this.disabledDomainFields[i].getValue();
            if (domain) {
                disabledDomains.push(domain);
            }
        }

        let timingData;
        switch (timingType) {
            case 'every':
                timingData = $('#everyValue').val();
                if (isNaN(timingData) || !Number(timingData)) {
                    this.showStatus('Error: Invalid value for "Every" option! Should be a numeric amount.');
                    return;
                }
                break;
            case 'at':
                timingData = $('#atValue').val();
                if (!this.validateTime(timingData)) {
                    this.showStatus('Error: Invalid value for "At" option! Should be a valid 24-hour clock time.');
                    return;
                }
                break;
        }

        ChromeStorageHelper.setItems(
            {
                images,
                disabledDomains,
                timing: {
                    type: timingType,
                    data: timingData
                }
            },
            () => {
                this.showStatus();
                this.restoreOptions();
            }
        );
    }

    /**
     * Check if the passed time string is a valid 24 hour time.
     * @param   {String} time String of the format '13:37'
     * @returns {true}   if the string is a valid time.
     */
    validateTime(time) {
        if (typeof time !== 'string') {
            return false;
        }
        const splitTime = time.split(':');
        if (splitTime.length !== 2 || !splitTime[0].length || !splitTime[1].length) {
            return false;
        }
        const hours = Number(splitTime[0]);
        const mins = Number(splitTime[1])
        return Math.ceil(hours) === hours && hours >= 0 && hours <=23
            && Math.ceil(mins) === mins && mins >= 0 && mins <= 59;
    }

    /**
     * Restore select box and checkbox state using the preferences stored in chrome.storage.
     */
    restoreOptions() {
        ChromeStorageHelper.getItems(
            (items) => {
                for (let i = 0; i < this.imageUrlFields.length; i++) {
                    this.imageUrlFields[i].destroy();
                }
                this.imageUrlFields = [];
                for (let i = 0; i < this.disabledDomainFields.length; i++) {
                    this.disabledDomainFields[i].destroy();
                }
                this.disabledDomainFields = [];

                if (items.images.length) {
                    for (let i = 0; i < items.images.length; i++) {
                        this.addImageUrlField(items.images[i].url);
                    }
                } else {
                    this.addImageUrlField();
                }
                if (items.disabledDomains.length) {
                    for (let i = 0; i < items.disabledDomains.length; i++) {
                        this.addDisabledDomainField(items.disabledDomains[i]);
                    }
                } else {
                    this.addDisabledDomainField();
                }
                if (items.timing) {
                    $('#' + items.timing.type).prop('checked', true);
                    $('#' + items.timing.type + 'Value').val(items.timing.data);
                }
            },
            false
        );
    }

    /**
     * Add an additional image url field
     * @param {String} [value] The image url value to populate the field with.
     */
    addImageUrlField(value) {
        const imageUrlField = new ImageUrlField();
        imageUrlField.appendTo($('#imageUrls'));
        imageUrlField.setValue(value);
        this.imageUrlFields.push(imageUrlField);
    }

    /**
     * Add an additional disabled domain field
     * @param {String} [value] The domain value to populate the field with.
     */
    addDisabledDomainField(value) {
        const domainField = new DisabledDomainField();
        domainField.appendTo($('#disabledDomains'));
        domainField.setValue(value);
        this.disabledDomainFields.push(domainField);
    }

    /**
     * 'Reset High Score' button handler
     */
    resetHighScore() {
        ChromeStorageHelper.getItems((items) => {
            const confirmed = confirm('Press OK to reset your high score.\nCurrent score: ' + items.hitHighScore);
            if (confirmed) {
                ChromeStorageHelper.setItems({
                    hitHighScore: 0
                });
            }
        });
    }
};
