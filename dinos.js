//******************************************************************************
/**
 * T-rex collection.
 * @param {HTMLCanvas} canvas
 * @param {Object} spritePos Positioning within image sprite.
 * @param {number} numberOfDinos How many tRexes in the collection
 * @param {Runner} runner T-Rex Runner object
 * @constructor
 */
function Dinos(canvas, spritePos, numberOfDinos, runner) {

    this.dinos = [];

    for (var i=0; i<numberOfDinos; i++){
        this.dinos.push(new Trex(canvas, spritePos, runner));
    };

    this.totalDinos = numberOfDinos;
    this.deadDinos = 0;
};

Dinos.prototype = {

    checkForCollision: function(obstacle){
        for (tRex of this.dinos){
            var crashed = tRex.checkForCollision(obstacle, tRex);
            if(crashed) {
                tRex.update(100, Trex.status.CRASHED);
                this.deadDinos += 1;
            }
        }
        var gameOver;
        if(this.deadDinos < this.totalDinos){
            gameOver = false;
        } else{
            // this.reset();
            gameOver = true;
        }
        this.deadDinos = 0;
        if(gameOver){
            console.log("GAME OVER!");
            this.dinos.sort(function(a, b) { return b.obstaclesCounter - a.obstaclesCounter});
            // Sort dinos from best to worst
            console.log(this.dinos);   
        }
        return gameOver;
    },
    checkJump: function(deltaTime){
        for (tRex of this.dinos){
            if (tRex.jumping) {
                tRex.updateJump(deltaTime);
            }
        }
    },

    setPlayingIntro: function(isPlayingIntro){
        for (tRex of this.dinos) {
            tRex.playingIntro = isPlayingIntro;
        }
    },

    /**
     * Setter for the jump velocity.
     * The approriate drop velocity is also set.
     */
    setJumpVelocity: function (setting) {
        for (tRex of this.dinos) {
            tRex.setJumpVelocity(setting);
        }gameOver
    },

    /**
     * Set the animation status.
     * @param {!number} deltaTime
     * @param {Trex.status} status Optional status to switch to.
     */
    update: function (deltaTime, opt_status) {
        for (tRex of this.dinos) {
            tRex.update(deltaTime, opt_status);
            tRex.takeAction();
        }
    },

    /**
     * Draw the t-rex to a particular position.
     * @param {number} x
     * @param {number} y
     */
    draw: function (x, y) {
        for (tRex of this.dinos){
            tRex.draw(x, y);
        }
    },

    /**
     * Sets a random time for the blink to happen.
     */
    setBlinkDelay: function () {
        for(tRex of this.dinos){
            tRex.setBlinkDelay();
        }
        
    },

    /**
     * Make t-rex blink at random intervals.
     * @param {number} time Current time in milliseconds.
     */
    blink: function (time) {
        for(tRex of this.dinos){
            tRex.blink(time);
        }
    },

    /**
     * Initialise a jump.
     * @param {number} speed
     */
    startJump: function (speed) {
        for(tRex of this.dinos){
            tRex.startJump(speed);
        }
    },

    /**
     * Jump is complete, falling down.
     */
    endJump: function () {
        for(tRex of this.dinos) {
            tRex.endJump();
        }
    },

    /**
     * Update frame for a jump.
     * @param {number} deltaTime
     * @param {number} speed
     */
    updateJump: function (deltaTime, speed) {
        for(tRex of this.dinos){
            tRex.updateJump(deltaTime, speed);
        }
    },

    /**
     * Set the speed drop. Immediately cancels the current jump.
     */
    setSpeedDrop: function () {
        for(tRex of this.dinos){
            tRex.setSpeedDrop();
        }
    },

    /**
     * @param {boolean} isDucking.
     */
    setDuck: function (isDucking) {
        for(tRex of this.dinos){
            tRex.setDuck(isDucking);
        }
    },

    /**
     * Reset the t-rex to running at start of game.
     */
    reset: function () {
        for(tRex of this.dinos){
            tRex.reset();
        }
    },
    /**
     * Revive the t-rex
     */
    revive: function () {
        for(tRex of this.dinos){
            tRex.revive();
        }
    }

};

