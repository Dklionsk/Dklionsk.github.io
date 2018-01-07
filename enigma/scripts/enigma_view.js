"use strict";

const strokeWidth = 1;
const highlightedStrokeWidth = 2;
const bgStrokeWidth = 1;
const defaultColor = 'black';
const forwardColor = 'red';
const reverseColor = '#ef8700';
const rotorColor = '#B8C480';
const reflectorColor = '#D4E79E';
const plugColor = '#B8C480';
const yPaddingFactor = 0.1;
const yPadding = 20;
const fontSize = '14px';
const fontFamily = '"Lucida Console", Monaco, monospace';
const animationDuration = 250;

class View {
    constructor(canvas, x, y, width, height) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    update(animated) {
        // Subclasses should update their contents.
    }
}

class ReflectorView extends View {
    constructor(reflector, canvas, x, y, width, height) {
        super(canvas, x, y, width, height);
        this.reflector = reflector;

        this.xPadding = this.width * 0.1;
        this.background = this.canvas.rect(this.x + this.xPadding, this.y, this.width - 2 * this.xPadding, this.height);
        this.background.attr({fill: reflectorColor, 'stroke-width': bgStrokeWidth});

        // The reflector links pairs of inputs, so we only need half the paths.
        this.paths = [];
        for (var i = 0; i < this.reflector.permutation.length / 2; i++) {
            var path = this.canvas.path();
            path.attr({'stroke-width': strokeWidth});
            this.paths.push(path);
        }

        var pathIndex = 0;
        this.inputsToPaths = [];
        for (var i = 0; i < this.reflector.permutation.length; i++) {
            if (this.reflector.permutation[i] < i) {
                this.inputsToPaths.push(this.inputsToPaths[this.reflector.permutation[i]]);
            } else {
                this.inputsToPaths.push(pathIndex);
                pathIndex += 1;
            }
        }

        this.updatePaths(false);

        this.highlightedPath = null;
        this.input = -1;
    }

    updatePaths(animated) {
        //var yPadding = this.height * yPaddingFactor;
        var pinWidth = this.xPadding;
        var heightForPins = this.height - 2 * yPadding;
        var permutation = this.reflector.permutation;
        var pinSpacing = heightForPins / (permutation.length - 1);
        var innerPadding = this.xPadding * 2;
        var pathXSpacing = (this.width - 2 * this.xPadding - 2 * innerPadding) / (this.paths.length - 1);

        for (var i = 0; i < permutation.length; i++) {
            var output = permutation[i];
            if (output < i) {
                // We've drawn this path already.
                continue;
            }
            
            var pathIndex = this.inputsToPaths[i];
            var startX = this.x + this.xPadding;
            var startY = this.y + yPadding + (pinSpacing * i);
            var endX = this.x + this.xPadding + innerPadding + (pathXSpacing * pathIndex);
            var endY = this.y + yPadding + (pinSpacing * output);

            var pathString = 'M' + (startX - pinWidth) + ',' + startY;
            pathString += 'L' + endX + ',' + startY;
            pathString += 'L' + endX + ',' + endY;
            pathString += 'L' + (startX - pinWidth) + ',' + endY;
            var path = this.paths[pathIndex];
            if (animated) {
                path.animate({path: pathString}, animationDuration);
            } else {
                path.attr({path: pathString});
            }
        }
    }

    update(animated) {
        super.update(animated);

        if (this.highlightedPath) {
            this.highlightedPath.attr({stroke: defaultColor, 'stroke-width': strokeWidth});
        }
        this.updatePaths(animated);

        var self = this;
        var updateColors = function() {
            if (self.input >= 0) {
                var pathIndex = self.inputsToPaths[self.input];
                self.highlightedPath = self.paths[pathIndex];
                self.highlightedPath.attr({stroke: forwardColor, 'stroke-width': highlightedStrokeWidth});
            }
        }

        if (animated) {
            setTimeout(updateColors, animationDuration);
        } else {
            updateColors();
        }
    }
}

