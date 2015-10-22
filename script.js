/*
Created by Sajjad Siddiqui
*/

var canvas;
var context;
var canvasHeight;
var canvasWidth;


/* 
0 - start screen
1 - lvl 1
2 - lvl 2
*/
var gameState = 0;
 /* different from isPaused. isRunning checks if the game is running 
 		for the first time or if it has been initialized already */
var isRunning = false;
var isPaused = false;
var gameloop;
var interval = 20; // in milliseconds
var score = 0; 
var scoreBoard;
var highScore; 

var bugs = [];
var deadBugs  = [];
var food = [];

var foodLimit = 5;
var bugWidth = 10;
var foodRadius = 10;

var countdownTimer;
var timeLeft;
var timeGiven = 60;


function Bug() {
  this.x = 0;
  this.y = 0;
  this.w = 10;
  this.h = 40;
  this.angle = 89; // in degrees
  this.finalAngle = 91;
  this.alpha = 1;
  this.score = -1;
  this.color = [0,0,0];
  this.speed = 0;
}

function Food() {
  this.x = 0;
  this.y = 0; 
  this.radius = 10; 
}

function init() {
  canvas = document.getElementById("game");
  context = canvas.getContext("2d");
  canvas.addEventListener("mousedown", getPosition, false);
  scoreBoard = document.getElementById("scoreBoard");
  canvasHeight = canvas.height;
  canvasWidth = canvas.width;
  gameloop = setInterval(draw, interval);
  isRunning = true;
  
  initializeLevel();

  // generates bug ever 1-3 seconds
  generateBug();
}

function generateBug() {
  var rand = Math.round(Math.random() * (3000 - 1000)) + 1000;
  setTimeout(function() {
    var x = getRandomInt (0 + bugWidth, canvasWidth - bugWidth);
    var y = 0;
    if (!isPaused) {
      addBug(x,y);
    }
    generateBug();
  }, rand);
}

function initializeLevel() {
  if (gameState == 2) {
    if (localStorage.lvl2 != null) {
    highScore = localStorage.lvl2; 
    } else {
      highScore = 0;
    }
  } else {
    if (localStorage.lvl1 != null) {
    highScore = localStorage.lvl1; 
    } else {
      highScore = 0;
    }
  }
  
  generateFood();
  startTimer(timeGiven-1);
  scoreBoard.innerHTML = "Score: " + score;
  document.getElementById("highscore").innerHTML = "High Score: " + highScore;
  document.getElementById("levelboard").innerHTML = "Level - " + gameState;
}

function clearLevel() {

  food = [];
  bugs = [];
  deadBugs = [];
  score = 0;
  clearTimeout(countdownTimer);
  timeLeft = timeGiven - 1;
}

function endGame() {
  document.getElementById("score_inline").innerHTML =  score;
  clearLevel();
  clearInterval(gameloop);
  gameState = 0;
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("endScreen").style.display = "block";
}

function startOver() {
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("startScreen").style.display = "block";
  document.getElementById("endScreen").style.display = "none";
}

function updateHighscore() {
  if (score > highScore) {
    if (gameState == 1) {
        localStorage.lvl1 = score;
    }
    else {
        localStorage.lvl2 = score;
    }
  }
}

function manageGameState () {

  if (levelWasLost()) {
    updateHighscore();
    endGame();
  }

  if (levelWasWon()) {  
    if (gameState == 1) {
      
      updateHighscore();
      // transition from lvl1 to lvl2
      clearLevel();
      gameState = 2;
      
      if (localStorage.lvl2 != null) {
        highScore = localStorage.lvl2; 
      } else {
        highScore = 0;
      }
      initializeLevel();
    }
    else {
      // end game
      updateHighscore();
      endGame();
    }
  }
}

