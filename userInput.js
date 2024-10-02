import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { Game } from './main';
export class userInput{
    constructor(game){
        this.game = game;
        
        this.i = 1;
        this.attackPhase = false;
    }

    makeInterface(){
        this.interface = new userInterface(this);
    }
}

class userInterface{
    constructor(obj){
        var gui = new GUI();

        var display = gui.addFolder('Character');
        display.add(obj, 'i', 0, 2 );
        display.open();
        gui.add(obj, 'attackPhase');
        gui.open();
        gui.hide();

        gui.__controllers[0].domElement.hidden = false;
    }
}