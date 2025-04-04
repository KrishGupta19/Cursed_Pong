const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const rotateLeftButton = document.getElementById('rotateLeft');
const rotateRightButton = document.getElementById('rotateRight');
const scoreDisplay = document.getElementById('scoreDisplay');
const gameOverScreen = document.getElementById('gameOverScreen');
const newGameButton = document.getElementById('newGameButton');
const finalScoreDisplayScreen = document.getElementById('finalScoreDisplayScreen');

let paddleAngle = Math.PI / 2;
const initialPaddleLength = 60; // Store initial size for reset
let paddleLength = initialPaddleLength; // Current paddle length (arc length in pixels)
const minPaddleLength = 15;       // Minimum paddle size
const maxPaddleLength = 150;      // Maximum paddle size (adjust as desired)
const paddleLengthChangeAmount = 5; // Pixels to add/subtract per hit
let paddleSpeed = 0.09;

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: Math.random() * 2 * Math.PI, // Angle of velocity
    speed: 1, // Start with a reasonable speed
    radius: 10
};

let gameRadius = 150;
let score = 0;
let gameRunning = true;
let animationFrameId = null;

let isRotatingLeft = false;
let isRotatingRight = false;
let touchStartX = null;

// --- Utility Functions ---
function normalizeAngle(angle) {
    return (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.angle = Math.random() * 2 * Math.PI;
    ball.speed = 3; // Reset speed
}

// --- Drawing Functions ---
function drawBoundary() {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, gameRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function drawPaddle() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(paddleAngle);

    // Calculate the start and end angles based on CURRENT paddleLength
    const paddleAngleSpan = paddleLength / gameRadius; // Angle in radians
    const startAngle = -paddleAngleSpan / 2;
    const endAngle = paddleAngleSpan / 2;

    ctx.beginPath();
    ctx.arc(0, 0, gameRadius, startAngle, endAngle);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0095DD';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.closePath();
}

// --- Game Logic Functions ---
function updateBall() {
    ball.x += ball.speed * Math.cos(ball.angle);
    ball.y += ball.speed * Math.sin(ball.angle);

    const dx = ball.x - canvas.width / 2;
    const dy = ball.y - canvas.height / 2;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const ballAngleFromCenter = Math.atan2(dy, dx);

    if (distFromCenter >= gameRadius - ball.radius) {
        // Calculate paddle arc angles based on CURRENT paddleLength
        const paddleAngleSpan = paddleLength / gameRadius;
        const paddleStartAngle = normalizeAngle(paddleAngle - paddleAngleSpan / 2);
        const paddleEndAngle = normalizeAngle(paddleAngle + paddleAngleSpan / 2);
        const currentBallAngle = normalizeAngle(ballAngleFromCenter);

        let collision = false;
        if (paddleStartAngle < paddleEndAngle) {
            if (currentBallAngle >= paddleStartAngle && currentBallAngle <= paddleEndAngle) {
                collision = true;
            }
        } else {
            if (currentBallAngle >= paddleStartAngle || currentBallAngle <= paddleEndAngle) {
                collision = true;
            }
        }

        if (collision) {
            // --- Bounce Logic ---
            const incidenceAngle = ball.angle;
            const surfaceNormalAngle = ballAngleFromCenter;
            ball.angle = normalizeAngle(2 * surfaceNormalAngle - incidenceAngle + Math.PI);

            ball.x = canvas.width / 2 + (gameRadius - ball.radius - 1) * Math.cos(ballAngleFromCenter);
            ball.y = canvas.height / 2 + (gameRadius - ball.radius - 1) * Math.sin(ballAngleFromCenter);

            score++;
            scoreDisplay.textContent = `Score: ${score}`;

            // --- Cursed Paddle Logic - START ---
            if (Math.random() < 0.5) { // 50% chance to decrease size
                paddleLength -= paddleLengthChangeAmount;
            } else { // 50% chance to increase size
                paddleLength += paddleLengthChangeAmount;
            }

            // Clamp the paddle length to the defined min/max values
            if (paddleLength < minPaddleLength) {
                paddleLength = minPaddleLength;
            } else if (paddleLength > maxPaddleLength) {
                paddleLength = maxPaddleLength;
            }
            // --- Cursed Paddle Logic - END ---

            // Optional: Increase speed slightly
            // ball.speed *= 1.01;

        } else {
            endGame();
        }
    }
}


function updatePaddleRotation() {
    if (isRotatingLeft) {
        paddleAngle -= paddleSpeed;
    }
    if (isRotatingRight) {
        paddleAngle += paddleSpeed;
    }
    paddleAngle = normalizeAngle(paddleAngle);
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameOverScreen.style.display = 'flex';
    if (finalScoreDisplayScreen) {
        finalScoreDisplayScreen.textContent = `Your Score: ${score}`;
    }
    isRotatingLeft = false;
    isRotatingRight = false;
}

function gameLoop() {
    if (!gameRunning) return;

    updatePaddleRotation();
    updateBall();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoundary();
    drawPaddle(); // Will now use the potentially changed paddleLength
    drawBall();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---

// Button Controls (Continuous Hold - Swapped as per original code)
if (rotateLeftButton) {
    rotateLeftButton.addEventListener('mousedown', () => { isRotatingRight = true; });
    rotateLeftButton.addEventListener('touchstart', (e) => { e.preventDefault(); isRotatingRight = true; }, { passive: false });
    rotateLeftButton.addEventListener('mouseup', () => { isRotatingRight = false; });
    rotateLeftButton.addEventListener('mouseleave', () => { isRotatingRight = false; });
    rotateLeftButton.addEventListener('touchend', () => { isRotatingRight = false; });
    rotateLeftButton.addEventListener('touchcancel', () => { isRotatingRight = false; });
}
if (rotateRightButton) {
    rotateRightButton.addEventListener('mousedown', () => { isRotatingLeft = true; });
    rotateRightButton.addEventListener('touchstart', (e) => { e.preventDefault(); isRotatingLeft = true; }, { passive: false });
    rotateRightButton.addEventListener('mouseup', () => { isRotatingLeft = false; });
    rotateRightButton.addEventListener('mouseleave', () => { isRotatingLeft = false; });
    rotateRightButton.addEventListener('touchend', () => { isRotatingLeft = false; });
    rotateRightButton.addEventListener('touchcancel', () => { isRotatingLeft = false; });
}
window.addEventListener('mouseup', () => { isRotatingLeft = false; isRotatingRight = false; });
window.addEventListener('touchend', () => { isRotatingLeft = false; isRotatingRight = false; });

// --- New Game Button ---
if (newGameButton) {
    newGameButton.addEventListener('click', () => {
        score = 0;
        paddleAngle = Math.PI / 2;
        paddleLength = initialPaddleLength; // <<< RESET PADDLE LENGTH HERE
        resetBall();
        scoreDisplay.textContent = `Score: ${score}`;
        gameOverScreen.style.display = 'none';
        gameRunning = true;
        cancelAnimationFrame(animationFrameId);
        gameLoop();
    });
}

// --- Touch Controls (Swipe - Swapped as per original code) ---
if (canvas) {
    canvas.addEventListener('touchstart', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (touchStartX === null || e.target !== canvas) return;
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - touchStartX;
        const sensitivity = 10;

        if (deltaX > sensitivity) {
            paddleAngle -= paddleSpeed * 2; // Swipe Right -> Rotate Left
        } else if (deltaX < -sensitivity) {
            paddleAngle += paddleSpeed * 2; // Swipe Left -> Rotate Right
        }
         paddleAngle = normalizeAngle(paddleAngle);
        touchStartX = touchX;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (e.target === canvas) touchStartX = null;
    });
     canvas.addEventListener('touchcancel', (e) => {
        if (e.target === canvas) touchStartX = null;
    });
}

// --- Initial Game Start ---
function initializeGame() {
    // Optional: dynamically set gameRadius based on canvas size if needed
    // gameRadius = Math.min(canvas.width, canvas.height) / 2 * 0.8;
    // maxPaddleLength = gameRadius * 2.5; // Recalculate max length if radius changes

    paddleLength = initialPaddleLength; // Ensure it starts with the correct size
    resetBall();
    scoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    gameLoop();
}

window.onload = initializeGame;