class PlugboardView extends View {
    constructor(plugboard, canvas, x, y, width, height) {
        super(canvas, x, y, width, height);
        this.plugboard = plugboard;

        this.xPadding = this.width * 0.05;

        this.inPins = [];
        this.outPins = [];
        for (var i = 0; i < this.plugboard.permutation.length; i++) {
            var inPath = this.canvas.path();
            var outPath = this.canvas.path();
            inPath.attr({'stroke-width': strokeWidth});
            outPath.attr({'stroke-width': strokeWidth});
            this.inPins.push(inPath);
            this.outPins.push(outPath);
        }

        this.background = this.canvas.rect(this.x + this.xPadding, this.y, this.width - 2 * this.xPadding, this.height);
        this.background.attr({fill: 'white', 'stroke-width': bgStrokeWidth});

        this.endButtons = [];
        this.paths = [];
        this.buttonWidth = width * 0.2;
        this.buttonHeight = this.buttonWidth * 0.75;
        var self = this;
        for (var i = 0; i < this.plugboard.permutation.length; i++) {
            var path = this.canvas.path();
            path.attr({'stroke-width': strokeWidth});
            this.paths.push(path);

            var endButton = this.canvas.rect(this.x + this.width - this.xPadding - this.buttonWidth, 0, this.buttonWidth, this.buttonHeight);
            endButton.attr({fill: plugColor});
            endButton.drag(function(dx, dy) {
                var newY = this.oy + dy;
                newY = Math.max(self.y, Math.min(self.y + self.height - self.buttonHeight, newY));
                this.attr({y: newY});
                self.updatePaths(false);
            }, function() {
                this.oy = this.attr("y");
            }, function() {
                self.snapButtons(this.oy, this.attr("y"));
            });
            this.endButtons.push(endButton);
        }
        
        this.forwardInput = -1;
        this.reverseInput = -1;

        this.update(false);
    }

    layoutButtons() {
        //var yPadding = this.height * yPaddingFactor;
        var pinWidth = this.xPadding;
        var heightForPins = this.height - 2 * yPadding;
        var pinSpacing = heightForPins / (this.plugboard.permutation.length - 1);

        for (var i = 0; i < this.plugboard.permutation.length; i++) {
            var output = this.plugboard.permutation[i];
            var endY = this.y + yPadding + (pinSpacing * output) - this.buttonHeight / 2;
            this.endButtons[i].attr({y: endY});
        }
    }

    snapButtons(originalY, newY) {
        //var yPadding = this.height * yPaddingFactor;
        var heightForPins = this.height - 2 * yPadding;
        var pinSpacing = heightForPins / (this.plugboard.permutation.length - 1);

        var originalOutput = Math.round((originalY - yPadding - this.y + this.buttonHeight / 2) / pinSpacing);
        var newOutput = Math.round((newY - yPadding - this.y + this.buttonHeight / 2) / pinSpacing);
        if (originalOutput != newOutput && originalOutput != -1 && newOutput != -1 && originalOutput < this.plugboard.permutation.length && newOutput < this.plugboard.permutation.length) {
            var inputThatWasMoved = this.plugboard.permutation.indexOf(originalOutput);
            var nextInputToMove = this.plugboard.permutation.indexOf(newOutput);
            this.plugboard.permutation[nextInputToMove] = nextInputToMove;
            this.plugboard.permutation[originalOutput] = originalOutput;
            this.plugboard.permutation[inputThatWasMoved] = newOutput;
            this.plugboard.permutation[newOutput] = inputThatWasMoved;
        }

        this.layoutButtons();
        this.updatePaths(false);
    }

