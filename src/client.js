var debug = require("debug")("client"),
    domain = require("domain"),
    Q = require("q"),
    short = require("shortid"),
    redis = require("redis"),
    util = require("util"),
    EE = require("events").EventEmitter,
    _ = require("lodash");

var Client = function(options) {
  EE.call(this);
  
  this.name = options.name || short.generate();
  this.type = options.type || "client";
  this.namespace = (options.namespace || "voka").split(".");
  this.redisOpts = options.redis || {};
  this.domain = options.domain || domain.create();
  // console.log(this.domain);
  //IMPORTANT: timeout in seconds
  this.timeout = (options.timeout / 1000) || 5;
  // this.domain.on("error", function(e) {
  //   debug(e);
  // });
  this.domain.add(this);
  this._error = this.emitError.bind(this);
  
};

util.inherits(Client, EE);

Client.prototype.connect = function () {
  debug("connect");
  var self = this;
  return Q.all([
    this.createClient(this.redisOpts),
    this.createClient(this.redisOpts)
  ]).then(function(clients) {
    self.client = clients[0];
    self.heartbeatClient = clients[1];
    self.startHeartbeat();
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
  this.removeAllListeners();
  this.client.quit();
  this.heartbeatClient.quit();
  if(callback) { callback(); }
};

Client.prototype.key = function() {
  return this.namespace.concat(Array.prototype.slice.call(arguments)).join(".");
};

Client.prototype.keyForSubscribers = function() {
  return this.keyForTypeSet("subscriber");
};

Client.prototype.keyForTypeSet = function (type) {
  return this.key(type);
};

Client.prototype.keyForDroplist = function (type) {
  return this.key("droplist", type);
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

Client.prototype.keyForHeartbeat = function (type, name) {
  return this.key("heartbeat", type || this.type, name || this.name);
};

Client.prototype.startHeartbeat = function () {
  var self = this;
  this.heartbeat().fin(function() {
    setTimeout(self.startHeartbeat.bind(self), this.timeout * 1000 / 2);
  }).catch(this._error);
};

Client.prototype.emitError = function (e) {
  this.emit("error", e);
};

Client.prototype.heartbeat = function () {
  var i,len, multi, key, deferred;
  deferred = Q.defer();
  multi = this.heartbeatClient.multi();
  key = this.keyForHeartbeat();
  multi.set(key, Date.now());
  multi.expire(key, this.timeout);
  multi.exec(function(e) {
    if(e) {
      return deferred.reject(e);
    }
    deferred.resolve();
  });
  return deferred.promise;
};

Client.prototype.liveCheck = function (type) {
  var key = this.keyForHeartbeat(type, "*"),
      multi = this.heartbeatClient.multi(),
      self = this,
      setKey = this.keyForTypeSet(type),
      deferred = Q.defer();
  
  multi.keys(key);
  multi.smembers(setKey);
  multi.exec(function(e, replies) {
    if(e) {
      return deferred.reject(e);
    }
    var keys = replies[0],
        members = replies[1],
        dropList, names,
        args = [setKey];
    dropList = _.xor(keys, members.map(self.keyForHeartbeat.bind(self, type))).map(function(k) {
      return k.split(".").pop();
    });
    
    debug("found timeouts %o", dropList);
    if(!dropList.length) {
      return deferred.resolve(dropList);
    }
    
    deferred.resolve(self.evict(type, dropList));
  });
  return deferred.promise;
};

Client.prototype.evict = function (type, list) {
  var deferred = Q.defer(),
      multi = this.heartbeatClient.multi();

  multi.sadd.apply(multi, [this.keyForDroplist(type)].concat(list));
  multi.srem.apply(multi, [this.keyForTypeSet(type)].concat(list));
  multi.exec(function(e) {
    if(e) {
      return deferred.reject(e);
    }
    return deferred.resolve(list);
  });
  return deferred.promise;
};

module.exports = Client;