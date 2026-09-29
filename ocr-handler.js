// ./scripts/js/ocr-handler.js
import { cloudinaryConfig } from './config.js';

const btnSnap = document.getElementById('btnSnapRoster');
const fileInput = document.getElementById('rosterImageInput');
const progressText = document.getElementById('ocrProgress');
const athleteContainer = document.getElementById('athleteListContainer');

// Listen directly for when the camera saves the photo
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Update UI to show processing state
  btnSnap.classList.add('hidden');
  progressText.classList.remove('hidden');
  progressText.innerText = "Uploading roster to Cloudinary...";

  // Prepare payload for Cloudinary API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);

  try {
    // Post image to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    progressText.innerText = "Running AI Text Extraction...";
    
    // Simulate OCR processing time and mapping
    setTimeout(() => {
      progressText.classList.add('hidden');
      btnSnap.classList.remove('hidden');
      btnSnap.innerHTML = "📷 Scan Another Roster";
      
      // Inject extracted data into an editable review table
      renderEditableValidation(data.secure_url);
    }, 1500);

  } catch (error) {
    console.error("Upload failed:", error);
    progressText.innerText = "Error uploading image. Try again.";
    setTimeout(() => {
      progressText.classList.add('hidden');
      btnSnap.classList.remove('hidden');
    }, 3000);
  }
});

function renderEditableValidation(imageUrl) {
  const validationCard = document.createElement('div');
  validationCard.className = 'athlete-card';
  validationCard.style.flexDirection = 'column';
  validationCard.style.alignItems = 'flex-start';
  validationCard.style.border = '2px solid var(--accent-amber)';
  
  validationCard.innerHTML = `
    <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 10px;">
      <h3 style="color: var(--accent-amber);">Review Extracted Data</h3>
      <a href="${imageUrl}" target="_blank" style="color: var(--accent-green); font-size: 0.85rem;">View Source Image</a>
    </div>
    
    <div style="width: 100%; margin-bottom: 10px;">
      <label class="text-muted">Athlete Name</label>
      <input type="text" value="Detected Name (Edit Me)" style="width: 100%; padding: 8px; margin-top: 4px; background: var(--primary-navy); color: white; border: 1px solid var(--border-color); border-radius: 4px;">
    </div>

    <div style="width: 100%; margin-bottom: 10px;">
      <label class="text-muted">Assigned Team/House</label>
      <input type="text" value="Detected Team" style="width: 100%; padding: 8px; margin-top: 4px; background: var(--primary-navy); color: white; border: 1px solid var(--border-color); border-radius: 4px;">
    </div>
    
    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;">💾 Save to Database</button>
  `;
  
  // Insert at the top of the list
  athleteContainer.prepend(validationCard);
}
