var reids = require("redis"),
    debug = require("debug")("pub"),
    assert = require("assert"),
    Q = require("q"),
    util = require("util"),
    Client = require("./client");

var Publisher = function(options, callback) {
  if(!(this instanceof Publisher)) {
    return new Publisher(options, callback);
  }
  debug("construct");
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || {};
  Client.call(this, options);
  //auto connect
  this.bootstrap(callback);
};

util.inherits(Publisher, Client);

Publisher.prototype.bootstrap = function (callback) {
  debug("bootstrap");
  var self = this;
  Q.ninvoke(this, "connect").then(function() {
    self.domain.run(function() {
      if(callback) {
        callback(null, self);
      }
    });
  }, this.domain.bind(callback));
};

Publisher.prototype.incrementMessageID = function (channel) {
  var counterKey = this.key(channel, "nextID");
  debug("incr next id at %s", counterKey);
  return Q.ninvoke(this.client, "incr", counterKey);
};


Publisher.prototype.getSubscribers = function () {
  var key = this.keyForSubscribers();
  debug("get subscribers from %s", key);
  return Q.ninvoke(this.client, "smembers", key);
};

Publisher.prototype.saveMessage = function (id, subscribers, channel, message) {
  var deferred = Q.defer(), i, len, multi, messageKey, listKey, counterKey;
  debug("save message to %d subscriber(s): %o", subscribers.length, subscribers);
  multi = this.client.multi();
  for(i=0,len=subscribers.length; i<len; i++) {
    //scoped by subscriber's name
    messageKey = this.keyForMessage(subscribers[i], id);
    //scoped by subscirber's name and channel name
    listKey = this.keyForQueue(subscribers[i], channel);
    //save message to subscirber's queue
    debug("save message %s to %s, with id %s", messageKey, listKey, id);
    //push message id to channel queue in the subscriber's scope
    multi.rpush(listKey, id);
    multi.set(messageKey, message);
  }
  multi.exec(deferred.makeNodeResolver());
  // multi.exec(function(e) {
  //   console.log(arguments);
  //   if(e) {
  //     return deferred.reject(e);
  //   }
  //   deferred.resolve();
  // });
  return deferred.promise;
};

Publisher.prototype.teardown = function(callback) {
  debug("teardown");
  this.disconnect(callback);
};

Publisher.prototype.publish = function (channel, message) {
  var self = this;
  assert(channel, "should provide a publish channel");
  debug("publish to %s", channel);
  return self.getSubscribers().then(function(subscribers) {
    return self.incrementMessageID(channel).then(function(id) {
      return self.saveMessage(id, subscribers, channel, message);
    });
  });
};


module.exports = Publisher;