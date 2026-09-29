// ./scripts/js/pdf-export.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const btnDownloadRecord = document.getElementById('btnDownloadRecord');

btnDownloadRecord.addEventListener('click', async () => {
  btnDownloadRecord.innerText = "Generating PDF...";
  btnDownloadRecord.disabled = true;

  try {
    // 1. Fetch concluded event data from Firebase
    const entriesRef = collection(db, "event_entries");
    const q = query(
      entriesRef, 
      where("race_id", "==", "race_100m_senior_boys_heat_1"),
      orderBy("finish_rank", "asc")
    );
    
    const snapshot = await getDocs(q);
    const tableData = [];

    // Format the database records into rows for the PDF table[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)
    snapshot.forEach((doc) => {
      const data = doc.data();
      if(data.finish_rank) {
        tableData.push([
          data.finish_rank,
          data.lane_assignment,
          data.athlete_name,
          data.team_name,
          data.status === 'checked_in' ? 'Finished' : data.status.toUpperCase()
        ]);
      }
    });

    // 2. Initialize jsPDF[span_8](start_span)[span_8](end_span)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // 3. Draw Document Header[span_9](start_span)[span_9](end_span)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("OFFICIAL RECORD SHEET", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Event: 100m Senior Boys - Final", 14, 35);
    doc.text("Tournament: Fresher's Cup 2026", 14, 42);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 49);

    // 4. Inject the AutoTable[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)
    doc.autoTable({
      startY: 55,
      head: [['Rank', 'Lane', 'Athlete Name', 'House/Team', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // SportTech Navy Blue
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // 5. Draw the Signature Blocks at the bottom[span_12](start_span)[span_12](end_span)
    const finalY = doc.lastAutoTable.finalY || 100; // Get the Y position where the table ended
    
    doc.setDrawColor(0);
    // Event Referee Signature Line[span_13](start_span)[span_13](end_span)
    doc.line(20, finalY + 40, 80, finalY + 40);
    doc.text("Event Referee", 35, finalY + 47);

    // Sports Director Signature Line[span_14](start_span)[span_14](end_span)
    doc.line(130, finalY + 40, 190, finalY + 40);
    doc.text("Sports Director", 142, finalY + 47);

    // 6. Trigger File Download[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)
    doc.save("100m_Senior_Boys_Final_Record.pdf");

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to fetch data for PDF.");
  } finally {
    btnDownloadRecord.innerText = "📄 Download PDF Record Sheet";
    btnDownloadRecord.disabled = false;
  }
});


