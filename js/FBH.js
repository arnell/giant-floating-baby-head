/**
 * Copyright 2022 Greg Arnell.
 **/

/*jslint node: true */
'use strict';

class FBH {
    /**
    * @param {Object[]} images image configs of images to display
    * @param {Object} timing
    * @param {String} timing.type
    * @param {Object} timing.data
    * @param {Number} hitHighScore
    * @param {String[]} disabledDomains
    */
    constructor(images, timing, hitHighScore, disabledDomains) {
        this.images = images;
        this.timing = timing;
        this.hitHighScore = hitHighScore;
        this.disabledDomains = disabledDomains;
        this.highScoreDisplay = new HighScoreDisplay();
        this.favIcon = new FavIcon();
        this.showingFavIcon = false;
        this.activeImages = {};
        this.nextAppearanceTimeoutId = null;
    }

    static MINUTE = 60000;
    static DAY = 86400000;
    static ANIMATION_DURATION = 3000;
    static ANIMATION_ROTATION_CHANCE = 80;
    static FAVICON_DURATION = 4000;
    static FAVICON_SWAP_CHANCE = 5;

    start() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if ('show-baby-head' === request) {
                this.triggerBabyHead();
            }
            sendResponse();
        });
        this.setBabyHeadTimeout();
    }

    triggerBabyHead() {
        clearTimeout(this.nextAppearanceTimeoutId);
        this.nextAppearanceTimeoutId = null;

        // Don't show under these circumstances
        if (this.activeImageExists() || !ChromeStorageHelper.isExtensionEnabled() || this.domainDisabled()) {
            return;
        }

        if (this.favIcon.isEnabled() && RandUtil.getRandBool(FBH.FAVICON_SWAP_CHANCE)) {
            this.showFavIconBabyHead();
        } else {
            this.showFloatingBabyHead();
        }
    }

    showFloatingBabyHead() {
        const imageIndex = RandUtil.getRand(this.images.length);
        const image = this.images[imageIndex];
        const floatingImage = new FloatingImage(image);

        floatingImage.addObserver(this);
        this.addActiveImage(floatingImage);
        if (floatingImage.imageLoaded) {
            this.onImageLoaded(floatingImage);
        } else {
            floatingImage.init()
                .then(() => this.onImageLoaded(floatingImage))
                .catch(() => this.onAnimationComplete(floatingImage));
        }
    }

    onImageLoaded(floatingImage) {
        const pos = this.calculateStartAndEndPositions(floatingImage.maxLength);
        let angle = 0;

        if (RandUtil.getRandBool(FBH.ANIMATION_ROTATION_CHANCE)) {
            angle = RandUtil.getRand(180) - 90;
        }
        floatingImage.show(pos, FBH.ANIMATION_DURATION, angle);

        ChromeStorageHelper.getItems(
            (items) => {
                this.highScoreDisplay.show(0, items.hitHighScore);
                this.hitHighScore = items.hitHighScore;
            },
            true
        );
    }

    showFavIconBabyHead() {
        const imageIndex = RandUtil.getRand(this.images.length);
        const image = this.images[imageIndex];
        const floatingImage = new FloatingImage(image);

        if (this.showingFavIcon) {
            return;
        }
        this.showingFavIcon = true;
        floatingImage.init()
            .then(() => {
                this.favIcon.display(image.url);
                setTimeout(() => {
                        this.favIcon.reset();
                        this.showingFavIcon = false;
                        this.setBabyHeadTimeout();
                    },
                    FBH.FAVICON_DURATION
                );
            })
            .catch(() => {
                this.showingFavIcon = false;
                this.setBabyHeadTimeout();
            });
    }

    setBabyHeadTimeout() {
        if (this.nextAppearanceTimeoutId) {
            return;
        }
        this.nextAppearanceTimeoutId = setTimeout(
            () => {
                this.nextAppearanceTimeoutId = null;
                this.triggerBabyHead();
            },
            this.getTimeout()
        );
    }

    notify(obj, event, data) {
        switch (event) {
            case 'complete':
                this.onAnimationComplete(obj, data);
                break;
            case 'click':
                this.onBabyHeadClick(obj, data);
                break;
        }
    }

    onAnimationComplete(floatingImage) {
        const hitCount = floatingImage.hitCount;

        this.removeActiveImage(floatingImage);
        floatingImage.removeObserver(this);
        this.highScoreDisplay.destroy();
        if (!this.activeImageExists()) {
            this.setBabyHeadTimeout();
        }
        if (hitCount) {
            ChromeStorageHelper.getItems(
                (items) => {
                    const hitHighScore = Math.max(items.hitHighScore, hitCount);
                    ChromeStorageHelper.setItems({
                        totalHits: items.totalHits + hitCount,
                        hitHighScore: hitHighScore
                    });
                    this.hitHighScore = hitHighScore;
                },
                true
            );
        }
    }

    addActiveImage(floatingImage) {
        if (this.activeImages[floatingImage.url]) {
            this.activeImages[floatingImage.url] += 1;
        } else {
            this.activeImages[floatingImage.url] = 1;
        }
    }

    removeActiveImage(floatingImage) {
        this.activeImages[floatingImage.url] -= 1;
        if (!this.activeImages[floatingImage.url]) {
            delete this.activeImages[floatingImage.url];
        }
    }

    activeImageExists() {
        return !!Object.keys(this.activeImages).length || this.showingFavIcon;
    }

    /**
     * Matches full domain against disabled domains setting.  Subdomains are considered a match as well.
     */
    domainDisabled() {
        return this.disabledDomains.some((value) => {
            let index = location.hostname.indexOf(value);
            return (index === 0 || (index > 0 && location.hostname[index-1] === '.'))
             && location.hostname.length - value.length === index;
        });
    }

    calculateStartAndEndPositions(maxLength) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const startSide = RandUtil.getRand(4); //0: top, 1: right, 2: bottom, 3: left
        const endSide = (startSide + 2) % 4;

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
    }

    getTimeout() {
        const timingType = this.timing && this.timing.type;
        switch (timingType) {
            case 'every':
                return this.timing.data * FBH.MINUTE;
            case 'at':
                const atTimeStr = this.timing.data.split(':');
                const atTime = new Date();
                atTime.setHours(atTimeStr[0]);
                atTime.setMinutes(atTimeStr[1]);
                atTime.setSeconds(0);
                const timeTil = atTime - new Date();
                if (timeTil < 0) {
                    timeTil += FBH.DAY;
                }
                return timeTil;
        }
        return (RandUtil.getRand(4) + 1) * 10 * FBH.MINUTE;
    }

    onBabyHeadClick(floatingImage, data) {
        const [, end] = this.calculateStartAndEndPositions(floatingImage.maxLength);
        this.highScoreDisplay.show(floatingImage.hitCount, this.hitHighScore);
        data.event.preventDefault();
        floatingImage.applyCss('-webkit-filter', this.getWebkitFilter());
        floatingImage.animate(end, FBH.ANIMATION_DURATION / 2);
    }

    getWebkitFilter() {
        const rand = RandUtil.getRand(4 + 11);
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
}