    updatePaths(animated) {
        //var yPadding = this.height * yPaddingFactor;
        var pinWidth = this.xPadding;
        var heightForPins = this.height - 2 * yPadding;
        var pinSpacing = heightForPins / (this.plugboard.permutation.length - 1);

        for (var i = 0; i < this.plugboard.permutation.length; i++) {
            var output = this.plugboard.permutation[i];
            var startX = this.x + this.xPadding;
            var endX = this.x + this.width - this.xPadding - this.buttonWidth;

            var pinStartY = this.y + yPadding + (pinSpacing * i);
            var pinEndY = this.y + yPadding + (pinSpacing * output);

            var startY = this.y + yPadding + (pinSpacing * i);
            var endY = this.endButtons[i].attr('y') + this.buttonHeight / 2;

            var inPinString = 'M' + this.x + ',' + pinStartY + 'L' + (this.x + pinWidth) + ',' + pinStartY;
            this.inPins[i].attr({path: inPinString});

            var outPinString = 'M' + (this.x + this.width - pinWidth) + ',' + pinEndY + 'L' + (this.x + this.width) + ',' + pinEndY;
            this.outPins[i].attr({path: outPinString});

            var pathString = 'M' + startX + ',' + startY + 'L' + endX + ',' + endY;
            var path = this.paths[i];
            if (animated) {
                path.animate({path: pathString}, animationDuration);
            } else {
                path.attr({path: pathString});
            }
        }
    }

    update(animated) {
        super.update(animated);

        for (var path of this.paths.concat(this.inPins).concat(this.outPins)) {
            path.attr({stroke: defaultColor, 'stroke-width': strokeWidth});
        }
        
        this.layoutButtons();
        this.updatePaths(animated);

        var self = this;
        var updateColors = function() {
            if (self.forwardInput >= 0) {
                var forwardOutput = self.plugboard.encode(self.forwardInput);
                for (var forwardPath of [self.paths[self.forwardInput], self.inPins[self.forwardInput], self.outPins[self.forwardInput]]) {
                    forwardPath.attr({stroke: forwardColor, 'stroke-width': highlightedStrokeWidth});
                }
            }
            if (self.reverseInput >= 0) {
                var reverseIndex = self.plugboard.permutation.indexOf(self.reverseInput);
                for (var reversePath of [self.paths[reverseIndex], self.inPins[reverseIndex], self.outPins[reverseIndex]]) {
                    reversePath.attr({stroke: reverseColor, 'stroke-width': highlightedStrokeWidth});
                }
            }
        }

        if (animated) {
            setTimeout(updateColors, animationDuration);
        } else {
            updateColors();
        }
    }
}

class RotorView extends View {
    constructor(alphabet, rotor, showButtons, showBackground, canvas, x, y, width, height) {
        super(canvas, x, y, width, height);
        this.alphabet = alphabet;
        this.rotor = rotor;

        this.xPadding = this.width * 0.05;
        this.background = this.canvas.rect(this.x + this.xPadding, this.y, this.width - 2 * this.xPadding, this.height);

        if (showBackground) {
            this.background.attr({fill: rotorColor, 'stroke-width': bgStrokeWidth});
        } else {
            this.background.attr({stroke: 'none'});    
        }

        this.paths = [];
        for (var i = 0; i < this.rotor.permutation.length; i++) {
            var path = this.canvas.path();
            path.attr({'stroke-width': strokeWidth});
            this.paths.push(path);
        }
        
        if (showButtons) {
            var buttonWidth = 18;
            this.upButtonBackground = this.canvas.rect(this.x + this.width / 2 - buttonWidth / 2, this.y - buttonWidth, buttonWidth, buttonWidth);
            this.upButtonBackground.attr({fill: 'white'});
            this.upLabel = this.canvas.text(this.x + this.width / 2, this.y - buttonWidth / 2);
            this.upLabel.attr({'font-size': fontSize, 'font-family': fontFamily});

            var self = this;
            var clickFunction = function() {
                self.rotor.rotateOneStep();
                self.update(true);
            };
            this.upButtonBackground.click(clickFunction);
            this.upLabel.click(clickFunction);
        }

        this.forwardPath = null;
        this.reversePath = null;
        this.forwardInput = -1;
        this.reverseInput = -1;

        this.update(false);
    }

