class Bullet {
    constructor(x, y, direction, speed) {
      this.pos = createVector(x, y);
      this.vel = direction.copy();
      this.vel.setMag(speed); // Use the speed parameter
      this.r = 4; // Radius of the bullet
    }
  
    update() {
      this.pos.add(this.vel);
    }
  
    show(color = 'yellow') {
      push();
      fill(color);
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.r * 2);
      pop();
    }
  
    hits(target) {
      let d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
      return d < this.r + target.r_pourDessin;
    }
  
    hitsObstacle(obstacle) {
      let d = dist(this.pos.x, this.pos.y, obstacle.pos.x, obstacle.pos.y);
      return d < this.r + obstacle.r;
    }
  }
  