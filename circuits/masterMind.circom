pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
  

template CountColors(codeSize, numColors) {
    signal input inputCode[codeSize]; 
    signal output colorCounts[numColors];  

    component isEqual[codeSize][numColors];
    signal colorMatches[codeSize][numColors];
    signal cumulativeCounts[codeSize][numColors];

    for (var i = 0; i < codeSize; i++) {
        for (var j = 0; j < numColors; j++) {
            isEqual[i][j] = IsEqual();
            isEqual[i][j].in[0] <== inputCode[i];
            isEqual[i][j].in[1] <== j + 1;
            colorMatches[i][j] <== isEqual[i][j].out;

            if (i != 0) {
                cumulativeCounts[i][j] <== colorMatches[i][j] + cumulativeCounts[i - 1][j];
            } else {
                cumulativeCounts[i][j] <== colorMatches[i][j];
            }
        }
    }

    
    for (var i = 0; i < numColors; i++) {
        colorCounts[i] <== cumulativeCounts[codeSize - 1][i];
    }
}

template Mastermind(codeSize, numColors) {

    signal input secretCode[codeSize]; 
    signal input salt; 
    signal input guess[codeSize]; 
    signal input numPartial; 
    signal input numCorrect; 
    signal input secretCodeHash;

    
    component secretCodeColorCounts = CountColors(codeSize, numColors);
    secretCodeColorCounts.inputCode <== secretCode;

    component guessColorCounts = CountColors(codeSize, numColors);
    guessColorCounts.inputCode <== guess;

    
    signal secretCodeColorsExample[numColors];
    for (var i = 0; i < numColors; i++) {
        secretCodeColorsExample[i] <== secretCodeColorCounts.colorCounts[i];
    }

    signal guessColorsExample[numColors];
    for (var i = 0; i < numColors; i++) {
        guessColorsExample[i] <== guessColorCounts.colorCounts[i];
    }

    
    signal intermediarySum[numColors + 1];
    intermediarySum[0] <== 0;
    signal tmpSecretCodeMul[numColors];
    signal tmpGuessMul[numColors];
    component isLess[numColors];
    for (var j = 0; j < numColors; j++) {
        isLess[j] = LessEqThan(32);
        isLess[j].in[0] <== secretCodeColorsExample[j];
        isLess[j].in[1] <== guessColorsExample[j];
    
        tmpSecretCodeMul[j] <== isLess[j].out * secretCodeColorsExample[j];
        tmpGuessMul[j] <== (1 - isLess[j].out) * guessColorsExample[j];
        
        intermediarySum[j + 1] <== tmpSecretCodeMul[j] + tmpGuessMul[j] + intermediarySum[j];
    }

    
    signal correctNumberprefixSum[codeSize + 1];
    correctNumberprefixSum[0] <== 0;

    component exactMatchComponents[codeSize];
    for (var i = 0; i < codeSize; i++) {
        exactMatchComponents[i] = IsEqual(); 
        exactMatchComponents[i].in[0] <== secretCode[i];
        exactMatchComponents[i].in[1] <== guess[i];
        correctNumberprefixSum[i + 1] <== exactMatchComponents[i].out + correctNumberprefixSum[i]; 
    }
    signal  correctCollor <== intermediarySum[numColors] - correctNumberprefixSum[codeSize];

    
    component correcEqual = IsEqual();
    correcEqual.in[0] <== numCorrect;
    correcEqual.in[1] <== correctNumberprefixSum[codeSize];
    correcEqual.out === 1;

    
    component partialEqual = IsEqual();
    partialEqual.in[0] <== numPartial;
    partialEqual.in[1] <== correctCollor;
    partialEqual.out === 1;
    
   
    component poseidon = Poseidon(codeSize + 1);
    for (var i = 0; i < codeSize; i++) {
        poseidon.inputs[i] <== secretCode[i];
    }
    poseidon.inputs[codeSize] <== salt;
    poseidon.out === secretCodeHash;
 }
component main { public [guess, numCorrect, numPartial, secretCodeHash] } = Mastermind(4, 6);

