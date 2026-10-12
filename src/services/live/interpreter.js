/**
 * Deterministic Hindi/Hinglish command interpreter.
 *
 * This exists for two reasons, in priority order:
 *
 * 1. **The demo path.** Without it the voice UI is dead code on a machine with
 *    no Gemini key, and nobody can see whether it works. This engine runs
 *    entirely on-device via the Web Speech API + speechSynthesis, so the app
 *    is hands-free today, no network and no billing.
 *
 * 2. **The safety net.** When Gemini is configured but ambiguous, we would
 *    rather ask the operator than guess. Same policy here.
 *
 * It is intentionally a keyword/rule parser, not an LLM. For the closed
 * vocabulary of a flour mill ("pisai kara do", "500 jama", "bakaya batao")
 * rules beat a model on latency, cost and — importantly — predictability. It
 * cannot hallucinate a ₹2,130 balance.
 *
 * Hinglish is the hard case: it is Roman-script Hindi with English mixed in,
 * frequently misspelled, and speakers code-switch mid-sentence. Everything
 * below tolerates both scripts and common misspellings.
 */

// ---------------------------------------------------------------------------
// Number words
// ---------------------------------------------------------------------------

const ONES = {
  ek: 1, do: 2, teen: 3, tin: 3, char: 4, chaar: 4, paanch: 5, panch: 5,
  chhe: 6, che: 6, saat: 7, sat: 7, aath: 8, ath: 8, nau: 9, no: 9,
  das: 10, dus: 10, gyara: 11, gyarah: 11, baara: 12, barah: 12, tera: 13,
  terah: 13, chauda: 14, chaudah: 14, pandra: 15, pandrah: 15, sola: 16,
  solah: 16, satra: 17, satrah: 17, athara: 18, atharah: 18, unees: 19,
  uneesees: 19, bees: 20, bis: 20,
  tees: 30, teesara: 30, chalis: 40, chalees: 40, pachaas: 50, pachas: 50,
  saath: 60, sath: 60, sattar: 70, sattaraw: 70, assi: 80, assee: 80,
  nabbe: 90, nabbeh: 90,
  sau: 100, so: 100, hazaar: 1000, hazar: 1000, thousand: 1000,
  lakh: 100000, lac: 100000, lakhs: 100000, crore: 10000000, million: 1000000,
  zero: 0, shunya: 0
};

const DEVANAGARI_NUMERALS = {
  '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9
};

/** "paanch sau" → 500, "do hazaar paanch sau" → 2500, "twenty five" → 25. */
export function wordsToNumber(text) {
  if (!text) return null;
  let s = String(text).toLowerCase();

  // Devanagari digits.
  s = s.replace(/[०-९]/g, (d) => DEVANAGARI_NUMERALS[d]);

  // A bare numeral wins immediately.
  const digits = s.match(/\d+(?:[.,]\d+)?/);
  if (digits) return Number(digits[0].replace(/,/g, ''));

  const tokens = s.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let matched = false;

  for (const t of tokens) {
    if (ONES[t] !== undefined) {
      const v = ONES[t];
      matched = true;
      if (v >= 10000000) { current = (current || 1) * v; total += current; current = 0; }
      else if (v >= 1000) { current = (current || 1) * v; }
      else if (v >= 100) { current += (v * (current === 0 ? 1 : 0)) + (current === 0 ? v : 0); current = current || v; }
      else if (v === 100) { current = current === 0 ? 100 : current * 100; }
      else { current += v; }
    }
  }
  if (!matched) return null;

  // Fold any residual "hundred-multiplier" segments into the total.
  let result = 0;
  let acc = 0;
  for (const t of tokens) {
    if (ONES[t] === undefined) continue;
    const v = ONES[t];
    if (v === 100) acc = (acc || 1) * 100;
    else if (v >= 1000) { result += (acc || 1) * v; acc = 0; }
    else acc += v;
  }
  result += acc;
  return result;
}

/** Extract just the leading quantity phrase, for weights and money. */
function wordsToNumberNear(text, afterIndex) {
  const slice = text.slice(afterIndex).split(/[,\n]| aur | or /)[0] || '';
  return wordsToNumber(slice);
}

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

const GRAINS = [
  { key: 'Gehun', rx: /\b(gehun|gehu|gehoon|ghehu|gandum|wheat|godhu?mai|gehun ka)\b/i },
  { key: 'Bajra', rx: /\b(bajra|bajara|bajri|pearl millet)\b/i },
  { key: 'Makka', rx: /\b(makka|makai|makkа|maize|corn|bhutta|bhuta)\b/i },
  { key: 'Chana', rx: /\b(chana|channa|chickpea|gram)\b/i },
  { key: 'Multigrain', rx: /\b(multi ?grain|multigrain|mishra)\b/i }
];

