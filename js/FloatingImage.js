/**
 * Copyright 2016 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

/**
 * @param config The configuration for the floating image. a reference to
 * the configuration object is maintained and the following properties are
 * update on the object when necessary: imageLoaded, height, maxLength
 * @param config.url url of the image that should be loaded
 * @param [config.imageLoaded] whether the image has been loaded and therefore
 * all info about the image is known
 * @param [config.height] height of the image
 * @param [config.maxLength] Max value of height or width of the image
 */
function FloatingImage(config) {
    this.configRef = config;
    this.url = config.url;
    this.maxLength = config.maxLength || null;
    this.height = config.height || null;
    this.imageLoaded = config.imageLoaded || false;
    this.id = FloatingImage.nextId++;

    // observers array must be initialized here instead of in prototype or
    // else all instances reference the same array.
    this.observers = [];
}

FloatingImage.nextId = 0;

FloatingImage.prototype = {
    configRef: null,
    url: null,
    id: null,
    maxLength: null,
    height: 0,
    imageLoaded: false,
    imageLoading: false,
    dom: null,
    animating: false,
    hitCount: 0,
    observers: null,

    init: function (callback) {
        var me = this,
            configRef = this.configRef,
            image;

        if (me.imageLoading || me.imageLoaded) {
            callback(me);
            return;
        }
        image = new Image();
        me.imageLoading = true;
        image.onload = function () {
            configRef.maxLength = me.maxLength = Math.max(this.width, this.height);
            configRef.height = me.height = this.height;
            configRef.imageLoaded = me.imageLoaded = true;
            me.imageLoading = false;
            callback(me);
        };
        image.src = me.url;
    },

    show: function (pos, animationDuration, angle) {
        var me = this;

        me.hitCount = 0;
        me.animating = true;
        $('<img id="floating-baby-head' + me.id + '" class="floating-baby-head" height="' + me.height + '" src="' + me.url + '"/>').appendTo('body');
        me.dom = $('#floating-baby-head' + me.id);
        me.dom.mousedown(me.onClick.bind(me));
        me.dom.css({
            left: pos[0].x,
            top: pos[0].y
        });
        me.dom.animate({
            left: pos[1].x,
            top: pos[1].y
        }, animationDuration, me.onAnimationComplete.bind(me));
        if (angle) {
            me.dom.animateRotate(angle, {
                duration: animationDuration,
                easing: RandUtil.getRandBool() ? 'linear' : 'swing'
            });
        }
    },

    onClick: function (event) {
        this.hitCount++;
        this.notifyObservers('click', {hitCount: this.hitCount, event: event});
    },

    onAnimationComplete: function () {
        $('#floating-baby-head' + this.id).remove();
        this.animating = false;
        this.notifyObservers('complete');
    },

    applyCss: function (property, value) {
        this.dom.css(property, value);
    },

    stop: function () {
        this.dom.stop(true);
    },

    animate: function (pos, duration) {
        this.dom.stop(true);
        this.dom.animate({
            left: pos.x,
            top: pos.y
        }, duration, this.onAnimationComplete.bind(this));
    },

    addObserver: function (observer) {
        this.observers.push(observer);
    },

    removeObserver: function (observer) {
        var idx = this.observers.indexOf(observer);
        this.observers.splice(idx, 1);
    },

    notifyObservers: function (event, data) {
        var me = this,
            args = Array.prototype.slice.call(arguments);
        args.splice(0, 0, me);
        for (var i = 0; i < me.observers.length; i++) {
            me.observers[i].notify.apply(me.observers[i], args);
        }
    }
};
