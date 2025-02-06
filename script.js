// ===========================
// script.js
// ===========================

// --- AudioContext & GainNode Setup ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioElement = document.getElementById('audioPlayer');
const mediaElementSource = audioContext.createMediaElementSource(audioElement);
const gainNode = audioContext.createGain();
// Connect the audio element through the gain node to the destination.
mediaElementSource.connect(gainNode);
gainNode.connect(audioContext.destination);

// --- Unlock AudioContext on iOS using a silent oscillator hack ---
function unlockAudioContext() {
  if (audioContext.state === 'suspended') {
    try {
      const oscillator = audioContext.createOscillator();
      const silentGain = audioContext.createGain();
      oscillator.connect(silentGain);
      silentGain.connect(audioContext.destination);
      oscillator.start(0);
      oscillator.stop(0);
      audioContext.resume().then(() => {
        console.log('AudioContext resumed via oscillator hack.');
      }).catch((err) => {
        console.error('Error resuming AudioContext:', err);
      });
    } catch (err) {
      console.error('Error unlocking AudioContext:', err);
    }
  }
}
// Attach unlocking to both touchend and click events (once)
document.addEventListener('touchend', unlockAudioContext, { once: true });
document.addEventListener('click', unlockAudioContext, { once: true });

// --- Tracks Array ---
const tracks = [
  {
    title: 'Talking Drums',
    src: 'Africa-Talking-Drum-80BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-12.svg'
  },
  {
    title: 'Darbouka',
    src: 'Darbouka-101BPM.mp3',
    albumArtUrl: 'orange.png'
  },
  {
    title: 'Sora',
    src: 'Jamaican-Sora-110BPM.mp3',
    albumArtUrl: 'purple.png'
  },
  {
    title: 'Klezmer',
    src: 'Klezmer-148BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-5.svg'
  },
  {
    title: 'Rain',
    src: 'Rain-100BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-3.svg'
  },
  {
    title: 'Scottish',
    src: 'Scottish-95BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-9.svg'
  },
  {
    title: 'Pakawaj',
    src: 'Indian-Pakawaj-70BPM.mp3',
    albumArtUrl: 'https://www.fffuel.co/images/ffflux/ffflux-8.svg'
  },
];

let currentTrackIndex = null;
let isLooping = false;

// --- DOM References ---
const playPauseBtn = document.getElementById('playPause');
const stopBtn = document.getElementById('stop');
const nextBtn = document.getElementById('nextTrack');
const prevBtn = document.getElementById('prevTrack');
const loopBtn = document.getElementById('toggleLoop');
const volumeControl = document.getElementById('volumeControl');

// --- Populate the Track Grid Dynamically ---
function populateTrackGrid() {
  const grid = document.querySelector('.grid');
  grid.innerHTML = ''; // Clear any existing content

  tracks.forEach((track, index) => {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-icon';
    trackDiv.dataset.index = index;
    
    // Determine the overlay letter (A for index 0, B for 1, etc.)
    const overlayLetter = String.fromCharCode(65 + index);  // 65 is "A"
    
    // Build the album art container.
    // The album art (either from albumArtUrl or a placeholder) is wrapped in a div.
    // Then a span with class "overlay-letter" is added on top.
    let albumArtHtml = "";
    if (track.albumArtUrl) {
      albumArtHtml = `<img src="${track.albumArtUrl}" alt="${track.title} Album Art" />`;
    } else {
      albumArtHtml = `<img src="https://via.placeholder.com/100?text=${encodeURIComponent(track.title)}" alt="${track.title} Album Art" />`;
    }
    
    trackDiv.innerHTML = `
      <div class="album-art-container">
        ${albumArtHtml}
        <span class="overlay-letter">${overlayLetter}</span>
      </div>
    `;
    
    // Create and append a span for the track title below the album art.
    const titleSpan = document.createElement('span');
    titleSpan.textContent = track.title;
    trackDiv.appendChild(titleSpan);
    
    // Add click event listener for playback.
    trackDiv.addEventListener('click', onTrackIconClick);
    
    grid.appendChild(trackDiv);
  });
}


