import { AnimalProperties } from './AnimalProperties.js';
import { Animal } from './Animal.js';
import { Board } from './Board.js';


export class AIAgent {
    static instance = null;

    constructor(game){
        if (AIAgent.instance) {
            return AIAgent.instance;
        }

        this.enemy = game.enemy;
        this.player = game.player;

        AIAgent.instance = this;
    }

    //AIControl()
    //during the enemy turn, the function will be called only once
    //the action of different animal will be done in the function already
    //no need use for loop to repeat calling the function
    AIControl() {
        //follow below steps to implement the AIControl for each animal
        //1. check if the animal is wake/ or getting reinforced by other animal in the same group
        //2. if the animal is wake, use the resource assignment algorithm to assign the action to the animal
        //3. carry out the action of the animal
        for (let e of this.enemy) {
            e.updateWake();
        }
        this.reinforcement();

        if (!this.wake) {
            return; //if the animal is not awake, do nothing
        }

        //2.resource assignment algorithm
        for (let e of this.enemy) {
            if (e.actionstate != null) {
                continue;
            }
            //if the animal is wake, assign the action to the animal
            //the action will be assigned according to the overall priority, calculated as below:
            // overall priority(for each action) = basic priority * priority modifier
            // probability of taking each action = overall priority of action t / sum of overall priority
            //the basic priority is defined in AnimalProperties.js
            //there is 3 action for each animal: finding cover, attack player, escape
            //the priority modifier is defined in the function below
            var findCoverModifier = this.findCoverModifier(e);
            var attackPlayerModifier = this.attackPlayerModifier(e);
            var escapeModifier = this.escapeModifier(e);

            //calculate the overall priority for each action
            var overallPriority = [];
            overallPriority.push(AnimalProperties.PRIORITY[e.name][0] * findCoverModifier);
            overallPriority.push(AnimalProperties.PRIORITY[e.name][1] * attackPlayerModifier);
            overallPriority.push(AnimalProperties.PRIORITY[e.name][2] * escapeModifier);

            //calculate the probability of taking each action
            var sum = overallPriority.reduce((a, b) => a + b, 0);
            var probability = overallPriority.map(e => e / sum);

            //randomly choose the action according to the probability
            var random = Math.random();
        }
    }

    //helper function of AIControl
    reinforcement() {
        //change all the animal in the same group to wake
        // if any animal is wake, wake up all the animal in the same group
        for (let e of this.enemy) {
            if (e.wake) {
                for (let e2 of this.enemy) {
                    if (e2.groupID == e.groupID) {
                        e2.wake = true;
                    }
                }
            }
        }
    }


    //debug function
    printWake() {
        var WakeStatus = {};
        for (let e of this.enemy) {
            WakeStatus[e.name] = e.wake;
        }
        console.log("WakeStatus: ", WakeStatus);
    }
}