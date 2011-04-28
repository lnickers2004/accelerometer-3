// ball.js

// Increase this number to speed up or decrease it to slow
// down the effect of acceleration on the ball(s).
var SPEED_SCALE = 50;

function log(message) {
	//console.log(message)
	$("#message").text(message)
}

// --------------------------------------------------------
// Ball
// --------------------------------------------------------
function Ball(board, label) {
	this.element = $("<div class='ball'><div class='label'>"
	                 + label + "</div></div>");
	this.velocity = { x: 0, y: 0 };
	this.elasticity = 0.85; 
	this.offset = this.element.offset; // use jQuery's offset function
	this.bounces = 0;
}

// Applies the acceleration and returns the desired offset
Ball.prototype.moveWithinBounds = function(acceleration, interval, bounds) {
	// determine the ball's new velocity and position
	
	// Note:  the coordinate system of the accelerometer is not the same as
	// that of the screen:  accel x == coord x, but accel y == coord -y!
	this.velocity.x +=  acceleration.x * interval;
	this.velocity.y += -acceleration.y * interval;
	var offsetDelta = {
		x: SPEED_SCALE * this.velocity.x * interval,
		y: SPEED_SCALE * this.velocity.y * interval,
	};
	
	// Figure out where the ball is *now*
	var width = this.element.width();
	var height = this.element.height();
	var offset = this.element.offset();
	
	// ...and calculate where it would be, if there were no walls.
	var result = {
		left:    offset.left + offsetDelta.x,
		right:   offset.left + offsetDelta.x + width,
		top:     offset.top + offsetDelta.y,
		bottom:  offset.top + offsetDelta.y + height,
		hitLeftWall: null,
		hitRightWall: null,
		escaped: null,
		bounced: null,
	};

	// If it would go past the bottom, bounce!
	if (result.bottom > bounds.bottom) {
		this.velocity.y = this.elasticity * (-this.velocity.y);
		var amountToBounce = this.elasticity * (result.bottom - bounds.bottom);
		result.bottom = bounds.bottom - amountToBounce;
		result.top = result.bottom - height;
		result.bounced = true;
		this.bounces += 1;
		log("Bounce # " + this.bounces);
	}
	
	// If it would go past the left/right side, stick to that wall
	// and deaden the horizontal velocity (don't bounce)
	if (result.left <= bounds.left) {
		this.velocity.x = 0;
		result.left = bounds.left;
		result.right = bounds.left + width;
		result.hitLeftWall = true;
		log("Left wall!");
	} else if (result.right > bounds.right) {
		this.velocity.x = 0;
		result.left = bounds.right - width;
		result.right = bounds.right;
		result.hitRightWall = true;
		log("Right wall!");
	}
	
	// If it would go past the top, escape!
	if (result.top < bounds.top) {
		this.velocity.y = 0;
		result.escaped = true;
		log("Escaped!");
	}

	this.element.offset({
		left: result.left,
		top: result.top,
	});
	return result;
};
	

// --------------------------------------------------------
// Board
// --------------------------------------------------------
function Board(id) {
	this.element = $("#" + id);
	this.balls = [];
}

Board.prototype.createBall = function(label) {
	ball = new Ball(this, label);
	this.balls.push(ball);              // add the ball
	this.element.append(ball.element);  // add the div
	var offset = this.element.offset()
	ball.element.offset({
		left: offset.left + (this.element.width() / 2),
		top:  offset.top + (this.element.height() / 2),
	});
}

Board.prototype.removeBall = function(ball) {
	var i = 0
	while (i < this.balls.length) {
		if (ball == this.balls[i]) {
			ball.element.remove(); // remove the ball DOM
			this.balls.splice(i, 1);           // remove the ball model
		} else {
			i++;
		}
	}
}

Board.prototype.doMotion = function(acceleration, interval) {
	var offset = this.element.offset();  // left and top are set
	var bounds = {
		left: offset.left,
		top: offset.top,
		right: offset.left + this.element.width(),
		bottom: offset.top + this.element.height(),
	};
	var escapees = [];
	for (var i = 0; i < this.balls.length; i++) {
		var ball = this.balls[i];
		var result = ball.moveWithinBounds(acceleration, interval, bounds);
		if (result.escaped) {
			escapees.push(ball)
		}
	}
	for (var i = 0; i < escapees.length; i++) {
		this.removeBall(escapees[i]);
	}
}

var board;

function doMotionEvent(e) {
	var acceleration = e.accelerationIncludingGravity;
	var interval = e.interval;
	board.doMotion(acceleration, interval);
}

// untested!
function doMozillaMotionEvent(e) {
	var acceleration = e;
	var interval = e.interval;
	if (!interval) {
		interval = 0.05; // Guess 1/20 of a second
	}
	board.doMotion(acceleration, interval);
}

function initGame() {
	// HTML5 -- works on mobile safari
	window.addEventListener("devicemotion", doMotionEvent, true);
	// untested, but is supposed to work on Firefox
	window.addEventListener("MozOrientation", doMozillaMotionEvent, true);
	board = new Board("board");
	board.createBall("Hi");
	var id = 1;
	$("#create").click(function() { 
		board.createBall(id);
		id += 1;
	});
}

