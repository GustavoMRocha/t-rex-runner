//******************************************************************************

/**
 * Controller.
 */
function Controller(){
    this.init();
};

Controller.actions = {
    NEUTRAL: "neutral",
    JUMP: "jump",
    DUCK: "duck"
};

Controller.actionsIndex = {
    0: Controller.actions.NEUTRAL,
    1: Controller.actions.JUMP,
    2: Controller.actions.DUCK
};

/* Possible actions from the neural network */
Controller.prototype = {
    init: function(){
      // Define a model
        const model = tf.sequential();
        model.add(tf.layers.dense({units: 6,
                biasInitializer: "glorotUniform",
                kernelInitializer:'glorotUniform',
                activation: 'sigmoid', 
                inputShape:[6]}));
        model.add(tf.layers.dense({units: 3, 
                biasInitializer: "glorotUniform",
                kernelInitializer:'glorotUniform',
                activation: 'sigmoid'}));
        model.add(tf.layers.softmax({units: 3}));

        this.NN = model;
    },
    nextAction: function(firstObstacle, tRex, currentSpeed){

        /* NeuralNet inputs */
        var obsX = firstObstacle.xPos;
        var obsY = firstObstacle.yPos;
        var obsWidth = firstObstacle.typeConfig.width * firstObstacle.size;
        var obsHeight = firstObstacle.typeConfig.height;
        var trexY = tRex.yPos;
        var velocity = currentSpeed;

        var inputs = [obsX, obsY, obsWidth, obsHeight, trexY, velocity];
        var output = this.NN.predict(tf.tensor2d(inputs,[1,6])).argMax(1).dataSync()[0];
        return Controller.actionsIndex[output];
    }
}