let inputSources = []; // Stores available video sources (like windows or screens)
let mediaRecorder; // MediaRecorder instance used to record the video
let recordedChunks = []; // Stores chunks of recorded video data

const videoElement = document.querySelector("video"); // Reference to the video element in the DOM
const videoSelectBtn = document.getElementById("videoSelectBtn"); // Button to select the video source
const startBtn = document.getElementById("startBtn"); // Button to start recording
const stopBtn = document.getElementById("stopBtn"); // Button to stop recording
const recordingMessage = document.getElementById("recordingMessage"); // Message displayed when recording starts

// Toggles the visibility of the recording message
function toggleRecordingMessage(show, message = "") {
  if (show) {
    recordingMessage.textContent = message; // Set the message text
    recordingMessage.classList.remove("is-hidden"); // Show the message
    recordingMessage.classList.add("is-visible"); // Add visibility class
  } else {
    recordingMessage.classList.remove("is-visible"); // Remove visibility class
    recordingMessage.classList.add("is-hidden"); // Hide the message
  }
}

// Handles the click event for selecting a video source
videoSelectBtn.onclick = async () => {
  try {
    inputSources = await window.electronAPI.getSources(); // Get available screen and window sources

    const videoOptionsMenu = inputSources.map((source) => ({
      label: source.name, // Display name of the source
      id: source.id, // Unique identifier for the source
    }));

    await window.electronAPI.showContextMenu(videoOptionsMenu); // Show a context menu with the source options
  } catch (error) {
    console.error("Error getting sources:", error); // Log any errors that occur
  }
};

// Listens for the user's context menu selection
window.electronAPI.onContextMenuSelection((sourceId) => {
  const selectedSource = inputSources.find((source) => source.id === sourceId); // Find the selected source by its ID
  selectSource(selectedSource); // Call function to handle the source selection
});

// Handles the selection of a video source and sets up the media streams
async function selectSource(source) {
  console.log("Selected source:", source.name); // Log the selected source name

  const screenConstraints = {
    audio: {
      mandatory: {
        chromeMediaSource: "desktop", // Specify desktop as the source of the audio
      },
    },
    video: {
      mandatory: {
        chromeMediaSource: "desktop", // Specify desktop as the source of the video
        chromeMediaSourceId: source.id, // Use the selected source's ID
      },
    },
  };

  const screenStream = await navigator.mediaDevices.getUserMedia(screenConstraints); // Get the screen stream

  const micConstraints = {
    audio: true, // Enable microphone audio
    video: false, // Do not enable video for the microphone
  };

  const micStream = await navigator.mediaDevices.getUserMedia(micConstraints); // Get the microphone stream

  const combinedStream = new MediaStream([
    ...screenStream.getVideoTracks(), // Add video tracks from screen
    ...screenStream.getAudioTracks(), // Add audio tracks from screen
    ...micStream.getAudioTracks(), // Add audio tracks from microphone
  ]);

  videoElement.srcObject = combinedStream; // Set the video element source to the combined stream
  videoElement.muted = true; // Mute the video playback to prevent feedback loop
  videoElement.play(); // Start playing the video

  setupRecorder(combinedStream); // Set up the MediaRecorder to record the combined stream
}

// Sets up the MediaRecorder to record the provided stream
function setupRecorder(stream) {
  recordedChunks = []; // Clear any previous recordings
  mediaRecorder = new MediaRecorder(stream); // Create a new MediaRecorder instance

  // Event listener for when data is available from the MediaRecorder
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data); // Store the recorded video chunk
    }
  };

  // Event listener for when the MediaRecorder stops recording
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/mp4" }); // Create a video blob from the recorded chunks
    const url = URL.createObjectURL(blob); // Create a URL for the blob

    const a = document.createElement("a"); // Create a link element
    a.style.display = "none"; // Hide the link element
    a.href = url; // Set the download URL to the blob URL
    a.download = "recording.mp4"; // Set the default filename for the download
    document.body.appendChild(a); // Add the link to the document
    a.click(); // Simulate a click to download the file
    URL.revokeObjectURL(url); // Revoke the blob URL to free memory
  };
}

// Starts the recording process
startBtn.onclick = () => {
  if (mediaRecorder) {
    mediaRecorder.start(); // Start recording
    console.log("Recording started"); // Log that recording has started
    toggleRecordingMessage(true, "Recording has started..."); // Show the recording message
  }
};

// Stops the recording process
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop(); // Stop recording
    console.log("Recording stopped"); // Log that recording has stopped
    toggleRecordingMessage(false); // Hide the recording message
  }
};
