// Wynk Music Player Debug Helper
console.log('🔧 Wynk Music Debug Helper Loading...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Running Wynk Music Debug Check...');
    
    // Check critical elements
    const elements = {
        'Audio Player': document.getElementById('audioPlayer'),
        'Play Button': document.getElementById('playBtn'),
        'Music Grid': document.getElementById('musicGrid'),
        'Search Input': document.getElementById('search-input'),
        'Current Track Name': document.getElementById('currentTrackName'),
        'Current Track Artist': document.getElementById('currentTrackArtist'),
        'Current Track Image': document.getElementById('currentTrackImage'),
        'Volume Slider': document.getElementById('volumeSlider'),
        'Progress Bar': document.querySelector('.progress-bar'),
        'Progress Fill': document.getElementById('progress'),
        'Lyrics Button': document.getElementById('lyricsBtn'),
        'Visualizer Button': document.getElementById('visualizerBtn')
    };
    
    console.log('🔍 Element Check Results:');
    let missingElements = [];
    
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            console.log(`✅ ${name}: Found`);
        } else {
            console.log(`❌ ${name}: Missing`);
            missingElements.push(name);
        }
    }
    
    // Check if music player instance exists
    setTimeout(() => {
        if (window.musicPlayer) {
            console.log('✅ Music Player Instance: Created');
            console.log('🎵 Playlist Length:', window.musicPlayer.playlist.length);
            console.log('🎨 Current Theme:', window.musicPlayer.currentTheme);
            
            // Test audio files
            if (window.musicPlayer.playlist.length > 0) {
                const firstTrack = window.musicPlayer.playlist[0];
                console.log('🎵 First Track:', firstTrack.title);
                console.log('🎵 Audio Path:', firstTrack.audio);
                
                // Test if audio file is accessible
                fetch(firstTrack.audio, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            console.log('✅ Audio File: Accessible');
                        } else {
                            console.log('❌ Audio File: Not accessible');
                        }
                    })
                    .catch(error => {
                        console.log('❌ Audio File: Error -', error.message);
                    });
            }
        } else {
            console.log('❌ Music Player Instance: Not found');
        }
        
        // Summary
        console.log('\n📊 DEBUG SUMMARY:');
        console.log(`Elements Found: ${Object.keys(elements).length - missingElements.length}/${Object.keys(elements).length}`);
        console.log(`Missing Elements: ${missingElements.join(', ') || 'None'}`);
        console.log('🎵 Wynk Music Player Debug Complete');
        
        // Auto-fix: Try to click first track if everything looks good
        if (missingElements.length === 0 && window.musicPlayer && window.musicPlayer.playlist.length > 0) {
            console.log('🎵 Auto-testing: Attempting to load first track...');
            setTimeout(() => {
                const firstTrackCard = document.querySelector('.track-card');
                if (firstTrackCard) {
                    console.log('🎵 Auto-testing: Found first track card, ready for user interaction');
                }
            }, 2000);
        }
    }, 1000);
    
    // Check CSS loading
    const wynkStyles = getComputedStyle(document.documentElement).getPropertyValue('--wynk-primary');
    if (wynkStyles) {
        console.log('✅ Wynk CSS: Loaded (Primary color:', wynkStyles.trim(), ')');
    } else {
        console.log('❌ Wynk CSS: Not loaded properly');
    }
});

// Auto-start helper function
window.startWynkMusic = function() {
    console.log('🎵 Starting Wynk Music...');
    if (window.musicPlayer) {
        const firstTrack = document.querySelector('.track-card');
        if (firstTrack) {
            firstTrack.click();
            console.log('🎵 First track clicked!');
        }
    }
};

console.log('✅ Wynk Music Debug Helper Ready - Type startWynkMusic() to test');