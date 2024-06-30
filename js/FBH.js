// Copyright 2024 Greg Arnell.

/*jslint node: true */
'use strict';

class FBH {
    /**
    * @param {Object} config Configuration
    * @param {Object[]} config.images image configs of images to display
    * @param {Object} config.timing
    * @param {String} config.timing.type
    * @param {Object} config.timing.data
    * @param {Number} config.animationDuration
    * @param {Number} config.hitHighScore
    * @param {String[]} config.disabledDomains
    */
    constructor({images, timing, animationDuration, hitHighScore, disabledDomains}) {
        this.images = images;
        this.timing = timing;
        this.animationDuration = animationDuration;
        this.hitHighScore = hitHighScore;
        this.disabledDomains = disabledDomains;
        this.highScoreDisplay = new HighScoreDisplay();
        this.favIcon = new FavIcon();
        this.showingFavIcon = false;
        this.activeImages = {};
        this.nextAppearanceTimeoutId = null;
        this.nextAppearanceTime = null;
    }

    static MINUTE = 60000;
    static DAY = 86400000;
    static ANIMATION_ROTATION_CHANCE = 80;
    static FAVICON_SWAP_CHANCE = 5;

    start() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch(request) {
                case 'show-baby-head':
                    this.triggerBabyHead();
                    break;
                case 'options-updated':
                    this.reloadOptions();
                    break;
            }
            sendResponse();
        });
        this.setBabyHeadTimeout();
    }

    triggerBabyHead() {
        // Don't show under these circumstances
        if (this.activeImageExists() || !ChromeStorageHelper.isExtensionEnabled() || this.domainDisabled()) {
            return;
        }
        if (this.isTimeoutExpired(this.nextAppearanceTime)) {
            // Don't show but do reset the timeout
            this.setBabyHeadTimeout();
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
        floatingImage.show(pos, this.getAnimationDurationMs(), angle);

        ChromeStorageHelper.getItems()
            .then((items) => {
                this.highScoreDisplay.show(0, items.hitHighScore);
                this.hitHighScore = items.hitHighScore;
            });
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
                    this.getAnimationDurationMs()
                );
            })
            .catch(() => {
                this.showingFavIcon = false;
                this.setBabyHeadTimeout();
            });
    }

    setBabyHeadTimeout() {
        if (this.nextAppearanceTimeoutId) {
            clearTimeout(this.nextAppearanceTimeoutId);
            this.nextAppearanceTimeoutId = null;
            this.nextAppearanceTime = null
        }
        const timeout = this.getTimeout();
        this.nextAppearanceTimeoutId = setTimeout(
            () => {
                this.triggerBabyHead();
            },
            timeout
        );
        this.nextAppearanceTime = new Date().getTime() + timeout;
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
            ChromeStorageHelper.getItems()
                .then(
                    (items) => {
                        const hitHighScore = Math.max(items.hitHighScore, hitCount);
                        ChromeStorageHelper.setItems({
                            totalHits: items.totalHits + hitCount,
                            hitHighScore: hitHighScore
                        });
                        this.hitHighScore = hitHighScore;
                    }
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
            default:
                return (RandUtil.getRand(4) + 1) * 10 * FBH.MINUTE;
        }
    }

    onBabyHeadClick(floatingImage, data) {
        const [, end] = this.calculateStartAndEndPositions(floatingImage.maxLength);
        this.highScoreDisplay.show(floatingImage.hitCount, this.hitHighScore);
        data.event.preventDefault();
        floatingImage.applyCss('-webkit-filter', this.getWebkitFilter());
        floatingImage.animate(end, this.getAnimationDurationMs() / 2);
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

    isTimeoutExpired(expectedAppearanceTime) {
        if (!expectedAppearanceTime) {
            return false;
        }
        return new Date().getTime() - expectedAppearanceTime > FBH.MINUTE;
    }

    getAnimationDurationMs() {
        if (this.animationDuration.type === 'exact') {
            return this.animationDuration.data * 1000;
        } else if (this.animationDuration.type === 'random') {
            return RandUtil.getRand(45) * 100 + 500;
        }
    }

    reloadOptions() {
        ChromeStorageHelper.getItems()
            .then((items) => {
                this.timing = items.timing;
                this.animationDuration = items.animationDuration;
                this.images = items.images;
                this.disabledDomains = items.disabledDomains;
                this.setBabyHeadTimeout();
            });
    }
}
