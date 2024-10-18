import { AnimalProperties } from './AnimalProperties.js';
import { Animal } from './Animal.js';
import { Board } from './Board.js';

import { distanceQR } from './Board.js';
import { xxhash } from './Board.js';


export class AIAgent {
    static instance = null;

    constructor(game){
        if (AIAgent.instance) {
            return AIAgent.instance;
        }

        this.game = game;
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
        var seed = this.game.board.getSeed();
        
        //1. check if the animal is wake/ or getting reinforced by other animal in the same group
        for (let e of this.enemy) {
            e.updateWake();
        }
        this.reinforcement();

        
        //2.resource assignment algorithm
        for (let e of this.enemy) {
            //if the animal is wake, assign the action to the animal
            if (!e.wake) {
                continue;
            }

            e.actionPoint = 2;
            while (e.actionPoint > 0) {
                //the action will be assigned according to the overall priority, calculated as below:
                // overall priority(for each action) = basic priority * e^(priority modifier)
                // probability of taking each action = overall priority of action t / sum of overall priority
                //the basic priority is defined in AnimalProperties.js
                //there is 3 action for each animal: finding cover, attack player, escape
                //the priority modifier is defined in the function below
                var findCoverModifier = this.findCoverModifier(e);  //TODO: implement this function
                var attackPlayerModifier = this.attackPlayerModifier(e); //TODO: implement this function
                var escapeModifier = this.escapeModifier(e); //TODO: implement this function
                console.log("findCoverModifier: ", findCoverModifier, "attackPlayerModifier: ", attackPlayerModifier, "escapeModifier: ", escapeModifier);

                //calculate the overall priority for each action
                var overallPriority = [];
                overallPriority.push(e.actionPriority.cover * findCoverModifier);
                overallPriority.push(e.actionPriority.attack * attackPlayerModifier);
                overallPriority.push(e.actionPriority.escape * escapeModifier);
                console.log("overallPriority: ", overallPriority);

                //calculate the probability of taking each action
                var sum = overallPriority.reduce((a, b) => a + b, 0);
                var probability = overallPriority.map(e => e / sum);
                console.log("probability: ", probability);

                //randomly choose the action according to the probability
                let cumulativeSum = 0;
                let chosenAction = -1;
                for (let i = 0; i < probability.length; i++) {
                    cumulativeSum += probability[i];
                    if (Math.random() < cumulativeSum) {
                        chosenAction = i;
                        break;
                    }
                }
                console.log("chosenAction: ", chosenAction);

                //3. carry out the action of the animal
                switch (chosenAction) {
                    case 0:
                        //finding cover
                        this.findCover(e, seed);    //TODO: implement this function
                        break;
                    case 1:
                        //attack player
                        this.attackPlayer(e, seed); //TODO: implement this function
                        break;
                    case 2:
                        //escape
                        this.escape(e, seed);  //TODO: implement this function
                        break;
                    default:
                        break;
                }
                
            }  
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

    findCoverModifier(e) {
        /* TODO: implement this function */
        var findCoverModifier = 1;


        return Math.exp(findCoverModifier);

    }

    attackPlayerModifier(e) {
        /* TODO: implement this function */
        var attackPlayerModifier = 1;

        //factor 1: if the animal can attack the tile where the player is standing
        var player = this.player;
        var enemy = this.enemy;
        var playerTile = [];
        var enemyTile = [];
        for (let p of player) {
            playerTile.push(p.getTile());
        }
        for (let e2 of enemy) {
            if (e2.groupID == e.groupID) {
                enemyTile.push(e2.getTile());
            }
        }
        var attackable = false;
        


        return Math.exp(attackPlayerModifier);
    }

    escapeModifier(e) {
        var escapeModifier = 1;
        //console.log("e: ", e);

        //factor 1: the health of the animal
        escapeModifier += (0.66 - e.health / e.maxHealth) * 3.5;
        console.log("escapeModifier 1: ", escapeModifier);

        //factor 2: the remaing animal in the same group versus the remaing player
        var player = this.player;
        var enemy = this.enemy;
        var playerCount = 0;
        var enemyCount = 0;
        for (let p of player) {
                playerCount++;
        }
        for (let e2 of enemy) {
            if (e2.groupID == e.groupID) {
                enemyCount++;
            }
        }
        escapeModifier += (playerCount - enemyCount) / playerCount * 6.5;
        console.log("escapeModifier 2: ", escapeModifier);

        //factor 3: if last action is escape, the escape modifier will be decreased
        if (e.actionstate == "escape") {
            escapeModifier /= 2.5;
        }
        console.log("escapeModifier 3: ", escapeModifier);
        return Math.exp(escapeModifier);
    }

    findCover(e, seed) {
        /* TODO: implement this function */
        e.actionstate = "findCover";
        e.actionPoint--;
    }

    attackPlayer(e, seed) {
        /* TODO: implement this function */
        e.actionstate = "attackPlayer";
        e.actionPoint -= 2;
    }

    escape(e, seed = null) {
        //find the tile which is the farest from the player, while can be reached by the animal
        console.log(e);
        e.actionstate = "escape";
        e.actionPoint--;
        console.log("escape");

        var player = this.player;
        var enemy = this.enemy;
        var playerTile = [];
        var enemyTile = [];
        for (let p of player) {
            playerTile.push(p.getTile());
        }
        for (let e2 of enemy) {
            if (e2.groupID == e.groupID) {
                enemyTile.push(e2.getTile());
            }
        }
        var maxDistance = 0;
        var maxTile = null;
        
        for (let g of this.game.board.grids) {
            var t = g[1];
            //console.log("t: ", t);
            if (t.isVisibleAI(e) ) {
                var minDistance = 1000;
                for (let p of playerTile) {
                    //console.log("t: ", t.q, t.r, "p: ", p.q, p.r);
                    var distance = distanceQR(t, p);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
                if (minDistance > maxDistance) {
                    maxDistance = minDistance;
                    maxTile = t;
                }
            }
        }
        console.log("maxTile: ", maxTile);
        if (maxTile) {
            e.moveTo(maxTile);
        }
    }

    //debug function
    printWakeAll() {
        var WakeStatus = {};
        for (let e of this.enemy) {
            WakeStatus[e.name] = e.wake;
        }
        console.log("WakeStatus: ", WakeStatus);
    }

    printWake(e){
        console.log("WakeStatus: ", e.wake);
    }

    printActionPoint(e){
        console.log("ActionPoint: ", e.actionPoint);
    }
}