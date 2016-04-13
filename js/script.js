/**
 * Copyright 2016 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

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
ChromeStorageHelper.getItems(
	function (items) {
        window.fbh = new FBH(items.images, items.timing, items.hitHighScore);
        fbh.start();
    },
    true
);
