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

    for (let i = 0; i < frames; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.filter = "blur(15px)";
      ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);

      // Draw main cover
      const mainSize = canvas.width * 0.8;
      ctx.filter = "none";
      ctx.drawImage(
        coverImage,
        (canvas.width - mainSize) / 2,
        (canvas.height - mainSize) / 2,
        mainSize,
        mainSize
      );

      // TODO: Add visualizer and kick effects here
    }

    console.log("Video rendering complete!");
  }
});
