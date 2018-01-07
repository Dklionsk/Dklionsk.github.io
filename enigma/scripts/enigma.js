"use strict";

function assert(condition, message) {
    if (!condition) {
        throw message || condition + " does not equal true";
    }
}

function rotateArray(array, n) {
    var arrayCopy = array.slice();
    for (var i = 0; i < n; i++) {
        var arraySuffix = arrayCopy.splice(1);
        arrayCopy = arraySuffix.concat(arrayCopy);
        for (var j = 0; j < arrayCopy.length; j++) {
            arrayCopy[j] = (arrayCopy[j] + arrayCopy.length - 1) % arrayCopy.length;
        }
    }
    return arrayCopy;
}

class Reflector {
    constructor(permutation) {
        this.permutation = permutation;
    }

    encode(charIndex) {
        return this.permutation[charIndex];
    }
}

class Plugboard {
    constructor(permutation) {
        this.permutation = permutation;
    }

    encode(charIndex) {
        return this.permutation[charIndex];
    }
}

class Rotor {
    constructor(permutation, notchPosition, position) {
        this.permutation = permutation;
        this.notchPosition = notchPosition;
        this.position = position;
    }

    rotateOneStep() {
        this.position = (this.position + 1) % this.permutation.length;
    }

    encode(charIndex, reversed) {
        var rotatedPermutation = rotateArray(this.permutation, this.position);
        if (reversed) {
            return rotatedPermutation.indexOf(charIndex);
        } else {
            return rotatedPermutation[charIndex];
        }
    }
}

class Enigma {
    constructor(alphabet, plugboard, rotors, reflector, rotateRotors) {
        this.alphabet = alphabet;
        this.plugboard = plugboard;
        this.rotors = rotors;
        this.reflector = reflector;
        this.rotateRotors = rotateRotors;
        this.lastInput = -1;

        if (this.plugboard) {
            this.startingPlugboardPermutation = this.plugboard.permutation.slice();
        }

        this._validate();
    }

    _validate() {
        assert(this.alphabet.length % 2 == 0, 'The alphabet must have an even number of characters.');
        for (var i = 0; i < this.alphabet.length; i++) {
            if (this.reflector) {
                var reflectorEncoded = this.reflector.encode(i);
                assert(reflectorEncoded != i, "The reflector can't encode something to itself.");
                var reflectorDecoded = this.reflector.encode(reflectorEncoded);
                assert(i == reflectorDecoded, "The reflector isn't symmetric.");    
            }
            if (this.plugboard) {
                var plugboardEncoded = this.plugboard.encode(i);
                var plugboardDecoded = this.plugboard.encode(plugboardEncoded);
                assert(i == plugboardDecoded, "The plugboard isn't symmetric.");    
            }
        }
    }

    _stepRotors() {
        var rotorsToRotate = [];
        for (var i = 0; i < this.rotors.length; i++) {
            rotorsToRotate.push(false);
        }

        // The first rotor always rotates.
        rotorsToRotate[0] = true;

        for (var i = 0; i < this.rotors.length - 1; i++) {
            if (this.rotors[i].notchPosition == this.rotors[i].position) {
                // When a rotor is in notch position, it moves both the next rotor and itself.
                // Note that this will cause a "double step" for the middle rotor.
                rotorsToRotate[i + 1] = true;
                rotorsToRotate[i] = true;
            }
        }

        for (var i = 0; i < rotorsToRotate.length; i++) {
            if (rotorsToRotate[i]) {
                this.rotors[i].rotateOneStep();    
            }
        }
    }

    reset() {
        if (this.plugboard) {
            this.plugboard.permutation = this.startingPlugboardPermutation.slice();
        }
        for (var i = 0; i < this.rotors.length; i++) {
            this.rotors[i].position = 0;
        }
        this.lastInput = -1;
    }

    setRotorPositions(positions) {
        for (var i = 0; i < positions.length; i++) {
            this.rotors[i].position = positions[i];
        }
    }

    encodeCharacter(charIndex) {
        if (this.rotateRotors) {
            this._stepRotors();
        }
        
        this.lastInput = charIndex;
        var encodedIndex = charIndex;

        if (this.plugboard) {
            encodedIndex = this.plugboard.encode(encodedIndex);
        }        

        for (var i = 0; i < this.rotors.length; i++) {
            var rotor = this.rotors[i];
            encodedIndex = rotor.encode(encodedIndex, false);
        }

        if (this.reflector) {
            encodedIndex = this.reflector.encode(encodedIndex);

            for (var i = this.rotors.length - 1; i >= 0; i--) {
                var rotor = this.rotors[i];
                encodedIndex = rotor.encode(encodedIndex, true);
            }
        }
        
        if (this.plugboard) {
            encodedIndex = this.plugboard.encode(encodedIndex);
        }
        
        return encodedIndex;
    }

    encodeString(plaintext) {
        var ciphertext = '';
        for (var plainChar of plaintext) {
            var plainIndex = this.alphabet.indexOf(plainChar);
            assert(plainIndex >= 0, plainChar + " isn't part of the alphabet");
            var cipherIndex = this.encodeCharacter(plainIndex);
            ciphertext += this.alphabet[cipherIndex];
        }
        return ciphertext;
    }

    toString() {
        var s = '';
        for (var i = 0; i < this.rotors.length; i++) {
            s += i + ': ' + this.rotors[i].position + '\t';
        }
        return s;
    }
}

function makeSimpleEnigma(hasPlugboard, hasReflector, rotateRotors, numRotors) {
    const alphabet = 'abcd';
    const rotor1 = new Rotor([2, 0, 1, 3], 0, 0);
    const rotor2 = new Rotor([1, 2, 0, 3], 0, 0);
    const rotor3 = new Rotor([2, 3, 1, 0], 0, 0);
    const reflector = hasReflector ? new Reflector([1, 0, 3, 2]) : null;
    const plugboard = hasPlugboard ? new Plugboard([3, 1, 2, 0]) : null;
    
    const allRotors = [rotor1, rotor2, rotor3];
    const rotors = allRotors.slice(0, numRotors);
    const enigma = new Enigma(alphabet, plugboard, rotors, reflector, rotateRotors);

    return enigma;
}

function makeFullEnigma() {    
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const rotor1 = new Rotor([25, 17, 23, 8, 10, 9, 7, 19, 5, 4, 2, 11, 12, 22, 21, 16, 18, 24, 14, 3, 15, 1, 6, 0, 20, 13], 0, 0);
    const rotor2 = new Rotor([6, 0, 22, 10, 21, 8, 14, 2, 16, 24, 4, 13, 19, 9, 25, 11, 12, 1, 20, 17, 5, 3, 23, 18, 7, 15], 0, 0);
    const rotor3 = new Rotor([3, 15, 11, 25, 23, 1, 13, 20, 18, 24, 7, 8, 5, 22, 10, 0, 6, 17, 19, 14, 4, 21, 16, 12, 2, 9], 0, 0);
    const reflector = new Reflector([11, 4, 7, 25, 1, 10, 17, 2, 13, 12, 5, 0, 9, 8, 18, 20, 19, 6, 14, 16, 15, 22, 21, 24, 23, 3])
    const plugboard = new Plugboard([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);

    const rotors = [rotor1, rotor2, rotor3];
    const rotorPositions = [0, 0, 0];
    const enigma = new Enigma(alphabet, plugboard, rotors, reflector, true);
    enigma.setRotorPositions(rotorPositions);

    return enigma;
}
