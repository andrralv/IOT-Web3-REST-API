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

//express app
var app = express();
var router = express.Router();
const path = require('path');

/* THIS API READS FROM THE BLOCKCHAIN AND SERVES TO MACHINE LEARNING SERVICE */
router.get('/:actor/:vin', function (req, res) {
  var response = {};
  var vehiculeInstance;
  contracts.Actor.at(req.params.actor).then(actor => {
    return actor.database();
  }).then(databaseAddress => {
    return contracts.VehiculeDatabase.at(databaseAddress);
  }).then(database => {
    return database.vins(web3.fromUtf8(req.params.vin));
  }).then(vehiculeAddress => {
    return contracts.Vehicule.at(vehiculeAddress);
  }).then(vehicule => {
    vehicule.OnActionEvent({}, { fromBlock: 0, toBlock: 'latest' }).get((error, result) => {
      response["history"] = [];
      result.forEach(row => {
        response["history"].push({
          event : row.args._event.c[0],
          rerefence : row.args._ref,
          description : row.args._description,
          timestamp : new Date(row.args._timestamp.c[0] * 1000),
          blockNumber : row.args._blockNumber.c[0]
        });
      });
    });
    return vehicule.getState();
  }).then(state => {
    response["state"] = {
      brand : state[0],
      model : state[1],
      type : state[2],
      engine : state[3],
      extras : state[4],
      year : state[6],
      vin : web3.toUtf8(state[5]),
      lastUpdate : state[7],
    };
    res.json(
      {
        "response": response
      }
    );
  }).catch(error => {
    //console.log('error', error);
    res.json({ "error": error.message });
  });
});

module.exports = router;
