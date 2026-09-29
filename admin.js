// ./scripts/js/admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, where, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. URL Parameter Extraction & Security Routing ---
const urlParams = new URLSearchParams(window.location.search);
const activeTournamentId = urlParams.get('tournId');
const activeTournamentName = urlParams.get('name');

// If no tournament ID is present in the URL, redirect back to the dashboard
if (!activeTournamentId) {
  window.location.href = "event-dashboard.html";
}

// Update the DOM to reflect the active tournament
document.getElementById('activeTournamentName').innerText = activeTournamentName || "Tournament Active";

// --- 2. Filtered Analytics Queries ---
const statAthletes = document.getElementById('statAthletes');
const statTeams = document.getElementById('statTeams');
const statConcluded = document.getElementById('statConcluded');
const tokenToggle = document.getElementById('tokenToggle');

// Filter the event_entries collection to ONLY pull data for this specific tournament
const entriesRef = collection(db, "event_entries");
const filteredEntriesQuery = query(entriesRef, where("tournament_id", "==", activeTournamentId));

onSnapshot(filteredEntriesQuery, (snapshot) => {
  const uniqueAthletes = new Set();
  const uniqueTeams = new Set();
  let concludedCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    uniqueAthletes.add(data.athlete_name);
    uniqueTeams.add(data.team_name);
    
    if (data.finish_rank) {
      concludedCount++;
    }
  });

  statAthletes.innerText = uniqueAthletes.size;
  statTeams.innerText = uniqueTeams.size;
  statConcluded.innerText = Math.floor(concludedCount / 8) || concludedCount; 
});

// --- 3. Filtered Event Creation Modal ---
const btnCreateEvent = document.getElementById('btnCreateEvent');
const createEventModal = document.getElementById('createEventModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnSaveEvent = document.getElementById('btnSaveEvent');

const inputEventName = document.getElementById('inputEventName');
const inputEventCategory = document.getElementById('inputEventCategory');
const inputTeams = document.getElementById('inputTeams');

btnCreateEvent.addEventListener('click', () => createEventModal.classList.remove('hidden'));
btnCloseModal.addEventListener('click', () => createEventModal.classList.add('hidden'));

btnSaveEvent.addEventListener('click', async () => {
  const eventName = inputEventName.value.trim();
  const category = inputEventCategory.value;
  const teams = inputTeams.value.split(',').map(team => team.trim()).filter(team => team);

  if (!eventName || teams.length === 0) {
    alert("Please provide an event name and at least one participating team.");
    return;
  }

  btnSaveEvent.innerText = "Saving...";
  btnSaveEvent.disabled = true;

  try {
    const scheduledRef = collection(db, "scheduled_events");
    await addDoc(scheduledRef, {
      tournament_id: activeTournamentId, // Links this new event to the URL parameter ID
      event_name: eventName,
      category: category,
      participating_teams: teams,
      status: "scheduled",
      created_at: new Date().toISOString()
    });

    alert(`${eventName} has been scheduled for ${activeTournamentName}!`);
    inputEventName.value = "";
    inputTeams.value = "";
    createEventModal.classList.add('hidden');
    
  } catch (error) {
    console.error("Error scheduling event: ", error);
    alert("Failed to save event. Check connection.");
  } finally {
    btnSaveEvent.innerText = "💾 Save Event Schedule";
    btnSaveEvent.disabled = false;
  }
});
