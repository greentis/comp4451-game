import { AnimalProperties } from './AnimalProperties.js';
import { Animal } from './Animal.js';
import { Board } from './Board.js';

import { distanceQR } from './Board.js';
import { xxhash } from './Board.js';


export class AIAgent {
    constructor(game){
        this.game = game;
        this.enemy = game.enemy;
        this.player = game.player;

        AIAgent.instance = this;
    }

    //AIControl()
    //during the enemy turn, the function will be called only once
    //the action of different animal will be done in the function already
    //no need use for loop to repeat calling the function
    async AIControl() {
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

        console.log(this.enemy)
        //2.resource assignment algorithm
        for (let e of this.enemy) {
            //e.playAnimation(1);
            //if the animal is wake, assign the action to the animal
            if (!e.wake) {
                continue;
            }
            let timeout = 0;
            while (e.getActionPoint() > 0 && e.actionstate != "localMinima" && timeout < 10) {
                //the action will be assigned according to the overall priority, calculated as below:
                // overall priority(for each action) = basic priority * e^(priority modifier)
                // probability of taking each action = overall priority of action t / sum of overall priority
                //the basic priority is defined in AnimalProperties.js
                //there is 3 action for each animal: finding cover, attack player, escape
                //the priority modifier is defined in the function below
                var findCoverModifier = this.findCoverModifier(e);  //TODO: implement this function
                var attackPlayerModifier = this.attackPlayerModifier(e); //TODO: implement this function
                var escapeModifier = this.escapeModifier(e); //TODO: implement this function
                //onsole.log("findCoverModifier: ", findCoverModifier, "attackPlayerModifier: ", attackPlayerModifier, "escapeModifier: ", escapeModifier);

                //calculate the overall priority for each action
                var overallPriority = [];
                overallPriority.push(e.actionPriority.cover * Math.exp(findCoverModifier));
                overallPriority.push(e.actionPriority.attack * Math.exp(attackPlayerModifier));
                overallPriority.push(e.actionPriority.escape * Math.exp(escapeModifier));
                //console.log("overallPriority: ", overallPriority);

                //calculate the probability of taking each action
                var sum = overallPriority.reduce((a, b) => a + b, 0);
                var probability = overallPriority.map( x => x / sum);
                //console.log("probability: ", probability);

                //randomly choose the action according to the probability
                let cumulativeSum = 0;
                let chosenAction = -1;
                let actionThreshold = Math.random();
                for (let i = 0; i < probability.length; i++) {
                    cumulativeSum += probability[i];
                    if (actionThreshold < cumulativeSum) {
                        chosenAction = i;
                        break;
                    }
                }
                
                console.log("timeout in ai control: ", timeout,"name: ", e.name, "chosenAction ", chosenAction, "with Action Point",e.getActionPoint(), "last action: ", e.actionstate);
                console.log("actionpoint: ", e.getActionPoint());

                //3. carry out the action of the animal
                switch (chosenAction) {
                    case 0:
                        //finding cover
                        await this.findCover(e, seed);    //TODO: implement this function
                        break;
                    case 1:
                        //attack player
                        await this.attackPlayer(e, seed); //TODO: implement this function
                        break;
                    case 2:
                        //escape
                        await this.escape(e, seed);  //TODO: implement this function
                        break;
                    case -1:
                        e.actionstate="localMinima";
                    default:
                        break;
                }
                timeout++;
                //console.log(timeout);
                
            }  
            //console.log("position: ", e.getTile().q, e.getTile().r);
            
        }
        this.game.setToPlayerTurn(true);
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

        //factor 1: the health of the animal
        findCoverModifier += (0.8 - e.health / e.maxHealth) * 1.5;
        //console.log("findCoverModifier 1: ", findCoverModifier);

        //factor 2: whether the animal is exposed to the player
        var player = this.player;
        var playerTile = [];
        for (let p of player) {
            playerTile.push(p.getTile());
        }
        //var enemyTile = e.getTile();
        var exposed = 0;
        for (let p of playerTile) {
            if (p.isVisibleBy(e)) {
                exposed += 1;
            }
        }
        findCoverModifier += (exposed / playerTile.length) * 2.5;
        //console.log("findCoverModifier 2: ", findCoverModifier);

        //factor 3: whether the last action is findCover
        if (e.actionstate == "findCover") {
            findCoverModifier = -100000;
        }

        return findCoverModifier;

    }

