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

// Timer display setup
timeDisplay.id = 'timeDisplay';
timeDisplay.style.fontSize = '18px';
timeDisplay.style.color = '#ff80ab';
scoreDisplay.after(timeDisplay);

// Event listeners for sliders
delaySlider.addEventListener('input', () => {
  sliderValue.textContent = `${delaySlider.value} sec`;
  restartWordDropInterval(); // Update drop interval mid-game
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

  // Split words with punctuation properly (but keep hyphens intact)
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

// Helper function to split words with trailing punctuation
function splitWordWithPunctuation(word) {
  const match = word.match(/^([a-zA-Z'-]+)([.,!?;:]?)$/);
  if (match) {
    const [_, mainWord, punctuation] = match;
    return punctuation ? [mainWord, punctuation] : [mainWord];
  }
  return [word]; // Return the word as-is if no punctuation
}

function resetGame() {
  gameContainer.innerHTML = '';
  score = 0;
  activeWordsCount = 0;
  currentWordIndex = 0;
  elapsedTime = 0;
  segmentHeights.fill(0);
  
  // Clear all move intervals attached to words
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

  // Set the width of the word to fit the column
  wordElement.style.width = `${segmentWidth - 4}px`; // Subtract for padding/margin
  wordElement.style.left = `${leftPosition}px`;
  wordElement.style.top = `0px`;

  gameContainer.appendChild(wordElement);
  activeWordsCount++;
  moveWordDown(wordElement, positionIndex);
}

function moveWordDown(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);
  
  // If the word already has a moveInterval, do not create another
  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return; // Do not move if the game is paused

    const currentTop = parseFloat(wordElement.style.top);
    const nextTop = currentTop + speed / 10;

    if (
      nextTop + wordHeight >= gameContainer.clientHeight ||
      checkCollisionWithGroundedWord(wordElement, nextTop, segmentIndex)
    ) {
      const finalTop = Math.min(
        nextTop,
        getTopOfNextGroundedWord(segmentIndex) - wordHeight
      );

      wordElement.style.top = `${finalTop}px`;
      wordElement.classList.add('grounded');
      clearInterval(wordElement.moveInterval); // Stop the word movement
      wordElement.moveInterval = null; // Remove the reference
      userInput.value = ''; // Clear input field

      activeWordsCount--;
      groundedWordsCount++; // Increment grounded words count

      // Check if all words have been processed
      if (currentWordIndex >= words.length && activeWordsCount === 0) {
        clearInterval(dropIntervalId);
        setTimeout(showFinalScore, 100); // Delay to ensure all rendering completes
      }
    } else {
      wordElement.style.top = `${nextTop}px`;
    }

    focusClosestWord();
  }, 10);
}

function checkCollisionWithGroundedWord(wordElement, nextTop, segmentIndex) {
  const segmentWidth = gameContainer.clientWidth / 6;
  const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
    (word) => {
      const left = parseFloat(word.style.left);
      return left >= segmentIndex * segmentWidth && left < (segmentIndex + 1) * segmentWidth;
    }
  );

  return wordsInSegment.some((otherWord) => {
    const otherTop = parseFloat(otherWord.style.top);
    return nextTop + wordHeight >= otherTop;
  });
}

function getTopOfNextGroundedWord(segmentIndex) {
  const segmentWidth = gameContainer.clientWidth / 6;
  const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
    (word) => {
      const left = parseFloat(word.style.left);
      return left >= segmentIndex * segmentWidth && left < (segmentIndex + 1) * segmentWidth;
    }
  );

  if (wordsInSegment.length === 0) {
    return gameContainer.clientHeight;
  } else {
    const topPositions = wordsInSegment.map((word) => parseFloat(word.style.top));
    return Math.min(...topPositions);
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
    let isError = false; // Track if any error occurs

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

    // Update the word display with highlighted text
    activeWord.innerHTML = highlightedText;
    activeWord.dataset.originalText = wordText; // Store original text

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

      activeWord.remove(); // Remove the word
      activeWordsCount--;
      groundedWordsCount++; // Increment grounded words count
      score += totalScore / totalWords;
      updateScore();
      userInput.value = ''; // Clear input field

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
  gameContainer.innerHTML = `
    <div class="final-score" style="text-align: center; font-size: 24px; color: #ff80ab;">
      <p><strong>Congratulations!</strong></p>
      <p style="font-size: 18px; color: #333;">
        <em>(${shownScore.toFixed(2)} points / ${elapsedTime+1} sec)</em>
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
    moveWordDown(word, segmentIndex);
  });
}
