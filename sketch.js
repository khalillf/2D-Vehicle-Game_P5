let player;
let target;
let obstacles = [];
let vehicules = [];
let enemies = [];
let bullets = [];
let enemyBullets = [];
let m = "n"; // Mode: 'n' for normal, 's' for snake mode, 'w' for wander mode
let SliderVitesse, Sliderforce;
let score = 0;
let playerLives = 5;
let gameOver = false;

// Images
let backgroundImg, vaisseau, obstacleImg, enemyImg, goodImg;

// Variables for displaying 'good.png'
let showGoodImage = false;
let goodImageTimer = 0;
const GOOD_IMAGE_DURATION = 60; // 1 second at 60 FPS

// Sound effect
let killSound;

function preload() {
  // Load images
  backgroundImg = loadImage('assets/bg.jpg');
  vaisseau = loadImage('assets/vi.png');
  obstacleImg = loadImage('assets/rock.png');
  enemyImg = loadImage('assets/enemy.png');
  goodImg = loadImage('assets/good.png'); // Load good.png

  // Load sound effect
  killSound = loadSound('assets/sound.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create the control panel div
  let controlPanel = select('#controlPanel');

  // Initialize player
  player = new Vehicle(1000, 1000, vaisseau);
  player.isPlayer = true; // Indicate that this vehicle is the player
  vehicules.push(player);

  // Create 4 enemies
  for (let i = 0; i < 4; i++) {
    let enemy = new Enemy(random(width), random(height), enemyImg);
    enemies.push(enemy);
    // Do not add enemies to vehicules to keep them separate for movement logic
  }

  // Add sliders
  let labelVitesseMax = createDiv('Vitesse Max:');
  labelVitesseMax.style('color', 'white');
  labelVitesseMax.style('font-size', '14px');
  SliderVitesse = createSlider(1, 20, 10, 1);
  SliderVitesse.style('width', '100%');

  let labelAccelerationMax = createDiv('Accélération Max:');
  labelAccelerationMax.style('color', 'white');
  labelAccelerationMax.style('font-size', '14px');
  Sliderforce = createSlider(0.1, 5, 2, 0.01);
  Sliderforce.style('width', '100%');

  // Create containers for sliders
  let sliderContainer1 = createDiv().class('sliderContainer');
  labelVitesseMax.parent(sliderContainer1);
  SliderVitesse.parent(sliderContainer1);
  sliderContainer1.parent(controlPanel);

  let sliderContainer2 = createDiv().class('sliderContainer');
  labelAccelerationMax.parent(sliderContainer2);
  Sliderforce.parent(sliderContainer2);
  sliderContainer2.parent(controlPanel);

  // Add controls/instructions
  let controlsDiv = createDiv().class('controls');
  controlsDiv.parent(controlPanel);

  let controlsTitle = createElement('h3', 'Controls');
  controlsTitle.style('color', 'white');
  controlsTitle.parent(controlsDiv);

  let controlsList = [
    'N : Normal Mode',
    'S : Snake Mode',
    'W : Wander Mode',
    'F : Add Vehicles',
    'SPACE : Add Obstacle',
    'Left Click : Shoot Enemy'
  ];

  controlsList.forEach(control => {
    let p = createP(control);
    p.style('color', 'white');
    p.style('font-size', '14px');
    p.parent(controlsDiv);
  });

  // Create initial obstacles
  obstacles.push(new Obstacle(width / 2, height / 2, 100, obstacleImg));
}

function draw() {
  if (gameOver) {
    noLoop();
    document.getElementById('gameOver').style.display = 'block';
    return;
  }

  // Draw background
  image(backgroundImg, 0, 0, width, height);

  target = createVector(mouseX, mouseY);

  // Draw obstacles
  obstacles.forEach(o => {
    o.show();
  });

  let nMaxSpeed = SliderVitesse.value();
  let nMaxForce = Sliderforce.value();

  // Update and display player and other vehicles
  vehicules.forEach((v, index) => {
    v.maxSpeed = nMaxSpeed;
    v.maxForce = nMaxForce;

    if (m == "s") {
      if (index == 0) {
        // First vehicle follows the target
        v.applyBehaviors(target, obstacles);
        v.applyForce(v.arrive(target));
      } else {
        // Other vehicles follow the vehicle ahead
        let leader = vehicules[index - 1];
        v.applyBehaviors(leader.pos, obstacles);
        v.applyForce(v.arrive(leader.pos.copy()));
      }
    } else if (m == "n") {
      v.applyBehaviors(target, obstacles);
      v.applyForce(v.arrive(target));
    } else if (m == "w") {
      v.applyBehaviors(target, obstacles);
      v.wander();
      v.boundaries();
    }

    v.update();
    v.show();
  });

  // Update and display enemies
  enemies.forEach((enemy) => {
    enemy.maxSpeed = 2; // Slow down the enemies
    enemy.boundaries(); // Keep enemies within the map
    enemy.wander();
    enemy.update();
    enemy.show();
    enemy.shootAt(player);
  });

  // Update and display bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.update();
    bullet.show();

    // Check collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      if (bullet.hits(enemy)) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;

        // Play kill sound
        killSound.play();

        // Show good.png image
        showGoodImage = true;
        goodImageTimer = 0;

        // Spawn new enemies if all are defeated
        if (enemies.length === 0) {
          for (let k = 0; k < 4; k++) {
            let newEnemy = new Enemy(random(width), random(height), enemyImg);
            enemies.push(newEnemy);
          }
        }
        break;
      }
    }

    // Check collision with obstacles
    obstacles.forEach((obstacle) => {
      if (bullet.hitsObstacle(obstacle)) {
        bullets.splice(i, 1);
      }
    });
  }

  // Update and display enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    bullet.update();
    bullet.show('red'); // Enemy bullets are red

    // Check collision with player
    if (bullet.hits(player)) {
      enemyBullets.splice(i, 1);
      playerLives--;
      if (playerLives <= 0) {
        gameOver = true;
      }
    }

    // Check collision with obstacles
    obstacles.forEach((obstacle) => {
      if (bullet.hitsObstacle(obstacle)) {
        enemyBullets.splice(i, 1);
      }
    });
  }

  // Display the score and lives
  fill(255);
  textSize(24);
  text("Score: " + score, 10, 30);
  text("Lives: " + playerLives, 10, 60);

  // Display good.png image when an enemy is killed
  if (showGoodImage) {
    image(goodImg, width - 110, 10, 100, 100); // Adjust position and size as needed
    goodImageTimer++;
    if (goodImageTimer > GOOD_IMAGE_DURATION) {
      showGoodImage = false;
    }
  }
}

