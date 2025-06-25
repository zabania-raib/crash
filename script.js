const menuOverlay = document.getElementById('menu-overlay');
const mainContainer = document.querySelector('.main-container');
const menuButtons = document.querySelectorAll('.menu-choice-btn');
const multiplierDisplay = document.getElementById('multiplier-display');
const crashChart = document.getElementById('crash-chart');
const startButton = document.getElementById('start-button');
const historyList = document.getElementById('history-list');
const captchaOverlay = document.getElementById('captcha-overlay');
const captchaQuestion = document.getElementById('captcha-question');
const captchaInput = document.getElementById('captcha-input');
const captchaSubmit = document.getElementById('captcha-submit');
const captchaError = document.getElementById('captcha-error');
const ctx = crashChart.getContext('2d');
const siteHeader = document.getElementById('site-header');
const passwordOverlay = document.getElementById('password-overlay');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordError = document.getElementById('password-error');
const platformOverlay = document.getElementById('platform-overlay');
const platformButtons = document.querySelectorAll('.platform-choice-btn');
const gameChoiceOverlay = document.getElementById('game-choice-overlay');
const startCrashBtn = document.getElementById('start-crash-btn');
const startAofBtn = document.getElementById('start-aof-btn');
const startThimblesBtn = document.getElementById('start-thimbles-btn');
const aofOverlay = document.getElementById('aof-overlay');
const aofGrid = document.getElementById('aof-grid');
const aofStatus = document.getElementById('aof-status');
const aofStartBtn = document.getElementById('aof-start-btn');
const returnToMenuBtn = document.getElementById('return-to-menu-btn');
const thimblesOverlay = document.getElementById('thimbles-overlay');
const thimblesMode1BallBtn = document.getElementById('thimbles-1ball-btn');
const thimblesMode2BallBtn = document.getElementById('thimbles-2ball-btn');
const thimblesCups = document.querySelectorAll('.thimble-cup');
const thimblesBalls = document.querySelectorAll('.thimble-ball');
const thimblesStatus = document.getElementById('thimbles-status');
const thimblesPlayBtn = document.getElementById('thimbles-play-btn');

let multiplier = 1;
let startTime;
let animationFrameId;
let crashed = false;
let crashPointValue = 0;
let crashAnimationTime = 0;
let historicalMultipliers = [];
let crashHistory = [];
let crashRoundCounter = 0;
let aofRoundCounter = 0;
let thimblesRoundCounter = 0;
let captchaAnswer = 0;
let captchaSourceGame = '';
let captchaContext = {};
let botIsRunning = false;
let isNavigatingAway = false;
const ACCESS_PASSWORD = "salma molat tarma";

// Game constants
const CRASH_PROBABILITY = 0.01; // Base probability of crashing on any given frame

// --- NEW UI STATE MANAGEMENT ---
const SCREENS = {
    password: passwordOverlay,
    platform: platformOverlay,
    gameChoice: gameChoiceOverlay,
    crash: mainContainer,
    aof: aofOverlay,
    thimbles: thimblesOverlay,
};

function switchScreen(screenName) {
    // 1. Hide all main screens
    Object.values(SCREENS).forEach(screen => screen.classList.add('hidden'));

    // 2. Configure header and button visibility
    const isGame = (screenName === 'crash' || screenName === 'aof' || screenName === 'thimbles');
    const isMenu = (screenName === 'platform' || screenName === 'gameChoice');

    if (isGame || isMenu) {
        siteHeader.classList.remove('hidden');
    } else {
        siteHeader.classList.add('hidden');
    }

    if (isGame) {
        returnToMenuBtn.classList.remove('hidden');
    } else {
        returnToMenuBtn.classList.add('hidden');
    }
    
    // 3. Show the requested screen
    if (SCREENS[screenName]) {
        SCREENS[screenName].classList.remove('hidden');
    }

    // 4. Run screen-specific setup
    if (screenName === 'crash') {
        document.body.style.overflow = 'auto';
        resizeCanvas();
    } else if (screenName === 'aof') {
        setupAofGame();
    } else if (screenName === 'thimbles') {
        setupThimblesGame();
    }
}

