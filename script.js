import { playSound } from './soundManager.js';

const startButton = document.getElementById('startGame');
const pauseButton = document.getElementById('pauseGame');
const gameContainer = document.getElementById('gameContainer');
const userInput = document.getElementById('userInput');
const scoreDisplay = document.getElementById('scoreDisplay');
const inputParagraph = document.getElementById('inputParagraph');
const delaySlider = document.getElementById('delaySlider');
const sliderValue = document.getElementById('sliderValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const timeDisplay = document.createElement('div');
const lockDirectionCheckbox = document.getElementById('lockDirection');
const mirrorModeCheckbox = document.getElementById('mirrorMode');

let words = [];
let score = 0;
let totalWords = 0;
let activeWordsCount = 0;
let currentWordIndex = 0;
let gamePaused = false;
let startTime;
let elapsedTime = 0;
let dropIntervalId;
let lastUsedSegment = -1;
let groundedWordsCount = 0;

const maxActiveWords = 6;
const totalScore = 1000;
const wordHeight = 32;
const segmentHeights = Array(6).fill(0);

timeDisplay.id = 'timeDisplay';
timeDisplay.style.fontSize = '18px';
timeDisplay.style.color = '#ff80ab';
scoreDisplay.after(timeDisplay);

delaySlider.addEventListener('input', () => {
  sliderValue.textContent = `${delaySlider.value} sec`;
  restartWordDropInterval();
});

speedSlider.addEventListener('input', () => {
  speedValue.textContent = `${speedSlider.value} px/sec`;
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
userInput.addEventListener('keydown', (event) => {
  playSound(event.key);
});
userInput.addEventListener('input', checkInput);

function startGame() {
  resetGame();
  if (inputParagraph.value.trim().length === 0) return;

  words = inputParagraph.value
    .trim()
    .split(/\s+/)
    .flatMap(splitWordWithPunctuation);

  totalWords = words.length;
  startTime = Date.now();
  updateTimer();
  startWordDropInterval();

  userInput.focus();
}

function splitWordWithPunctuation(word) {
  const match = word.match(/^([a-zA-Z'-]+)([.,!?;:]?)$/);
  if (match) {
    const [_, mainWord, punctuation] = match;
    return punctuation ? [mainWord, punctuation] : [mainWord];
  }
  return [word];
}

function resetGame() {
  gameContainer.innerHTML = '';
  score = 0;
  activeWordsCount = 0;
  currentWordIndex = 0;
  elapsedTime = 0;
  segmentHeights.fill(0);

  const movingWords = Array.from(gameContainer.getElementsByClassName('word'));
  movingWords.forEach(word => {
    if (word.moveInterval) {
      clearInterval(word.moveInterval);
      word.moveInterval = null;
    }
  });

  clearInterval(dropIntervalId);
  updateScore();
  updateTimer();
  userInput.value = '';
  gamePaused = false;
}

function startWordDropInterval() {
  // Drop a word immediately if possible
  if (currentWordIndex < words.length && activeWordsCount < maxActiveWords) {
    dropWord(words[currentWordIndex]);
    currentWordIndex++;
  }

  // Set up the interval for dropping subsequent words
  dropIntervalId = setInterval(() => {
    if (gamePaused) return; // Do not drop new words if the game is paused

    if (currentWordIndex < words.length && activeWordsCount < maxActiveWords) {
      dropWord(words[currentWordIndex]);
      currentWordIndex++;
    }

    // Only clear the interval when all words have been processed and no active words remain
    if (currentWordIndex >= words.length && activeWordsCount === 0) {
      clearInterval(dropIntervalId);
      showFinalScore();
    }
  }, delaySlider.value * 1000);
}

function restartWordDropInterval() {
  clearInterval(dropIntervalId);
  if (!gamePaused) {
    startWordDropInterval();
  }
}

function togglePause() {
  gamePaused = !gamePaused;
  pauseButton.textContent = gamePaused ? 'Resume' : 'Pause';

  if (gamePaused) {
    clearInterval(dropIntervalId);
    // Pause all moving words
    const movingWords = Array.from(gameContainer.getElementsByClassName('word')).filter(
      word => !word.classList.contains('grounded'));
    movingWords.forEach(word => {
      if (word.moveInterval) {
        clearInterval(word.moveInterval);
        word.moveInterval = null;
      }
    });
  } else {
    startWordDropInterval();
    resumeWordMovements();
  }
}

function dropWord(word) {
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
      if (!lockDirectionCheckbox.checked) {
        rotation = 180;
      }
      break;
    case 'left':
      wordElement.style.top = `${topPosition}px`;
      wordElement.style.left = '0px';
      if (!lockDirectionCheckbox.checked) {
        rotation = -90;
      }
      break;
    case 'right':
      wordElement.style.top = `${topPosition}px`;
      wordElement.style.left = `${gameContainer.clientWidth - wordHeight}px`;
      if (!lockDirectionCheckbox.checked) {
        rotation = 90;
      }
      break;
  }

  if (rotation !== 0) {
    wordElement.style.transform = `rotate(${rotation}deg)`;
  } else {
    wordElement.style.transform = '';
  }

  // Mirror mode
  if (mirrorModeCheckbox.checked) {
    wordElement.style.transform += ' scaleX(-1)';
  }

  wordElement.style.width = `${segmentWidth - 4}px`;

  gameContainer.appendChild(wordElement);
  activeWordsCount++;

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

function moveWordDown(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return;

    const currentTop = parseFloat(wordElement.style.top);
    const nextTop = currentTop + speed / 10;

    if (nextTop + wordHeight >= gameContainer.clientHeight) {
      wordReachedBottom(wordElement);
    } else {
      wordElement.style.top = `${nextTop}px`;
    }

    focusClosestWord();
  }, 10);
}

function moveWordUp(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return;

    const currentTop = parseFloat(wordElement.style.top);
    const nextTop = currentTop - speed / 10;

    if (nextTop <= 0) {
      wordReachedBottom(wordElement);
    } else {
      wordElement.style.top = `${nextTop}px`;
    }

    focusClosestWord();
  }, 10);
}

function moveWordLeft(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return;

    const currentLeft = parseFloat(wordElement.style.left);
    const nextLeft = currentLeft + speed / 10;

    if (nextLeft + wordElement.offsetWidth >= gameContainer.clientWidth) {
      wordReachedBottom(wordElement);
    } else {
      wordElement.style.left = `${nextLeft}px`;
    }

    focusClosestWord();
  }, 10);
}

