// Audio Context for retro sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Retro beep sound generator
function playBeep(frequency = 800, duration = 50) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Click sound
function playClick() {
    playBeep(1200, 30);
}

// Spin sound
function playSpinSound() {
    playBeep(400, 100);
}

// Success sound
function playSuccess() {
    playBeep(600, 100);
    setTimeout(() => playBeep(800, 100), 100);
    setTimeout(() => playBeep(1000, 150), 200);
}

// Initialize year dropdown
const yearSelect = document.getElementById('year');
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= 1920; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
}

// Initialize slot machine on load
window.addEventListener('load', () => {
    initializeSlotMachine();
});

// Radio button interactions
document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        playClick();
    });
});

// Slot Machine Implementation
let dayTensValue = 0;
let dayOnesValue = 0;
let isSpinning = false;

function initializeSlotMachine() {
    const reelStripTens = document.getElementById('reelStripTens');
    const reelStripOnes = document.getElementById('reelStripOnes');

    // Create reel numbers (0-9 repeated for continuous effect)
    for (let i = 0; i < 4; i++) {
        for (let num = 0; num <= 9; num++) {
            const divTens = document.createElement('div');
            divTens.className = 'reel-number';
            divTens.textContent = num;
            reelStripTens.appendChild(divTens);

            const divOnes = document.createElement('div');
            divOnes.className = 'reel-number';
            divOnes.textContent = num;
            reelStripOnes.appendChild(divOnes);
        }
    }
}

function spinReel(reelStrip, finalValue, duration) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const numbers = reelStrip.querySelectorAll('.reel-number');
        const numberHeight = 80; // Updated to match new reel height
        const totalNumbers = numbers.length;

        // Calculate spins (multiple full rotations + final position)
        const fullRotations = 8;
        const totalDistance = (fullRotations * 10 + finalValue) * numberHeight;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentDistance = totalDistance * eased;
            reelStrip.style.transform = `translateY(-${currentDistance}px)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Reset to equivalent position in first set
                reelStrip.style.transition = 'none';
                reelStrip.style.transform = `translateY(-${finalValue * numberHeight}px)`;
                setTimeout(() => {
                    reelStrip.style.transition = 'transform 0.1s linear';
                    resolve();
                }, 50);
            }
        }

        animate();
    });
}

function getMonthNumber(monthName) {
    const months = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return months[monthName] || 1;
}

function getValidDay(tens, ones, month) {
    const day = parseInt(`${tens}${ones}`);
    const monthNum = getMonthNumber(month);

    // Days in each month (non-leap year)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxDay = daysInMonth[monthNum - 1];

    // If day is 00 or invalid, return valid random day
    if (day === 0 || day > maxDay) {
        const validDay = Math.floor(Math.random() * maxDay) + 1;
        return {
            tens: Math.floor(validDay / 10),
            ones: validDay % 10
        };
    }

    return { tens, ones };
}

document.getElementById('spinButton').addEventListener('click', async () => {
    if (isSpinning) return;

    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;

    playSpinSound();

    // Generate random final values
    const month = document.getElementById('month').value;
    let rawTens = Math.floor(Math.random() * 4); // 0-3
    let rawOnes = Math.floor(Math.random() * 10); // 0-9

    // Validate and adjust if needed
    const validDay = getValidDay(rawTens, rawOnes, month);
    dayTensValue = validDay.tens;
    dayOnesValue = validDay.ones;

    const reelStripTens = document.getElementById('reelStripTens');
    const reelStripOnes = document.getElementById('reelStripOnes');

    // Spin with intentionally slow animation (2.5-3 seconds)
    const duration = 2500 + Math.random() * 500;

    // Add clicking sound during spin
    const clickInterval = setInterval(() => {
        playBeep(1000, 20);
    }, 200);

    await Promise.all([
        spinReel(reelStripTens, dayTensValue, duration),
        spinReel(reelStripOnes, dayOnesValue, duration + 200) // Second reel stops slightly later
    ]);

    clearInterval(clickInterval);
    playBeep(1500, 100);

    // Update display
    const dayValue = `${dayTensValue}${dayOnesValue}`.padStart(2, '0');
    document.getElementById('displayDay').textContent = dayValue;

    isSpinning = false;
    spinButton.disabled = false;
});

// Update month display
document.getElementById('month').addEventListener('change', (e) => {
    playClick();
    const monthValue = e.target.value || '--';
    document.getElementById('displayMonth').textContent = monthValue;
});

// Update year display
document.getElementById('year').addEventListener('change', (e) => {
    playClick();
    const yearValue = e.target.value || '----';
    document.getElementById('displayYear').textContent = yearValue;
});

// Input sound effects
document.getElementById('name').addEventListener('input', (e) => {
    if (e.data) {
        playBeep(1000 + Math.random() * 200, 20);
    }
});

// Form submission
document.getElementById('registrationForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const month = document.getElementById('month').value;
    const year = parseInt(document.getElementById('year').value);
    const day = parseInt(`${dayTensValue}${dayOnesValue}`);

    // Validate day was spun
    if (day === 0) {
        playBeep(200, 300);
        alert('ERROR: PLEASE SPIN FOR DAY VALUE');
        return;
    }

    // Validate all fields
    if (!name || !gender || !month || !year) {
        playBeep(200, 300);
        alert('ERROR: ALL FIELDS REQUIRED');
        return;
    }

    playSuccess();

    // Calculate age and birth year difference
    const birthDate = new Date(year, getMonthNumber(month) - 1, day);
    const today = new Date();
    const age = today.getFullYear() - year;
    const yearDifference = year - today.getFullYear();

    // Generate silly message
    let message = '';
    if (yearDifference > 0) {
        // Future date
        message = `You were born on ${month} ${day}, ${year}<br><br>You will be born in ${yearDifference} years! 🎂`;
    } else if (age < 0) {
        // Future date
        message = `You were born on ${month} ${day}, ${year}<br><br>You will be born in ${Math.abs(age)} years! 🎂`;
    } else if (age === 0) {
        message = `You were born on ${month} ${day}, ${year}<br><br>Welcome to the world, newborn! 👶`;
    } else if (age > 120) {
        message = `You were born on ${month} ${day}, ${year}<br><br>You are ${age} years old!<br>Wow, you're ancient! 🦖`;
    } else {
        message = `You were born on ${month} ${day}, ${year}<br><br>You are ${age} years old!`;
    }

    // Show results
    const formBox = document.getElementById('formBox');
    const resultsBox = document.getElementById('resultsBox');
    const resultsContent = document.getElementById('resultsContent');

    resultsContent.innerHTML = `<p>${message}</p>`;

    formBox.classList.add('hidden');
    resultsBox.classList.remove('hidden');

    // Log registration data
    console.log('Registration Data:', {
        name,
        gender,
        dateOfBirth: `${month} ${day}, ${year}`,
        age: age
    });
});

// Retry button functionality
document.getElementById('retryButton').addEventListener('click', () => {
    playClick();

    const formBox = document.getElementById('formBox');
    const resultsBox = document.getElementById('resultsBox');

    resultsBox.classList.add('hidden');
    formBox.classList.remove('hidden');

    document.getElementById('registrationForm').reset();
    document.getElementById('displayDay').textContent = '--';
    document.getElementById('displayMonth').textContent = '--';
    document.getElementById('displayYear').textContent = '----';
    dayTensValue = 0;
    dayOnesValue = 0;
});

// Dropdown sound effects
document.querySelectorAll('select').forEach(select => {
    select.addEventListener('focus', () => playBeep(1000, 30));
    select.addEventListener('blur', () => playBeep(800, 30));
});
