// Leonida Platinum — boot, filters, checklist, guide pane, roadmap, missables,
// progress views. All data comes from data/trophies.json; all external links are
// rendered from that JSON at runtime (the app itself fetches nothing).
import {
  STORAGE_KEY,
  loadState,
  saveState,
  isEarned,
  toggleEarned,
  progressOf,
  bumpProgress,
  earnedCount,
  importState,
  exportState,
} from './store.js';

const STAGES = [
  { n: 0, title: 'Before you start', advice: 'Spoiler mode ON, save discipline: a manual save at the start of every chapter and one untouched save before the final mission. 15 manual slots plus 1 autosave. No mission replay, no New Game Plus — and cheats switch trophies and saving off on the trophy save.' },
  { n: 1, title: 'Chapter 1', advice: 'Gone Fishing, then Just Like Paradise and Paradise Lost. Do Lucia\u2019s balcony meditation NOW (Positive Mental Attitude — the one missable). Beat Cal at fishing (Baited My Tackle) and finish one arcade game (Stick Fiddler).' },
  { n: 2, title: 'Chapter 2', advice: 'Chapter trophy; Jason and Lucia are both playable now, so the partner trophies open up (Hot Together, Retail Therapy). Kingpin Bowling (Let\u2019s Go Bowling, bring Sticky Bombs); garages open via Daily Driver (Little Boxes); Scooter Bros via Moses (On the Spot). Start WAiNK scans, vehicle discovery and meditation spots with your partner along.' },
  { n: 3, title: 'Chapter 3', advice: 'Chapter trophy; the Snap Gun from Yasmani\u2019s Jewelry Jobs opens jewelry robberies (Sneakthief). Race Against Yago the moment it appears — it is time-sensitive. Rob three shops with your partner (Retail Therapy).' },
  { n: 4, title: 'Chapter 4', advice: 'Chapter trophy; That\u2019s Where The Money Is opens the bank vaults (Maximum Withdrawal, five vaults — bring your partner, and escaping one earns Hot Together). Rob an armored truck (A Classic Blitz Play) and one illegal operation per gang (Pest Control).' },
  { n: 5, title: 'Side stories', advice: 'All six finales stay open after the credits: Andy, Kenton, Billy, Randy, Tyrone and Bret. Strangers & Freaks needs 8 strands — Andy\u2019s, Billy\u2019s and Tyrone\u2019s strands do NOT count, they have their own trophies.' },
  { n: 6, title: 'The 100% grind', advice: 'Post-story checklist: 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 8 vaults, all 39 illegal operations, 3 card sets, 100 WAiNK scans, 18 meditation spots, 42 shooting-range golds, 14 drone races, 52 areas, 500 Criminal Profile actions, $250k laundered, $100k spent, 8 garages, 10 Scooter Bros registrations — then A Long Road (gold).' },
  { n: 7, title: 'Finale', advice: 'Untouched save, then the final mission (gold) — and Vice Got a Price! follows with it.' },
];

const KIND_LABELS = {
  story: 'Story',
  'side-story': 'Side story',
  collectible: 'Collectible',
  activity: 'Activity',
  robbery: 'Robbery',
  misc: 'Misc',
  completion: 'Completion',
  platinum: 'Platinum',
};

let trophies = [];
let allSources = [];
let state = loadState();
let selectedId = null;

const $ = (id) => document.getElementById(id);
const els = {
  earnedCount: $('earnedCount'),
  progressFill: $('progressFill'),
  platinumPct: $('platinumPct'),
  gradeLine: $('gradeLine'),
  searchBox: $('searchBox'),
  kindFilter: $('kindFilter'),
  gradeFilter: $('gradeFilter'),
  statusFilter: $('statusFilter'),
  spoilerToggle: $('spoilerToggle'),
  spoilerToggle2: $('spoilerToggle2'),
  countLine: $('countLine'),
  trophyList: $('trophyList'),
  guidePane: $('guidePane'),
  nextUp: $('nextUp'),
  stageList: $('stageList'),
  missGrid: $('missGrid'),
  gradeCard: $('gradeCard'),
  kindCard: $('kindCard'),
  psnCard: $('psnCard'),
  aboutSources: $('aboutSources'),
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function sourceLink(source) {
  const a = el('a', null, source.name);
  a.href = source.url;
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}

function masked(trophy) {
  return state.spoiler && trophy.story && !isEarned(state, trophy);
}

function visibleTrophies() {
  const q = els.searchBox.value.trim().toLowerCase();
  const kind = els.kindFilter.value;
  const grade = els.gradeFilter.value;
  const status = els.statusFilter.value;
  return trophies.filter((t) => {
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !isEarned(state, t)) return false;
    if (status === 'remaining' && isEarned(state, t)) return false;
    if (kind === 'missable' && !t.missable && !t.missable_note) return false;
    if (kind === 'online') return false;
    if (kind !== 'all' && kind !== 'missable' && !t.kind.includes(kind)) return false;
    return true;
  });
}

