/**
 * Mill-domain tool declarations + executors.
 *
 * This is the bridge between what the operator *says* and what the ledger
 * *does*. Two halves:
 *
 *   TOOL_DECLARATIONS — the JSON schema sent to Gemini in the Live `setup`
 *   message. Google's guidance for the Live API is that tool descriptions must
 *   carry an explicit `**Invocation Condition:**` line, because function
 *   calling over the socket is *not* the same machinery as generateContent
 *   (there is no automatic response handling, and the model performs best on
 *   single calls). Descriptions here are written to that constraint.
 *
 *   createToolExecutor — maps a validated function call onto the Zustand
 *   stores. Kept separate from the declarations so it is unit-testable with a
 *   fake store, which is how the smoke test exercises the whole voice path
 *   without a Gemini key.
 *
 * Every executor returns a plain object. The `spoken` field is a short
 * Hinglish sentence the model can read aloud verbatim — the model is told to
 * prefer it over composing its own, so numbers and names stay consistent with
 * what was actually written to the ledger.
 */

import { calculateKaddaDeduction, calculateExpectedOutput, calculateTotalBill } from '../../utils/billing';

// ---------------------------------------------------------------------------
// Name resolution
// ---------------------------------------------------------------------------

/** Lowercase, strip punctuation/diacritics, collapse whitespace. */
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common romanisation variants heard on a shop floor. Not exhaustive; the goal
 * is that "Suneeta" finds "Sunita", not a full transliteration engine.
 */
const NAME_ALIASES = [
  [/\bsuneeta\b/g, 'sunita'], [/\bsunitha\b/g, 'sunita'],
  [/\bramesh\b/g, 'ramesh'], [/\bramsh\b/g, 'ramesh'],
  [/\bgeeta\b/g, 'geeta'], [/\bgita\b/g, 'geeta'],
  [/\bsuresh\b/g, 'suresh'], [/\bsursh\b/g, 'suresh'],
  [/\bmohan\b/g, 'mohan'], [/\bmohanlal\b/g, 'mohan lal'],
  [/\bkamla\b/g, 'kamla'], [/\bkamala\b/g, 'kamla'],
  [/\bsharma\b/g, 'sharma'], [/\bsharmaji\b/g, 'sharma'],
  [/\bkumar\b/g, 'kumar'], [/\bkunmar\b/g, 'kumar'],
];

function canonicalName(s) {
  let out = norm(s);
  for (const [re, to] of NAME_ALIASES) out = out.replace(re, to);
  return out;
}

/**
 * Resolve a spoken name to a registered customer. Ranked rather than exact so
 * that "ramesh" matches "Ramesh Kumar" and "Sunita Devi" beats an unrelated
 * "Suneeta Textiles". Returns null when nothing is confident — callers then
 * ask, rather than guessing and writing to the wrong ledger.
 */
export function resolveCustomer(customers, spoken) {
  if (!Array.isArray(customers) || customers.length === 0) return null;
  const q = canonicalName(spoken);
  if (!q) return null;

  const scored = customers
    .filter(Boolean)
    .map((c) => {
      const name = canonicalName(c.name);
      if (!name) return { c, score: 0 };
      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q) || q.startsWith(name)) score = 80;
      else if (name.includes(q) || q.includes(name)) score = 60;
      else {
        // Token overlap: catches "kumar ramesh" vs "ramesh kumar".
        const a = new Set(q.split(' '));
        const b = new Set(name.split(' '));
        let shared = 0;
        a.forEach((t) => { if (b.has(t)) shared += 1; });
        score = shared > 0 ? (shared / Math.max(a.size, b.size)) * 40 : 0;
      }
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  // Require a clear winner; a tie means we should ask the operator which one.
  if (scored.length > 1 && scored[0].score === scored[1].score) return null;
  return scored[0].score >= 40 ? scored[0].c : null;
}

export function formatINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

