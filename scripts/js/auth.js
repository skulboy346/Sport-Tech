// ./scripts/js/auth.js
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
import { firebaseConfig } from "./config.js";

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. DOM Elements (using let so missing elements don't crash the script)
const authForm = document.getElementById('authForm');
const btnGoogleAuth = document.getElementById('btnGoogleAuth');
const btnPhoneAuth = document.getElementById('btnPhoneAuth');

// --- Centralized User Profile Creation ---
async function saveOrganizerProfile(user, orgName = "Independent Organizer") {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  
  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || user.phoneNumber || "",
      organization_name: orgName,
      role: "organizer",
      token_balance: 0,
      created_at: new Date().toISOString()
    });
  }
  // Route to the dashboard upon successful profile creation/verification
  window.location.href = "event-dashboard.html";
}

// --- Catch Google Mobile Redirect ---
// This runs automatically when the page loads, catching users returning from Google's native login
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    await saveOrganizerProfile(result.user, "Independent Organizer");
  }
}).catch((error) => {
  console.error("Google Sign-In Redirect Error: ", error.message);
});

// --- Email & Password Auth ---
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Safely check if the Org Name field exists on this specific form
    const orgNameInput = document.getElementById('orgName');
    const orgName = orgNameInput && orgNameInput.value ? orgNameInput.value : "Independent Organizer";
    const isSignUp = !!orgNameInput; 

    try {
      if (isSignUp) {
        // Attempt to create a new account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveOrganizerProfile(userCredential.user, orgName);
      } else {
        // Attempt to log in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "event-dashboard.html";
      }
    } catch (error) {
      // Smart Fallback: If sign-up fails because they already have an account, automatically log them in
      if (error.code === 'auth/email-already-in-use') {
         try {
           const userCredential = await signInWithEmailAndPassword(auth, email, password);
           window.location.href = "event-dashboard.html";
         } catch(signInError) {
           alert("Login failed: " + signInError.message);
         }
      } else {
        alert("Authentication Error: " + error.message);
      }
    }
  });
}

// --- Google Sign-In (Mobile Friendly Redirect) ---
if (btnGoogleAuth) {
  btnGoogleAuth.addEventListener('click', (e) => {
    e.preventDefault(); 
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  });
}

// --- Phone Number OTP Auth ---
function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    // Note: You must add an empty <div id="recaptcha-container"></div> to your HTML modal for this to work
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }
}

if (btnPhoneAuth) {
  btnPhoneAuth.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      setupRecaptcha();
      const phoneNumber = prompt("Enter your phone number with country code (e.g., +234...):");
      if (!phoneNumber) return;

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      const otpCode = prompt("Enter the 6-digit verification code sent via SMS:");
      
      if (otpCode) {
        const userCredential = await confirmationResult.confirm(otpCode);
        await saveOrganizerProfile(userCredential.user);
      }
    } catch (error) {
      alert("Phone Authentication Failed: " + error.message);
      // Reset recaptcha so they can try again if they fail
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          grecaptcha.reset(widgetId);
        });
      }
    }
  });
}
