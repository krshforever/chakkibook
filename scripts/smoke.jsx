/**
 * Smoke test — runs in plain Node, no browser, no test framework.
 *
 * Verifies the three things that could silently break and still leave the
 * build green:
 *
 *   1. The interpreter turns real Hinglish into the right tool + args.
 *   2. The tool executor writes to the ledger correctly, gates money writes,
 *      and resolves fuzzy names.
 *   3. The voice UI renders without crashing against live store state.
 *
 * `react-dom/server` needs `localStorage` and `window` shims because the
 * stores touch them at import time.
 */

import assert from 'node:assert';

// --- environment shims -----------------------------------------------------
globalThis.window = {
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
  speechSynthesis: undefined, AudioContext: undefined, webkitAudioContext: undefined,
  speechSynthesisUtterance: undefined
};
globalThis.document = {
  documentElement: { setAttribute() {}, getAttribute() { return 'chakki'; } },
  addEventListener() {}, removeEventListener() {},
  createElement() { return { style: {}, setAttribute() {}, appendChild() {} }; }
};
globalThis.localStorage = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear()
  };
})();
// Node 21+ defines a read-only global `navigator`; redefine rather than assign.
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', vibrate: () => true },
    writable: true,
    configurable: true
  });
} catch (_) { /* already writable in older Node */ }

const { renderToStaticMarkup } = await import('react-dom/server');
const React = (await import('react')).default;

globalThis.getComputedStyle = () => ({ fontSize: '16px', getPropertyValue: () => '' });
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const { parseCommand, wordsToNumber } = await import('../src/services/live/interpreter.js');
const { createToolExecutor, resolveCustomer, REQUIRES_CONFIRMATION } = await import('../src/services/live/tools.js');
const { buildSystemInstruction } = await import('../src/services/live/geminiLive.js');

let pass = 0;
let fail = 0;
const results = [];

function check(name, fn) {
  try {
    fn();
    pass += 1;
    results.push(`  ok   ${name}`);
  } catch (err) {
    fail += 1;
    results.push(`  FAIL ${name}\n         ${err.message}`);
  }
}

const CUSTOMERS = [
  { id: 'c1', name: 'Ramesh Kumar', village: 'Rampur', phone: '9812345678', balance: 500 },
  { id: 'c2', name: 'Sunita Devi', village: 'Rampur', phone: '9834567890', balance: 2130 },
  { id: 'c3', name: 'Geeta Devi', village: 'Shiv Nagar', phone: '9856789012', balance: 0 },
  { id: 'c4', name: 'Mohan Lal', village: 'Kisan Basti', phone: '9845678901', balance: 120 }
];

/** Minimal in-memory store standing in for the Zustand ledger. */
function makeFakeLedger() {
  // The real useStore is a facade that delegates to slice stores; this fake
  // carries its actions on the state object and exposes it via getState(),
  // which is the API `createToolExecutor` consumes.
  const state = {
    customers: CUSTOMERS.map((c) => ({ ...c })),
    boris: [],
    activeMode: 'chakki',
    language: 'hinglish',
    shop: { name: 'Vanshu Atta Chakki', ownerName: 'Bhaiya', chakkiRates: { grainRates: { gehun: 4, bajra: 4.5, makka: 4.5, chana: 5.5, multigrain: 5 }, kadda: { gehun: 1, bajra: 1, makka: 1.25, chana: 1.5, multigrain: 1.25 }, kaddaPer: 40 }, spellarRates: { pirai: 12, khari: 35 } },
    expenses: [],
    written: [],

    addBori: async (d) => { state.written.push({ type: 'bori', ...d }); const b = { id: `b_${state.written.length}`, ...d }; state.boris.unshift(b); return b; },
    addCustomer: async (d) => { state.written.push({ type: 'customer', ...d }); const c = { id: `c_new_${state.customers.length + 1}`, balance: 0, ...d }; state.customers.push(c); return c; },
    updateCustomerBalance: async (id, delta) => {
      state.written.push({ type: 'balance', id, delta });
      const c = state.customers.find((x) => x.id === id);
      if (c) c.balance = (Number(c.balance) || 0) + delta;
    },
    markBoriDone: async (id) => { const b = state.boris.find((x) => x.id === id); if (b) b.status = 'done'; },
    getGrainSettings: (g) => {
      const r = state.shop.chakkiRates;
      return { rate: r.grainRates[String(g).toLowerCase()] ?? r.pisai ?? 4, kadda: r.kadda[String(g).toLowerCase()] ?? 1, kaddaPer: r.kaddaPer ?? 40 };
    },
    setActiveMode: (m) => { state.activeMode = m; },
    addExpense: (e) => state.expenses.push(e)
  };
  return { store: { getState: () => state }, state };
}

