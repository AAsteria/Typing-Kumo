// main.js
import { inputParagraph } from './random.js'
import { 
    getCurrentWordIndex, setCurrentWordIndex, 
    getActiveWordsCount, setActiveWordsCount, 
    getWords, setWords, 
    getDropIntervalId,
    isGamePaused, setGamePaused,
    getGroundedWordCount, setGroundedWordCount,
    decreaseSegmentHeight,
    resetSegmentHeights
} from './vars.js';
import { 
    startWordDropInterval, 
    restartWordDropInterval, 
    resumeWordMovements, 
    focusClosestWord 
} from './movement.js';
import { 
    lockDirectionCheckbox, 
    mirrorModeCheckbox, 
    upsideDownModeCheckbox 
} from './mode.js';
import { displayFinalScore } from './score.js';

// DOM Elements
export const gameContainer = document.getElementById('gameContainer');

const startButton = document.getElementById('startGame');
const pauseButton = document.getElementById('pauseGame');
const endButton = document.getElementById('endGame');

const userInput = document.getElementById('userInput');
const scoreDisplay = document.getElementById('scoreDisplay');

const delaySlider = document.getElementById('delaySlider');
const sliderValue = document.getElementById('sliderValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const timeDisplay = document.createElement('div');

let score = 0;
let totalWords = 0;
let startTime;
let elapsedTime = 0;

const totalScore = 1000;
export const wordHeight = 32; // 确保与 CSS 中的 word 元素高度一致

// Setup Cursor
const cursor = document.createElement('div');
cursor.id = 'customCursor';
document.body.appendChild(cursor);

// Update cursor position based on mouse movement
document.addEventListener('mousemove', (event) => {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});

// Setup Time Display
timeDisplay.id = 'timeDisplay';
timeDisplay.style.fontSize = '18px';
timeDisplay.style.color = 'var(--secondary-color)';
scoreDisplay.after(timeDisplay);

// Event Listeners
delaySlider.addEventListener('input', () => {
  sliderValue.textContent = `${delaySlider.value} sec`;
  restartWordDropInterval();
});

speedSlider.addEventListener('input', () => {
  speedValue.textContent = `${speedSlider.value} px/sec`;
});

startButton.addEventListener('click', () => {
  resetGame();
  startGame();
  endButton.disabled = false;
  pauseButton.disabled = false;
  pauseButton.textContent = 'Pause';
});

pauseButton.addEventListener('click', togglePause);

endButton.addEventListener('click', () => {
  if (!endButton.disabled) {
    stopGame();
  }
});

userInput.addEventListener('input', checkInput);

userInput.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    const activeWord = document.querySelector('.word.active');
    if (activeWord) {
      const segmentIndex = getSegmentIndex(activeWord);
      activeWord.remove();
      setActiveWordsCount(getActiveWordsCount() - 1);
      decreaseSegmentHeight(segmentIndex, wordHeight); // 减少堆叠高度
      userInput.value = '';
      focusClosestWord();
    }
  }
});

document.body.addEventListener('click', (event) => {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

  const span = document.createElement('span');
  span.textContent = letter;
  span.style.position = 'absolute';
  span.style.left = `${event.clientX}px`;
  span.style.top = `${event.clientY}px`;
  span.style.fontSize = '15px';
  span.style.transition = 'font-size 0.8s, opacity 0.8s';
  span.style.opacity = '1';

  const colors = ['var(--secondary-color)', 'var(--primary-color)', '#feb71e'];
  span.style.color = colors[Math.floor(Math.random() * colors.length)];

  document.body.appendChild(span);

  requestAnimationFrame(() => {
    span.style.fontSize = '22px';
    span.style.opacity = '0';
  });

  setTimeout(() => {
    span.remove();
  }, 800);
});

/**
 * Starts the game by initializing variables and starting word drops.
 */
function startGame() {
  resetGame();
  if (inputParagraph.value.trim().length === 0) return;

  const wordsArray = inputParagraph.value
    .trim()
    .split(/\s+/)
    .flatMap(splitWordWithPunctuation);

  setWords(wordsArray);

  totalWords = wordsArray.length;
  startTime = Date.now();
  updateTimer();
  startWordDropInterval();

  userInput.focus();
}

/**
 * Splits a word that may contain punctuation into separate parts.
 * @param {string} word - The word to split.
 * @returns {Array} An array of word parts.
 */
