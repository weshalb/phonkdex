// Select elements
const imageInput = document.getElementById("image-upload");
const audioInput = document.getElementById("audio-upload");
const generateBtn = document.getElementById("generate");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

// Variables for uploaded files
let coverImage = null;
let audioFile = null;

// Upload handlers
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      coverImage = img;
    };
    reader.readAsDataURL(file);
  }
});

audioInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    audioFile = file;
  }
});

// Generate button
generateBtn.addEventListener("click", () => {
  if (coverImage && audioFile) {
    playAudioAndVisualize(audioFile, coverImage);
  } else {
    alert("Please upload both an image and an audio file!");
  }
});

// Visualization function
function playAudioAndVisualize(audioFile, coverImage) {
  // Load the audio
  const audioContext = new AudioContext();
  const reader = new FileReader();

  reader.onload = async (event) => {
    const audioBuffer = await audioContext.decodeAudioData(event.target.result);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Analyser for visualizer
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Connect nodes
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Start audio
    source.start();

    // Render visualizer
    function renderVisualizer() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw blurred background
      ctx.filter = "blur(10px)";
      ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);

      // Draw cover in the center
      ctx.filter = "none";
      const imgSize = canvas.width * 0.6;
      ctx.drawImage(
        coverImage,
        (canvas.width - imgSize) / 2,
        (canvas.height - imgSize) / 2,
        imgSize,
        imgSize
      );

      // Audio visualizer effect
      analyser.getByteFrequencyData(dataArray);
      const barWidth = canvas.width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
      }

      requestAnimationFrame(renderVisualizer);
    }

    renderVisualizer();
  };

  reader.readAsArrayBuffer(audioFile);
}
