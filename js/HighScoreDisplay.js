/**
 * Copyright 2015. Greg Arnell.
 **/

/*jslint node: true */
"use strict";

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
