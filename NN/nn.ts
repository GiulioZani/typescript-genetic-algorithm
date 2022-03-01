import 'https://cdnjs.cloudflare.com/ajax/libs/tensorflow/3.13.0/tf.min.js'
declare global {
    interface Window { tf: any; }
}
window.tf = window.tf || {};
const tf = window.tf


export default class NeuralNetworks{

    numInputUnits: number = 12
    numOutputUnits: number = 2
    numHiddenLayer: number = 5
    numSecondHiddenLayer: number = 5
    weights = {
        // 'second_hidden_layer': new tf.Variable(tf.randomNormal([this.num_first_hidden_layer, this.num_second_hidden_layer]), false, 'second_hidden_layer', 6),
        'hidden_layer': new tf.Variable(tf.randomNormal([this.num_input_units + this.num_hidden_layer, this.num_hidden_layer]), false, 'first_hidden_layer', 3),
        'output':new tf.Variable(tf.randomNormal([this.num_second_hidden_layer, this.num_output_units]), false, 'output_hidden_layer', 12)
    }
    biases= {
        // 'second_hidden_layer': new tf.Variable(tf.randomNormal([this.num_second_hidden_layer]), false, 'second_hidden_layer_bias', 1),
        'hidden_layer': new tf.Variable(tf.randomNormal([ this.numHiddenLayer]), false, 'first_hidden_layer_bias', 2),
        'output':new tf.Variable(tf.randomNormal([this.numOutputUnits]), false, 'output_hidden_layer_bias', 13)
    }
    // second_layer_activation: any;
    firstLayerActivation = tf.randomNormal([1, this.numHiddenLayer]);


    
    getFlattedWeightSizes() {
        const flatten = [
            this.weights.hidden_layer.flatten().size,
            this.biases.hidden_layer.flatten().size,
            this.weights.output.flatten().size,
            this.biases.output.flatten().size
        ]
        

        return flatten
    }

    getFlattendWeights(){
        const flatten = [
            this.weights.hidden_layer.flatten().dataSync(),
            this.biases.hidden_layer.flatten().dataSync(),
            this.weights.output.flatten().dataSync(),
            this.biases.output.flatten().dataSync()
        ]
        return [...flatten[0],...flatten[1],...flatten[2], flatten[3]]
    }
    

    constructor(flat_weights: (number | Float32Array | Int32Array | Uint8Array)[] | undefined = undefined){

        if (flat_weights == undefined)
        return

        
        let sizes = this.getFlattedWeightSizes()


        for(let i =1; i< sizes.length; i++){
            sizes[i]+= sizes[i-1]
        }

        const hidden_layer_weights_flat = flat_weights.slice(0, sizes[0])
        this.weights.hidden_layer.assign(tf.tensor(hidden_layer_weights_flat, this.weights.hidden_layer.shape))
        const hidden_layer_bias_flat = flat_weights.slice(sizes[0], sizes[1])
        this.biases.hidden_layer.assign(tf.tensor(hidden_layer_bias_flat, this.biases.hidden_layer.shape))

        const output_layer_flat = flat_weights.slice( sizes[1],  sizes[2])
        this.weights.output.assign(tf.tensor(output_layer_flat, this.weights.output.shape))

        let output_layer_bias = flat_weights.slice( sizes[ 2],  sizes[3])
        this.biases.output.assign(tf.tensor(output_layer_bias).reshape(this.biases.output.shape))
    }


    forward_prop(input: number[]){
    
        let inp = tf.tensor(input).concat(this.first_layer_activation.flatten()).reshape([1, this.numInputUnits+ this.numHiddenLayer])
    
        this.first_layer_activation = tf.add(tf.matMul(inp , this.weights['hidden_layer']), this.biases['hidden_layer'])

        // this.second_layer_activation = tf.add( tf.matMul(first_layer_activation, this.weights['second_hidden_layer']), this.biases['second_hidden_layer'])

        const output_layer = tf.add(tf.matMul(this.first_layer_activation, this.weights['output']), this.biases['output'])

        const data = output_layer.dataSync()

        return data

    }
}

