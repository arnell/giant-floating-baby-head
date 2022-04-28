// Copyright 2022 Greg Arnell.

/*jslint node: true */
'use strict';

$.fn.animateRotate = function (angle, duration, easing, complete) {
    const args = $.speed(duration, easing, complete);
    const step = args.step;
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
	(items) => {
        window.fbh = new FBH(items.images, items.timing, items.hitHighScore, items.disabledDomains);
        fbh.start();
    },
    true
);
