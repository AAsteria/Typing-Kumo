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
import { stopGame } from './main.js';

const MAX_FONT_SIZE = 20;
const MIN_FONT_SIZE = 8;

let lastUsedSegment = -1;

export function startWordDropInterval() {
    const words = getWords();

    if (getCurrentWordIndex() < words.length && getActiveWordsCount() < 6) {
        dropWord(words[getCurrentWordIndex()]);
        setCurrentWordIndex(getCurrentWordIndex() + 1);
    }

    const intervalId = setInterval(() => {
        if (isGamePaused()) return;

        if (getCurrentWordIndex() < words.length && getActiveWordsCount() < 6) {
            dropWord(words[getCurrentWordIndex()]);
            setCurrentWordIndex(getCurrentWordIndex() + 1);
        }

        if (getCurrentWordIndex() >= words.length && getActiveWordsCount() === 0) {
            clearInterval(intervalId);
            stopGame();
        }
    }, parseFloat(document.getElementById('delaySlider').value) * 1000);

    setDropIntervalId(intervalId);
}

export function restartWordDropInterval() {
    clearInterval(getDropIntervalId());
    if (!isGamePaused()) {
        startWordDropInterval();
    }
}

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
            wordElement.style.top = `${gameContainer.clientHeight - wordHeight}px`;
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
            wordElement.style.left = `${gameContainer.clientWidth - wordHeight}px`;
            rotation = 90;
            break;
    }

    if (rotation !== 0) {
        wordElement.style.transform = `rotate(${rotation}deg)`;
    } else {
        wordElement.style.transform = '';
    }

    if (mirrorModeCheckbox.checked) {
        wordElement.style.transform += ' scaleX(-1)';
    }

    if (upsideDownModeCheckbox.checked) {
        wordElement.style.transform += ' rotate(180deg)';
    }

    wordElement.style.width = `${segmentWidth - 4}px`;
    wordElement.style.fontSize = `${MAX_FONT_SIZE}px`;
    wordElement.style.position = 'absolute';
    wordElement.style.whiteSpace = 'nowrap';
    wordElement.style.overflow = 'hidden';

    gameContainer.appendChild(wordElement);
    setActiveWordsCount(getActiveWordsCount() + 1);

    if (direction === 'left' || direction === 'right') {
        fitTextToElement(wordElement, segmentWidth - 4, MAX_FONT_SIZE, MIN_FONT_SIZE, true);
    } else {
        fitTextToElement(wordElement, segmentWidth - 4, MAX_FONT_SIZE, MIN_FONT_SIZE);
    }

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

export function moveWordDown(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return;

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
            wordReachedBottom(wordElement);
        } else {
            wordElement.style.top = `${nextTop}px`;
        }

        focusClosestWord();
    }, 10);
}

export function moveWordUp(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return;

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
            wordReachedBottom(wordElement);
        } else {
            wordElement.style.top = `${nextTop}px`;
        }

        focusClosestWord();
    }, 10);
}

export function moveWordLeft(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return;

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
            wordReachedBottom(wordElement);
        } else {
            wordElement.style.left = `${nextLeft}px`;
        }

        focusClosestWord();
    }, 10);
}

export function moveWordRight(wordElement, segmentIndex) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);
    const direction = wordElement.dataset.direction;

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return;

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
            clearInterval(wordElement.moveInterval);
            wordElement.moveInterval = null;
            document.getElementById('userInput').value = '';

            setActiveWordsCount(getActiveWordsCount() - 1);
            setGroundedWordCount(getGroundedWordCount() + 1);

            if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
                clearInterval(getDropIntervalId());
                stopGame();
            }
        } else {
            wordElement.style.left = `${nextLeft}px`;
        }

        focusClosestWord();
    }, 10);
}

function checkCollisionWithGroundedWord(wordElement, nextPosition, segmentIndex, direction) {
    const gameContainer = document.getElementById('gameContainer');
    const segmentWidth = gameContainer.clientHeight / 6;
    const segmentHeight = gameContainer.clientHeight / 6;

    const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
        (word) => {
            const wordDirection = word.dataset.direction;
            if (wordDirection !== direction) return false;

            switch (direction) {
                case 'down':
                case 'up':
                    const left = parseFloat(word.style.left);
                    const segmentWidth = gameContainer.clientWidth / 6;
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

function getNextGroundedPosition(segmentIndex, direction) {
    const gameContainer = document.getElementById('gameContainer');
    const segmentWidth = gameContainer.clientWidth / 6;
    const segmentHeight = gameContainer.clientHeight / 6;

    const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
        (word) => {
            const wordDirection = word.dataset.direction;
            if (wordDirection !== direction) return false;

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
        } else if (direction === 'right') {
            const leftPositions = wordsInSegment.map((word) => parseFloat(word.style.left));
            return Math.min(...leftPositions) - wordHeight;
        } else if (direction === 'left') {
            const leftPositions = wordsInSegment.map((word) => parseFloat(word.style.left));
            return Math.max(...leftPositions) + wordHeight;
        }
    }
}

function wordReachedBottom(wordElement) {
    if (lockDirectionCheckbox.checked) {
        if (wordElement.moveInterval) {
            clearInterval(wordElement.moveInterval);
            wordElement.moveInterval = null;
        }
        wordElement.remove();
        setActiveWordsCount(getActiveWordsCount() - 1);
        if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
            clearInterval(getDropIntervalId());
            stopGame();
        }
    } else {
        wordElement.classList.add('grounded');
        clearInterval(wordElement.moveInterval);
        wordElement.moveInterval = null;
        document.getElementById('userInput').value = '';

        setActiveWordsCount(getActiveWordsCount() - 1);
        setGroundedWordCount(getGroundedWordCount() + 1);

        const gameContainer = document.getElementById('gameContainer');
        const segmentWidth = gameContainer.clientWidth / 6;
        const segmentIndex = Math.floor(parseFloat(wordElement.style.left) / segmentWidth);

        increaseSegmentHeight(segmentIndex, wordHeight);
        console.log(`Segment ${segmentIndex} height increased to ${getSegmentHeight(segmentIndex)}px`);

        const containerHeight = gameContainer.clientHeight;
        console.log(`Container height: ${containerHeight}px`);

        const currentHeight = getSegmentHeight(segmentIndex);
        console.log(`Current segment height: ${currentHeight}px`);

        if (currentHeight >= containerHeight) {
            console.log(`Segment ${segmentIndex} reached container height. Ending game.`);
            clearInterval(getDropIntervalId());
            stopGame();
            return;
        }

        if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
            clearInterval(getDropIntervalId());
            stopGame();
        }
    }
}

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
