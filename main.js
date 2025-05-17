const canvas = document.getElementById('sortCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const speedRange = document.getElementById('speedRange');
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
    else if (highlight.left === i || highlight.right === i) color = '#e91e63';
    else if (highlight.sorted && highlight.sorted.has(i)) color = '#2196f3';
    ctx.fillStyle = color;
    ctx.fillRect(i * BAR_WIDTH, canvas.height - array[i], BAR_WIDTH - 2, array[i]);
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
  if (left < right) {
    let pivotIdx = right;
    let pivot = arr[pivotIdx];
    let i = left;
    recordAction('pivot', { pivot: pivotIdx, left: i, right: right, sorted: new Set(sorted) });
    for (let j = left; j < right; j++) {
      recordAction('compare', { left: j, right: pivotIdx, pivot: pivotIdx, sorted: new Set(sorted) });
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        recordAction('swap', { left: i, right: j, pivot: pivotIdx, sorted: new Set(sorted) });
        i++;
      }
    }
    [arr[i], arr[pivotIdx]] = [arr[pivotIdx], arr[i]];
    recordAction('swap', { left: i, right: pivotIdx, pivot: pivotIdx, sorted: new Set(sorted) });
    sorted.add(i);
    yield* quicksort(arr, left, i - 1, sorted);
    yield* quicksort(arr, i + 1, right, sorted);
  } else if (left === right) {
    sorted.add(left);
    recordAction('sorted', { sorted: new Set(sorted) });
  }
}

function prepareActions() {
  actions = [];
  let arrCopy = array.slice();
  let sorted = new Set();
  const gen = quicksort(arrCopy, 0, arrCopy.length - 1, sorted);
  for (let _ of gen) {}
  recordAction('sorted', { sorted: new Set(Array.from({length: arrCopy.length}, (_, i) => i)) });
}

function reset() {
  BAR_COUNT = parseInt(sizeRange.value);
  BAR_WIDTH = canvas.width / BAR_COUNT;
  array = randomArray();
  prepareActions();
  actionIndex = 0;
  drawArray();
  running = false;
  paused = false;
}

function shuffle() {
  array = randomArray();
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
