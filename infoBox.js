import { game } from "./main";
import { Character } from "./Character";
import { Hunter } from "./Hunter";
import { Animal } from "./Animal";

var data = {
    format:"default",
    a:2,
    passRound: () => {
        game.setToPlayerTurn(false);
        data.format = "HunterStateTrack";
    }
};

new Vue({
    el:'#infoBox',
    data:data
});

export function updateData(){
}