function draw() {
  clear(context);

  manageGameState();

  for (var i = 0; i < bugs.length; i++) {
    drawBug(bugs[i]);

  }

  for (var i = 0; i < deadBugs.length; i++) {
    drawBug(deadBugs[i]);

    var factor = 1/2; // converting from 2 seconds to 1 second
    var time = interval/1000;
    deadBugs[i].alpha = deadBugs[i].alpha - ((time/factor) * deadBugs[i].alpha);
  }

  for (var j = 0; j < food.length; j++) {
    drawFood(food[j]);
  }

  getClosestFood();
  if (!isPaused) {
    moveBugs();
    eatFood();
  }
}

function levelWasWon() {
  if ((!levelWasLost()) && timeLeft < 1) {
    return true;
  }
  return false;
}

function levelWasLost() {
  if (food.length < 1){
    return true;
  }
  return false;
}

function eatFood() {
  var newFood = [];
  var ate = false;

  for (var i = 0; i < food.length; i++) {
    var yumyum = food[i];
    for (var j = 0; j < bugs.length; j++) {
      var bug = bugs[j];
      if (didCollide(yumyum, bug)) {
        ate = true;
      }
    }
    if (!ate) {
      newFood.push(yumyum);
    }
    ate = false;
  }
  food = newFood;
}

function getClosestFood() {

  for (var i = 0; i < bugs.length; i++) {

    var currentBug = bugs[i];
    var deltaX = canvasWidth;
    var deltaY = canvasHeight;
    var smallestD = pythagorean (deltaX, deltaY);

    for (var j = 0; j < food.length; j++) {
      
      var currentFood = food[j];
      deltaX = currentBug.x - currentFood.x;
      deltaY = currentBug.y - currentFood.y;
      var distance = pythagorean(Math.abs(deltaX), Math.abs(deltaY));
       
      if (distance < smallestD) {
        smallestD = distance;
        currentBug.finalAngle = getAngleBetween(currentBug, currentFood, deltaY, deltaX);
      }
    }
  }
}

function getAngleBetween(currentBug, currentFood, opp, adj) {

	if (adj == 0) {
    return 90;
  }
  var a = Math.atan(opp/adj)*180/Math.PI; 

	// tl
	if ((currentBug.x < currentFood.x) && (currentBug.y < currentFood.y)) { 
		return a; 

	}
	// tr
	else if ((currentBug.x > currentFood.x) && (currentBug.y < currentFood.y)) {
		return a + 180; 
	}
	// bl
	else if ((currentBug.x < currentFood.x) && (currentBug.y > currentFood.y)) {
		return a;
	}
	// br
	else {
		return 270-a;
	}
}

// circle - {x:  y:, radius:}
// rect - {x:, y:, w:, h:, angle:}
function didCollide(circle, rect) {
  
  var rectCenterX = rect.x;
  var rectCenterY = rect.y;

  var rectX = rectCenterX - rect.w / 2;
  var rectY = rectCenterY - rect.h / 2;

  var rectReferenceX = rectX;
  var rectReferenceY = rectY;
  
  // rotate circle's center point back
  var unrotatedCircleX = Math.cos(rect.angle) * (circle.x - rectCenterX) - Math.sin(rect.angle) * (circle.y - rectCenterY) + rectCenterX;
  var unrotatedCircleY = Math.sin(rect.angle) * (circle.x - rectCenterX) + Math.cos(rect.angle) * (circle.y - rectCenterY) + rectCenterY;

  // closest point in the rectangle to the center of circle rotated backwards(unrotated)
  var closestX, closestY;

  // find the unrotated closest x point from center of unrotated circle
  if (unrotatedCircleX < rectReferenceX) {
    closestX = rectReferenceX;
  } 
  else if (unrotatedCircleX > rectReferenceX + rect.w) {
    closestX = rectReferenceX + rect.w;
  } 
  else {
    closestX = unrotatedCircleX;
  }
 
  // find the unrotated closest y point from center of unrotated circle
  if (unrotatedCircleY < rectReferenceY) {
    closestY = rectReferenceY;
  } 
  else if (unrotatedCircleY > rectReferenceY + rect.h) {
    closestY = rectReferenceY + rect.h;
  } 
  else {
    closestY = unrotatedCircleY;
  }
 
  var collision = false;
  var deltaX = Math.abs(unrotatedCircleX - closestX);
  var deltaY = Math.abs(unrotatedCircleY - closestY);
  var distance = pythagorean(deltaX,deltaY);
  
  if (distance < circle.radius) {
    collision = true;
  }
  else {
    collision = false;
  }

  return collision;
}