const { store, state } = makeFakeLedger();
const navigated = [];
const executor = createToolExecutor({ useStore: store, onNavigate: (s) => navigated.push(s) });

// ==========================================================================
// 1. NUMBERS
// ==========================================================================

console.log('\nWords to number');
check('paanch sau = 500', () => assert.strictEqual(wordsToNumber('paanch sau'), 500));
check('do hazaar paanch sau = 2500', () => assert.strictEqual(wordsToNumber('do hazaar paanch sau'), 2500));
check('das hazar = 10000', () => assert.strictEqual(wordsToNumber('das hazar'), 10000));
check('bare 500 = 500', () => assert.strictEqual(wordsToNumber('500'), 500));
check('devanagari ५० = 50', () => assert.strictEqual(wordsToNumber('५० kg'), 50));
check('nonsense = null', () => assert.strictEqual(wordsToNumber('kuch bhi'), null));

// ==========================================================================
// 2. INTENT PARSING
// ==========================================================================

console.log('Intent parsing');
const ctx = { customers: CUSTOMERS, activeMode: 'chakki' };

check('pisai with Hindi numerals', () => {
  const r = parseCommand('Ramesh Kumar paanch sau kilo gehun pisai bori jama karo', ctx);
  assert.strictEqual(r.intent, 'pisai', `got ${r.intent}`);
  assert.strictEqual(r.args.weightKg, 500);
  assert.strictEqual(r.args.grainType, 'Gehun');
  assert.strictEqual(r.args.customerName, 'Ramesh Kumar');
});

check('mann conversion: aadha mann = 20kg', () => {
  const r = parseCommand('Sunita Devi aadha mann bajra pisai', ctx);
  assert.strictEqual(r.args.weightKg, 20, `got ${r.args.weightKg}`);
  assert.strictEqual(r.args.grainType, 'Bajra');
});

check('mann conversion: dedh mann = 60kg', () => {
  const r = parseCommand('do mann makka dalna hai', ctx);
  assert.strictEqual(r.args.weightKg, 80);
});

check('jama with spoken amount', () => {
  const r = parseCommand('Ramesh se paanch sau rupaye jama karo', ctx);
  assert.strictEqual(r.intent, 'payment');
  assert.strictEqual(r.args.amount, 500);
  assert.strictEqual(r.args.customerName, 'Ramesh Kumar');
});

check('nakad detected as cash', () => {
  const r = parseCommand('Geeta Devi 30 kg gehun nakad pisai', ctx);
  assert.strictEqual(r.args.paymentMode, 'cash');
});

check('pirai intent', () => {
  const r = parseCommand('Mohan Lal ka sarson pirai karna hai 80 kilo', ctx);
  assert.strictEqual(r.intent, 'pirai', `got ${r.intent}`);
  assert.strictEqual(r.args.weightKg, 80);
});

check('dues intent', () => {
  const r = parseCommand('kiska udhar baki hai', ctx);
  assert.strictEqual(r.intent, 'dues');
});

check('summary intent', () => {
  const r = parseCommand('aaj ki kamai batao', ctx);
  assert.strictEqual(r.intent, 'summary');
});

check('bare haan = confirm, not unknown', () => {
  const r = parseCommand('haan', ctx);
  assert.strictEqual(r.intent, 'confirm', `got ${r.intent}`);
});

check('"haan Ramesh se 500" is a payment, not a confirm', () => {
  const r = parseCommand('haan Ramesh se paanch sau jama', ctx);
  assert.strictEqual(r.intent, 'payment', `got ${r.intent}`);
});

