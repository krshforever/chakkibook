/**
 * Chakkibook Automated WhatsApp & SMS Reminders Engine
 * Schedules polite & firm debt recovery notifications based on balance threshold
 * and days since last visit.
 */

export function getScheduledReminders(customers = [], boris = []) {
  const now = new Date();
  const reminders = [];

  customers.forEach((cust) => {
    const balance = Number(cust.balance || 0);
    if (balance <= 0) return;

    const custBoris = boris.filter((b) => b.customerId === cust.id || b.customerName === cust.name);
    const lastVisitMs = custBoris.length > 0
      ? Math.max(...custBoris.map((b) => new Date(b.createdAt || b.dropOffDate).getTime()))
      : now.getTime() - 14 * 86400000;

    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisitMs) / 86400000);

    let priority = 'normal';
    let template = 'polite';
    let message = `Ram Ram ${cust.name} ji, aapka ₹${balance} baki hai. Kripya samay par jama karayein.`;

    if (balance > 1000 || daysSinceLastVisit > 15) {
      priority = 'high';
      template = 'firm';
      message = `Hello ${cust.name}, aapka ₹${balance} udhar ${daysSinceLastVisit} din se baki hai. Kripya aaj hi clear karein.`;
    }

    reminders.push({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      village: cust.village,
      balance,
      daysSinceLastVisit,
      priority,
      template,
      message
    });
  });

  return reminders.sort((a, b) => b.balance - a.balance);
}

export function sendWhatsAppReminder(phone, message) {
  if (!phone) return;
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
  const encodedText = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
}