function splitWordWithPunctuation(word) {
  const match = word.match(/^([a-zA-Z'-]+)([.,!?;:]?)$/);
  if (match) {
    const [_, mainWord, punctuation] = match;
    return punctuation ? [mainWord, punctuation] : [mainWord];
  }
  return [word];
}

/**
 * Stops the game by pausing word drops and movements.
 */
export function stopGame() {
  setGamePaused(true);
  clearInterval(getDropIntervalId());

  // 停止所有移动的单词
  const movingWords = Array.from(gameContainer.getElementsByClassName('word'));
  movingWords.forEach(word => {
      if (word.moveInterval) {
          clearInterval(word.moveInterval);
          word.moveInterval = null;
      }
  });
  showFinalScore();
  userInput.value = '';
}

/**
 * Resets the game state to initial conditions.
 */
function resetGame() {
  gameContainer.innerHTML = '';
  score = 0;
  setActiveWordsCount(0);
  setCurrentWordIndex(0);
  elapsedTime = 0;
  resetSegmentHeights(); // 重置所有列的堆叠高度

  clearInterval(getDropIntervalId());
  updateScore();
  updateTimer();
  userInput.value = '';
  setGamePaused(false);
}

/**
 * Toggles the game's paused state.
 */
function togglePause() {
  const paused = !isGamePaused();
  setGamePaused(paused);
  pauseButton.textContent = paused ? 'Resume' : 'Pause';

  if (paused) {
    clearInterval(getDropIntervalId());
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

/**
 * 获取单词所属的列索引。
 * @param {HTMLElement} wordElement - 单词元素。
 * @returns {number} 列索引。
 */
function getSegmentIndex(wordElement) {
    const gameContainer = document.getElementById('gameContainer');
    const segmentWidth = gameContainer.clientWidth / 6;
    return Math.floor(parseFloat(wordElement.style.left) / segmentWidth);
}

/**
 * Checks user input against the active word.
 */
function checkInput() {
  const activeWord = document.querySelector('.word.active');
  const typedValue = userInput.value;

  if (activeWord) {
      const wordText = activeWord.dataset.originalText || activeWord.textContent;

      let highlightedText = '';
      let isError = false;

      // 遍历每个输入的字符并与单词文本匹配
      for (let i = 0; i < typedValue.length; i++) {
          const typedChar = typedValue[i];
          const originalChar = wordText[i];

          if (typedChar === originalChar) {
              highlightedText += `<span style="color: var(--primary-color, #F06292);">${typedChar}</span>`;
          } else {
              highlightedText += `<span style="color: #CF6679;">${typedChar}</span>`;
              isError = true;
          }
      }

      const remainingText = wordText.substring(typedValue.length);
      highlightedText += `<span style="color: var(--secondary-color, #4A90E2);">${remainingText}</span>`;

      activeWord.innerHTML = highlightedText;
      activeWord.dataset.originalText = wordText;

      if (typedValue === wordText) {
          const segmentIndex = getSegmentIndex(activeWord);
          decreaseSegmentHeight(segmentIndex, wordHeight); // 减少堆叠高度

          if (activeWord.moveInterval) {
              clearInterval(activeWord.moveInterval);
              activeWord.moveInterval = null;
          }

          activeWord.remove();
          setActiveWordsCount(getActiveWordsCount() - 1);
          setGroundedWordCount(getGroundedWordCount() + 1);
          score += totalScore / totalWords;
          updateScore();
          userInput.value = '';

          // 检查是否所有单词都已处理完毕
          if (getCurrentWordIndex() >= getWords().length && getActiveWordsCount() === 0) {
              clearInterval(getDropIntervalId());
              stopGame();
          }
      }
  }
}

/**
 * Updates the score display.
 */
function updateScore() {
  scoreDisplay.textContent = `Raw Score: ${Math.round(score)}`;
}

/**
 * Updates the timer display.
 */
function updateTimer() {
  elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  timeDisplay.textContent = `Time: ${elapsedTime} sec`;

  if (getCurrentWordIndex() < getWords().length || getActiveWordsCount() > 0) {
    setTimeout(updateTimer, 1000);
  }
}

/**
 * Displays the final score to the user.
 */
function showFinalScore() {
  const speed = parseFloat(speedSlider.value) || 1;
  const delay = parseFloat(delaySlider.value) || 1;
  const time = elapsedTime > 0 ? elapsedTime : 1;

  const accuracy = getGroundedWordCount() / totalWords;
  const baseScore = score * accuracy;

  const shownScore = (baseScore * speed / delay) + (getGroundedWordCount() * 50) 
      + (getGroundedWordCount() / time * 50);

  endButton.disabled = true;
  pauseButton.disabled = true;

  let difficultyMultiplier = 1;
  if (lockDirectionCheckbox.checked) difficultyMultiplier *= 2;
  if (mirrorModeCheckbox.checked) difficultyMultiplier *= 2;
  if (upsideDownModeCheckbox.checked) difficultyMultiplier *= 2;

  const adjustedScore = shownScore * difficultyMultiplier;

  displayFinalScore(adjustedScore, elapsedTime);
}
