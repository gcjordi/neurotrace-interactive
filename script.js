const zones = [
  { name: 'Reasoning', color: '#6ee7ff', desc: 'Logical structure, comparison, and causal sequencing.' },
  { name: 'Memory', color: '#7c8cff', desc: 'Use of general knowledge patterns and scenario context.' },
  { name: 'Safety', color: '#7cffc7', desc: 'Attention to harm reduction and refusal boundaries.' },
  { name: 'Ethics', color: '#ffd36e', desc: 'Consideration of values, fairness, and responsible impact.' },
  { name: 'Planning', color: '#b77cff', desc: 'Step selection, ordering, and action design.' },
  { name: 'Creativity', color: '#ff9fd5', desc: 'Analogy, synthesis, and flexible explanation style.' },
  { name: 'Linguistic Framing', color: '#9be7ff', desc: 'Clarity, tone, audience fit, and wording choices.' },
  { name: 'Self-Monitoring', color: '#ffb86e', desc: 'Uncertainty awareness, limits, and calibration.' }
];

const desktopPositions = [[7, 8], [40, 4], [72, 8], [80, 35], [72, 68], [40, 75], [7, 68], [0, 35]];
const tabletPositions = [[4, 4], [52, 4], [4, 22], [52, 22], [4, 69], [52, 69], [4, 87], [52, 87]];
const mobilePositions = [[3, 2], [3, 14], [3, 26], [3, 38], [3, 64], [3, 76], [3, 88], [3, 100]];

const form = document.querySelector('#traceForm');
const input = document.querySelector('#promptInput');
const zonesEl = document.querySelector('#zones');
const svg = document.querySelector('.connectors');
const responseText = document.querySelector('#responseText');
const statusText = document.querySelector('#statusText');
const statusDot = document.querySelector('.status-dot');
const timeline = [...document.querySelectorAll('#timeline div')];
const coherence = document.querySelector('#coherence');
const fields = {
  dominant: document.querySelector('#dominantZone'),
  secondary: document.querySelector('#secondaryZone'),
  risk: document.querySelector('#riskLevel'),
  review: document.querySelector('#humanReview')
};

function currentPositions() {
  if (window.matchMedia('(max-width: 640px)').matches) return mobilePositions;
  if (window.matchMedia('(max-width: 980px)').matches) return tabletPositions;
  return desktopPositions;
}

function buildMap() {
  zonesEl.innerHTML = '';
  svg.innerHTML = '';
  const positions = currentPositions();

  zones.forEach((zone, index) => {
    const [left, top] = positions[index];
    const card = document.createElement('article');
    card.className = 'zone';
    card.dataset.zone = zone.name;
    card.tabIndex = 0;
    card.style.left = `${left}%`;
    card.style.top = `${top}%`;
    card.style.setProperty('--zone-color', zone.color);
    card.style.setProperty('--zone-glow', `${zone.color}33`);
    card.innerHTML = `
      <div class="zone-top"><h4>${zone.name}</h4><span class="zone-orb" aria-hidden="true"></span></div>
      <div class="meter" aria-hidden="true"><span></span></div>
      <div class="pct" aria-label="${zone.name} activation">0%</div>
      <p>${zone.desc}</p>
    `;
    zonesEl.appendChild(card);

    const x = left + (window.matchMedia('(max-width: 640px)').matches ? 45 : 10);
    const y = top + 8;
    const glow = makeLine(x, y, 'connector-glow');
    const line = makeLine(x, y, 'connector');
    glow.dataset.zone = zone.name;
    line.dataset.zone = zone.name;
    svg.append(glow, line);
  });
}

function makeLine(x, y, className) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '50%');
  line.setAttribute('y1', '50%');
  line.setAttribute('x2', `${x}%`);
  line.setAttribute('y2', `${y}%`);
  line.setAttribute('class', className);
  return line;
}