// --- Playback & Control Functions ---
function updatePlayPauseButton(isPlaying) {
  if (isPlaying) {
    playPauseBtn.innerHTML = `<svg width="100" height="100" viewBox="0 0 64 64" fill="none" 
      xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="15" width="10" height="34" fill="#000"/>
        <rect x="36" y="15" width="10" height="34" fill="#000"/>
      </svg>`;
  } else {
    playPauseBtn.innerHTML = `<svg width="100" height="100" viewBox="0 0 64 64" fill="none" 
      xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,15 20,49 50,32" fill="#000"/>
      </svg>`;
  }
}

function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentTrackIndex = index;
  audioElement.src = tracks[index].src;
  audioElement.loop = isLooping;
  // Force a reload so that iOS re-reads the file.
  audioElement.load();
  updatePlayingVisuals();
}

function playTrack() {
  if (audioElement.src) {
    audioElement.play().then(() => {
      updatePlayPauseButton(true);
      updatePlayingVisuals();
    }).catch((err) => {
      console.error("Error during playback:", err);
    });
  }
}

function pauseTrack() {
  audioElement.pause();
  updatePlayPauseButton(false);
  updatePlayingVisuals();
}

function togglePlayPause() {
  if (!audioElement.src) {
    loadTrack(0);
    playTrack();
  } else if (audioElement.paused) {
    playTrack();
  } else {
    pauseTrack();
  }
}

function stopPlayback() {
  audioElement.pause();
  audioElement.currentTime = 0;
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
  audioElement.loop = isLooping;
  loopBtn.style.backgroundColor = isLooping ? '#4caf50' : 'transparent';
  loopBtn.style.animation = isLooping ? 'spin 4s reverse linear infinite' : null;
  loopBtn.style.borderRadius = isLooping ? '60px' : '0px';

}

function updateVolume() {
  // Update the gain value (volume control via the GainNode)
  gainNode.gain.value = volumeControl.value;
  updateHeaderColor();
}

function updateHeaderColor() {
  // Get the volume from the slider and snap it to the nearest tenth.
  const vol = parseFloat(volumeControl.value);
  const discreteVol = Math.round(vol * 10) / 10;  // e.g., 0, 0.1, 0.2, ..., 1.0

  const controls = document.querySelector('.controls');

  // Define our base colors as objects.
  const colorMuted = { r: 254, g: 0,  b: 0  };    // for volume 0.0
  const colorMid   = { r: 255, g: 253, b: 150 };      // for volume 0.5
  const colorHigh  = { r: 59,  g: 255, b: 167 };      // for volume 1.0

  let r, g, b;
  if (discreteVol < 0.5) {
    // Normalize to [0,1] for the range 0 to 0.5.
    const t = discreteVol / 0.5;
    r = Math.round(colorMuted.r + t * (colorMid.r - colorMuted.r));
    g = Math.round(colorMuted.g + t * (colorMid.g - colorMuted.g));
    b = Math.round(colorMuted.b + t * (colorMid.b - colorMuted.b));
  } else {
    // Normalize for the range 0.5 to 1.0.
    const t = (discreteVol - 0.5) / 0.5;
    r = Math.round(colorMid.r + t * (colorHigh.r - colorMid.r));
    g = Math.round(colorMid.g + t * (colorHigh.g - colorMid.g));
    b = Math.round(colorMid.b + t * (colorHigh.b - colorMid.b));
  }
  
  // Construct the new color string with opacity 0.6.
  const newColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
  controls.style.setProperty('--overlay-color', newColor);
}

function updatePlayingVisuals(reset = false) {
  const trackIcons = document.querySelectorAll('.track-icon');
  trackIcons.forEach(icon => {
    const index = parseInt(icon.getAttribute('data-index'));
    if (!reset && index === currentTrackIndex && !audioElement.paused) {
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

// --- Event Listeners ---
playPauseBtn.addEventListener('click', togglePlayPause);
stopBtn.addEventListener('click', stopPlayback);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
loopBtn.addEventListener('click', toggleLoop);
volumeControl.addEventListener('input', updateVolume);
audioElement.addEventListener('ended', () => {
  if (!isLooping) {
    nextTrack();
  }
});

// --- Populate the Track Grid on Page Load ---
populateTrackGrid();
