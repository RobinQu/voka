var reids = require("redis"),
    uuid = require("node-uuid"),
    debug = require("debug")("pub"),
    assert = require("assert"),
    Q = require("q");

var Publisher = function(options, callback) {
  if(!(this instanceof Pbulisher)) {
    return new Publisher(options, callback);
  }
  
  debug("construct");
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  this.redisOpts = options.redis || {};
  //auto connect
  this.bootstrap(callback);
  this.namespace = (options.namespace || "").split(".");
};

Publisher.prototype.bootstrap = function (callback) {
  debug("bootstrap");
  this.client = redis.createClient(this.redisOpts.port, this.redisOpts.host);
  if(this.redisOpts.authpass) {
    this.client.auth(this.redisOpts.authpass, callback);
  } else {
    callback();
  }
};

Publisher.prototype.incrementMessageID = function (channel) {
  var counterKey = this.key(channel, "nextID");
  return Q.ninvoke(this.client, "incr", counterKey);
};


Publisher.prototype.getSubscribers = function () {
  return Q.ninvoke(this.client, "smembers", this.key("subscribers"));
};

// 1. fetch all subscribers
// 2. write to each subscriber's queue
Publisher.prototype.saveMessage = function (id, subscribers, channel, message) {
  var deferred = Q.defer(), i, len, multi, messageKey, listKey, counterKey;
  multi = this.client.multi();
  for(i=0,len=subscribers.length; i<len; i++) {
    messageKey = this.key(subscribers[i], "messages", id);
    listKey = this.key(subscirbers[i], channel);
    multi.set(messageKey, message);
    multi.rpush(listKey, id);
  }
  multi.exec(deferred.makeNodeResolver());
  return deferred.promise;
};

Publisher.prototype.key = function () {
  return this.namespace.concat(arguments).join(".");
};

Publisher.prototype.teardown = function () {
  debug("teardown");
  this.client.quit();
};

Publisher.prototype.publish = function (channel, message) {
  var self = this;
  assert(channel, "should provide a publish channel");
  return getSubscirbers().then(function(subscribers) {
    return self.incrementMessageID(channel).then(function(id) {
      return self.saveMessage(id, subscribers, channel, message);
    });
  });
};


module.exports = Publisher;