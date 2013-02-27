cb = require('./callback')
eu = require('./euclidean')
//sm = require('./statemachine')

cb.applyStateMachine(eu.Euclidean);
var eu1 = new eu.Euclidean(102, 18)
var euset = {
        'entry': 0,
        'states':[
            ['compare', 1,2], 
            ['minus', 0, 3],
            ['exchange',1],
            ['output', -1]
        ]
        }

eu1.set(euset)

// eu1.start()

var eu2 = new eu.Euclidean(200,65)
eu2.set(euset)

model = new cb.applyStateMachine(new Function);
var host = new model;
host.eu1 = eu1
host.eu2 = eu2

var eu3 = new eu.Euclidean(10035,27)
eu3.set(euset);

host.set({
        "entry":0,
        "states":[
             ["eu1", 1],
             [eu3, 2],
             ["eu2", -1]
             ]
         })

host.start()