    updatePaths(animated) {
        //var yPadding = this.height * yPaddingFactor;
        var pinWidth = this.xPadding;
        var heightForPins = this.height - 2 * yPadding;
        var pinSpacing = heightForPins / (this.rotor.permutation.length - 1);

        var rotatedPermutation = rotateArray(this.rotor.permutation, this.rotor.position);
        for (var i = 0; i < rotatedPermutation.length; i++) {
            var output = rotatedPermutation[i];
            var startX = this.x + this.xPadding;
            var startY = this.y + yPadding + (pinSpacing * i);
            var endX = this.x + this.width - this.xPadding;
            var endY = this.y + yPadding + (pinSpacing * output);

            var pathString = 'M' + (startX - pinWidth) + ',' + startY;
            pathString += 'L' + startX + ',' + startY;
            pathString += 'L' + endX + ',' + endY;
            pathString += 'L' + (endX + pinWidth) + ',' + endY;
            var path = this.paths[(i + this.rotor.position) % rotatedPermutation.length];
            if (animated) {
                path.animate({path: pathString}, animationDuration);
            } else {
                path.attr({path: pathString});
            }
        }
    }

    update(animated) {
        super.update(animated);

        if (this.forwardPath) {
            this.forwardPath.attr({stroke: defaultColor, 'stroke-width': strokeWidth});
        }
        if (this.reversePath) {
            this.reversePath.attr({stroke: defaultColor, 'stroke-width': strokeWidth});
        }

        this.updatePaths(animated);
        
        if (this.upLabel) {
            this.upLabel.attr({text: this.rotor.position + 1});
        }

        var self = this;
        var updateColors = function() {
            if (self.forwardInput >= 0) {
                self.forwardPath = self.paths[(self.forwardInput + self.rotor.position) % self.rotor.permutation.length];
                self.forwardPath.attr({stroke: forwardColor, 'stroke-width': highlightedStrokeWidth});
            }
            if (self.reverseInput >= 0) {
                var rotatedPermutation = rotateArray(self.rotor.permutation, self.rotor.position);
                var reverseIndex = rotatedPermutation.indexOf(self.reverseInput);
                self.reversePath = self.paths[(reverseIndex + self.rotor.position) % self.rotor.permutation.length];
                self.reversePath.attr({stroke: reverseColor, 'stroke-width': highlightedStrokeWidth});
            }
        }

        if (animated) {
            setTimeout(updateColors, animationDuration);
        } else {
            updateColors();
        }
    }
}

class LightboardView extends View {
    constructor(alphabet, isInput, canvas, x, y, width, height) {
        super(canvas, x, y, width, height);
        this.alphabet = alphabet;
        this.isInput = isInput;

        this.xPadding = this.width * 0.05;
        this.background = this.canvas.rect(this.x + this.xPadding, this.y, this.width - 2 * this.xPadding, this.height);
        this.background.attr({fill: 'white', 'stroke-width': bgStrokeWidth});

        this.forwardLetter = null;
        this.reverseLetter = null;
        this.forwardPath = null;
        this.reversePath = null;
        this.forwardInput = -1;
        this.reverseInput = -1;

        //var yPadding = this.height * yPaddingFactor;
        var pinWidth = this.xPadding;
        var heightForPins = this.height - 2 * yPadding;
        var pinSpacing = heightForPins / (this.alphabet.length - 1);

        this.paths = [];
        this.letters = [];
        for (var i = 0; i < this.alphabet.length; i++) {
            var letterX = this.x + this.width / 2;
            var letterY = this.y + yPadding + (pinSpacing * i);
            var letter = this.canvas.text(letterX, letterY, this.alphabet[i]);
            letter.attr({'font-size': fontSize, 'font-family': fontFamily});
            this.letters.push(letter);

            var pathString = 'M';
            if (this.isInput) {
                pathString += (this.x + this.width - pinWidth) + ',' + letterY;
                pathString += 'L' + (this.x + this.width) + ',' + letterY;
            } else {
                pathString += this.x + ',' + letterY;
                pathString += 'L' + (this.x + pinWidth) + ',' + letterY;
            }
            
            var path = this.canvas.path(pathString);
            path.attr({'stroke-width': strokeWidth});
            this.paths.push(path);
        }

        this.update(false);
    }

