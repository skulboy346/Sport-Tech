// js/callroom.js

// Direct configuration to avoid local file module import errors
const firebaseConfig = {
  apiKey: "AIzaSyC1zozSx_Ox4uf3IN8zBN0dKE--rpIohgU",
  authDomain: "sportteach-web.firebaseapp.com",
  projectId: "sportteach-web",
  storageBucket: "sportteach-web.firebasestorage.app",
  messagingSenderId: "155474289568",
  appId: "1:155474289568:web:7248149d14dd63e35a3ac5",
  measurementId: "G-B30EZQ1EEP"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const currentRaceId = "race_100m_senior_boys_heat_1";
const athleteContainer = document.getElementById("athleteListContainer");
const networkStatus = document.getElementById("networkStatus");

// Real-Time Listener
db.collection("event_entries")
  .where("race_id", "==", currentRaceId)
  .onSnapshot(
    (snapshot) => {
      networkStatus.innerText = "Online";
      networkStatus.style.color = "var(--accent-green)";

      if (snapshot.empty) {
        athleteContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--surface-dark); border-radius: 8px;">
            No athletes found for this heat.<br>
            Add an entry in the Firestore console under 'event_entries'.
          </div>
        `;
        return;
      }

      athleteContainer.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        renderAthleteRow(docSnap.id, data);
      });
    },
    (error) => {
      console.error("Firestore error:", error);
      networkStatus.innerText = "Offline / Error";
      networkStatus.style.color = "var(--accent-red)";
      athleteContainer.innerHTML = `
        <div style="color: var(--accent-red); padding: 1rem; text-align: center;">
          Database connection failed: ${error.message}
        </div>
      `;
    }
  );

function renderAthleteRow(id, entry) {
  const card = document.createElement("div");
  card.className = "athlete-card";
  card.innerHTML = `
    <div class="athlete-info">
      <h3>${entry.athlete_name || "Unknown Athlete"}</h3>
      <p class="text-muted">Lane ${entry.lane_assignment || "-"} | ${entry.team_name || "No Team"}</p>
    </div>
    <div class="toggle-group">
      <button class="toggle-btn ${entry.status === 'checked_in' ? 'active-checkin' : ''}" 
              data-id="${id}" data-action="checked_in">Check-In</button>
      <button class="toggle-btn ${entry.status === 'dns' ? 'badge-dns' : ''}" 
              data-id="${id}" data-action="dns">DNS</button>
      <button class="toggle-btn ${entry.status === 'dq' ? 'badge-dq' : ''}" 
              data-id="${id}" data-action="dq">DQ</button>
    </div>
  `;
  athleteContainer.appendChild(card);
}

// Button click handling
athleteContainer.addEventListener("click", async (e) => {
  if (e.target.tagName === "BUTTON") {
    const docId = e.target.getAttribute("data-id");
    const newStatus = e.target.getAttribute("data-action");

    try {
      await db.collection("event_entries").doc(docId).update({
        status: newStatus
      });
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  }
});
