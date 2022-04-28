// Copyright 2022 Greg Arnell.

/*jslint node: true */
'use strict';


class HighScoreDisplay {
    constructor() {
        this.scoreDisplayDiv = null;
        this.timeoutId = null;
    }

    show(value, highScore) {
        if (!$('#gfbh-score-display').length && value) {
            $('<div id="gfbh-score-display" title="Floating Baby Head Hit Count"><div id="gfbh-score"/><div id="gfbh-high-score"/></div>').appendTo('body');
            this.scoreDisplayDiv = $('#gfbh-score-display');
        }

        const scoreDiv = $('#gfbh-score');
        scoreDiv.text(value);
        const highScoreDiv = $('#gfbh-high-score');
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
    }

    destroy() {
        if (this.scoreDisplayDiv && !this.timeoutId) {
            this.timeoutId = setTimeout(() => {
                this.timeoutId = null;
                this.scoreDisplayDiv.animate({
                    opacity: 0
                }, 300, () => this.onDestroyAnimationComplete());
            }, 2000);
        }
    }

    onDestroyAnimationComplete() {
        $('#gfbh-score-display').remove();
        this.scoreDisplayDiv = null;
    }
}
