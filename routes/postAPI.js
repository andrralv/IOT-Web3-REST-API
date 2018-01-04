//express libs
var express = require('express');
var bodyParser = require('body-parser');

//web3 & contracts libs
var web3 = require('web3');
web3 = new web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
var contracts = [];
var TruffleContract = require('truffle-contract');
var ActorABI = require('../build/contracts/Actor.json');
var VehiculeABI = require('../build/contracts/Vehicule.json');
var VehiculeDatabaseABI = require('../build/contracts/VehiculeDatabase.json');

//contracts init
contracts.Actor = TruffleContract(ActorABI);
contracts.Actor.setProvider(web3.currentProvider);
contracts.Vehicule = TruffleContract(VehiculeABI);
contracts.Vehicule.setProvider(web3.currentProvider);
contracts.VehiculeDatabase = TruffleContract(VehiculeDatabaseABI);
contracts.VehiculeDatabase.setProvider(web3.currentProvider);

//Azure Queue
var azureQueue = require('azure-queue-node');
azureQueue.setDefaultClient({
    accountUrl: 'https://tbdix.queue.core.windows.net/tbdixfaultcodes',
    accountName: 'tbdix',
    accountKey: 'YI/QJHierS3d6Ckp6o4wo/B5BTM+odfQHYDLuw6BA7N5SXTN6aAKoo9I0/ZVjg76n/AxP8MtnXGSOdU3ZpgPPg=='
});

var client = azureQueue.getDefaultClient();
console.log(azureQueue.getDefaultClient());
client.createQueue('sensor', true, function (data) {
    console.log("created: " + data);
});

//express app
var app = express();
var router = express.Router();
const path = require('path');

/* THIS API READS FROM THE QUEUE AND COMMUNICATES WITH BLOCKCHAIN */
router.post('/:vehicule', function (req, res) {
    client.getMessages('sensor', {maxMessages: 1}, function(error, data) {
        if(data.length == 0){
            res.json({"response":"nothing to do"});
        }
        data.forEach(row => {
            web3.personal.unlockAccount(web3.eth.accounts[0], "1234");
            contracts.Vehicule.at(req.params.vehicule).then(instance => {
                console.log("test 0: (from) ", web3.eth.accounts[0])
                console.log("test 1: (to) ", web3.eth.accounts[1])
                console.log("test 2: (json) ", JSON.stringify(row.messageText))
                return instance.addAction(5, web3.eth.accounts[1], "Auto Sensor", JSON.stringify(row.messageText), { from: web3.eth.accounts[0] });
            }).then(result => {
                client.deleteMessage('sensor', row.messageId, row.popReceipt, function(err, data) {});
                res.json(
                    {
                        "data" : row,
                        "tx": result.tx 
                    }
                );
            }).catch(error => {
                res.json({ "error": error.message });
            });
        });
    });
});

router.get('/push', function (req, res) {
    client.putMessage('sensor', {
        co2exhaust: Math.floor((Math.random() * 10) + 1),
        fuelInjection: Math.floor((Math.random() * 10) + 1),
        coolantTemp: Math.floor((Math.random() * 10) + 1),
        batteryCheck: Math.floor((Math.random() * 2)),
        oilMeter: Math.floor((Math.random() * 10) + 1),
        acCompressor: Math.floor((Math.random() * 15) + 1),
        mileage: Math.floor((Math.random() * 10000)),
        fuseBox: Math.floor((Math.random() * 18)),
        barometer: Math.floor((Math.random() * 100)),
        transmissionFluid: Math.floor((Math.random() * 100)),
        fuelTank: Math.floor((Math.random() * 5000)),
        crashFront: Math.floor((Math.random() * 2)),
        airbagRight: Math.floor((Math.random() * 2)), 
        airbagLeft: Math.floor((Math.random() * 2)), 
        crashRight: Math.floor((Math.random() * 2)), 
        crashLeft: Math.floor((Math.random() * 2)), 
        crashBackRight: Math.floor((Math.random() * 2)), 
        crashBackLeft: Math.floor((Math.random() * 2))
        
        // BINARY: Math.floor((Math.random() * 2))
    }, function (error, data) {
        res.json({ "result" : "ok" });
    });
});

module.exports = router;
