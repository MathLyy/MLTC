/**
 *   ____              ______         _______    
 *  / __ \___  ___ ___/_  __/______ _/ _/ _(_)___
 * / /_/ / _ \/ -_) _ \/ / / __/ _ `/ _/ _/ / __/
 * \____/ .__/\__/_//_/_/ /_/  \_,_/_//_//_/\__/ 
 *     /_/    
 * 
 * This file is part of the OpenTraffic project, distributed under the MIT license by GeoffGarit.
 * 
 * Created on 27/12/2024.
 * Last modified on 23/01/2025.
 * 
 * Current version: 0.0.2
 */

/* Global definitions */
const maxTrains = 7;
const trainHeight = 111; // Height of the train in pixels based on current highest background image in ./assets
let currentTrains = 0;
let occupiedPositions = [];

/* Retrieve json traffic to show */
fetch('/traffic/files.json')
	.then(response => response.json())
	.then(files => {
		if (files.length === 0) {
			console.error('No files available in traffic/files.json.');
			return;
		}

		const randomFile = files[Math.floor(Math.random() * files.length)];

		fetch(randomFile)
			.then(response => response.json())
			.then(data => {
				if (data.length === 0) {
					console.error(`No trains available in ${randomFile}.`);
					return;
				}

				showTrain(getRandomTrain(data));

				setInterval(() => {
					if (currentTrains < maxTrains) {
						showTrain(getRandomTrain(data));
					}
				}, getRandomInterval(2500, 5000));
			})
			.catch(error => console.error(`Error loading train data from ${randomFile}:`, error));
	})
	.catch(error => console.error('Error loading traffic/files.json:', error))
;

/** @returns {number} */
function getRandomInterval(min, max) {
	return Math.random() * (max - min) + min;
}

/** @returns {object} */
function getRandomTrain(trains) {
	const randomIndex = Math.floor(Math.random() * trains.length);

	return trains[randomIndex];
}

/**
 * Generate each images for a traffic composition
 * 
 * @returns {object|string}
 */
function expandComposition(composition) {
	return composition.flatMap(item => {
		const match = item.match(/^(\d+)\*'(.+)'$/);
		if (match) {
			const count = parseInt(match[1], 10);
			const url = match[2];

			return Array(count).fill(url);
		}

		return item;
	});
}

/**
 * @returns {void}
 */
function checkImageExists(url, callback) {
	const img = new Image();
	img.onload = () => callback(true);
	img.onerror = () => callback(false);
	img.src = url;
}

/**
 * Function to determine the top position of the train to prevent superposition of images
 * 
 * @returns {number} The top position of the train
 */
function trainPos() {
	const screenHeight = window.innerHeight;
	const maxPositions = Math.floor(screenHeight / trainHeight);
	let topPosition;

	const possiblePositions = Array.from({ length: maxPositions }, (_, i) => i * trainHeight);
	const availablePositions = possiblePositions.filter((pos) => !occupiedPositions.includes(pos));

	topPosition = occupiedPositions.shift();
	if (availablePositions.length > 0) {
		topPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
		occupiedPositions.push(topPosition);
	}
	occupiedPositions.push(topPosition);

	return topPosition;
}

/**
 * @returns {void}
 */
function showTrain(train) {
	if (!train.composition || !train.speed) {
		return;
	}

	currentTrains++;

	let topPosition = trainPos();

	const trainDiv = document.createElement('div');
	trainDiv.classList.add('train');
	trainDiv.style.top = `${topPosition}px`;
	if (train.background) {
		checkImageExists(train.background, (exists) => {
			if (exists) {
				trainDiv.style.background = `url('${train.background}')`;
			}
		});
	}

	document.getElementById('traffic-container').appendChild(trainDiv);

	const trainMarquee = document.createElement('div');
	trainMarquee.classList.add('marquee');

	let composition = expandComposition(train.composition);

	let direction = train.direction;
	if (
		direction !== 'L' &&
		direction !== 'R'
	) {
		direction = Math.random() < 0.5 ? 'L' : 'R';
	}

	let animationDir = 'left';
	if (direction === 'R') {
		animationDir = 'right';

		composition.reverse();
	}

	composition.forEach((url) => {
		const imgElement = document.createElement('img');
		imgElement.src = url;
		trainMarquee.appendChild(imgElement);
	});

	trainDiv.appendChild(trainMarquee);

	if (train.foreground) {
		checkImageExists(train.foreground, (exists) => {
			if (exists) {
				const foregroundDiv = document.createElement('div');
				foregroundDiv.style.position = 'absolute';
				foregroundDiv.style.bottom = '0';
				foregroundDiv.style.left = '0';
				foregroundDiv.style.height = '100%';
				foregroundDiv.style.width = '100%';
				foregroundDiv.style.background = `url('${train.foreground}') bottom repeat-x`;
				trainDiv.append(foregroundDiv);
			}
		});
	}

	speed = ((Math.random() * 2) * 500 + 1000) / train.speed;

	trainMarquee.style.animation = `scroll-${animationDir} ${speed}s linear infinite`;

	trainMarquee.addEventListener('animationiteration', () => {
		trainDiv.remove();
		currentTrains--;
		occupiedPositions = occupiedPositions.filter((pos) => pos !== topPosition);
	});
}
