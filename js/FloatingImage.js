/**
 * Copyright 2022 Greg Arnell.
 **/

/*jslint node: true */
'use strict';


class FloatingImage {

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
    constructor(config) {
        this.configRef = config;
        this.url = config.url;
        this.maxLength = config.maxLength || null;
        this.height = config.height || null;
        this.imageLoaded = config.imageLoaded || false;
        this.imageLoading = false;
        this.id = FloatingImage.#nextId++;
        this.observers = [];
        this.dom = null;
        this.animating = false;
        this.hitCount = 0;
    }

    static #nextId = 0;

    init() {
        const configRef = this.configRef;

        return new Promise((resolve, reject) => {
            if (this.imageLoading || this.imageLoaded) {
                resolve();
                return;
            }
            const image = new Image();
            this.imageLoading = true;
            image.onload = () => {
                configRef.maxLength = this.maxLength = Math.max(image.width, image.height);
                configRef.height = this.height = image.height;
                configRef.imageLoaded = this.imageLoaded = true;
                this.imageLoading = false;
                resolve();
            };
            image.onerror = () => {
                this.imageLoading = false;
                reject();
            }
            image.src = this.url;
        });
    }

    show(pos, animationDuration, angle) {
        this.hitCount = 0;
        this.animating = true;
        $('<img id="floating-baby-head' + this.id + '" class="floating-baby-head" height="' + this.height + '" src="' + this.url + '"/>').appendTo('body');
        this.dom = $('#floating-baby-head' + this.id);
        this.dom.mousedown((event) => this.onClick(event));
        this.dom.css({
            left: pos[0].x,
            top: pos[0].y
        });
        this.dom.animate({
            left: pos[1].x,
            top: pos[1].y
        }, animationDuration, () => this.onAnimationComplete());
        if (angle) {
            this.dom.animateRotate(angle, {
                duration: animationDuration,
                easing: RandUtil.getRandBool() ? 'linear' : 'swing'
            });
        }
    }

    onClick(event) {
        this.hitCount++;
        this.notifyObservers('click', {hitCount: this.hitCount, event: event});
    }

    onAnimationComplete() {
        $('#floating-baby-head' + this.id).remove();
        this.animating = false;
        this.notifyObservers('complete');
    }

    applyCss(property, value) {
        this.dom.css(property, value);
    }

    stop() {
        this.dom.stop(true);
    }

    animate(pos, duration) {
        this.dom.stop(true);
        this.dom.animate({
            left: pos.x,
            top: pos.y
        }, duration, () => this.onAnimationComplete());
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        const idx = this.observers.indexOf(observer);
        this.observers.splice(idx, 1);
    }

    notifyObservers(event, data) {
        const args = Array.prototype.slice.call(arguments);
        args.splice(0, 0, this);
        for (let i = 0; i < this.observers.length; i++) {
            this.observers[i].notify.apply(this.observers[i], args);
        }
    }
}
