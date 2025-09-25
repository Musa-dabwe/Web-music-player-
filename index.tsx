// Fix for line 59: Property 'jsmediatags' does not exist on type 'Window & typeof globalThis'.
// By declaring it on the window object.
interface Window {
    jsmediatags: any;
}

document.addEventListener('DOMContentLoaded', () => {
    // Fix for multiple errors by casting elements to their correct HTML types.
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const createBtn = document.getElementById('create-btn') as HTMLButtonElement;
    const trackListEl = document.getElementById('track-list') as HTMLElement;
    // Fix for errors on lines 119, 133, 138, 158, 159: Cast to HTMLAudioElement
    const audioPlayer = document.getElementById('audio-player') as HTMLAudioElement;
    const mainPlayPauseBtn = document.getElementById('main-play-pause-btn') as HTMLButtonElement;
    const mainPlayPauseIcon = document.getElementById('main-play-pause-icon') as HTMLElement;
    const playerPlayPauseIcon = document.getElementById('player-play-pause-icon') as HTMLElement;
    
    const nowPlayingBar = document.getElementById('now-playing-bar') as HTMLElement;
    // Fix for error on line 121: Cast to HTMLImageElement
    const nowPlayingArt = document.getElementById('now-playing-art') as HTMLImageElement;
    const mainCoverArt = document.getElementById('main-cover-art') as HTMLImageElement;
    const nowPlayingTitle = document.getElementById('now-playing-title') as HTMLElement;
    const nowPlayingArtist = document.getElementById('now-playing-artist') as HTMLElement;
    const progressBar = document.getElementById('progress-bar') as HTMLElement;
    const playlistDurationEl = document.querySelector('.playlist-duration') as HTMLElement;

    let playlist: any[] = [];
    let currentIndex = -1;
    let isPlaying = false;
    const PLACEHOLDER_COVER_URL = 'http://decor2go.ca/cdn/shop/files/MusicManiaWallpaperMural_219598642_Music_kids_hobby_Modern_Colorful_livingroom.png?v=1715194266';

    // --- Event Listeners ---
    mainCoverArt.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    mainPlayPauseBtn.addEventListener('click', togglePlayPause);
    playerPlayPauseIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('play', () => {
        updatePlayPauseIcons(true);
        if (currentIndex > -1) {
            mainCoverArt.src = playlist[currentIndex].cover;
        }
    });
    audioPlayer.addEventListener('pause', () => {
        updatePlayPauseIcons(false);
        mainCoverArt.src = PLACEHOLDER_COVER_URL;
    });
    
    trackListEl.addEventListener('click', (e) => {
        // Fix for line 37: Property 'closest' does not exist on type 'EventTarget'.
        const item = (e.target as HTMLElement).closest('.track-item') as HTMLElement;
        if (item) {
            const index = parseInt(item.dataset.index, 10);
            if (index !== currentIndex) {
                loadTrack(index);
                playTrack();
            } else {
                togglePlayPause();
            }
        }
    });

    // --- Core Functions ---
    async function handleFileSelect(event: Event) {
        // Fix for line 51: Property 'type' does not exist on type 'unknown'.
        const files = Array.from((event.target as HTMLInputElement).files || []).filter((file: File) => file.type.startsWith('audio/'));
        if (files.length === 0) return;

        playlist = [];
        trackListEl.innerHTML = '<p>Loading tracks...</p>';
        
        // Fix for lines 64 and 75: Property 'name' does not exist on type 'unknown'.
        const trackPromises = files.map((file: File) => 
            new Promise((resolve) => {
                window.jsmediatags.read(file, {
                    onSuccess: (tag: any) => {
                        const { title, artist, album, picture } = tag.tags;
                        const track = {
                            file: file,
                            title: title || file.name.replace(/\.[^/.]+$/, ""),
                            artist: artist || "Unknown Artist",
                            album: album || "Unknown Album",
                            cover: picture ? `data:${picture.format};base64,${arrayBufferToBase64(picture.data)}` : PLACEHOLDER_COVER_URL
                        };
                        resolve(track);
                    },
                    onError: () => {
                        // Fallback for files without tags
                        resolve({
                            file: file,
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            artist: "Unknown Artist",
                            album: "Unknown Album",
                            cover: PLACEHOLDER_COVER_URL
                        });
                    }
                });
            })
        );
        
        playlist = await Promise.all(trackPromises);
        renderPlaylist();
    }

    function renderPlaylist() {
        if (!trackListEl) return;
        trackListEl.innerHTML = '';
        if (playlist.length === 0) {
            playlistDurationEl.textContent = 'Import your music';
            return;
        }

        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'track-item';
            // Fix for line 100: Type 'number' is not assignable to type 'string'.
            li.dataset.index = index.toString();
            li.innerHTML = `
                <img src="${track.cover}" alt="Album Art">
                <div class="track-details">
                    <p class="title">${track.title}</p>
                    <p class="artist">${track.artist}</p>
                </div>
                <i class="material-icons more-icon">more_horiz</i>
            `;
            trackListEl.appendChild(li);
        });
        playlistDurationEl.textContent = `${playlist.length} songs`;
    }

    function loadTrack(index: number) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        const track = playlist[currentIndex];
        
        mainCoverArt.src = track.cover;
        audioPlayer.src = URL.createObjectURL(track.file);
        
        nowPlayingArt.src = track.cover;
        nowPlayingTitle.textContent = track.title;
        nowPlayingArtist.textContent = track.artist;
        nowPlayingBar.style.display = 'flex';

        updateActiveClass();
    }

    function playTrack() {
        if (currentIndex === -1 && playlist.length > 0) {
            loadTrack(0);
        }
        audioPlayer.play().catch(e => console.error("Playback failed:", e));
    }

    function pauseTrack() {
        audioPlayer.pause();
    }

    function togglePlayPause() {
        if (playlist.length === 0) return;
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    }

    function playNext() {
        const nextIndex = (currentIndex + 1) % playlist.length;
        loadTrack(nextIndex);
        playTrack();
    }
    
    function updateProgress() {
        if (audioPlayer.duration) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
        }
    }

    function updatePlayPauseIcons(playing: boolean) {
        const icon = playing ? 'pause' : 'play_arrow';
        mainPlayPauseIcon.textContent = icon;
        playerPlayPauseIcon.textContent = icon;
        isPlaying = playing;
    }

    function updateActiveClass() {
        document.querySelectorAll('.track-item').forEach((item, index) => {
            if (index === currentIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // --- Helpers ---
    function arrayBufferToBase64(buffer: ArrayBuffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
});