// --- INITIALIZE UI ---
document.addEventListener('DOMContentLoaded', () => {
    switchScreen('password');
});

// --- EVENT LISTENERS (REWRITTEN) ---
passwordSubmit.addEventListener('click', checkPassword);
passwordInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkPassword();
});

function checkPassword() {
    if (passwordInput.value === ACCESS_PASSWORD) {
        switchScreen('platform');
    } else {
        passwordError.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

platformButtons.forEach(button => {
    button.addEventListener('click', () => switchScreen('gameChoice'));
});

startCrashBtn.addEventListener('click', () => switchScreen('crash'));
startAofBtn.addEventListener('click', () => switchScreen('aof'));
startThimblesBtn.addEventListener('click', () => switchScreen('thimbles'));

returnToMenuBtn.addEventListener('click', () => {
    isNavigatingAway = true;
    botIsRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        crashed = true;
    }
    switchScreen('gameChoice');
});

// --- Captcha Logic (No changes needed here) ---
captchaSubmit.addEventListener('click', solveCaptcha);
captchaInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        solveCaptcha();
    }
});

function unlockPlayButton(source, { failed = false } = {}) {
    if (source === 'crash') {
        startButton.disabled = false;
        startButton.textContent = 'Play Again';
    } else if (source === 'aof') {
        aofStartBtn.disabled = false;
        aofStartBtn.textContent = failed ? 'Try Again' : 'Play Again';
    } else if (source === 'thimbles') {
        thimblesPlayBtn.disabled = false;
        thimblesPlayBtn.textContent = 'Play Again';
    }
}

function showCaptcha(source, context = {}) {
    captchaSourceGame = source;
    captchaContext = context;
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = num1 + num2;
    captchaQuestion.textContent = `${num1} + ${num2} = ?`;
    captchaInput.value = '';
    captchaError.classList.add('hidden');
    captchaOverlay.classList.remove('hidden');
    captchaInput.focus();
}

function solveCaptcha() {
    const userAnswer = parseInt(captchaInput.value);
    if (userAnswer === captchaAnswer) {
        captchaOverlay.classList.add('hidden');
        unlockPlayButton(captchaSourceGame, captchaContext);
    } else {
        captchaError.classList.remove('hidden');
        captchaInput.value = '';
        captchaInput.focus();
    }
}

// --- Game Logic (Stripped of UI toggles) ---

function getCrashPoint() {
    if (Math.random() < 0.015) {
        return 1.00;
    }
    const r = Math.random();
    const multiplier = 0.993 / (1 - r);
    return Math.max(1, Math.floor(multiplier * 100) / 100);
}

function startGame() {
    isNavigatingAway = false;
    crashed = false;
    crashAnimationTime = 0;
    multiplier = 1;
    startTime = Date.now();
    historicalMultipliers = [{time: 0, multi: 1}];
    
    multiplierDisplay.textContent = '1.00x';
    multiplierDisplay.style.color = 'white';
    startButton.disabled = true;

    crashPointValue = getCrashPoint();
    console.log(`The game will crash at ${crashPointValue}x`);

    gameLoop();
}

