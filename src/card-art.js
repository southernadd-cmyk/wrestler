const icons = { Attack: '◆', Guard: '⬟', Charge: '✦', Special: '✸' };

export function typeIcon(type) {
  return `<span class="type-icon" aria-hidden="true">${icons[type]}</span>`;
}

// Each panel uses its own pose and motion marks. Coordinates are in the same
// ring-side frame so the cards read as a set when laid out in the hand.
const plates = {
  'Palm Thrust': [2, 'M66 28h32m-24 8h20', 'hand'],
  'Belt Drive': [3, 'M64 40h31l-8-5m-16 12h21', 'pair'],
  'Belt Grip': [1, 'M53 36q13-13 27 0m-21 3h15', 'pair'],
  'Plant Feet': [0, 'M28 53l-10 5m48-5 11 5M19 61h62'],
  'Sidestep': [-2, 'M66 24q32 12 12 33l-3-8m1 8 9-1'],
  'Gather Spirit': [0, 'M23 32q6-18 26-17m24 5q15 12 4 29M25 46q16 13 32 3'],
  'Thunder Palm': [4, 'M65 34l11-12 2 9 17-8-9 13 13 4-24 4', 'hand'],
  'Comet Throw': [1, 'M29 27Q54 0 87 14l-8 5', 'throw'],
  'Mountain Anchor': [0, 'M17 49 37 13l13 20 13-10 23 26'],
  'Storm Step': [-3, 'M13 28l15 6-10 7 12 4m40-24q27 11 13 29'],
  'Flash Breath': [0, 'M65 26h20m-15 6h24m-25 6h10'],
  'Low Charge': [5, 'M12 47h19M16 54h15m37-4h27', 'hand'],
  'Aftershock': [-1, 'M18 59 28 48l9 7 10-5 8 9 15-6 12 6m-62-40 5 6m52-6-5 6'],
  'Slip and Turn': [-4, 'M69 19q30 12 14 36l-9-3m9 3 5-8'],
  'Rolling Palm': [3, 'M63 22q21-10 28 3m-21 5q21-10 28 3', 'hand'],
  'Breaking Wave': [4, 'M66 48q9-29 29-29l-12 12 14 4-14 7', 'hand'],
  'Driving Palm': [4, 'M66 28h33m-29 8h24m-17 7h19', 'hand'],
  'Stone Feet': [0, 'M18 56h18l5 5h21l5-5h16M24 49l5-5m42 1 5 4'],
  'Deep Focus': [0, 'M20 36q0-24 31-24t30 24-30 23-31-23m8 0q0-16 23-16t23 16'],
};

export function cardArt(name) {
  const [lean, marks, pose] = plates[name];
  const partner = pose === 'pair' || pose === 'throw';
  const head = 45 + lean * 2;
  const reach = pose === 'hand' ? 70 : partner ? 64 : 58;
  return `<svg class="card-art" viewBox="0 0 100 68" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <circle cx="53" cy="31" r="20" fill="#ae4938" opacity=".16"/>
    <path d="M7 60Q51 52 94 60" fill="none" stroke="#966e45" stroke-width="1"/>
    <path d="${marks}" fill="none" stroke="#9d3828" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    ${partner ? `<g transform="${pose === 'throw' ? 'translate(78 30) rotate(130)' : 'translate(74 37)'}" fill="#735e4d">
      <ellipse cy="4" rx="10" ry="14"/><circle cy="-12" r="6"/><path d="M-7 12l-4 9h8l3-8m4-1 6 8h6l-5-11"/>
    </g>` : ''}
    <path d="M36 40q-4 7-10 14l12 2 9-10 8 9 12-2-10-14" fill="#3c281f"/>
    <ellipse cx="${44 + lean}" cy="37" rx="15" ry="12" fill="#4b3224"/>
    <path d="M31 40q14 6 29 0l-1 7q-14 6-27 0z" fill="#9d3828"/>
    <path d="M${head - 6} 31Q${head + 3} 24 ${reach} 32l3 5q-11 2-23-1" fill="#573829"/>
    <circle cx="${head}" cy="22" r="7" fill="#4b3224"/><circle cx="${head - 2}" cy="15" r="3" fill="#2d211d"/>
  </svg>`;
}