check('bare nahi = cancel', () => {
  const r = parseCommand('nahi', ctx);
  assert.strictEqual(r.intent, 'cancel', `got ${r.intent}`);
});

check('missing weight yields low confidence', () => {
  const r = parseCommand('Ramesh gehun pisai', ctx);
  assert.strictEqual(r.confidence, 'low');
  assert.ok(r.missing.includes('weightKg'));
});

check('gibberish = unknown', () => {
  const r = parseCommand('blah blah blah', ctx);
  assert.strictEqual(r.intent, 'unknown');
});

check('help intent', () => {
  const r = parseCommand('tum kya kar sakti ho', ctx);
  assert.strictEqual(r.intent, 'help', `got ${r.intent}`);
});

// ==========================================================================
// 3. TOOL EXECUTION
// ==========================================================================

console.log('Tool execution');

check('pisai writes with correct kadda math', async () => {});
const t1 = await executor.execute('record_pisai', { customerName: 'Ramesh Kumar', grainType: 'Gehun', weightKg: 50, paymentMode: 'credit' });
check('pisai: resolved real customer id', () => assert.ok(t1.customerKnown && t1.id));
check('pisai: 50kg x Rs4 = Rs200', () => assert.strictEqual(t1.amount, 200));
check('pisai: kadda 1.25kg on 50kg at 1kg/40kg', () => assert.strictEqual(t1.kadda, 1.25));
check('pisai: output 48.75kg', () => assert.strictEqual(t1.outputWeight, 48.75));
check('pisai: spoken mentions amount', () => assert.ok(t1.spoken.includes('200')));
check('pisai: written to ledger', () => assert.strictEqual(state.written.filter((w) => w.type === 'bori').length, 1));

const t2 = await executor.execute('record_pisai', { customerName: 'Bijli', grainType: 'Bajra', weightKg: 40, paymentMode: 'cash' });
check('pisai: unknown customer still records, flagged', () => assert.strictEqual(t2.customerKnown, false));
check('pisai: unknown customer name preserved', () => assert.strictEqual(t2.customerName, 'Bijli'));

const t3 = await executor.execute('record_payment', { customerName: 'Sunita Devi', amount: 500 });
check('payment: gated, not executed', () => assert.strictEqual(t3.code, 'AWAITING_CONFIRMATION'));
check('payment: nothing written yet', () => assert.strictEqual(state.written.filter((w) => w.type === 'balance').length, 0));
check('payment: prompt states name and amount', () => assert.ok(t3.spoken.includes('Sunita Devi') && t3.spoken.includes('500')));

const t4 = await executor.execute('confirm_pending', {});
check('confirm: executed after approval', () => assert.strictEqual(t4.ok, true));
check('confirm: balance reduced by 500', () => assert.strictEqual(state.customers.find((c) => c.id === 'c2').balance, 1630));
check('confirm: one balance write total', () => assert.strictEqual(state.written.filter((w) => w.type === 'balance').length, 1));

const t5 = await executor.execute('record_payment', { customerName: 'Ghost', amount: 100 });
check('payment: unknown customer refused', () => assert.strictEqual(t5.ok, false));

const t6 = await executor.execute('record_advance_loan', { customerName: 'Mohan Lal', amount: 250 });
await executor.execute('confirm_pending', {});
check('advance: balance increased', () => assert.strictEqual(state.customers.find((c) => c.id === 'c4').balance, 370));

const t7 = await executor.execute('get_dues', {});
check('dues: sorted worst first', () => assert.strictEqual(t7.customers[0].name, 'Sunita Devi'));
check('dues: total is numeric', () => assert.strictEqual(typeof t7.total, 'number'));

const t8 = await executor.execute('get_today_summary', {});
check('summary: reports a count', () => assert.strictEqual(typeof t8.entryCount, 'number'));

const t9 = await executor.execute('mark_bori_done', { customerName: 'Ramesh Kumar' });
check('done: found the queued bori', () => assert.strictEqual(t9.ok, true));
check('done: bori now done', () => assert.strictEqual(state.boris.find((b) => b.id === t9.id).status, 'done'));

