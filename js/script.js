/**
 * Copyright 2015. Greg Arnell.
 **/

/*jslint node: true */
"use strict";

$.fn.animateRotate = function (angle, duration, easing, complete) {
    var args = $.speed(duration, easing, complete),
        step = args.step;
    return this.each(function (i, e) {
        args.complete = $.proxy(args.complete, e);
        args.step = function (now) {
            $.style(e, 'transform', 'rotate(' + now + 'deg)');
            if (step) { return step.apply(e, arguments); }
        };
        $({deg: 0}).animate({deg: angle}, args);
    });
};

/**
 * Setup
 */
chrome.storage.sync.get(
    {
        imageUrl: chrome.extension.getURL('img/baby_head.png'),
        timing: null,
        hitHighScore: 0
    },
	function (items) {
        window.fbh = new FBH(items.imageUrl, items.timing, items.hitHighScore);
        fbh.start();
    }
);
