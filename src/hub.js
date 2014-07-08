var reids = require("redis"),
    debug = require("debug")("hub"),
    assert = require("assert"),
    Q = require("q"),
    Publisher = require("./pub"),
    Subscriber = require("./sub"),
    short = require("shortid"),
    util = require("util");


var MessageFilter = function(hubID, message) {
  console.log(hubId, message);
  if(message._hub && message._hub == hubID) {
    debug("drop message form the hub itself(%s)", hubID);
    return false;
  }
  return true;
};

var Hub = function(options, callback) {
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  
  if(!(this instanceof Hub)) {
    return new Hub(options, callback);
  }
  
  var self = this;
  this.name = short.generate();
  
  //apply name
  options.name = short.generate();
  //apply filter
  options.filter = MessageFilter.bind(options.name);
  Q.nfcall(Subscriber, options).then(function(sub) {
    self.subscriber = sub;
    //setup for publisher
    delete options.filter;
    options.name = short.generate();
    options.client = sub.client;
    options.heartbeatClient = sub.heartbeatClient;
    options.blacklist = [sub.name];
    return Q.nfcall(Publisher, options);
  }).catch(callback).done(function(pub) {
    self.publisher = pub;
    
    self.publish = self.publisher.publish.bind(self.publisher);
    self.subscribe = self.subscriber.subscribe.bind(self.subscriber);
    
    
    if(callback) {
      callback(null, self);
    }
  });
  
};

module.exports = Hub;