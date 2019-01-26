/**
 * Copyright 2019 Greg Arnell.
 **/

function RandUtil() {}

/**
 * Returns a random integer from 0 to options-1
 * @param {Integer} options How many options to pick from (e.g. 4 would return 0, 1, 2, or 3)
 **/
RandUtil.getRand = function (options) {
    return Math.floor(Math.random() * options);
};

/**
 * Returns random bool.
 * @param {Integer} [chance] The percentage chance the result will be true. Defaults to 50.
 **/
RandUtil.getRandBool = function (chance) {
    if (!chance && chance !== 0) {
        chance = 50;
    }
    return this.getRand(101) <= chance;
};
