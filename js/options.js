/**
 * Copyright 2015. Greg Arnell.
 **/

/*jslint node: true */
"use strict";

function showStatus(status) {
    // Update status to let user know options were saved.
    var statusDiv = $('#status');
    if (!status) {
        statusDiv.removeClass('error');
        statusDiv.html('Options saved.');
        setTimeout(function () {
            statusDiv.html('');
        }, 1000);
    } else {
        statusDiv.addClass('error');
        statusDiv.html(status);
    }
}

// Saves options to chrome.storage
function save_options() {
    var imageUrl = $('#imageUrl').val(),
        timingType = $('input[name="timing"]:checked').val(),
        timingData;
    
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
    
    chrome.storage.sync.set({
        imageUrl: imageUrl,
        timing: {
            type: timingType,
            data: timingData
        }
    }, showStatus);
    if (!imageUrl) {
        chrome.storage.sync.remove('imageUrl');
    }
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
    // Use default value ''
    chrome.storage.sync.get({
        imageUrl: '',
        timing: {}
    }, function (items) {
        $('#imageUrl').val(items.imageUrl);
        if (items.timing) {
            $('#' + items.timing.type).prop('checked', true);
            $('#' + items.timing.type + 'Value').val(items.timing.data);
        }
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
