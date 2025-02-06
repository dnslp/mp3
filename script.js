
// --- AudioContext Unlock Fix for iOS ---
// --- Create and unlock the AudioContext using a silent oscillator hack ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function unlockAudioContext() {
  if (audioContext.state === 'suspended') {
    try {
      // Create a silent oscillator and immediately stop it.
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(0);
      oscillator.stop(0);
      // Now attempt to resume the audio context.
      audioContext.resume().then(() => {
        console.log("AudioContext resumed via oscillator hack.");
      }).catch((err) => {
        console.error("AudioContext resume error:", err);
      });
    } catch (err) {
      console.error("Error unlocking AudioContext:", err);
    }
  }
}

// Attach unlocking to both touchend and click events as a fallback.
document.addEventListener('touchend', unlockAudioContext, { once: true });
document.addEventListener('click', unlockAudioContext, { once: true });


// --- The rest of your code remains largely the same ---

// Sample track list with title, source, and an external album art URL.
const tracks = [
  {
    title: 'Talking Drums',
    src: '/Africa-Talking-Drum-80BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-12.svg'
  },
  {
    title: 'Darbouka',
    src: 'Darbouka-101BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-10.svg'
  },
  {
    title: 'Pakawaj',
    src: 'Indian-Pakawaj-70BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-8.svg'
  },
  {
    title: 'Sora',
    src: 'Jamaican-Sora-110BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-2.svg'
  }
];

let currentTrackIndex = null;
let isLooping = false;

const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPause');
const stopBtn = document.getElementById('stop');
const nextBtn = document.getElementById('nextTrack');
const prevBtn = document.getElementById('prevTrack');
const loopBtn = document.getElementById('toggleLoop');
const volumeControl = document.getElementById('volumeControl');

/**
 * Dynamically populate the grid with track icons.
 */
function populateTrackGrid() {
  const grid = document.querySelector('.grid');
  grid.innerHTML = ''; // Clear existing content
  tracks.forEach((track, index) => {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-icon';
    trackDiv.dataset.index = index;
    
    // Use the external album art URL if provided.
    if (track.albumArtUrl) {
      trackDiv.innerHTML = `<img src="${track.albumArtUrl}" alt="${track.title} Album Art" />`;
    } else {
      // Fallback to a placeholder image.
      trackDiv.innerHTML = `<img src="https://via.placeholder.com/100?text=${encodeURIComponent(track.title)}" alt="${track.title} Album Art" />`;
    }
    
    // Append the track title.
    const titleSpan = document.createElement('span');
    titleSpan.textContent = track.title;
    trackDiv.appendChild(titleSpan);
    
    // Add click event listener for playback.
    trackDiv.addEventListener('click', onTrackIconClick);
    
    grid.appendChild(trackDiv);
  });
}

/* --- Playback and Control Functions --- */

function updatePlayPauseButton(isPlaying) {
  if (isPlaying) {
    playPauseBtn.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" 
      xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="15" width="10" height="34" fill="#000"/>
        <rect x="36" y="15" width="10" height="34" fill="#000"/>
      </svg>`;
  } else {
    playPauseBtn.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" 
      xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,15 20,49 50,32" fill="#000"/>
      </svg>`;
  }
}

function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentTrackIndex = index;
  audioPlayer.src = tracks[index].src;
  audioPlayer.loop = isLooping;
  // Force a reload so that iOS re-reads the file.
  audioPlayer.load();
  updatePlayingVisuals();
}

function playTrack() {
  if (audioPlayer.src) {
    audioPlayer.play().then(() => {
      updatePlayPauseButton(true);
      updatePlayingVisuals();
    }).catch((err) => {
      console.error("Error during playback:", err);
    });
  }
}

function pauseTrack() {
  audioPlayer.pause();
  updatePlayPauseButton(false);
  updatePlayingVisuals();
}

function togglePlayPause() {
  if (!audioPlayer.src) {
    loadTrack(0);
    playTrack();
  } else if (audioPlayer.paused) {
    playTrack();
  } else {
    pauseTrack();
  }
}

function stopPlayback() {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  updatePlayPauseButton(false);
  updatePlayingVisuals(true);
}

function nextTrack() {
  let nextIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack(nextIndex);
  playTrack();
}

function prevTrack() {
  let prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(prevIndex);
  playTrack();
}

function toggleLoop() {
  isLooping = !isLooping;
  audioPlayer.loop = isLooping;
  loopBtn.style.backgroundColor = isLooping ? '#4caf50' : 'transparent';
}

function updateVolume() {
  audioPlayer.volume = volumeControl.value;
  updateHeaderColor();
}

function updateHeaderColor() {
  const vol = parseFloat(volumeControl.value);
  const controls = document.querySelector('.controls');
  let newColor;
  if (vol === 0) {
    newColor = "rgba(244,67,54,0.6)"; // red for muted
  } else if (vol < 0.5) {
    newColor = "rgba(255,253,150,0.6)"; // soft yellow for low volume
  } else {
    newColor = "rgba(255,235,59,0.6)"; // bright yellow for medium-high volume
  }
  controls.style.setProperty('--overlay-color', newColor);
}

function updatePlayingVisuals(reset = false) {
  const trackIcons = document.querySelectorAll('.track-icon');
  trackIcons.forEach(icon => {
    const index = parseInt(icon.getAttribute('data-index'));
    if (!reset && index === currentTrackIndex && !audioPlayer.paused) {
      icon.classList.add('playing');
    } else {
      icon.classList.remove('playing');
    }
  });
}

function onTrackIconClick(e) {
  const icon = e.currentTarget;
  const index = parseInt(icon.getAttribute('data-index'));
  if (index === currentTrackIndex) {
    togglePlayPause();
  } else {
    loadTrack(index);
    playTrack();
  }
}

/* --- Event Listeners --- */

playPauseBtn.addEventListener('click', togglePlayPause);
stopBtn.addEventListener('click', stopPlayback);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
loopBtn.addEventListener('click', toggleLoop);
volumeControl.addEventListener('input', updateVolume);
audioPlayer.addEventListener('ended', () => {
  if (!isLooping) {
    nextTrack();
  }
});

// Populate the track grid when the page loads.
populateTrackGrid();
