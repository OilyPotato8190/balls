const cnv = document.getElementById('canvas');
const ctx = cnv.getContext('2d');

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

let mouse = {};
let objects = {
   balls: [null],
   squares: [],
};

let marker = {
   x: cnv.width / 2,
   y: cnv.height * 0.9,
   r: 7,
   shooting: false,
   draw: true,
   angle: 0,
   frameShot: 0,
   ballIndex: 0,
   shootDelay: 5,

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
      this.speed = 10;
      this.r = 90;

      this.setVelocity(angle);
      objects.balls[this.index] = this;
   }

   draw() {
      this.move();
      this.checkCollision();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI);
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
      if (this.x + this.r > cnv.width || this.x - this.r < 0) {
         this.vx *= -1;
      }

      if (this.y - this.r < 0) {
         this.vy *= -1;
      } else if (this.y - this.r > cnv.height) {
         objects.balls[this.index] = null;
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

         let side;

         // Find distance between the circle and the closest edge, also determine which side of the square the circle is on
         if (this.x < squareEdges.left) {
            dist.x = this.x - squareEdges.left;
            side = 'left';
         } else if (this.x > squareEdges.right) {
            dist.x = this.x - squareEdges.right;
            side = 'right';
         }

         if (this.y < squareEdges.top) {
            dist.y = this.y - squareEdges.top;

            if (side === 'left') side = 'top-left';
            else if (side === 'right') side = 'top-right';
            else side = 'top';
         } else if (this.y > squareEdges.bottom) {
            dist.y = this.y - squareEdges.bottom;

            if (side === 'left') side = 'bottom-left';
            else if (side === 'right') side = 'bottom-right';
            else side = 'bottom';
         }

         const totalDist = Math.sqrt(gap.x ** 2 + gap.y ** 2);

         if (totalDist < this.r) {
            // square.health--;

            // Checks if the circle has hit one of the corners
            if (side === 'top-left' || side === 'top-right' || side === 'bottom-left' || side === 'bottom-right') {
               const lastPos = {
                  x: this.x - this.vx,
                  y: this.y - this.vy,
               };

               // Define the sides that make up the corner the ball hit as lines, x = vertical and y = horizontal
               const sideArray = side.split('-');
               const horizontal = squareEdges[sideArray[0]];
               const vertical = squareEdges[sideArray[1]];

               // Define the path of the ball by the line equation y = mx + c
               const m = (lastPos.y - this.y) / (lastPos.x - this.x);
               const c = this.y - this.x * m;

               // Get the angle of the ball's path
               const angle = Math.atan(m);

               // Determines which solution of the quadratic to use, depending on whether the ball is moving to the left or the right
               const sign = Math.sign(lastPos.x - this.x);

               // The quadratic equation (vertical - t)**2 + (horizontal - mt + c)**2 = r**2 solved for t in order to find
               // the x and y of the center of the circle (x - h)**2 + (y - k**2) = r**2 moving along the path y = mx + c
               // which also intersects with the corner of the square (vertical, horizontal)
               const numerator =
                  vertical +
                  m * horizontal -
                  m * c +
                  sign *
                     Math.sqrt(
                        -(m ** 2) * vertical ** 2 +
                           2 * m * vertical * horizontal -
                           2 * m * c * vertical +
                           m ** 2 * this.r ** 2 +
                           2 * c * horizontal +
                           this.r ** 2 -
                           c ** 2 -
                           horizontal ** 2
                     );
               const denominator = 1 + m ** 2;
               const t = numerator / denominator;

               this.x = t;
               this.y = m * t + c;

               // Normal to the tangent line of the circle touching the point (vertical, horizontal)
               const normalAngle = Math.atan((horizontal - this.y) / (vertical - this.x));

               // Using the law of reflection (angle of reflection = angle of incidence) find the angle of the circle's new path
               const incidenceAngle = angle - normalAngle;
               const reflectionAngle = normalAngle - incidenceAngle;

               this.setVelocity(reflectionAngle);

               // console.log(this.r);
               // console.log(horizontal);
               // console.log(vertical);
               // console.log(angle);
               // console.log(m);
               // console.log(c);
               // console.log(sign);
               // console.log(t);
               // console.log(this.x);
               // console.log(this.y);
               // console.log(normalAngle);
               // console.log(incidenceAngle);
               // console.log(reflectionAngle);
            } else {
               if (side === 'left' || side === 'right') this.vx *= -1;
               else this.vy *= -1;
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
      this.fontSize = this.size * 0.6;

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

new Square(marker.x - 5, marker.y - 500);

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
