class PomodoroTimer {
    constructor() {
        this.workDuration = 25 * 60; // 25 minutes in seconds
        this.shortBreakDuration = 5 * 60; // 5 minutes in seconds
        this.longBreakDuration = 15 * 60; // 15 minutes in seconds
        this.mode = 'work'; // 'work' or 'rest'
        this.currentTime = this.workDuration;
        this.isRunning = false;
        this.isPaused = false;
        this.currentSession = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.completedSessions = 0;
        this.intervalId = null;
        this.totalDuration = this.workDuration;
        this.hasActiveTimer = false; // Track if timer has been started and not reset
        this.musicMode = false; // Track music mode state

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.updateModeDisplay();
        this.updateMusicToggleDisplay();
    }

    initializeElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.addTimeBtn = document.getElementById('addTimeBtn');
        this.progressFill = document.getElementById('progressFill');
        this.sessionCount = document.getElementById('sessionCount');
        this.modeToggleButton = document.getElementById('modeToggleButton');
        this.modeToggleLabel = document.getElementById('modeToggleLabel');
        this.musicToggleButton = document.getElementById('musicToggleButton');
        this.musicToggleLabel = document.getElementById('musicToggleLabel');
        this.spotifyContainer = document.getElementById('spotifyContainer');
        this.spotifyPlayer = document.getElementById('spotifyPlayer');
        this.defaultSpotifySrc = this.spotifyPlayer ? this.spotifyPlayer.getAttribute('src') : '';
        this.isSpotifyLoaded = !!this.defaultSpotifySrc;
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.addTimeBtn.addEventListener('click', () => this.addFiveMinutes());
        if (this.modeToggleButton) {
            this.modeToggleButton.addEventListener('click', () => this.switchMode());
        }
        if (this.musicToggleButton) {
            this.musicToggleButton.addEventListener('click', () => this.toggleMusicMode());
        }
    }

    switchMode() {
        // If a session is running, stop it before switching modes
        if (this.isRunning) {
            this.stopActiveTimerForModeSwitch();
        }

        // Toggle mode
        this.mode = this.mode === 'work' ? 'rest' : 'work';
        
        // Update timer based on mode
        if (this.mode === 'work') {
            this.currentTime = this.workDuration;
            this.totalDuration = this.workDuration;
            this.currentSession = 'work';
        } else {
            this.currentTime = this.shortBreakDuration;
            this.totalDuration = this.shortBreakDuration;
            this.currentSession = 'shortBreak';
        }

        this.hasActiveTimer = false;
        
        this.updateModeDisplay();
        this.updateDisplay();
        this.updateMusicPlayer();
    }

    updateModeDisplay() {
        const isWorkMode = this.mode === 'work';
        const targetMode = isWorkMode ? 'rest' : 'work';

        if (this.modeToggleLabel) {
            this.modeToggleLabel.textContent = targetMode === 'work' ? 'Work Mode' : 'Rest Mode';
        }

        if (this.modeToggleButton) {
            this.modeToggleButton.dataset.mode = targetMode;
            this.modeToggleButton.setAttribute('aria-pressed', String(!isWorkMode));
            this.modeToggleButton.setAttribute(
                'aria-label',
                targetMode === 'work' ? 'Switch to Work Mode' : 'Switch to Rest Mode'
            );
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        this.timerDisplay.textContent = this.formatTime(this.currentTime);
        
        const progress = ((this.totalDuration - this.currentTime) / this.totalDuration) * 100;
        this.progressFill.style.width = `${progress}%`;

        // Update session type display
        const sessionNames = {
            'work': 'Work Session',
            'shortBreak': 'Short Break',
            'longBreak': 'Long Break'
        };
        this.sessionType.textContent = sessionNames[this.currentSession];

        // Update session count
        this.sessionCount.textContent = `Completed sessions: ${this.completedSessions}`;

        // Update tab title: show countdown if there's an active timer (running or paused)
        // Show "Pomodoro Timer" only when there's no active clock
        if (this.hasActiveTimer) {
            document.title = `${this.formatTime(this.currentTime)} - Pomodoro Timer`;
        } else {
            document.title = 'Pomodoro Timer';
        }

        // Update Spotify player visibility
        this.updateMusicPlayer();
    }

    start() {
        // Stop any running timer
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Only reset timer if it wasn't paused (fresh start)
        // If paused, resume from current time
        if (!this.isPaused) {
            // Use current mode to set session
            if (this.mode === 'work') {
                this.currentSession = 'work';
                this.currentTime = this.workDuration;
                this.totalDuration = this.workDuration;
            } else {
                this.currentSession = 'shortBreak';
                this.currentTime = this.shortBreakDuration;
                this.totalDuration = this.shortBreakDuration;
            }
        }

        this.isRunning = true;
        this.isPaused = false;
        this.hasActiveTimer = true; // Mark timer as active when started

        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';

        this.updateDisplay();
        this.updateMusicPlayer();

        this.intervalId = setInterval(() => {
            if (this.currentTime > 0) {
                this.currentTime--;
                this.updateDisplay();
            } else {
                this.completeSession();
            }
        }, 1000);
    }

    pause() {
        this.isPaused = true;
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        // Update display to show countdown in tab title even when paused
        this.updateDisplay();
        this.updateMusicPlayer();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.hasActiveTimer = false; // Mark timer as inactive when reset
        clearInterval(this.intervalId);
        
        // Reset to current mode's default duration
        if (this.mode === 'work') {
            this.currentTime = this.workDuration;
            this.totalDuration = this.workDuration;
            this.currentSession = 'work';
        } else {
            this.currentTime = this.shortBreakDuration;
            this.totalDuration = this.shortBreakDuration;
            this.currentSession = 'shortBreak';
        }

        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.updateDisplay();
        this.updateMusicPlayer();
    }

    addFiveMinutes() {
        // Add 5 minutes (300 seconds) to current time and total duration
        const fiveMinutes = 5 * 60; // 300 seconds
        this.currentTime += fiveMinutes;
        this.totalDuration += fiveMinutes;
        
        // If timer was inactive, mark it as active now
        if (!this.hasActiveTimer) {
            this.hasActiveTimer = true;
        }
        
        this.updateDisplay();
    }

    toggleMusicMode() {
        this.musicMode = !this.musicMode;
        this.updateMusicToggleDisplay();
        this.updateMusicPlayer();
    }

    updateMusicToggleDisplay() {
        if (!this.musicToggleButton || !this.musicToggleLabel) {
            return;
        }

        this.musicToggleButton.dataset.active = String(this.musicMode);
        this.musicToggleButton.setAttribute('aria-pressed', String(this.musicMode));
        this.musicToggleButton.setAttribute(
            'aria-label',
            this.musicMode ? 'Disable Music Mode' : 'Enable Music Mode'
        );
        this.musicToggleLabel.textContent = this.musicMode ? 'Music On' : 'Music Off';
        // SVG color update happens via CSS, so nothing else is required
    }

    updateMusicPlayer() {
        if (!this.spotifyContainer || !this.spotifyPlayer) {
            return;
        }

        // Show Spotify player only if:
        // 1. Music mode is enabled
        // 2. We're in work mode (mode === 'work')
        // Note: Player shows during work sessions, even if timer hasn't started yet
        const shouldShow = this.musicMode && this.mode === 'work';
        
        if (shouldShow) {
            this.spotifyContainer.classList.add('active');
            if (!this.isSpotifyLoaded && this.defaultSpotifySrc) {
                this.spotifyPlayer.src = this.defaultSpotifySrc;
                this.isSpotifyLoaded = true;
            }
        } else {
            this.spotifyContainer.classList.remove('active');
            this.pauseSpotifyPlayback();
        }
    }

    pauseSpotifyPlayback() {
        if (!this.spotifyPlayer || !this.isSpotifyLoaded) {
            return;
        }

        // Loading a blank page stops playback while the player is hidden
        this.spotifyPlayer.src = 'about:blank';
        this.isSpotifyLoaded = false;
    }

    stopActiveTimerForModeSwitch() {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
    }

    completeSession() {
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.hasActiveTimer = false; // Mark timer as inactive when session completes
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';

        // Play notification sound (using Web Audio API)
        this.playNotification();

        if (this.currentSession === 'work') {
            this.completedSessions++;
        }

        // Show alert first
        const sessionNames = {
            'work': 'Work Session',
            'shortBreak': 'Short Break',
            'longBreak': 'Long Break'
        };
        alert(`Session complete! ${sessionNames[this.currentSession]} finished.`);
        
        // After alert is dismissed, automatically switch modes
        if (this.currentSession === 'work') {
            // Switch to rest mode after work session
            this.mode = 'rest';
            this.currentTime = this.shortBreakDuration;
            this.totalDuration = this.shortBreakDuration;
            this.currentSession = 'shortBreak';
        } else {
            // Switch to work mode after rest session
            this.mode = 'work';
            this.currentTime = this.workDuration;
            this.totalDuration = this.workDuration;
            this.currentSession = 'work';
        }

        this.updateModeDisplay();
        this.updateDisplay();
        this.updateMusicPlayer();
    }

    playNotification() {
        // Create a more noticeable alarm sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Create a more alarm-like sound with varying frequency
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
        oscillator.type = 'sine';

        // Create a pulsing effect for the alarm
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.35);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.45);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
