// ./scripts/js/auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  GoogleAuthProvider, signInWithRedirect, getRedirectResult, 
  RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1zozSx_Ox4uf3IN8zBN0dKE--rpIohgU",
  authDomain: "sportteach-web.firebaseapp.com",
  projectId: "sportteach-web",
  storageBucket: "sportteach-web.firebasestorage.app",
  messagingSenderId: "155474289568",
  appId: "1:155474289568:web:7248149d14dd63e35a3ac5",
  measurementId: "G-B30EZQ1EEP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let confirmationResultGlobal = null; 

// ==========================================
// CODE STUDIO SAFE TRAFFIC CONTROLLER
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentPath = window.location.pathname.toLowerCase();

        // ONLY execute routing if the user is sitting on the index (login) page.
        // This prevents infinite loops in local mobile file systems.
        if (currentPath.endsWith("index.html") || currentPath.endsWith("/")) {
          if (!userData.profileComplete) {
            window.location.replace("./onboarding.html");
          } else if (userData.role === 'admin') {
            window.location.replace("./admin.html");
          } else if (userData.role === 'organizer') {
            window.location.replace("./event-dashboard.html");
          } else {
            // Fan stays on index feed
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.classList.add('hidden');
          }
        } else {
          // If they are on any other page, just hide the auth modal if it exists
          const authModal = document.getElementById('authModal');
          if (authModal) authModal.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error("Routing error:", error);
    }
  } else {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('hidden');
  }
});


async function saveUserProfile(user, role, orgName = "", username = "") {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  
  if (!docSnap.exists()) {
    const isVerified = role === 'fan' ? true : false;
    const status = role === 'fan' ? 'active' : 'pending';
    
    const finalUsername = username || "user_" + user.uid.substring(0, 8);
    const finalBrandName = orgName || "Independent Entity";

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || user.phoneNumber || "",
      role: role,
      username: finalUsername.toLowerCase().replace(/\s+/g, ''),
      brand_name: role === 'organizer' ? finalBrandName : "",
      isVerified: isVerified,
      accountStatus: status,
      termsAccepted: true,
      profileComplete: false, 
      followers_count: 0,
      following_count: 0,
      privacy_settings: { profile_visibility: 'public', allow_messages: true, show_contact_info: false },
      created_at: new Date().toISOString()
    });
  }
  
  window.location.replace("./onboarding.html");
}

// Google Auth Redirect Catcher
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    const role = document.getElementById('selectedRole') ? document.getElementById('selectedRole').value : 'fan';
    const orgName = document.getElementById('orgName') ? document.getElementById('orgName').value : '';
    const username = document.getElementById('username') ? document.getElementById('username').value : '';
    await saveUserProfile(result.user, role, orgName, username);
  }
}).catch((error) => {
  if (error.code !== 'auth/redirect-cancelled-by-user') alert("Google Sign-In Error: " + error.message);
});

document.addEventListener('click', async (e) => {
  // Google Auth Trigger
  if (e.target.closest('#btnGoogleAuth')) {
    e.preventDefault();
    const mode = document.getElementById('authMode') ? document.getElementById('authMode').value : 'signup';
    const termsChecked = document.getElementById('termsCheck') ? document.getElementById('termsCheck').checked : false;
    
    if (mode === 'signup' && !termsChecked) {
      alert("You must agree to the Terms of Service to create an account.");
      return;
    }
    signInWithRedirect(auth, new GoogleAuthProvider());
  }
});

// Email/Password Form Submission
document.addEventListener('submit', async (e) => {
  if (e.target.id === 'authForm') {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const authMode = document.getElementById('authMode') ? document.getElementById('authMode').value : 'signup';
    
    const roleInput = document.getElementById('selectedRole');
    const role = roleInput ? roleInput.value : 'fan';
    const orgNameInput = document.getElementById('orgName');
    const orgName = orgNameInput && orgNameInput.value ? orgNameInput.value : "";
    const usernameInput = document.getElementById('username');
    const username = usernameInput && usernameInput.value ? usernameInput.value : "";
    const termsChecked = document.getElementById('termsCheck') ? document.getElementById('termsCheck').checked : false;

    if (authMode === 'signup' && !termsChecked) {
      alert("You must agree to the Terms of Service.");
      return;
    }

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserProfile(userCredential.user, role, orgName, username);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Authentication Error: " + error.message);
    }
  }
});
