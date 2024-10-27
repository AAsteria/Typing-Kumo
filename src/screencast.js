const screencastToggleButton = document.getElementById('screencastToggleButton');
const screencastOverlay = document.getElementById('screencastOverlay');
const screencastContent = document.getElementById('screencastContent');
const fontSizeSlider = document.getElementById('fontSizeSlider');

let isScreencastActive = false;

export function closeScreencast() {
  isScreencastActive = false;
  screencastOverlay.style.display = 'none';
  screencastToggleButton.classList.remove('active');
}

function toggleScreencast() {
  isScreencastActive = !isScreencastActive;
  screencastOverlay.style.display = isScreencastActive ? 'flex' : 'none';
  screencastToggleButton.classList.toggle('active', isScreencastActive);
}

screencastToggleButton.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleScreencast();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
    event.preventDefault(); // Prevent default behavior (if any)
    toggleScreencast();
  }
});

document.addEventListener('keydown', (event) => {
  if (!isScreencastActive) return;

  const keyElement = document.createElement('span');
  keyElement.classList.add('screencast-key');
  keyElement.textContent = event.key;

  screencastContent.appendChild(keyElement);

  requestAnimationFrame(() => keyElement.classList.add('active'));
  setTimeout(() => keyElement.classList.remove('active'), 500);

  setTimeout(() => {
    if (keyElement.parentElement) {
      keyElement.remove();
    }
  }, 3600);

  if (screencastContent.childElementCount > 50) {
    screencastContent.firstChild.remove();
  }
  screencastContent.scrollLeft = screencastContent.scrollWidth;
});

fontSizeSlider.addEventListener('input', () => {
  screencastOverlay.style.fontSize = `${fontSizeSlider.value}px`;
});
