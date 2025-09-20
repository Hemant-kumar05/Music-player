// Test script to force audio playback and debug issues
console.log('🚀 Music Player Debug Script Loaded');

// Wait for DOM and music player to load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔍 Running diagnostics...');
        
        // Check if music player exists
        if (window.musicPlayer) {
            console.log('✅ Music Player instance found');
            console.log('📊 Player state:', {
                currentTrack: window.musicPlayer.currentTrack,
                isPlaying: window.musicPlayer.isPlaying,
                playlist: window.musicPlayer.playlist.length + ' tracks'
            });
            
            // Test track click
            if (window.musicPlayer.playlist.length > 0) {
                console.log('🎵 Testing first track...');
                window.musicPlayer.playTrack(0);
            }
            
            // Add test buttons to the main page
            addTestButtons();
        } else {
            console.error('❌ Music Player instance not found');
        }
    }, 2000);
});

function addTestButtons() {
    // Create test control panel
    const testPanel = document.createElement('div');
    testPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(40, 40, 40, 0.95);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    testPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">🎵 Debug Controls</div>
        <button onclick="testAudioDirect()" style="margin: 2px; padding: 5px 10px; background: #1db954; color: white; border: none; border-radius: 4px; cursor: pointer;">Test Audio</button><br>
        <button onclick="forcePlayTrack()" style="margin: 2px; padding: 5px 10px; background: #1db954; color: white; border: none; border-radius: 4px; cursor: pointer;">Force Play Track 1</button><br>
        <button onclick="showPlayerState()" style="margin: 2px; padding: 5px 10px; background: #1db954; color: white; border: none; border-radius: 4px; cursor: pointer;">Show State</button><br>
        <button onclick="testPanel.remove()" style="margin: 2px; padding: 5px 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `;
    
    document.body.appendChild(testPanel);
    window.testPanel = testPanel;
}

// Test functions
window.testAudioDirect = function() {
    console.log('🔊 Testing direct audio playback...');
    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
    audio.play().then(() => {
        console.log('✅ Direct audio test successful');
        setTimeout(() => audio.pause(), 2000);
    }).catch(error => {
        console.error('❌ Direct audio test failed:', error);
    });
};

window.forcePlayTrack = function() {
    if (window.musicPlayer && window.musicPlayer.playlist.length > 0) {
        console.log('🎵 Force playing first track...');
        window.musicPlayer.playTrack(0);
        
        // Force update UI
        setTimeout(() => {
            if (window.musicPlayer.currentTrack) {
                console.log('🎨 Forcing UI update...');
                window.musicPlayer.updateNowPlaying();
                window.musicPlayer.updatePlayButton();
            }
        }, 1000);
    } else {
        console.error('❌ No music player or tracks available');
    }
};

window.showPlayerState = function() {
    if (window.musicPlayer) {
        console.log('📊 Current Player State:', {
            currentTrack: window.musicPlayer.currentTrack,
            isPlaying: window.musicPlayer.isPlaying,
            currentTime: window.musicPlayer.currentTime,
            duration: window.musicPlayer.duration,
            volume: window.musicPlayer.volume,
            audioPlayer: window.musicPlayer.audioPlayer,
            audioSrc: window.musicPlayer.audioPlayer?.src,
            playlistLength: window.musicPlayer.playlist.length
        });
    }
};

// Override audio play for better debugging
if (typeof Audio !== 'undefined') {
    const originalPlay = Audio.prototype.play;
    Audio.prototype.play = function() {
        console.log('🎵 Audio.play() called on:', this.src);
        return originalPlay.call(this).then(() => {
            console.log('✅ Audio play promise resolved');
        }).catch(error => {
            console.error('❌ Audio play promise rejected:', error);
            throw error;
        });
    };
}