var reids = require("redis"),
    debug = require("debug")("hub"),
    assert = require("assert"),
    Q = require("q"),
    Publisher = require("./publisher"),
    Subscriber = require("./subscriber"),
    short = require("shortid"),
    util = require("util");


var MessageFilter = function(hubID, message) {
  if(message._hub && message._hub == hubID) {
    debug("drop message form the hub itself(%s)", hubID);
    return false;
  }
  return true;
};

var Hub = function(options, callback) {
  if(!(this instanceof Hub)) {
    return new Hub(opitons, callback);
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
    options.client = pub.client;
    options.heartbeatClient = pub.heartbeatClient;
    options.blacklist = [sub.name];
    return Q.nfcall(Publisher, options);
  }).catch(callback).done(function(pub) {
    self.publisher = pub;
    if(callback) {
      callback(null, self);
    }
  });
  
  this.publish = this.publisher.publish.bind(this.publisher);
  this.subscribe = this.subscriber.subscribe.bind(this.subscriber);
};

module.exports = Hub;