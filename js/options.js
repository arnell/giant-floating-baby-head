/**
 * Copyright 2016 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

// Update status to let user know if options were saved.
function showStatus(status) {
    var statusDiv = $('#status');
    if (!status) {
        statusDiv.removeClass('error');
        statusDiv.html('Options saved.');
        setTimeout(function () {
            if (!statusDiv.hasClass('error')) {
                statusDiv.html('');
            }
        }, 2000);
    } else {
        statusDiv.addClass('error');
        statusDiv.html(status);
    }
}

// Saves options to chrome.storage
function save_options() {
    var imageUrlsFields = $('.imageUrl'),
        images = [],
        timingType = $('input[name="timing"]:checked').val(),
        timingData, imageUrl;

    for (var i = 0; i < imageUrlsFields.size(); i++) {
        imageUrl = imageUrlsFields[i].value;
        if (imageUrl) {
            images.push({url:imageUrl});
        }
    }

    switch (timingType) {
        case 'every':
            timingData = $('#everyValue').val();
            if (isNaN(timingData) || !Number(timingData)) {
                showStatus("Error: Invalid value for 'Every' option!");
                return;
            }
            break;
        case 'at':
            timingData = $('#atValue').val();
            if (!validateTime(timingData)) {
                showStatus("Error: Invalid value for 'At' option!");
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
            showStatus();
            restore_options();
        }
    );
}

function validateTime(time) {
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
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    ChromeStorageHelper.getItems(
        function (items) {
            $('#imageUrls').empty();
            if (items.images.length) {
                for (var i = 0; i < items.images.length; i++) {
                    addImageUrlField(items.images[i].url);
                }
            } else {
                addImageUrlField('');
            }
            if (items.timing) {
                $('#' + items.timing.type).prop('checked', true);
                $('#' + items.timing.type + 'Value').val(items.timing.data);
            }
        },
        false
    );
}
$(document).ready(function () {
    restore_options();
    $('#save').click(save_options);
    $('#addImageUrl').click(function () {
        addImageUrlField();
    });
});

function addImageUrlField(value) {
    var number = $('.imageUrl').size(),
        id = 'imageUrl' + number;

    $('#imageUrls').append('<input id="' + id + '" type="text" class="imageUrl" placeholder="http://example.com/image.png">');
    $('#'+id).val(value);
}
