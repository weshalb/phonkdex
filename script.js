const coverInput = document.getElementById("cover-upload");
const audioInput = document.getElementById("audio-upload");
const generateButton = document.getElementById("generate-video");
const canvas = document.getElementById("preview-canvas");
const ctx = canvas.getContext("2d");

const kickProgress = document.getElementById("kick-progress-bar");
const videoProgress = document.getElementById("video-progress-bar");
const kickTimeline = document.getElementById("kick-timeline");

let coverImage = null;
let audioFile = null;
let detectedKicks = [];

// Step 1: Upload Cover Image
coverInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        coverImage = img;
        console.log("Cover image loaded.");
      };
    };
    reader.readAsDataURL(file);
  }
});

// Step 2: Upload Audio File and Detect Kicks
audioInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const audioContext = new AudioContext();
      audioContext.decodeAudioData(reader.result, (audioBuffer) => {
        detectedKicks = detectKicks(audioBuffer);
        visualizeKicks(detectedKicks, audioBuffer.duration);
        console.log("Kick detection complete.");
      });
    };
    reader.readAsArrayBuffer(file);
  }
});

// Detect kicks (simplified amplitude threshold)
function detectKicks(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const threshold = 0.4; // Adjust sensitivity
  const kicks = [];
  for (let i = 0; i < channelData.length; i += 1024) {
    if (Math.abs(channelData[i]) > threshold) {
      kicks.push(i / audioBuffer.sampleRate); // Convert index to time
    }
  }
  return kicks;
}

// Visualize kicks on timeline
function visualizeKicks(kicks, duration) {
  kickTimeline.innerHTML = ""; // Clear previous marks
  kicks.forEach((kickTime) => {
    const position = (kickTime / duration) * 100;
    const mark = document.createElement("div");
    mark.className = "kick-mark";
    mark.style.left = `${position}%`;
    kickTimeline.appendChild(mark);
  });
}

// Step 3: Generate Video
generateButton.addEventListener("click", () => {
  if (coverImage && audioFile && detectedKicks.length > 0) {
    console.log("Generating video...");
    renderVideo();
  } else {
    alert("Please complete steps 1 and 2 before generating a video.");
  }
});

// Render the video with effects
function renderVideo() {
  const fps = 30;
  const duration = 10; // Example video duration
  const frames = duration * fps;

  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background (Blurred)
    ctx.filter = "blur(15px)";
    ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);

    // Main Video (Centered)
    const mainSize = canvas.width * 0.8;
    ctx.filter = "none";
    ctx.drawImage(
      coverImage,
      (canvas.width - mainSize) / 2,
      (canvas.height - mainSize) / 2,
      mainSize,
      mainSize
    );

    // Add effects for detected kicks
    const time = frame / fps;
    if (detectedKicks.some((kick) => Math.abs(kick - time) < 0.05)) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5); // Shake
    }

    // Progress bar
    videoProgress.style.width = `${(frame / frames) * 100}%`;
  }

  console.log("Video rendering complete.");
}