function renderHeader() {
  const earned = earnedCount(state, trophies);
  els.earnedCount.textContent = earned;
  els.progressFill.style.width = `${(earned / trophies.length) * 100}%`;
  els.platinumPct.textContent = `${Math.round((earned / trophies.length) * 100)}% to platinum`;
  const byGrade = (g) => trophies.filter((t) => t.grade === g && isEarned(state, t)).length;
  const totals = (g) => trophies.filter((t) => t.grade === g).length;
  els.gradeLine.textContent =
    `Platinum ${byGrade('platinum')}/${totals('platinum')} · Gold ${byGrade('gold')}/${totals('gold')} · Silver ${byGrade('silver')}/${totals('silver')} · Bronze ${byGrade('bronze')}/${totals('bronze')}`;
}

function renderList() {
  const shown = visibleTrophies();
  els.trophyList.replaceChildren();
  const earned = earnedCount(state, trophies);
  els.countLine.textContent =
    els.kindFilter.value === 'online'
      ? 'No online trophies in this list — every one of the 55 is single-player.'
      : `Showing ${shown.length} of ${trophies.length} trophies · ${earned} earned`;
  if (shown.length === 0) {
    const empty = el('div', 'empty', els.kindFilter.value === 'online'
      ? 'No online trophies in this list. Every trophy here is earned in single-player.'
      : 'No trophies match these filters. Clear the search or widen the filters.');
    els.trophyList.appendChild(empty);
    return;
  }
  for (const t of shown) {
    const row = el('button', 'row' + (isEarned(state, t) ? ' earned' : '') + (t.id === selectedId ? ' selected' : ''));
    row.type = 'button';
    row.setAttribute('role', 'listitem');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, t);
    box.setAttribute('aria-label', `Mark ${masked(t) ? 'hidden story trophy' : t.name} earned`);
    box.addEventListener('click', (ev) => ev.stopPropagation());
    box.addEventListener('change', () => {
      toggleEarned(state, t);
      renderAll();
    });
    row.appendChild(box);
    const mid = el('div');
    const name = el('div', 'rname', masked(t) ? 'Hidden story trophy' : t.name);
    mid.appendChild(name);
    mid.appendChild(el('div', 'rdesc', masked(t)
      ? 'Earn it to reveal — story trophies stay hidden while spoiler mode is on.'
      : t.description));
    const tags = el('div', 'rtags');
    if (t.hidden) tags.appendChild(el('span', 'tag hiddenb', 'Hidden'));
    if (t.missable) tags.appendChild(el('span', 'tag miss', 'Missable'));
    else if (t.missable_note) tags.appendChild(el('span', 'tag miss', 'Time-sensitive'));
    for (const k of t.kind) tags.appendChild(el('span', 'tag', KIND_LABELS[k] || k));
    mid.appendChild(tags);
    if (t.psn_count) {
      const stepper = el('div', 'stepper');
      const minus = el('button', null, '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', `Decrease progress for ${t.name}`);
      minus.addEventListener('click', (ev) => { ev.stopPropagation(); bumpProgress(state, t, -1); renderAll(); });
      const plus = el('button', null, '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Increase progress for ${t.name}`);
      plus.addEventListener('click', (ev) => { ev.stopPropagation(); bumpProgress(state, t, 1); renderAll(); });
      const n = progressOf(state, t);
      const count = el('span', 'pcount' + (n >= t.psn_count ? ' done' : ''), `${n} / ${t.psn_count.toLocaleString()}`);
      stepper.append(minus, count, plus);
      mid.appendChild(stepper);
    }
    row.appendChild(mid);
    const badge = el('span', `grade ${t.grade}`, t.grade);
    row.appendChild(badge);
    row.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    els.trophyList.appendChild(row);
  }
}

