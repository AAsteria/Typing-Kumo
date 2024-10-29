// movement.js
import { wordHeight } from './main.js';
import { 
    getCurrentWordIndex, setCurrentWordIndex, 
    getActiveWordsCount, setActiveWordsCount, 
    getWords, getDropIntervalId, setDropIntervalId, 
    getGroundedWordCount, setGroundedWordCount,
    isGamePaused,
    getSegmentHeight, increaseSegmentHeight
} from './vars.js';
import { 
    lockDirectionCheckbox, 
    mirrorModeCheckbox, 
    upsideDownModeCheckbox 
} from './mode.js';
import { stopGame } from './main.js'; // 确保 main.js 导出 stopGame

const MAX_FONT_SIZE = 20;
const MIN_FONT_SIZE = 8;

let lastUsedSegment = -1;

/**
 * Starts the interval that drops words at specified intervals.
 */
export function startWordDropInterval() {
    const words = getWords();

    // Drop a word immediately if possible
    if (getCurrentWordIndex() < words.length && getActiveWordsCount() < 6) {
        dropWord(words[getCurrentWordIndex()]);
        setCurrentWordIndex(getCurrentWordIndex() + 1);
    }

    // Set up the interval for dropping subsequent words
    const intervalId = setInterval(() => {
        if (isGamePaused()) return; // Use getter function

        if (getCurrentWordIndex() < words.length && getActiveWordsCount() < 6) {
            dropWord(words[getCurrentWordIndex()]);
            setCurrentWordIndex(getCurrentWordIndex() + 1);
        }

        // Only clear the interval when all words have been processed and no active words remain
        if (getCurrentWordIndex() >= words.length && getActiveWordsCount() === 0) {
            clearInterval(intervalId);
            // Trigger final score display
            stopGame(); // Assuming stopGame can handle internal calculations
        }
    }, parseFloat(document.getElementById('delaySlider').value) * 1000); // Access delaySlider directly

    setDropIntervalId(intervalId); // Use setter function
}

/**
 * Restarts the word drop interval.
 */
export function restartWordDropInterval() {
    clearInterval(getDropIntervalId()); // Use getter function
    if (!isGamePaused()) { // Use getter function
        startWordDropInterval();
    }
}

/**
 * Resumes the movement of all active words.
 */
export function resumeWordMovements() {
    const gameContainer = document.getElementById('gameContainer');
    const movingWords = Array.from(
        gameContainer.getElementsByClassName('word')
    ).filter(word => !word.classList.contains('grounded') && !word.moveInterval);

    movingWords.forEach((word) => {
        const segmentWidth = gameContainer.clientWidth / 6;
        const leftPosition = parseFloat(word.style.left);
        const segmentIndex = Math.floor(leftPosition / segmentWidth);
        const direction = word.dataset.direction || 'down';

        switch (direction) {
            case 'down':
                moveWordDown(word, segmentIndex);
                break;
            case 'up':
                moveWordUp(word, segmentIndex);
                break;
            case 'left':
                moveWordLeft(word, segmentIndex);
                break;
            case 'right':
                moveWordRight(word, segmentIndex);
                break;
            default:
                moveWordDown(word, segmentIndex);
                break;
        }
    });
}

/**
 * Drops a word onto the game container.
 * @param {string} word - The word to drop.
 */
