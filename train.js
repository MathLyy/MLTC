const trainImages = [
  { src: "images_trains/tjs_am.png"},
  { src: "images_trains/tjs_c.png"},
  { src: "images_trains/tjs_ic.png"},
  { src: "images_trains/tjs_inf.png"},
  { src: "images_trains/tjs_rt1.png"},
  { src: "images_trains/tjs_nr.png"},
  { src: "images_trains/tjs_tgv.png"},
  { src: "images_trains/tjs_sg.png"},
  { src: "images_trains/tjs_vr.png"},
];

let lastTrainSrc = null;

const stoppableTrains = [
  "images_trains/tjs_am.png",
  "images_trains/tjs_ic.png"
];

const trainImg = document.getElementById('train-img');
const railImg = document.getElementById('rail-img');
const container = document.getElementById('train-animation-container');

let ltrAvailable = true;

// === VITESSE ===
const TRAIN_SPEED_KMH = 50;
const METERS_PER_PIXEL = 0.1;
const FRAMES_PER_SECOND = 60;
const metersPerSecond = TRAIN_SPEED_KMH * 1000 / 3600;
const pixelsPerFrame = metersPerSecond / METERS_PER_PIXEL / FRAMES_PER_SECOND;

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

function getRandomTrain() {
  let selected = null;
  let attempts = 0;

  do {
    const index = Math.floor(Math.random() * trainImages.length);
    selected = trainImages[index].src;
    attempts++;
  } while (selected === lastTrainSrc && attempts < 10);

  lastTrainSrc = selected;
  return selected;
}


function launchTrainLtr() {
  if (!ltrAvailable) return;
  ltrAvailable = false;

  const trainSrc = getRandomTrain();
  const shouldStop = stoppableTrains.includes(trainSrc);

  trainImg.src = trainSrc;
  trainImg.style.display = "block";

  trainImg.onload = () => {
    const trainWidth = trainImg.offsetWidth || 200;
    let pos = -trainWidth;
    const stopX = window.innerWidth - 600;

    const startSpeed = pixelsPerFrame * 0.5;
    const endSpeed = pixelsPerFrame * 0.01;
    const totalDistance = stopX - pos;

    function animateLtr() {
      const progress = Math.min((pos + trainWidth) / totalDistance, 1);
      const speed = shouldStop
        ? startSpeed - (startSpeed - endSpeed) * Math.pow(progress, 3)
        : pixelsPerFrame;

      pos += speed;
      trainImg.style.left = pos + "px";

      if (shouldStop && pos >= stopX) {
        trainImg.style.left = stopX + "px";
        setTimeout(() => animateReturn(), 6000); // arrêt de 6 sec
      } else if (!shouldStop && pos >= window.innerWidth) {
        trainImg.style.display = "none";
        setTimeout(() => { ltrAvailable = true; }, 5000);
      } else {
        requestAnimationFrame(animateLtr);
      }
    }

    function animateReturn() {
      const returnStartSpeed = pixelsPerFrame * 0.01;
      const returnMaxSpeed = pixelsPerFrame * 0.8;
      const endX = window.innerWidth + trainWidth;

      function step() {
        const progress = Math.min((pos - stopX) / (endX - stopX), 1);
        const speed = returnStartSpeed + (returnMaxSpeed - returnStartSpeed) * Math.sqrt(progress);
        pos += speed;
        trainImg.style.left = pos + "px";

        if (pos < endX) {
          requestAnimationFrame(step);
        } else {
          trainImg.style.display = "none";
          setTimeout(() => { ltrAvailable = true; }, 2000);
        }
      }
      step();
    }

    animateLtr();
  };
}

function randomTrainLoop() {
  if (ltrAvailable) {
    launchTrainLtr();
  }
  setTimeout(randomTrainLoop, 2000); 
}

// Initialisation
railImg.onload = function () {
  setStyles();
  trainImg.style.display = "none";
  randomTrainLoop();
};
if (railImg.complete) {
  setStyles();
  trainImg.style.display = "none";
  randomTrainLoop();
}