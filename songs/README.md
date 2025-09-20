# Songs Folder

This folder is for your MP3 audio files. 

## How to add songs:

1. Copy your MP3 files to this folder
2. Name them as: song1.mp3, song2.mp3, song3.mp3, etc.
3. Update the track_list array in script.js with your song details

## Example track_list entry:
```javascript
{
    name: "Your Song Name",
    artist: "Artist Name",
    image: "https://source.unsplash.com/300x300/?music",
    path: "songs/your-song-file.mp3"
}
```

## Supported formats:
- MP3
- WAV
- OGG
- M4A

## Note:
Make sure your audio files are properly encoded and not corrupted for best playback experience.

## 🚀 How to Run the Project:

### Method 1: Using PowerShell (Recommended)
```powershell
cd "c:\Users\heman\Downloads\Music player"
python -m http.server 8000
```

### Method 2: PowerShell One-line command
```powershell
cd "c:\Users\heman\Downloads\Music player"; python -m http.server 8000
```

### Method 3: Using Command Prompt
```bash
cd "c:\Users\heman\Downloads\Music player"
python -m http.server 8000
```

### Method 4: CMD One-line command
```bash
cd "c:\Users\heman\Downloads\Music player" && python -m http.server 8000
```

## 🌐 Access Your Music Player:
After running the server, open your browser and go to:
- **Main Launcher**: http://127.0.0.1:8000/final-launcher.html
- **3D Enhanced Player**: http://127.0.0.1:8000/3d-enhanced-player.html
- **Folder Music Player**: http://127.0.0.1:8000/folder-music-player.html

## 📝 Quick Start:

### For PowerShell Users:
1. Open PowerShell (Windows + X, then select "Windows PowerShell")
2. Copy and paste: `cd "c:\Users\heman\Downloads\Music player"; python -m http.server 8000`
3. Press Enter
4. Open browser and go to: http://127.0.0.1:8000/3d-enhanced-player.html
5. Enjoy your colorful 3D music player! 🎵✨

### For Command Prompt Users:
1. Open Command Prompt (cmd)
2. Copy and paste: `cd "c:\Users\heman\Downloads\Music player" && python -m http.server 8000`
3. Press Enter
4. Open browser and go to: http://127.0.0.1:8000/3d-enhanced-player.html
5. Enjoy your colorful 3D music player! 🎵✨