function dropWord(word) {
    const gameContainer = document.getElementById('gameContainer');
    const wordElement = document.createElement('div');
    wordElement.classList.add('word');
    wordElement.textContent = word;

    let positionIndex;
    const segmentCount = 6;

    do {
        positionIndex = Math.floor(Math.random() * segmentCount);
    } while (positionIndex === lastUsedSegment);

    lastUsedSegment = positionIndex;

    const segmentWidth = gameContainer.clientWidth / segmentCount;
    const leftPosition = positionIndex * segmentWidth;
    const topPosition = Math.random() * (gameContainer.clientHeight / 2);

    let direction = 'down';
    if (lockDirectionCheckbox.checked) {
        const directions = ['down', 'up', 'left', 'right'];
        direction = directions[Math.floor(Math.random() * directions.length)];
    } else {
        direction = 'down';
    }

    wordElement.dataset.direction = direction;

    let rotation = 0;
    switch (direction) {
        case 'down':
            wordElement.style.top = '0px';
            wordElement.style.left = `${leftPosition}px`;
            break;
        case 'up':
            wordElement.style.top = `${gameContainer.clientHeight - wordHeight}px`; // 使用动态 wordHeight
            wordElement.style.left = `${leftPosition}px`;
            rotation = 180;
            break;
        case 'left':
            wordElement.style.top = `${topPosition}px`;
            wordElement.style.left = '0px';
            rotation = -90;
            break;
        case 'right':
            wordElement.style.top = `${topPosition}px`;
            wordElement.style.left = `${gameContainer.clientWidth - wordHeight}px`; // 使用动态 wordHeight
            rotation = 90;
            break;
    }

    // Apply rotation
    if (rotation !== 0) {
        wordElement.style.transform = `rotate(${rotation}deg)`;
    } else {
        wordElement.style.transform = '';
    }

    // Apply mirror mode if checked
    if (mirrorModeCheckbox.checked) {
        wordElement.style.transform += ' scaleX(-1)';
    }

    // Apply upside-down mode if checked
    if (upsideDownModeCheckbox.checked) {
        wordElement.style.transform += ' rotate(180deg)';
    }

    // Set the width of the word element
    wordElement.style.width = `${segmentWidth - 4}px`;

    // Set initial font size
    wordElement.style.fontSize = `${MAX_FONT_SIZE}px`;

    // Optional: Set other necessary styles
    wordElement.style.position = 'absolute';
    wordElement.style.whiteSpace = 'nowrap';
    wordElement.style.overflow = 'hidden'; // Ensure overflow is hidden

    gameContainer.appendChild(wordElement);
    setActiveWordsCount(getActiveWordsCount() + 1); // Use setter function

    // Adjust fitTextToElement based on direction
    if (direction === 'left' || direction === 'right') {
        fitTextToElement(wordElement, segmentWidth - 4, MAX_FONT_SIZE, MIN_FONT_SIZE, true);
    } else {
        fitTextToElement(wordElement, segmentWidth - 4, MAX_FONT_SIZE, MIN_FONT_SIZE);
    }

    // Move the word based on direction
    switch (direction) {
        case 'down':
            moveWordDown(wordElement, positionIndex);
            break;
        case 'up':
            moveWordUp(wordElement, positionIndex);
            break;
        case 'left':
            moveWordLeft(wordElement, positionIndex);
            break;
        case 'right':
            moveWordRight(wordElement, positionIndex);
            break;
    }
}

/**
 * Adjusts the font size of the text to fit within the element.
 * @param {HTMLElement} element - The DOM element containing the text.
 * @param {number} maxWidth - The maximum width in pixels.
 * @param {number} maxFontSize - The maximum font size in pixels.
 * @param {number} minFontSize - The minimum font size in pixels.
 * @param {boolean} isHorizontal - Whether the text is horizontal.
 */
function fitTextToElement(element, maxWidth, maxFontSize, minFontSize, isHorizontal = false) {
    let fontSize = maxFontSize;
    element.style.fontSize = `${fontSize}px`;

    const originalWhiteSpace = element.style.whiteSpace;
    element.style.whiteSpace = 'nowrap';

    while (element.scrollWidth > maxWidth && fontSize > minFontSize) {
        fontSize -= 1;
        element.style.fontSize = `${fontSize}px`;
    }

    element.style.whiteSpace = originalWhiteSpace;

    if (fontSize === minFontSize && element.scrollWidth > maxWidth) {
        element.classList.add('text-overflow');
    } else {
        element.classList.remove('text-overflow');
    }
}

/**
 * Moves a word downward.
 * @param {HTMLElement} wordElement - The word element to move.
 * @param {number} segmentIndex - The index of the segment the word is in.
 */
export function moveWordDown(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10); // Access speedSlider directly
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return; // Use getter function

        const currentTop = parseFloat(wordElement.style.top);
        const nextTop = currentTop + speed / 10;

        const gameContainer = document.getElementById('gameContainer');
        const containerHeight = gameContainer.clientHeight;

        if (
            nextTop + wordHeight >= containerHeight ||
            checkCollisionWithGroundedWord(wordElement, nextTop, segmentIndex, direction)
        ) {
            const finalTop = Math.min(
                nextTop,
                getNextGroundedPosition(segmentIndex, direction)
            );

            wordElement.style.top = `${finalTop}px`;
            wordReachedBottom(wordElement); // Call landing function
        } else {
            wordElement.style.top = `${nextTop}px`;
        }

        focusClosestWord();
    }, 10);
}

/**
 * Moves a word upward.
 * @param {HTMLElement} wordElement - The word element to move.
 * @param {number} segmentIndex - The index of the segment the word is in.
 */
