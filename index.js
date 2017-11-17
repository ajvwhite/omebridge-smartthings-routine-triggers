var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-smartthings-routine-triggers', 'HomebridgeRoutineTrigger', HomebridgeRoutineTriggerAccessory);
}

function HomebridgeRoutineTriggerAccessory(log, config) {
  var accessory = this;
  this.log = log;
  this.name = config['name'];
  this.appServerUri = config['appServerUri']
  this.smartAppId = config['smartAppId']
  this.accessToken = config['accessToken'];
  this.delayTime = config['delay'];
  this.Timer;

  this.service = new Service.Switch(this.name);

  this.service
      .getCharacteristic(Characteristic.On)
      .on('set', this.toggleSwitch.bind(this))
}

  HomebridgeRoutineTriggerAccessory.prototype.toggleSwitch = function(state, callback) {
  this.log("Setting switch to " + state);
        if(state) {
          var url = this.appServerUri + "/api/smartapps/installations/" + this.smartAppId + "/trigger-routine?access_token=" + this.accessToken;
          //this.log('ON Trigger met, activating routine `' + this.name + '`: ' + url);
          request({
            uri: url,
            method: 'POST',
            json: {
              "routine": this.name
            }
          }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
              callback();
            } else {
              var errorObj = {
                error: true,
                type: "SmartAppException",
                message: "Unknown error"
              };

              if (err && err instanceof Object) {
                errorObj = err;
              } else if (!err && body instanceof Object) {
                errorObj = body;
              } else if (!err && body) {
                errorObj.message = body;
              } else {
                errorObj.message = response.statusCode.toString();
              }

              var errorMsg = errorObj.message;
              if(body && body.message) { errorMsg = body.message; }
              if(body && body.msg) { errorMsg = body.msg; }

              console.log("Error '" + response.statusCode + "': " + errorMsg);
              callback(errorObj);
            }
          });
          clearTimeout(this.Timer);
          this.Timer = setTimeout(function() {
                this.service.getCharacteristic(Characteristic.On).setValue(false, undefined);
              }.bind(this), this.delayTime);
        } else {
          //this.log('OFF trigger met, no action taken due to nature of routines');
          callback();
        }
      }

HomebridgeRoutineTriggerAccessory.prototype.getServices = function() {
  return [this.service];
}
