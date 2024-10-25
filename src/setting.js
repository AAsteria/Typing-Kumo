import { loadCustomSounds } from './soundManager.js';
import { closeScreencast } from './screencast.js';

const settingsIcon = document.getElementById('settingsIcon');
const settingsDialog = document.getElementById('settingsDialog');
const uploadButton = document.getElementById('uploadButton');
const fileInput = document.getElementById('fileInput');

window.addEventListener('DOMContentLoaded', () => {
  settingsDialog.classList.add('hidden');
});

settingsIcon.addEventListener('click', () => {
  const isDialogVisible = !settingsDialog.classList.contains('hidden');
  settingsDialog.classList.toggle('hidden', isDialogVisible);

  if (!isDialogVisible) {
    closeScreencast();
  }
});

uploadButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      try {
        await loadCustomSounds(file);
        alert(`Enjoy your custom sounds: ${file.name}!`);
      } catch (error) {
        alert('Loading custom sounds failed: ' + error.message);
      }
    } else {
      alert('Not a valid zip file ~');
    }
  }
});