// ---------------------------------------------------------------------------
// Declarations
// ---------------------------------------------------------------------------

const GRAIN_ENUM = ['Gehun', 'Bajra', 'Makka', 'Chana', 'Multigrain'];
const PAYMENT_ENUM = ['credit', 'cash', 'upi'];

export const TOOL_DECLARATIONS = [
  {
    name: 'record_pisai',
    description:
      'Record a new Atta Chakki grinding entry (pisai). Use this when grain was dropped off for grinding into atta or dana. ' +
      '**Invocation Condition:** only when the operator mentions pisai, chakki, grinding, atta, dana, or dropping off a bori of grain. ' +
      'Do not use for oil pressing (use record_pirai) or for receiving money (use record_payment).',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: {
          type: 'STRING',
          description: 'Name of the customer as spoken, e.g. "Ramesh Kumar". Pass "" if they did not name one.'
        },
        grainType: {
          type: 'STRING',
          enum: GRAIN_ENUM,
          description: 'Grain to grind. Default Gehun (wheat) if unspecified.'
        },
        weightKg: {
          type: 'NUMBER',
          description: 'Input grain weight in kilograms. Convert "aadha mann"/"one mann" yourself: 1 mann = 40 kg. Never ask for this — infer it.'
        },
        paymentMode: {
          type: 'STRING',
          enum: PAYMENT_ENUM,
          description: 'credit (udhar) if they will pay later, cash (nakad) or upi if paying now. Default credit.'
        },
        notes: { type: 'STRING', description: 'Any special instruction, e.g. barik atta. Optional.' }
      },
      required: ['weightKg']
    }
  },
  {
    name: 'record_pirai',
    description:
      'Record a Spellar seed-pressing entry (pirai) where mustard or other seed is pressed into oil. ' +
      '**Invocation Condition:** only when the operator mentions pirai, spellar, tel, sarson, or pressing seed for oil. Not for grinding grain.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Name of the customer as spoken. "" if none given.' },
        seedType: {
          type: 'STRING',
          enum: ['Sarson', 'Sarso', 'Til', 'Groundnut', 'Mustard'],
          description: 'Seed pressed. Sarson/Mustard are the same thing — normalise to Sarson.'
        },
        weightKg: { type: 'NUMBER', description: 'Input seed weight in kilograms.' },
        khariSold: {
          type: 'BOOLEAN',
          description: 'true if the leftover oil cake (khali) is being sold to the mill instead of returned.'
        },
        paymentMode: { type: 'STRING', enum: PAYMENT_ENUM, description: 'Payment timing. Default credit.' }
      },
      required: ['weightKg']
    }
  },
  {
    name: 'record_payment',
    description:
      'Record money received from a customer (jama), reducing their outstanding balance. ' +
      '**Invocation Condition:** only when the operator says someone paid, gave, deposited, or jama kiya money. Never use for a new grinding entry. ' +
      'This tool moves money — always state the customer and amount back to the operator before finishing.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Who paid.' },
        amount: {
          type: 'NUMBER',
          description: 'Rupees received. Resolve spoken numbers: "paanch sau" = 500, "das hazar" = 10000, "do hazaar paanch sau" = 2500.'
        },
        method: { type: 'STRING', enum: ['cash', 'upi', 'bank'], description: 'How they paid. Default cash.' }
      },
      required: ['customerName', 'amount']
    }
  },
  {
    name: 'record_advance_loan',
    description:
      'Add to a customer balance because they took goods or grain on credit (udhar badh gaya). ' +
      '**Invocation Condition:** only for money owed to the mill. Opposite of record_payment.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Who took it on credit.' },
        amount: { type: 'NUMBER', description: 'Rupees added to their balance.' },
        reason: { type: 'STRING', description: 'What was taken, e.g. "10 kg atta".' }
      },
      required: ['customerName', 'amount']
    }
  },
  {
    name: 'add_customer',
    description:
      'Register a new customer (naya grahak). **Invocation Condition:** when the operator names someone not yet in the khata. Ask for village if not given — do not invent one.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Customer name.' },
        phone: { type: 'STRING', description: '10-digit mobile number. Optional.' },
        village: { type: 'STRING', description: 'Village name.' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_today_summary',
    description:
      'Today\'s money, volume and pending count for the active mill mode. ' +
      '**Invocation Condition:** "aaj ki kamai", "aaj kitna hua", "kitni pisai", "summary do".',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: { type: 'STRING', enum: ['chakki', 'spellar'], description: 'Which mill. Defaults to the currently active mode.' }
      }
    }
  },
  {
    name: 'get_dues',
    description:
      'List customers with outstanding balance (baki udhar), worst first. ' +
      '**Invocation Condition:** "kiska udhar baki hai", "bakaya batao", "paise kisse lene hain".',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'How many to return. Default 10.' },
        minAmount: { type: 'NUMBER', description: 'Only customers owing at least this much. Default 0.' }
      }
    }
  },
  {
    name: 'get_pending_queue',
    description:
      'The boris currently waiting in the mill. **Invocation Condition:** "kya pending hai", "kaun aaya hai", "queue batao".',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: { type: 'STRING', enum: ['chakki', 'spellar'], description: 'Which mill. Defaults to active mode.' }
      }
    }
  },
  {
    name: 'mark_bori_done',
    description:
      'Mark a pending bori as ground/pressed and ready. ' +
      '**Invocation Condition:** "ho gaya", "ready hai", "nikal do" for a customer already in the queue. Resolve customer to a queue entry first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Whose bori is ready.' },
        boriId: { type: 'STRING', description: 'Exact bori id if the operator quoted one. Usually omit and pass customerName.' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'get_customer_ledger',
    description:
      'A customer\'s full transaction history and current balance. **Invocation Condition:** "ramesh ka khata", "usne kitna diya", any question about one customer\'s account.',
    parameters: {
      type: 'OBJECT',
      properties: { customerName: { type: 'STRING', description: 'Which customer.' } },
      required: ['customerName']
    }
  },
  {
    name: 'add_expense',
    description:
      'Log a shop expense (bijli, diesel, labour). **Invocation Condition:** money going out of the business that is not a raw-grain purchase.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          enum: ['bijli', 'diesel', 'labour', 'repair', 'other'],
          description: 'Expense type.'
        },
        amount: { type: 'NUMBER', description: 'Rupees spent.' },
        note: { type: 'STRING', description: 'Free-text detail. Optional.' }
      },
      required: ['category', 'amount']
    }
  },
  {
    name: 'set_mill_mode',
    description:
      'Switch between Atta Chakki (grinding) and Spellar (oil pressing). **Invocation Condition:** "chakki pe aao", "spellar kholo", "mode badlo".',
    parameters: {
      type: 'OBJECT',
      properties: { mode: { type: 'STRING', enum: ['chakki', 'spellar'] } },
      required: ['mode']
    }
  },
  {
    name: 'open_screen',
    description:
      'Navigate the app. **Invocation Condition:** "khata kholo", "dashboard dikhao", "stock dikhao". Prefer this over describing where something is.',
    parameters: {
      type: 'OBJECT',
      properties: {
        screen: {
          type: 'STRING',
          enum: ['dashboard', 'khata', 'stock', 'newEntry', 'settings'],
          description: 'Target screen.'
        }
      },
      required: ['screen']
    }
  },
  {
    name: 'confirm_pending',
    description:
      'Execute the money action that is currently awaiting the operator\'s approval. ' +
      '**Invocation Condition:** the user says haan / haan ji / theek hai / sahi hai / kar do / yes / confirm — AND the agent just asked them to confirm a payment or credit entry. ' +
      'Never call this on a fresh request.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'cancel_pending',
    description:
      'Discard the money action awaiting approval. ' +
      '**Invocation Condition:** the user says nahi / nahi ji / galat / rehne do / ruko / no / cancel in response to a confirmation question about money.',
    parameters: { type: 'OBJECT', properties: {} }
  }
];

