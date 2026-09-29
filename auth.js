// ./scripts/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authForm = document.getElementById('authForm');
const btnGoogleAuth = document.getElementById('btnGoogleAuth');
const btnPhoneAuth = document.getElementById('btnPhoneAuth');

// --- 1. Centralized User Profile Creation ---
async function saveOrganizerProfile(user, orgName = "Independent Organizer") {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);
  
  // Only create if it doesn't exist to avoid overwriting existing data
  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || user.phoneNumber,
      organization_name: orgName,
      role: "organizer",
      token_balance: 0,
      created_at: new Date().toISOString()
    });
  }
  // Route to the dashboard
  window.location.href = "event-dashboard.html";
}

// --- 2. Email & Password Auth ---
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const orgName = document.getElementById('orgName').value || "Independent Organizer";
  
  try {
    if (isSignUp) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await saveOrganizerProfile(userCredential.user, orgName);
    } else {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "event-dashboard.html";
    }
  } catch (error) {
    alert("Authentication Error: " + error.message);
  }
});

// --- 3. Google Sign-In ---
btnGoogleAuth.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    await saveOrganizerProfile(userCredential.user);
  } catch (error) {
    alert("Google Sign-In Failed: " + error.message);
  }
});

// --- 4. Phone Number OTP Auth ---
// Initializes the invisible reCAPTCHA verifier
function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }
}

btnPhoneAuth.addEventListener('click', async () => {
  setupRecaptcha();
  const phoneNumber = prompt("Enter your phone number with country code (e.g., +234...):");
  
  if (!phoneNumber) return;

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    const otpCode = prompt("Enter the 6-digit verification code sent via SMS:");
    
    if (otpCode) {
      const userCredential = await confirmationResult.confirm(otpCode);
      await saveOrganizerProfile(userCredential.user);
    }
  } catch (error) {
    alert("Phone Authentication Failed: " + error.message);
    // Reset recaptcha if failed so they can try again
    if(window.recaptchaVerifier) {
      window.recaptchaVerifier.render().then(widgetId => {
        grecaptcha.reset(widgetId);
      });
    }
  }
});