function classify(prompt) {
  const p = prompt.toLowerCase();
  const base = {
    Reasoning: 58,
    Memory: 46,
    Safety: 36,
    Ethics: 34,
    Planning: 44,
    Creativity: 38,
    'Linguistic Framing': 62,
    'Self-Monitoring': 42
  };
  let response = 'A strong answer would first clarify the user goal, identify relevant constraints, and provide a concise response that is useful while remaining transparent about assumptions and limitations.';

  const patterns = [
    {
      test: /safety|risky|jailbreak|attack|harm|exploit|danger|malware|bypass/,
      scores: { Safety: 94, Ethics: 81, 'Self-Monitoring': 79, Reasoning: 70, Planning: 61, 'Linguistic Framing': 67 },
      response: 'For a risky instruction, an AI assistant should avoid enabling harm, briefly explain the boundary, and redirect toward a safe alternative. The response should remain calm, specific, and helpful without providing operational details that could increase risk.'
    },
    {
      test: /healthcare|medical|clinical|patient|doctor|diagnosis|therapy|hospital/,
      scores: { Safety: 88, Ethics: 84, 'Self-Monitoring': 91, Reasoning: 73, Planning: 67, 'Linguistic Framing': 75 },
      response: 'A safe healthcare assistant should support understanding, encourage consultation with qualified professionals, avoid diagnosis beyond its limits, and escalate urgent symptoms. It should communicate clearly, preserve privacy, and distinguish general information from medical advice.'
    },
    {
      test: /quantum|science|technical|computing|physics|algorithm|research/,
      scores: { Reasoning: 86, Memory: 74, Creativity: 68, 'Linguistic Framing': 88, Planning: 60, 'Self-Monitoring': 53 },
      response: 'Quantum computing uses quantum bits that can represent richer states than ordinary bits. Instead of trying every answer one by one, some quantum algorithms shape probabilities so likely answers become easier to find, which may help with certain specialized problems.'
    },
    {
      test: /uncertain|uncertainty|confidence|limits|admit|unknown|calibrate/,
      scores: { 'Self-Monitoring': 95, Ethics: 72, 'Linguistic Framing': 78, Reasoning: 69, Safety: 61, Memory: 50 },
      response: 'Yes. An AI should admit uncertainty when evidence is incomplete, ambiguous, or outside its reliable scope. Clear uncertainty helps users make better decisions and prevents overconfidence from being mistaken for expertise.'
    }
  ];

  const matched = patterns.find(pattern => pattern.test.test(p));
  if (matched) {
    Object.assign(base, matched.scores);
    response = matched.response;
  }

  const texture = [...prompt].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 11;
  Object.keys(base).forEach(key => {
    const offset = Math.round(texture - 5 + (prompt.length % 7) * 0.6);
    base[key] = Math.max(18, Math.min(98, base[key] + offset));
  });

  return { scores: base, response };
}

function riskLevel(scores) {
  const safetyStack = scores.Safety + scores.Ethics + scores['Self-Monitoring'];
  if (safetyStack > 238) return ['High', 'Yes'];
  if (safetyStack > 188) return ['Medium', scores.Safety > 70 ? 'Yes' : 'No'];
  return ['Low', 'No'];
}

function reset() {
  document.querySelectorAll('.zone').forEach(zone => {
    zone.classList.remove('active');
    zone.querySelector('.meter span').style.width = '0%';
    zone.querySelector('.pct').textContent = '0%';
  });
  document.querySelectorAll('.connector, .connector-glow').forEach(line => line.classList.remove('active'));
  timeline.forEach(phase => phase.classList.remove('active'));
  fields.dominant.textContent = '—';
  fields.secondary.textContent = '—';
  fields.risk.textContent = '—';
  fields.review.textContent = '—';
  coherence.textContent = '0%';
}

function countTo(element, end, duration = 950) {
  const start = performance.now();
  function tick(now) {
    const eased = 1 - Math.pow(1 - Math.min(1, (now - start) / duration), 3);
    const value = Math.round(end * eased);
    element.textContent = `${value}%`;
    if (value < end) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function generate(prompt) {
  reset();
  statusText.textContent = 'Generating illustrative trace…';
  statusDot.classList.add('loading');
  responseText.innerHTML = '<span class="loading-text">Synthesizing local response pattern</span>';

  timeline.forEach((phase, index) => setTimeout(() => phase.classList.add('active'), index * 260));
  await new Promise(resolve => setTimeout(resolve, 1450));

  const { scores, response } = classify(prompt);
  responseText.textContent = response;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  fields.dominant.textContent = ranked[0][0];
  fields.secondary.textContent = ranked[1][0];
  [fields.risk.textContent, fields.review.textContent] = riskLevel(scores);
  countTo(coherence, Math.round(ranked.slice(0, 4).reduce((sum, item) => sum + item[1], 0) / 4), 1100);

  document.querySelectorAll('.zone').forEach((zone, index) => {
    const score = scores[zone.dataset.zone];
    setTimeout(() => {
      zone.classList.add('active');
      zone.querySelector('.meter span').style.width = `${score}%`;
      countTo(zone.querySelector('.pct'), score);
      document.querySelectorAll(`[data-zone="${CSS.escape(zone.dataset.zone)}"]`).forEach(item => item.classList.add('active'));
    }, index * 125);
  });

  statusText.textContent = 'Trace complete';
  statusDot.classList.remove('loading');
}

document.querySelectorAll('.example').forEach(button => {
  button.addEventListener('click', () => {
    input.value = button.textContent;
    input.focus();
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const prompt = input.value.trim() || 'How can an AI assistant respond helpfully while staying safe?';
  input.value = prompt;
  generate(prompt);
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildMap, 150);
});

buildMap();
