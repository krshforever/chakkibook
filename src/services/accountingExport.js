/**
 * Chakkibook Enterprise Accounting Export Service
 * Generates Tally XML format & Zoho Books CSV exports for seamless integration
 * with standard accounting software.
 */

export function exportToTallyXML(customers = [], boris = []) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>Vouchers</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

  boris.forEach((b) => {
    xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
    xml += `          <VOUCHER VCHTYPE="Sales" ACTION="Create">\n`;
    xml += `            <DATE>${(b.dropOffDate || b.createdAt || '').slice(0, 10).replace(/-/g, '')}</DATE>\n`;
    xml += `            <NARRATION>Chakkibook Pisai ${b.grainType} (${b.inputWeight}kg) - ${b.customerName}</NARRATION>\n`;
    xml += `            <PARTYLEDGERNAME>${b.customerName}</PARTYLEDGERNAME>\n`;
    xml += `            <AMOUNT>-${b.amount || 0}</AMOUNT>\n`;
    xml += `          </VOUCHER>\n`;
    xml += `        </TALLYMESSAGE>\n`;
  });

  xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;
  return xml;
}

export function exportToZohoCSV(customers = [], boris = []) {
  let csv = 'Customer Name,Date,Transaction Type,Grain Type,Weight (kg),Amount (INR),Payment Mode,Status\n';

  boris.forEach((b) => {
    const dateStr = (b.dropOffDate || b.createdAt || '').slice(0, 10);
    csv += `"${b.customerName}","${dateStr}","${b.mode === 'chakki' ? 'Pisai' : 'Pirai'}","${b.grainType || 'Gehun'}",${b.inputWeight || 0},${b.amount || 0},"${b.paymentMode || 'credit'}","${b.status || 'pending'}"\n`;
  });

  return csv;
}

export function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
