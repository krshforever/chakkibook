/**
 * Chakkibook Autonomous In-App AI Agent Service
 * Parses natural language input (Hinglish/Hindi/English) and executes actions directly on the app store.
 */

export async function processAICommand(userInput, store) {
  const text = userInput.trim().toLowerCase();
  
  if (!text) {
    return {
      reply: 'Kripya koi command dein (e.g. "Ramesh ki 50kg gehun bori jama karo" ya "aaj ka summary batao").',
      actionExecuted: null,
      success: false
    };
  }

  const {
    customers = [],
    boris = [],
    inventory = [],
    expenses = [],
    shop = {},
    addBori,
    markBoriDone,
    markBoriPickedUp,
    addCustomer,
    updateShopRates,
    addExpense,
    updateStock,
    addInventoryItem
  } = store;

  // -------------------------------------------------------------
  // ACTION 1: Business Summary & Today's Hisab
  // -------------------------------------------------------------
  if (
    text.includes('summary') || 
    text.includes('hisab') || 
    text.includes('kamai') || 
    text.includes('kitna hua') || 
    text.includes('report') ||
    text.includes('dashboard')
  ) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBoris = boris.filter(b => (b.createdAt || b.doneDate || '').startsWith(todayStr));
    const doneBoris = todayBoris.filter(b => b.status === 'done' || b.status === 'picked_up');
    const pendingBoris = boris.filter(b => b.status === 'pending');
    
    const totalWeight = doneBoris.reduce((acc, b) => acc + (Number(b.inputWeight) || 0), 0);
    const totalIncome = doneBoris.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
    const totalUdhar = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
    const todayExpenses = expenses
      .filter(e => (e.date || '').startsWith(todayStr))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const netProfit = totalIncome - todayExpenses;

    const replyText = 
      `📊 *Chakki AI Business Executive Report*\n\n` +
      `• *Aaj Ki Milling (Pisai/Pirai):* ${totalWeight} kg\n` +
      `• *Gross Income (Kamai):* ₹${totalIncome}\n` +
      `• *Aaj Ke Kharche (Expenses):* ₹${todayExpenses}\n` +
      `• *Net Profit (Shuddh Munafa):* ₹${netProfit}\n` +
      `• *Pending Queue:* ${pendingBoris.length} boris waiting\n` +
      `• *Kul Bakaya Udhar (Dues):* ₹${totalUdhar}\n\n` +
      `💡 *AI Recommendation:* ${pendingBoris.length > 3 ? 'Queue lambi hai, speed badhayein!' : 'Subah ka workflow smooth hai.'}`;

    return {
      reply: replyText,
      actionExecuted: {
        type: 'BUSINESS_SUMMARY',
        details: 'Analysed real-time shop stats & P&L',
        payload: { totalWeight, totalIncome, netProfit, pendingCount: pendingBoris.length }
      },
      success: true
    };
  }

  // -------------------------------------------------------------
  // ACTION 2: Udhar & Credit Check / Outstanding Dues
  // -------------------------------------------------------------
  if (text.includes('udhar') || text.includes('dues') || text.includes('balance') || text.includes('bakaya')) {
    const udharCustomers = [...customers]
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    if (udharCustomers.length === 0) {
      return {
        reply: '🎉 Badhai ho! Kisi bhi grahak ka udhar bakaya nahi hai. Sabhi account clear hain!',
        actionExecuted: { type: 'UDHAR_CHECK', details: 'Checked customer balances: 0 dues' },
        success: true
      };
    }

    const top3 = udharCustomers.slice(0, 5).map((c, i) => `${i + 1}. *${c.name}* (${c.village || 'Gaon'}): ₹${c.balance}`).join('\n');
    const totalDues = udharCustomers.reduce((sum, c) => sum + c.balance, 0);

    return {
      reply: `⚠️ *Kul Bakaya Udhar: ₹${totalDues}* (${udharCustomers.length} Grahak)\n\n*Top Dues List:*\n${top3}\n\n📱 *AI Tip:* Aap unko WhatsApp reminder bhej sakte hain.`,
      actionExecuted: {
        type: 'UDHAR_CHECK',
        details: `Found ${udharCustomers.length} customers with dues totalling ₹${totalDues}`,
        payload: { totalDues, topCustomers: udharCustomers.slice(0, 3) }
      },
      success: true
    };
  }

  // -------------------------------------------------------------
  // ACTION 3: Mark Bori Done / Tayar / Completed
  // -------------------------------------------------------------
  if (text.includes('tayar') || text.includes('done') || text.includes('complete') || text.includes('finish')) {
    const pendingBoris = boris.filter(b => b.status === 'pending');
    if (pendingBoris.length === 0) {
      return {
        reply: 'Sabhi boris pehle se hi completed/done hain! Nayi bori jama karein.',
        actionExecuted: null,
        success: false
      };
    }

    // Try matching customer name in input
    let targetBori = pendingBoris.find(b => text.includes(b.customerName?.toLowerCase()));
    if (!targetBori) {
      targetBori = pendingBoris[0]; // pick first pending bori if name not specified
    }

    if (markBoriDone && targetBori) {
      await markBoriDone(targetBori.id);
      return {
        reply: `✅ *Action Done:* ${targetBori.customerName} ki *${targetBori.inputWeight}kg ${targetBori.grainType || 'Grain'}* bori ko READY / DONE mark kar diya gaya hai! SMS trigger ho gaya hai.`,
        actionExecuted: {
          type: 'MARK_DONE',
          details: `Marked bori ${targetBori.id} (${targetBori.customerName}) as completed`,
          payload: { boriId: targetBori.id, customerName: targetBori.customerName }
        },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 4: Collect Payment / Jama Rashi
  // -------------------------------------------------------------
  if (text.includes('jama') || text.includes('payment') || text.includes('pay') || text.includes('bhugtan')) {
    // Extract amount
    const amountMatch = text.match(/(\d+)\s*(rs|rupaye|rupees|r|₹)?/i);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

    // Match customer
    const matchingCustomer = customers.find(c => text.includes(c.name.toLowerCase()) || text.includes(c.phone));

    if (matchingCustomer && amount > 0 && addBori) {
      await addBori({
        mode: 'chakki',
        type: 'payment',
        customerId: matchingCustomer.id,
        customerName: matchingCustomer.name,
        customerPhone: matchingCustomer.phone || '',
        grainType: '',
        inputWeight: 0,
        kaddaDeducted: 0,
        outputWeight: 0,
        rate: 0,
        amount,
        status: 'done',
        paymentMode: text.includes('upi') ? 'upi' : 'cash',
        notes: 'AI Agent Payment Collection'
      });

      const newBalance = Math.max(0, (matchingCustomer.balance || 0) - amount);

      return {
        reply: `💰 *Payment Record Saved!*\n\n• Grahak: *${matchingCustomer.name}*\n• Jama Rashi: *₹${amount}*\n• Naya Udhar Balance: *₹${newBalance}*`,
        actionExecuted: {
          type: 'RECORD_PAYMENT',
          details: `Recorded payment of ₹${amount} for ${matchingCustomer.name}`,
          payload: { customerId: matchingCustomer.id, amount, newBalance }
        },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 5: Update Grinding / Milling Rates
  // -------------------------------------------------------------
  if (text.includes('rate') || text.includes('dam') || text.includes('bhav')) {
    const numberMatch = text.match(/(\d+(\.\d+)?)/);
    if (numberMatch && updateShopRates) {
      const newRate = parseFloat(numberMatch[1]);
      if (text.includes('pirai') || text.includes('spellar') || text.includes('oil') || text.includes('sarson')) {
        await updateShopRates({ spellarRates: { pirai: newRate } });
        return {
          reply: `⚙️ *Spellar Rate Updated!* Spellar Pirai Rate ab *₹${newRate}/kg* set kar diya gaya hai.`,
          actionExecuted: { type: 'UPDATE_RATES', details: `Set Spellar Pirai rate to ₹${newRate}/kg` },
          success: true
        };
      } else {
        await updateShopRates({ chakkiRates: { pisai: newRate } });
        return {
          reply: `🌾 *Chakki Rate Updated!* Gehun/Dana Pisai Rate ab *₹${newRate}/kg* set kar diya gaya hai.`,
          actionExecuted: { type: 'UPDATE_RATES', details: `Set Chakki Pisai rate to ₹${newRate}/kg` },
          success: true
        };
      }
    }
  }

  // -------------------------------------------------------------
  // ACTION 6: Add Expense (Kharcha)
  // -------------------------------------------------------------
  if (text.includes('expens') || text.includes('kharcha') || text.includes('bill')) {
    const numMatch = text.match(/(\d+)/);
    const amount = numMatch ? parseInt(numMatch[1], 10) : 0;
    
    let category = 'Maintenance';
    if (text.includes('bijli') || text.includes('power') || text.includes('electric')) category = 'Electricity';
    if (text.includes('diesel') || text.includes('fuel')) category = 'Diesel';
    if (text.includes('chai') || text.includes('tea') || text.includes('nashta')) category = 'Miscellaneous';

    if (amount > 0 && addExpense) {
      await addExpense({
        category,
        amount,
        description: `AI Agent Logged Expense: ${userInput}`
      });

      return {
        reply: `🧾 *Expense Logged!* ₹${amount} (${category}) shop expense record kar diya gaya hai.`,
        actionExecuted: { type: 'ADD_EXPENSE', details: `Added expense ₹${amount} [${category}]` },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 7: Register New Customer
  // -------------------------------------------------------------
  if (text.includes('grahak') || text.includes('customer') || text.includes('nayi entry grahak')) {
    // Try to extract name and phone
    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    // Extract potential name (words excluding keywords)
    const words = userInput.split(/\s+/).filter(w => !['add', 'grahak', 'customer', 'nayi', 'naya', 'karo', 'karein', 'se', 'ka', 'ki'].includes(w.toLowerCase()) && !/^\d+$/.test(w));
    const name = words.slice(0, 2).join(' ') || 'Naya Grahak';

    if (addCustomer) {
      const created = await addCustomer({
        name,
        phone,
        village: 'Main Village',
        balance: 0
      });

      return {
        reply: `👤 *Naya Grahak Registered!*\n\n• Name: *${created.name}*\n• Phone: ${created.phone || 'Not added'}\n• Initial Balance: ₹0 (Clear)`,
        actionExecuted: { type: 'ADD_CUSTOMER', details: `Created customer ${created.name}` },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 8: Add Bori Entry (Smart NLP Parser)
  // -------------------------------------------------------------
  const weightMatch = text.match(/(\d+)\s*(kg|kilo|katta|bori|mann)?/i);
  if (weightMatch) {
    const weight = parseInt(weightMatch[1], 10);
    let grainType = 'Wheat';
    if (text.includes('makka') || text.includes('maize')) grainType = 'Maize';
    if (text.includes('dana') || text.includes('chana')) grainType = 'Dana';
    if (text.includes('sarson') || text.includes('oil')) grainType = 'Sarson';

    // Find customer match
    let cust = customers.find(c => text.includes(c.name.toLowerCase()));
    if (!cust) cust = customers[0]; // fallback to first customer

    const mode = grainType === 'Sarson' ? 'spellar' : 'chakki';
    const rate = mode === 'spellar' ? (shop.spellarRates?.pirai || 12) : (shop.chakkiRates?.pisai || 4);
    const amount = weight * rate;

    if (addBori) {
      const createdBori = await addBori({
        mode,
        type: mode === 'spellar' ? 'pirai' : 'pisai',
        customerId: cust ? cust.id : 'c1',
        customerName: cust ? cust.name : 'Walk-in Grahak',
        customerPhone: cust ? cust.phone : '',
        grainType,
        inputWeight: weight,
        kaddaDeducted: grainType === 'Wheat' ? Math.round((weight / 40) * 100) / 100 : 0,
        outputWeight: weight - (grainType === 'Wheat' ? Math.round((weight / 40) * 100) / 100 : 0),
        rate,
        amount,
        status: 'pending',
        paymentMode: text.includes('udhar') || text.includes('credit') ? 'credit' : 'cash',
        notes: `AI Agent Created Bori: ${userInput}`
      });

      return {
        reply: `🌾 *Nayi Bori Entry Registered!*\n\n• Grahak: *${createdBori.customerName}*\n• Material: *${weight}kg ${grainType}*\n• Kul Amount: *₹${amount}* (@ ₹${rate}/kg)\n• Status: *Pending Queue*\n📱 Customer ko SMS notifications enabled hai.`,
        actionExecuted: {
          type: 'CREATE_BORI',
          details: `Created ${grainType} bori entry ${createdBori.id} for ${createdBori.customerName} (${weight}kg)`,
          payload: createdBori
        },
        success: true
      };
    }
  }

  // Fallback AI Assistance
  return {
    reply: `🤖 *Chakki AI Agent:* Main aapki command samajh gaya. Aap try kar sakte hain:\n\n1. *"Ramesh Kumar ki 50kg gehun bori jama karo"*\n2. *"Sunita Devi se ₹500 jama record karo"*\n3. *"Aaj ka summary aur kamai batao"*\n4. *"Ramesh ki bori done karo"*\n5. *"Pisai rate ₹5 kar do"*`,
    actionExecuted: { type: 'HELP_PROMPT', details: 'Rendered assistance options' },
    success: true
  };
}