export function moveWordUp(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return; // Use getter function

        const currentTop = parseFloat(wordElement.style.top);
        const nextTop = currentTop - speed / 10;

        const gameContainer = document.getElementById('gameContainer');
        const containerHeight = gameContainer.clientHeight;

        if (
            nextTop <= 0 ||
            checkCollisionWithGroundedWord(wordElement, nextTop, segmentIndex, direction)
        ) {
            const finalTop = Math.max(
                nextTop,
                getNextGroundedPosition(segmentIndex, direction)
            );

            wordElement.style.top = `${finalTop}px`;
            wordReachedBottom(wordElement); // Call landing function
        } else {
            wordElement.style.top = `${nextTop}px`;
        }

        focusClosestWord();
    }, 10);
}

/**
 * Moves a word to the left.
 * @param {HTMLElement} wordElement - The word element to move.
 * @param {number} segmentIndex - The index of the segment the word is in.
 */
export function moveWordLeft(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return; // Use getter function

        const currentLeft = parseFloat(wordElement.style.left);
        const nextLeft = currentLeft + speed / 10;

        const gameContainer = document.getElementById('gameContainer');
        const containerWidth = gameContainer.clientWidth;

        if (
            nextLeft + wordElement.offsetWidth >= containerWidth ||
            checkCollisionWithGroundedWord(wordElement, nextLeft, segmentIndex, direction)
        ) {
            const finalLeft = Math.min(
                nextLeft,
                getNextGroundedPosition(segmentIndex, direction) - wordHeight
            );

            wordElement.style.left = `${finalLeft}px`;
            wordReachedBottom(wordElement); // Call landing function
        } else {
            wordElement.style.left = `${nextLeft}px`;
        }

        focusClosestWord();
    }, 10);
}

/**
 * Moves a word to the right.
 * @param {HTMLElement} wordElement - The word element to move.
 * @param {number} segmentIndex - The index of the segment the word is in.
 */
export function moveWordRight(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return; // Use getter function

        const currentLeft = parseFloat(wordElement.style.left);
        const nextLeft = currentLeft - speed / 10;

        const gameContainer = document.getElementById('gameContainer');
        const containerWidth = gameContainer.clientWidth;

        if (
            nextLeft <= 0 ||
            checkCollisionWithGroundedWord(wordElement, nextLeft, segmentIndex, direction)
        ) {
            const finalLeft = Math.max(
                nextLeft,
                getNextGroundedPosition(segmentIndex, direction) + wordHeight
            );

            wordElement.style.left = `${finalLeft}px`;
            wordElement.classList.add('grounded');
            clearInterval(wordElement.moveInterval); // Stop moving
            wordElement.moveInterval = null; // Remove reference
            document.getElementById('userInput').value = ''; // Clear input box

            setActiveWordsCount(getActiveWordsCount() - 1); // Use setter function
            setGroundedWordCount(getGroundedWordCount() + 1);

            // Check if all words have been processed
            if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
                clearInterval(getDropIntervalId()); // Use getter function
                stopGame(); // Assuming stopGame handles calculations
            }
        } else {
            wordElement.style.left = `${nextLeft}px`;
        }

        focusClosestWord();
    }, 10);
}

/**
 * Checks for collision with grounded words.
 * @param {HTMLElement} wordElement - The word element to check.
 * @param {number} nextPosition - The next position to check (top or left based on direction).
 * @param {number} segmentIndex - The index of the segment the word is in.
 * @param {string} direction - The direction of movement.
 * @returns {boolean} True if collision occurs, otherwise false.
 */
function checkCollisionWithGroundedWord(wordElement, nextPosition, segmentIndex, direction) {
    const gameContainer = document.getElementById('gameContainer');
    const segmentWidth = gameContainer.clientWidth / 6;
    const segmentHeight = gameContainer.clientHeight / 6; // Assuming segment height is one-sixth of clientHeight

    // Get grounded words in the same segment and direction
    const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
        (word) => {
            const wordDirection = word.dataset.direction;
            if (wordDirection !== direction) return false; // Only consider same direction

            switch (direction) {
                case 'down':
                case 'up':
                    const left = parseFloat(word.style.left);
                    return left >= segmentIndex * segmentWidth && left < (segmentIndex + 1) * segmentWidth;
                case 'left':
                case 'right':
                    const top = parseFloat(word.style.top);
                    return top >= segmentIndex * segmentHeight && top < (segmentIndex + 1) * segmentHeight;
                default:
                    return false;
            }
        }
    );

    return wordsInSegment.some((otherWord) => {
        const otherPosition = direction === 'down' || direction === 'up'
            ? parseFloat(otherWord.style.top)
            : parseFloat(otherWord.style.left);

        if (direction === 'down') {
            return nextPosition + wordHeight >= otherPosition;
        } else if (direction === 'up') {
            return nextPosition <= otherPosition + wordHeight;
        } else if (direction === 'left') {
            return nextPosition + wordElement.offsetWidth >= otherPosition;
        } else if (direction === 'right') {
            return nextPosition <= otherPosition + wordElement.offsetWidth;
        }
        return false;
    });
}

