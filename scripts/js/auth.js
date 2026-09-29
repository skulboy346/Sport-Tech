// ./scripts/js/auth.js

// 1. Import Firebase directly from the web
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Hardcode the config here so it NEVER fails to import
const firebaseConfig = {
  apiKey: "AIzaSyC1zozSx_Ox4uf3IN8zBNOdKE--rpIohgU",
  authDomain: "sportteach-web.firebaseapp.com",
  projectId: "sportteach-web",
  storageBucket: "sportteach-web.firebasestorage.app",
  messagingSenderId: "155474289568",
  appId: "1:155474289568:web:7248149d14dd63e35a3ac5"
};

// 3. Initialize App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. Mobile Debugger - THIS WILL POP UP IF THE SCRIPT LOADS SUCCESSFULLY
alert("SportTech Auth System Connected!");

// 5. Connect Buttons
const authForm = document.getElementById('authForm');
const btnGoogleAuth = document.getElementById('btnGoogleAuth');
const btnPhoneAuth = document.getElementById('btnPhoneAuth');

// --- Profile Builder ---
async function saveOrganizerProfile(user, orgName = "Independent Organizer") {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || user.phoneNumber || "",
      organization_name: orgName,
      role: "organizer",
      created_at: new Date().toISOString()
    });
  }
  window.location.href = "event-dashboard.html";
}

// --- Catch Google Mobile Redirect ---
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    await saveOrganizerProfile(result.user, "Independent Organizer");
  }
}).catch((error) => {
  if (error.code !== 'auth/redirect-cancelled-by-user') {
    alert("Google Sign-In Error: " + error.message);
  }
});

// --- Google Button Logic ---
if (btnGoogleAuth) {
  btnGoogleAuth.addEventListener('click', (e) => {
    e.preventDefault(); 
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  });
}

// --- Email Form Logic ---
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const authMode = document.getElementById('authMode') ? document.getElementById('authMode').value : 'signup';
    const orgNameInput = document.getElementById('orgName');
    const orgName = orgNameInput && orgNameInput.value ? orgNameInput.value : "Independent Organizer";

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveOrganizerProfile(userCredential.user, orgName);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "event-dashboard.html";
      }
    } catch (error) {
      alert("Authentication Error: " + error.message);
    }
  });
}
