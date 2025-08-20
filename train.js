const TRAIN_SRC = "icones_lore/tjs_am.png";

const trainImg = document.getElementById('train-img');
const railImg = document.getElementById('rail-img');
const container = document.getElementById('train-animation-container');

let loopStarted = false;

const METERS_PER_PIXEL = 0.1;
const TRAIN_SPEED_KMH = 160;
const TRAIN_SPEED_MPS = TRAIN_SPEED_KMH * 1000 / 3600;
const PIXELS_PER_SECOND = TRAIN_SPEED_MPS / METERS_PER_PIXEL;

const DWELL_MS = 6000;
const BETWEEN_TRAINS_MS = 4000;
const DECEL_START_FACTOR = 0.5;
const DECEL_END_FACTOR = 0.01;
const DEPART_MAX_FACTOR = 0.5;

function setStyles() {
  container.style.position = "relative";
  container.style.width = "100vw";
  container.style.height = railImg.naturalHeight + "px";
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";
  container.style.zIndex = 1000;
  container.style.margin = "0 auto";

  railImg.style.position = "absolute";
  railImg.style.right = "0";
  railImg.style.left = "";
  railImg.style.bottom = "0";
  railImg.style.width = "auto";
  railImg.style.height = "auto";
  railImg.style.maxWidth = "none";
  railImg.style.maxHeight = "none";
  railImg.style.zIndex = 10;

  trainImg.style.position = "absolute";
  trainImg.style.bottom = "10px";
  trainImg.style.height = "";
  trainImg.style.zIndex = 11;
}

function launchTrainLtr() {
  const runCycle = () => {
    trainImg.style.display = "block";

    const trainWidth = trainImg.offsetWidth || 200;
    let pos = -trainWidth;
    const stopX = window.innerWidth - 600;
    let lastTime = null;

    function animateApproach(time) {
      if (!lastTime) lastTime = time;
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const totalDistance = stopX - (-trainWidth);
      const progress = Math.min((pos + trainWidth) / totalDistance, 1);
      const startSpeed = PIXELS_PER_SECOND * DECEL_START_FACTOR;
      const endSpeed = PIXELS_PER_SECOND * DECEL_END_FACTOR;
      const speed = startSpeed - (startSpeed - endSpeed) * Math.pow(progress, 3);

      pos += speed * delta;
      trainImg.style.left = pos + "px";

      if (pos >= stopX) {
        trainImg.style.left = stopX + "px";
        setTimeout(animateDepartAfterStop, DWELL_MS);
      } else {
        requestAnimationFrame(animateApproach);
      }
    }

    function animateDepartAfterStop() {
      let lastTime = null;
      const accelDuration = 10.0;
      let elapsedTime = 0;
      const maxSpeed = PIXELS_PER_SECOND * DEPART_MAX_FACTOR;

      function step(time) {
        if (!lastTime) lastTime = time;
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        elapsedTime += delta;

        const progress = Math.min(elapsedTime / accelDuration, 1);
        const easedProgress = Math.pow(progress, 2);
        const speed = maxSpeed * easedProgress;

        pos += speed * delta;
        trainImg.style.left = pos + "px";

        if (pos < window.innerWidth) {
          requestAnimationFrame(step);
        } else {
          trainImg.style.display = "none";
          setTimeout(launchTrainLtr, BETWEEN_TRAINS_MS);
        }
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(animateApproach);
  };

  if (trainImg.complete && trainImg.naturalWidth > 0) {
    runCycle();
  } else {
    trainImg.onload = runCycle;
    trainImg.src = TRAIN_SRC;
  }
}

function startOnce() {
  if (loopStarted) return;
  loopStarted = true;
  setStyles();
  trainImg.style.display = "none";

  if (trainImg.complete && trainImg.naturalWidth > 0) {
    launchTrainLtr();
  } else {
    trainImg.onload = launchTrainLtr;
    trainImg.src = TRAIN_SRC;
  }
}

railImg.onload = startOnce;
if (railImg.complete) startOnce();