function doesFoodOverlap(x,y) {

  for (var i = 0; i < food.length; i++) {
    var food2 = food[i];
    var dx = x - food2.x;
    var dy = y - food2.y;
    var distance = pythagorean(dx,dy);

    if (distance < foodRadius + food2.radius) {
      return true;
    }
  }

  return false;
}

function doesBugOverlap(bug1, dontCompare) {
  var b1 = getCorners(bug1);

  for (var i = 0; i < bugs.length; i++) {
    var bug2 = bugs[i];
    if (bug2 != dontCompare) {
      var b2 = getCorners(bug2);
      if (doPolygonsIntersect (b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

function getCorners(bug) {
  var corners = [];
  // tl
  var pivot = [bug.x,bug.y];

  var point = [bug.x - bug.w/2, bug.y - bug.h/2];
  var tl = rotatePoint(pivot, point, bug.angle);
  corners.push({x:tl[0], y:tl[1]});

  // tr
  point = [bug.x + bug.w/2, bug.y - bug.h/2];
  var tr = rotatePoint(pivot, point, bug.angle);
  corners.push({x:tr[0], y:tr[1]});

  // br
  point = [bug.x + bug.w/2, bug.y + bug.h/2];
  var br = rotatePoint(pivot, point, bug.angle);
  corners.push({x:br[0], y:br[1]});

  // bl
  point = [bug.x - bug.w/2, bug.y + bug.h/2];
  var bl = rotatePoint(pivot, point, bug.angle);
  corners.push({x:bl[0], y:bl[1]});

  return corners;
}

// takes degrees
function rotatePoint(pivot, point, angleDeg) {
  var angle = ((angleDeg - 90)* Math.PI) / (180);
  var x = Math.round((Math.cos(angle) * (point[0] - pivot[0])) -
                     (Math.sin(angle) * (point[1] - pivot[1])) +
                     pivot[0]),
      y = Math.round((Math.sin(angle) * (point[0] - pivot[0])) +
                     (Math.cos(angle) * (point[1] - pivot[1])) +
                     pivot[1]);
  return [x, y];
}

function isUndefined(o) {
  if (o== undefined) {
    return true;
  }
  return false;
}

//   a  [{x:, y:}, {x:, y:},...]  
//   b  [{x:, y:}, {x:, y:},...]  
function doPolygonsIntersect (a, b) {
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        var polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            var i2 = (i1 + 1) % polygon.length;
            var p1 = polygon[i1];
            var p2 = polygon[i2];

            // find the line perpendicular to this edge
            var normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if (isUndefined(minA) || projected < minA) {
                    minA = projected;
                }
                if (isUndefined(maxA) || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if (isUndefined(minB) || projected < minB) {
                    minB = projected;
                }
                if (isUndefined(maxB) || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
};

function moveBugs() {
  for (var i = 0; i < bugs.length; i++) {
    var bug = bugs[i];
    moveBug(bug);
  }
}

function moveBug(bug) {

  var dist = (interval/1000) * bug.speed;
  var newX = getXOffsetted (bug.x, dist, bug.angle);
  var newY = getYOffsetted (bug.y, dist, bug.angle);
  
  var tempbug = new Bug;
  tempbug.x = newX;
  tempbug.y = newY;
  tempbug.angle = bug.angle;
  tempbug.finalAngle = bug.finalAngle;
  rotate(tempbug);
  if (!doesBugOverlap(tempbug, bug) || isPathEmpty(bug) || (bug.score == 5)) {
    bug.x = newX;
    bug.y = newY;
    rotate(bug);
  }
}

function isPathEmpty(bug) {

  var newX = getXOffsetted (bug.x, (bug.h), bug.angle);
  var newY = getYOffsetted (bug.y, (bug.h), bug.angle);
  var tempbug = new Bug;
  tempbug.x = newX;
  tempbug.y = newY;
  tempbug.angle = bug.angle;
  tempbug.finalAngle = bug.finalAngle;
  if (!doesBugOverlap(tempbug, bug)) {
    return true;
  }
  return false;
}

function rotate(bug) {
  var add = Math.abs(bug.finalAngle - (bug.angle + 1));
  var sub = Math.abs(bug.finalAngle - (bug.angle - 1));

  var i = 0;
  var delta = Math.abs(bug.finalAngle - bug.angle);

  if (add < sub) {
    
    bug.angle += 5;
    delta = Math.abs(bug.finalAngle - bug.angle);
    if (delta < 7) {
      bug.angle = bug.finalAngle;
    } 
  }
  else {
    bug.angle -= 5;
    delta = Math.abs(bug.finalAngle - bug.angle);
    if (delta < 7) {
      bug.angle = bug.finalAngle;
    } 
  } 
}

function incrementScore(toAdd) {
   score += toAdd;
   scoreBoard.innerHTML = "Score: " + score
}

function generateFood() {
  var foodAdded = 0;

  while (foodAdded < foodLimit) {
    var x = getRandomInt (0 + foodRadius, canvasWidth - foodRadius);
    var y = getRandomInt ( (0.2 * canvasHeight) + foodRadius, canvasHeight - foodRadius);
    
    if (!doesFoodOverlap(x,y)) {
      addFood(x,y,foodRadius);
      foodAdded++;
    }
  }
}

function addFood(x,y,radius) {
  var newFood = new Food;
  newFood.x = x;
  newFood.y = y;
  newFood.radius = radius;
  food.push(newFood);
}

function addBug(x,y) {
  var newBug = new Bug;
  newBug.x = x;
  newBug.y = y;

  var whichBug = getRandomInt(1, 10);

  if (!doesBugOverlap(newBug, newBug)) {
    //black bug
    if (whichBug <= 3) {
      newBug.score = 5;    
      newBug.color = [0,0,0];
      newBug.speed = 150;
      if (gameState == 2){
        newBug.speed = 200;
      }
    }
    //red bug
    else if (whichBug <= 6) {
      newBug.score = 3;    
      newBug.color = [255,0,0];
      newBug.speed = 75;
      if (gameState == 2){
        newBug.speed = 100;
      }
    }
    //orange bug
    else {
      newBug.score = 1;    
      newBug.color = [255,127,80];
      newBug.speed = 60;
      if (gameState == 2){
        newBug.speed = 80;
      }
    } 
    bugs.push(newBug);
  }
}

function drawBug(bug) {
  var x = bug.x;
  var y = bug.y;
  var ellipseAngle = 90 - bug.angle;

  context.beginPath();

  var newX = getXOffsetted (x, (bug.h/2)-4, bug.angle);
  var newY = getYOffsetted (y, (bug.h/2)-4, bug.angle);

  context.arc(newX, newY, bug.w/2, 0, 2*Math.PI); // head
  var h = (bug.h-8)/2; 

  while (h>0)
  {
    drawEllipse(x, y, (bug.w/2), h, ellipseAngle*Math.PI/180); // body
    h--;
  }

  var r = bug.color[0];
  var g = bug.color[1];
  var b = bug.color[2]; 

  context.strokeStyle = "rgba("+ r +","+ g +","+ b +","+ bug.alpha +")";
  context.fillStyle = "rgba("+ r +","+ g +","+ b +","+ bug.alpha +")";
  context.fill();
  context.stroke();
  context.closePath();
}

function funky(a) {

  return 360 - a; 
}

// takes degrees
function getXOffsetted(x, hyp, angle) {


  // goes right
  if (((angle > funky(0)) && (angle < funky(90))) || ((angle > funky(270)) && (angle < funky(360)))) {
    return  x - Math.cos(angle*Math.PI/180) * hyp;
  }
  return Math.cos(angle*Math.PI/180) * hyp + x;
}

// takes degrees
function getYOffsetted(y, hyp, angle) {

  // goes down
  if ((angle > funky(0)) && (angle < funky(180))) {
    return y - Math.sin(angle*Math.PI/180) * hyp;
  }
  return Math.sin(angle*Math.PI/180) * hyp + y;
}

function drawEllipse(x, y, width, height, rotation) {
  // draw ellipse of arbitrary orientation
  var t = 0; //Parametric equation variable
  var x0 = x + width*Math.cos(rotation);// initial x-val
  var y0 = y - width*Math.sin(rotation);// initial y-val
  var x1 = x0;// final x-val
  var y1 = y0;// final y-val
    
  for (t=0; t <= 6.3; t = t + 0.1) {
    x0 = x1;
    y0 = y1;
    x1 = x + width*Math.cos(t)*Math.cos(rotation) - height*Math.sin(t)*Math.sin(rotation);
    y1 = y - width*Math.cos(t)*Math.sin(rotation) - height*Math.sin(t)*Math.cos(rotation);
    context.moveTo (x0,y0);
    context.lineTo(x1,y1);
  } 
}

function drawFood(food) {
  context.beginPath();
  context.arc(food.x, food.y, food.radius, 0, 2*Math.PI);
  context.strokeStyle = "rgba(210,180,140,1)";
  context.fillStyle = "rgba(210,180,140,1)";
  context.fill();

  context.stroke();
  context.closePath();  

  context.beginPath();
  context.arc(food.x-1, food.y+4, 3, 0, 2*Math.PI);
  context.arc(food.x+5, food.y-2, 3, 0, 2*Math.PI);
  context.fillStyle = "rgba(139,69,19,1)";
  context.fill();
  context.stroke();
  context.closePath();  

}

function killBug(x,y) {

  var newBugs = []
  for (var i = 0; i < bugs.length; i++) {
    bug = bugs[i];
    var clickCircle = {x: x, y: y, radius: 30};
    if (!(didCollide(clickCircle, bug))) {
      newBugs.push(bug);
    } else {
      deadBugs.push(bug);
      incrementScore(bug.score);
    }
  }
  bugs = newBugs;
}

function getPosition(event) {
  var x = event.offsetX;
  var y = event.offsetY;

  if (!isPaused) { 
    killBug(x,y);
  }
}

function startGame() {
  var btn = document.getElementById("lvl1").checked;
  var btn2 = document.getElementById("lvl2").checked;

  if (btn2) {
    gameState = 2;

    if (localStorage.lvl2 != null) {
      highScore = localStorage.lvl2;
    } else {
      highScore = 0;
    }
  } else {
    gameState = 1;
  }

  if (!isRunning) {
    init();

  } else {
    
    gameloop = setInterval(draw, interval);
    clearLevel();
    initializeLevel();
  }
  document.getElementById("gameScreen").style.display = "block";
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("endScreen").style.display = "none";
}

function toggleGame() {
  // localStorage.clear(); 
  if(!isPaused){
    pauseGame();
  }
  else {
    resumeGame();
  }
}

// takes seconds
function startTimer(duration) {
  var seconds;
  var timer = duration, seconds;
  countdownTimer = setInterval(function () {
      seconds = parseInt(timer % 60, 10);
      seconds = seconds < 10 ? "0" + seconds : seconds;
      timeLeft = parseInt(seconds);
      document.getElementById("countdownTimer").innerHTML =  timeLeft + " sec";

      if (--timer < 0) {
          timer = duration;
      }
  }, 1000);
}

function level1selector() {
  document.getElementById("score").innerHTML = "High Score: " + localStorage.lvl1;
}
function level2selector() {
  document.getElementById("score").innerHTML = "High Score: " + localStorage.lvl2;
}
function pauseGame() {
  isPaused = true;
  document.getElementById("pauseBtn").innerHTML = "Play";
  clearTimeout(countdownTimer);
}

function resumeGame() {
  isPaused = false;
  document.getElementById("pauseBtn").innerHTML = "Pause";
  startTimer(timeLeft);
}

function pythagorean(x, y) {
  var p = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
  return p;
}

function clear(c) {
  c.clearRect(0, 0, canvasWidth, canvasHeight);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}