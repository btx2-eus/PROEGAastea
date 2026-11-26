'use strict';

const steps = Array.from(document.querySelectorAll('.route-list summary'), (summary) =>
  summary.children[1].textContent.trim()
);

const sorter = document.querySelector('.sorter');
const cards = document.querySelector('#cards');
const orderFeedback = document.querySelector('#order-feedback');
const moveFeedback = document.querySelector('#move-feedback');
const clues = [
  'Taldearen lehen urratsa haurrak dauden lekura joatea da.',
  'Lehen harremanaren ondoren, bisitek konfiantza sendotzen dute.',
  'Konfiantza sortzen ari denean, taldeak Etxera joateko aukera azaltzen du.',
  'Haurra Etxera iristen denean, lehen beharrak artatzen dituzte.',
  'Etxean, eskolara itzultzeko ikasteko ohiturak lantzen dituzte.',
  'Familia-loturak landu aurretik, senideak aurkitu eta entzun behar dira.',
  'Familia aurkitu ondoren, harremana eta harrera prestatzen dira.',
  'Itzulera segurua denean, taldeak laguntzen jarraitzen du.',
];

let order = [];

function sameOrder(left, right) {
  return left.length === right.length && left.every((step, index) => step === right[index]);
}

function shuffle() {
  const original = steps.map((_, index) => index);
  const shuffled = [...original];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  if (sameOrder(shuffled, original) || sameOrder(shuffled, order)) {
    shuffled.push(shuffled.shift());
  }
  if (sameOrder(shuffled, original) || sameOrder(shuffled, order)) {
    shuffled.push(shuffled.shift());
  }
  order = shuffled;
}