function mousePressed() {
  // Left mouse click shoots a bullet
  if (mouseButton === LEFT) {
    let bulletDirection = createVector(mouseX - player.pos.x, mouseY - player.pos.y);
    bulletDirection.normalize();
    let bullet = new Bullet(player.pos.x, player.pos.y, bulletDirection, 10); // Player bullet speed
    bullets.push(bullet);
  }
}

function keyPressed() {
  if (key == "n") {
    m = "n";
  } else if (key == "v") {
    let newVehicle = new Vehicle(random(width), random(height), vaisseau);
    vehicules.push(newVehicle);
  } else if (key == "d") {
    Vehicle.debug = !Vehicle.debug;
  } else if (key == "f") {
    // Create 10 vehicles at x = 20, y = height / 2, with random velocities
    for (let i = 0; i < 10; i++) {
      let v = new Vehicle(20, height / 2, vaisseau);
      v.vel = new p5.Vector(random(1, 5), random(1, 5));
      vehicules.push(v);
    }
  } else if (key == "s") {
    m = "s";
  } else if (key == "w") {
    m = "w";
  } else if (keyCode === 32) {
    // Spacebar adds a new obstacle at the player's position
    obstacles.push(new Obstacle(player.pos.x, player.pos.y, random(70, 100), obstacleImg));
  }
}