function renderGuide() {
  const pane = els.guidePane;
  pane.replaceChildren();
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    pane.appendChild(el('p', 'placeholder', 'Select a trophy to read its guide, its sources and any missable warning.'));
    return;
  }
  pane.appendChild(el('span', `grade ${t.grade}`, t.grade));
  if (masked(t)) {
    pane.appendChild(el('h2', null, 'Hidden story trophy'));
    pane.appendChild(el('p', 'gdesc', 'Spoiler mode is on.'));
    pane.appendChild(el('p', 'gtext', 'This is a story trophy. Turn spoiler mode off, or mark it earned, to read its name, description and guide.'));
    return;
  }
  pane.appendChild(el('h2', null, t.name));
  pane.appendChild(el('p', 'gdesc', t.description));
  if (t.missable_note) {
    const warn = el('div', 'warnbox');
    warn.appendChild(el('b', null, t.missable ? 'Missable — read this first. ' : 'Time-sensitive. '));
    warn.appendChild(document.createTextNode(t.missable_note));
    pane.appendChild(warn);
  }
  if (/No confirmed unlock method/.test(t.guide)) {
    const note = el('div', 'noticebox');
    note.appendChild(el('b', null, 'Method unconfirmed at launch. '));
    note.appendChild(document.createTextNode('No guide has confirmed how this pops yet — the description above is the only hint.'));
    pane.appendChild(note);
  }
  pane.appendChild(el('p', 'gtext', t.guide));
  const srcs = el('div', 'srcs');
  srcs.appendChild(el('b', null, 'Sources:'));
  for (const s of t.sources) srcs.appendChild(sourceLink(s));
  pane.appendChild(srcs);
  const meta = [];
  if (t.hidden) meta.push('Hidden trophy');
  if (t.psn_count) meta.push(`PSN tracks ${progressOf(state, t)} / ${t.psn_count.toLocaleString()}`);
  meta.push(`Roadmap stage ${t.roadmap_stage}`);
  if (isEarned(state, t)) meta.push(`Earned ${state.earned[t.name] || ''}`);
  pane.appendChild(el('p', 'gmeta', meta.join(' · ')));
}

function renderRoadmap() {
  const next = trophies
    .filter((t) => !isEarned(state, t))
    .sort((a, b) => a.roadmap_stage - b.roadmap_stage || a.id - b.id)[0];
  els.nextUp.replaceChildren();
  if (!next) {
    els.nextUp.appendChild(el('h2', null, 'Platinum complete'));
    els.nextUp.appendChild(el('p', null, 'Every trophy is earned — Vice Got a Price! is yours.'));
  } else {
    els.nextUp.appendChild(el('h2', null, 'Next up'));
    const stage = STAGES[next.roadmap_stage];
    els.nextUp.appendChild(el('p', null,
      `${masked(next) ? 'Hidden story trophy' : next.name} — ${stage.title} (stage ${next.roadmap_stage}).`));
    const btn = el('button', null, 'Open its guide');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      els.searchBox.value = '';
      els.kindFilter.value = 'all';
      els.gradeFilter.value = 'all';
      els.statusFilter.value = 'all';
      selectedId = next.id;
      switchView('checklist');
      renderAll();
      document.querySelector('.guide')?.scrollIntoView({ block: 'nearest' });
    });
    els.nextUp.appendChild(btn);
  }
  els.stageList.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.roadmap_stage === stage.n);
    const done = members.filter((t) => isEarned(state, t)).length;
    const card = el('div', 'stage' + (done === members.length && members.length > 0 ? ' done' : ''));
    const h = el('h2');
    h.appendChild(el('span', null, `Stage ${stage.n} — ${stage.title}`));
    h.appendChild(el('span', 'scount', `${done} / ${members.length} earned`));
    card.appendChild(h);
    card.appendChild(el('p', 'sadvice', stage.advice));
    const chips = el('div', 'chips');
    for (const t of members) {
      const chip = el('button', 'chip' + (isEarned(state, t) ? ' earned' : '') + (masked(t) ? ' masked' : ''),
        masked(t) ? 'Hidden story trophy' : t.name);
      chip.type = 'button';
      chip.addEventListener('click', () => {
        selectedId = t.id;
        switchView('checklist');
        renderAll();
      });
      chips.appendChild(chip);
    }
    card.appendChild(chips);
    els.stageList.appendChild(card);
  }
}

function renderMissables() {
  els.missGrid.replaceChildren();
  const risk = el('div', 'card risk');
  risk.appendChild(el('div', 'kicker', 'Confirmed risk · 1 trophy'));
  risk.appendChild(el('h2', null, 'Positive Mental Attitude — the only missable'));
  risk.appendChild(el('p', null, 'Meditate at all 18 spots across Leonida. The danger is one spot: Lucia\u2019s balcony meditation in Chapter 1. After Lucia is home, check the kitchen in the morning (a morning after the mission Down to Earth is the usual time); she heads to the balcony of Jason\u2019s house to meditate — follow her and accept the optional task. It is gone once Chapter 1 ends.'));
  risk.appendChild(el('p', null, 'It is not confirmed that the trophy strictly needs the balcony spot — do it anyway, and keep a Chapter 1 save until the trophy pops. GTABase and PowerPyx both flag this as the only trophy that may be missable. There is no mission replay and no New Game Plus at launch, so a missed spot can force a second playthrough.'));
  const time = el('div', 'card time');
  time.appendChild(el('div', 'kicker', 'Time-sensitive · not confirmed missable'));
  time.appendChild(el('h2', null, 'Race Against Yago (Chapter 3)'));
  time.appendChild(el('p', null, 'Yago\u2019s street-racing strand appears in Chapter 3 with an hourglass icon. Do it the moment it appears — the strand counts toward Strangers & Freaks. Save first, then race. Flagged as time-sensitive, NOT as a confirmed missable.'));
  const wide = el('div', 'card wide');
  wide.appendChild(el('h2', null, 'Everything else stays available after the credits'));
  wide.appendChild(el('p', null, 'All six side-story finales and the whole 100% checklist stay open once the story is done. The 100% checklist itself only appears after the story (Progress, then Stats, then 100% Completion) — but work done earlier still counts.'));
  wide.appendChild(el('p', null, 'Save discipline: a manual save at the start of every chapter, plus one untouched save before the final mission. You get 15 manual slots and 1 autosave. And remember: cheats switch trophies and saving off, so keep them off the trophy save.'));
  wide.appendChild(el('p', 'gmeta', state.spoiler
    ? 'Spoiler mode is ON — story trophies stay hidden in the Checklist until earned.'
    : 'Spoiler mode is OFF — story trophies are shown in the Checklist.'));
  els.missGrid.append(risk, time, wide);
}