const SEEDS = [
  { key: 'Sarson', rx: /\b(sarson|sarso|sarason|mustard|rai|rye)\b/i },
  { key: 'Til', rx: /\b(til|till|sesame)\b/i },
  { key: 'Groundnut', rx: /\b(ground ?nut|moongphali|peanut)\b/i }
];

const PAYMENT = [
  { key: 'cash', rx: /\b(nakad|naqd|cash|rok|ready)\b/i },
  { key: 'upi', rx: /\b(upi|phonepe|gpay|paytm|online|scan)\b/i },
  { key: 'credit', rx: /\b(udhar|udhaar|credit|baad|baad mein|later|khate)\b/i }
];

const MANN_KG = 40;

/**
 * Find a weight spoken entirely in words — "paanch sau kilo", "das kilo".
 *
 * The unit is *required*, deliberately. Word-numbers and names overlap badly
 * in Hinglish ("Das Rahim" is a person), so we only read a number where the
 * unit guarantees it is a weight. Bare-amount parsing ("Ramesh se paanch sau")
 * is a separate path and does not go through here.
 */
function findSpokenWeight(text) {
  const keys = Object.keys(ONES).sort((a, b) => b.length - a.length);
  const rx = new RegExp(
    `\\b(${keys.join('|')})\\b[^.,;\\n]{0,20}?\\s\\b(kilo|kilos|kg|kilogram|kilo gram|mann|man|maan|gram)\\b`,
    'i'
  );
  const m = String(text).match(rx);
  return m ? wordsToNumber(m[0]) : null;
}

function extractWeight(text) {
  // "50 kg", "paanch sau gram" is ignored (granularity too fine to matter).
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|kilogram|kilo gram|k\.?g\.?)/i);
  if (kgMatch) return Number(kgMatch[1]);

  // Mann-based: "aadha mann" = 20kg, "dedh mann" = 60kg, "do mann" = 80kg.
  const mannMatch = text.match(/(aadha|adha|dedh|dera|dhai|ek|do|teen|char|paanch|chhe|pao|\d+(?:\.\d+)?)\s*(mann|man|maan)/i);
  if (mannMatch) {
    const raw = mannMatch[1].toLowerCase();
    if (/aadha|adha/.test(raw)) return MANN_KG / 2;
    if (/dedh|dera|dhai/.test(raw)) return MANN_KG * 1.5;
    if (/pao/.test(raw)) return MANN_KG * 0.25;
    const n = wordsToNumber(raw);
    return n === null ? MANN_KG : n * MANN_KG;
  }

  // Words with a unit: "paanch sau kilo", "das mann".
  const spoken = findSpokenWeight(text);
  if (spoken !== null) return spoken;

  // Bare numeral with no unit. In a grinding context that is a bori weight —
  // the operator will not say "kg" when they mean kg.
  const bare = text.match(/\b(\d{1,4})\b/);
  if (bare) return Number(bare[1]);
  return null;
}

function extractPayment(text) {
  for (const p of PAYMENT) if (p.rx.test(text)) return p.key;
  return 'credit';
}

function extractGrain(text) {
  for (const g of GRAINS) if (g.rx.test(text)) return g.key;
  return null;
}

function extractSeed(text) {
  for (const s of SEEDS) if (s.rx.test(text)) return s.key;
  return null;
}

/** Find the customer mentioned in the utterance, by exact corpus match. */
function extractCustomer(text, customers) {
  if (!Array.isArray(customers) || customers.length === 0) return null;
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const hay = norm(text);
  // Longest name first so "Ramesh Kumar" beats "Ramesh".
  const sorted = [...customers].sort((a, b) => norm(b.name).length - norm(a.name).length);
  for (const c of sorted) {
    const n = norm(c.name);
    if (n && hay.includes(n)) return c;
  }
  // First-name fallback — "Ramesh se" when the entry is "Ramesh Kumar".
  for (const c of sorted) {
    const first = norm(c.name).split(' ')[0];
    if (first.length >= 3 && hay.includes(first)) return c;
  }
  return null;
}

/**
 * A name-shaped token the operator used that is not in the khata. Used for
 * "naya grahak" and for telling the user who we could not find.
 */
