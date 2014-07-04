var reids = require("redis"),
    uuid = require("node-uuid"),
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
  Client.call(this, options);
  //auto connect
  this.bootstrap(callback);
};

util.inherits(Publisher, Client);

Publisher.prototype.bootstrap = function (callback) {
  debug("bootstrap");
  this.connect(callback);
};

Publisher.prototype.incrementMessageID = function (channel) {
  var counterKey = this.key(channel, "nextID");
  return Q.ninvoke(this.client, "incr", counterKey);
};


Publisher.prototype.getSubscribers = function () {
  return Q.ninvoke(this.client, "smembers", this.keyForSubscribers());
};

Publisher.prototype.saveMessage = function (id, subscribers, channel, message) {
  var deferred = Q.defer(), i, len, multi, messageKey, listKey, counterKey;
  multi = this.client.multi();
  for(i=0,len=subscribers.length; i<len; i++) {
    //scoped by subscriber's name
    messageKey = this.keyForMessage(subscribers[i], id);
    //scoped by subscirber's name and channel name
    listKey = this.keyForQueue(subscirbers[i], channel);
    //save message to subscirber's queue
    multi.set(messageKey, message);
    //push message id to channel queue in the subscriber's scope
    multi.rpush(listKey, id);
  }
  multi.exec(deferred.makeNodeResolver());
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
  return getSubscirbers().then(function(subscribers) {
    return self.incrementMessageID(channel).then(function(id) {
      return self.saveMessage(id, subscribers, channel, message);
    });
  });
};


module.exports = Publisher;