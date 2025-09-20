// Quick music player enhancement
window.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 Enhancing music player...');
    
    // Auto-start first track after user interaction
    setTimeout(() => {
        if (window.musicPlayer && window.musicPlayer.playlist.length > 0) {
            console.log('🎵 Auto-starting first track...');
            
            // Add enhanced track click handlers
            document.querySelectorAll('.track-card').forEach((card, index) => {
                card.addEventListener('click', () => {
                    console.log(`🎵 Playing track ${index}`);
                    window.musicPlayer.playTrack(index);
                    
                    // Connect to visualizer if open
                    if (window.musicPlayer.visualizerRunning) {
                        setTimeout(() => {
                            window.musicPlayer.connectAudioToVisualizer();
                        }, 500);
                    }
                });
            });
            
            // Auto-play first track for demo
            if (window.musicPlayer.userInteracted) {
                window.musicPlayer.playTrack(0);
                console.log('✅ Auto-started first track');
            }
        }
    }, 2000);
});

// Enhanced visualizer connection
function connectMusicToVisualizer() {
    if (window.musicPlayer && window.musicPlayer.audioPlayer) {
        try {
            // Force audio context resume
            if (window.musicPlayer.audioContext && window.musicPlayer.audioContext.state === 'suspended') {
                window.musicPlayer.audioContext.resume();
            }
            
            // Start playing if not already
            if (!window.musicPlayer.isPlaying && window.musicPlayer.currentTrack) {
                window.musicPlayer.togglePlayPause();
            }
            
            console.log('🔗 Connected music to visualizer');
            
        } catch (error) {
            console.warn('Failed to connect:', error);
        }
    }
}

// Add to window for debug access
window.connectMusicToVisualizer = connectMusicToVisualizer;