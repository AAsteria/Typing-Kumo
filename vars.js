// vars.js

// Private variables
let words = [];
let activeWordsCount = 0;
let currentWordIndex = 0;
let dropIntervalId = null;
let gamePaused = false;
let groundedWordsCount = 0;

/**
 * Gets the current array of words.
 * @returns {Array} The words array.
 */
export function getWords() {
    return words;
}

/**
 * Sets the array of words.
 * @param {Array} newWords - The new array of words.
 */
export function setWords(newWords) {
    words = newWords;
}

/**
 * Gets the current word index.
 * @returns {number} The current word index.
 */
export function getCurrentWordIndex() {
    return currentWordIndex;
}

/**
 * Sets the current word index.
 * @param {number} index - The new current word index.
 */
export function setCurrentWordIndex(index) {
    currentWordIndex = index;
}

/**
 * Gets the count of active words.
 * @returns {number} The active words count.
 */
export function getActiveWordsCount() {
    return activeWordsCount;
}

/**
 * Sets the count of active words.
 * @param {number} count - The new active words count.
 */
export function setActiveWordsCount(count) {
    activeWordsCount = count;
}

/**
 * Gets the drop interval ID.
 * @returns {number|null} The drop interval ID.
 */
export function getDropIntervalId() {
    return dropIntervalId;
}

/**
 * Sets the drop interval ID.
 * @param {number} id - The new drop interval ID.
 */
export function setDropIntervalId(id) {
    dropIntervalId = id;
}

/**
 * Checks if the game is paused.
 * @returns {boolean} True if the game is paused, otherwise false.
 */
export function isGamePaused() {
    return gamePaused;
}

/**
 * Sets the game paused state.
 * @param {boolean} paused - The new paused state.
 */
export function setGamePaused(paused) {
    gamePaused = paused;
}

/**
 * Gets the count of grounded words.
 * @returns {number} The grounded words count.
 */
export function getGroundedWordCount() {
    return groundedWordsCount;
}

/**
 * Sets the count of grounded words.
 * @param {number} count - The new grounded words count.
 */
export function setGroundedWordCount(count) {
    groundedWordsCount = count;
}