function moveWordRight(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return;

    const currentLeft = parseFloat(wordElement.style.left);
    const nextLeft = currentLeft - speed / 10;

    if (nextLeft <= 0) {
      wordReachedBottom(wordElement);
    } else {
      wordElement.style.left = `${nextLeft}px`;
    }

    focusClosestWord();
  }, 10);
}

function wordReachedBottom(wordElement) {
  wordElement.classList.add('grounded');
  clearInterval(wordElement.moveInterval);
  wordElement.moveInterval = null;
  userInput.value = '';

  activeWordsCount--;
  groundedWordsCount++;

  if (currentWordIndex >= words.length && activeWordsCount === 0) {
    clearInterval(dropIntervalId);
    setTimeout(showFinalScore, 100);
  }
}

function focusClosestWord() {
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

function checkInput() {
  const activeWord = document.querySelector('.word.active');
  const typedValue = userInput.value;

  if (activeWord) {
    const wordText = activeWord.dataset.originalText || activeWord.textContent;

    let highlightedText = '';
    let isError = false;

    // Iterate over each typed character and match it with the word's text
    for (let i = 0; i < typedValue.length; i++) {
      const typedChar = typedValue[i];
      const originalChar = wordText[i];

      if (typedChar === originalChar) {
        // Correct character: Show in pink
        highlightedText += `<span style="color: pink;">${typedChar}</span>`;
      } else {
        // Incorrect character: Show in orange
        highlightedText += `<span style="color: orange;">${typedChar}</span>`;
        isError = true;
      }
    }

    // Display remaining untyped characters in lightblue
    const remainingText = wordText.substring(typedValue.length);
    highlightedText += `<span style="color: lightblue;">${remainingText}</span>`;

    activeWord.innerHTML = highlightedText;
    activeWord.dataset.originalText = wordText;

    // Check if the user typed the word correctly
    if (typedValue === wordText) {
      // Correctly typed word: Remove it, update score, and clear input
      const segmentIndex = Math.floor(
        parseFloat(activeWord.style.left) / (gameContainer.clientWidth / 6)
      );
      segmentHeights[segmentIndex] -= wordHeight;

      // Clear the movement interval if it exists
      if (activeWord.moveInterval) {
        clearInterval(activeWord.moveInterval);
        activeWord.moveInterval = null;
      }

      activeWord.remove();
      activeWordsCount--;
      groundedWordsCount++;
      score += totalScore / totalWords;
      updateScore();
      userInput.value = '';

      // Check if all words have been processed
      if (currentWordIndex >= words.length && activeWordsCount === 0) {
        clearInterval(dropIntervalId);
        showFinalScore();
      }
    }
  }
}

function updateScore() {
  scoreDisplay.textContent = `Raw Score: ${Math.round(score)}`;
}

function updateTimer() {
  elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  timeDisplay.textContent = `Time: ${elapsedTime} sec`;

  if (currentWordIndex < words.length || activeWordsCount > 0) {
    setTimeout(updateTimer, 1000);
  }
}

function showFinalScore() {
  const speed = parseFloat(speedSlider.value) || 1;
  const delay = parseFloat(delaySlider.value) || 1;
  const time = elapsedTime > 0 ? elapsedTime : 1;

  const shownScore = (score * speed / delay) + totalWords * 50 + (totalWords / time * 50);

  let difficultyMultiplier = 1;
  if (lockDirectionCheckbox.checked) {
    difficultyMultiplier *= 1.5;
  }
  if (mirrorModeCheckbox.checked) {
    difficultyMultiplier *= 2;
  }

  const adjustedScore = shownScore * difficultyMultiplier;

  gameContainer.innerHTML = `
    <div class="final-score" style="text-align: center; font-size: 24px; color: #ff80ab;">
      <p><strong>Congratulations!</strong></p>
      <p style="font-size: 18px; color: #333;">
        <em>(${adjustedScore.toFixed(2)} points / ${elapsedTime} s)</em>
      </p>
    </div>`;
}

function resumeWordMovements() {
  const movingWords = Array.from(gameContainer.getElementsByClassName('word')).filter(
    word => !word.classList.contains('grounded') && !word.moveInterval);

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