/**
 * Receipt & Messaging Deep-Link Formatters
 */

export function formatWhatsAppReceipt(bori = {}, shopName = 'Vanshu Atta Chakki') {
  const text = `*${shopName} — Receipt*\n\n` +
    `Grahak: *${bori.customerName || 'Customer'}*\n` +
    `Grain: ${bori.inputWeight || 0} kg ${bori.grainType || 'Milling'}\n` +
    `Rakam: ₹${bori.amount || 0}\n` +
    `Status: ${bori.paymentMode === 'credit' ? 'Udhar' : 'Nokad Paid'}\n\n` +
    `Chakkibook digital ledger receipt. Dhanyawad!`;

  const phone = bori.customerPhone ? bori.customerPhone.replace(/\D/g, '') : '';
  return phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function formatWhatsAppReminder(customer = {}, templateType = 'polite', shopName = 'Vanshu Atta Chakki') {
  const name = customer.name || 'Grahak';
  const balance = customer.balance || 0;

  let text = '';
  if (templateType === 'urgent') {
    text = `*${shopName} — DUES REMINDER (URGENT)*\n\nNamaste ${name} ji,\nAapka ₹${balance} ka bakaya chal raha hai. Kripya jald se jald jama karayein.`;
  } else if (templateType === 'detailed') {
    text = `*${shopName} — HISAB SUMMARY*\n\nNamaste ${name} ji,\nAapke khate mein kul ₹${balance} bakaya baki hai. Kisi bhi sawal ke liye dukaan par sampark karein.`;
  } else {
    text = `*${shopName} — REMINDER*\n\nNamaste ${name} ji,\nAapka ₹${balance} ka hisab baki hai. Jab time mile jama karwa dein. Dhanyawad!`;
  }

  const phone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  return phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
