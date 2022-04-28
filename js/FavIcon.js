// Copyright 2022 Greg Arnell.

/*jslint node: true */
'use strict';


class FavIcon {

    constructor() {
        this.originalUrl = null;
        this.el = null;
        this.foundIcon = false;
        this.enabled = false;
        this.findIcon();
    }

    findIcon() {
        this.el = $('[rel="shortcut icon"]')[0] || $('[rel="icon"]')[0];
        const imageUrl = this.el ? this.el.href : '';
        if (!imageUrl) {
            return;
        }
        const image = new Image();
        image.onload = () => {
            this.originalUrl = imageUrl;
            this.enabled = true;
        };
        image.src = imageUrl;
    }

    #createIconEl() {
        const el = document.createElement('link');
        el.type = 'image/x-icon';
        el.rel = 'icon';
        el.href = this.originalUrl;
        document.getElementsByTagName('head')[0].appendChild(el);
        this.el = el;
    }

    #setIcon(url) {
        if (!this.el && this.originalUrl) {
            this.#createIconEl();
        }
        if (this.el && this.el.parentNode) {
            const newEl = this.el.cloneNode(true);
            newEl.setAttribute('href', url);
            this.el.parentNode.replaceChild(newEl, this.el);
            this.el = newEl;
        }
    }

    display(url) {
        if (this.isEnabled()) {
            this.#setIcon(url);
        }
    }

    reset() {
        this.#setIcon(this.originalUrl);
    }

    isEnabled() {
        return this.enabled;
    }
}