function gameLoop() {
    if (crashed && crashAnimationTime === 0) {
        return;
    }

    if (crashAnimationTime > 0) {
        crashAnimationTime--;
        drawChart();
        drawCrashExplosion();
        if (crashAnimationTime === 0) {
            if (isNavigatingAway) return;
            if (crashRoundCounter % 3 === 0) {
                showCaptcha('crash');
            } else {
                unlockPlayButton('crash');
            }
            return; // End animation loop
        }
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    const elapsedTime = (Date.now() - startTime) / 1000;
    multiplier = Math.pow(1.05, elapsedTime);

    if (multiplier >= crashPointValue) {
        crashed = true;
        crashRoundCounter++;
        crashAnimationTime = 60;
        const finalMultiplier = crashPointValue;
        multiplierDisplay.textContent = `Crashed @ ${finalMultiplier.toFixed(2)}x`;
        multiplierDisplay.style.color = '#f56565';
        updateHistory(finalMultiplier);
        gameLoop(); // Re-call to start animation
        return;
    }

    historicalMultipliers.push({ time: elapsedTime, multi: multiplier });
    multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
    
    drawChart();
    animationFrameId = requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', startGame);

const AOF_ROWS = 5;
const AOF_COLS = 5;
let aofBadApples = [];

aofStartBtn.addEventListener('click', () => runAofBotAttempt());

function setupAofGame() {
    aofGrid.innerHTML = '';
    aofBadApples = [];
    for (let r = 0; r < AOF_ROWS; r++) {
        aofBadApples.push(Math.floor(Math.random() * AOF_COLS));
        for (let c = 0; c < AOF_COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('aof-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            aofGrid.appendChild(cell);
        }
    }
    aofStatus.textContent = "Bot is ready. Press Start!";
    aofStartBtn.disabled = false;
    aofStartBtn.textContent = "Start Bot";
}

async function runAofBotAttempt() {
    if (botIsRunning) return;
    botIsRunning = true;
    isNavigatingAway = false;
    
    document.querySelectorAll('.aof-cell').forEach(c => {
        c.className = 'aof-cell';
    });
    
    aofStartBtn.disabled = true;
    aofStatus.textContent = "Bot is thinking...";
    let currentRow = AOF_ROWS - 1;

    await new Promise(resolve => setTimeout(resolve, 500));

    while (currentRow >= 0) {
        aofStatus.textContent = `Bot is on row ${AOF_ROWS - currentRow}.`;
        const botChoice = Math.floor(Math.random() * AOF_COLS);
        const badAppleCol = aofBadApples[currentRow];
        const chosenCell = document.querySelector(`.aof-cell[data-row='${currentRow}'][data-col='${botChoice}']`);
        
        chosenCell.classList.add('current');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (botChoice === badAppleCol) {
            chosenCell.classList.remove('current');
            chosenCell.classList.add('bad');
            aofStatus.textContent = `Bot failed! Press 'Try Again' to reset.`;
            botIsRunning = false;
            
            aofRoundCounter++;
            if (isNavigatingAway) return;
            if (aofRoundCounter % 3 === 0) {
                showCaptcha('aof', { failed: true });
            } else {
                unlockPlayButton('aof', { failed: true });
            }
            return;
        } else {
            chosenCell.classList.remove('current');
            chosenCell.classList.add('good');
            currentRow--;
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    aofStatus.textContent = "Success! The bot found a winning path!";
    botIsRunning = false;
    
    aofRoundCounter++;
    if (isNavigatingAway) return;
    if (aofRoundCounter % 3 === 0) {
        showCaptcha('aof', { failed: false });
    } else {
        unlockPlayButton('aof', { failed: false });
    }
}

// --- Thimbles Game Logic (Complete Rewrite) ---
thimblesMode1BallBtn.addEventListener('click', () => {
    if (botIsRunning) return;
    thimblesMode = 1;
    thimblesMode1BallBtn.classList.add('active');
    thimblesMode2BallBtn.classList.remove('active');
    document.querySelector('.segmented-control').classList.remove('two-balls');
});

thimblesMode2BallBtn.addEventListener('click', () => {
    if (botIsRunning) return;
    thimblesMode = 2;
    thimblesMode2BallBtn.classList.add('active');
    thimblesMode1BallBtn.classList.remove('active');
    document.querySelector('.segmented-control').classList.add('two-balls');
});

thimblesPlayBtn.addEventListener('click', runThimblesAttempt);

// This function ONLY sets up the initial state. It is NOT called during the animation.
function setupThimblesGame() {
    botIsRunning = false;
    thimblesPlayBtn.disabled = false;
    thimblesPlayBtn.textContent = 'Play';
    thimblesStatus.textContent = "Select a mode and press play.";

    // ALWAYS reset to 1-ball mode visually and logically
    thimblesMode = 1;
    thimblesMode1BallBtn.classList.add('active');
    thimblesMode2BallBtn.classList.remove('active');
    document.querySelector('.segmented-control').classList.remove('two-balls');
    
    // Remove any lingering animation classes
    document.querySelectorAll('.thimble-cup-container').forEach(cont => {
        cont.classList.remove('shuffling');
    });

    // Reset cups to their down state
    thimblesCups.forEach(cup => {
        cup.classList.remove('chosen', 'up');
    });

    // Ensure all balls are hidden
    thimblesBalls.forEach(ball => {
        ball.classList.add('hidden');
    });
}

// This function is the complete, rewritten game sequence.
async function runThimblesAttempt() {
    if (botIsRunning) return;
    botIsRunning = true;
    isNavigatingAway = false;
    thimblesPlayBtn.disabled = true;

    // --- Part 1: Reset the board for a new run ---
    thimblesStatus.textContent = 'Getting ready...';
    document.querySelectorAll('.thimble-cup-container').forEach(c => c.classList.remove('shuffling'));
    thimblesCups.forEach(c => c.classList.remove('chosen', 'up'));
    thimblesBalls.forEach(b => b.classList.add('hidden'));
    await new Promise(r => setTimeout(r, 250)); // Brief pause for visual reset

    // --- Part 2: Place the balls and show them to the user ---
    thimblesStatus.textContent = 'Watch the balls...';
    const ballPositions = [];
    while (ballPositions.length < thimblesMode) {
        const pos = Math.floor(Math.random() * 3);
        if (!ballPositions.includes(pos)) {
            ballPositions.push(pos);
        }
    }

    // Un-hide the balls first
    ballPositions.forEach(pos => {
        thimblesBalls[pos].classList.remove('hidden');
    });

    // THEN lift the cups
    thimblesCups.forEach(cup => cup.classList.add('up'));
    await new Promise(r => setTimeout(r, 1500)); // Let user see the balls clearly

    // --- Part 3: Cover the balls and shuffle ---
    thimblesStatus.textContent = 'Hiding...';
    thimblesCups.forEach(cup => cup.classList.remove('up'));
    await new Promise(r => setTimeout(r, 600));

    thimblesStatus.textContent = 'Shuffling...';
    document.querySelectorAll('.thimble-cup-container').forEach(cont => {
        cont.classList.add('shuffling');
    });
    await new Promise(r => setTimeout(r, 2600)); // Wait for animation to finish

    // --- Part 4: Bot makes its choice and reveals the result ---
    thimblesStatus.textContent = 'Bot is choosing...';
    await new Promise(r => setTimeout(r, 1000));
    
    // The bot, as a predictor, always knows where the balls are.
    // It will choose all cups that contain a ball.
    ballPositions.forEach(pos => {
        thimblesCups[pos].classList.add('chosen');
    });
    
    await new Promise(r => setTimeout(r, 500));

    thimblesCups.forEach(cup => cup.classList.add('up'));

    // --- Part 5: End of round ---
    thimblesStatus.textContent = 'Bot Wins!';
    botIsRunning = false;
    thimblesRoundCounter++;

    if (isNavigatingAway) return;
    if (thimblesRoundCounter % 3 === 0) {
        showCaptcha('thimbles');
    } else {
        unlockPlayButton('thimbles');
    }
}

// The rest of the file (drawChart, updateHistory, etc.) remains unchanged.
function getChartCoordinates(point) {
    const { width, height } = crashChart;
    const lastPoint = historicalMultipliers.length > 0 ? historicalMultipliers[historicalMultipliers.length - 1] : { time: 0, multi: 1 };
    const maxTimeVisible = Math.max(10, lastPoint.time);
    const maxMultiVisible = Math.max(2, lastPoint.multi * 1.2);

    const x = (point.time / maxTimeVisible) * width;
    const y = height - ((point.multi - 1) / (maxMultiVisible - 1)) * height;
    return { x, y };
}

function drawAirplane() {
    if (historicalMultipliers.length < 2) return;
    const currentPoint = getChartCoordinates(historicalMultipliers[historicalMultipliers.length - 1]);
    const prevPoint = getChartCoordinates(historicalMultipliers[historicalMultipliers.length - 2]);
    const angle = Math.atan2(currentPoint.y - prevPoint.y, currentPoint.x - prevPoint.x);

    ctx.save();
    ctx.translate(currentPoint.x, currentPoint.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#48bb78';
    ctx.shadowColor = '#48bb78';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawCrashExplosion() {
    if (historicalMultipliers.length < 1) return;
    const crashPointData = historicalMultipliers.find(p => p.multi >= crashPointValue) || historicalMultipliers[historicalMultipliers.length - 1];
    const { x, y } = getChartCoordinates(crashPointData);
    const particles = 30;
    const radius = (60 - crashAnimationTime) * 2;

    for (let i = 0; i < particles; i++) {
        ctx.beginPath();
        const angle = (i / particles) * 2 * Math.PI;
        const particleX = x + Math.cos(angle) * radius * Math.random();
        const particleY = y + Math.sin(angle) * radius * Math.random();
        const particleRadius = Math.random() * 4;
        ctx.fillStyle = `rgba(245, 101, 101, ${crashAnimationTime / 60})`;
        ctx.arc(particleX, particleY, particleRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawChart() {
    const { width, height } = crashChart;
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#48bb78';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < historicalMultipliers.length; i++) {
        const { x, y } = getChartCoordinates(historicalMultipliers[i]);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (!crashed) {
        drawAirplane();
    }
}

function updateHistory(crashPoint) {
    crashHistory.unshift(crashPoint);
    if (crashHistory.length > 10) {
        crashHistory.pop();
    }
    historyList.innerHTML = '';
    for (const point of crashHistory) {
        const li = document.createElement('li');
        li.textContent = `${point.toFixed(2)}x`;
        li.style.color = getMultiplierColor(point);
        historyList.appendChild(li);
    }
}

function getMultiplierColor(multiplier) {
    if (multiplier < 2) return '#f56565';
    if (multiplier < 10) return '#ed8936';
    return '#48bb78';
}

function drawGrid() {
    const { width, height } = crashChart;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = "12px Poppins";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    const lastPoint = historicalMultipliers.length > 1 ? historicalMultipliers[historicalMultipliers.length - 1] : { time: 10, multi: 2 };
    const maxTimeVisible = Math.max(10, lastPoint.time);
    const maxMultiVisible = Math.max(2, lastPoint.multi * 1.2);
    for (let i = 0; i <= 5; i++) {
        const y = (i / 5) * height;
        const multiplier = maxMultiVisible - (i / 5) * (maxMultiVisible - 1);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(`${multiplier.toFixed(1)}x`, 5, y - 5);
    }
    for (let i = 1; i <= 5; i++) {
        const x = (i / 5) * width;
        const time = (i/5) * maxTimeVisible;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.fillText(`${time.toFixed(1)}s`, x + 5, height - 5);
    }
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (container && crashChart) {
      crashChart.width = container.clientWidth - 4 * 16;
      crashChart.height = container.clientHeight - document.getElementById('multiplier-display').offsetHeight - document.getElementById('start-button').offsetHeight - (5 * 16);
      drawChart();
    }
}
window.addEventListener('resize', resizeCanvas); 
