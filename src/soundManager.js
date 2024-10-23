const sounds = {};

const soundKeys = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'ENTER', 'SPACE', 'BACKSPACE', 'CAPS LOCK'
];

soundKeys.forEach((key) => {
  const soundPath = `./resources/nk_cream/${key}.wav`;
  const audio = new Audio(soundPath);
  
  audio.onerror = () => {
    console.error(`Failed to load sound for ${key}: ${soundPath}`);
  };

  sounds[key] = audio;
});

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