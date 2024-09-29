import * as THREE from 'three';

import {Character} from './Character.js';
console.log("Hunter.js loaded successfully!");

export class Hunter extends Character{
    constructor(x, y, game){
        this.x = x;
        this.y = y;
        this.game = game;
        this.add();
    }

    add(){
        console.log(1,2.5,3,'string');
        return 0;
    }

    
}