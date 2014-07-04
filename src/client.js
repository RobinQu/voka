var debug = require("debug")("client");

var Client = function(options) {
  this.namespace = (options.namespace || "voka").split(".");
  this.redisOpts = options.redis || {};
};

Client.prototype.connect = function (callback) {
  debug("connect");
  this.client = redis.createClient(this.redisOpts.port, this.redisOpts.host);
  if(this.redisOpts.authpass) {
    this.client.auth(this.redisOpts.authpass, callback);
  } else {
    if(callback) { callback(); }
  }
};

Client.prototype.disconnect = function (callback) {
  this.client.quit();
  if(callback) { callback(); }
};

Client.prototype.key = function() {
  return this.namespace.concat(arguments).join(".");
};

Client.prototype.keyForSubscribers = function() {
  return this.key("subscribers");
};

Client.prototype.keyForMessage = function (subscriber, id) {
  return this.key(subscriber, "messages", id);
};

Client.prototype.keyForQueue = function (subscriber, channel) {
  return this.key(subscriber, channel);
};

module.exports = Client;