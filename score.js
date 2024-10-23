import { gameContainer } from "./main.js";

export function showFinalScore(adjustedScore, elapsedTime) {
    gameContainer.innerHTML = `
        <div class="final-score" style="text-align: center; font-size: 24px; color: #ff80ab;">
            <p><strong>Game Over!</strong></p>
            <p style="font-size: 18px; color: #333;">
                <em>Final Score: ${adjustedScore.toFixed(2)} points / ${elapsedTime} s</em>
            </p>
        </div>`;
}
