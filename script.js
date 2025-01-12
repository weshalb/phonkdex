document.addEventListener("DOMContentLoaded", () => {
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
  let audioContext = null; // Initialize as null, and create after user interaction

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
      audioFile = file; // Assign audio file
      console.log("Audio file uploaded:", audioFile);

      // Create and resume AudioContext after user interaction
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext created.");
      }

      const reader = new FileReader();
      reader.onload = () => {
        audioContext.decodeAudioData(reader.result, (audioBuffer) => {
          detectedKicks = detectKicks(audioBuffer);
          visualizeKicks(detectedKicks, audioBuffer.duration);
          console.log("Kick detection complete. Detected kicks:", detectedKicks);
        });
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // Step 3: Generate Video
  generateButton.addEventListener("click", async () => {
    console.log("User interaction detected. Resuming AudioContext...");
    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume(); // Resume the audio context
      console.log("AudioContext resumed.");
    }

    if (!coverImage) {
      alert("Please upload a cover image.");
      return;
    }

    if (!audioFile) {
      alert("Please upload an audio file.");
      return;
    }

    if (detectedKicks.length === 0) {
      alert("No kicks detected in the audio file. Try uploading a different file.");
      return;
    }

    console.log("All prerequisites met. Starting video generation...");
    renderVideo();
  });

  // Detect kicks (simplified amplitude threshold)
  function detectKicks(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const threshold = 0.2; // Adjust sensitivity
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

  // Render the video with effects
  function renderVideo() {
  const fps = 30; // Frames per second
  const duration = 10; // Example video duration in seconds
  const frames = duration * fps; // Total number of frames
  const videoFrames = []; // Array to store frames for the video

  console.log("Starting video rendering...");

  // Generate frames
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (blurred cover)
    if (coverImage) {
      ctx.filter = "blur(15px)";
      ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw cover image (main content)
    const mainSize = canvas.width * 0.8;
    ctx.filter = "none";
    ctx.drawImage(
      coverImage,
      (canvas.width - mainSize) / 2,
      (canvas.height - mainSize) / 2,
      mainSize,
      mainSize
    );

    // Add audio visualizer
    const visualizerWidth = canvas.width;
    const visualizerHeight = 50;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    const numBars = 30;
    const barWidth = visualizerWidth / numBars;
    for (let i = 0; i < numBars; i++) {
      const barHeight = Math.random() * visualizerHeight;
      ctx.fillRect(i * barWidth, canvas.height - visualizerHeight - barHeight, barWidth, barHeight);
    }

    // Flash and Shake effects on detected kicks
    const time = frame / fps;
    if (detectedKicks.some((kick) => Math.abs(kick - time) < 0.05)) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Flash effect
      ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5); // Shake effect
    }

    // Add current frame to the video frames array
    videoFrames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    videoProgress.style.width = `${(frame / frames) * 100}%`;
  }

  // Create video using Whammy.js
  console.log("Generating video...");
  const video = new Whammy.Video(fps);

  videoFrames.forEach((frame) => {
    video.add(frame); // Add each frame to the video
  });

  const output = video.compile(); // Compile the frames into a WebM video

  // Create a downloadable video link
  const videoURL = URL.createObjectURL(output);
  const downloadLink = document.createElement("a");
  downloadLink.href = videoURL;
  downloadLink.download = "visualizer_video.webm";
  downloadLink.textContent = "Download Video";
  document.body.appendChild(downloadLink);

  console.log("Video rendering complete. Video ready for download.");
}
