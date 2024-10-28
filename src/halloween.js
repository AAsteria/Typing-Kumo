const maxIcons = 5; // Limit the maximum number of icons on the screen
const iconPositions = []; // Track icon positions to avoid overlap

function getRandomColor() {
    const colors = ["#FF8C00", "#8A2BE2", "#50B848", "#EE8C00", "#E1BEE7", "#ffce89", "#94B848"];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createHalloweenIcon() {
    if (document.querySelectorAll('.halloween-icon').length >= maxIcons) return;

    const icons = ['fa-ghost', 'fa-spider', 'fa-hat-wizard', 'fa-mask'];
    const iconType = icons[Math.floor(Math.random() * icons.length)];
    const iconElement = document.createElement('i');
    iconElement.classList.add('fa-solid', iconType, 'halloween-icon');
    iconElement.style.color = getRandomColor();

    // Initial position and size
    let topPosition;
    do {
        topPosition = 5 + Math.random() * 90;
    } while (iconPositions.some(pos => Math.abs(pos - topPosition) < 20));
    iconPositions.push(topPosition);
    iconElement.style.top = `${topPosition}%`;

    const randomSection = Math.random();
    iconElement.style.left = randomSection < 0.5 ? `${5 + Math.random() * 15}%` : `${80 + Math.random() * 15}%`;

    document.body.appendChild(iconElement);

    // Click to dodge and glow effect
    iconElement.addEventListener('click', () => {
        iconElement.classList.add('glow-effect');
        const dodgeX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 15 + 5);
        const dodgeY = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 15 + 5);
        iconElement.style.transform = `translate(${dodgeX}px, ${dodgeY}px) scale(1.5)`;
    });

    // Trigger fade and grow effects, then remove
    setTimeout(() => iconElement.classList.add('fade-grow'), 50); // Start effect slightly after creation
    setTimeout(() => {
        iconElement.classList.remove('fade-grow'); // Remove fade-grow after fully visible
        setTimeout(() => {
            iconElement.classList.add('fade-out'); // Start fading out after a pause
        }, 2000); // Delay before starting fade-out
    }, 4000);
    setTimeout(() => {
        iconElement.remove();
        iconPositions.splice(iconPositions.indexOf(topPosition), 1);
    }, 5000);
}

function startHalloweenIcons() {
    const halloweenInterval = setInterval(() => {
        createHalloweenIcon();
    }, 3000); // Adjust interval as needed

    return halloweenInterval;
}

// Check Halloween period
const now = new Date();
const halloweenDate = new Date(now.getFullYear(), 9, 31);
const startHalloween = new Date(halloweenDate);
startHalloween.setDate(halloweenDate.getDate() - 5);
const endHalloween = new Date(halloweenDate);
endHalloween.setDate(halloweenDate.getDate() + 3);

if (now >= startHalloween && now <= endHalloween) {
    startHalloweenIcons();
}
