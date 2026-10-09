import { UserProfile, MedicalRecord, ActiveMedicationReminder } from '../types';

export function exportClinicalSummary(
  user: UserProfile,
  records: MedicalRecord[],
  reminders: ActiveMedicationReminder[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export your medical summary.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Aarogya Clinical Health Summary - ${user.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #0c7c61; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 22px; font-weight: 800; color: #0c7c61; margin: 0; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0c7c61; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 12px; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th { text-align: left; background-color: #f1f5f9; padding: 8px; font-weight: 600; border: 1px solid #e2e8f0; }
    td { padding: 8px; border: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .disclaimer { margin-top: 32px; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 10px; color: #64748b; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Aarogya — Clinical Health Summary</h1>
      <div class="subtitle">AI-Powered Personal Health Copilot · Altrix Labs · FHIR Aligned</div>
    </div>
    <div style="text-align: right;">
      <strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
      <strong>ABHA ID:</strong> ${user.abhaId || '91-1234-5678-9012'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Patient Identification</div>
    <table>
      <tr>
        <th width="25%">Full Name</th>
        <td width="25%"><strong>${user.name}</strong></td>
        <th width="25%">Date of Birth / Age</th>
        <td width="25%">${user.dob || '14/05/1998'} (${user.age} yrs)</td>
      </tr>
      <tr>
        <th>Blood Group</th>
        <td><strong style="color: #dc2626;">${user.bloodGroup || 'O+'}</strong></td>
        <th>Gender</th>
        <td>${user.gender.toUpperCase()}</td>
      </tr>
      <tr>
        <th>Location</th>
        <td>${user.location}</td>
        <th>Emergency Contact</th>
        <td>${user.emergencyContact}</td>
      </tr>
      <tr>
        <th>Known Allergies</th>
        <td><strong style="color: #dc2626;">${user.allergies.join(', ') || 'None recorded'}</strong></td>
        <th>Chronic Conditions</th>
        <td>${user.conditions.join(', ') || 'None recorded'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Active Prescribed Medications</div>
    <table>
      <thead>
        <tr>
          <th>Medicine Name</th>
          <th>Dosage Form</th>
          <th>Schedule</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${reminders.map(m => `
          <tr>
            <td><strong>${m.medicineName}</strong></td>
            <td>${m.dosage}</td>
            <td>${m.timeSlot} (${m.slotName})</td>
            <td>${m.instructions || 'As directed by physician'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Recent Clinical Encounters & Laboratory Records</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Document Type</th>
          <th>Facility / Clinician</th>
          <th>Summary / Findings</th>
        </tr>
      </thead>
      <tbody>
        ${records.map(r => `
          <tr>
            <td><strong>${r.visitDate}</strong></td>
            <td>${r.documentType}</td>
            <td>${r.doctorName} (${r.facilityName})</td>
            <td>${r.aiSummary.en}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="disclaimer">
    <strong>Clinical Notice:</strong> This summary is generated from patient-authorized uploaded records organized by Aarogya Personal Health Copilot. It is intended for informational reference during clinical consultation and does not substitute for original signed diagnostic reports.
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