function renderCards(markCorrect = false, focusedStep, focusedDirection) {
  const fragment = document.createDocumentFragment();
  let focusTarget;
  order.forEach((step, index) => {
    const item = document.createElement('li');
    item.className = 'card';

    const position = document.createElement('span');
    position.className = 'card-position';
    position.textContent = markCorrect && step === index ? '✓' : index + 1;
    position.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'card-name';
    name.textContent = steps[step];

    if (markCorrect && step === index) {
      item.classList.add('is-correct');
      const correctLabel = document.createElement('span');
      correctLabel.className = 'sr-only';
      correctLabel.textContent = ' (leku egokian)';
      name.append(correctLabel);
    }

    const controls = document.createElement('div');
    controls.className = 'card-controls';
    for (const [direction, arrow, label] of [[-1, '↑', 'gora'], [1, '↓', 'behera']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = arrow;
      button.setAttribute('aria-label', steps[step] + ' txartela ' + label + ' mugitu');
      const destination = index + direction;
      if (destination < 0 || destination >= order.length) {
        button.setAttribute('aria-disabled', 'true');
      }
      button.addEventListener('click', () => {
        if (destination < 0 || destination >= order.length) return;
        [order[index], order[destination]] = [order[destination], order[index]];
        orderFeedback.textContent = '';
        renderCards(false, step, direction);
        moveFeedback.textContent = steps[step] + ' txartela ' + (destination + 1) + '. lekuan.';
      });
      if (step === focusedStep && direction === focusedDirection) focusTarget = button;
      controls.append(button);
    }
    item.append(position, name, controls);
    fragment.append(item);
  });
  cards.replaceChildren(fragment);
  if (focusTarget) focusTarget.focus({ preventScroll: true });
}

document.querySelector('#check-order').addEventListener('click', () => {
  const correct = order.filter((step, index) => step === index).length;
  const completed = correct === order.length;
  orderFeedback.classList.toggle('good', completed);
  orderFeedback.textContent = completed
    ? 'Oso ondo! Zortzi urratsak leku egokian daude. Orain, ikusi nola moldatzen den ibilbidea bi egoeratan.'
    : correct + ' / ' + order.length + ' leku egokian. Pista: ' + clues[order.findIndex((step, index) => step !== index)];
  renderCards(true);
});

document.querySelector('#reset-order').addEventListener('click', () => {
  shuffle();
  orderFeedback.classList.remove('good');
  orderFeedback.textContent = '';
  moveFeedback.textContent = 'Zortzi txartelak berriro nahastu dira.';
  renderCards();
});

shuffle();
renderCards();
sorter.hidden = false;

document.querySelectorAll('.scenario form').forEach((form) => {
  const feedback = form.querySelector('.feedback');
  form.addEventListener('change', () => {
    feedback.textContent = '';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const choice = form.querySelector('input:checked');
    if (!choice) return;
    const correct = choice.value === form.dataset.answer;
    feedback.classList.toggle('good', correct);
    feedback.textContent = correct
      ? 'Ondo! ' + form.dataset.explanation
      : 'Saiatu berriro. ' + form.dataset.hint;
  });
});
document.querySelector('#egoerak').hidden = false;

function drawMap(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;
  const project = (longitude, latitude) => [
    (longitude + 10.4) * 71 + 3,
    (11.6 - latitude) * 55 + 8,
  ];
  const land = [
    [-10.5, 12], [1, 12], [1, 5.7], [-.3, 5.4], [-1.6, 4.85], [-2.1, 4.75],
    [-3.1, 5.05], [-4.1, 5.24], [-5.3, 5.1], [-6.1, 4.98], [-7.5, 4.34],
    [-8.5, 4.72], [-9.3, 5.4], [-10.5, 6.4],
  ];
  const ivoryCoast = [
    [-8.61, 7.55], [-8.25, 8.3], [-8.25, 9.45], [-7.94, 10.16], [-7.52, 10.42],
    [-7.02, 10.12], [-6.49, 10.62], [-5.91, 10.29], [-5.55, 10.46], [-5.4, 10.22],
    [-4.98, 10.17], [-4.74, 9.79], [-4.28, 9.75], [-3.6, 9.91], [-2.72, 9.49],
    [-2.54, 8.58], [-2.95, 7.44], [-2.96, 6.36], [-3.24, 6.02], [-3.11, 5.08],
    [-4.17, 5.25], [-5.34, 5.12], [-6.1, 4.98], [-7.54, 4.35], [-7.52, 5.07],
    [-7.43, 5.82], [-7.8, 6.17], [-8.39, 6.52], [-8.32, 7.12],
  ];

  function polygon(points, fill, outline) {
    context.beginPath();
    points.forEach(([longitude, latitude], index) => {
      const [x, y] = project(longitude, latitude);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    if (outline) {
      context.strokeStyle = outline;
      context.lineWidth = 2;
      context.stroke();
    }
  }

  context.fillStyle = '#e0e9e6';
  context.fillRect(0, 0, width, height);
  polygon(land, '#e9e7d2', '#b5c3bb');

  context.strokeStyle = '#c8cab3';
  context.lineWidth = 1;
  for (let longitude = -10; longitude <= 0; longitude += 1) {
    const [x] = project(longitude, 0);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let latitude = 4; latitude <= 11; latitude += 1) {
    const [, y] = project(0, latitude);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  polygon(ivoryCoast, '#bdd1ae', '#6d8b72');
  context.fillStyle = '#324d3f';
  context.font = '700 27px system-ui';
  context.fillText('BOLI KOSTA', 220, 214);
  context.font = '600 20px system-ui';
  context.fillStyle = '#475851';
  context.fillText('Ginea', 47, 119);
  context.fillText('Liberia', 63, 287);
  context.fillText('Ghana', 605, 205);
  context.fillText('Mali', 274, 46);
  context.fillText('Burkina Faso', 470, 57);
  context.fillStyle = '#405e64';
  context.font = 'italic 23px Georgia';
  context.fillText('Ozeano Atlantikoa', 63, 430);

  const [x, y] = project(-4.02, 5.42);
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 31, y - 18);
  context.lineTo(x + 155, y - 18);
  context.strokeStyle = '#8e3227';
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.arc(x, y, 10, 0, Math.PI * 2);
  context.fillStyle = '#a33727';
  context.fill();
  context.strokeStyle = '#fffdf7';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = '#7c281d';
  context.font = '750 23px system-ui';
  context.fillText('Abobo', x + 36, y - 27);
  context.font = '650 19px system-ui';
  context.fillText('Abidjan', x + 36, y + 4);
}

drawMap(document.querySelector('#map'));