    attackPlayerModifier(e) {
        /* TODO: implement this function */
        var attackPlayerModifier = 1;

        //factor 0: check if it is first action(i.e. actionpoint == 2)
        if (e.getActionPoint() == 2) {
            attackPlayerModifier = -100000;
            return 0;
        }

        //factor 1: if the animal can attack the tile where the player is standing
        var player = this.player;
        var playerTile = [];
        for (let p of player) {
            playerTile.push(p.getTile());
        }
        
        var attackable = false;
        for (let t of playerTile) {
            t.isVisibleBy(e);
            if (t.isVisibleBy(e)) {
                attackable = true;
            }
        }
        if (attackable) {
            attackPlayerModifier += 1.5;
        }
        //console.log("attackPlayerModifier 1: ", attackPlayerModifier);

        //factor 2: whether last action is findCover
        if (e.actionstate == "findCover") {
            attackPlayerModifier *= 1.5;
        }else if(e.actionstate == "escape"){
            attackPlayerModifier /= 1.5;
        }

        return attackPlayerModifier;
    }

    escapeModifier(e) {
        var escapeModifier = 1;
        //console.log("e: ", e);

        //factor 1: the health of the animal
        escapeModifier += (0.66 - e.health / e.maxHealth) * 3.5;
        //console.log("escapeModifier 1: ", escapeModifier);

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
        //console.log("escapeModifier 2: ", escapeModifier);

        //factor 3: if last action is escape, the escape modifier will be decreased
        if (e.actionstate == "escape") {
            escapeModifier /= 2.5;
        }else if(e.actionstate == "findCover"){
            escapeModifier /= 100;
        }
        //console.log("escapeModifier 3: ", escapeModifier);
        return escapeModifier;
    }

    async findCover(e, seed) {
        /* TODO: implement this function */
        e.actionstate = "findCover";
        console.log(e.name, " findCover");

        //step 1: find out the tiles can be reached by the animal
        var reachableTile = [];
        for( let g of this.game.board.grids){
            var t = g[1];
            if (e.findValidPath(t).length > 0 && t.character == null) {    
                if(t.q == 1 && t.r == -2){
                    console.log("warning t: ", t.q, t.r);
                }
                reachableTile.push(t);
            }
        }
        //console.log("reachableTile: ", reachableTile);
        //step 2: find out which tile is best hiding place for the animal
        //affect factor:
            //(2.1)the difference between the hitRate player & hitRate animal
            //(2.2)the distance between the target tile and the player(close to the player is better)
            //(2.3)will it get too close to enemy of the same group
        var player = this.player;
        var enemy = this.enemy;
        
        var bestTile = null;
        var bestPriority = -1000;
        for(let t of reachableTile){
            //(2.1)the difference between the hitRate player & hitRate animal
            var exposed = 0; var advantage = 0;
            for (let p of player) {
                exposed = Math.max(exposed, p.getHitRate(e.getTile()));
                advantage = Math.max(advantage, e.getHitRate(p.getTile()));
            }
            exposed -= advantage * 1.2;
            exposed /= 5.0;

            //(2.2)the distance between the target tile and the player(close to the player is better)
            var minDistance = 1000;
            for (let p of player) {
                var distance = distanceQR(t, p.getTile());
                if (distance < minDistance) minDistance = distance;
            }

            //(2.3)will it get too close to enemy of the same group
            var minDistanceEnemy = 1000;
            for (let e2 of enemy) {
                var distance = distanceQR(t, e2.getTile());
                if (distance < minDistanceEnemy) {
                    minDistanceEnemy = distance;
                }
            }

            //calculate the priority of the target tile
            var priority = - exposed * 3.0 + (e.sightRange - minDistance) * 0.1 - minDistance * 0.05 - minDistanceEnemy * 0.5;
            //console.log("t: ", t.q, t.r, "priority: ", priority);
            if (priority > bestPriority) {
                bestPriority = priority;
                bestTile = t;
            }
        }
        
        if (bestTile){
            //console.log("actionpoint: ", e.getActionPoint(), "bestTile: ", bestTile.q, bestTile.r);
            await e.moveTo(bestTile);
        }
        
    }

