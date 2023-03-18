const cnv = document.getElementById('canvas');
const ctx = cnv.getContext('2d');

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

let mouse = {};
let objects = {
   balls: [],
   squares: [],
};

for (let n = 0; n < 1; n++) {
   objects.balls.push(null);
}

let marker = {
   x: cnv.width / 2,
   y: cnv.height * 0.9,
   r: 50,
   shooting: false,
   draw: true,
   angle: 0,
   frameShot: 0,
   ballIndex: 0,
   shootDelay: 3,

   draw() {
      if (this.shooting) this.shoot();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.fill();
   },

   shoot() {
      if ((frameCount - this.frameShot) % this.shootDelay && frameCount - this.frameShot) return;
      new Ball(this.angle + Math.PI, this.ballIndex);

      this.ballIndex++;
      if (this.ballIndex >= objects.balls.length) this.shooting = false;
   },
};

let aim = {
   x: marker.x,
   y: marker.y,
   r: 7,
   spacing: 15,
   angle: 0,

   draw() {
      if (!mouse.down || marker.shooting) return;

      this.updateAngle();

      if (this.spacing < 20) return;

      for (let n = 0; n < 10; n++) {
         const coords = this.getCoords(n);

         ctx.beginPath();
         ctx.arc(coords.x, coords.y, this.r, 0, 2 * Math.PI);
         ctx.fill();
      }
   },

   updateAngle() {
      const run = mouse.x - mouse.downX;
      const rise = mouse.y - mouse.downY;

      this.angle = Math.atan2(rise, run);

      this.spacing = Math.sqrt(run ** 2 + rise ** 2) * 0.1 + 15;
   },

   getCoords(n) {
      const hyp = this.y - (this.y - n * this.spacing);

      const x = this.x - hyp * Math.cos(this.angle);
      const y = this.y - hyp * Math.sin(this.angle);

      return { x: x, y: y };
   },
};

class Ball {
   constructor(angle, index) {
      this.index = index;

      this.x = marker.x;
      this.y = marker.y;
      this.vx = 0;
      this.vy = 0;
      this.speed = 70;
      this.r = marker.r;

      this.setVelocity(angle);
      objects.balls[this.index] = this;
   }

