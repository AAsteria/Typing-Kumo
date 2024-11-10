// movement.js
import { wordHeight } from './main.js';
import { 
    getCurrentWordIndex, setCurrentWordIndex, 
    getActiveWordsCount, setActiveWordsCount, 
    getWords, getDropIntervalId, setDropIntervalId, 
    getGroundedWordCount, setGroundedWordCount,
    isGamePaused,
    getSegmentHeight, increaseSegmentHeight,
    getIsTyping,
    setIsTyping
} from './vars.js';
import { 
    lockDirectionCheckbox, 
    mirrorModeCheckbox, 
    upsideDownModeCheckbox,
    memoryModeCheckbox
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

        moveWord(word, segmentIndex, direction);
    });
}

function dropWord(word) {
    const gameContainer = document.getElementById('gameContainer');
    const wordElement = document.createElement('div');
    wordElement.classList.add('word');

    wordElement.dataset.originalText = word;

    if (memoryMode) {
        console.log("moemory mode");
        wordElement.textContent = '?'.repeat(word.length);
    } else {
        wordElement.textContent = word;
    }

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
            wordElement.style.left = `${gameContainer.clientWidth - wordElement.offsetWidth}px`;
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

    fitTextToElement(wordElement, segmentWidth - 4, MAX_FONT_SIZE, MIN_FONT_SIZE);

    const segmentIndex = positionIndex;

    moveWord(wordElement, segmentIndex, direction);
}

function fitTextToElement(element, maxWidth, maxFontSize, minFontSize) {
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

function moveWord(wordElement, segmentIndex, direction) {
    const speed = parseInt(document.getElementById('speedSlider').value, 10);

    if (wordElement.moveInterval) return;

    wordElement.moveInterval = setInterval(() => {
        if (isGamePaused()) return;

        const gameContainer = document.getElementById('gameContainer');

        let currentPos, nextPos, containerLimit, wordSize;

        if (direction === 'down' || direction === 'up') {
            currentPos = parseFloat(wordElement.style.top);
            wordSize = wordHeight;
            containerLimit = gameContainer.clientHeight;
        } else {
            currentPos = parseFloat(wordElement.style.left);
            wordSize = wordElement.offsetWidth;
            containerLimit = gameContainer.clientWidth;
        }

        let increment = speed / 10;

        if (direction === 'up' || direction === 'right') {
            increment = -increment;
        }

        nextPos = currentPos + increment;

        let collision = checkCollisionWithGroundedWord(wordElement, nextPos, segmentIndex, direction);

        let reachedEnd = false;

        if (direction === 'down' || direction === 'left') {
            if (nextPos + wordSize >= containerLimit || collision) {
                reachedEnd = true;
            }
        } else if (direction === 'up' || direction === 'right') {
            if (nextPos <= 0 || collision) {
                reachedEnd = true;
            }
        }

        if (reachedEnd) {
            const finalPos = direction === 'down' || direction === 'left'
                ? Math.min(nextPos, getNextGroundedPosition(segmentIndex, direction) - wordSize)
                : Math.max(nextPos, getNextGroundedPosition(segmentIndex, direction) + wordSize);

            if (direction === 'down' || direction === 'up') {
                wordElement.style.top = `${finalPos}px`;
            } else {
                wordElement.style.left = `${finalPos}px`;
            }

            wordReachedBottom(wordElement);
        } else {
            if (direction === 'down' || direction === 'up') {
                wordElement.style.top = `${nextPos}px`;
            } else {
                wordElement.style.left = `${nextPos}px`;
            }
        }

        if (!getIsTyping()) focusClosestWord();

    }, 10);
}

function checkCollisionWithGroundedWord(wordElement, nextPos, segmentIndex, direction) {
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

    return wordsInSegment.some((otherWord) => {
        let otherPos = direction === 'down' || direction === 'up'
            ? parseFloat(otherWord.style.top)
            : parseFloat(otherWord.style.left);

        const wordSize = direction === 'down' || direction === 'up' ? wordHeight : wordElement.offsetWidth;

        if (direction === 'down') {
            return nextPos + wordSize >= otherPos;
        } else if (direction === 'up') {
            return nextPos <= otherPos + wordHeight;
        } else if (direction === 'left') {
            return nextPos + wordSize >= otherPos;
        } else if (direction === 'right') {
            return nextPos <= otherPos + wordElement.offsetWidth;
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
            return Math.min(...topPositions);
        } else if (direction === 'up') {
            const topPositions = wordsInSegment.map((word) => parseFloat(word.style.top));
            return Math.max(...topPositions) + wordHeight;
        } else if (direction === 'right') {
            const leftPositions = wordsInSegment.map((word) => parseFloat(word.style.left));
            return Math.min(...leftPositions);
        } else if (direction === 'left') {
            const leftPositions = wordsInSegment.map((word) => parseFloat(word.style.left));
            return Math.max(...leftPositions) + wordElement.offsetWidth;
        }
    }
}

function wordReachedBottom(wordElement) {
    wordElement.classList.remove('active');
    wordElement.classList.add('grounded');
    setIsTyping(false);

    if (wordElement.moveInterval) {
        clearInterval(wordElement.moveInterval);
        wordElement.moveInterval = null;
    }

    if (lockDirectionCheckbox.checked) {
        wordElement.remove();
        setActiveWordsCount(getActiveWordsCount() - 1);
        if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
            clearInterval(getDropIntervalId());
            stopGame();
        }
    } else {
        document.getElementById('userInput').value = '';

        setActiveWordsCount(getActiveWordsCount() - 1);
        setGroundedWordCount(getGroundedWordCount() + 1);
        focusClosestWord(); 

        const gameContainer = document.getElementById('gameContainer');
        const segmentWidth = gameContainer.clientWidth / 6;
        const segmentIndex = Math.floor(parseFloat(wordElement.style.left) / segmentWidth);

        increaseSegmentHeight(segmentIndex, wordHeight);

        const containerHeight = gameContainer.clientHeight;

        const currentHeight = getSegmentHeight(segmentIndex);

        if (currentHeight >= containerHeight) {
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
    if (getIsTyping()) return;

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
