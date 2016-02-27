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

/**
 * High Score Display Class definition
 */
function HighScoreDisplay() {}
HighScoreDisplay.prototype = {
    scoreDisplayDiv: null,
    timeoutId: null,

    show: function (value, highScore) {
        var scoreDiv, highScoreDiv;
        
        if (!$('#gfbh-score-display').length && value) {
            $('<div id="gfbh-score-display" title="Floating Baby Head Hit Count"><div id="gfbh-score"/><div id="gfbh-high-score"/></div>').appendTo("body");
            this.scoreDisplayDiv = $('#gfbh-score-display');
        }
        
        scoreDiv = $('#gfbh-score');
        scoreDiv.text(value);
        highScoreDiv = $('#gfbh-high-score');
        highScoreDiv.text('High Score: ' + highScore);
        if (value > highScore) {
            scoreDiv.addClass('gfbh-is-high-score');
        } else {
            scoreDiv.removeClass('gfbh-is-high-score');
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    },
    destroy: function () {
        var me = this;
        if (me.scoreDisplayDiv) {
            me.timeoutId = setTimeout(function () {
                me.timeoutId = null;
                me.scoreDisplayDiv.animate({
                    opacity: 0
                }, 300, me.onDestroyAnimationComplete.bind(me));
            }, 2000);
        }
    },
    onDestroyAnimationComplete: function () {
        $('#gfbh-score-display').remove();
        this.scoreDisplayDiv = null;
    }
};


/**
 * FBH Class Definition
 * @param {String} imageUrl Url of image to display
 * @param {Object} timing 
 * @param {[[Type]]} timing.type
 * @param {[[Type]]} timing.data
 * @param {Number} hitHighScore
 */
function FBH(imageUrl, timing, hitHighScore) {
    this.imageUrl = imageUrl;
    this.timing = timing;
    this.hitHighScore = hitHighScore;
    this.highScoreDisplay = new HighScoreDisplay();
}
FBH.prototype = {
    MINUTE: 60000,
    DAY: 86400000,
    ANIMATION_DURATION: 3000,
    ANIMATION_ROTATION_CHANCE: 70,
    FAVICON_DURATION: 4000,
    FAVICON_SWAP_CHANCE: 5,
    
    imageUrl: null,
    timing: null,
    maxLength: 0,
    height: 0,
    favIcon: null,
    imageLoaded: false,
    showingBaby: false,
    hitCount: 0,
    highScoreDisplay: null,
    
    start: function () {
        var me = this,
            image = new Image();
        
        image.onload = function () {
            me.maxLength = Math.max(this.width, this.height);
            me.height = this.height;
            setTimeout(
                function () { me.showBabyHead(); },
                me.getTimeout()
            );
            me.favIcon = new FavIcon(me.imageUrl);
            me.imageLoaded = true;
            $(document.body).keypress(function (event) {
                if (event.ctrlKey && event.shiftKey && event.which === 6) {
                    me.showBabyHead();
                }
            });
            $(document.body).on('mousedown', '#floating-baby-head', function () {
                me.onBabyHeadClick.apply(me, arguments);
            });
        };
        image.src = me.imageUrl;
    },
    
    showBabyHead: function () {
        var me = this;
        
        if (!me.imageLoaded || me.showingBaby) {
            me.setBabyHeadTimeout();
            return false;
        }
        
        if (me.favIcon.isEnabled() && me.getRandBool(me.FAVICON_SWAP_CHANCE)) {
            me.showFavIconBabyHead();
        }
        else {
            me.showFloatingBabyHead();
        }
    },
    
    showFloatingBabyHead: function () {
        var me = this,
            babyHeadImg,
            pos = me.calculateStartAndEndPositions();

        me.showingBaby = true;
        me.hitCount = 0;
        $('<img id="floating-baby-head" height="' + this.height + '" src="' + me.imageUrl + '"/>').appendTo("body");
        babyHeadImg = $("#floating-baby-head");
        babyHeadImg.css({
            left: pos[0].x,
            top: pos[0].y
        });
        babyHeadImg.animate({
            left: pos[1].x,
            top: pos[1].y
        }, me.ANIMATION_DURATION, me.onAnimationComplete.bind(me));
        if (me.getRandBool(me.ANIMATION_ROTATION_CHANCE)) {
            babyHeadImg.animateRotate(me.getRand(180) - 90, {
                duration: me.ANIMATION_DURATION,
                easing: me.getRandBool() ? 'linear' : 'swing'
            });
        }
        chrome.storage.sync.get(
            {
                hitHighScore: 0
            },
            function (items) {
                me.highScoreDisplay.show(0, items.hitHighScore);
                me.hitHighScore = items.hitHighScore;
            }
        );
        me.setBabyHeadTimeout();
    },
    
    showFavIconBabyHead: function () {
        var me = this;
        
        me.showingBaby = true;
        me.favIcon.display();
        setTimeout(
            function () {
                me.favIcon.reset();
                me.showingBaby = false;
            },
            me.FAVICON_DURATION
        );
        me.setBabyHeadTimeout();
    },
    
    setBabyHeadTimeout: function () {
        var me = this;
        
        setTimeout(
            function () {
                me.showBabyHead();
            },
            me.getTimeout()
        );
    },
    
    onAnimationComplete: function () {
        var me = this,
            hitCount = me.hitCount;
        
        $("#floating-baby-head").remove();
        me.showingBaby = false;
        me.highScoreDisplay.destroy();
        chrome.storage.sync.get(
            {
                hitHighScore: 0,
                totalHits: 0
            },
            function (items) {
                var hitHighScore = items.hitHighScore;
                if (hitCount > hitHighScore) {
                    hitHighScore = hitCount;
                }
                chrome.storage.sync.set({
                    totalHits: items.totalHits + me.hitCount,
                    hitHighScore: hitHighScore
                });
                me.hitHighScore = hitHighScore;
            }
        );
    },

    calculateStartAndEndPositions: function () {
        var me = this,
            w = window.innerWidth,
            h = window.innerHeight,
            startSide = me.getRand(4), //0: top, 1: right, 2: bottom, 3: left
            endSide = (startSide + 2) % 4;

        if (startSide % 2) {
            return [
                {x: startSide > 1 ? -me.maxLength : w + me.maxLength / 2, y: me.getRand(h)},
                {x: endSide > 1 ?  -me.maxLength : w + me.maxLength / 2, y: me.getRand(h)}
            ];
        }
        else {
            return [
                {x: me.getRand(w), y: startSide < 1 ? -me.maxLength : h + me.maxLength / 2},
                {x: me.getRand(w), y: endSide < 1 ?  -me.maxLength : h + me.maxLength / 2}
            ];
        }
    },
    
    
    getTimeout: function () {
        var me = this,
            timingType = me.timing && me.timing.type,
            atTimeStr, atTime, timeTil;

        switch (timingType) {
            case "every":
                return me.timing.data * me.MINUTE;
            case "at":
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
            case "random":
            default:
                return (me.getRand(4) + 1) * 10 * me.MINUTE;
        }
    },

    /**
     * Returns a random integer from 0 to options-1
     * @param {Integer} options How many options to pick from (e.g. 4 would return 0, 1, 2, or 3)
     **/
    getRand: function (options) {
        return Math.floor(Math.random() * options);
    },

    /**
     * Returns random bool.
     * @param {Integer} [chance] The percentage chance the result will be true. Defaults to 50.
     **/
    getRandBool: function (chance) {
        if (!chance && chance !== 0) {
            chance = 50;
        }
        return this.getRand(101) <= chance;
    },
    
    onBabyHeadClick: function (event) {
        var me = this,
            babyHeadImg = $("#floating-baby-head"),
            pos = me.calculateStartAndEndPositions();
        
        me.highScoreDisplay.show(++me.hitCount, me.hitHighScore);
        event.preventDefault();
        babyHeadImg.css('-webkit-filter', me.getWebkitFilter());
        babyHeadImg.stop(true);
        babyHeadImg.animate({
            left: pos[1].x,
            top: pos[1].y
        }, me.ANIMATION_DURATION/2, me.onAnimationComplete.bind(me));
    },
    
    getWebkitFilter: function () {
        var rand = this.getRand(11+4);
        switch(rand) {
            case 0:
                return 'sepia(1)';
            case 1:
                return 'blur(2px)';
            case 2:
                return 'saturate(10)';
            case 3:
                return 'invert(100%)';
        }
        return 'hue-rotate(' + (rand - 3) * 30 + 'deg)';
    }
};

/**
 * Setup
 */

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


