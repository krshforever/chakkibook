/**
 * Chakkibook Autonomous In-App AI Agent Service & Predictive Engine
 * Handles natural language parser expansion, state modifications, action metadata with undo support,
 * and smart predictive insights.
 */

import { useStore } from '../store/useStore';

// -------------------------------------------------------------
// 1. SMART PREDICTIVE INSIGHTS ENGINE
// -------------------------------------------------------------
export function generatePredictiveInsights(store) {
  const { customers = [], boris = [] } = store;
  const insights = [];

  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // 1. Peak Pickup Alert: Completed boris pending pickup for > 24 hrs
  const uncollectedBoris = boris.filter((b) => {
    if (b.status !== 'done' || !b.doneDate) return false;
    const doneTime = new Date(b.doneDate).getTime();
    return now.getTime() - doneTime > oneDayMs;
  });

  if (uncollectedBoris.length > 0) {
    const totalUncollectedKg = uncollectedBoris.reduce((acc, b) => acc + (Number(b.inputWeight) || 0), 0);
    const topCustomerNames = Array.from(new Set(uncollectedBoris.map((b) => b.customerName))).slice(0, 3).join(', ');
    insights.push({
      id: 'insight_pickup',
      type: 'peak_pickup_alert',
      severity: 'high',
      title: 'Peak Pickup & Space Congestion Alert',
      message: `${uncollectedBoris.length} completed boris (${totalUncollectedKg} kg flour) waiting for pickup >24h (${topCustomerNames}). Remind customers to clear shop floor!`,
      actionableText: 'Send WhatsApp pickup reminders',
      count: uncollectedBoris.length
    });
  }

  // 2. Grain Demand Prediction: High volume trends in last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * oneDayMs);
  const recentBoris = boris.filter((b) => new Date(b.createdAt || b.dropOffDate) >= sevenDaysAgo);
  
  const grainTotals = {};
  recentBoris.forEach((b) => {
    const grain = (b.grainType || 'Gehun').toLowerCase();
    grainTotals[grain] = (grainTotals[grain] || 0) + (Number(b.inputWeight) || 0);
  });

  const primaryGrain = Object.keys(grainTotals).sort((a, b) => grainTotals[b] - grainTotals[a])[0];
  if (primaryGrain) {
    const totalKg = grainTotals[primaryGrain];
    insights.push({
      id: 'insight_demand',
      type: 'grain_demand_prediction',
      severity: 'medium',
      title: 'Grain Milling Demand Forecast',
      message: `${primaryGrain.toUpperCase()} milling demand is high at ${totalKg} kg this week. Peak grinding surge expected tomorrow 9 AM - 12 PM.`,
      actionableText: 'Prepare motor & check stone wear'
    });
  }

  // 3. Uncollected Debt Warning: Debtors with > 500 balance or village clusters
  const highDuesCustomers = customers.filter((c) => c.balance >= 500).sort((a, b) => b.balance - a.balance);
  const totalHighDues = highDuesCustomers.reduce((acc, c) => acc + c.balance, 0);

  if (highDuesCustomers.length > 0) {
    const topDebtor = highDuesCustomers[0];
    insights.push({
      id: 'insight_debt',
      type: 'uncollected_debt_warning',
      severity: 'warning',
      title: 'Uncollected Debt Risk Warning',
      message: `${highDuesCustomers.length} customers have balance >= Rs 500. Total at-risk dues: Rs ${totalHighDues}. Highest balance: ${topDebtor.name} (Rs ${topDebtor.balance}, ${topDebtor.village || 'Main'}).`,
      actionableText: 'Review Village Debt Filter',
      topDebtor: topDebtor.name
    });
  }

  return insights;
}

