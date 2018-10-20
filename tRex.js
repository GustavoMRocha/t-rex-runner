//******************************************************************************
/**
 * T-rex game character.
 * @param {HTMLCanvas} canvas
 * @param {Object} spritePos Positioning within image sprite.
 * @constructor
 */
function Trex(canvas, spritePos, runner) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.spritePos = spritePos;
    this.xPos = 0;
    this.yPos = 0;
    // Position when on the ground.
    this.groundYPos = 0;
    this.currentFrame = 0;
    this.currentAnimFrames = [];
    this.blinkDelay = 0;
    this.blinkCount = 1;
    this.animStartTime = 0;
    this.timer = 0;
    this.msPerFrame = 1000 / FPS;
    this.config = Trex.config;
    // Current status.
    this.status = Trex.status.WAITING;

    this.jumping = false;
    this.ducking = false;
    this.jumpVelocity = 0;
    this.reachedMinHeight = false;
    this.speedDrop = false;
    this.jumpCount = 0;
    this.jumpspotX = 0;

    this.controller = new Controller();
    this.gameOver = false;
    this.runner = runner;
    this.lastAction = Controller.actions.NEUTRAL;
    this.obstaclesCounter = 0;
    this.lastObstacle = null;

    this.init();
};


/**
 * T-rex player config.
 * @enum {number}
 */
Trex.config = {
    DROP_VELOCITY: -5,
    GRAVITY: 0.6,
    HEIGHT: 47,
    HEIGHT_DUCK: 25,
    INIITAL_JUMP_VELOCITY: -10,
    INTRO_DURATION: 1500,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    SPEED_DROP_COEFFICIENT: 3,
    SPRITE_WIDTH: 262,
    START_X_POS: 50,
    WIDTH: 44,
    WIDTH_DUCK: 59
};


/**
 * Used in collision detection.
 * @type {Array<CollisionBox>}
 */
Trex.collisionBoxes = {
    DUCKING: [
        new CollisionBox(1, 18, 55, 25)
    ],
    RUNNING: [
        new CollisionBox(22, 0, 17, 16),
        new CollisionBox(1, 18, 30, 9),
        new CollisionBox(10, 35, 14, 8),
        new CollisionBox(1, 24, 29, 5),
        new CollisionBox(5, 30, 21, 4),
        new CollisionBox(9, 34, 15, 4)
    ]
};


/**
 * Animation states.
 * @enum {string}
 */
Trex.status = {
    CRASHED: 'CRASHED',
    DUCKING: 'DUCKING',
    JUMPING: 'JUMPING',
    RUNNING: 'RUNNING',
    WAITING: 'WAITING',
};

/**
 * Blinking coefficient.
 * @const
 */
Trex.BLINK_TIMING = 7000;


/**
 * Animation config for different states.
 * @enum {Object}
 */
Trex.animFrames = {
    WAITING: {
        frames: [44, 0],
        msPerFrame: 1000 / 3
    },
    RUNNING: {
        frames: [88, 132],
        msPerFrame: 1000 / 12
    },
    CRASHED: {
        frames: [220],
        msPerFrame: 1000 / 60
    },
    JUMPING: {
        frames: [0],
        msPerFrame: 1000 / 60
    },
    DUCKING: {
        frames: [264, 323],
        msPerFrame: 1000 / 8
    }
};


/**
 * Key code mapping.
 * @enum {Object}
 */
Trex.keycodes = {
    JUMP: { '38': 1, '32': 1 },  // Up, spacebar
    DUCK: { '40': 1 },  // Down
    RESTART: { '13': 1 }  // Enter
};

/**
 * Runner event names.
 * @enum {string}
 */
Trex.events = {
    ANIM_END: 'webkitAnimationEnd',
    CLICK: 'click',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    MOUSEDOWN: 'mousedown',
    MOUSEUP: 'mouseup',
    RESIZE: 'resize',
    TOUCHEND: 'touchend',
    TOUCHSTART: 'touchstart',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
    FOCUS: 'focus',
    LOAD: 'load'
};

