"use strict";

$(function() {
    var width = 400;
    var height = 200;

    const alphabet = 'abcd';

    const rotor1 = new Rotor([2, 0, 3, 1], 0, 0);
    const reverseRotor1 = new Rotor([1, 3, 0, 2], 0, 0);
    const reflector = new Reflector([1, 0, 3, 2]);

    const enigma1 = new Enigma(alphabet, null, [rotor1], null, false);
    const enigmaView1 = new EnigmaContainerView(enigma1, $('#enigma1'), width, height, false, false, false);

    const enigma3 = new Enigma(alphabet, null, [rotor1], reflector, false);
    const enigmaView3 = new EnigmaContainerView(enigma3, $('#enigma3'), width, height, false, false, false);

    const rotor2 = new Rotor([2, 0, 3, 1], 0, 0);
    const enigma4 = new Enigma(alphabet, null, [rotor2], reflector, true);
    const enigmaView4 = new EnigmaContainerView(enigma4, $('#enigma4'), width, height, true, true, true);

    const rotor3 = new Rotor([2, 0, 1, 3], 0, 0);
    const rotor4 = new Rotor([1, 2, 0, 3], 0, 0);
    const rotor5 = new Rotor([2, 3, 1, 0], 0, 0);
    const enigma5 = new Enigma(alphabet, null, [rotor3, rotor4, rotor5], reflector, true);
    const enigmaView5 = new EnigmaContainerView(enigma5, $('#enigma5'), width, height, true, true, true);

    const plugboard = new Plugboard([3, 1, 2, 0]);
    const rotor6 = new Rotor([2, 0, 1, 3], 0, 0);
    const rotor7 = new Rotor([1, 2, 0, 3], 0, 0);
    const rotor8 = new Rotor([2, 3, 1, 0], 0, 0);
    const enigma6 = new Enigma(alphabet, plugboard, [rotor6, rotor7, rotor8], reflector, true);
    const enigmaView6 = new EnigmaContainerView(enigma6, $('#enigma6'), width, height, true, true, true);

    const enigma7 = makeFullEnigma();
    const enigmaView7 = new EnigmaContainerView(enigma7, $('#enigma7'), 600, 500, true, true, true);
});
