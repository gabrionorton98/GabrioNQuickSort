const canvas = document.getElementById('sortCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');
const stepBtn = document.getElementById('stepBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const sizeRange = document.getElementById('sizeRange');

let BAR_COUNT = parseInt(sizeRange.value);
let BAR_WIDTH = canvas.width / BAR_COUNT;
let array = [];
let actions = [];
let running = false;
let paused = false;
let speed = 300;
let actionIndex = 0;

function randomArray() {
  return Array.from({ length: BAR_COUNT }, () => Math.floor(Math.random() * (canvas.height - 40)) + 40);
}

function drawArray(highlight = {}) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < array.length; i++) {
    let color = '#4caf50'; // default
    if (highlight.pivot === i) color = '#ff9800';
    else if (highlight.swap && (highlight.swap[0] === i || highlight.swap[1] === i)) color = '#ffd600';
    else if (highlight.compare && (highlight.compare[0] === i || highlight.compare[1] === i)) color = '#e91e63';
    else if (highlight.sorted && highlight.sorted.has(i)) color = '#2196f3';
    ctx.fillStyle = color;
    ctx.fillRect(i * BAR_WIDTH, canvas.height - array[i], BAR_WIDTH - 2, array[i]);
    // Draw value label for clarity
    if (BAR_COUNT <= 30) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(array[i], i * BAR_WIDTH + BAR_WIDTH / 2, canvas.height - array[i] - 8);
    }
  }
}

function recordAction(type, indices) {
  actions.push({ type, ...indices, arr: array.slice() });
}

function* quicksort(arr, left, right, sorted) {
  if (left >= right) {
    if (left === right) {
      sorted.add(left);
      recordAction('sorted', { sorted: new Set(sorted) });
    }
    return;
  }
  let pivot = arr[right];
  let i = left;
  recordAction('pivot', { pivot: right, sorted: new Set(sorted) });
  for (let j = left; j < right; j++) {
    recordAction('compare', { compare: [j, right], pivot: right, sorted: new Set(sorted) });
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      recordAction('swap', { swap: [i, j], pivot: right, sorted: new Set(sorted) });
      yield;
      i++;
    }
  }
  [arr[i], arr[right]] = [arr[right], arr[i]];
  recordAction('swap', { swap: [i, right], pivot: right, sorted: new Set(sorted) });
  yield;
  sorted.add(i);
  recordAction('sorted', { sorted: new Set(sorted) });
  yield* quicksort(arr, left, i - 1, sorted);
  yield* quicksort(arr, i + 1, right, sorted);
}

function prepareActions() {
  actions = [];
  // Always start with a scrambled array
  let arrCopy = randomArray();
  // Save the scrambled array as the initial state
  actions.push({ type: 'init', arr: arrCopy.slice() });
  let sorted = new Set();
  const gen = quicksort(arrCopy, 0, arrCopy.length - 1, sorted);
  for (let _ of gen) {}
  // At the end, mark all as sorted and update the array
  actions.push({ type: 'sorted', sorted: new Set(Array.from({length: arrCopy.length}, (_, i) => i)), arr: arrCopy.slice() });
  array = arrCopy.slice();
}

function reset() {
  BAR_COUNT = parseInt(sizeRange.value);
  BAR_WIDTH = canvas.width / BAR_COUNT;
  prepareActions();
  actionIndex = 0;
  // Always start with the scrambled state
  array = actions[0].arr.slice();
  drawArray();
  running = false;
  paused = false;
}

function shuffle() {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  prepareActions();
  actionIndex = 0;
  drawArray();
  running = false;
  paused = false;
}

async function play() {
  if (running) return;
  running = true;
  paused = false;
  while (actionIndex < actions.length && running) {
    if (paused) {
      running = false;
      break;
    }
    const action = actions[actionIndex];
    array = action.arr.slice();
    drawArray(action);
    actionIndex++;
    await new Promise(res => setTimeout(res, Math.max(20, speed / 2)));
  }
  running = false;
}

function step() {
  if (actionIndex < actions.length) {
    const action = actions[actionIndex];
    array = action.arr.slice();
    drawArray(action);
    actionIndex++;
  }
}

startBtn.onclick = () => {
  if (!running) play();
  paused = false;
};
pauseBtn.onclick = () => {
  paused = true;
};
resetBtn.onclick = () => {
  reset();
};
shuffleBtn.onclick = () => {
  shuffle();
};
stepBtn.onclick = () => {
  step();
};
speedRange.oninput = (e) => {
  speed = Number(e.target.value);
};
sizeRange.oninput = (e) => {
  reset();
};

reset();
