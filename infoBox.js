import { game } from "./main";

export var infoBox = {
    FORMAT:{
        MissionInfo:"MissionInfo",
        HunterStateTrack:"HunterStateTrack",
        CharacterStats:"CharacterStats",
        AttackData:"AttackData",
        UpgradePanel:"UpgradePanel"
    },
    
    format:"MissionInfo",
    missionNo:1,
    note:"Find and kill all animals!",

    health:undefined,
    sightRange:undefined,
    movementSpeed:undefined,

    weapon:undefined,
    damage:undefined,
    blastRadius:undefined,
    
    target:undefined,
    hitRate:undefined,

    players:[],
    enemies:new Set([0]),
    
    passRound: () => {
        infoBox.players = game.player;
        infoBox.format = infoBox.FORMAT.HunterStateTrack;
        game.setToPlayerTurn(false);
    }
};

new Vue({
    el:'#infoBox',
    data:infoBox
});

export function updateData(){
}

