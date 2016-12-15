var setup = new Creep.Setup('prospector');
setup.minControllerLevel = 4;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.default = {
    fixedBody: [WORK, WORK, CARRY, MOVE], 
    multiBody: [WORK, MOVE], 
    minAbsEnergyAvailable: 500, 
    minEnergyAvailable: 0.3,
    maxMulti: 3,
    // maxCount: FlagDir.count(FLAG_COLOR.invade.exploit)
    maxCount: 1
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.none,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;