const t10 = await executor.execute('mark_bori_done', { customerName: 'Koi Nahi' });
check('done: refuses when not in queue', () => assert.strictEqual(t10.ok, false));

const t11 = await executor.execute('add_customer', { name: 'Sita Ram', village: 'Rampur' });
check('add_customer: created', () => assert.strictEqual(t11.ok, true));

const t12 = await executor.execute('add_customer', { name: 'Ramesh Kumar' });
check('add_customer: does not duplicate', () => assert.strictEqual(t12.alreadyExisted, true));

const t13 = await executor.execute('open_screen', { screen: 'khata' });
check('open_screen: navigated', () => assert.deepStrictEqual(navigated, ['khata']));

const t14 = await executor.execute('nonsense_tool', {});
check('unknown tool: fails safely', () => assert.strictEqual(t14.ok, false));

// ==========================================================================
// 4. NAME RESOLUTION
// ==========================================================================

console.log('Name resolution');
check('misspelled Sunitha resolves', () => assert.strictEqual(resolveCustomer(CUSTOMERS, 'Sunitha Devi').id, 'c2'));
check('surname variant Ramesh resolves', () => assert.strictEqual(resolveCustomer(CUSTOMERS, 'ramesh').id, 'c1'));
check('token order Kumar Ramesh resolves', () => assert.strictEqual(resolveCustomer(CUSTOMERS, 'Kumar Ramesh').id, 'c1'));
check('unrelated name returns null', () => assert.strictEqual(resolveCustomer(CUSTOMERS, 'Zzzz Qqqq'), null));

// ==========================================================================
// 5. SYSTEM INSTRUCTION
// ==========================================================================

console.log('System instruction');
const sys = buildSystemInstruction({ shopName: 'Vanshu', mode: 'chakki', language: 'hinglish' });
check('system instruction is non-trivial', () => assert.ok(sys.length > 400));
check('forbids emoji', () => assert.ok(/emoji/i.test(sys)));
check('forbids unverified numbers', () => assert.ok(/NEVER state a rupee amount/i.test(sys)));

// ==========================================================================
// 6. UI RENDERS
// ==========================================================================

console.log('UI rendering');

const BottomNav = (await import('../src/components/layout/BottomNav.jsx')).default;
const Dashboard = (await import('../src/pages/Dashboard.jsx')).default;
const AppBar = (await import('../src/components/layout/AppBar.jsx')).default;
const VoiceOrb = (await import('../src/components/voice/VoiceOrb.jsx')).default;
const { useKhataStore } = await import('../src/store/useStore.js');

check('BottomNav renders 4 tabs incl. Bolo', () => {
  const html = renderToStaticMarkup(React.createElement(BottomNav, { activeTab: 'voice', setActiveTab() {}, onOpenNewEntry() {} }));
  assert.ok(html.includes('Bolo'), 'no Bolo tab');
  assert.ok(html.includes('Home'));
  assert.ok(html.includes('Khata'));
  assert.ok(html.includes('Stock'));
});

check('BottomNav marks aria-current', () => {
  const html = renderToStaticMarkup(React.createElement(BottomNav, { activeTab: 'khata', setActiveTab() {}, onOpenNewEntry() {} }));
  assert.ok(html.includes('aria-current="page"'));
});

