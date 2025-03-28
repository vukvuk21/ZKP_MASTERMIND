const crypto = require('crypto');
const { buildPoseidon } = require('circomlibjs');
const snarkjs = require('snarkjs');
const prompt = require('prompt-sync')(); 


const vk = require('./build/verification_key.json');


const generateRandomNumber = (from, to) => {
    return BigInt(from + Math.floor(Math.random() * (to - from + 1)));
}


const generateRandomSalt = (numBytes) => {
    return BigInt('0x' + crypto.randomBytes(numBytes).toString('hex'));
}


const stringifyInputs = (inputs) => {
    for (const key in inputs) {
        if (Array.isArray(inputs[key])) {
            inputs[key] = inputs[key].map(item => 
                typeof item === 'bigint' ? item.toString() : item
            );
        } else if (typeof inputs[key] === 'bigint') {
            inputs[key] = inputs[key].toString();
        } else {
            inputs[key] = inputs[key].toString();
        }
    }
    return inputs;
}


class MastermindGame {
    constructor(poseidon, numColors, numPositions) {
        this.poseidon = poseidon;
        this.numColors = numColors;
        this.numPositions = numPositions;
        this._init();
    }

    
    _init() {
        this.secretCode = Array.from({ length: this.numPositions }, () => generateRandomNumber(1, this.numColors)); // Tajni kod
        this.salt = generateRandomSalt(31);
        
        const secretCodeHashRaw = this.poseidon(this.secretCode.concat([this.salt]));
        this.secretCodeHash = this.poseidon.F.toObject(secretCodeHashRaw);
    }

     
    getsecretCodeHash() {
        return this.secretCodeHash;
    }

                       
    async checkGuess(guess) {
        let numCorrect = 0;
        let numPartial = 0;
        const exactMatches = Array(this.numPositions).fill(0);
        const usedColorsInGuess = Array(this.numPositions).fill(0);  
        const usedColorsInSecret = Array(this.numPositions).fill(0);  
    
        
        for (let i = 0; i < this.numPositions; i++) {
            if (this.secretCode[i] === guess[i]) {
                exactMatches[i] = 1;
                usedColorsInGuess[i] = 1; 
                usedColorsInSecret[i] = 1; 
                numCorrect++;
            }
        }
        
        
        for (let i = 0; i < this.numPositions; i++) {
            if (exactMatches[i] === 0) { 
                for (let j = 0; j < this.numPositions; j++) {
                    if (i !== j && !usedColorsInSecret[j] && this.secretCode[j] === guess[i] && usedColorsInGuess[i] === 0) {
                        numPartial++;
                        usedColorsInGuess[i] = 1;
                        usedColorsInSecret[j] = 1;
                        break; 
                    }
                }
            }
        }

        
        const inputSignals = stringifyInputs({
            secretCode: this.secretCode,
            salt: this.salt,
            guess,
            numPartial: numPartial,
            numCorrect: numCorrect,
            secretCodeHash: this.secretCodeHash,
        });
        // console.log(inputSignals);
        
        const { proof, publicSignals } = await snarkjs.plonk.fullProve(
            inputSignals,
            'build/masterMind_js/masterMind.wasm', 
            'build/masterMind.zkey'
        );
        
        return { proof, publicSignals };
    }
}


const main = async () => {
    const poseidon = await buildPoseidon();  

    const game = new MastermindGame(poseidon, 6, 4);

    let attempts = 0;
    let found = false;
    
    while (attempts<5) {
        const commitment = game.getsecretCodeHash();

        
        const guessInput = prompt('Enter your guess (4 colors, separated by space): ');
        const guess = guessInput.split(' ').map(num => BigInt(num));  

        if (guess.length !== 4 || guess.some(g => g < 1 || g > 6)) {
            console.log('Invalid input. Please enter 4 numbers between 1 and 6.');
            continue;
        }

        

        const { proof, publicSignals } = await game.checkGuess(guess);

        const [
            guessNum1,
            guessNum2,
            guessNum3,
            guessnum4,
            expectedColorMatch,
            expectedExactMatch,
            secretCodeHash
        ] = publicSignals;
        publicGuess=[guessNum1, guessNum2, guessNum3, guessnum4];

        console.log('publicGuess:', publicGuess);
        console.log('expectedExactMatch:', expectedExactMatch);
        console.log('expectedColorMatch:', expectedColorMatch);
        console.log('secretCodeHash:', secretCodeHash);

        
        const isValid = await snarkjs.plonk.verify(vk, publicSignals, proof);

        if (isValid) {
            console.log('Valid proof!');
        } else {
            console.error('Invalid proof!');
            process.exit();
        }

        
        if (parseInt(expectedExactMatch) === 4) {
            
            console.log('You guessed the secret code!: ', game.secretCode);
            break;

        } else {
            attempts++;
            console.log(`Attempt ${attempts} failed. Trying again...`);
        }
    }
};

main().then(() => process.exit());