    async attackPlayer(e, seed) {
        /* TODO: implement this function */
        e.actionstate = "attackPlayer";
        console.log(e.name, " attackPlayer");

        //step 1: find out which player is able to be attacked(i.e. in the line of sight of the animal)
        var player = this.player;
        var playerTile = [];
        for (let p of player) {
            playerTile.push(p.getTile());
        }
        var attackablePlayer = [];
        for (let p of playerTile) {
            if (e.lineOfSight(p)) {
                attackablePlayer.push(p);
            }
        }
        //console.log("attackablePlayer: ", attackablePlayer);

        //step 2: choose the player to attack
        //affect factor: 
            //the health of the player
            //the distance between the player and the animal
            //the hit rate of that player
        var attackablePlayerHealth = [];
        for (let p of attackablePlayer) {
            attackablePlayerHealth.push(p.character.health);
        }
        //console.log("attackablePlayerHealth: ", attackablePlayerHealth);
        var attackablePlayerDistance = [];
        for (let p of attackablePlayer) {
            attackablePlayerDistance.push(distanceQR(e.getTile(), p));
        }
        //console.log("attackablePlayerDistance: ", attackablePlayerDistance);
        var attackablePlayerHitRate = [];
        for (let p of attackablePlayer) {
            e.findValidPath(p);
            attackablePlayerHitRate.push(e.getHitRate(p));
        }
        //console.log("attackablePlayerHitRate: ", attackablePlayerHitRate);

        var attackablePlayerPriority = [];
        for (let i = 0; i < attackablePlayer.length; i++) {
            attackablePlayerPriority.push(attackablePlayerHitRate[i] * 0.08 - attackablePlayerHealth[i] * 0.5 - attackablePlayerDistance[i] * 0.2);
        }
        //console.log("attackablePlayerPriority: ", attackablePlayerPriority);
        var maxPriority = 0;
        var maxIndex = -1;
        for (let i = 0; i < attackablePlayerPriority.length; i++) {
            if (attackablePlayerPriority[i] > maxPriority) {
                maxPriority = attackablePlayerPriority[i];
                maxIndex = i;
            }
        }
        //console.log("maxIndex: ", maxIndex);
        if (maxIndex != -1) {
            await e.attack(attackablePlayer[maxIndex]);
        }
    }

    async escape(e, seed = null) {
        //find the tile which is the furthest from the player, while can be reached by the animal
        console.log(e);
        e.actionstate = "escape";
        console.log(e.name, " escape");

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
            if (e.findValidPath(t).length > 0 && t.character == null) {
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
        
        if (maxTile) {
            console.log("actionpoint: ", e.getActionPoint(), "maxTile: ", maxTile.q, maxTile.r);
            await e.moveTo(maxTile);
        }
    }

    //debug function
    printWakeAll() {
        var WakeStatus = {};
        for (let e of this.enemy) {
            WakeStatus[e.name] = e.wake;
        }
        //console.log("WakeStatus: ", WakeStatus);
    }

    printWake(e){
        //console.log("WakeStatus: ", e.wake);
    }

    printActionPoint(e){
        console.log("ActionPoint: ", e.getActionPoint());
    }

    playAnimation(e,actionType = 0){
        e.playAnimation(actionType);
    }
}