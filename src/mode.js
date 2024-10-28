const webTitle = document.getElementById('title');  // In-page title element
const gameTitle = document.querySelector('title');  // <title> element in the head

export const lockDirectionCheckbox = document.getElementById('lockDirection');
export const mirrorModeCheckbox = document.getElementById('mirrorMode');
export const upsideDownModeCheckbox = document.getElementById('upsideDownMode');

function updateTitle() {
    const allChecked =
        lockDirectionCheckbox.checked &&
        mirrorModeCheckbox.checked &&
        upsideDownModeCheckbox.checked;

    const newTitle = allChecked ? 'Typing Demon' : 'Typing Kumo';

    webTitle.textContent = newTitle;  // Update the in-page title
    gameTitle.textContent = newTitle; // Update the browser tab title
}

[lockDirectionCheckbox, mirrorModeCheckbox, upsideDownModeCheckbox].forEach(checkbox =>
    checkbox.addEventListener('change', updateTitle)
);