/** Money-moving tools: the UI double-checks these before they land. */
export const REQUIRES_CONFIRMATION = new Set(['record_payment', 'record_advance_loan']);

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export function createToolExecutor(deps) {
  const { useStore, onNavigate, onConfirmRequested } = deps;

  const state = () => {
    const s = useStore.getState();
    return {
      boris: s.boris || [],
      customers: s.customers || [],
      activeMode: s.activeMode || 'chakki',
      shop: s.shop || {},
      expenses: s.expenses || []
    };
  };

  const pendingFor = (mode) =>
    state().boris.filter((b) => b.status === 'pending' && (b.mode || 'chakki') === mode);

  const summarize = (mode) => {
    const s = state();
    const list = s.boris.filter((b) => (b.mode || 'chakki') === mode);
    const today = new Date().toISOString().split('T')[0];
    const todays = list.filter((b) => String(b.dropOffDate || b.createdAt || '').startsWith(today));
    const revenue = todays.reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const kg = todays.reduce((a, b) => a + (Number(b.inputWeight) || 0), 0);
    const lit = todays.reduce((a, b) => a + (Number(b.oilOutput) || 0), 0);
    const dues = (s.customers || []).reduce((a, c) => a + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
    return { mode, revenue, kg, litre: lit, pending: pendingFor(mode).length, dues, entryCount: todays.length };
  };

  const exec = {
    async record_pisai(args) {
      const s = state();
      const grain = args.grainType || 'Gehun';
      const cfg = useStore.getState().getGrainSettings(grain);
      const weight = Number(args.weightKg) || 0;
      const kadda = calculateKaddaDeduction(weight, cfg.kadda, cfg.kaddaPer);
      const out = calculateExpectedOutput(weight, kadda);
      const amount = calculateTotalBill(weight, cfg.rate);
      const cust = args.customerName ? resolveCustomer(s.customers, args.customerName) : null;

      const bori = await useStore.getState().addBori({
        mode: 'chakki',
        tx_kind: 'pisai',
        customerId: cust ? cust.id : 'c_temp',
        customerName: cust ? cust.name : (args.customerName || 'General Customer'),
        customerPhone: cust ? cust.phone || '' : '',
        customerVillage: cust ? cust.village || '' : '',
        grainType: grain,
        outputType: 'Atta',
        inputWeight: weight,
        kaddaDeducted: kadda,
        outputWeight: out,
        rate: cfg.rate,
        amount,
        paymentMode: args.paymentMode === 'cash' || args.paymentMode === 'upi' ? args.paymentMode : 'credit',
        status: 'pending',
        notes: args.notes || ''
      });

      return {
        ok: true,
        id: bori.id,
        customerName: bori.customerName,
        customerKnown: Boolean(cust),
        weight, grain, outputWeight: out, kadda, amount,
        spoken: `${bori.customerName} ka ${weight} kilo ${grain} pisai ke liye likh diya. Bill ${formatINR(amount)}, kadda ${kadda} kilo. ` +
                (args.paymentMode === 'credit' ? 'Udhar pe daala hai.' : 'Nakad maan liya.')
      };
    },

    async record_pirai(args) {
      const s = state();
      const seed = /tel|sarson|mustard|sarso/i.test(String(args.seedType || '')) ? 'Sarson' : (args.seedType || 'Sarson');
      const rate = s.shop.spellarRates?.pirai || 12;
      const weight = Number(args.weightKg) || 0;
      const amount = calculateTotalBill(weight, rate);
      const cust = args.customerName ? resolveCustomer(s.customers, args.customerName) : null;
      // 32% oil yield is the working figure used elsewhere in the app.
      const oil = Number((weight * 0.32).toFixed(1));
      const khali = Number((weight * 0.6).toFixed(1));

      const bori = await useStore.getState().addBori({
        mode: 'spellar',
        tx_kind: 'pirai',
        customerId: cust ? cust.id : 'c_temp',
        customerName: cust ? cust.name : (args.customerName || 'General Customer'),
        customerVillage: cust ? cust.village || '' : '',
        grainType: seed,
        outputType: 'Tel',
        inputWeight: weight,
        oilOutput: oil,
        khaliOutput: khali,
        rate,
        amount,
        paymentMode: args.paymentMode === 'cash' || args.paymentMode === 'upi' ? args.paymentMode : 'credit',
        status: 'pending',
        notes: ''
      });

      return {
        ok: true, id: bori.id, customerName: bori.customerName, customerKnown: Boolean(cust),
        weight, seed, oil, khali, amount,
        spoken: `${bori.customerName} ka ${weight} kilo ${seed} pirai ke liye likh diya. Pirai ${formatINR(amount)}. Lagbhag ${oil} litre tel aur ${khali} kilo khali.`
      };
    },

    async record_payment(args) {
      const s = state();
      const cust = resolveCustomer(s.customers, args.customerName);
      if (!cust) {
        return {
          ok: false,
          code: 'CUSTOMER_NOT_FOUND',
          spoken: `${args.customerName} naam ka koi grahak nahi mila. Pehle naya grahak jodun?`
        };
      }
      const amount = Number(args.amount) || 0;
      if (amount <= 0) {
        return { ok: false, code: 'BAD_AMOUNT', spoken: 'Kitne rupaye jama hue? Number bataiye.' };
      }
      const before = Number(cust.balance) || 0;
      const after = Math.max(0, before - amount);
      await useStore.getState().updateCustomerBalance(cust.id, -amount);

      return {
        ok: true,
        customer: cust.name,
        amount,
        method: args.method || 'cash',
        balanceBefore: before,
        balanceAfter: after,
        spoken:
          `${cust.name} se ${formatINR(amount)} jama likh diye. ` +
          (after > 0 ? `Ab ${formatINR(after)} baki hai.` : 'Ab poori bakaya saaf hai.')
      };
    },

    async record_advance_loan(args) {
      const s = state();
      const cust = resolveCustomer(s.customers, args.customerName);
      if (!cust) {
        return { ok: false, code: 'CUSTOMER_NOT_FOUND', spoken: `${args.customerName} naam ka koi grahak nahi mila.` };
      }
      const amount = Number(args.amount) || 0;
      if (amount <= 0) return { ok: false, code: 'BAD_AMOUNT', spoken: 'Kitne rupaye ka udhar?' };

      const before = Number(cust.balance) || 0;
      await useStore.getState().updateCustomerBalance(cust.id, amount);
      return {
        ok: true,
        customer: cust.name, amount, reason: args.reason || '',
        balanceBefore: before,
        balanceAfter: before + amount,
        spoken: `${cust.name} ka ${formatINR(amount)} udhar jod diya${args.reason ? ` (${args.reason})` : ''}. Ab kul ${formatINR(before + amount)} baki.`
      };
    },

    async add_customer(args) {
      const s = state();
      const name = String(args.name || '').trim();
      if (!name) return { ok: false, code: 'BAD_NAME', spoken: 'Grahak ka naam bataiye.' };
      const existing = resolveCustomer(s.customers, name);
      if (existing) {
        return { ok: true, alreadyExisted: true, customer: existing.name, spoken: `${existing.name} pehle se khata mein hain.` };
      }
      const created = await useStore.getState().addCustomer({
        name, phone: String(args.phone || '').trim(), village: String(args.village || '').trim(), balance: 0
      });
      return {
        ok: true,
        customer: created?.name || name,
        village: created?.village || '',
        spoken: `${created?.name || name} ka naya khata ban gaya${created?.village ? ` — ${created.village}` : ''}.`
      };
    },

    async get_today_summary(args) {
      const s = state();
      const mode = (args && args.mode) || s.activeMode;
      const t = summarize(mode);
      return {
        ...t,
        spoken: `Aaj ${t.entryCount} entry, kamai ${formatINR(t.revenue)}. ` +
                (mode === 'chakki' ? `${t.kg} kilo pisai.` : `${t.litre} litre tel.`) +
                ` Pending ${t.pending}, kul bakaya ${formatINR(t.dues)}.`
      };
    },

    async get_dues(args) {
      const s = state();
      const min = Number(args && args.minAmount) || 0;
      const list = (s.customers || [])
        .filter((c) => Number(c.balance) > min)
        .sort((a, b) => Number(b.balance) - Number(a.balance))
        .slice(0, Number(args.limit) || 10);
      const total = list.reduce((a, c) => a + Number(c.balance), 0);
      return {
        count: list.length,
        total,
        customers: list.map((c) => ({ name: c.name, village: c.village || '', amount: Number(c.balance) })),
        spoken: list.length === 0
          ? 'Kisi grahak ka udhar baki nahi hai.'
          : `${list.length} grahak se kul ${formatINR(total)} baki hai. Sabse zyada ${list[0].name} — ${formatINR(Number(list[0].balance))}.`
      };
    },

    async get_pending_queue() {
      const s = state();
      const mode = args.mode || s.activeMode;
      const list = pendingFor(mode);
      return {
        count: list.length,
        items: list.map((b) => ({ id: b.id, customer: b.customerName, kg: b.inputWeight, grain: b.grainType, amount: b.amount })),
        spoken: list.length === 0
          ? 'Koi bori pending nahi hai.'
          : `${list.length} bori pending hain. ${list.slice(0, 3).map((b) => `${b.customerName} ${b.inputWeight} kilo`).join(', ')}.`
      };
    },

    async mark_bori_done(args) {
      const s = state();
      let bori = null;
      if (args.boriId) bori = s.boris.find((b) => b.id === args.boriId) || null;
      if (!bori && args.customerName) {
        const cands = pendingFor(s.activeMode).filter((b) =>
          norm(b.customerName).includes(norm(args.customerName)) ||
          norm(args.customerName).includes(norm(b.customerName))
        );
        // Oldest first — the bori that has been waiting longest is the one the
        // operator almost always means.
        bori = cands.sort((a, b) =>
          new Date(a.dropOffDate || a.createdAt) - new Date(b.dropOffDate || b.createdAt)
        )[0] || null;
      }
      if (!bori) {
        return { ok: false, code: 'NOT_IN_QUEUE', spoken: `${args.customerName || 'Us'} ki koi pending bori nahi mili.` };
      }
      await useStore.getState().markBoriDone(bori.id);
      return {
        ok: true, id: bori.id, customer: bori.customerName, amount: bori.amount,
        spoken: `${bori.customerName} ki bori ho gayi — ready hai. Bill ${formatINR(bori.amount)}.`
      };
    },

    async get_customer_ledger(args) {
      const s = state();
      const cust = resolveCustomer(s.customers, args.customerName);
      if (!cust) {
        return { ok: false, code: 'CUSTOMER_NOT_FOUND', spoken: `${args.customerName} naam ka koi grahak nahi mila.` };
      }
      const txns = (s.boris || [])
        .filter((b) => b.customerId === cust.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map((b) => {
          const isPayment = b.tx_kind === 'payment' || b.type === 'payment';
          return {
            date: String(b.dropOffDate || b.createdAt || '').split('T')[0],
            what: isPayment ? 'jama' : `${b.inputWeight}kg ${b.grainType}`,
            amount: Number(b.amount) || 0,
            direction: isPayment ? 'in' : 'out'
          };
        });
      return {
        ok: true,
        customer: cust.name,
        village: cust.village || '',
        balance: Number(cust.balance) || 0,
        phone: cust.phone || '',
        transactions: txns,
        spoken: `${cust.name} ka khata: abhi ${formatINR(Number(cust.balance) || 0)} ${Number(cust.balance) > 0 ? 'baki' : 'clear'} hai. ${txns.length} entry hain.`
      };
    },

    async add_expense(args) {
      const amount = Number(args.amount) || 0;
      if (amount <= 0) return { ok: false, code: 'BAD_AMOUNT', spoken: 'Kitna kharcha hua?' };
      const s = state();
      s.addExpense({ category: args.category, amount, note: args.note || '' });
      return { ok: true, category: args.category, amount, spoken: `${formatINR(amount)} ka ${args.category} kharcha likh diya.` };
    },

    async set_mill_mode(args) {
      useStore.getState().setActiveMode(args.mode);
      return {
        ok: true, mode: args.mode,
        spoken: args.mode === 'chakki' ? 'Chakki mode on hai.' : 'Spellar mode on hai.'
      };
    },

    async open_screen(args) {
      if (typeof onNavigate === 'function') onNavigate(args.screen);
      return { ok: true, screen: args.screen, spoken: '' };
    }
  };

  /**
   * Money tools are stashed rather than executed on the first pass. The
   * operator hears a read-back and must confirm. Rationale: an illiterate user
   * cannot scan a ledger and spot a wrong number after the fact, and speech
   * recognition of names is the least reliable part of the pipeline — writing
   * "Ramesh" when they said "Suresh" is a real money error, not a typo.
   */
  let pending = null;

  const requireConfirmation = (name, args) => {
    if (!REQUIRES_CONFIRMATION.has(name) || (args && args._confirmed)) return null;
    const s = state();
    const cust = resolveCustomer(s.customers, args.customerName || '');
    const amount = Number(args.amount) || 0;
    pending = {
      name,
      args: { ...args, _confirmed: true },
      customer: (cust && cust.name) || args.customerName || 'Grahak',
      amount
    };
    const isIn = name === 'record_payment';
    return {
      ok: false,
      code: 'AWAITING_CONFIRMATION',
      confirmation: pending,
      spoken:
        (isIn
          ? `${pending.customer} se ${formatINR(amount)} jama — sahi hai? Haan ya nahi boliye.`
          : `${pending.customer} ka ${formatINR(amount)} udhar — sahi hai? Haan ya nahi boliye.`)
    };
  };

  return {
    declarations: TOOL_DECLARATIONS,
    requiresConfirmation: (name) => REQUIRES_CONFIRMATION.has(name),
    get pendingAction() { return pending ? { ...pending } : null; },
    clearPending() { pending = null; },
    async execute(name, args) {
      if (name === 'confirm_pending') {
        if (!pending) return { ok: true, spoken: 'Koi kaam pending nahi hai.' };
        const act = pending;
        pending = null;
        return exec[act.name](act.args);
      }
      if (name === 'cancel_pending') {
        const was = pending;
        pending = null;
        return {
          ok: true,
          cancelled: true,
          spoken: was ? `${was.customer} ka kaam rehne diya.` : 'Theek hai, rehne diya.'
        };
      }

      const fn = exec[name];
      if (!fn) {
        return { ok: false, code: 'UNKNOWN_TOOL', spoken: 'Ye kaam main abhi nahi kar sakta.' };
      }

      const gate = requireConfirmation(name, args);
      if (gate) return gate;

      try {
        const result = await fn(args || {});
        if (result && result.ok) pending = null;
        return result;
      } catch (err) {
        console.error(`[tool:${name}]`, err);
        return {
          ok: false,
          code: 'EXECUTION_FAILED',
          spoken: 'Kuch galat ho gaya, phir se koshish karein.',
          error: String(err && err.message ? err.message : err)
        };
      }
    }
  };
}
