var debug = require("debug")("client"),
    domain = require("domain"),
    Q = require("q"),
    short = require("shortid"),
    redis = require("redis");

var Client = function(options) {
  this.name = options.name || short.generate();
  this.namespace = (options.namespace || "voka").split(".");
  this.redisOpts = options.redis || {};
  this.domain = options.domain || domain.create();
  this.timeout = (options.timeout / 1000) || 5;
  this.domain.on("error", function(e) {
    debug(e);
  });
  this.timeoutTimers = {};
};

Client.prototype.connect = function () {
  debug("connect");
  var self = this;
  return Q.all([
    this.createClient(this.redisOpts),
    this.createClient(this.redisOpts)
  ]).then(function(clients) {
    self.client = clients[0];
    self.heartbeatClient = clients[1];
  });
};

Client.prototype.createClient = function (options) {
  var deferred = Q.defer(), client;
 client = redis.createClient(options.port || 6379, options.host || "localhost", {
    "auth_pass": options.authpass
  });
  client.once("connect", function() {
    deferred.resolve(client);
  });
  client.once("error", function(e) {
    deferred.reject(e);
  });
  return deferred.promise;
};

Client.prototype.disconnect = function (callback) {
  this.client.quit();
  if(callback) { callback(); }
};

Client.prototype.key = function() {
  return this.namespace.concat(Array.prototype.slice.call(arguments)).join(".");
};

Client.prototype.keyForSubscribers = function() {
  return this.key("subscribers");
};

Client.prototype.channel = function (name) {
  return "channel:" + name;
};

Client.prototype.keyForMessage = function (subscriber, id) {
  return this.key(subscriber, "messages", id);
};

Client.prototype.keyForQueue = function (subscriber, channel) {
  return this.key(subscriber, channel);
};

Client.prototype.keyForHeartbeat = function (subscriber) {
  return this.key("heartbeat", subscriber);
};

Client.prototype.ping = function (targets) {
  var i,len, multi, key, deferred;
  deferred = Q.defer();
  multi = this.client.multi();
  for(i=0,len=targets.length; i<len; i++) {
    key = this.keyForHeartbeat(targets[i]);
    multi.set(key, Date.now());
    multi.expire(key, this.timeout);
  }
  multi.exec(this.domain.intercept(function() {
    debug("ping sent");
  }));
  setTimeout(function() {
    
  }, this.timeout);
  return defer.promise;
};

Client.prototype.pong = function () {
  
};

Client.prototype.invalidate = function () {
  
};

module.exports = Client;