let mod = {};
module.exports = mod;
mod.name = 'pioneer';
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || creep.action.name == 'idle') {
        if( creep.data.destiny && creep.data.destiny.task && Task[creep.data.destiny.task] && Task[creep.data.destiny.task].nextAction ) 
            Task[creep.data.destiny.task].nextAction(creep);
        else this.nextAction(creep);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.nextAction = function(creep) {
    var flag;
    if( creep.data.destiny ) flag = Game.flags[creep.data.destiny.flagName];
    
    if( flag ) {
        // not at target room
        if( !flag.room || flag.pos.roomName != creep.pos.roomName ){
            // travel to target room
            if( Creep.action.travelling.assign(creep, flag)) {
                Population.registerCreepFlag(creep, flag);
                return true;
            }
        }
        // if target room claimed      
        if( flag.room && flag.room.controller.my ) {       
            let spawnFlag = FlagDir.find(FLAG_COLOR.claim.spawn, creep.pos, true) ;
            // and has spawn flag
            if( spawnFlag ) {
                // but spawn is complete
                if( flag.room.structures.spawns && flag.room.structures.spawns.length > 0 ){ 
                    // remove spawn flag
                    flag.remove();
                    // also remove exploit flags
                    let remove = f => Game.flags[f.name].remove();
                    _.forEach(FlagDir.filter(FLAG_COLOR.invade.exploit, flag.pos, true), remove);
                }
                else { // no spawn => build it
                    if( flag.room.constructionSites.length == 0 ) // no constructionSites // TODO: filter for spawn-constructionSite
                        flag.room.createConstructionSite(flag, STRUCTURE_SPAWN); // create spawn construction site
                }
            }
        }
    }    
    
    // else run as worker
    Creep.behaviour.worker.nextAction(creep);
};
