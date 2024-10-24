let sounds = {};

// List of required sound keys
const soundKeys = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'ENTER', 'SPACE', 'BACKSPACE', 'CAPS LOCK'
];

function loadDefaultSounds() {
  sounds = {};
  soundKeys.forEach((key) => {
    const soundPath = `./resources/nk_cream/${key}.wav`;
    const audio = new Audio(soundPath);

    audio.onerror = () => {
      console.error(`Failed to load sound for ${key}: ${soundPath}`);
    };

    sounds[key] = audio;
  });
}

loadDefaultSounds();

export async function loadCustomSounds(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const newSounds = {};

  for (const key of soundKeys) {
    const fileName = `${key}.wav`;
    const file = zip.file(fileName);

    if (!file) {
      throw new Error(`Missing sound file: ${fileName}`);
    }

    const fileData = await file.async('blob');

    if (fileData.size > 95 * 30 * 1024) {
      throw new Error(`File ${fileName} exceeds the size limit of 150KB.`);
    }

    const audioURL = URL.createObjectURL(fileData);
    const audio = new Audio(audioURL);
    newSounds[key] = audio;
  }

  sounds = newSounds;
}

// Function to play sound
export function playSound(key) {
  const upperKey = key.toUpperCase();
  const sound = sounds[upperKey] || sounds['SPACE'];

  if (sound) {
    sound.currentTime = 0;
    sound.play().catch((error) => {
      console.error(`Error playing sound for ${key}:`, error);
    });
  }
}

userInput.addEventListener('keydown', (event) => {
  playSound(event.key);
});