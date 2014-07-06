var debug = require("debug")("client"),
    domain = require("domain"),
    redis = require("redis");

var Client = function(options) {
  this.namespace = (options.namespace || "voka").split(".");
  this.redisOpts = options.redis || {};
  this.domain = options.domain || domain.create();
  this.domain.on("error", function(e) {
    debug(e);
  });
};

Client.prototype.connect = function (callback) {
  debug("connect");
  this.client = redis.createClient(this.redisOpts.port || 6379, this.redisOpts.host || "localhost", {
    "auth_pass": this.redisOpts.authpass
  });
  this.client.once("connect", callback);
  // if(this.redisOpts.authpass) {
  //   this.client.auth(this.redisOpts.authpass, callback);
  // } else {
  //   if(callback) { callback(); }
  // }
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

module.exports = Client;