import { gameContainer } from './main.js'

let isFullScreen = false;

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

window.addEventListener('keydown', (event) => {
    if (event.metaKey && event.key === 'l') {
        event.preventDefault();
        if (!isFullScreen) enterFullScreen();
      }
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        if (isFullScreen) exitFullScreen();
      }
});