Trex.prototype = {
    /**
     * T-rex player initaliser.
     * Sets the t-rex to blink at random intervals.
     */
    init: function () {
        this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
            Runner.config.BOTTOM_PAD;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

        this.draw(0, 0);
        this.update(0, Trex.status.WAITING);
    },

    /**
     * Setter for the jump velocity.
     * The approriate drop velocity is also set.
     */
    setJumpVelocity: function (setting) {
        this.config.INIITAL_JUMP_VELOCITY = -setting;
        this.config.DROP_VELOCITY = -setting / 2;
    },

    /**
     * Perform outputed action from the neural network 
     */
    takeAction: function(){
        if (this.runner.playing){
            var hasObstacles = this.runner.runningTime > this.runner.config.CLEAR_TIME;
                if(hasObstacles){

                var firstObstacle = this.runner.horizon.obstacles[0];

                /* NeuralNet inputs */
                var action = this.controller.nextAction(firstObstacle, this, this.runner.currentSpeed);

                // Perform actions
                if(this.lastAction === Controller.actions.NEUTRAL){
                    if (action === Controller.actions.JUMP){
                        // console.log("Pressing UP");
                        e = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, keyCode: 38});
                        this.onKeyDown(e);
                    } else if (action === Controller.actions.DUCK){
                        // console.log("Pressing DOWN");
                        e = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, keyCode: 40});
                        this.onKeyDown(e);
                    }
                } else if (this.lastAction === Controller.actions.JUMP){
                    if (action !== Controller.actions.JUMP){
                        //Release jump and take another action
                        e = new KeyboardEvent("keyup", {bubbles: true, cancelable: true, keyCode: 38});
                        // console.log("Releasing UP");
                        this.onKeyUp(e);
                        if (action === Controller.actions.DUCK){
                            // console.log("Pressing DOWN");
                            e = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, keyCode: 40});
                            this.onKeyDown(e);                            
                        }
                    } else{
                        // Do nothing, it is already jumping
                    }
                } else if (this.lastAction === Controller.actions.DUCK){
                    if (action !== Controller.actions.DUCK){
                        //Release duck and take another action
                        e = new KeyboardEvent("keyup", {bubbles: true, cancelable: true, keyCode: 40});
                        this.onKeyUp(e);
                        // console.log("Releasing DOWN");
                        if(action === Controller.actions.JUMP){
                            // console.log("Pressing UP");
                            e = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, keyCode: 38});
                            this.onKeyDown(e);
                        }
                    } else{
                        // Do nothing, it is already ducking
                    }
                }
                this.lastAction = action;
            }
        }
    },
    /**
     * Set the animation status.
     * @param {!number} deltaTime
     * @param {Trex.status} status Optional status to switch to.
     */
    update: function (deltaTime, opt_status) {
        this.timer += deltaTime;

        if(this.status === Trex.status.CRASHED) {
            // Hide dino because its dead
            // this.draw(this.currentAnimFrames[this.currentFrame], 0, 0.0);
            return;
        }

        // Update the status.
        if (opt_status) {
            this.status = opt_status;
            this.currentFrame = 0;
            this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
            this.currentAnimFrames = Trex.animFrames[opt_status].frames;

            if (opt_status == Trex.status.WAITING) {
                this.animStartTime = getTimeStamp();
                this.setBlinkDelay();
            }
        }

        // Game intro animation, T-rex moves in from the left.
        if (this.playingIntro && this.xPos < this.config.START_X_POS) {
            this.xPos += Math.round((this.config.START_X_POS /
                this.config.INTRO_DURATION) * deltaTime);
        }

        if (this.status == Trex.status.WAITING) {
            this.blink(getTimeStamp());
        } else if(this.status === Trex.status.CRASHED) {
            // Hide dino because its dead
            this.draw(this.currentAnimFrames[this.currentFrame], 0, 0.0);
        } else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }

        // Update the frame position.
        if (this.timer >= this.msPerFrame) {
            this.currentFrame = this.currentFrame ==
                this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
            this.timer = 0;
        }

        // Speed drop becomes duck if the down key is still being pressed.
        if (this.speedDrop && this.yPos == this.groundYPos) {
            this.speedDrop = false;
            this.setDuck(true);
        }
    },

    /**
     * Draw the t-rex to a particular position.
     * @param {number} x
     * @param {number} y
     */
    draw: function (x, y, opacity = 0.5) {
        var sourceX = x;
        var sourceY = y;
        var sourceWidth = this.ducking && this.status != Trex.status.CRASHED ?
            this.config.WIDTH_DUCK : this.config.WIDTH;
        var sourceHeight = this.config.HEIGHT;

        if (IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;
        }

        // Adjustments for sprite sheet position.
        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;

        // Ducking.
        if (this.ducking && this.status != Trex.status.CRASHED) {
            this.canvasCtx.filter = "sepia(1) opacity(" + opacity.toString() + ")";
            this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY,
                sourceWidth, sourceHeight,
                this.xPos, this.yPos,
                this.config.WIDTH_DUCK, this.config.HEIGHT);
            this.canvasCtx.filter = "none";
            
        } else {
            // Crashed whilst ducking. Trex is standing up so needs adjustment.
            if (this.ducking && this.status == Trex.status.CRASHED) {
                this.xPos++;
            }
            // Standing / running
            this.canvasCtx.filter = "sepia(1) opacity(" + opacity.toString() + ")";
            this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY,
                sourceWidth, sourceHeight,
                this.xPos, this.yPos,
                this.config.WIDTH, this.config.HEIGHT);
            this.canvasCtx.filter = "none";
        }
    },

    /**
     * Sets a random time for the blink to happen.
     */
    setBlinkDelay: function () {
        this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
    },

    /**
     * Make t-rex blink at random intervals.
     * @param {number} time Current time in milliseconds.
     */
    blink: function (time) {
        var deltaTime = time - this.animStartTime;
        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);

            if (this.currentFrame == 1) {
                // Set new random delay to blink.
                this.setBlinkDelay();
                this.animStartTime = time;
                this.blinkCount++;
            }
        }
    },

    /**
     * Initialise a jump.
     * @param {number} speed
     */
    startJump: function (speed) {
        if (!this.jumping) {
            this.update(0, Trex.status.JUMPING);
            // Tweak the jump velocity based on the speed.
            this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - (speed / 10);
            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
        }
    },

    /**
     * Jump is complete, falling down.
     */
    endJump: function () {
        if (this.reachedMinHeight &&
            this.jumpVelocity < this.config.DROP_VELOCITY) {
            this.jumpVelocity = this.config.DROP_VELOCITY;
        }
    },

    /**
     * Update frame for a jump.
     * @param {number} deltaTime
     * @param {number} speed
     */
    updateJump: function (deltaTime, speed) {
        var msPerFrame = Trex.animFrames[this.status].msPerFrame;
        var framesElapsed = deltaTime / msPerFrame;

        // Speed drop makes Trex fall faster.
                
        if (this.speedDrop) {
            this.yPos += Math.round(this.jumpVelocity *
                this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
        } else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }

        this.jumpVelocity += this.config.GRAVITY * framesElapsed;
        // Minimum height has been reached.
        if (this.yPos < this.minJumpHeight || this.speedDrop) {
            this.reachedMinHeight = true;
        }

        // Reached max height
        if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
            this.endJump();
        }

        // Back down at ground level. Jump completed.
        if (this.yPos > this.groundYPos) {
            this.reset();
            this.jumpCount++;
        }
        this.update(deltaTime);
    },

    /**
     * Set the speed drop. Immediately cancels the current jump.
     */
    setSpeedDrop: function () {
        this.speedDrop = true;
        this.jumpVelocity = 1;
    },

    /**
     * @param {boolean} isDucking.
     */
    setDuck: function (isDucking) {
        if (isDucking && this.status != Trex.status.DUCKING) {
            this.update(0, Trex.status.DUCKING);
            this.ducking = true;
        } else if (this.status == Trex.status.DUCKING) {
            this.update(0, Trex.status.RUNNING);
            this.ducking = false;
        }
    },

    /**
     * Revice the t-rex
     */
    revive: function(){
        this.status = Trex.status.RUNNING;
        this.lastObstacle = null;
        this.obstaclesCounter = 0;
        this.reset();
    },

    /**
     * Reset the t-rex to running at start of game.
     */
    reset: function () {
        this.yPos = this.groundYPos;
        this.xPos = 0;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.update(0, Trex.status.RUNNING);
        this.midair = false;
        this.speedDrop = false;
        this.jumpCount = 0;
    },
    checkForCollision: function(obstacle) {
        if (this.status === Trex.status.CRASHED) return true;
        if (obstacle !== this.lastObstacle) {
            this.lastObstacle = obstacle;
            this.obstaclesCounter += 1;
        }
        this.gameOver = checkForCollision(obstacle, this);
        return this.gameOver;
    },

    /**
     * Event handler.
     */
    handleEvent: function (e) {
        return (function (evtType, events) {
            switch (evtType) {
                case events.KEYDOWN:
                case events.TOUCHSTART:
                case events.MOUSEDOWN:
                    this.onKeyDown(e);
                    break;
                case events.KEYUP:
                case events.TOUCHEND:
                case events.MOUSEUP:
                    this.onKeyUp(e);
                    break;
            }
        }.bind(this))(e.type, Trex.events);
    },

    /**
     * Process keydown.
     * @param {Event} e
     */
    onKeyDown: function (e) {
        // Prevent native page scrolling whilst tapping on mobile.
        if (IS_MOBILE && this.runner.playing) {
            e.preventDefault();
        }

        if (e.target != this.runner.detailsButton || true) {
            if (!this.crashed && (Trex.keycodes.JUMP[e.keyCode] ||
                e.type == Trex.events.TOUCHSTART)) {
                if (!this.runner.playing) {
                    // this.loadSounds();
                    this.runner.playing = true;
                    this.runner.update();
                    if (window.errorPageController) {
                        errorPageController.trackEasterEgg();
                    }
                }
                //  Play sound effect and jump on starting the game for the first time.
                if (!this.jumping && !this.ducking) {
                    // this.runner.playSound(this.runner.soundFx.BUTTON_PRESS);
                    this.startJump(this.runner.currentSpeed);
                }
            }
            if (this.runner.crashed && e.type == Trex.events.TOUCHSTART &&
                e.currentTarget == this.runner.containerEl) {
                this.runner.restart();
            }
        }

        if (this.runner.playing && !this.runner.crashed && Trex.keycodes.DUCK[e.keyCode]) {
            e.preventDefault();
            if (this.jumping) {
                // Speed drop, activated only when jump key is not pressed.
                this.setSpeedDrop();
            } else if (!this.jumping && !this.ducking) {
                // Duck.
                this.setDuck(true);
            }
        }
    },


    /**
     * Process key up.
     * @param {Event} e
     */
    onKeyUp: function (e) {
        var keyCode = String(e.keyCode);
        var isjumpKey = Trex.keycodes.JUMP[keyCode] ||
            e.type == Trex.events.TOUCHEND ||
            e.type == Trex.events.MOUSEDOWN;
        if (this.runner.isRunning() && isjumpKey) {
            this.endJump();
        } else if (Trex.keycodes.DUCK[keyCode]) {
            this.speedDrop = false;
            this.setDuck(false);
        } else if (this.runner.crashed) {
            // Check that enough time has elapsed before allowing jump key to restart.
            var deltaTime = getTimeStamp() - this.runner.time;

            if (Trex.keycodes.RESTART[keyCode] || this.runner.isLeftClickOnCanvas(e) ||
                (deltaTime >= this.runner.config.GAMEOVER_CLEAR_TIME &&
                    Trex.keycodes.JUMP[keyCode])) {
                this.runner.restart();
            }
        } else if (this.paused && isjumpKey) {
            // Reset the jump state
            this.reset();
        }
    }
};