// -------------------------------------------------------------
// 2. UNDO ACTION HANDLER
// -------------------------------------------------------------
export async function undoAIAction(actionExecuted, store) {
  if (!actionExecuted || !actionExecuted.undoPayload) {
    return { success: false, reply: 'Undo information not available for this action.' };
  }

  const { type, undoPayload } = actionExecuted;

  try {
    if (type === 'CREATE_BORI') {
      const { boriId, customerId, amount, paymentMode } = undoPayload;
      
      // If credit, reverse balance addition
      if (paymentMode === 'credit' && customerId && store.updateCustomerBalance) {
        await store.updateCustomerBalance(customerId, -amount);
      }
      
      // Remove bori from store list
      useStore.setState((state) => ({
        boris: state.boris.filter((b) => b.id !== boriId)
      }));

      return {
        success: true,
        reply: `[ACTION REVERTED] Bori entry (${undoPayload.customerName} - ${undoPayload.inputWeight}kg) has been deleted and balance updated.`
      };
    }

    if (type === 'RECORD_PAYMENT') {
      const { customerId, amount, customerName } = undoPayload;
      if (customerId && store.updateCustomerBalance) {
        await store.updateCustomerBalance(customerId, amount);
      }
      return {
        success: true,
        reply: `[ACTION REVERTED] Payment of Rs ${amount} for ${customerName} has been reverted. Outstanding balance restored.`
      };
    }

    if (type === 'UPDATE_RATES') {
      const { previousRates } = undoPayload;
      if (store.updateShopRates && previousRates) {
        await store.updateShopRates(previousRates);
      }
      return {
        success: true,
        reply: `[ACTION REVERTED] Shop rates restored to previous settings.`
      };
    }

    if (type === 'MARK_DONE') {
      const { boriId, customerName } = undoPayload;
      useStore.setState((state) => ({
        boris: state.boris.map((b) => b.id === boriId ? { ...b, status: 'pending', doneDate: null } : b)
      }));
      return {
        success: true,
        reply: `[ACTION REVERTED] Bori for ${customerName} set back to PENDING status.`
      };
    }

    if (type === 'ADD_EXPENSE') {
      const { expenseId, amount, category } = undoPayload;
      useStore.setState((state) => ({
        expenses: state.expenses.filter((e) => e.id !== expenseId)
      }));
      return {
        success: true,
        reply: `[ACTION REVERTED] Expense entry (Rs ${amount} - ${category}) removed.`
      };
    }

    return { success: false, reply: 'Cannot undo this specific action type.' };
  } catch (err) {
    return { success: false, reply: `Undo error: ${err.message}` };
  }
}