   draw() {
      if (!(frameCount % 50)) {
         this.move();
         this.checkCollision();
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.fill();
   }

   setVelocity(angle) {
      this.vx = this.speed * Math.cos(angle);
      this.vy = this.speed * Math.sin(angle);
   }

   move() {
      this.x += this.vx;
      this.y += this.vy;
   }

   checkCollision() {
      if (this.x + this.r > cnv.width) {
         this.vx *= -1;
         this.x = cnv.width - this.r;
      } else if (this.x - this.r < 0) {
         this.vx *= -1;
         this.x = 0 + this.r;
      }

      // if (this.y - this.r < 0) {
      //    this.vy *= -1;
      // } else if (this.y - this.r > cnv.height) {
      //    objects.balls[this.index] = null;
      // }

      if (this.y - this.r < 0) {
         this.vy *= -1;
         this.y = 0 + this.r;
      } else if (this.y + this.r > cnv.height) {
         this.vy *= -1;
         this.y = cnv.height - this.r;
      }

      for (let i = 0; i < objects.squares.length; i++) {
         const square = objects.squares[i];

         const squareEdges = {
            left: square.x,
            right: square.x + square.size,
            top: square.y,
            bottom: square.y + square.size,
         };

         let dist = {
            x: 0,
            y: 0,
         };

         let dist1 = {
            left: (squareEdges.left - (this.x - this.vx)) / this.vx,
            right: (squareEdges.right - (this.x - this.vx)) / this.vx,
            top: (squareEdges.top - (this.y - this.vy)) / this.vy,
            bottom: (squareEdges.bottom - (this.y - this.vy)) / this.vy,
         };

         console.log(
            dist1.right,
            dist1.top,
            Math.abs(dist1.right - dist1.top),
            Math.abs(this.r / this.vy),
            Math.abs(dist1.right - dist1.top) < Math.abs(this.r / this.vy) ? true : false
         );

         for (const side in dist1) {
            if (dist1[side] < 0) dist1[side] = Infinity;
         }

         if (this.vx > 0) {
            dist1.right = Infinity;
         } else {
            dist1.left = Infinity;
         }

         if (this.vy > 0) {
            dist1.bottom = Infinity;
         } else {
            dist1.top = Infinity;
         }

         console.log(dist1);

         let side = {};

         // Find distance between the ball and the closest edge, also determine which side of the square the ball is on
         if (this.y < squareEdges.top) {
            dist.y = this.y - squareEdges.top;
            side.y = 'top';
         } else if (this.y > squareEdges.bottom) {
            dist.y = this.y - squareEdges.bottom;
            side.y = 'bottom';
         }

         if (this.x < squareEdges.left) {
            dist.x = this.x - squareEdges.left;
            side.x = 'left';
         } else if (this.x > squareEdges.right) {
            dist.x = this.x - squareEdges.right;
            side.x = 'right';
         }

         const totalDist = Math.sqrt(dist.x ** 2 + dist.y ** 2);

         if (totalDist < this.r) {
            // square.health--;
            // Checks if the ball has hit one of the corners
            if (side.x && side.y) {
               console.log(dist1);
               // Corner of the square the ball will hit
               const corner = { x: squareEdges[side.x], y: squareEdges[side.y] };

               // Define the path of the ball with the slope-intercept form of linear equation y = mx + c
               const m = this.vy / this.vx;
               const c = this.y - this.x * m;

               // Get the angle of the ball's path
               const angle = this.vx < 0 ? Math.atan(m) + Math.PI : Math.atan(m);

               // Determines which solution of the quadratic to use, depending on whether the ball is moving to the left or the right
               const sign = Math.sign(-this.vx);

               // The quadratic equation (corner.x - t)**2 + (corner.y - mt + c)**2 = r**2 solved for t in order to find
               // the x and y of the center of the ball (x - h)**2 + (y - k**2) = r**2 moving along the path y = mx + c
               // which also intersects with the corner of the square
               const numerator =
                  corner.x +
                  m * corner.y -
                  m * c +
                  sign *
                     Math.sqrt(
                        -(m ** 2) * corner.x ** 2 +
                           2 * m * corner.x * corner.y -
                           2 * m * c * corner.x +
                           m ** 2 * this.r ** 2 +
                           2 * c * corner.y +
                           this.r ** 2 -
                           c ** 2 -
                           corner.y ** 2
                     );
               const denominator = 1 + m ** 2;
               const t = numerator / denominator;

               this.x = t;
               this.y = m * t + c;

               // Normal to the tangent line of the ball going through the corner of the square
               const normalAngle = Math.atan((corner.y - this.y) / (corner.x - this.x));

               // Using the law of reflection (angle of reflection = angle of incidence) find the angle of the ball's new path
               const incidenceAngle = angle + Math.PI - normalAngle;
               const reflectionAngle = normalAngle - incidenceAngle;

               this.setVelocity(reflectionAngle);

               objects.balls = [];
            } else {
               // Bounce ball off of the side of the square
               if (side.x === 'left') {
                  this.vx *= -1;
                  this.x = squareEdges.left - this.r;
               } else if (side.x === 'right') {
                  this.vx *= -1;
                  this.x = squareEdges.right + this.r;
               } else if (side.y == 'top') {
                  this.vy *= -1;
                  this.y = squareEdges.top - this.r;
               } else if (side.y == 'bottom') {
                  this.vy *= -1;
                  this.y = squareEdges.bottom + this.r;
               } else {
                  throw new Error('nothing in side object');
               }
            }
         }
      }
   }
}

class Square {
   constructor(x, y) {
      this.x = x;
      this.y = y;
      this.health = objects.balls.length;

      this.size = 200;
      this.fontSize = this.size / 2;

      objects.squares.push(this);
   }

   draw() {
      ctx.strokeRect(this.x, this.y, this.size, this.size);

      ctx.fillStyle = 'red';
      ctx.font = `${this.fontSize}px Comic Sans MS`;
      const width = ctx.measureText(this.health).width;
      ctx.fillText(this.health, this.x - width / 2 + this.size / 2, this.y + this.fontSize / 3 + this.size / 2);
      ctx.fillStyle = 'black';
   }
}

new Square(marker.x - 400, marker.y - 200);

document.addEventListener('mousemove', (e) => {
   const rect = canvas.getBoundingClientRect();
   mouse.x = e.clientX - rect.left;
   mouse.y = e.clientY - rect.top;
});

document.addEventListener('mousedown', () => {
   mouse.downX = mouse.x;
   mouse.downY = mouse.y;
   mouse.down = true;
});

document.addEventListener('mouseup', () => {
   mouse.down = false;

   if (!marker.shooting && aim.spacing > 20) {
      marker.shooting = true;
      marker.angle = aim.angle;
      marker.frameShot = frameCount - 1;
      marker.ballIndex = 0;
   }
});

let frameCount = 0;

function loop() {
   frameCount++;
   ctx.clearRect(0, 0, cnv.width, cnv.height);

   marker.draw();
   aim.draw();

   for (let i = 0; i < objects.balls.length; i++) {
      if (objects.balls[i]) {
         objects.balls[i].draw();
      }
   }

   for (let i = 0; i < objects.squares.length; i++) {
      objects.squares[i].draw();
   }

   requestAnimationFrame(loop);
}

loop();

// setInterval(loop, 500);
