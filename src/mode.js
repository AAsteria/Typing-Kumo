const webTitle = document.querySelector('webTitle');
const gameTitle = document.getElementById('webTitle');

export const lockDirectionCheckbox = document.getElementById('lockDirection');
export const mirrorModeCheckbox = document.getElementById('mirrorMode');
export const upsideDownModeCheckbox = document.getElementById('upsideDownMode');

function updateTitle() {
    const allChecked = 
        lockDirectionCheckbox.checked &&
        mirrorModeCheckbox.checked &&
        upsideDownModeCheckbox.checked;

    if (allChecked) {
        webTitle.textContent = 'Typing Demon';
        gameTitle.textContent = 'Typing Demon';
    } else {
        webTitle.textContent = 'Typing Kumo';
        gameTitle.textContent = 'Typing Kumo';
    }
}

[lockDirectionCheckbox, mirrorModeCheckbox, upsideDownModeCheckbox].forEach(checkbox =>
    checkbox.addEventListener('change', updateTitle)
);
