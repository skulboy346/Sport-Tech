// ./scripts/js/auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  GoogleAuthProvider, signInWithRedirect, getRedirectResult, 
  RecaptchaVerifier, signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1zozSx_Ox4uf3IN8zBNOdKE--rpIohgU",
  authDomain: "sportteach-web.firebaseapp.com",
  projectId: "sportteach-web",
  storageBucket: "sportteach-web.firebasestorage.app",
  messagingSenderId: "155474289568",
  appId: "1:155474289568:web:7248149d14dd63e35a3ac5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// Catch users returning from Google
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    await saveOrganizerProfile(result.user, "Independent Organizer");
  }
}).catch((error) => {
  if (error.code !== 'auth/redirect-cancelled-by-user') {
    alert("Google Sign-In Error: " + error.message);
  }
});

// --- BULLETPROOF EVENT DELEGATION ---
// This forces the clicks to register regardless of HTML structure
document.addEventListener('click', (e) => {
  
  // 1. Google Button
  if (e.target.closest('#btnGoogleAuth')) {
    e.preventDefault();
    alert("Google Click Registered! Redirecting to Firebase..."); // Proof of life
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  }

  // 2. Phone Button
  if (e.target.closest('#btnPhoneAuth')) {
    e.preventDefault();
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {'size': 'invisible'});
    }
    const phoneNumber = prompt("Enter phone number with country code (e.g., +234...):");
    if (phoneNumber) {
      signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
        .then(async (confirmationResult) => {
          const otpCode = prompt("Enter the 6-digit verification code sent to you:");
          if (otpCode) {
            const userCredential = await confirmationResult.confirm(otpCode);
            await saveOrganizerProfile(userCredential.user);
          }
        }).catch((error) => alert("Phone Authentication Error: " + error.message));
    }
  }
});

// 3. Form Submission Delegation
document.addEventListener('submit', async (e) => {
  if (e.target.id === 'authForm') {
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
  }
});
