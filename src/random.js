export const inputParagraph = document.getElementById('inputParagraph');
export const refreshButton = document.getElementById('refreshButton');

export async function loadWords() {
    try {
        const response = await fetch('resources/common1000.txt');
        const text = await response.text();
        const words = text.split(/\r?\n/).filter(word => word.trim() !== '');

        setRandomWords(words);
    } catch (error) {
        console.error('Error loading words:', error);
    }
}

export function setRandomWords(words) {
    const randomWordCount = Math.floor(Math.random() * 91) + 10;
    const randomWords = Array.from({ length: randomWordCount }, () =>
        words[Math.floor(Math.random() * words.length)]
    ).join(' ');

    inputParagraph.value = randomWords;
}

refreshButton.addEventListener('click', loadWords);

window.addEventListener('DOMContentLoaded', loadWords);