function kvRow(label, value) {
  const row = el('div', 'kv');
  row.appendChild(el('span', null, label));
  row.appendChild(el('b', null, value));
  return row;
}

function renderProgress() {
  const gradeCard = els.gradeCard;
  gradeCard.replaceChildren();
  gradeCard.appendChild(el('h2', null, 'By grade'));
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && isEarned(state, t)).length;
    gradeCard.appendChild(kvRow(g[0].toUpperCase() + g.slice(1), `${got} / ${total}`));
  }
  const kindCard = els.kindCard;
  kindCard.replaceChildren();
  kindCard.appendChild(el('h2', null, 'By kind'));
  for (const k of ['story', 'side-story', 'collectible', 'activity', 'robbery', 'misc', 'completion']) {
    const total = trophies.filter((t) => t.kind.includes(k)).length;
    if (!total) continue;
    const got = trophies.filter((t) => t.kind.includes(k) && isEarned(state, t)).length;
    kindCard.appendChild(kvRow(KIND_LABELS[k], `${got} / ${total}`));
  }
  const counted = trophies.filter((t) => t.psn_count);
  const doneSteps = counted.reduce((s, t) => s + progressOf(state, t), 0);
  const totalSteps = counted.reduce((s, t) => s + t.psn_count, 0);
  const psnCard = els.psnCard;
  psnCard.replaceChildren();
  psnCard.appendChild(el('h2', null, 'PSN progress counters'));
  psnCard.appendChild(kvRow('All counted steps', `${doneSteps.toLocaleString()} / ${totalSteps.toLocaleString()}`));
  for (const t of counted) {
    const n = progressOf(state, t);
    if (n > 0) psnCard.appendChild(kvRow(masked(t) ? 'Hidden story trophy' : t.name, `${n} / ${t.psn_count.toLocaleString()}`));
  }
  els.aboutSources.replaceChildren();
  for (const s of allSources) els.aboutSources.appendChild(sourceLink(s));
}

function renderAll() {
  renderHeader();
  renderList();
  renderGuide();
  renderRoadmap();
  renderMissables();
  renderProgress();
}

function switchView(name) {
  for (const btn of document.querySelectorAll('.tabs button')) {
    const active = btn.dataset.view === name;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
}

function setSpoiler(on) {
  state.spoiler = on;
  saveState(state);
  els.spoilerToggle.checked = on;
  els.spoilerToggle2.checked = on;
  renderAll();
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  allSources = data.sources || [];
  for (const btn of document.querySelectorAll('.tabs button')) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
  for (const ev of ['input', 'change']) {
    els.searchBox.addEventListener(ev, renderAll);
    els.kindFilter.addEventListener(ev, renderAll);
    els.gradeFilter.addEventListener(ev, renderAll);
    els.statusFilter.addEventListener(ev, renderAll);
  }
  els.spoilerToggle.addEventListener('change', () => setSpoiler(els.spoilerToggle.checked));
  els.spoilerToggle2.addEventListener('change', () => setSpoiler(els.spoilerToggle2.checked));
  els.spoilerToggle.checked = state.spoiler;
  els.spoilerToggle2.checked = state.spoiler;
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('importFile').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    const msg = $('importMsg');
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const result = importState(state, trophies, parsed);
      msg.textContent = `Imported ${result.keptEarned} earned trophies and ${result.keptProgress} progress counters. Unknown names were skipped.`;
      renderAll();
    } catch {
      msg.textContent = 'That file could not be read as a progress export.';
    }
    ev.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Reset all progress? This clears every earned trophy and counter in this browser.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    selectedId = null;
    els.spoilerToggle.checked = state.spoiler;
    els.spoilerToggle2.checked = state.spoiler;
    renderAll();
  });
  renderAll();
}

boot();
