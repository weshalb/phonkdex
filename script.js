document.addEventListener("DOMContentLoaded", () => {
  const coverInput = document.getElementById("cover-upload");
  const audioInput = document.getElementById("audio-upload");
  const bakeButton = document.getElementById("bake-button");
  const coverPreview = document.getElementById("cover-preview");
  const waveformContainer = document.getElementById("waveform");
  const selection = document.getElementById("selection");
  const canvas = document.getElementById("preview-canvas");
  const ctx = canvas.getContext("2d");

  let coverImage = null;
  let audioFile = null;
  let audioBuffer = null;
  let selectedStart = 0;
  const segmentDuration = 15; // 15 seconds

  let audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Step 1: Handle Cover Upload
  coverInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        coverImage = new Image();
        coverImage.src = reader.result;
        coverImage.onload = () => {
          coverPreview.src = reader.result;
          coverPreview.style.display = "block";
        };
      };
      reader.readAsDataURL(file);
    }
  });

  // Step 2: Handle Audio Upload and Waveform Display
  audioInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      audioFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        audioContext.decodeAudioData(reader.result, (buffer) => {
          audioBuffer = buffer;
          drawWaveform(buffer);
          enableSelection();
        });
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // Draw Waveform
  function drawWaveform(buffer) {
    const waveform = buffer.getChannelData(0);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = waveformContainer.offsetWidth;
    canvas.height = waveformContainer.offsetHeight;
    ctx.fillStyle = "#fff";

    const step = Math.ceil(waveform.length / canvas.width);
    const amp = canvas.height / 2;
    for (let i = 0; i < canvas.width; i++) {
      const min = Math.min(...waveform.slice(i * step, (i + 1) * step));
      const max = Math.max(...waveform.slice(i * step, (i + 1) * step));
      ctx.fillRect(i, amp - min * amp, 1, (max - min) * amp);
    }

    waveformContainer.innerHTML = "";
    waveformContainer.appendChild(canvas);
  }

  // Enable Selection
  function enableSelection() {
    selection.style.display = "block";
    selection.style.width = "100px"; // Default selection width

    let isDragging = false;
    selection.addEventListener("mousedown", (e) => {
      isDragging = true;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const rect = waveformContainer.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 100));
        selection.style.left = `${x}px`;
        selectedStart = (x / rect.width) * audioBuffer.duration;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  // Step 3: Render Video
  bakeButton.addEventListener("click", () => {
    if (!coverImage || !audioFile || !audioBuffer) {
      alert("Please complete all steps before baking the video.");
      return;
    }

    const segmentStart = selectedStart;
    const segmentEnd = Math.min(segmentStart + segmentDuration, audioBuffer.duration);
    console.log(`Rendering 15-second segment from ${segmentStart} to ${segmentEnd}`);

    renderVideo(segmentStart, segmentEnd);
  });

  // Render Video
  function renderVideo(start, end) {
    const fps = 30;
    const frames = (end - start) * fps;
    const audioSegment = audioBuffer.getChannelData(0).slice(
      Math.floor(start * audioBuffer.sampleRate),
      Math.floor(end * audioBuffer.sampleRate)
    );
    const kickTimes = detectKicks(audioSegment, fps, start);

    for (let i = 0; i < frames; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw blurred background
      ctx.filter = "blur(15px)";
      ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);

      // Draw main cover image
      const mainSize = canvas.width * 0.8;
      ctx.filter = "none";
      ctx.drawImage(
        coverImage,
        (canvas.width - mainSize) / 2,
        (canvas.height - mainSize) / 2,
        mainSize,
        mainSize
      );

      // Add visualizer bars
      const visualizerWidth = canvas.width;
      const visualizerHeight = 80;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      const numBars = 50;
      const barWidth = visualizerWidth / numBars;
      for (let j = 0; j < numBars; j++) {
        const barHeight = Math.abs(audioSegment[i * fps + j]) * visualizerHeight;
        ctx.fillRect(
          j * barWidth,
          canvas.height - visualizerHeight - barHeight,
          barWidth - 2,
          barHeight
        );
      }

      // Add flash and shake effects for kicks
      const currentTime = start + i / fps;
      if (kickTimes.some((kick) => Math.abs(kick - currentTime) < 0.05)) {
        // Flash effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shake effect
        const shakeX = Math.random() * 10 - 5;
        const shakeY = Math.random() * 10 - 5;
        ctx.translate(shakeX, shakeY);
      }

      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    console.log("Video rendering complete!");
  }

  // Detect Kicks
  function detectKicks(segment, fps, startTime) {
    const kickThreshold = 0.6; // Adjust this for sensitivity
    const kickTimes = [];

    for (let i = 0; i < segment.length; i += fps) {
      const amplitude = Math.abs(segment[i]);
      if (amplitude > kickThreshold) {
        const time = startTime + i / audioBuffer.sampleRate;
        kickTimes.push(time);
      }
    }

    console.log("Detected kick times:", kickTimes);
    return kickTimes;
  }
});
