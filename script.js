import { playSound } from './soundManager.js';

const title = document.querySelector('title');
const h1Title = document.getElementById('title');
const cursor = document.createElement('div');

const startButton = document.getElementById('startGame');
const pauseButton = document.getElementById('pauseGame');
const endButton = document.getElementById('endGame');
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
const upsideDownModeCheckbox = document.getElementById('upsideDownMode');

const MAX_FONT_SIZE = 15;
const MIN_FONT_SIZE = 10;

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
let isFullScreen = false;

const maxActiveWords = 6;
const totalScore = 1000;
const wordHeight = 32;
const segmentHeights = Array(6).fill(0);

cursor.id = 'customCursor';
document.body.appendChild(cursor);

// Update cursor position based on mouse movement
document.addEventListener('mousemove', (event) => {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});

function updateTitle() {
  const allChecked = 
    lockDirectionCheckbox.checked &&
    mirrorModeCheckbox.checked &&
    upsideDownModeCheckbox.checked;

  if (allChecked) {
    title.textContent = 'Typing Demon';
    h1Title.textContent = 'Typing Demon';
  } else {
    title.textContent = 'Typing Kumo';
    h1Title.textContent = 'Typing Kumo';
  }
}

[lockDirectionCheckbox, mirrorModeCheckbox, upsideDownModeCheckbox].forEach(checkbox =>
  checkbox.addEventListener('change', updateTitle)
);

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
    showFinalScore();
    stopGame();
  }
});
userInput.addEventListener('input', checkInput);
userInput.addEventListener('keydown', (event) => {
  playSound(event.key);
  if (event.key === 'Tab') {
    event.preventDefault();
    const activeWord = document.querySelector('.word.active');
    if (activeWord) {
      activeWord.remove();
      activeWordsCount--;
      userInput.value = '';
      focusClosestWord();
    }
  }
  if (event.metaKey && event.key === 'l') {
    event.preventDefault();
    if (!isFullScreen) enterFullScreen();
  }
  if (event.metaKey && event.key === 's') {
    event.preventDefault();
    if (isFullScreen) exitFullScreen();
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

  const colors = ['#ff80ab', '#80d8ff', 'orange'];
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

function stopGame() {
  gamePaused = true; // 设置游戏为暂停状态
  clearInterval(dropIntervalId); // 停止单词下落的计时器

  // 停止所有单词的移动
  const movingWords = Array.from(gameContainer.getElementsByClassName('word'));
  movingWords.forEach(word => {
    if (word.moveInterval) {
      clearInterval(word.moveInterval);
      word.moveInterval = null;
    }
  });

  userInput.value = ''; // 清空输入框
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
  gameContainer.innerHTML = '';
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
      rotation = 180;
      break;
    case 'left':
      wordElement.style.top = `${topPosition}px`;
      wordElement.style.left = '0px';
      rotation = 90;
      break;
    case 'right':
      wordElement.style.top = `${topPosition}px`;
      wordElement.style.left = `${gameContainer.clientWidth - wordHeight}px`;
      rotation = -90;
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
  activeWordsCount++;

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

function moveWordDown(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);
  const direction = wordElement.dataset.direction;

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return; // 游戏暂停时不移动

    const currentTop = parseFloat(wordElement.style.top);
    const nextTop = currentTop + speed / 10;

    if (
      nextTop + wordHeight >= gameContainer.clientHeight ||
      checkCollisionWithGroundedWord(wordElement, nextTop, segmentIndex, direction)
    ) {
      const finalTop = Math.min(
        nextTop,
        getNextGroundedPosition(segmentIndex, direction)
      );

      wordElement.style.top = `${finalTop}px`;
      wordReachedBottom(wordElement); // 调用停靠函数
    } else {
      wordElement.style.top = `${nextTop}px`;
    }

    focusClosestWord();
  }, 10);
}
function moveWordUp(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);
  const direction = wordElement.dataset.direction;

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return;

    const currentTop = parseFloat(wordElement.style.top);
    const nextTop = currentTop - speed / 10;

    if (
      nextTop <= 0 ||
      checkCollisionWithGroundedWord(wordElement, nextTop, segmentIndex, direction)
    ) {
      const finalTop = Math.max(
        nextTop,
        getNextGroundedPosition(segmentIndex, direction)
      );

      wordElement.style.top = `${finalTop}px`;
      wordReachedBottom(wordElement); // 调用停靠函数
    } else {
      wordElement.style.top = `${nextTop}px`;
    }

    focusClosestWord();
  }, 10);
}
function moveWordLeft(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);
  const direction = wordElement.dataset.direction;

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return; // 游戏暂停时不移动

    const currentLeft = parseFloat(wordElement.style.left);
    const nextLeft = currentLeft + speed / 10;

    if (
      nextLeft + wordElement.offsetWidth >= gameContainer.clientWidth ||
      checkCollisionWithGroundedWord(wordElement, nextLeft, segmentIndex, direction)
    ) {
      const finalLeft = Math.min(
        nextLeft,
        getNextGroundedPosition(segmentIndex, direction) - wordHeight
      );

      wordElement.style.left = `${finalLeft}px`;
      wordReachedBottom(wordElement); // 调用停靠函数
    } else {
      wordElement.style.left = `${nextLeft}px`;
    }

    focusClosestWord();
  }, 10);
}
function moveWordRight(wordElement, segmentIndex) {
  const speed = parseInt(speedSlider.value);
  const direction = wordElement.dataset.direction;

  if (wordElement.moveInterval) return;

  wordElement.moveInterval = setInterval(() => {
    if (gamePaused) return; // 游戏暂停时不移动

    const currentLeft = parseFloat(wordElement.style.left);
    const nextLeft = currentLeft - speed / 10;

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
      clearInterval(wordElement.moveInterval); // 停止移动
      wordElement.moveInterval = null; // 移除引用
      userInput.value = ''; // 清空输入框

      activeWordsCount--;
      groundedWordsCount++; // 增加已停靠单词计数

      // 检查是否所有单词已处理
      if (currentWordIndex >= words.length && activeWordsCount === 0) {
        clearInterval(dropIntervalId);
        setTimeout(showFinalScore, 100); // 延迟以确保渲染完成
      }
    } else {
      wordElement.style.left = `${nextLeft}px`;
    }

    focusClosestWord();
  }, 10);
}

