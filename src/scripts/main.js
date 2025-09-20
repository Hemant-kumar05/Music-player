// Enhanced Music Player with Advanced Features
class MusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'track', 'playlist'
        this.volume = 0.7;
        this.currentTime = 0;
        this.duration = 0;
        this.playlist = [];
        this.currentIndex = 0;
        this.userPlaylists = [];
        this.uploadedTracks = [];
        this.currentTheme = 'dark';
        this.filters = {
            genre: '',
            artist: '',
            search: ''
        };
        
        // Web Audio API for equalizer
        this.audioContext = null;
        this.equalizer = null;
        this.analyser = null;
        
        // DOM elements - Updated for Wynk layout
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progressFill = document.getElementById('progress');
        this.progressHandle = document.getElementById('progressHandle');
        this.timeElapsed = document.getElementById('currentTime');
        this.timeTotal = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.currentTrackEl = document.getElementById('currentTrackName');
        this.currentArtistEl = document.getElementById('currentTrackArtist');
        this.currentArtworkEl = document.getElementById('currentTrackImage');
        this.likeBtn = document.getElementById('likeBtn');
        this.trackGrid = document.getElementById('musicGrid');
        this.searchInput = document.getElementById('search-input');
        
        // New elements
        this.musicUpload = document.getElementById('music-upload');
        this.themeToggle = document.getElementById('theme-toggle');
        this.createPlaylistBtn = document.getElementById('create-playlist-btn');
        this.equalizerBtn = document.getElementById('equalizer-btn');
        this.genreFilter = document.getElementById('genre-filter');
        this.artistFilter = document.getElementById('artist-filter');
        this.clearFiltersBtn = document.getElementById('clear-filters');
        
        // Modal elements
        this.playlistModal = document.getElementById('playlist-modal');
        this.equalizerModal = document.getElementById('equalizer-modal');
        
        // Validate critical elements
        this.validateElements();
        
        // Initialize
        this.init();
    }
    
    validateElements() {
        const criticalElements = [
            'audioPlayer', 'playPauseBtn', 'trackGrid', 
            'currentTrackEl', 'currentArtistEl', 'progressFill'
        ];
        
        criticalElements.forEach(element => {
            if (!this[element]) {
                console.error(`Critical element missing: ${element}`);
            }
        });
        
        console.log('Music Player initialized with elements:', {
            audioPlayer: !!this.audioPlayer,
            playPauseBtn: !!this.playPauseBtn,
            trackGrid: !!this.trackGrid
        });
    }
    
    init() {
        console.log('Initializing Enhanced Music Player...');
        this.setupEventListeners();
        this.loadSampleTracks();
        this.loadUserPreferences();
        this.setVolume(this.volume);
        this.initializeAudioContext();
        this.applyTheme(this.currentTheme);
        
        // Check if user has previously interacted
        this.userInteracted = localStorage.getItem('musicPlayerUserInteracted') === 'true';
        
        // Show user interaction prompt for audio only if needed
        if (!this.userInteracted) {
            this.showAudioInteractionPrompt();
        }
        
        console.log('Enhanced Music Player initialization complete');
    }
    
    loadUserPreferences() {
        const savedData = localStorage.getItem('musicPlayerData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.currentTheme = data.theme || 'dark';
                this.volume = data.volume || 0.7;
                this.userPlaylists = data.playlists || [];
                this.uploadedTracks = data.uploadedTracks || [];
            } catch (error) {
                console.error('Error loading user preferences:', error);
            }
        }
    }
    
    saveUserPreferences() {
        const data = {
            theme: this.currentTheme,
            volume: this.volume,
            playlists: this.userPlaylists,
            uploadedTracks: this.uploadedTracks
        };
        localStorage.setItem('musicPlayerData', JSON.stringify(data));
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        try {
            // Existing playback controls
            if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
            if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousTrack());
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextTrack());
            if (this.shuffleBtn) this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
            if (this.repeatBtn) this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
            
            // Progress bar interactions
            if (this.progressBar) {
                this.progressBar.addEventListener('click', (e) => this.seekTo(e));
                this.progressBar.addEventListener('mousedown', () => this.startProgressDrag());
            }
            
            // Volume control
            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
                this.volumeSlider.addEventListener('change', (e) => this.setVolume(e.target.value / 100));
            }
            if (this.volumeBtn) this.volumeBtn.addEventListener('click', () => this.toggleMute());
            
            // Audio events
            if (this.audioPlayer) {
                this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
                this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
                this.audioPlayer.addEventListener('ended', () => this.handleTrackEnd());
                this.audioPlayer.addEventListener('error', (e) => {
                    console.error('🚫 Audio error:', e);
                    this.fallbackToSimulation();
                });
            }
            
            // Like button
            if (this.likeBtn) this.likeBtn.addEventListener('click', () => this.toggleLike());
            
            // Search and filters
            if (this.searchInput) this.searchInput.addEventListener('input', (e) => this.debounceSearch(e.target.value, 300));
            if (this.genreFilter) this.genreFilter.addEventListener('change', (e) => this.handleFilter('genre', e.target.value));
            if (this.artistFilter) this.artistFilter.addEventListener('change', (e) => this.handleFilter('artist', e.target.value));
            if (this.clearFiltersBtn) this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
            
            // File upload
            if (this.musicUpload) this.musicUpload.addEventListener('change', (e) => this.handleFileUpload(e));
            
            // Theme toggle
            if (this.themeToggle) this.themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Playlist creation
            if (this.createPlaylistBtn) this.createPlaylistBtn.addEventListener('click', () => this.showPlaylistModal());
            
            // Equalizer
            if (this.equalizerBtn) this.equalizerBtn.addEventListener('click', () => this.showEqualizerModal());
            
            // Modal controls
            this.setupModalListeners();
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));
            
            // Navigation
            this.setupNavigation();
            
            // Auto-save preferences
            window.addEventListener('beforeunload', () => this.saveUserPreferences());
            
            console.log('✅ Event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const span = link.querySelector('span');
                if (span) {
                    const viewName = span.textContent.toLowerCase().trim();
                    this.switchView(viewName);
                    
                    // Update active state
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    link.closest('.nav-item').classList.add('active');
                }
            });
        });
    }
    
    switchView(view) {
        console.log('Switching to view:', view);
        
        // Hide all views
        document.querySelectorAll('.content-area > section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show selected view
        switch(view) {
            case 'home':
                const homeView = document.getElementById('home-view');
                if (homeView) homeView.classList.remove('hidden');
                break;
            case 'search':
                const searchView = document.getElementById('search-view');
                if (searchView) searchView.classList.remove('hidden');
                if (this.searchInput) this.searchInput.focus();
                break;
            case 'your library':
                // Would show library view - for now show home
                const homeViewLib = document.getElementById('home-view');
                if (homeViewLib) homeViewLib.classList.remove('hidden');
                break;
        }
        
        // Hide all views
        document.querySelectorAll('.content-area > section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show selected view
        switch(view) {
            case 'home':
                document.getElementById('home-view').classList.remove('hidden');
                break;
            case 'search':
                document.getElementById('search-view').classList.remove('hidden');
                this.searchInput.focus();
                break;
            case 'your library':
                // Would show library view
                break;
        }
    }
    
    loadSampleTracks() {
        // Enhanced sample track data with beautiful images and advanced features
        this.playlist = [
            {
                id: 1,
                title: "Aabaad Barbaad",
                artist: "Arijit Singh",
                album: "Ludo",
                genre: "bollywood",
                duration: 240,
                artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Aabaad_Barbaad.mp3",
                liked: false,
                dateAdded: new Date().toISOString(),
                color: "#FF6B6B",
                mood: "romantic",
                bpm: 120,
                lyrics: `Aabaad barbaad ye ishq hai\nSabko ye maloom hai\nPhir bhi sabko ye ishq hai...`,
                year: 2020
            },
            {
                id: 2,
                title: "Aankh Marey",
                artist: "Mika Singh, Neha Kakkar",
                album: "Simmba",
                genre: "bollywood",
                duration: 220,
                artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Aankh_Marey.mp3",
                liked: false,
                dateAdded: new Date().toISOString(),
                color: "#4ECDC4",
                mood: "energetic",
                bpm: 130,
                lyrics: `Aankh marey o ladki aankh marey\nSapno mein dekhe sab ladki aankh marey...`,
                year: 2018
            },
            {
                id: 3,
                title: "Baarish",
                artist: "Ash King, Shashaa Tirupati",
                album: "Half Girlfriend",
                genre: "romantic",
                duration: 280,
                artwork: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Baarish.mp3",
                liked: true,
                dateAdded: new Date().toISOString(),
                color: "#95A5A6",
                mood: "melancholic",
                bpm: 85,
                lyrics: `Baarish ban jaana\nTu mere paas aa jaana...`,
                year: 2017
            },
            {
                id: 4,
                title: "Channa Mereya",
                artist: "Arijit Singh",
                album: "Ae Dil Hai Mushkil",
                genre: "romantic",
                duration: 295,
                artwork: "https://images.unsplash.com/photo-1518756131217-31eb79b20e8f?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Channa_Mereya.mp3",
                liked: false,
                dateAdded: new Date().toISOString(),
                color: "#E67E22",
                mood: "sad",
                bpm: 75,
                lyrics: `Channa mereya mereya\nOh piya is ishq ne kya kiya...`,
                year: 2016
            },
            {
                id: 5,
                title: "Dilbar",
                artist: "Neha Kakkar, Dhvani Bhanushali",
                album: "Satyameva Jayate",
                genre: "dance",
                duration: 200,
                artwork: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Dilbar.mp3",
                liked: false,
                dateAdded: new Date().toISOString(),
                color: "#9B59B6",
                mood: "dance",
                bpm: 125,
                lyrics: `Dilbar dilbar mere pass aaja\nPaas aaja paas aaja...`,
                year: 2018
            },
            {
                id: 6,
                title: "Genda Phool",
                artist: "Badshah, Payal Dev",
                album: "Single",
                genre: "hip-hop",
                duration: 180,
                artwork: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Genda_Phool.mp3",
                liked: true,
                dateAdded: new Date().toISOString(),
                color: "#F39C12",
                mood: "upbeat",
                bpm: 140,
                lyrics: `Genda phool genda phool\nBoroloker biti lo...`,
                year: 2020
            },
            {
                id: 7,
                title: "Hawayein",
                artist: "Arijit Singh",
                album: "Jab Harry Met Sejal",
                genre: "romantic",
                duration: 260,
                artwork: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Hawayein.mp3",
                liked: false,
                dateAdded: new Date().toISOString(),
                color: "#3498DB",
                mood: "romantic",
                bpm: 95,
                lyrics: `Hawayein ye bata do\nKahan se yun chali ho...`,
                year: 2017
            },
            {
                id: 8,
                title: "Lut Gaye",
                artist: "Jubin Nautiyal",
                album: "Single",
                genre: "romantic",
                duration: 230,
                artwork: "https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=400&h=400&fit=crop&crop=center",
                audio: "assets/audio/Lut_Gaye.mp3",
                liked: true,
                dateAdded: new Date().toISOString(),
                color: "#E74C3C",
                mood: "romantic",
                bpm: 110,
                lyrics: `Lut gaye lut gaye\nTere mohalle mein aa ke...`,
                year: 2021
            }
        ];
        
        // Add uploaded tracks
        this.playlist = [...this.playlist, ...this.uploadedTracks];
        
        // Validate audio files
        this.validateAudioFiles();
        
        this.renderTracks();
        this.updateFilterOptions();
    }
    
    validateAudioFiles() {
        console.log('🔍 Validating audio files...');
        
        this.playlist.forEach((track, index) => {
            if (track.audio && track.audio.startsWith('assets/')) {
                // Check if local file exists
                fetch(track.audio, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            console.log(`✅ Audio file found: ${track.title}`);
                        } else {
                            console.warn(`⚠️ Audio file not found: ${track.title} - will use simulation`);
                        }
                    })
                    .catch(error => {
                        console.warn(`⚠️ Cannot access audio file: ${track.title} - will use simulation`);
                    });
            }
        });
    }
    
    // Data Persistence
    saveUserPreferences() {
        const preferences = {
            userPlaylists: this.userPlaylists,
            uploadedTracks: this.uploadedTracks,
            currentTheme: this.currentTheme,
            volume: this.volume,
            repeat: this.repeat,
            shuffle: this.shuffle,
            likedTracks: this.playlist.filter(t => t.liked).map(t => t.id)
        };
        
        localStorage.setItem('musicPlayerPreferences', JSON.stringify(preferences));
        console.log('💾 Preferences saved');
    }
    
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('musicPlayerPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // Load user playlists
                this.userPlaylists = preferences.userPlaylists || [];
                
                // Load uploaded tracks
                if (preferences.uploadedTracks && preferences.uploadedTracks.length > 0) {
                    this.uploadedTracks = preferences.uploadedTracks;
                    // Add to main playlist if not already there
                    preferences.uploadedTracks.forEach(track => {
                        if (!this.playlist.find(t => t.id === track.id)) {
                            this.playlist.push(track);
                        }
                    });
                }
                
                // Load theme
                this.currentTheme = preferences.currentTheme || 'dark';
                this.applyTheme(this.currentTheme);
                
                // Load audio settings
                if (preferences.volume !== undefined) {
                    this.volume = preferences.volume;
                }
                if (preferences.repeat !== undefined) {
                    this.repeat = preferences.repeat;
                    if (this.repeatBtn) {
                        this.repeatBtn.classList.toggle('active', this.repeat);
                    }
                }
                if (preferences.shuffle !== undefined) {
                    this.shuffle = preferences.shuffle;
                    if (this.shuffleBtn) {
                        this.shuffleBtn.classList.toggle('active', this.shuffle);
                    }
                }
                
                // Load liked tracks
                if (preferences.likedTracks) {
                    preferences.likedTracks.forEach(trackId => {
                        const track = this.playlist.find(t => t.id === trackId);
                        if (track) track.liked = true;
                    });
                }
                
                // Update UI only if elements exist
                if (this.trackGrid) {
                    this.updatePlaylistSidebar();
                    this.updateFilterOptions();
                    this.renderTracks();
                }
                
                console.log('📂 Preferences loaded successfully');
            } else {
                console.log('📂 No saved preferences found, using defaults');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load preferences:', error);
        }
    }
    
    renderTracks() {
        if (!this.trackGrid) {
            console.error('Track grid element not found');
            return;
        }
        
        this.trackGrid.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track-card';
            trackElement.innerHTML = `
                <div class="track-image">
                    <img src="${track.artwork}" alt="${track.title}" loading="lazy">
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                    <div class="track-genre">${track.genre || 'Bollywood'}</div>
                </div>
            `;
            
            // Add visual feedback on click
            trackElement.addEventListener('click', () => {
                console.log('🎵 Track clicked:', track.title);
                this.announceTrack(track.title);
                
                // Remove playing class from all tracks
                document.querySelectorAll('.track-card.playing').forEach(card => {
                    card.classList.remove('playing');
                });
                
                // Add playing class to current track
                trackElement.classList.add('playing');
                
                // Play track
                this.playTrack(index);
            });
            
            this.trackGrid.appendChild(trackElement);
        });
        
        console.log('✅ Rendered', this.playlist.length, 'tracks with Wynk styling');
    }
    
    playTrack(index) {
        console.log('🎵 Playing track at index:', index);
        
        if (index >= 0 && index < this.playlist.length) {
            // Stop current playback
            this.isPlaying = false;
            if (this.playbackInterval) {
                clearInterval(this.playbackInterval);
            }
            
            // Pause any current audio
            if (this.audioPlayer && !this.audioPlayer.paused) {
                this.audioPlayer.pause();
            }
            
            this.currentIndex = index;
            this.currentTrack = this.playlist[index];
            
            console.log('🎧 Current track:', this.currentTrack);
            
            // Update UI immediately
            this.updateNowPlaying();
            this.currentTime = 0;
            this.updateProgress();
            
            // Try to load and play real audio
            if (this.currentTrack.audio && this.audioPlayer) {
                console.log('🔊 Loading audio:', this.currentTrack.audio);
                
                this.audioPlayer.src = this.currentTrack.audio;
                this.audioPlayer.currentTime = 0;
                
                // Set up event listeners for this track
                const onLoadedMetadata = () => {
                    console.log('📊 Audio metadata loaded, duration:', this.audioPlayer.duration);
                    this.duration = this.audioPlayer.duration || this.currentTrack.duration;
                    this.updateDuration();
                };
                
                const onTimeUpdate = () => {
                    if (!this.isPlaying) return;
                    this.currentTime = this.audioPlayer.currentTime;
                    this.updateProgress();
                };
                
                const onEnded = () => {
                    console.log('🔚 Track ended');
                    this.handleTrackEnd();
                };
                
                const onError = (e) => {
                    console.error('❌ Audio error:', e);
                    console.log('🔄 Attempting fallback audio source...');
                    
                    // Show user-friendly notification
                    this.showNotification(`Playing "${this.currentTrack.title}" in demo mode - audio file may not be available`, 'warning');
                    
                    // Try alternative audio sources
                    if (this.currentTrack.audio.includes('assets/audio/')) {
                        console.log('🎭 Local file failed, switching to simulation mode');
                        this.fallbackToSimulation();
                    } else {
                        console.log('🎭 External source failed, switching to simulation mode');
                        this.fallbackToSimulation();
                    }
                };
                
                // Remove old listeners
                this.audioPlayer.removeEventListener('loadedmetadata', onLoadedMetadata);
                this.audioPlayer.removeEventListener('timeupdate', onTimeUpdate);
                this.audioPlayer.removeEventListener('ended', onEnded);
                this.audioPlayer.removeEventListener('error', onError);
                
                // Add new listeners
                this.audioPlayer.addEventListener('loadedmetadata', onLoadedMetadata);
                this.audioPlayer.addEventListener('timeupdate', onTimeUpdate);
                this.audioPlayer.addEventListener('ended', onEnded);
                this.audioPlayer.addEventListener('error', onError);
                
                // Load and play
                this.audioPlayer.load();
                
                const playPromise = this.audioPlayer.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('✅ Audio playing successfully');
                        this.isPlaying = true;
                        this.updatePlayButton();
                        this.hidePlaybackNotification();
                        
                        // Show success notification
                        this.showNotification(`Now playing: ${this.currentTrack.title}`, 'info');
                    }).catch(error => {
                        console.log('⚠️ Auto-play blocked or failed:', error.message);
                        console.log('💡 Click the play button to start playback');
                        
                        // Show user-friendly message about autoplay restriction
                        this.showNotification('Click the play button to start music playback (browser autoplay restriction)', 'warning');
                        
                        // Don't auto-start, just prepare for user click
                        this.isPlaying = false;
                        this.updatePlayButton();
                        this.duration = this.currentTrack.duration;
                        this.updateDuration();
                        this.showPlaybackNotification();
                    });
                }
            } else {
                console.log('🎭 No audio URL, using simulation');
                this.fallbackToSimulation();
            }
        }
    }
    
    fallbackToSimulation() {
        console.log('🎭 Falling back to simulation mode');
        this.isPlaying = true;
        this.updatePlayButton();
        this.duration = this.currentTrack.duration;
        this.updateDuration();
        this.simulatePlayback();
    }
    
    simulatePlayback() {
        // This simulates audio playback for demo purposes
        if (this.currentTrack && this.isPlaying) {
            const duration = this.currentTrack.duration;
            this.duration = duration;
            this.updateDuration();
            
            // Simulate progress
            this.currentTime = 0;
            this.playbackInterval = setInterval(() => {
                if (this.isPlaying && this.currentTime < duration) {
                    this.currentTime += 1;
                    this.updateProgress();
                } else if (this.currentTime >= duration) {
                    this.handleTrackEnd();
                }
            }, 1000);
        }
    }
    
    showPlaybackNotification() {
        // Create or update notification
        let notification = document.getElementById('playback-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'playback-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--accent-color);
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 10001;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
        }
        
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            Click the play button to start music playback
        `;
        notification.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hidePlaybackNotification(), 5000);
    }
    
    hidePlaybackNotification() {
        const notification = document.getElementById('playback-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }
    
    announceTrack(title) {
        console.log('🎵 Now playing:', title);
        
        // Create a temporary announcement
        let announcement = document.getElementById('track-announcement');
        if (!announcement) {
            announcement = document.createElement('div');
            announcement.id = 'track-announcement';
            announcement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                z-index: 10002;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(announcement);
        }
        
        announcement.innerHTML = `
            <i class="fas fa-music" style="margin-right: 10px;"></i>
            Now Playing: ${title}
        `;
        
        // Show and hide announcement
        announcement.style.opacity = '1';
        setTimeout(() => {
            announcement.style.opacity = '0';
        }, 2000);
    }
    
    togglePlayPause() {
        console.log('🎯 Toggle play/pause clicked');
        
        if (this.currentTrack) {
            this.isPlaying = !this.isPlaying;
            
            if (this.isPlaying) {
                console.log('▶️ Attempting to play');
                // Try to play real audio first
                if (this.audioPlayer && this.audioPlayer.src && !this.audioPlayer.ended) {
                    const playPromise = this.audioPlayer.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('✅ Audio resumed successfully');
                            this.showNotification(`Playing: ${this.currentTrack.title}`, 'info');
                        }).catch(error => {
                            console.log('⚠️ Audio resume failed:', error.message);
                            this.showNotification(`Playing "${this.currentTrack.title}" in demo mode - audio may not be available`, 'warning');
                            this.simulatePlayback();
                        });
                    }
                } else {
                    console.log('🎭 Using simulation playback');
                    this.showNotification(`Playing "${this.currentTrack.title}" in demo mode`, 'warning');
                    this.simulatePlayback();
                }
            } else {
                console.log('⏸️ Pausing playback');
                // Pause audio
                if (this.audioPlayer && !this.audioPlayer.paused) {
                    this.audioPlayer.pause();
                }
                clearInterval(this.playbackInterval);
                this.showNotification(`Paused: ${this.currentTrack.title}`, 'info');
            }
            
            this.updatePlayButton();
        } else if (this.playlist.length > 0) {
            // If no track is selected, play the first one
            console.log('🎵 No current track, playing first track');
            this.playTrack(0);
        } else {
            console.log('❌ No tracks available to play');
        }
    }
    
    updatePlayButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    previousTrack() {
        if (this.currentTime > 3) {
            // If more than 3 seconds in, restart current track
            this.currentTime = 0;
            this.updateProgress();
        } else {
            // Go to previous track
            let newIndex = this.currentIndex - 1;
            if (newIndex < 0) {
                newIndex = this.playlist.length - 1;
            }
            this.playTrack(newIndex);
        }
    }
    
    nextTrack() {
        let newIndex;
        
        if (this.isShuffled) {
            // Random track
            do {
                newIndex = Math.floor(Math.random() * this.playlist.length);
            } while (newIndex === this.currentIndex && this.playlist.length > 1);
        } else {
            // Next track in order
            newIndex = this.currentIndex + 1;
            if (newIndex >= this.playlist.length) {
                newIndex = 0;
            }
        }
        
        this.playTrack(newIndex);
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);
    }
    
    toggleRepeat() {
        const modes = ['none', 'playlist', 'track'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        
        this.repeatBtn.classList.toggle('active', this.repeatMode !== 'none');
        
        // Update icon based on repeat mode
        const icon = this.repeatBtn.querySelector('i');
        if (this.repeatMode === 'track') {
            icon.className = 'fas fa-redo';
            this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i><span style="position: absolute; bottom: -2px; right: -2px; font-size: 8px;">1</span>';
        } else {
            icon.className = 'fas fa-redo';
            this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        }
    }
    
    handleTrackEnd() {
        clearInterval(this.playbackInterval);
        
        if (this.repeatMode === 'track') {
            // Repeat current track
            this.currentTime = 0;
            this.simulatePlayback();
        } else if (this.repeatMode === 'playlist' || this.currentIndex < this.playlist.length - 1) {
            // Go to next track
            this.nextTrack();
        } else {
            // Stop playback
            this.isPlaying = false;
            this.updatePlayButton();
            this.currentTime = 0;
            this.updateProgress();
        }
    }
    
    seekTo(e) {
        if (this.currentTrack) {
            const rect = this.progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            this.currentTime = percentage * this.duration;
            this.updateProgress();
        }
    }
    
    setVolumeFromClick(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        this.setVolume(percentage);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audioPlayer.volume = this.volume;
        
        // Update volume slider UI
        const percentage = this.volume * 100;
        this.volumeFill.style.width = `${percentage}%`;
        this.volumeHandle.style.left = `${percentage}%`;
        
        // Update volume icon
        const icon = this.volumeBtn.querySelector('i');
        if (this.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.7);
        }
    }
    
    updateNowPlaying() {
        console.log('🎨 Updating now playing display');
        
        if (this.currentTrack) {
            console.log('📀 Track info:', {
                title: this.currentTrack.title,
                artist: this.currentTrack.artist,
                artwork: this.currentTrack.artwork
            });
            
            // Update track info
            if (this.currentTrackEl) {
                this.currentTrackEl.textContent = this.currentTrack.title;
                console.log('✅ Updated track title');
            } else {
                console.error('❌ Current track element not found');
            }
            
            if (this.currentArtistEl) {
                this.currentArtistEl.textContent = this.currentTrack.artist;
                console.log('✅ Updated artist name');
            } else {
                console.error('❌ Current artist element not found');
            }
            
            // Update album artwork
            if (this.currentArtworkEl && this.currentTrack.artwork) {
                this.currentArtworkEl.src = this.currentTrack.artwork;
                this.currentArtworkEl.alt = this.currentTrack.title;
                console.log('✅ Updated album artwork');
            } else {
                console.error('❌ Current artwork element not found or no artwork URL');
            }
            
            // Update like button
            if (this.likeBtn) {
                const icon = this.likeBtn.querySelector('i');
                if (icon) {
                    if (this.currentTrack.liked) {
                        icon.className = 'fas fa-heart';
                        this.likeBtn.classList.add('liked');
                    } else {
                        icon.className = 'far fa-heart';
                        this.likeBtn.classList.remove('liked');
                    }
                    console.log('✅ Updated like button');
                }
            }
        } else {
            console.log('❌ No current track to display');
        }
    }
    
    updateProgress() {
        if (this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            this.progressFill.style.width = `${percentage}%`;
            this.progressHandle.style.left = `${percentage}%`;
            
            // Update time displays
            this.timeElapsed.textContent = this.formatTime(this.currentTime);
            this.timeTotal.textContent = this.formatTime(this.duration);
        }
    }
    
    updateDuration() {
        this.duration = this.audioPlayer.duration || (this.currentTrack ? this.currentTrack.duration : 0);
        this.timeTotal.textContent = this.formatTime(this.duration);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    toggleLike() {
        if (this.currentTrack) {
            this.currentTrack.liked = !this.currentTrack.liked;
            this.updateNowPlaying();
            
            // Update in playlist array
            const playlistTrack = this.playlist.find(track => track.id === this.currentTrack.id);
            if (playlistTrack) {
                playlistTrack.liked = this.currentTrack.liked;
            }
            
            // Save preferences
            this.saveUserPreferences();
            
            // Re-render to update UI
            this.renderTracks();
        }
    }
    
    toggleTrackLike(trackId) {
        const track = this.playlist.find(t => t.id === trackId);
        if (track) {
            track.liked = !track.liked;
            
            // Update track card
            const trackCard = document.querySelector(`[data-track-id="${trackId}"]`);
            if (trackCard) {
                const likeBtn = trackCard.querySelector('.like-btn');
                if (likeBtn) {
                    likeBtn.classList.toggle('liked', track.liked);
                }
            }
            
            // Update now playing if this is the current track
            if (this.currentTrack && this.currentTrack.id === trackId) {
                this.updateNowPlaying();
            }
            
            this.saveUserPreferences();
            console.log('❤️ Toggled like for:', track.title);
        }
    }
    
    debounceSearch(query, delay) {
        // Clear existing timer
        if (this.debounceTimers && this.debounceTimers.has('search')) {
            clearTimeout(this.debounceTimers.get('search'));
        }
        
        // Initialize debounceTimers if not exists
        if (!this.debounceTimers) {
            this.debounceTimers = new Map();
        }
        
        // Set new timer
        const timer = setTimeout(() => {
            this.handleSearch(query);
            this.debounceTimers.delete('search');
        }, delay);
        
        this.debounceTimers.set('search', timer);
    }

    handleSearch(query) {
        if (query.trim() === '') {
            this.renderTracks();
            return;
        }
        
        const filteredTracks = this.playlist.filter(track =>
            track.title.toLowerCase().includes(query.toLowerCase()) ||
            track.artist.toLowerCase().includes(query.toLowerCase()) ||
            track.album.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderFilteredTracks(filteredTracks);
    }
    
    renderFilteredTracks(tracks) {
        if (!this.trackGrid) {
            console.error('Track grid element not found');
            return;
        }
        
        if (!tracks || tracks.length === 0) {
            this.trackGrid.innerHTML = '<div class="no-tracks">No tracks found</div>';
            return;
        }
        
        this.trackGrid.innerHTML = tracks.map(track => `
            <div class="track-card" data-track-id="${track.id}" onclick="window.musicPlayer.playTrack(${this.playlist.indexOf(track)}); window.musicPlayer.announceTrack('${track.title}');">
                <div class="track-image">
                    <img src="${this.getTrackArtwork(track)}" alt="${track.title}" loading="lazy" 
                         onerror="this.src='${this.getFallbackImage(track)}'">
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="track-info">
                    <h3 class="track-title">${track.title}</h3>
                    <p class="track-artist">${track.artist}</p>
                    <p class="track-album">${track.album}</p>
                    <div class="track-meta">
                        <span class="track-genre">${track.genre}</span>
                        <button class="like-btn ${track.liked ? 'liked' : ''}" 
                                onclick="event.stopPropagation(); window.musicPlayer.toggleTrackLike(${track.id})">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('🎨 Rendered', tracks.length, 'filtered tracks');
    }
    
    getTrackArtwork(track) {
        // Try artwork URL first, then fallback to placeholder
        if (track.artwork && track.artwork.startsWith('http')) {
            return track.artwork;
        }
        return this.generatePlaceholderImage(track);
    }
    
    getFallbackImage(track) {
        return this.generatePlaceholderImage(track);
    }
    
    generatePlaceholderImage(track) {
        // Generate a color based on track genre
        const colors = {
            'bollywood': '#ff6b6b',
            'romantic': '#ff69b4',
            'dance': '#00bcd4',
            'hip-hop': '#9c27b0',
            'electronic': '#00ff00',
            'jazz': '#ffa500',
            'ambient': '#87ceeb',
            'test': '#666666'
        };
        
        const color = colors[track.genre] || '#1db954';
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 300, 300);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);
        
        // Add music note icon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', 150, 150);
        
        // Add track title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(track.title.substring(0, 20), 150, 220);
        
        return canvas.toDataURL();
    }
    
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    handleKeyboard(e) {
        // Prevent default if input is focused
        if (document.activeElement.tagName === 'INPUT') {
            return;
        }
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(this.volume + 0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(this.volume - 0.1);
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleShuffle();
                break;
            case 'KeyR':
                e.preventDefault();
                this.toggleRepeat();
                break;
        }
    }
    
    // File Upload Functionality
    handleFileUpload(event) {
        const files = event.target.files;
        console.log('🎵 Uploading', files.length, 'files');
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('audio/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const audioUrl = e.target.result;
                    const track = {
                        id: Date.now() + Math.random(),
                        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                        artist: "Unknown Artist",
                        album: "Uploaded",
                        genre: "uploaded",
                        duration: 0, // Will be set when loaded
                        artwork: "https://picsum.photos/300/300?random=" + Math.floor(Math.random() * 1000),
                        audio: audioUrl,
                        liked: false,
                        dateAdded: new Date().toISOString(),
                        isUploaded: true
                    };
                    
                    this.uploadedTracks.push(track);
                    this.playlist.push(track);
                    this.renderTracks();
                    this.updateFilterOptions();
                    this.saveUserPreferences();
                    
                    console.log('✅ File uploaded:', track.title);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Clear the input
        event.target.value = '';
    }
    
    // Theme Management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        this.saveUserPreferences();
    }
    
    applyTheme(theme) {
        document.body.classList.toggle('light-theme', theme === 'light');
        
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                if (theme === 'light') {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        }
        
        console.log('🎨 Theme applied:', theme);
    }
    
    // Filter and Search
    handleFilter(type, value) {
        this.filters[type] = value;
        this.applyFilters();
    }
    
    applyFilters() {
        let filteredTracks = [...this.playlist];
        
        // Apply genre filter
        if (this.filters.genre) {
            filteredTracks = filteredTracks.filter(track => 
                track.genre && track.genre.toLowerCase() === this.filters.genre.toLowerCase()
            );
        }
        
        // Apply artist filter
        if (this.filters.artist) {
            filteredTracks = filteredTracks.filter(track => 
                track.artist.toLowerCase().includes(this.filters.artist.toLowerCase())
            );
        }
        
        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredTracks = filteredTracks.filter(track =>
                track.title.toLowerCase().includes(searchTerm) ||
                track.artist.toLowerCase().includes(searchTerm) ||
                track.album.toLowerCase().includes(searchTerm)
            );
        }
        
        this.renderFilteredTracks(filteredTracks);
    }
    
    clearFilters() {
        this.filters = { genre: '', artist: '', search: '' };
        this.genreFilter.value = '';
        this.artistFilter.value = '';
        this.searchInput.value = '';
        this.renderTracks();
    }
    
    updateFilterOptions() {
        // Update artist filter options
        const artists = [...new Set(this.playlist.map(track => track.artist))];
        this.artistFilter.innerHTML = '<option value="">All Artists</option>';
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = artist;
            this.artistFilter.appendChild(option);
        });
    }
    
    // Enhanced Search
    handleSearch(query) {
        this.filters.search = query;
        this.applyFilters();
    }
    
    // Playlist Management
    showPlaylistModal() {
        this.playlistModal.classList.remove('hidden');
        document.getElementById('playlist-name').focus();
    }
    
    hidePlaylistModal() {
        this.playlistModal.classList.add('hidden');
        document.getElementById('playlist-name').value = '';
        document.getElementById('playlist-description').value = '';
    }
    
    createNewPlaylist() {
        const name = document.getElementById('playlist-name').value.trim();
        const description = document.getElementById('playlist-description').value.trim();
        
        if (!name) {
            alert('Please enter a playlist name');
            return;
        }
        
        const playlist = {
            id: Date.now(),
            name,
            description,
            tracks: [],
            dateCreated: new Date().toISOString()
        };
        
        this.userPlaylists.push(playlist);
        this.saveUserPreferences();
        this.hidePlaylistModal();
        this.updatePlaylistSidebar();
        
        console.log('✅ Created playlist:', name);
    }
    
    updatePlaylistSidebar() {
        const playlistSection = document.querySelector('.sidebar-section:last-child ul');
        if (!playlistSection) return;
        
        // Clear existing user playlists (keep default ones)
        const userPlaylistItems = playlistSection.querySelectorAll('.user-playlist');
        userPlaylistItems.forEach(item => item.remove());
        
        // Add user playlists
        this.userPlaylists.forEach(playlist => {
            const li = document.createElement('li');
            li.className = 'user-playlist';
            li.innerHTML = `
                <a href="#" data-playlist-id="${playlist.id}">
                    <i class="fas fa-music"></i>
                    <span>${playlist.name}</span>
                    <button class="delete-playlist" data-playlist-id="${playlist.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </a>
            `;
            playlistSection.appendChild(li);
        });
        
        // Add event listeners for playlist selection and deletion
        this.setupPlaylistListeners();
    }
    
    setupPlaylistListeners() {
        // Playlist selection
        document.querySelectorAll('[data-playlist-id]').forEach(link => {
            if (!link.classList.contains('delete-playlist')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const playlistId = parseInt(link.dataset.playlistId);
                    this.showPlaylist(playlistId);
                });
            }
        });
        
        // Playlist deletion
        document.querySelectorAll('.delete-playlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playlistId = parseInt(btn.dataset.playlistId);
                this.deletePlaylist(playlistId);
            });
        });
    }
    
    showPlaylist(playlistId) {
        const playlist = this.userPlaylists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // Update current view
        this.currentView = 'playlist';
        this.currentPlaylistId = playlistId;
        
        // Update content header
        const contentTitle = document.querySelector('.content-header h1');
        if (contentTitle) {
            contentTitle.textContent = playlist.name;
        }
        
        // Show playlist tracks
        this.renderFilteredTracks(playlist.tracks);
        
        console.log('📋 Showing playlist:', playlist.name);
    }
    
    deletePlaylist(playlistId) {
        if (confirm('Are you sure you want to delete this playlist?')) {
            this.userPlaylists = this.userPlaylists.filter(p => p.id !== playlistId);
            this.saveUserPreferences();
            this.updatePlaylistSidebar();
            
            // If currently viewing deleted playlist, go back to all tracks
            if (this.currentPlaylistId === playlistId) {
                this.showAllTracks();
            }
            
            console.log('🗑️ Deleted playlist:', playlistId);
        }
    }
    
    showAllTracks() {
        this.currentView = 'all';
        this.currentPlaylistId = null;
        
        const contentTitle = document.querySelector('.content-header h1');
        if (contentTitle) {
            contentTitle.textContent = 'All Tracks';
        }
        
        this.renderTracks();
    }
    
    addToPlaylist(trackId, playlistId) {
        const track = this.playlist.find(t => t.id === trackId);
        const playlist = this.userPlaylists.find(p => p.id === playlistId);
        
        if (track && playlist) {
            // Check if track already in playlist
            if (!playlist.tracks.find(t => t.id === trackId)) {
                playlist.tracks.push(track);
                this.saveUserPreferences();
                console.log('➕ Added track to playlist:', track.title, '→', playlist.name);
            }
        }
    }
    
    // Equalizer
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎛️ Audio context initialized');
        } catch (error) {
            console.warn('⚠️ Web Audio API not supported:', error);
        }
    }
    
    showEqualizerModal() {
        this.equalizerModal.classList.remove('hidden');
        this.setupEqualizer();
    }
    
    hideEqualizerModal() {
        this.equalizerModal.classList.add('hidden');
    }
    
    setupEqualizer() {
        if (!this.audioContext) return;
        
        // Create equalizer if not exists
        if (!this.equalizer && this.audioPlayer) {
            try {
                const source = this.audioContext.createMediaElementSource(this.audioPlayer);
                this.equalizer = this.createEqualizer();
                source.connect(this.equalizer.input);
                this.equalizer.output.connect(this.audioContext.destination);
                console.log('🎛️ Equalizer connected');
            } catch (error) {
                console.warn('⚠️ Failed to setup equalizer:', error);
            }
        }
    }
    
    createEqualizer() {
        const frequencies = [60, 230, 910, 4000, 14000];
        const filters = frequencies.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = 0;
            return filter;
        });
        
        // Connect filters in series
        for (let i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
        }
        
        return {
            input: filters[0],
            output: filters[filters.length - 1],
            filters
        };
    }
    
    // Modal Event Listeners
    setupModalListeners() {
        try {
            // Wynk-specific modal listeners
            const lyricsBtn = document.getElementById('lyricsBtn');
            const visualizerBtn = document.getElementById('visualizerBtn');
            const closeLyricsModal = document.getElementById('closeLyricsModal');
            const closeVisualizerModal = document.getElementById('closeVisualizerModal');
            const startMusicVisualizerBtn = document.getElementById('startMusicVisualizerBtn');
            const startMusicVisualizerBtn2 = document.getElementById('startMusicVisualizerBtn2');
            
            // Lyrics modal
            if (lyricsBtn) lyricsBtn.addEventListener('click', () => this.showLyricsModal());
            if (closeLyricsModal) closeLyricsModal.addEventListener('click', () => this.hideLyricsModal());
            
            // Visualizer modal  
            if (visualizerBtn) visualizerBtn.addEventListener('click', () => this.showVisualizerModal());
            if (closeVisualizerModal) closeVisualizerModal.addEventListener('click', () => this.hideVisualizerModal());
            
            // Start Music + Visualizer buttons
            if (startMusicVisualizerBtn) startMusicVisualizerBtn.addEventListener('click', () => this.startMusicWithVisualizer());
            if (startMusicVisualizerBtn2) startMusicVisualizerBtn2.addEventListener('click', () => this.startMusicWithVisualizer());
            
            // Playlist modal
            const closePlaylistModal = document.getElementById('close-playlist-modal');
            const cancelPlaylist = document.getElementById('cancel-playlist');
            const createPlaylist = document.getElementById('create-playlist');
            
            if (closePlaylistModal) closePlaylistModal.addEventListener('click', () => this.hidePlaylistModal());
            if (cancelPlaylist) cancelPlaylist.addEventListener('click', () => this.hidePlaylistModal());
            if (createPlaylist) createPlaylist.addEventListener('click', () => this.createNewPlaylist());
            
            // Equalizer modal
            const closeEqualizerModal = document.getElementById('close-equalizer-modal');
            if (closeEqualizerModal) closeEqualizerModal.addEventListener('click', () => this.hideEqualizerModal());
            
            // Close modals on outside click
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });
        
        // Equalizer controls
        document.querySelectorAll('.eq-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                const frequency = e.target.dataset.frequency;
                const valueSpan = e.target.parentNode.querySelector('.eq-value');
                if (valueSpan) valueSpan.textContent = value + 'dB';
                
                if (this.equalizer) {
                    const filter = this.equalizer.filters.find(f => f.frequency.value == frequency);
                    if (filter) {
                        filter.gain.value = value;
                    }
                }
            });
        });
        
        console.log('✅ Modal listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up modal listeners:', error);
        }
    }
    
    applyEqualizerPreset(preset) {
        const presets = {
            flat: [0, 0, 0, 0, 0],
            rock: [5, 3, -1, 2, 4],
            jazz: [3, 2, 1, 2, 3],
            classical: [3, 2, -1, 2, 3],
            electronic: [4, 2, 0, 2, 4]
        };
        
        const values = presets[preset] || presets.flat;
        const sliders = document.querySelectorAll('.eq-slider');
        
        sliders.forEach((slider, index) => {
            if (values[index] !== undefined) {
                slider.value = values[index];
                const valueSpan = slider.parentNode.querySelector('.eq-value');
                valueSpan.textContent = values[index] + 'dB';
                
                // Apply to audio filter
                if (this.equalizer && this.equalizer.filters[index]) {
                    this.equalizer.filters[index].gain.value = values[index];
                }
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.music-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `music-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Performance monitoring
    logPerformance(operation, startTime) {
        const duration = performance.now() - startTime;
        if (duration > 100) {
            console.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
        } else {
            console.log(`⚡ ${operation} completed in ${duration.toFixed(2)}ms`);
        }
    }
    
    showAudioInteractionPrompt() {
        // Don't show prompt if user has already interacted
        if (this.userInteracted) return;
        
        // Create and show a simple interaction prompt
        const promptHtml = `
            <div id="audioInteractionPrompt" style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-family: 'Segoe UI', Arial, sans-serif;
            ">
                <div style="
                    background: linear-gradient(135deg, #1db954, #1ed760);
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                ">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎵</div>
                    <h2 style="margin: 0 0 16px 0; font-size: 28px;">Welcome to Music Player</h2>
                    <p style="margin: 0 0 24px 0; color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.5;">
                        Click below to enable audio and start your music experience!
                    </p>
                    <button id="enableAudioBtn" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid rgba(255,255,255,0.3);
                        padding: 15px 30px;
                        border-radius: 50px;
                        font-size: 18px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        🔊 Start Music Player
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', promptHtml);
        
        // Add click handler
        document.getElementById('enableAudioBtn').addEventListener('click', () => {
            this.enableAudioInteraction();
        });
    }
    
    enableAudioInteraction() {
        console.log('🔊 User interaction detected, enabling audio...');
        
        // Remove the prompt
        const prompt = document.getElementById('audioInteractionPrompt');
        if (prompt) {
            prompt.style.opacity = '0';
            prompt.style.transform = 'scale(0.9)';
            prompt.style.transition = 'all 0.3s ease';
            setTimeout(() => prompt.remove(), 300);
        }
        
        // Create audio context if needed
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume audio context
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            console.log('✅ Audio context enabled');
            this.showNotification('🎵 Audio enabled! Click any track to start playing.', 'info');
            
        } catch (error) {
            console.warn('Audio context setup failed:', error);
            this.showNotification('🎵 Audio setup complete! You can now play music.', 'info');
        }
        
        // Mark that user interaction has occurred
        this.userInteracted = true;
        
        // Store in localStorage
        localStorage.setItem('musicPlayerUserInteracted', 'true');
    }
    
    // Wynk Modal Functions
    showLyricsModal() {
        this.openModal('lyricsModal');
    }
    
    hideLyricsModal() {
        this.closeModal('lyricsModal');
    }
    
    showVisualizerModal() {
        this.openModal('visualizerModal');
    }
    
    hideVisualizerModal() {
        this.closeModal('visualizerModal');
    }
    
    startMusicWithVisualizer() {
        console.log('🎵🎨 Starting Music + Visualizer');
        
        // If no track is playing, start the first one
        if (!this.currentTrack && this.playlist.length > 0) {
            this.playTrack(0);
        }
        
        // Enable user interaction for audio
        this.enableAudioInteraction();
        
        // Start visualizer
        this.initializeVisualizer();
        this.startVisualizer();
        
        // Show notification
        this.showNotification('Music + Visualizer started! 🎵🎨', 'success');
        
        // Show visualizer modal
        this.showVisualizerModal();
    }
    
    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Special handling for different modals
            if (modalId === 'lyricsModal') {
                this.updateLyricsModal();
            } else if (modalId === 'visualizerModal') {
                this.initializeVisualizer();
            }
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // Stop visualizer if closing that modal
            if (modalId === 'visualizerModal') {
                this.stopVisualizer();
            }
        }
    }
    
    // Lyrics System
    updateLyricsModal() {
        if (!this.currentTrack) return;
        
        const lyricsTitle = document.getElementById('lyricsTitle');
        const lyricsArtist = document.getElementById('lyricsArtist');
        const lyricsAlbum = document.getElementById('lyricsAlbum');
        const lyricsArtwork = document.getElementById('lyricsArtwork');
        const lyricsText = document.getElementById('lyricsText');
        
        if (lyricsTitle) lyricsTitle.textContent = this.currentTrack.title;
        if (lyricsArtist) lyricsArtist.textContent = this.currentTrack.artist;
        if (lyricsAlbum) lyricsAlbum.textContent = this.currentTrack.album || 'Unknown Album';
        
        if (lyricsArtwork) {
            lyricsArtwork.src = this.currentTrack.artwork || this.getTrackArtwork(this.currentTrack);
            lyricsArtwork.alt = this.currentTrack.title;
        }
        
        if (lyricsText) {
            if (this.currentTrack.lyrics) {
                lyricsText.innerHTML = `<p>${this.currentTrack.lyrics.split('\n').join('</p><p>')}</p>`;
            } else {
                lyricsText.innerHTML = '<p>No lyrics available for this track.</p><p>Lyrics will be displayed here when available.</p>';
            }
        }
    }
    
    // Audio Visualizer System
    initializeVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        if (!canvas) return;
        
        this.visualizerCanvas = canvas;
        this.visualizerContext = canvas.getContext('2d');
        this.visualizerType = document.getElementById('visualizerType')?.value || 'bars';
        
        // Set up audio analysis with proper audio context
        this.setupAudioAnalysis();
        
        // Start visualization if music is playing
        if (this.isPlaying) {
            this.startVisualizer();
        } else {
            // Show a demo visualization
            this.showDemoVisualization();
        }
    }
    
    setupAudioAnalysis() {
        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Create analyser
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);
            }
            
            // Connect audio source to analyser if audio is playing
            if (this.audioPlayer && this.audioPlayer.src && !this.audioPlayer.paused) {
                this.connectAudioToAnalyser();
            }
            
        } catch (error) {
            console.warn('Audio analysis setup failed:', error);
            // Use fake data for demo
            this.setupFakeAudioData();
        }
    }
    
    connectAudioToAnalyser() {
        try {
            if (!this.audioSource && this.audioPlayer && this.audioContext) {
                this.audioSource = this.audioContext.createMediaElementSource(this.audioPlayer);
                this.audioSource.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                console.log('✅ Audio connected to visualizer');
            }
        } catch (error) {
            console.warn('Failed to connect audio to analyser:', error);
            this.setupFakeAudioData();
        }
    }
    
    setupFakeAudioData() {
        // Create fake audio data for demo visualization
        this.bufferLength = 128;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.fakeDataMode = true;
        console.log('🎭 Using fake audio data for visualizer demo');
    }
    
    showDemoVisualization() {
        // Show a nice demo visualization when no music is playing
        this.visualizerRunning = true;
        this.fakeDataMode = true;
        this.updateVisualizerButton(true);
        this.drawDemoVisualizer();
    }
    
    startVisualizer() {
        if (!this.visualizerContext || !this.analyser) return;
        
        this.visualizerRunning = true;
        this.updateVisualizerButton(true);
        this.drawVisualizer();
    }
    
    stopVisualizer() {
        this.visualizerRunning = false;
        this.updateVisualizerButton(false);
        
        if (this.visualizerContext) {
            this.visualizerContext.clearRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
        }
    }
    
    toggleVisualizer() {
        if (this.visualizerRunning) {
            this.stopVisualizer();
        } else {
            this.startVisualizer();
        }
    }
    
    updateVisualizerButton(running) {
        const btn = document.querySelector('.visualizer-btn');
        if (btn) {
            btn.innerHTML = running ? 
                '<i class="fas fa-stop"></i> Stop Visualizer' : 
                '<i class="fas fa-play"></i> Start Visualizer';
        }
    }
    
    drawVisualizer() {
        if (!this.visualizerRunning || !this.visualizerContext) return;
        
        requestAnimationFrame(() => this.drawVisualizer());
        
        // Get audio data or generate fake data
        if (this.fakeDataMode || !this.analyser) {
            this.generateFakeAudioData();
        } else {
            this.analyser.getByteFrequencyData(this.dataArray);
        }
        
        const canvas = this.visualizerCanvas;
        const ctx = this.visualizerContext;
        
        // Clear canvas with fade effect
        ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw based on type
        const type = document.getElementById('visualizerType')?.value || 'bars';
        switch(type) {
            case 'bars':
                this.drawFrequencyBars(ctx, canvas);
                break;
            case 'wave':
                this.drawWaveform(ctx, canvas);
                break;
            case 'circle':
                this.drawCircularViz(ctx, canvas);
                break;
        }
    }
    
    drawDemoVisualizer() {
        if (!this.visualizerRunning || !this.visualizerContext) return;
        
        requestAnimationFrame(() => this.drawDemoVisualizer());
        
        // Generate fake data for demo
        this.generateFakeAudioData();
        
        const canvas = this.visualizerCanvas;
        const ctx = this.visualizerContext;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Always show frequency bars for demo
        this.drawFrequencyBars(ctx, canvas);
    }
    
    generateFakeAudioData() {
        const time = Date.now() * 0.005;
        for (let i = 0; i < this.bufferLength; i++) {
            // Create realistic audio-like data
            const frequency = i / this.bufferLength;
            const wave1 = Math.sin(time + frequency * 10) * 0.5 + 0.5;
            const wave2 = Math.sin(time * 0.7 + frequency * 8) * 0.3 + 0.3;
            const wave3 = Math.sin(time * 1.3 + frequency * 6) * 0.2 + 0.2;
            
            this.dataArray[i] = Math.min(255, (wave1 + wave2 + wave3) * 127);
        }
    }
    
    drawFrequencyBars(ctx, canvas) {
        const barWidth = (canvas.width / this.bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < this.bufferLength; i++) {
            barHeight = (this.dataArray[i] / 255) * canvas.height * 0.8;
            
            // Create beautiful gradient with multiple colors
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            
            // Dynamic colors based on frequency and amplitude
            const hue = (i * 3) % 360;
            const saturation = 70 + (this.dataArray[i] / 255) * 30;
            const lightness = 50 + (this.dataArray[i] / 255) * 30;
            
            gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
            gradient.addColorStop(0.5, `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 20}%)`);
            gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 30}%)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            // Add glow effect for high frequencies
            if (this.dataArray[i] > 128) {
                ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
                ctx.shadowBlur = 10;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                ctx.shadowBlur = 0;
            }
            
            x += barWidth + 1;
        }
    }
    
    drawWaveform(ctx, canvas) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1db954';
        ctx.shadowColor = '#1db954';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        
        const sliceWidth = canvas.width / this.bufferLength;
        let x = 0;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const v = (this.dataArray[i] / 255) * 2 - 1;
            const y = (v * canvas.height / 3) + (canvas.height / 2);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    drawCircularViz(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.4;
        
        // Draw center circle
        ctx.fillStyle = 'rgba(29, 185, 84, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw frequency bars in circle
        for (let i = 0; i < this.bufferLength; i++) {
            const angle = (i / this.bufferLength) * Math.PI * 2;
            const amplitude = (this.dataArray[i] / 255) * radius;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + amplitude);
            const y2 = centerY + Math.sin(angle) * (radius + amplitude);
            
            // Color based on position and amplitude
            const hue = (i * 4) % 360;
            const intensity = this.dataArray[i] / 255;
            
            ctx.strokeStyle = `hsl(${hue}, 70%, ${50 + intensity * 30}%)`;
            ctx.lineWidth = 2;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
}

// Initialize the music player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Music Player');
    try {
        window.musicPlayer = new MusicPlayer();
        console.log('Music Player successfully created and assigned to window.musicPlayer');
        
        // Add a test button to verify functionality
        setTimeout(() => {
            console.log('Current playlist:', window.musicPlayer.playlist);
            console.log('Track grid element:', window.musicPlayer.trackGrid);
        }, 1000);
        
    } catch (error) {
        console.error('Failed to initialize Music Player:', error);
    }
});

// Add global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayer;
}