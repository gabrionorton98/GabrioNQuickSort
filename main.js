const canvas = document.getElementById('sortCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');

const BAR_COUNT = 40;
const BAR_WIDTH = canvas.width / BAR_COUNT;
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
    ctx.fillStyle = '#4caf50';
    if (highlight.pivot === i) ctx.fillStyle = '#ff9800';
    else if (highlight.left === i || highlight.right === i) ctx.fillStyle = '#e91e63';
    else if (highlight.sorted && highlight.sorted.has(i)) ctx.fillStyle = '#2196f3';
    ctx.fillRect(i * BAR_WIDTH, canvas.height - array[i], BAR_WIDTH - 2, array[i]);
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
}

function reset() {
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
    await new Promise(res => setTimeout(res, speed));
  }
  running = false;
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
speedRange.oninput = (e) => {
  speed = Number(e.target.value);
};

reset();
