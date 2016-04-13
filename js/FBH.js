/**
 * Copyright 2016 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

/**
 * FBH Class Definition
 * @param {Object[]} images image configs of images to display
 * @param {Object} timing
 * @param {[[Type]]} timing.type
 * @param {[[Type]]} timing.data
 * @param {Number} hitHighScore
 */
function FBH(images, timing, hitHighScore) {
    var me = this;

    me.images = images;
    me.timing = timing;
    me.hitHighScore = hitHighScore;
    me.highScoreDisplay = new HighScoreDisplay();
    me.favIcon = new FavIcon();
}

FBH.prototype = {
    MINUTE: 60000,
    DAY: 86400000,
    ANIMATION_DURATION: 3000,
    ANIMATION_ROTATION_CHANCE: 80,
    FAVICON_DURATION: 4000,
    FAVICON_SWAP_CHANCE: 5,

    images: [],
    timing: null,
    favIcon: null,
    showingFavIcon: false,
    activeImages: {},
    highScoreDisplay: null,
    nextAppearanceTimeoutId: null,

    start: function () {
        var me = this;

        $(document.body).keypress(function (event) {
            if (event.ctrlKey && event.shiftKey && event.which === 6) {
                me.showBabyHead();
            }
        });
        me.setBabyHeadTimeout();
    },

    showBabyHead: function () {
        var me = this;

        clearTimeout(me.nextAppearanceTimeoutId);
        me.nextAppearanceTimeoutId = null;

        // Only allow one image at a time
        if (me.activeImageExists()) {
            return false;
        }

        if (me.favIcon.isEnabled() && RandUtil.getRandBool(me.FAVICON_SWAP_CHANCE)) {
            me.showFavIconBabyHead();
        } else {
            me.showFloatingBabyHead();
        }
    },

    showFloatingBabyHead: function () {
        var me = this,
            imageIndex = RandUtil.getRand(me.images.length),
            image = me.images[imageIndex],
            floatingImage = new FloatingImage(image),
            pos = me.calculateStartAndEndPositions(floatingImage.maxLength),
            angle = 0;

        floatingImage.addObserver(me);
        me.addActiveImage(floatingImage);
        if (floatingImage.imageLoaded) {
            me.onImageLoaded(floatingImage);
        } else {
            floatingImage.init(me.onImageLoaded.bind(me), me.onAnimationComplete.bind(me));
        }
    },

    onImageLoaded: function (floatingImage) {
        var me = this,
            pos = me.calculateStartAndEndPositions(floatingImage.maxLength),
            angle = 0;

        if (RandUtil.getRandBool(me.ANIMATION_ROTATION_CHANCE)) {
            angle = RandUtil.getRand(180) - 90;
        }
        floatingImage.show(pos, me.ANIMATION_DURATION, angle);

        ChromeStorageHelper.getItems(
            function (items) {
                me.highScoreDisplay.show(0, items.hitHighScore);
                me.hitHighScore = items.hitHighScore;
            },
            true
        );
    },

    showFavIconBabyHead: function () {
        var me = this,
            imageIndex = RandUtil.getRand(me.images.length),
            image = me.images[imageIndex],
            floatingImage = new FloatingImage(image);

        if (me.showingFavIcon) {
            return;
        }
        me.showingFavIcon = true;
        floatingImage.init(
            function () {
                me.favIcon.display(image.url);
                setTimeout(
                    function () {
                        me.favIcon.reset();
                        me.showingFavIcon = false;
                        me.setBabyHeadTimeout();
                    },
                    me.FAVICON_DURATION
                );
            },
            function () {
                me.showingFavIcon = false;
                me.setBabyHeadTimeout();
            }
        );
    },

    setBabyHeadTimeout: function () {
        var me = this;

        if (me.nextAppearanceTimeoutId) {
            return;
        }
        me.nextAppearanceTimeoutId = setTimeout(
            function () {
                me.nextAppearanceTimeoutId = null;
                me.showBabyHead();
            },
            me.getTimeout()
        );
    },

    notify: function (obj, event, data) {
        switch (event) {
            case 'complete':
                this.onAnimationComplete(obj, data);
                break;
            case 'click':
                this.onBabyHeadClick(obj, data);
                break;
        }
    },

    onAnimationComplete: function (floatingImage) {
        var me = this,
            hitCount = floatingImage.hitCount;

        me.removeActiveImage(floatingImage);
        floatingImage.removeObserver(me);
        me.highScoreDisplay.destroy();
        if (!me.activeImageExists()) {
            me.setBabyHeadTimeout();
        }
        if (hitCount) {
            ChromeStorageHelper.getItems(
                function (items) {
                    var hitHighScore = Math.max(items.hitHighScore, hitCount);
                    ChromeStorageHelper.setItems({
                        totalHits: items.totalHits + hitCount,
                        hitHighScore: hitHighScore
                    });
                    me.hitHighScore = hitHighScore;
                },
                true
            );
        }
    },

    addActiveImage: function (floatingImage) {
        var me = this;
        if (me.activeImages[floatingImage.url]) {
            me.activeImages[floatingImage.url] += 1;
        } else {
            me.activeImages[floatingImage.url] = 1;
        }
    },

    removeActiveImage: function (floatingImage) {
        var me = this;
        me.activeImages[floatingImage.url] -= 1;
        if (!me.activeImages[floatingImage.url]) {
            delete me.activeImages[floatingImage.url];
        }
    },

    activeImageExists: function () {
        return !!Object.keys(this.activeImages).length || this.showingFavIcon;
    },

    calculateStartAndEndPositions: function (maxLength) {
        var me = this,
            w = window.innerWidth,
            h = window.innerHeight,
            startSide = RandUtil.getRand(4), //0: top, 1: right, 2: bottom, 3: left
            endSide = (startSide + 2) % 4;

        if (startSide % 2) {
            return [
                {x: startSide > 1 ? -maxLength : w + maxLength / 2, y: RandUtil.getRand(h)},
                {x: endSide > 1 ?  -maxLength : w + maxLength / 2, y: RandUtil.getRand(h)}
            ];
        } else {
            return [
                {x: RandUtil.getRand(w), y: startSide < 1 ? -maxLength : h + maxLength / 2},
                {x: RandUtil.getRand(w), y: endSide < 1 ?  -maxLength : h + maxLength / 2}
            ];
        }
    },

    getTimeout: function () {
        var me = this,
            timingType = me.timing && me.timing.type,
            atTimeStr, atTime, timeTil;

        switch (timingType) {
            case 'every':
                return me.timing.data * me.MINUTE;
            case 'at':
                atTimeStr = me.timing.data.split(':');
                atTime = new Date();
                atTime.setHours(atTimeStr[0]);
                atTime.setMinutes(atTimeStr[1]);
                atTime.setSeconds(0);
                timeTil = atTime - new Date();
                if (timeTil < 0) {
                    timeTil += me.DAY;
                }
                return timeTil;
        }
        return (RandUtil.getRand(4) + 1) * 10 * me.MINUTE;
    },

    onBabyHeadClick: function (floatingImage, data) {
        var me = this,
            pos = me.calculateStartAndEndPositions(floatingImage.maxLength);

        me.highScoreDisplay.show(floatingImage.hitCount, me.hitHighScore);
        data.event.preventDefault();
        floatingImage.applyCss('-webkit-filter', me.getWebkitFilter());
        floatingImage.animate(pos[1], me.ANIMATION_DURATION / 2);
    },

    getWebkitFilter: function () {
        var rand = RandUtil.getRand(11 + 4);
        switch (rand) {
            case 0:
                return 'sepia(1)';
            case 1:
                return 'blur(2px)';
            case 2:
                return 'saturate(10)';
            case 3:
                return 'invert(100%)';
        }
        //11 different hues (30-330 deg)
        return 'hue-rotate(' + (rand - 3) * 30 + 'deg)';
    }
};
