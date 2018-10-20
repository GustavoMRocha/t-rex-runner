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

/* Possible actions from the neural network */
Controller.prototype = {
    init: function(){
        // Define layers
        var inputLayer = new Layer(6);
        var hiddenLayer = new Layer(6);
        var outputLayer = new Layer(1);

        // Connect network
        inputLayer.project(hiddenLayer);
        hiddenLayer.project(outputLayer);

        // Create neural network
        this.NN = new Network({
            input: inputLayer,
            hidden: [hiddenLayer],
            output: outputLayer
        });
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

        var output = this.NN.activate(inputs);
        // console.log(inputs);
        // console.log(output);
        // console.log(tRex);

        if(output < 0.48){
            return Controller.actions.DUCK;
        } else if (output > 0.49){
            return Controller.actions.JUMP;
        } else {
            return Controller.actions.NEUTRAL;
        }
    }
}