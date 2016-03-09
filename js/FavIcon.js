/**
 * Copyright 2015. Greg Arnell.
 **/

/*jslint node: true */
"use strict";

/**
 * FavIcon Class Definition
 **/
function FavIcon(url) {
    this.url = url;
    this.findIcon();
}
FavIcon.prototype = {
    DEFAULT_FAVICON_URL: '/favicon.ico',
    originalUrl: null,
    el: null,
    foundIcon: false,
    enabled: false,
    
    findIcon: function () {
        var me = this,
            image = new Image(),
            imageUrl;

        me.el = $('[rel="shortcut icon"]')[0] || $('[rel="icon"]')[0];
        imageUrl = me.el ? me.el.href : '';
        image.onload = function () {
            me.originalUrl = imageUrl;
            me.enabled = true;
        };
        image.src = imageUrl;
    },
    
    createIconEl: function () {
        var el = document.createElement('link');
        el.type = 'image/x-icon';
        el.rel = 'icon';
        el.href = this.originalUrl;
        document.getElementsByTagName('head')[0].appendChild(el);
        this.el = el;
    },
    
    setIcon: function (url) {
        var me = this,
            newEl;

        if (!me.el && me.originalUrl) {
            me.createIconEl();
        }
        if (me.el && me.el.parentNode) {
            (newEl = me.el.cloneNode(true)).setAttribute('href', url);
            me.el.parentNode.replaceChild(newEl, me.el);
            me.el = newEl;
        }
    },
    
    display: function () {
        this.setIcon(this.url);
    },
    
    reset: function () {
        this.setIcon(this.originalUrl);
    },
    
    isEnabled: function () {
        return this.enabled;
    }
};