// -------------------------------------------------------------
// 3. MAIN NATURAL LANGUAGE COMMAND PROCESSOR
// -------------------------------------------------------------
export async function processAICommand(userInput, store) {
  const text = userInput.trim().toLowerCase();

  if (!text) {
    return {
      reply: 'Kripya koi command dein (e.g. "Ramesh Kumar 50kg gehun pisai bori jama karo" ya "Sunita Devi se 500 rupaye jama payment record karo").',
      actionExecuted: null,
      success: false
    };
  }

  const {
    customers = [],
    boris = [],
    expenses = [],
    shop = {},
    addBori,
    markBoriDone,
    addCustomer,
    updateShopRates,
    addExpense,
    getVillages
  } = store;

  // -------------------------------------------------------------
  // ACTION 1: Bori Entry / Jama (NLP Match: "Ramesh Kumar 50kg gehun pisai bori jama karo")
  // -------------------------------------------------------------
  const isBoriCommand = 
    (text.includes('bori') || text.includes('jama') || text.includes('pisai') || text.includes('pirai') || text.includes('katta')) &&
    !text.includes('payment') && !text.includes('rupaye') && !text.includes('rate') && !text.includes('summary') && !text.includes('grahak batao') && !text.includes('udhar grahak');

  const weightMatch = text.match(/(\d+)\s*(kg|kilo|katta|bori|mann)?/i);

  if (isBoriCommand && weightMatch) {
    const weight = parseInt(weightMatch[1], 10);
    
    // Resolve Grain Type
    let grainType = 'Gehun';
    if (text.includes('makka') || text.includes('maize')) grainType = 'Makka';
    else if (text.includes('bajra') || text.includes('millet')) grainType = 'Bajra';
    else if (text.includes('chana') || text.includes('gram')) grainType = 'Chana';
    else if (text.includes('multigrain')) grainType = 'Multigrain';
    else if (text.includes('sarson') || text.includes('mustard') || text.includes('oil')) grainType = 'Sarson';

    // Resolve Output Type
    let outputType = grainType === 'Sarson' ? 'Tel' : 'Atta';
    if (text.includes('dana') || text.includes('daliya')) outputType = 'Dana';
    if (text.includes('mota')) outputType = 'Mota Dana';
    if (text.includes('besan')) outputType = 'Besan';

    // Customer Name Resolution (Fuzzy match customer name from query text)
    let matchingCustomer = customers.find((c) => text.includes(c.name.toLowerCase()));
    if (!matchingCustomer) {
      // Try matching words in user input against customer names
      const words = userInput.split(/\s+/).filter(w => !['50kg', '40kg', '30kg', '20kg', 'kg', 'kilo', 'gehun', 'bajra', 'makka', 'chana', 'pisai', 'pirai', 'bori', 'jama', 'karo', 'add', 'entry', 'se', 'ka', 'ki'].includes(w.toLowerCase()) && !/^\d+$/.test(w));
      const extractedName = words.slice(0, 2).join(' ');
      
      if (extractedName && extractedName.length > 2) {
        matchingCustomer = customers.find(c => c.name.toLowerCase().includes(extractedName.toLowerCase()));
      }
    }

    const customerName = matchingCustomer ? matchingCustomer.name : (userInput.split(/\d+/)[0].trim() || 'Walk-in Customer');
    const customerId = matchingCustomer ? matchingCustomer.id : 'c_temp';
    const customerPhone = matchingCustomer ? matchingCustomer.phone : '';
    const customerVillage = matchingCustomer ? matchingCustomer.village : 'Main';

    const mode = grainType === 'Sarson' ? 'spellar' : 'chakki';
    const rate = mode === 'spellar' ? (shop.spellarRates?.pirai || 12) : (shop.chakkiRates?.grainRates?.[grainType.toLowerCase()] || shop.chakkiRates?.pisai || 4);
    const amount = weight * rate;
    const isCredit = text.includes('udhar') || text.includes('credit') || text.includes('baki');
    const paymentMode = isCredit ? 'credit' : 'cash';

    if (addBori) {
      const createdBori = await addBori({
        mode,
        type: mode === 'spellar' ? 'pirai' : 'pisai',
        customerId,
        customerName,
        customerPhone,
        customerVillage,
        grainType,
        outputType,
        inputWeight: weight,
        kaddaDeducted: grainType === 'Gehun' ? Math.round((weight / 40) * 1.25 * 100) / 100 : 0,
        outputWeight: weight - (grainType === 'Gehun' ? Math.round((weight / 40) * 1.25 * 100) / 100 : 0),
        rate,
        amount,
        status: 'pending',
        paymentMode,
        notes: `AI Agent NLP Order: ${userInput}`
      });

      const replyText = 
        `[BORI ENTRY CREATED]\n` +
        `• Customer: ${createdBori.customerName} (${createdBori.customerVillage || 'Main'})\n` +
        `• Order: ${weight} kg ${grainType} (${outputType})\n` +
        `• Milling Charge: Rs ${amount} (@ Rs ${rate}/kg)\n` +
        `• Payment Status: ${paymentMode.toUpperCase()}\n` +
        `• Status: PENDING IN QUEUE`;

      return {
        reply: replyText,
        actionExecuted: {
          type: 'CREATE_BORI',
          title: 'Bori Entry Added',
          details: `Added ${weight}kg ${grainType} for ${createdBori.customerName} (Rs ${amount})`,
          stateModifications: [
            { label: 'Customer', value: createdBori.customerName },
            { label: 'Weight', value: `${weight} kg` },
            { label: 'Grain', value: grainType },
            { label: 'Total Amount', value: `Rs ${amount}` },
            { label: 'Payment Mode', value: paymentMode.toUpperCase() }
          ],
          undoPayload: {
            boriId: createdBori.id,
            customerId: createdBori.customerId,
            customerName: createdBori.customerName,
            inputWeight: weight,
            amount,
            paymentMode
          }
        },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 2: Payment Collection (NLP Match: "Sunita Devi se 500 rupaye jama payment record karo")
  // -------------------------------------------------------------
  if (
    (text.includes('jama') && (text.includes('payment') || text.includes('rupaye') || text.includes('rs') || text.includes('bhugtan') || text.includes('rashi'))) ||
    text.includes('record payment') || text.includes('payment collect')
  ) {
    const amountMatch = text.match(/(\d+)\s*(rs|rupaye|rupees|r|₹)?/i);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

    const matchingCustomer = customers.find((c) => text.includes(c.name.toLowerCase()) || text.includes(c.phone));

    if (matchingCustomer && amount > 0 && addBori) {
      await addBori({
        mode: 'chakki',
        type: 'payment',
        customerId: matchingCustomer.id,
        customerName: matchingCustomer.name,
        customerPhone: matchingCustomer.phone || '',
        customerVillage: matchingCustomer.village || '',
        grainType: '',
        inputWeight: 0,
        kaddaDeducted: 0,
        outputWeight: 0,
        rate: 0,
        amount,
        status: 'done',
        paymentMode: text.includes('upi') || text.includes('online') ? 'upi' : 'cash',
        notes: `AI Agent Payment Collection: ${userInput}`
      });

      const oldBalance = matchingCustomer.balance || 0;
      const newBalance = Math.max(0, oldBalance - amount);

      const replyText = 
        `[PAYMENT RECORDED]\n` +
        `• Customer: ${matchingCustomer.name}\n` +
        `• Village: ${matchingCustomer.village || 'Main'}\n` +
        `• Amount Received: Rs ${amount}\n` +
        `• Previous Dues: Rs ${oldBalance}\n` +
        `• Updated Balance: Rs ${newBalance}`;

      return {
        reply: replyText,
        actionExecuted: {
          type: 'RECORD_PAYMENT',
          title: 'Payment Collection Recorded',
          details: `Recorded Rs ${amount} payment from ${matchingCustomer.name}`,
          stateModifications: [
            { label: 'Customer', value: matchingCustomer.name },
            { label: 'Amount Paid', value: `Rs ${amount}` },
            { label: 'Previous Dues', value: `Rs ${oldBalance}` },
            { label: 'New Balance', value: `Rs ${newBalance}` }
          ],
          undoPayload: {
            customerId: matchingCustomer.id,
            customerName: matchingCustomer.name,
            amount,
            previousBalance: oldBalance
          }
        },
        success: true
      };
    } else if (!matchingCustomer) {
      return {
        reply: `Customer naam samajh me nahi aaya. Kripya grahak ka saaf naam likhein (e.g. "Sunita Devi se 500 rupaye jama payment record karo").`,
        actionExecuted: null,
        success: false
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 3: Daily Summary & Hisab (NLP Match: "Aaj ki kul kamai aur pisai batao")
  // -------------------------------------------------------------
  if (
    text.includes('summary') || 
    text.includes('hisab') || 
    text.includes('kamai') || 
    text.includes('pisai batao') || 
    text.includes('report') ||
    text.includes('kul kamai')
  ) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBoris = boris.filter(b => (b.createdAt || b.doneDate || b.dropOffDate || '').startsWith(todayStr));
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
      `[DAILY BUSINESS SUMMARY]\n` +
      `• Total Milling (Pisai/Pirai): ${totalWeight} kg\n` +
      `• Gross Revenue: Rs ${totalIncome}\n` +
      `• Today's Expenses: Rs ${todayExpenses}\n` +
      `• Net Profit: Rs ${netProfit}\n` +
      `• Pending Queue: ${pendingBoris.length} boris waiting\n` +
      `• Total Outstanding Dues: Rs ${totalUdhar}`;

    return {
      reply: replyText,
      actionExecuted: {
        type: 'BUSINESS_SUMMARY',
        title: 'Daily Business Summary',
        details: `Calculated metrics: ${totalWeight}kg milled, Rs ${totalIncome} gross revenue`,
        stateModifications: [
          { label: 'Milling Volume', value: `${totalWeight} kg` },
          { label: 'Gross Revenue', value: `Rs ${totalIncome}` },
          { label: 'Expenses', value: `Rs ${todayExpenses}` },
          { label: 'Net Profit', value: `Rs ${netProfit}` },
          { label: 'Pending Boris', value: `${pendingBoris.length}` }
        ],
        undoPayload: null
      },
      success: true
    };
  }

  // -------------------------------------------------------------
  // ACTION 4: Village Debt Filter (NLP Match: "Rampur ke sabhi udhar grahak batao")
  // -------------------------------------------------------------
  if (
    text.includes('udhar grahak') || 
    text.includes('udhar') || 
    text.includes('dues') || 
    text.includes('bakaya') ||
    text.includes('gaon')
  ) {
    const villagesList = getVillages ? getVillages() : [];
    let matchedVillage = villagesList.find(v => text.includes(v.name.toLowerCase()))?.name;

    if (!matchedVillage) {
      if (text.includes('rampur')) matchedVillage = 'Rampur';
      else if (text.includes('shiv nagar') || text.includes('shivnagar')) matchedVillage = 'Shiv Nagar';
      else if (text.includes('kisan basti')) matchedVillage = 'Kisan Basti';
    }

    let targetCustomers = [...customers].filter(c => c.balance > 0);

    if (matchedVillage) {
      targetCustomers = targetCustomers.filter(c => (c.village || '').toLowerCase() === matchedVillage.toLowerCase());
    }

    targetCustomers.sort((a, b) => b.balance - a.balance);

    const totalVillageDues = targetCustomers.reduce((acc, c) => acc + c.balance, 0);

    if (targetCustomers.length === 0) {
      const locationLabel = matchedVillage ? matchedVillage : 'All Villages';
      return {
        reply: `[VILLAGE DEBT FILTER]\nNo debtors found in ${locationLabel}. All customer accounts are clear!`,
        actionExecuted: {
          type: 'VILLAGE_DEBT_FILTER',
          title: 'Village Debt Analysis',
          details: `0 debtors found in ${locationLabel}`,
          stateModifications: [
            { label: 'Location', value: locationLabel },
            { label: 'Debtors Count', value: '0' },
            { label: 'Total Dues', value: 'Rs 0' }
          ],
          undoPayload: null
        },
        success: true
      };
    }

    const debtorRows = targetCustomers
      .map((c, i) => `${i + 1}. ${c.name} (${c.village || 'Main'}): Rs ${c.balance}`)
      .join('\n');

    const locationLabel = matchedVillage ? `${matchedVillage} Village` : 'All Villages';

    const replyText = 
      `[VILLAGE DEBT FILTER - ${locationLabel.toUpperCase()}]\n` +
      `• Total Outstanding Dues: Rs ${totalVillageDues}\n` +
      `• Total Debtors: ${targetCustomers.length}\n\n` +
      `Debtors Breakdown:\n${debtorRows}`;

    return {
      reply: replyText,
      actionExecuted: {
        type: 'VILLAGE_DEBT_FILTER',
        title: 'Village Debt Filter',
        details: `Filtered ${targetCustomers.length} debtors in ${locationLabel} (Total: Rs ${totalVillageDues})`,
        stateModifications: [
          { label: 'Target Location', value: locationLabel },
          { label: 'Total Debtors', value: `${targetCustomers.length}` },
          { label: 'Total Dues', value: `Rs ${totalVillageDues}` }
        ],
        undoPayload: null
      },
      success: true
    };
  }

  // -------------------------------------------------------------
  // ACTION 5: Update Grinding Rate (NLP Match: "Gehun pisai rate 5 rupaye set karo")
  // -------------------------------------------------------------
  if (text.includes('rate') || text.includes('bhav') || text.includes('dam')) {
    const numberMatch = text.match(/(\d+(\.\d+)?)/);
    if (numberMatch && updateShopRates) {
      const newRate = parseFloat(numberMatch[1]);
      const previousChakkiRates = shop.chakkiRates || {};
      const previousSpellarRates = shop.spellarRates || {};

      if (text.includes('pirai') || text.includes('spellar') || text.includes('oil') || text.includes('sarson')) {
        await updateShopRates({ spellarRates: { pirai: newRate } });
        return {
          reply: `[RATE UPDATED] Spellar Oil Pressing Rate set to Rs ${newRate}/kg.`,
          actionExecuted: {
            type: 'UPDATE_RATES',
            title: 'Shop Rate Updated',
            details: `Updated Spellar Pirai rate to Rs ${newRate}/kg`,
            stateModifications: [
              { label: 'Rate Type', value: 'Spellar Pirai' },
              { label: 'New Rate', value: `Rs ${newRate}/kg` }
            ],
            undoPayload: {
              previousRates: { spellarRates: previousSpellarRates }
            }
          },
          success: true
        };
      } else {
        const updatedGrainRates = { ...(previousChakkiRates.grainRates || {}), gehun: newRate };
        await updateShopRates({ chakkiRates: { pisai: newRate, grainRates: updatedGrainRates } });
        return {
          reply: `[RATE UPDATED] Flour Grinding (Gehun Pisai) Rate set to Rs ${newRate}/kg.`,
          actionExecuted: {
            type: 'UPDATE_RATES',
            title: 'Shop Rate Updated',
            details: `Updated Chakki Pisai rate to Rs ${newRate}/kg`,
            stateModifications: [
              { label: 'Rate Type', value: 'Chakki Gehun Pisai' },
              { label: 'New Rate', value: `Rs ${newRate}/kg` }
            ],
            undoPayload: {
              previousRates: { chakkiRates: previousChakkiRates }
            }
          },
          success: true
        };
      }
    }
  }

  // -------------------------------------------------------------
  // ACTION 6: Mark Bori Done / Completed
  // -------------------------------------------------------------
  if (text.includes('tayar') || text.includes('done') || text.includes('complete') || text.includes('finish')) {
    const pendingBoris = boris.filter(b => b.status === 'pending');
    if (pendingBoris.length === 0) {
      return {
        reply: '[QUEUE EMPTY] No pending boris in queue to mark as completed.',
        actionExecuted: null,
        success: false
      };
    }

    let targetBori = pendingBoris.find(b => text.includes(b.customerName?.toLowerCase()));
    if (!targetBori) {
      targetBori = pendingBoris[0];
    }

    if (markBoriDone && targetBori) {
      await markBoriDone(targetBori.id);
      return {
        reply: `[ORDER COMPLETED] Marked bori for ${targetBori.customerName} (${targetBori.inputWeight}kg ${targetBori.grainType || 'Grain'}) as COMPLETED. SMS notification triggered.`,
        actionExecuted: {
          type: 'MARK_DONE',
          title: 'Bori Marked Completed',
          details: `Marked bori ${targetBori.id} for ${targetBori.customerName} as done`,
          stateModifications: [
            { label: 'Customer', value: targetBori.customerName },
            { label: 'Weight', value: `${targetBori.inputWeight} kg` },
            { label: 'New Status', value: 'DONE' }
          ],
          undoPayload: {
            boriId: targetBori.id,
            customerName: targetBori.customerName
          }
        },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 7: Add Expense (Kharcha)
  // -------------------------------------------------------------
  if (text.includes('expens') || text.includes('kharcha') || text.includes('bill')) {
    const numMatch = text.match(/(\d+)/);
    const amount = numMatch ? parseInt(numMatch[1], 10) : 0;
    
    let category = 'Maintenance';
    if (text.includes('bijli') || text.includes('power') || text.includes('electric')) category = 'Electricity';
    else if (text.includes('diesel') || text.includes('fuel')) category = 'Diesel';
    else if (text.includes('chai') || text.includes('tea') || text.includes('nashta')) category = 'Miscellaneous';

    if (amount > 0 && addExpense) {
      const expRes = await addExpense({
        category,
        amount,
        description: `AI Agent Expense Log: ${userInput}`
      });

      return {
        reply: `[EXPENSE LOGGED] Recorded Rs ${amount} (${category}) shop expense.`,
        actionExecuted: {
          type: 'ADD_EXPENSE',
          title: 'Expense Entry Added',
          details: `Logged Rs ${amount} expense under ${category}`,
          stateModifications: [
            { label: 'Category', value: category },
            { label: 'Amount', value: `Rs ${amount}` }
          ],
          undoPayload: {
            expenseId: expRes?.id || `e_${Date.now()}`,
            amount,
            category
          }
        },
        success: true
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 8: Register New Customer
  // -------------------------------------------------------------
  if (text.includes('grahak') || text.includes('customer')) {
    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    const words = userInput.split(/\s+/).filter(w => !['add', 'grahak', 'customer', 'nayi', 'naya', 'karo', 'karein', 'se', 'ka', 'ki', 'jodein'].includes(w.toLowerCase()) && !/^\d+$/.test(w));
    const name = words.slice(0, 2).join(' ') || 'Naya Grahak';

    if (addCustomer) {
      const created = await addCustomer({
        name,
        phone,
        village: 'Main Village',
        balance: 0
      });

      return {
        reply: `[CUSTOMER REGISTERED]\n• Name: ${created.name}\n• Phone: ${created.phone || 'Not specified'}\n• Balance: Rs 0`,
        actionExecuted: {
          type: 'ADD_CUSTOMER',
          title: 'Customer Registered',
          details: `Registered customer ${created.name}`,
          stateModifications: [
            { label: 'Name', value: created.name },
            { label: 'Phone', value: created.phone || 'N/A' },
            { label: 'Balance', value: 'Rs 0' }
          ],
          undoPayload: null
        },
        success: true
      };
    }
  }

  // Fallback Command Helper
  return {
    reply: 
      `[CHAKKIBOT AI CO-PILOT]\n` +
      `Command match not found. Try one of these commands:\n` +
      `1. "Ramesh Kumar 50kg gehun pisai bori jama karo"\n` +
      `2. "Sunita Devi se 500 rupaye jama payment record karo"\n` +
      `3. "Aaj ki kul kamai aur pisai batao"\n` +
      `4. "Rampur ke sabhi udhar grahak batao"\n` +
      `5. "Gehun pisai rate 5 rupaye set karo"`,
    actionExecuted: {
      type: 'HELP_PROMPT',
      title: 'Suggested Commands',
      details: 'Showed quick command options',
      stateModifications: [],
      undoPayload: null
    },
    success: true
  };
}

export async function queryAIAgent(userInput, context = {}) {
  const result = await processAICommand(userInput, context);
  return result?.reply || 'Dhanyawad! Command process ho gaya hai.';
}