/**
 * Determines the next grounded position based on existing grounded words.
 * @param {number} segmentIndex - The index of the segment the word is in.
 * @param {string} direction - The direction of movement.
 * @returns {number} The next grounded position.
 */
function getNextGroundedPosition(segmentIndex, direction) {
    const gameContainer = document.getElementById('gameContainer');
    const segmentWidth = gameContainer.clientWidth / 6;
    const segmentHeight = gameContainer.clientHeight / 6; // Assuming segment height is one-sixth of clientHeight

    const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
        (word) => {
            const wordDirection = word.dataset.direction;
            if (wordDirection !== direction) return false; // Only consider same direction

            switch (direction) {
                case 'down':
                case 'up':
                    const left = parseFloat(word.style.left);
                    return left >= segmentIndex * segmentWidth && left < (segmentIndex + 1) * segmentWidth;
                case 'left':
                case 'right':
                    const top = parseFloat(word.style.top);
                    return top >= segmentIndex * segmentHeight && top < (segmentIndex + 1) * segmentHeight;
                default:
                    return false;
            }
        }
    );

    if (wordsInSegment.length === 0) {
        return direction === 'down' || direction === 'right' 
            ? (direction === 'down' ? gameContainer.clientHeight : gameContainer.clientWidth)
            : 0;
    } else {
        if (direction === 'down') {
            const topPositions = wordsInSegment.map((word) => parseFloat(word.style.top));
            return Math.min(...topPositions) - wordHeight;
        } else if (direction === 'up') {
            const topPositions = wordsInSegment.map((word) => parseFloat(word.style.top));
            return Math.max(...topPositions) + wordHeight;
        } else if (direction === 'left') {
            const leftPositions = wordsInSegment.map((word) => parseFloat(word.style.left));
            return Math.min(...leftPositions) - wordHeight;
        } else if (direction === 'right') {
            const leftPositions = wordsInSegment.map((word) => parseFloat(word.style.left));
            return Math.max(...leftPositions) + wordHeight;
        }
    }
}

/**
 * Handles the event when a word reaches its bottom or collides.
 * @param {HTMLElement} wordElement - The word element that reached the bottom.
 */
function wordReachedBottom(wordElement) {
    wordElement.classList.add('grounded');
    clearInterval(wordElement.moveInterval);
    wordElement.moveInterval = null;
    document.getElementById('userInput').value = ''; // 清空输入框

    setActiveWordsCount(getActiveWordsCount() - 1); // 使用 setter
    setGroundedWordCount(getGroundedWordCount() + 1); // 使用 setter

    const gameContainer = document.getElementById('gameContainer');
    const segmentWidth = gameContainer.clientWidth / 6;
    const segmentIndex = Math.floor(parseFloat(wordElement.style.left) / segmentWidth);

    // 增加该列的堆叠高度
    increaseSegmentHeight(segmentIndex, wordHeight);
    console.log(`Segment ${segmentIndex} height increased to ${getSegmentHeight(segmentIndex)}px`);

    // 获取容器的高度
    const containerHeight = gameContainer.clientHeight;
    console.log(`Container height: ${containerHeight}px`);

    // 获取当前列的堆叠高度
    const currentHeight = getSegmentHeight(segmentIndex);
    console.log(`Current segment height: ${currentHeight}px`);

    // 检查是否达到或超过容器高度
    if (currentHeight >= containerHeight) {
        console.log(`Segment ${segmentIndex} reached container height. Ending game.`);
        clearInterval(getDropIntervalId()); // 清除掉落间隔
        stopGame(); // 显示最终得分
        stopGame(); // 停止游戏
        return; // 立即退出函数，防止继续执行
    }

    // 检查是否所有单词都已处理完毕
    if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
        clearInterval(getDropIntervalId());
        stopGame();
    }
}

/**
 * Focuses on the closest active word to the bottom (for user to type).
 */
export function focusClosestWord() {
    const gameContainer = document.getElementById('gameContainer');
    const wordsOnScreen = Array.from(gameContainer.getElementsByClassName('word'));
    let closestWord = null;
    let closestDistance = Infinity;

    wordsOnScreen.forEach((word) => {
        const distanceToBottom = gameContainer.clientHeight - parseFloat(word.style.top);
        if (!word.classList.contains('grounded') && distanceToBottom < closestDistance) {
            closestDistance = distanceToBottom;
            closestWord = word;
        }
    });

    wordsOnScreen.forEach((word) => word.classList.remove('active'));
    if (closestWord) closestWord.classList.add('active');
}