function extractUnknownName(text) {
  const cleaned = text
    .replace(/\b(naya|nayi|naya|new|grahak|customer|ka|ki|ke|ko|se|jodo|jod|add|do|kar|karo|krdo|kardo|please|haan|ji|ana|ana ji)\b/gi, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
  return words.slice(0, 2).join(' ') || null;
}

// ---------------------------------------------------------------------------
// Intent router
// ---------------------------------------------------------------------------

/**
 * Bare yes/no. Matched only when the whole utterance is the affirmation —
 * "haan ji" yes, "haan Ramesh se paanch sau" no (that is a payment, and the
 * name and amount matter more than the politeness). Getting this wrong would
 * silently confirm a wrong ledger write.
 */
const YES_RX = /^(haan|ha|han|haa|haanji|haan ji|ha ji|haji|ji haan|theek|theek hai|thik|sahi|sahi hai|bilkul|kar do|krdo|kar दे|kardo|yes|yeah|yep|ok|okay|confirm|thik hai|achha|acha|ho|hogi|karein)[\s.!?]*$/i;
const NO_RX = /^(nahi|nahin|nai|na|nahi ji|nahin ji|galat|galat hai|rehne do|rehne|ruko|ruk|no|nope|cancel|mat karo|nako)[\s.!?]*$/i;

const INTENTS = [
  {
    intent: 'confirm',
    rx: YES_RX,
    run: () => ({ args: {} })
  },
  {
    intent: 'cancel',
    rx: NO_RX,
    run: () => ({ args: {} })
  },
  {
    intent: 'new_customer',
    rx: /\b(naya|nayi|new)\b.*\b(grahak|grahak|customer|khata)\b|\bgrahak (jodo|jod|add|bana)|naya khata/i,
    run: (text, ctx) => ({
      args: {
        name: extractUnknownName(text),
        phone: (String(text).match(/\b[6-9]\d{9}\b/) || [])[0] || null,
        village: (String(text).match(/\bgaon\s+([\p{L}]+)/iu) || [])[1] || null
      }
    })
  },
  {
    intent: 'payment',
    rx: /\b(jama|jamaa|diye|diya|de diya|de diye|payment|paid|peshi|vasool|vasuli|wasool|laga|le liya|mila|mil gaye|lena|lene)\b/i,
    run: (text, ctx) => {
      const amount = wordsToNumberNear(text, 0) ?? wordsToNumber(text);
      const customer = extractCustomer(text, ctx.customers);
      const method = /upi|phonepe|gpay|paytm/i.test(text) ? 'upi'
        : /bank|transfer|neft|imps/i.test(text) ? 'bank' : 'cash';
      return { args: { customerName: customer ? customer.name : (extractUnknownName(text) || ''), amount, method } };
    }
  },
  {
    intent: 'advance',
    rx: /\b(udhar (liya|liya|li)|khate (pe|par) (diya|rakha)|credit (diya|diye)|(liya|liye) udhar)\b/i,
    run: (text, ctx) => {
      const amount = wordsToNumberNear(text, 0) ?? wordsToNumber(text);
      const customer = extractCustomer(text, ctx.customers);
      return { args: { customerName: customer ? customer.name : (extractUnknownName(text) || ''), amount } };
    }
  },
  {
    intent: 'pirai',
    rx: /\b(pirai|piraay|pirai kara|spellar|spellur|speller|tel|tail|tel nikaal|tel nikaalo|oil press|pressing)\b/i,
    run: (text, ctx) => ({
      args: {
        customerName: (extractCustomer(text, ctx.customers) || {}).name || '',
        seedType: extractSeed(text) || 'Sarson',
        weightKg: extractWeight(text),
        paymentMode: extractPayment(text),
        khariSold: /khali|khari (bech|sold)/i.test(text)
      }
    })
  },
  {
    intent: 'pisai',
    rx: /\b(pisai|pisay|pisa|pisaa|chakki|chaki|chakki kara|grind|grinding|atta|aata|dana|dalna|dal दो|dal do|boro|bori|pishai)\b/i,
    run: (text, ctx) => ({
      args: {
        customerName: (extractCustomer(text, ctx.customers) || {}).name || '',
        grainType: extractGrain(text) || 'Gehun',
        weightKg: extractWeight(text),
        paymentMode: extractPayment(text)
      }
    })
  },
  {
    intent: 'done',
    rx: /\b(ho gaya|ho gya|hogaya|ho gaye|ready|tiyar|tyar|nikal|nikal do|nikal diya|complete|done|pick up|utha)\b/i,
    run: (text, ctx) => ({
      args: {
        customerName: (extractCustomer(text, ctx.customers) || {}).name || (extractUnknownName(text) || '')
      }
    })
  },
  {
    intent: 'dues',
    rx: /\b(udhar|udhaar|bakaya|baki|bakaya|bakaya|kaun|kis|kitna|dues|outstanding|lene|lene hain|paise kaun)\b/i,
    run: () => ({ args: {} })
  },
  {
    intent: 'summary',
    rx: /\b(aaj|today|kamai|kamai|kitna|kitni|kitni pisai|summary|hisab|guna|gana|batao|bata)\b/i,
    run: () => ({ args: {} })
  },
  {
    intent: 'queue',
    rx: /\b(pending|queue|line|kaun aaya|kaun kaun|laga|lagaye|waiting)\b/i,
    run: () => ({ args: {} })
  },
  {
    intent: 'expense',
    rx: /\b(kharcha|kharch|expense|bijli|bijli|diesel|labour|mazdoor|repair|theek|theek ka)\b/i,
    run: (text) => {
      const amount = wordsToNumberNear(text, 0) ?? wordsToNumber(text);
      const cat = /bijli|electricity/i.test(text) ? 'bijli'
        : /diesel/i.test(text) ? 'diesel'
        : /labour|mazdoor|majdoor/i.test(text) ? 'labour'
        : /repair|theek/i.test(text) ? 'repair' : 'other';
      return { args: { category: cat, amount } };
    }
  },
  {
    intent: 'set_mode',
    rx: /\b(chakki (mode|pe|par)|spellar (mode|pe|par)|mode (badlo|change)|switch to)/i,
    run: (text) => ({ args: { mode: /spellar|spellur|tel|oil/i.test(text) ? 'spellar' : 'chakki' } })
  },
  {
    intent: 'ledger',
    rx: /\b(khata|ledger|history|statement|hisab|kitna diya|kitna liya)\b/i,
    run: (text, ctx) => ({
      args: { customerName: (extractCustomer(text, ctx.customers) || {}).name || (extractUnknownName(text) || '') }
    })
  },
  {
    intent: 'navigate',
    rx: /\b(kholo|khol|dikhao|dikha|dekhna|show|open) (khata|dashboard|stock|home|ghar|maal|setting)/i,
    run: (text) => {
      const screen = /khata|ledger/i.test(text) ? 'khata'
        : /stock|maal|stocks/i.test(text) ? 'stock'
        : /setting|option/i.test(text) ? 'settings'
        : 'dashboard';
      return { args: { screen } };
    }
  },
  {
    intent: 'help',
    rx: /\b(madad|help|kya kar sakte|kaise|what can you do|kya kar sakti)\b/i,
    run: () => ({ args: {} })
  }
];

/**
 * Parse one utterance.
 *
 * Returns `{ intent, args, confidence, echo }`. `confidence` is deliberately
 * coarse — 'high' | 'low' — so the caller can decide whether to confirm
 * instead of ask(). A missing required argument yields confidence 'low' with
 * `missing` naming what to ask for; the UI asks that one question, which is
 * the correct behaviour for someone who may not be able to read a long error.
 */
export function parseCommand(text, context = {}) {
  const raw = String(text || '').trim();
  if (!raw) return { intent: 'none', args: {}, confidence: 'high', echo: '' };

  const hay = raw.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const rule of INTENTS) {
    const m = hay.match(rule.rx);
    if (!m) continue;
    const score = m[0].length + (m.index === 0 ? 5 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  if (!best) {
    return { intent: 'unknown', args: {}, confidence: 'high', echo: raw };
  }

  const built = best.run(hay, context);
  const missing = requiredFor(best.intent).filter((k) => {
    const v = built.args ? built.args[k] : null;
    return v === null || v === undefined || v === '';
  });

  return {
    intent: best.intent,
    args: built.args || {},
    confidence: missing.length > 0 ? 'low' : 'high',
    missing,
    echo: raw
  };
}

const REQUIRED = {
  pisai: ['weightKg'],
  pirai: ['weightKg'],
  payment: ['customerName', 'amount'],
  advance: ['customerName', 'amount'],
  new_customer: ['name'],
  expense: ['amount'],
  done: ['customerName'],
  ledger: ['customerName']
};

function requiredFor(intent) {
  return REQUIRED[intent] || [];
}

/** Human prompts for whatever the parser could not find. */
export const MISSING_PROMPTS = {
  weightKg: 'Kitna kilo?',
  customerName: 'Kiske naam?',
  amount: 'Kitne rupaye?',
  name: 'Grahak ka naam bataiye.',
  seedType: 'Kaunsa daal/tel?'
};

export default { parseCommand, wordsToNumber };
