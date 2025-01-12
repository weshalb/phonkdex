const imageInput = document.getElementById("image-upload");
const audioInput = document.getElementById("audio-upload");
const generateBtn = document.getElementById("generate");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const progressBarContainer = document.getElementById("progress-bar-container");
const progressBar = document.getElementById("progress-bar");

let coverImage = null;
let audioFile = null;

// Handle image upload
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        coverImage = img;
      };
    };
    reader.readAsDataURL(file);
  }
});

// Handle audio upload
audioInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    audioFile = file;
  }
});

// Generate button functionality
generateBtn.addEventListener("click", () => {
  if (coverImage && audioFile) {
    progressBarContainer.style.display = "block";
    processAudioAndGenerateVideo(audioFile, coverImage);
  } else {
    alert("Please upload both an image and an audio file!");
  }
});

// Process audio and generate video
async function processAudioAndGenerateVideo(audioFile, coverImage) {
  const audioContext = new AudioContext();
  const reader = new FileReader();

  reader.onload = async (event) => {
    const audioBuffer = await audioContext.decodeAudioData(event.target.result);

    // Detect beats (simplified kick detection)
    const beats = detectBeats(audioBuffer);

    // Render video with effects
    renderVideo(beats, coverImage);
  };

  reader.readAsArrayBuffer(audioFile);
}

// Simple beat detection based on amplitude
function detectBeats(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const threshold = 0.5; // Adjust for sensitivity
  const beats = [];

  for (let i = 0; i < channelData.length; i += 1024) {
    if (Math.abs(channelData[i]) > threshold) {
      beats.push(i / audioBuffer.sampleRate); // Convert index to time
    }
  }
  return beats;
}

// Render video with effects
async function renderVideo(beats, coverImage) {
  const duration = 10; // Adjust video length as needed
  const fps = 30;
  const frames = duration * fps;
  const videoFrames = [];

  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw blurred background
    ctx.filter = "blur(10px)";
    ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);

    // Draw cover image
    const coverSize = canvas.width * 0.8;
    ctx.filter = "none";
    ctx.drawImage(
      coverImage,
      (canvas.width - coverSize) / 2,
      (canvas.height - coverSize) / 2,
      coverSize,
      coverSize
    );

    // Visualizer
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    const barWidth = canvas.width / 64;
    for (let i = 0; i < 64; i++) {
      const barHeight = Math.random() * 100; // Mock visualizer
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }

    // Flash/Zoom on beats
    const time = frame / fps;
    if (beats.some((beat) => Math.abs(beat - time) < 0.1)) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(1.1, 1.1);
    }

    // Capture frame
    videoFrames.push(canvas.toDataURL());
    progressBar.style.width = `${(frame / frames) * 100}%`;
  }

  // Combine frames into a video
  await generateVideo(videoFrames, fps);
}

// Generate video using FFmpeg (or client-side alternatives)
async function generateVideo(frames, fps) {
  console.log("Frames captured, ready to render video!");
  progressBarContainer.style.display = "none";
}
