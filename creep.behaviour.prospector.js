module.exports = {
    name: 'prospector',
    approach: function(creep){
        // console.log('prospector:approaching');
        let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.pos.roomName);
        let range = creep.pos.getRangeTo(targetPos);
        if( range > 0 ) 
            creep.drive( targetPos, 0, 0, range );
        return range;
    },
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null  || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            delete creep.data.path;
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
        if( creep.flee ) {
            if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9855), SAY_PUBLIC); 
            let drop = r => { if(creep.carry[r] > 0 ) creep.drop(r); };
            _.forEach(Object.keys(creep.carry), drop);
            let home = Game.spawns[creep.data.motherSpawn];
            creep.drive( home.pos, 1, 1, Infinity);
        }
    },
    nextAction: function(creep){
        // at target room
        if( creep.flag && creep.flag.pos.roomName == creep.pos.roomName ){
            // console.log('prospector:at target room');
            let source;
            if( !creep.data.determinatedTarget ) { // select source
                let notDeterminated = source => {
                    let hasThisSource = data => { return data.determinatedTarget == source.id };
                    let existingBranding = _.find(Memory.population, hasThisSource);
                    return !existingBranding;
                };
                source = _.find(creep.room.sources, notDeterminated);
                if( source ) {
                    creep.data.determinatedTarget = source.id;
                }
                if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9935), SAY_PUBLIC); 
            } else { // get dedicated source
                source = Game.getObjectById(creep.data.determinatedTarget);
            }
    
            if( source ) {
                if( !creep.action ) Population.registerAction(creep, Creep.action.harvesting, source);
                if( !creep.data.determinatedSpot ) { 
                    let args = {
                        spots: [{
                            pos: source.pos, 
                            range: 1
                        }], 
                        checkWalkable: true, 
                        where: null, 
                        roomName: creep.pos.roomName
                    }
    
                    let invalid = [];
                    let findInvalid = entry => { 
                        if( entry.roomName == args.roomName && ['miner', 'upgrader'].includes(entry.creepType) && entry.determinatedSpot && entry.ttl > entry.spawningTime) 
                            invalid.push(entry.determinatedSpot)
                    };
                    _.forEach(Memory.population, findInvalid);
                    args.where = pos => { return !_.some(invalid,{x:pos.x,y:pos.y}); };
    
                    if( source.container )
                        args.spots.push({
                            pos: source.container.pos, 
                            range: 1
                        });
                    let spots = Room.fieldsInRange(args);
                    if( spots.length > 0 ){
                        let spot = creep.pos.findClosestByPath(spots, {filter: pos => {
                            return !_.some( 
                                creep.room.lookForAt(LOOK_STRUCTURES, pos), 
                                {'structureType': STRUCTURE_ROAD }
                            );
                        }})
                        if( !spot ) spot = creep.pos.findClosestByPath(spots) || spots[0];
                        if( spot ) creep.data.determinatedSpot = {
                            x: spot.x, 
                            y: spot.y
                        }
                    } 
                    if( !creep.data.determinatedSpot ) logError('Unable to determine working location for prospector in room ' + creep.pos.roomName);
                }
                
                // If source is empty, just wait
                if ( source.energy > 0 ) {
                    return true; 
                }
    
                if( creep.data.determinatedSpot ) {
                    let carrying = creep.sum;
                    console.log('prospector has a spot')
                    if( source.link && source.link.energy < source.link.energyCapacity ) {
                        console.log('prospector something about links')
                        if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                        let range = this.approach(creep);
                        if( range == 0 ){
                            if(carrying > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                                creep.transfer(source.link, RESOURCE_ENERGY);
                            if ( source.energy > 0 ) {
                                console.log('0source.energy:' + source.energy);
                                creep.harvest(source)
                            } else {
                                // not the end of the world, we wait
                                return true;
                            }
                            return;
                        }
                    } else if( source.container && source.container.sum < source.container.storeCapacity ) {
                        console.log('prospector something about storage')
                        if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                        let range = this.approach(creep);
                        if( range == 0 ){
                            if( carrying > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) ))){
                                let transfer = r => { if(creep.carry[r] > 0 ) creep.transfer(source.container, r); };
                                _.forEach(Object.keys(creep.carry), transfer);
                            }                            
                            if ( source.energy > 0 ) {
                                console.log('1source.energy:' + source.energy);
                                creep.harvest(source)
                            } else {
                                // not the end of the world, we wait
                                console.log('prospector will wait')
                                return true;
                            }
                            return;
                        }
                    } else if( creep.room.population && creep.room.population.typeCount['hauler'] && creep.room.population.typeCount['hauler'] > 0 ) {
                        console.log('prospector something about pop')
                        if(CHATTY) creep.say('dropmining', SAY_PUBLIC);    
                        let range = this.approach(creep);      
                        if( range == 0 ){             
                            if( carrying > ( creep.carryCapacity - 
                                ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) ))) {
                                if( OOPS ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
                                let drop = r => { if(creep.carry[r] > 0 ) creep.drop(r); };
                                _.forEach(Object.keys(creep.carry), drop);
                            }
                            if ( source.energy > 0 ) {
                                console.log('2source.energy:' + source.energy);
                                creep.harvest(source)
                            } else {
                                // not the end of the world, we wait
                                return true;
                            }
                            return;
                        }
                    } else { 
                        console.log('prospector has nothing to do')
                        //Creep.behaviour.worker.run(creep);
                        return true;
                    } 
                }
            }
        }
        // not at target room
        else {
            // console.log('prospector:not at target room');
            this.exploitNextRoom(creep);
            return;
        }
                
    },
    exploitNextRoom: function(creep){
        if( creep.sum < creep.carryCapacity*0.4 ) {
            // calc by distance to home room
            let validColor = flagEntry => 
                (flagEntry.color == FLAG_COLOR.invade.exploit.color && flagEntry.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor);
            let flag = FlagDir.find(validColor, Game.rooms[creep.data.homeRoom].controller.pos, false, FlagDir.exploitMod, creep.name);
            // new flag found
            if( flag ) {
                // console.log('prospector:have a flag');
                // ToDo - One Prospector Per-flag
                // check no other prospector has a claim at this flag
                // ToDo - Save on flags, assign one prospector per source in flagged room
                // travelling
                if( Creep.action.travelling.assign(creep, flag) ) {
                    // console.log('prospector:assigning flag');
                    Population.registerCreepFlag(creep, flag);
                    return true;
                }
            }
        }
        // no new flag
        // go home
        // console.log('prospector:nothing to do, going home');
        Population.registerCreepFlag(creep, null);
        Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
        return false;
    }
}
