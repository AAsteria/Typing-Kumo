// vars.js

// 初始化6列的堆叠高度为0
let segmentHeights = Array(6).fill(0); // 单位：像素

// 获取当前单词索引
let currentWordIndex = 0;
export function getCurrentWordIndex() {
    return currentWordIndex;
}
export function setCurrentWordIndex(index) {
    currentWordIndex = index;
}

// 获取活动单词计数
let activeWordsCount = 0;
export function getActiveWordsCount() {
    return activeWordsCount;
}
export function setActiveWordsCount(count) {
    activeWordsCount = count;
}

// 获取所有单词
let words = [];
export function getWords() {
    return words;
}
export function setWords(newWords) {
    words = newWords;
}

// 获取掉落间隔ID
let dropIntervalId = null;
export function getDropIntervalId() {
    return dropIntervalId;
}
export function setDropIntervalId(id) {
    dropIntervalId = id;
}

// 获取固定单词计数
let groundedWordsCount = 0;
export function getGroundedWordCount() {
    return groundedWordsCount;
}
export function setGroundedWordCount(count) {
    groundedWordsCount = count;
}

// 游戏是否暂停
let gamePaused = false;
export function isGamePaused() {
    return gamePaused;
}
export function setGamePaused(paused) {
    gamePaused = paused;
}

// 获取特定列的堆叠高度
export function getSegmentHeight(index) {
    if (index < 0 || index >= segmentHeights.length) return 0;
    return segmentHeights[index];
}

// 增加特定列的堆叠高度
export function increaseSegmentHeight(index, delta) {
    if (index < 0 || index >= segmentHeights.length) return;
    segmentHeights[index] += delta;
}

// 减少特定列的堆叠高度
export function decreaseSegmentHeight(index, delta) {
    if (index < 0 || index >= segmentHeights.length) return;
    segmentHeights[index] -= delta;
    if (segmentHeights[index] < 0) segmentHeights[index] = 0; // 防止负值
}

// 重置所有列的堆叠高度
export function resetSegmentHeights() {
    segmentHeights = Array(6).fill(0);
}

// if a word is active
let isTyping = false;

export function getIsTyping() {
    return isTyping;
}

export function setIsTyping(value) {
    isTyping = value;
}