function checkCollisionWithGroundedWord(wordElement, nextPosition, segmentIndex, direction) {
  const segmentWidth = gameContainer.clientWidth / 6;
  const segmentHeight = gameContainer.clientHeight / 6; // 假设分段高度为 clientHeight 的六分之一

  // 获取与当前方向相同的已停靠单词
  const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
    (word) => {
      const wordDirection = word.dataset.direction;
      if (wordDirection !== direction) return false; // 仅考虑相同方向的单词

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
function getNextGroundedPosition(segmentIndex, direction) {
  const segmentWidth = gameContainer.clientWidth / 6;
  const segmentHeight = gameContainer.clientHeight / 6; // 假设分段高度为 clientHeight 的六分之一

  const wordsInSegment = Array.from(gameContainer.getElementsByClassName('grounded')).filter(
    (word) => {
      const wordDirection = word.dataset.direction;
      if (wordDirection !== direction) return false; // 仅考虑相同方向的单词

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

  const accuracy = groundedWordsCount / totalWords;
  const baseScore = score * accuracy;

  const shownScore = (baseScore * speed / delay) + (groundedWordsCount * 50) + (groundedWordsCount / time * 50);

  endButton.disabled = true;
  pauseButton.disabled = true;

  let difficultyMultiplier = 1;
  if (lockDirectionCheckbox.checked) difficultyMultiplier *= 1.5;
  if (mirrorModeCheckbox.checked) difficultyMultiplier *= 2;
  if (upsideDownModeCheckbox.checked) difficultyMultiplier *= 1.75;

  const adjustedScore = shownScore * difficultyMultiplier;

  gameContainer.innerHTML = `
    <div class="final-score" style="text-align: center; font-size: 24px; color: #ff80ab;">
      <p><strong>Game Over!</strong></p>
      <p style="font-size: 18px; color: #333;">
        <em>Final Score: ${adjustedScore.toFixed(2)} points / ${elapsedTime} s</em>
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

// Immerse Mode
const originalStyles = {
  width: gameContainer.clientWidth,
  height: gameContainer.clientHeight,
  borderRadius: gameContainer.style.borderRadius,
};

function scaleGameContainer() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const aspectRatio = originalStyles.width / originalStyles.height;

  let scaledWidth = windowWidth;
  let scaledHeight = scaledWidth / aspectRatio;

  if (scaledHeight > windowHeight) {
    scaledHeight = windowHeight;
    scaledWidth = scaledHeight * aspectRatio;
  }

  const offsetX = (windowWidth - scaledWidth) / 2;
  const offsetY = (windowHeight - scaledHeight) / 2;

  const scaleX = scaledWidth / originalStyles.width;
  const scaleY = scaledHeight / originalStyles.height;
  const scale = Math.min(scaleX, scaleY);

  gameContainer.style.width = `${originalStyles.width}px`;
  gameContainer.style.height = `${originalStyles.height}px`;
  gameContainer.style.transform = `scale(${scale})`;
  gameContainer.style.transformOrigin = 'top left';
  gameContainer.style.left = `${offsetX}px`;
  gameContainer.style.top = `${offsetY}px`;
}

function enterFullScreen() {
  gameContainer.style.position = 'fixed';
  gameContainer.style.borderRadius = '0';
  gameContainer.style.zIndex = '999';
  isFullScreen = true;

  scaleGameContainer();
}

function exitFullScreen() {
  gameContainer.style.position = '';
  gameContainer.style.top = '';
  gameContainer.style.left = '';
  gameContainer.style.width = `${originalStyles.width}px`;
  gameContainer.style.height = `${originalStyles.height}px`;
  gameContainer.style.borderRadius = originalStyles.borderRadius;
  gameContainer.style.zIndex = '';
  gameContainer.style.transform = '';
  gameContainer.style.transformOrigin = '';

  isFullScreen = false;
}

window.addEventListener('resize', () => {
  if (isFullScreen) {
    requestAnimationFrame(scaleGameContainer);
  }
});
