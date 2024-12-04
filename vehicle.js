  /*
    Calcule la projection orthogonale du point a sur le vecteur b
    a et b sont des vecteurs calculés comme ceci :
    let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
    let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */
  function findProjection(pos, a, b) {
    let v1 = p5.Vector.sub(a, pos);
    let v2 = p5.Vector.sub(b, pos);
    v2.normalize();
    let sp = v1.dot(v2);
    v2.mult(sp);
    v2.add(pos);
    return v2;
  }

  class Vehicle {
    static debug = false;

    constructor(x, y, image) {
      this.pos = createVector(x, y);
      this.vel = createVector(0, 0);
      this.acc = createVector(0, 0);
      this.maxSpeed = 6;
      this.maxForce = 0.25;
      this.color = "white";
      this.dureeDeVie = 5;

      this.r_pourDessin = 16;
      this.r = this.r_pourDessin * 3;
      this.largeurZoneEvitementDevantVaisseau = this.r / 2;

      this.image = image;
      this.path = [];
      this.pathMaxLength = 30;

      // For wandering behavior
      this.wanderTheta = random(TWO_PI);
      this.wanderRadius = 25;
      this.distanceCercle = 80;
      this.displaceRange = 0.3;

      // Flag to identify if this vehicle is the player
      this.isPlayer = false;
    }

    applyBehaviors(target, obstacles) {
      let seekForce = this.arrive(target);
      let avoidForce = this.avoid(obstacles);
      let separateForce = this.separate(vehicules);

      seekForce.mult(0.2);
      avoidForce.mult(3);
      separateForce.mult(4);

      this.applyForce(seekForce);
      this.applyForce(avoidForce);
      this.applyForce(separateForce);
    }

    avoid(obstacles) {
      let ahead = this.vel.copy();
      ahead.setMag(50);

      let ahead2 = ahead.copy();
      ahead2.mult(0.5);

      let pointAhead = p5.Vector.add(this.pos, ahead);
      let pointAhead2 = p5.Vector.add(this.pos, ahead2);

      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

      if (obstacleLePlusProche == undefined) {
        return createVector(0, 0);
      }

      let distance = min(
        pointAhead.dist(obstacleLePlusProche.pos),
        pointAhead2.dist(obstacleLePlusProche.pos),
        this.pos.dist(obstacleLePlusProche.pos)
      );

      if (
        distance <
        obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau
      ) {
        let desiredVelocity = p5.Vector.sub(
          pointAhead,
          obstacleLePlusProche.pos
        );
        desiredVelocity.setMag(this.maxSpeed);
        let force = p5.Vector.sub(desiredVelocity, this.vel);
        force.limit(this.maxForce);
        return force;
      } else {
        return createVector(0, 0);
      }
    }

    getObstacleLePlusProche(obstacles) {
      let plusPetiteDistance = Infinity;
      let obstacleLePlusProche = undefined;

      obstacles.forEach((o) => {
        const distance = this.pos.dist(o.pos);

        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          obstacleLePlusProche = o;
        }
      });

      return obstacleLePlusProche;
    }

    arrive(target) {
      return this.seek(target, true);
    }

    seek(target, arrival = false) {
      let force = p5.Vector.sub(target, this.pos);
      let desiredSpeed = this.maxSpeed;
      if (arrival) {
        let slowRadius = 100;
        let distance = p5.Vector.dist(target, this.pos);
        if (distance < slowRadius) {
          desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
        }
      }
      force.setMag(desiredSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
      return force;
    }

    applyForce(force) {
      this.acc.add(force);
    }

    update() {
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      this.acc.set(0, 0);
      this.ajoutePosAuPath();
      this.dureeDeVie -= 0.01;
    }

    ajoutePosAuPath() {
      this.path.push(this.pos.copy());
      if (this.path.length > this.pathMaxLength) {
        this.path.shift();
      }
    }

    show() {
      this.drawPath();
      this.drawVehicle();
    }

    boundaries() {
      const d = 25;
      let desired = null;

      if (this.pos.x < d) {
        desired = createVector(this.maxSpeed, this.vel.y);
      } else if (this.pos.x > width - d) {
        desired = createVector(-this.maxSpeed, this.vel.y);
      }

      if (this.pos.y < d) {
        desired = createVector(this.vel.x, this.maxSpeed);
      } else if (this.pos.y > height - d) {
        desired = createVector(this.vel.x, -this.maxSpeed);
      }

      if (desired !== null) {
        desired.normalize();
        desired.mult(this.maxSpeed);
        const steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        this.applyForce(steer);
      }
    }

    wander() {
      let wanderPoint = this.vel.copy();
      wanderPoint.setMag(this.distanceCercle);
      wanderPoint.add(this.pos);

      let theta = this.wanderTheta + this.vel.heading();
      let x = this.wanderRadius * cos(theta);
      let y = this.wanderRadius * sin(theta);

      wanderPoint.add(x, y);

      let steer = wanderPoint.sub(this.pos);
      steer.setMag(this.maxForce);
      this.applyForce(steer);

      this.wanderTheta += random(-this.displaceRange, this.displaceRange);
    }

    drawVehicle() {
      push();
      translate(this.pos.x, this.pos.y);

      if (this.isPlayer) {
        // Rotate to face the mouse position
        let angle = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
        rotate(angle + PI / 2);
      } else {
        rotate(this.vel.heading() + PI / 2);
      }

      if (this.image) {
        imageMode(CENTER);
        image(this.image, 0, 0, this.r_pourDessin * 2, this.r_pourDessin * 2);
      } else {
        fill("red");
        circle(0, 0, 16);
      }

      if (Vehicle.debug) {
        noFill();
        stroke(255);
        circle(0, 0, this.r);
      }
      pop();

      if (Vehicle.debug) {
        this.drawVector(this.pos, this.vel, color(255, 0, 0));
      }
    }

    drawPath() {
      // Optional: Implement trail behind the vehicle if desired
      // Restoring old functionality if any
      if (this.path.length > 1) {
        noFill();
        stroke(255);
        beginShape();
        for (let pos of this.path) {
          vertex(pos.x, pos.y);
        }
        endShape();
      }
    }

    drawVector(pos, v, color) {
      push();
      strokeWeight(3);
      stroke(color);
      line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
      let arrowSize = 5;
      translate(pos.x + v.x, pos.y + v.y);
      rotate(v.heading());
      translate(-arrowSize / 2, 0);
      triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
      pop();
    }

    separate(boids) {
      let desiredseparation = this.r;
      let steer = createVector(0, 0, 0);
      let count = 0;
      for (let i = 0; i < boids.length; i++) {
        let other = boids[i];
        if (other !== this) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if (d > 0 && d < desiredseparation) {
            let diff = p5.Vector.sub(this.pos, other.pos);
            diff.normalize();
            diff.div(d);
            steer.add(diff);
            count++;
          }
        }
      }
      return steer;
    }

    edges() {
      if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
      } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
      }
      if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
      } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
      }
    }
  }

  class Enemy extends Vehicle {
    constructor(x, y, image) {
      super(x, y, image);
      this.shootInterval = random(100, 200);
      this.shootTimer = 0;
    }

    shootAt(target) {
      this.shootTimer++;
      if (this.shootTimer > this.shootInterval) {
        let direction = p5.Vector.sub(target.pos, this.pos);
        direction.normalize();
        let bullet = new Bullet(this.pos.x, this.pos.y, direction, 5); // Slow enemy bullets
        enemyBullets.push(bullet);
        this.shootTimer = 0;
      }
    }

    show() {
      this.drawVehicle();
    }
  }