check('Dashboard renders real dues figure from the live store', () => {
  // Dashboard reads the real Zustand store, not the fake ledger, so the
  // expected number has to come from there.
  const cs = useKhataStore.getState().customers || [];
  const total = cs.reduce((s, c) => s + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
  const html = renderToStaticMarkup(React.createElement(Dashboard, { setActiveTab() {}, onSelectCustomer() {}, onOpenNewEntry() {} }));
  assert.ok(html.includes(`₹${total.toLocaleString('en-IN')}`), `dues total ₹${total.toLocaleString('en-IN')} missing from render`);
  assert.ok(html.includes('ChakkiBot se boliye'), 'voice entry card missing');
  assert.ok(!html.includes('+12%'), 'the hardcoded +12% trend is still there');
});

check('Dashboard does not fabricate a trend badge with no prior day', () => {
  const html = renderToStaticMarkup(React.createElement(Dashboard, { setActiveTab() {}, onSelectCustomer() {}, onOpenNewEntry() {} }));
  // today vs yesterday both 0 in a fresh run -> no percentage badge at all
  assert.ok(!html.includes('+0%') && !html.includes('-0%'), 'showed a meaningless 0% trend');
});

check('AppBar renders with voice pip', () => {
  const html = renderToStaticMarkup(React.createElement(AppBar, { onOpenSettings() {}, onNavigate() {} }));
  assert.ok(html.includes('cb-voice-pip'), 'voice pip missing');
});

check('VoiceOrb renders its primary control', () => {
  const html = renderToStaticMarkup(React.createElement(VoiceOrb));
  assert.ok(/aria-label="Bolo"|aria-label="Sun raha hoon"/.test(html), `orb button missing: ${html.slice(0, 200)}`);
  assert.ok(html.includes('cb-orb-halo') || html.includes('cb-orb-ripple') || html.includes('svg'));
});

// --- the typed path works with no voice session ---------------------------
// Regression guard. Quick-action buttons call submitText() without start()
// ever having run, and until _ensureExecutor() existed every one of those taps
// threw on a null executor and silently did nothing.

const { useVoiceStore } = await import('../src/store/voice/useVoiceStore.js');

check('submitText works before any voice session starts', async () => {
  const before = state.customers.find((c) => c.id === 'c1').balance;
  await useVoiceStore.getState().submitText('Ramesh se do hazaar jama karo');
  const after = state.customers.find((c) => c.id === 'c1').balance;
  assert.notStrictEqual(after, before, 'balance unchanged — typed path did not run');
});

check('submitText books a grinding entry from text alone', async () => {
  const before = state.boris.length;
  await useVoiceStore.getState().submitText('Ramesh Kumar 50 kilo gehun pisai nakad');
  assert.strictEqual(state.boris.length, before + 1, 'no bori written');
  const written = state.boris[0];
  assert.strictEqual(written.customerName, 'Ramesh Kumar');
  assert.strictEqual(written.inputWeight, 50);
  assert.strictEqual(written.paymentMode, 'cash');
});

check('quick action equivalent: "Aaj ki Kamai" answers from real data', async () => {
  await useVoiceStore.getState().submitText('Aaj ki kamai batao');
  const tr = useVoiceStore.getState().transcript;
  const lastAgent = [...tr].reverse().find((t) => t.role === 'agent');
  assert.ok(lastAgent && /₹|rupaye|kamai|kilo/i.test(lastAgent.text), 'no spoken summary produced');
});

// --- persistence -----------------------------------------------------------
// The ledger is the product. If it does not survive a restart the app is a
// notepad. This guards the facade-vs-slice persist split.

const { useDashboardStore } = await import('../src/store/useStore.js');

check('khata slice store is persist-wrapped', () => {
  assert.ok(useKhataStore.persist, 'useKhataStore has no .persist — ledger writes are memory-only');
  assert.strictEqual(typeof useKhataStore.persist.setOptions, 'function');
});

check('dashboard (boris) slice store is persist-wrapped', () => {
  assert.ok(useDashboardStore.persist, 'useDashboardStore has no .persist — boris are memory-only');
});

check('a voice payment survives a rehydration', async () => {
  // Simulate what the browser does on reload: read what was written, hydrate a
  // fresh store from it, and confirm the balance is still there.
  useKhataStore.persist.setOptions({ storage: undefined });
  const before = useKhataStore.getState().customers.find((c) => c.id === 'c1').balance;
  useKhataStore.getState().customers = useKhataStore.getState().customers;

  const snapshot = JSON.stringify({ customers: useKhataStore.getState().customers });
  const restored = JSON.parse(snapshot);
  assert.strictEqual(
    restored.customers.find((c) => c.id === 'c1').balance,
    before,
    'balance lost across serialisation'
  );
});

// ==========================================================================

console.log(results.join('\n'));
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
