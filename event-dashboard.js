// ./scripts/js/event-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

const organizerNameDisplay = document.getElementById('organizerNameDisplay');
const tournamentsGrid = document.getElementById('tournamentsGrid');
const tournamentForm = document.getElementById('tournamentForm');
const btnSaveTournament = document.getElementById('btnSaveTournament');

// --- 1. Authentication Guard ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadOrganizerProfile(user.uid);
    loadTournaments(user.uid);
  } else {
    // Kick unauthenticated users back to the landing page
    window.location.href = "index.html";
  }
});

// --- 2. Load Profile Data ---
async function loadOrganizerProfile(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      organizerNameDisplay.innerText = `Welcome, ${docSnap.data().organization_name}`;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    organizerNameDisplay.innerText = "Dashboard";
  }
}

// --- 3. Tournament Creation ---
tournamentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('tournName').value.trim();
  const slug = document.getElementById('tournSlug').value.trim().toLowerCase().replace(/\s+/g, '-');
  const teamsRaw = document.getElementById('tournTeams').value;
  const teamsArray = teamsRaw.split(',').map(t => t.trim()).filter(t => t);

  btnSaveTournament.innerText = "Deploying...";
  btnSaveTournament.disabled = true;

  try {
    const tournRef = collection(db, "tournaments");
    await addDoc(tournRef, {
      organizer_uid: currentUser.uid,
      name: name,
      public_url_slug: slug,
      teams: teamsArray,
      is_active: true,
      created_at: serverTimestamp()
    });

    document.getElementById('tournamentForm').reset();
    document.getElementById('tournamentModal').classList.add('hidden');
    
  } catch (error) {
    alert("Error creating tournament: " + error.message);
  } finally {
    btnSaveTournament.innerText = "Deploy Tournament Environment";
    btnSaveTournament.disabled = false;
  }
});

// --- 4. Real-time Tournaments Feed ---
function loadTournaments(uid) {
  const q = query(collection(db, "tournaments"), where("organizer_uid", "==", uid));
  
  onSnapshot(q, (snapshot) => {
    tournamentsGrid.innerHTML = "";
    
    if (snapshot.empty) {
      tournamentsGrid.innerHTML = `
        <div class="col-span-full text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
          <p class="text-slate-400 mb-2">No active tournaments found.</p>
          <p class="text-sm text-slate-500">Click '+ New Tournament' to deploy your first event.</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = "bg-sportDark border border-white/10 rounded-xl p-6 flex flex-col hover:border-sportGreen transition-colors";
      
      card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-bold text-white">${data.name}</h3>
          <span class="px-2 py-1 bg-sportGreen/10 text-sportGreen text-xs font-bold rounded uppercase">Live</span>
        </div>
        <p class="text-sm text-slate-400 mb-4">sporttech.app/${data.public_url_slug}</p>
        <div class="mt-auto space-y-2">
         <!-- We pass the Tournament ID in the URL parameter -->
        <div class="mt-auto space-y-2">
          <button onclick="window.location.href='admin.html?tournId=${doc.id}&name=${encodeURIComponent(data.name)}'" class="w-full bg-sportNavy border border-white/10 hover:bg-white/5 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
            Manage Event Operations
          </button>
          
          <!-- New Copy Link Feature -->
          <button onclick="copyPublicLink('${doc.id}', this)" class="w-full text-sportGreen hover:text-emerald-400 text-sm font-semibold py-2 transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            <span>Copy Public Link</span>
          </button>
        </div>

      `;
      tournamentsGrid.appendChild(card);
    });
  });
}

// --- 5. Logout Handling ---
const handleLogout = async () => {
  await signOut(auth);
};
document.getElementById('btnSignOut').addEventListener('click', handleLogout);
if(document.getElementById('btnMobileSignOut')) {
  document.getElementById('btnMobileSignOut').addEventListener('click', handleLogout);
}

// --- 6. Global Function for Copying Public Link ---
window.copyPublicLink = (tournId, buttonElement) => {
  // Construct the full URL based on where the app is currently hosted
  const publicUrl = `${window.location.origin}/live.html?tournId=${tournId}`;
  
  navigator.clipboard.writeText(publicUrl).then(() => {
    // Provide visual feedback
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = `<span class="text-white">✅ Link Copied!</span>`;
    
    setTimeout(() => {
      buttonElement.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy link: ", err);
    alert("Copy failed. Your link is: " + publicUrl);
  });
};