    update(animated) {
        super.update(animated);

        for (var element of [this.forwardLetter, this.reverseLetter]) {
            if (element) {
                element.attr({fill: defaultColor, 'font-weight': 'normal'});
            }
        }

        for (var element of [this.forwardPath, this.reversePath]) {
            if (element) {
                element.attr({stroke: defaultColor, 'stroke-width': strokeWidth});
            }
        }
        
        var self = this;
        var updateColors = function() {
            if (self.forwardInput >= 0) {
                self.forwardLetter = self.letters[self.forwardInput];
                self.forwardPath = self.paths[self.forwardInput];
                self.forwardLetter.attr({fill: forwardColor, 'font-weight': 'bold'});
                self.forwardPath.attr({stroke: forwardColor, 'stroke-width': highlightedStrokeWidth});
            }
            if (self.reverseInput >= 0) {
                self.reverseLetter = self.letters[self.reverseInput];
                self.reversePath = self.paths[self.reverseInput];
                self.reverseLetter.attr({fill: reverseColor, 'font-weight': 'bold'});
                self.reversePath.attr({stroke: reverseColor, 'stroke-width': highlightedStrokeWidth});
            }
        }

        if (animated) {
            setTimeout(updateColors, animationDuration);
        } else {
            updateColors();
        }
    }
}

class EnigmaView extends View {
    constructor(enigma, showButtons, showRotorBackground, canvas, x, y, width, height) {
        super(canvas, x, y, width, height);
        this.enigma = enigma;

        this.background = canvas.rect(bgStrokeWidth / 2, bgStrokeWidth / 2, this.width - bgStrokeWidth, this.height - bgStrokeWidth);
        this.background.attr({fill: '#e5e5e5', 'stroke-width': bgStrokeWidth});

        var outerPadding = this.width * 0.05;

        var lightboardWidth = this.width * 0.1;
        var lightboardStartX = outerPadding;

        var componentStartX = lightboardStartX + lightboardWidth;
        var componentEndX = this.width - outerPadding;

        if (!this.enigma.reflector) {
            // If there's no reflector, we put a second lightboard at the end of the machine.
            componentEndX -= lightboardWidth;
        }

        // Size the reflector and plugboard the same as the rotors.
        var rotors = this.enigma.rotors;
        var numComponents = rotors.length;
        if (this.enigma.plugboard) {
            numComponents++;
        }
        if (this.enigma.reflector) {
            numComponents++;
        }
        var widthForComponents = componentEndX - componentStartX;
        var componentWidth = widthForComponents / numComponents;
        var componentHeight = this.height - 2 * outerPadding;

        this.lightboardView = new LightboardView(this.enigma.alphabet, true, canvas, lightboardStartX, outerPadding, lightboardWidth, componentHeight);

        var rotorStartX = componentStartX;
        if (this.enigma.plugboard) {
            rotorStartX += componentWidth;
            this.plugboardView = new PlugboardView(this.enigma.plugboard, canvas, componentStartX, outerPadding, componentWidth, componentHeight);
        }

        this.rotorViews = [];
        for (var i = 0; i < rotors.length; i++) {
            this.rotorViews.push(new RotorView(this.enigma.alphabet, rotors[i], showButtons, showRotorBackground, canvas, rotorStartX + (componentWidth * i), outerPadding, componentWidth, componentHeight));
        }

        var reflectorStartX = rotorStartX + (componentWidth * rotors.length);
        if (this.enigma.reflector) {
            this.reflectorView = new ReflectorView(this.enigma.reflector, canvas, reflectorStartX, outerPadding, componentWidth, componentHeight);
        } else {
            this.outputLightboardView = new LightboardView(this.enigma.alphabet, false, canvas, reflectorStartX, outerPadding, lightboardWidth, componentHeight);
        }
    }

