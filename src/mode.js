import { userInput } from "./main.js";

const webTitle = document.getElementById('title');  // In-page title element
const gameTitle = document.querySelector('title');  // <title> element in the head
const showMoreButton = document.getElementById('showMoreButton');
const modeDropdown = document.querySelector('.mode-dropdown');

export const lockDirectionCheckbox = document.getElementById('lockDirection');
export const mirrorModeCheckbox = document.getElementById('mirrorMode');
export const upsideDownModeCheckbox = document.getElementById('upsideDownMode');
export const memoryModeCheckbox = document.getElementById('memoryMode');
export const encodeModeCheckbox = document.getElementById('encodeMode');

function updateTitle() {
    const allChecked =
        lockDirectionCheckbox.checked &&
        mirrorModeCheckbox.checked &&
        upsideDownModeCheckbox.checked &&
        memoryModeCheckbox.checked &&
        encodeModeCheckbox.checked;

    const newTitle = allChecked ? 'Typing Demon' : 'Typing Kumo';

    webTitle.textContent = newTitle;  // Update the in-page title
    gameTitle.textContent = newTitle; // Update the browser tab title
}

showMoreButton.addEventListener('click', (e) => {
    e.stopPropagation();
    modeDropdown.classList.toggle('active');
});

document.addEventListener('click', (event) => {
    if (!modeDropdown.contains(event.target) && !showMoreButton.contains(event.target)) {
        modeDropdown.classList.remove('active'); // Hide the dropdown if clicked outside
    }
});

[lockDirectionCheckbox, mirrorModeCheckbox, upsideDownModeCheckbox, memoryModeCheckbox, encodeModeCheckbox].forEach(checkbox =>
    checkbox.addEventListener('change', () => {
        updateTitle();
        userInput.focus();
    })
);
