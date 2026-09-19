// Native Android & Web SMS Service Layer

// SMS Templates (Hinglish)
export const templates = {
  dropOff: (shopName, customerName, grainType, weight) =>
    `🌾 ${shopName}: ${customerName} ji, aapki ${weight}kg ${grainType} bori jama ho gayi hai. Pisai/pirai hone par SMS aayega. Dhanyawad!`,
  
  done: (shopName, customerName, grainType, weight, outputWeight) =>
    `✅ ${shopName}: ${customerName} ji, aapki ${weight}kg ${grainType} ki pisai/pirai ho gayi hai. ${outputWeight ? `Atta/Tel: ${outputWeight} ` : ''}Kripya le jaayein. Dhanyawad!`,
  
  pickedUp: (shopName, customerName, amount, paymentMode) =>
    `🧾 ${shopName}: ${customerName} ji, aapka maal deliver ho gaya. Bill: ₹${amount} (${paymentMode}). Dhanyawad! 🙏`
};

export const sendBoriSMS = async (event, boriData, shopName = 'Chakkibook', smsSettings = {}) => {
  // Check if SMS sending is enabled globally and for this event
  if (smsSettings.enabled === false) return;
  if (smsSettings[event] === false) return;

  const phone = boriData.customerPhone || boriData.phone;
  if (!phone) {
    console.log('SMS Skipped: Customer phone number missing');
    return;
  }

  const templateFn = templates[event];
  if (!templateFn) return;

  const customerName = boriData.customerName || 'Grahak';
  const grainType = boriData.grainType || 'Grain';
  const weight = boriData.inputWeight || 0;
  const outputWeight = boriData.outputWeight ? `${boriData.outputWeight}kg` : (boriData.oilOutput ? `${boriData.oilOutput}L Tel` : '');
  const amount = boriData.amount || 0;
  const paymentMode = boriData.paymentMode === 'cash' ? 'Nokad' : (boriData.paymentMode === 'upi' ? 'UPI' : 'Udhar');

  const message = templateFn(shopName, customerName, grainType, weight, outputWeight, amount, paymentMode);

  try {
    // Android / iOS / Web Native SMS Intent trigger fallback
    const encodedMsg = encodeURIComponent(message);
    const smsUrl = `sms:${phone}?body=${encodedMsg}`;
    
    // We log and trigger URL dispatch
    console.log(`[SMS Triggered] Event: ${event} | To: ${phone} | Body: ${message}`);
    
    // Open native SMS composer window on Android
    if (typeof window !== 'undefined') {
      window.location.href = smsUrl;
    }
  } catch (err) {
    console.warn('SMS intent dispatch failed:', err);
  }
};
