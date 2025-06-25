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

let multiplier = 1;
let startTime;
let animationFrameId;
let crashed = false;
let crashPointValue = 0;
let crashAnimationTime = 0;
let historicalMultipliers = [];
let crashHistory = [];
let roundCounter = 0;
let captchaAnswer = 0;
const ACCESS_PASSWORD = "salma molat tarma";

// Game constants
const CRASH_PROBABILITY = 0.01; // Base probability of crashing on any given frame

// Password Logic
passwordSubmit.addEventListener('click', checkPassword);
passwordInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkPassword();
});

function checkPassword() {
    if (passwordInput.value === ACCESS_PASSWORD) {
        // Start fade out for password screen
        passwordOverlay.style.opacity = '0';
        
        // After fade out, hide it completely
        setTimeout(() => {
            passwordOverlay.classList.add('hidden');
        }, 500);

        // Make menu visible but transparent initially
        menuOverlay.classList.remove('hidden');
        menuOverlay.style.opacity = '0';
        siteHeader.classList.remove('hidden');
        siteHeader.style.opacity = '0';

        // Fade in the menu and header
        setTimeout(() => {
            menuOverlay.style.opacity = '1';
            siteHeader.style.opacity = '1';
        }, 100); // Short delay to ensure it's rendered before fading in

    } else {
        passwordError.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Menu Logic
menuButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Fade out the menu
        menuOverlay.style.opacity = '0';
        setTimeout(() => {
            menuOverlay.classList.add('hidden');
        }, 500); // Match timeout to CSS transition

        mainContainer.classList.remove('hidden');
        document.body.style.overflow = 'auto';
        
        // Initialize canvas size now that it's visible
        resizeCanvas();
    });
});

// Captcha Logic
captchaSubmit.addEventListener('click', solveCaptcha);
captchaInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        solveCaptcha();
    }
});

function showCaptcha() {
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
        startButton.disabled = false;
        startButton.textContent = 'Play Again';
    } else {
        captchaError.classList.remove('hidden');
        captchaInput.value = '';
        captchaInput.focus();
    }
}

function getCrashPoint() {
    if (Math.random() < 0.015) {
        return 1.00;
    }
    const r = Math.random();
    const multiplier = 0.993 / (1 - r);
    return Math.max(1, Math.floor(multiplier * 100) / 100);
}

function startGame() {
    crashed = false;
    crashAnimationTime = 0;
    multiplier = 1;
    startTime = Date.now();
    historicalMultipliers = [{time: 0, multi: 1}];
    
    multiplierDisplay.textContent = '1.00x';
    multiplierDisplay.style.color = 'white';
    startButton.disabled = true;

    const crashPoint = getCrashPoint();
    crashPointValue = crashPoint;
    console.log(`The game will crash at ${crashPoint}x`);

    function gameLoop() {
        if (crashAnimationTime > 0) {
            crashAnimationTime--;
            drawChart();
            drawCrashExplosion();
            if (crashAnimationTime === 0) {
                if (roundCounter % 3 === 0) {
                    showCaptcha();
                } else {
                    startButton.disabled = false;
                    startButton.textContent = 'Play Again';
                }
                return; // End animation loop
            }
            requestAnimationFrame(gameLoop);
            return;
        }

        if (crashed) return;

        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
        multiplier = Math.pow(1.05, elapsedTime);

        if (multiplier >= crashPoint) {
            crashed = true;
            roundCounter++;
            crashAnimationTime = 60; // 60 frames for animation
            const finalMultiplier = crashPoint;
            multiplierDisplay.textContent = `Crashed @ ${finalMultiplier.toFixed(2)}x`;
            multiplierDisplay.style.color = '#f56565';
            
            updateHistory(finalMultiplier);
            requestAnimationFrame(gameLoop); // Start animation loop
            return;
        }

        historicalMultipliers.push({ time: elapsedTime, multi: multiplier });
        multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
        
        drawChart();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

function getChartCoordinates(point) {
    const { width, height } = crashChart;
    const lastPoint = historicalMultipliers[historicalMultipliers.length - 1];
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

    // Draw a more detailed airplane/rocket shape
    ctx.fillStyle = '#48bb78';
    ctx.shadowColor = '#48bb78';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(10, 0);    // Nose
    ctx.lineTo(-10, -7);  // Left wing
    ctx.lineTo(-7, 0);    // Fuselage back
    ctx.lineTo(-10, 7);   // Right wing
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

    // Line Style
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 4;
    
    // Glow effect
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
    ctx.shadowBlur = 0; // Reset shadow for other elements

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
    if (multiplier < 2) return '#f56565'; // Red
    if (multiplier < 10) return '#ed8936'; // Orange
    return '#48bb78'; // Green
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

    // Draw horizontal lines and labels
    for (let i = 0; i <= 5; i++) {
        const y = (i / 5) * height;
        const multiplier = maxMultiVisible - (i / 5) * (maxMultiVisible - 1);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(`${multiplier.toFixed(1)}x`, 5, y - 5);
    }

    // Draw vertical lines and labels
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

startButton.addEventListener('click', startGame);

function resizeCanvas() {
    const container = document.getElementById('game-container');
    crashChart.width = container.clientWidth - 4 * 16; // 2rem padding on each side
    crashChart.height = 300; 
    drawChart();
}

window.addEventListener('resize', resizeCanvas);
// Do not call resizeCanvas() initially, as the canvas is hidden.
// resizeCanvas(); 
