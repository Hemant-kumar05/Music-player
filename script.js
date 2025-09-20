// Music track list
let track_list = [
    {
        name: "Song 1",
        artist: "Artist 1",
        image: "https://source.unsplash.com/300x300/?music",
        path: "songs/song1.mp3"
    },
    {
        name: "Song 2", 
        artist: "Artist 2",
        image: "https://source.unsplash.com/300x300/?audio",
        path: "songs/song2.mp3"
    },
    {
        name: "Song 3",
        artist: "Artist 3", 
        image: "https://source.unsplash.com/300x300/?sound",
        path: "songs/song3.mp3"
    }
];

// Player elements
let now_playing = document.querySelector(".now-playing");
let track_art = document.querySelector(".track-art");
let track_name = document.querySelector(".track-name");
let track_artist = document.querySelector(".track-artist");

let playpause_btn = document.querySelector(".playpause-track");
let next_btn = document.querySelector(".next-track");
let prev_btn = document.querySelector(".prev-track");

let seek_slider = document.querySelector(".seek_slider");
let volume_slider = document.querySelector(".volume_slider");
let curr_time = document.querySelector(".current-time");
let total_duration = document.querySelector(".total-duration");

// Player variables
let track_index = 0;
let isPlaying = false;
let updateTimer;

// Create audio element
let curr_track = document.createElement('audio');

// Initialize player
document.addEventListener('DOMContentLoaded', function() {
    loadTrack(track_index);
});

function loadTrack(track_index) {
    clearInterval(updateTimer);
    resetValues();
    
    curr_track.src = track_list[track_index].path;
    curr_track.load();
    
    track_art.style.backgroundImage = "url(" + track_list[track_index].image + ")";
    track_name.textContent = track_list[track_index].name;
    track_artist.textContent = track_list[track_index].artist;
    now_playing.textContent = "PLAYING " + (track_index + 1) + " OF " + track_list.length;
    
    updateTimer = setInterval(seekUpdate, 1000);
    
    curr_track.addEventListener("ended", nextTrack);
    curr_track.addEventListener("loadedmetadata", function() {
        seek_slider.max = curr_track.duration;
    });
}

function resetValues() {
    curr_time.textContent = "00:00";
    total_duration.textContent = "00:00";
    seek_slider.value = 0;
}

function playpauseTrack() {
    if (!isPlaying) playTrack();
    else pauseTrack();
}

function playTrack() {
    curr_track.play();
    isPlaying = true;
    playpause_btn.innerHTML = '<i class="fa fa-pause-circle fa-5x"></i>';
}

function pauseTrack() {
    curr_track.pause();
    isPlaying = false;
    playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-5x"></i>';
}

function nextTrack() {
    if (track_index < track_list.length - 1)
        track_index += 1;
    else track_index = 0;
    loadTrack(track_index);
    playTrack();
}

function prevTrack() {
    if (track_index > 0)
        track_index -= 1;
    else track_index = track_list.length - 1;
    loadTrack(track_index);
    playTrack();
}

function seekTo() {
    let seekto = curr_track.duration * (seek_slider.value / 100);
    curr_track.currentTime = seekto;
}

function setVolume() {
    curr_track.volume = volume_slider.value / 100;
}

function seekUpdate() {
    let seekPosition = 0;
    
    if (!isNaN(curr_track.duration)) {
        seekPosition = curr_track.currentTime * (100 / curr_track.duration);
        seek_slider.value = seekPosition;
        
        let currentMinutes = Math.floor(curr_track.currentTime / 60);
        let currentSeconds = Math.floor(curr_track.currentTime - currentMinutes * 60);
        let durationMinutes = Math.floor(curr_track.duration / 60);
        let durationSeconds = Math.floor(curr_track.duration - durationMinutes * 60);
        
        if (currentSeconds < 10) { currentSeconds = "0" + currentSeconds; }
        if (durationSeconds < 10) { durationSeconds = "0" + durationSeconds; }
        if (currentMinutes < 10) { currentMinutes = "0" + currentMinutes; }
        if (durationMinutes < 10) { durationMinutes = "0" + durationMinutes; }
        
        curr_time.textContent = currentMinutes + ":" + currentSeconds;
        total_duration.textContent = durationMinutes + ":" + durationSeconds;
    }
}

// Advanced Features

// Playlist Management
function addToPlaylist(songPath, songName, artistName, imageUrl = "https://source.unsplash.com/300x300/?music") {
    track_list.push({
        name: songName,
        artist: artistName,
        image: imageUrl,
        path: songPath
    });
    console.log("Song added to playlist:", songName);
}

function removeFromPlaylist(index) {
    if (index >= 0 && index < track_list.length) {
        let removedSong = track_list.splice(index, 1)[0];
        console.log("Song removed from playlist:", removedSong.name);
        
        // Adjust current track index if necessary
        if (index <= track_index && track_index > 0) {
            track_index--;
        }
        
        // If current track was removed, load next available track
        if (index === track_index) {
            if (track_index >= track_list.length) {
                track_index = 0;
            }
            if (track_list.length > 0) {
                loadTrack(track_index);
            }
        }
    }
}

// Search Functionality
function searchSongs(query) {
    return track_list.filter(track => 
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase())
    );
}

// Shuffle functionality
function shufflePlaylist() {
    for (let i = track_list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [track_list[i], track_list[j]] = [track_list[j], track_list[i]];
    }
    track_index = 0;
    loadTrack(track_index);
    console.log("Playlist shuffled");
}

// Random track selection
function playRandomTrack() {
    track_index = Math.floor(Math.random() * track_list.length);
    loadTrack(track_index);
    playTrack();
}

// Keyboard controls
document.addEventListener('keydown', function(event) {
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            playpauseTrack();
            break;
        case 'ArrowRight':
            nextTrack();
            break;
        case 'ArrowLeft':
            prevTrack();
            break;
        case 'ArrowUp':
            event.preventDefault();
            volume_slider.value = Math.min(100, parseInt(volume_slider.value) + 5);
            setVolume();
            break;
        case 'ArrowDown':
            event.preventDefault();
            volume_slider.value = Math.max(0, parseInt(volume_slider.value) - 5);
            setVolume();
            break;
    }
});

// Error handling for audio loading
curr_track.addEventListener('error', function(e) {
    console.error('Error loading audio file:', e);
    alert('Error loading audio file. Please check if the file exists and is in a supported format.');
});

// Volume persistence
if (localStorage.getItem('musicPlayerVolume')) {
    volume_slider.value = localStorage.getItem('musicPlayerVolume');
    setVolume();
}

volume_slider.addEventListener('input', function() {
    localStorage.setItem('musicPlayerVolume', volume_slider.value);
});

// Track progress on seek slider interaction
seek_slider.addEventListener('input', function() {
    let seekto = curr_track.duration * (seek_slider.value / 100);
    curr_track.currentTime = seekto;
});

console.log("Music Player initialized successfully!");
console.log("Keyboard controls: Space (play/pause), Arrow keys (next/prev/volume)");
console.log("Available functions: addToPlaylist(), removeFromPlaylist(), searchSongs(), shufflePlaylist(), playRandomTrack()");