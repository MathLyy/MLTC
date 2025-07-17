const trainImages = [

  "images/v2npass.png",

];
const trainImg = document.getElementById('train-img');
const trainImgRtl = document.getElementById('train-img-rtl');
const railImg = document.getElementById('rail-img');
const container = document.getElementById('train-animation-container');
const stoppableTrains = ["images/ttfspass.png"];
// === VITESSE ===
const TRAIN_SPEED_KMH = 80; // Vitesse du train en km/h
const PX_PER_CM = 1;        // 1 px = 10 cm => 1 px = 0.1 m
const METERS_PER_PIXEL = 0.1;
const FRAMES_PER_SECOND = 60;
const metersPerSecond = TRAIN_SPEED_KMH * 1000 / 3600; // km/h → m/s
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
  railImg.style.right = "0"; // align right for cropping left
  railImg.style.left = "";
  railImg.style.bottom = "0";
  railImg.style.height = "auto";
  railImg.style.width = "auto";
  railImg.style.zIndex = 10;

  trainImg.style.position = "absolute";
  trainImg.style.bottom = "10px";
  trainImg.style.height = "";
  trainImg.style.zIndex = 11;

  trainImgRtl.style.position = "absolute";
  trainImgRtl.style.bottom = "10px";
  trainImgRtl.style.height = "";
  trainImgRtl.style.zIndex = 11;
}

function launchTrainLtr() {
  trainImg.style.display = "block";
  let currentTrain = Math.floor(Math.random() * trainImages.length);
  const trainSrc = trainImages[currentTrain];
  trainImg.src = trainSrc;

  const targetStopX = window.innerWidth - 600; // Point d'arrêt précis
  const trainWidth = trainImg.offsetWidth || 200;

  let posLtr = -trainWidth;
  const startSpeed = pixelsPerFrame * 0.5; // facteur 1 pour ajuster si nécessaire
  const endSpeed = pixelsPerFrame * 0.01; // à l'arrêt = 10% de la vitesse

  const totalDistance = targetStopX - posLtr;

  let stopped = false;
  let accelerating = false;

  // === Phase d'aller (décélération progressive) ===
  function animateLtr() {
    let progress = (posLtr + trainWidth) / totalDistance;
    progress = Math.min(progress, 1);

    // Décélération exponentielle douce
    let speed = startSpeed - (startSpeed - endSpeed) * Math.pow(progress, 3);

    posLtr += speed;
    trainImg.style.left = posLtr + "px";

    if (!stopped && posLtr >= targetStopX) {
      trainImg.style.left = targetStopX + "px";
      stopped = true;

      // Après arrêt, démarrer la phase de départ
      setTimeout(() => {
        accelerating = true;
        stopped = false;
        animateReturn();
      }, 10000); // arrêt (1000=1s)

    } else if (!stopped) {
      requestAnimationFrame(animateLtr);
    }
  }

function animateReturn() {
  const startReturnPos = targetStopX;
  const endPos = window.innerWidth + trainWidth;
  const returnDistance = endPos - startReturnPos;

  let progress = (posLtr - startReturnPos) / returnDistance;
  progress = Math.min(Math.max(progress, 0), 1);

  const returnStartSpeed = pixelsPerFrame * 0.01;
  const returnMaxSpeed = pixelsPerFrame * 0.5;

  let speed = returnStartSpeed + (returnMaxSpeed - returnStartSpeed) * Math.sqrt(progress, 5);

  posLtr += speed;
  trainImg.style.left = posLtr + "px";

  if (posLtr < endPos) {
    requestAnimationFrame(animateReturn);
  } else {
    trainImg.style.display = "none";
  }
}

  animateLtr();
}


function launchTrainRtl() {
  trainImgRtl.style.display = "block";
  let currentTrainRtl = Math.floor(Math.random() * trainImages.length);
  trainImgRtl.src = trainImages[currentTrainRtl];
  trainImgRtl.offsetWidth; // Force le calcul
  let trainWidth = trainImgRtl.offsetWidth || 200; // Valeur de secours si non chargée
  let posRtl = window.innerWidth; // Commence bien hors écran à droite
  function animateRtl() {
  posRtl -= pixelsPerFrame; // même vitesse que LTR
  trainImgRtl.style.left = posRtl + "px";

  if (posRtl > -trainWidth) {
    requestAnimationFrame(animateRtl);
  } else {
    trainImgRtl.style.display = "none";
  }
}
  animateRtl();
}

function randomTrainLoop() {
  // Vérifie si un train est déjà en cours d'animation
  if (trainImg.style.display === "block" || trainImgRtl.style.display === "block") {
    // Attends que les deux trains aient disparu avant de relancer
    setTimeout(randomTrainLoop, 500);
    return;
  }

  // Décide aléatoirement quel(s) train(s) lancer
  const rand = Math.random();
  if (rand < 0.4) {
    launchTrainLtr();
  } else if (rand < 0.8) {
    launchTrainRtl();
  } else {
    launchTrainLtr();
    // Lance le second train avec un léger décalage pour éviter la superposition
    setTimeout(launchTrainRtl, 800);
  }

  // Prochaine tentative après un délai plus long (6s à 14s)
  setTimeout(randomTrainLoop, 6000 + Math.random() * 8000);
}

railImg.onload = function() {
  setStyles();
  trainImg.style.display = "none";
  trainImgRtl.style.display = "none";
  randomTrainLoop();
};
if (railImg.complete) {
  setStyles();
  trainImg.style.display = "none";
  trainImgRtl.style.display = "none";
  randomTrainLoop();
}