    update(animated) {
        super.update(animated);

        var input = this.enigma.lastInput;

        this.lightboardView.forwardInput = input;

        if (this.plugboardView) {
            this.plugboardView.forwardInput = input;
            input = this.plugboardView.plugboard.encode(input);
        }

        for (var rotorView of this.rotorViews) {
            rotorView.forwardInput = input;
            input = rotorView.rotor.encode(input, false);
        }

        if (this.reflectorView) {
            this.reflectorView.input = input;
            input = this.reflectorView.reflector.encode(input);

            for (var i = this.rotorViews.length - 1; i >= 0; i--) {
                var rotorView = this.rotorViews[i];
                rotorView.reverseInput = input;
                input = rotorView.rotor.encode(input, true);
            }

            if (this.plugboardView) {
                this.plugboardView.reverseInput = input;
                input = this.plugboardView.plugboard.encode(input);
            }

            this.lightboardView.reverseInput = input;
        } else {
            this.outputLightboardView.forwardInput = input;
        }
        
        this.lightboardView.update(animated);
        if (this.plugboardView) {
            this.plugboardView.update(animated);
        }
        if (this.reflectorView) {
            this.reflectorView.update(animated);
        }
        if (this.outputLightboardView) {
            this.outputLightboardView.update(animated);
        }
        for (var rotorView of this.rotorViews) {
            rotorView.update(animated);
        }
    }
}

class EnigmaContainerView {
    constructor(enigma, container, width, height, showButtons, showRotorBackground, animated) {
        var canvasDiv = $('<div>');
        var buttonsDiv = $('<div>');
        var plaintextDiv = $('<div>');
        var ciphertextDiv = $('<div>');
        var resetDiv = $('<div>');
        container.append(canvasDiv);
        container.append(buttonsDiv);
        container.append(plaintextDiv);
        container.append(ciphertextDiv);
        container.append(resetDiv);

        var canvas = Raphael(canvasDiv.get(0), width, height);
        var enigmaView = new EnigmaView(enigma, showButtons, showRotorBackground, canvas, 0, 0, width, height);

        var alphabet = enigma.alphabet;
        for (let i = 0; i < alphabet.length; i++) {
            var letter = alphabet[i]
            var button = $('<button>' + letter + '</button>');
            var func = (function(index) {
                return function() {
                    var encodedIndex = enigma.encodeCharacter(index);
                    enigmaView.update(animated);    
                    plaintextView.val(plaintextView.val() + alphabet[index]);
                    ciphertextView.val(ciphertextView.val() + alphabet[encodedIndex]);
                }
            }(i));
            button.click(func);
            buttonsDiv.append(button);
        }

        var plaintextView = $('<input>', {type: 'text', placeholder: 'Plaintext', readonly: 'readonly'});
        var ciphertextView = $('<input>', {type: 'text', placeholder: 'Ciphertext', readonly: 'readonly'});
        
        plaintextDiv.append(plaintextView);
        ciphertextDiv.append(ciphertextView);

        var resetButton = $('<button>Reset</button>');
        resetButton.addClass('reset-button');
        resetDiv.append(resetButton);
        resetButton.click(function() {
            enigma.reset();
            enigmaView.update(animated);
            plaintextView.val('');
            ciphertextView.val('');
        });
    }
}
