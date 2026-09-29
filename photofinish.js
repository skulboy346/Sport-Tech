import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cameraFeed = document.getElementById("cameraFeed");
const btnStartCapture = document.getElementById("btnStartCapture");
const btnReviewFrames = document.getElementById("btnReviewFrames");
const resultsContainer = document.getElementById("resultsValidationContainer");
const rankingList = document.getElementById("rankingList");
const btnPublishResults = document.getElementById("btnPublishResults");

let stream = null;

// Request device camera access
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" } // Prioritizes rear track camera
    });
    cameraFeed.srcObject = stream;
  } catch (err) {
    console.error("Camera access denied", err);
    alert("Camera permission is required for the Photo Finish tool.");
  }
}

// Mobile touch controls for capture burst
btnStartCapture.addEventListener("touchstart", (e) => {
  e.preventDefault();
  btnStartCapture.innerText = "📸 Recording Burst...";
});

btnStartCapture.addEventListener("touchend", (e) => {
  e.preventDefault();
  btnStartCapture.classList.add("hidden");
  btnReviewFrames.classList.remove("hidden");
  cameraFeed.pause(); // Freezes frame exactly at the finish line
});

// Fallback for desktop/mouse testing
btnStartCapture.addEventListener("mousedown", () => {
  btnStartCapture.innerText = "📸 Recording Burst...";
});
btnStartCapture.addEventListener("mouseup", () => {
  btnStartCapture.classList.add("hidden");
  btnReviewFrames.classList.remove("hidden");
  cameraFeed.pause();
});

// AI Processing Simulation
btnReviewFrames.addEventListener("click", () => {
  btnReviewFrames.innerText = "Processing Torso Alignment...";
  
  setTimeout(() => {
    btnReviewFrames.classList.add("hidden");
    resultsContainer.classList.remove("hidden");
    loadExpectedAthletes();
  }, 1200);
});

// Load the lineup based on who was checked in at the Call Room
function loadExpectedAthletes() {
  const mockCheckedIn = [
    { name: "Sodiq Awoniyi", lane: 3, team: "Blue House", time: "10.45s", record: "PB, MR" },
    { name: "James Gurosca", lane: 4, team: "Red House", time: "10.58s", record: "" },
    { name: "Jona Rowaini", lane: 5, team: "Green House", time: "10.61s", record: "" }
  ];

  rankingList.innerHTML = "";
  mockCheckedIn.forEach((athlete, index) => {
    const row = document.createElement("div");
    row.className = "athlete-card";
    row.style.marginBottom = "0.5rem";
    row.innerHTML = `
      <div class="athlete-info">
        <h3>${index + 1}. ${athlete.name} (${athlete.time})</h3>
        <p class="text-muted">Lane ${athlete.lane} | ${athlete.team} | ${athlete.record}</p>
      </div>
      <select class="toggle-btn" style="background: var(--surface-dark);">
        <option>Confirmed</option>
        <option>DQ - False Start</option>
        <option>DNF</option>
      </select>
    `;
    rankingList.appendChild(row);
  });
}

btnPublishResults.addEventListener("click", () => {
  alert("Results Verified! Pushing 1st, 2nd, and 3rd place to the Live Medal Table.");
  btnPublishResults.innerText = "Published";
  btnPublishResults.disabled = true;
});

window.addEventListener("load", startCamera);

