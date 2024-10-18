import { game } from "./main";

export var infoBox = {
    FORMAT:{
        MissionInfo:"MissionInfo",
        HunterStateTrack:"HunterStateTrack",
        CharacterStats:"CharacterStats"
    },
    format:"MissionInfo",
    a:2,
    health:undefined,
    sightRange:undefined,
    movementSpeed:undefined,

    weapon:undefined,
    damage:undefined,
    blastRadius:undefined,
    
    players:[],
    
    passRound: () => {
        game.setToPlayerTurn(false);
        infoBox.players = game.player;
        infoBox.format = infoBox.FORMAT.HunterStateTrack;
    }
};

new Vue({
    el:'#infoBox',
    data:infoBox
});

export function updateData(){
}

