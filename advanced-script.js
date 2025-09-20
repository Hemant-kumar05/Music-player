class AdvancedMusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentTrack = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'none'; // none, one, all
        this.audioContext = null;
        this.analyzer = null;
        this.bufferLength = 0;
        this.dataArray = null;
        this.equalizer = {};
        this.animationId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupAudioContext();
        this.setupEqualizer();
        this.loadSavedSettings();
        this.showNotification('Advanced Music Player Loaded! 🎵');
    }

    initializeElements() {
        // Get all DOM elements
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressSlider = document.getElementById('progressSlider');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.speedControl = document.getElementById('speedControl');
        this.searchInput = document.getElementById('searchInput');
        this.playlistElement = document.getElementById('playlist');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.trackAlbum = document.getElementById('trackAlbum');
        this.currentTime = document.querySelector('.current-time');
        this.totalTime = document.querySelector('.total-time');
        this.progress = document.getElementById('progress');
        this.visualizer = document.getElementById('visualizer');
        this.canvasCtx = this.visualizer.getContext('2d');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.fileInput = document.getElementById('fileInput');
        this.dropZone = document.getElementById('dropZone');
        this.eqPresets = document.getElementById('eqPresets');
        this.trackArt = document.getElementById('trackArt');
    }

    setupEventListeners() {
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateTrackInfo());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('loadstart', () => this.showLoading());
        this.audio.addEventListener('canplay', () => this.hideLoading());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));

        // Control events
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.progressSlider.addEventListener('input', () => this.seekTo());
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.speedControl.addEventListener('change', () => this.setPlaybackSpeed());

        // Playlist controls
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.clearBtn.addEventListener('click', () => this.clearPlaylist());

        // Search
        this.searchInput.addEventListener('input', () => this.filterPlaylist());

        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Equalizer
        this.eqPresets.addEventListener('change', () => this.applyEQPreset());

        // Drag and drop
        this.setupDragAndDrop();

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Progress bar click
        this.progress.parentElement.addEventListener('click', (e) => this.handleProgressClick(e));
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            document.addEventListener(eventName, () => {
                this.dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, () => {
                this.dropZone.classList.remove('dragover');
            }, false);
        });

        document.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFiles(files) {
        const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
        
        if (audioFiles.length === 0) {
            this.showNotification('Please select valid audio files! 🎵', 'warning');
            return;
        }

        this.showNotification(`Adding ${audioFiles.length} song(s) to playlist... 📁`);

        for (let file of audioFiles) {
            try {
                const track = await this.createTrackFromFile(file);
                this.addToPlaylist(track);
            } catch (error) {
                console.error('Error processing file:', file.name, error);
            }
        }
        
        this.updatePlaylistDisplay();
        this.savePlaylist();
        
        // Auto-play first track if playlist was empty
        if (this.playlist.length === audioFiles.length) {
            this.loadCurrentTrack();
        }
        
        this.showNotification(`Successfully added ${audioFiles.length} song(s)! 🎉`, 'success');
    }

    async createTrackFromFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const audio = new Audio();
            
            const timeout = setTimeout(() => {
                reject(new Error('Timeout loading audio metadata'));
            }, 5000);
            
            audio.addEventListener('loadedmetadata', () => {
                clearTimeout(timeout);
                
                // Extract metadata from filename
                const filename = file.name.replace(/\.[^/.]+$/, "");
                const parts = filename.split(' - ');
                
                resolve({
                    title: parts.length > 1 ? parts[1] : filename,
                    artist: parts.length > 1 ? parts[0] : "Unknown Artist",
                    album: "Unknown Album",
                    duration: audio.duration,
                    url: url,
                    file: file,
                    size: file.size
                });
            });
            
            audio.addEventListener('error', () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load audio file'));
            });
            
            audio.src = url;
        });
    }

    addToPlaylist(track) {
        this.playlist.push(track);
    }

    updatePlaylistDisplay() {
        this.playlistElement.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === this.currentTrack ? 'active' : ''} fade-in`;
            
            const isCurrentAndPlaying = index === this.currentTrack && this.isPlaying;
            
            item.innerHTML = `
                <i class="fas ${isCurrentAndPlaying ? 'fa-volume-up' : 'fa-music'}"></i>
                <div class="song-info">
                    <div class="song-name">${track.title}</div>
                    <div class="song-artist">${track.artist}</div>
                </div>
                <span class="song-duration">${this.formatTime(track.duration)}</span>
            `;
            
            item.addEventListener('click', () => {
                this.currentTrack = index;
                this.loadCurrentTrack();
                this.play();
            });
            
            // Add double-click to remove
            item.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.removeFromPlaylist(index);
            });
            
            this.playlistElement.appendChild(item);
        });
    }

    removeFromPlaylist(index) {
        if (index >= 0 && index < this.playlist.length) {
            const removedSong = this.playlist.splice(index, 1)[0];
            this.showNotification(`Removed: ${removedSong.title}`, 'info');
            
            // Adjust current track index
            if (index <= this.currentTrack && this.currentTrack > 0) {
                this.currentTrack--;
            }
            
            // If current track was removed
            if (index === this.currentTrack) {
                if (this.currentTrack >= this.playlist.length) {
                    this.currentTrack = 0;
                }
                
                if (this.playlist.length > 0) {
                    this.loadCurrentTrack();
                } else {
                    this.resetPlayer();
                }
            }
            
            this.updatePlaylistDisplay();
            this.savePlaylist();
        }
    }

    loadCurrentTrack() {
        if (this.playlist.length === 0) {
            this.resetPlayer();
            return;
        }
        
        const track = this.playlist[this.currentTrack];
        this.audio.src = track.url;
        
        this.trackTitle.textContent = track.title;
        this.trackArtist.textContent = track.artist;
        this.trackAlbum.textContent = track.album;
        
        // Add rotation effect to track art
        this.trackArt.classList.remove('rotating');
        
        this.updatePlaylistDisplay();
        this.updateWindowTitle();
    }

    togglePlay() {
        if (this.playlist.length === 0) {
            this.showNotification('Please add some music first! 🎵', 'warning');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        if (!this.audio.src) this.loadCurrentTrack();
        
        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audio.play();
            
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.startVisualization();
            this.trackArt.classList.add('rotating');
            this.updatePlaylistDisplay();
            
            this.showNotification(`Now Playing: ${this.playlist[this.currentTrack].title}`, 'success');
        } catch (error) {
            console.error('Playback failed:', error);
            this.showNotification('Playback failed. Please try again.', 'error');
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.trackArt.classList.remove('rotating');
        this.updatePlaylistDisplay();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.isShuffle) {
            this.currentTrack = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentTrack = (this.currentTrack + 1) % this.playlist.length;
        }
        
        this.loadCurrentTrack();
        if (this.isPlaying) this.play();
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        
        // If current time > 3 seconds, restart current track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        this.currentTrack = this.currentTrack === 0 
            ? this.playlist.length - 1 
            : this.currentTrack - 1;
        
        this.loadCurrentTrack();
        if (this.isPlaying) this.play();
    }

    handleTrackEnd() {
        switch (this.repeatMode) {
            case 'one':
                this.audio.currentTime = 0;
                this.play();
                break;
            case 'all':
                this.nextTrack();
                break;
            default:
                if (this.currentTrack < this.playlist.length - 1) {
                    this.nextTrack();
                } else {
                    this.pause();
                    this.showNotification('Playlist ended 🎵');
                }
        }
    }

    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = `${progress}%`;
            this.progressSlider.value = progress;
            
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
            this.totalTime.textContent = this.formatTime(this.audio.duration);
        }
    }

    seekTo() {
        const time = (this.progressSlider.value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }

    handleProgressClick(e) {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        if (this.audio.duration) {
            this.audio.currentTime = percentage * this.audio.duration;
        }
    }

    setVolume() {
        this.audio.volume = this.volumeSlider.value / 100;
        this.saveSettings();
        
        // Update volume icon
        const volumeIcons = document.querySelectorAll('.volume-control i');
        const volume = this.volumeSlider.value;
        
        volumeIcons.forEach(icon => {
            if (volume == 0) {
                icon.className = icon.className.includes('volume-down') ? 'fas fa-volume-mute' : icon.className;
            } else if (volume < 50) {
                icon.className = icon.className.includes('volume-down') ? 'fas fa-volume-down' : icon.className;
            } else {
                icon.className = icon.className.includes('volume-up') ? 'fas fa-volume-up' : icon.className;
            }
        });
    }

    setPlaybackSpeed() {
        this.audio.playbackRate = parseFloat(this.speedControl.value);
        this.showNotification(`Speed: ${this.speedControl.value}x`, 'info');
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
        this.saveSettings();
        
        const message = this.isShuffle ? 'Shuffle ON 🔀' : 'Shuffle OFF';
        this.showNotification(message, 'info');
    }

    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        this.repeatBtn.classList.toggle('active', this.repeatMode !== 'none');
        
        const icons = {
            'none': 'fa-redo',
            'one': 'fa-redo-alt',
            'all': 'fa-retweet'
        };
        
        const messages = {
            'none': 'Repeat OFF',
            'one': 'Repeat One 🔂',
            'all': 'Repeat All 🔁'
        };
        
        this.repeatBtn.innerHTML = `<i class="fas ${icons[this.repeatMode]}"></i>`;
        this.showNotification(messages[this.repeatMode], 'info');
        this.saveSettings();
    }

    clearPlaylist() {
        if (this.playlist.length === 0) {
            this.showNotification('Playlist is already empty!', 'warning');
            return;
        }
        
        if (confirm('Are you sure you want to clear the entire playlist?')) {
            this.playlist.forEach(track => {
                if (track.url) {
                    URL.revokeObjectURL(track.url);
                }
            });
            
            this.playlist = [];
            this.currentTrack = 0;
            this.pause();
            this.audio.src = '';
            this.updatePlaylistDisplay();
            this.resetPlayer();
            this.savePlaylist();
            
            this.showNotification('Playlist cleared! 🗑️', 'success');
        }
    }

    filterPlaylist() {
        const query = this.searchInput.value.toLowerCase();
        const items = this.playlistElement.children;
        let visibleCount = 0;
        
        for (let item of items) {
            const songName = item.querySelector('.song-name').textContent.toLowerCase();
            const artist = item.querySelector('.song-artist').textContent.toLowerCase();
            
            if (songName.includes(query) || artist.includes(query)) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        }
        
        if (query && visibleCount === 0) {
            this.showNotification('No songs found matching your search', 'warning');
        }
    }

    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyzer = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaElementSource(this.audio);
            
            source.connect(this.analyzer);
            this.analyzer.connect(this.audioContext.destination);
            
            this.analyzer.fftSize = 512;
            this.bufferLength = this.analyzer.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            console.log('Audio Context initialized successfully');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.showNotification('Audio visualization not available', 'warning');
        }
    }

    startVisualization() {
        if (!this.audioContext || !this.analyzer) return;
        
        const draw = () => {
            if (!this.isPlaying) return;
            
            this.animationId = requestAnimationFrame(draw);
            
            this.analyzer.getByteFrequencyData(this.dataArray);
            
            // Clear canvas with gradient background
            const gradient = this.canvasCtx.createLinearGradient(0, 0, 0, this.visualizer.height);
            gradient.addColorStop(0, 'rgba(108, 92, 231, 0.1)');
            gradient.addColorStop(1, 'rgba(162, 155, 254, 0.1)');
            
            this.canvasCtx.fillStyle = gradient;
            this.canvasCtx.fillRect(0, 0, this.visualizer.width, this.visualizer.height);
            
            // Draw frequency bars
            const barWidth = (this.visualizer.width / this.bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < this.bufferLength; i++) {
                barHeight = (this.dataArray[i] / 255) * this.visualizer.height;
                
                const hue = (i / this.bufferLength) * 360;
                const lightness = 50 + (this.dataArray[i] / 255) * 30;
                
                this.canvasCtx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
                this.canvasCtx.fillRect(x, this.visualizer.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
            
            // Draw waveform overlay
            this.drawWaveform();
        };
        
        draw();
    }

    drawWaveform() {
        // Get waveform data
        const waveformData = new Uint8Array(this.analyzer.fftSize);
        this.analyzer.getByteTimeDomainData(waveformData);
        
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.canvasCtx.beginPath();
        
        const sliceWidth = this.visualizer.width * 1.0 / waveformData.length;
        let x = 0;
        
        for (let i = 0; i < waveformData.length; i++) {
            const v = waveformData[i] / 128.0;
            const y = v * this.visualizer.height / 2;
            
            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.canvasCtx.stroke();
    }

    setupEqualizer() {
        const frequencies = ['60Hz', '170Hz', '350Hz', '1kHz', '3.5kHz', '10kHz'];
        const container = document.getElementById('equalizerControls');
        
        frequencies.forEach((freq, index) => {
            const slider = document.createElement('div');
            slider.className = 'eq-slider';
            slider.innerHTML = `
                <input type="range" min="-12" max="12" value="0" step="0.1"
                       id="eq-${index}" data-frequency="${freq}">
                <label>${freq}</label>
            `;
            
            const input = slider.querySelector('input');
            input.addEventListener('input', () => this.updateEqualizer());
            
            container.appendChild(slider);
        });
    }

    applyEQPreset() {
        const presets = {
            flat: [0, 0, 0, 0, 0, 0],
            rock: [3, 2, -1, 1, 3, 4],
            pop: [2, 1, 0, 1, 2, 3],
            jazz: [2, 1, 0, 1, 2, 1],
            classical: [3, 2, 0, 1, 2, 3],
            electronic: [4, 3, 1, 0, 2, 4]
        };
        
        const preset = presets[this.eqPresets.value];
        if (preset) {
            preset.forEach((value, index) => {
                const slider = document.getElementById(`eq-${index}`);
                if (slider) {
                    slider.value = value;
                }
            });
            this.updateEqualizer();
            this.showNotification(`Applied ${this.eqPresets.value.toUpperCase()} preset`, 'success');
        }
    }

    updateEqualizer() {
        // This would connect to Web Audio API equalizer nodes in a full implementation
        console.log('Equalizer updated');
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        this.themeToggle.innerHTML = `<i class="fas fa-${isLight ? 'sun' : 'moon'}"></i>`;
        this.saveSettings();
        
        this.showNotification(`Switched to ${isLight ? 'Light' : 'Dark'} theme`, 'info');
    }

    handleKeyboardShortcuts(e) {
        // Prevent shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowRight':
                if (e.shiftKey) {
                    e.preventDefault();
                    this.nextTrack();
                } else if (e.ctrlKey) {
                    e.preventDefault();
                    this.audio.currentTime += 10;
                }
                break;
            case 'ArrowLeft':
                if (e.shiftKey) {
                    e.preventDefault();
                    this.previousTrack();
                } else if (e.ctrlKey) {
                    e.preventDefault();
                    this.audio.currentTime -= 10;
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 5);
                this.setVolume();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 5);
                this.setVolume();
                break;
            case 'KeyS':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleShuffle();
                }
                break;
            case 'KeyR':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleRepeat();
                }
                break;
            case 'KeyM':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.volumeSlider.value = this.volumeSlider.value > 0 ? 0 : 70;
                    this.setVolume();
                }
                break;
        }
    }

    handleAudioError(e) {
        console.error('Audio error:', e);
        this.showNotification('Error playing audio file', 'error');
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateTrackInfo() {
        this.updateProgress();
    }

    resetPlayer() {
        this.trackTitle.textContent = 'Select a song';
        this.trackArtist.textContent = 'Artist';
        this.trackAlbum.textContent = 'Album';
        this.currentTime.textContent = '0:00';
        this.totalTime.textContent = '0:00';
        this.progress.style.width = '0%';
        this.progressSlider.value = 0;
        this.trackArt.classList.remove('rotating');
        this.updateWindowTitle();
    }

    updateWindowTitle() {
        if (this.playlist.length > 0 && this.isPlaying) {
            const track = this.playlist[this.currentTrack];
            document.title = `${track.title} - ${track.artist} | Advanced Music Player`;
        } else {
            document.title = 'Advanced Music Player';
        }
    }

    showLoading() {
        this.trackArt.classList.add('loading');
    }

    hideLoading() {
        this.trackArt.classList.remove('loading');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Set colors based on type
        const colors = {
            success: '#00b894',
            error: '#e17055',
            warning: '#fdcb6e',
            info: '#6c5ce7'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveSettings() {
        const settings = {
            volume: this.volumeSlider.value,
            isShuffle: this.isShuffle,
            repeatMode: this.repeatMode,
            theme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
            playbackRate: this.speedControl.value
        };
        
        localStorage.setItem('advancedMusicPlayerSettings', JSON.stringify(settings));
    }

    loadSavedSettings() {
        const saved = localStorage.getItem('advancedMusicPlayerSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                
                this.volumeSlider.value = settings.volume || 70;
                this.setVolume();
                
                this.speedControl.value = settings.playbackRate || 1;
                
                if (settings.isShuffle) {
                    this.toggleShuffle();
                }
                
                if (settings.repeatMode && settings.repeatMode !== 'none') {
                    this.repeatMode = 'none';
                    while (this.repeatMode !== settings.repeatMode) {
                        this.toggleRepeat();
                    }
                }
                
                if (settings.theme === 'light') {
                    this.toggleTheme();
                }
                
                console.log('Settings loaded successfully');
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }

    savePlaylist() {
        // Save basic playlist info (without file objects)
        const playlistData = this.playlist.map(track => ({
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            size: track.size
        }));
        
        localStorage.setItem('advancedMusicPlayerPlaylist', JSON.stringify({
            tracks: playlistData,
            currentTrack: this.currentTrack
        }));
    }

    // Public API methods for external control
    addSong(title, artist, url, album = 'Unknown Album') {
        const track = {
            title,
            artist,
            album,
            url,
            duration: 0
        };
        
        this.addToPlaylist(track);
        this.updatePlaylistDisplay();
        this.showNotification(`Added: ${title}`, 'success');
    }

    getPlaylist() {
        return this.playlist.map(track => ({
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: this.formatTime(track.duration)
        }));
    }

    getCurrentTrack() {
        if (this.playlist.length > 0) {
            return this.playlist[this.currentTrack];
        }
        return null;
    }

    setEqualizer(frequencies) {
        frequencies.forEach((value, index) => {
            const slider = document.getElementById(`eq-${index}`);
            if (slider) {
                slider.value = value;
            }
        });
        this.updateEqualizer();
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const player = new AdvancedMusicPlayer();
    window.musicPlayer = player; // Make globally accessible
    
    // Log available commands
    console.log(`
    🎵 Advanced Music Player Commands:
    
    musicPlayer.addSong(title, artist, url)  - Add a song
    musicPlayer.getPlaylist()                - Get current playlist
    musicPlayer.getCurrentTrack()            - Get current track info
    musicPlayer.setEqualizer([...values])    - Set EQ values
    
    Keyboard Shortcuts:
    Space - Play/Pause
    Shift + ← → - Previous/Next track
    Ctrl + ← → - Seek backward/forward 10s
    ↑ ↓ - Volume control
    Ctrl + S - Toggle shuffle
    Ctrl + R - Toggle repeat
    Ctrl + M - Mute/Unmute
    `);
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed');
            });
    });
}