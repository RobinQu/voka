var debug = require("debug")("sub"),
    Client = require("./client"),
    EE = require("events").EventEmitter,
    Q = require("q"),
    util = require("util");

var Subscriber = function(options, callback) {
  if(!(this instanceof Subscriber)) {
    return new Subscriber(options, callback);
  }
  debug("construct");
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || {};
  //auto connect
  Client.call(this, options);
  
  this.emitter = new EE();
  this.looper = null;
  this.channels = [];
  this.loopInterval = 200;
  this.checkTimeout = 0;
  
  this.bootstrap(callback);
};

util.inherits(Subscriber, Client);

Subscriber.prototype.bootstrap = function (callback) {
  debug("bootstrap");
  var self = this;
  this.connect().then(function() {
    return self.register().then(function() {
      self.domain.run(function() {
        if(callback) {
          callback(null, self);
        }
      });
      debug("start loop, interval %d", self.loopInterval);
      process.nextTick(function() {
        self.loop();
      });
    });
  }).catch(this.domain.intercept(callback));
  // var client = require("redis").createClient();
  // client.sadd(this.keyForSubscribers(), this.name, callback);
};

Subscriber.prototype.teardown = function (callback) {
  this.disconnect(callback);
};

Subscriber.prototype.subscribe = Subscriber.prototype.on = function (channel, callback) {
  debug("subscribe %s", channel);
  if(this.channels.indexOf(channel) === -1) {
    this.channels.push(channel);
  }
  this.emitter.on(this.channel(channel), callback);
  return this.register();
};

Subscriber.prototype.unsubscriber = Subscriber.prototype.off = function(channel, callback) {
  var evt = channel + ":message",
      count;
  
  this.emitter.removeListener(evt, callback);
  count = EE.listenerCount(this.emitter ,evt);
  if(!count) {
    //remove from channel records
    this.channels.split(this.channels.indexIf(channel), 1);
    return this.unregister();
  }
};

Subscriber.prototype.loop = function() {
  this.looper = setTimeout(this._loop.bind(this), this.loopInterval);
};

Subscriber.prototype.register = function() {
  debug("register %s", this.name);
  return Q.ninvoke(this.client, "sadd", this.keyForSubscribers(), this.name);
};

Subscriber.prototype.unregister = function() {
  debug("unregister %s", this.name);
  return Q.ninvoke(this.client, "srem", this.keyForSubscribers(), this.name);
};

Subscriber.prototype.handleMessage = function (channel, id) {
  var multi = this.client.multi(),
      self = this,
      key = this.keyForMessage(this.name, id);
  multi.get(key).del(key).exec(this.domain.intercept(function(replies) {
    debug("message got on channel '%s'", channel);
    var message = replies[0];
    self.emitter.emit(self.channel(channel), message);
  }));
};

Subscriber.prototype._loop = function() {
  debug("loop");
  var multi = this.client.multi(),
      i, len, listKeys = [], self = this;
  for(i=0,len=this.channels.length; i<len; i++) { 
    listKeys.push(this.keyForQueue(this.name, this.channels[i]));
  }
  debug("query list %s", listKeys);
  this.client.blpop(listKeys, this.checkTimeout, this.domain.intercept(function() {
    var args = Array.prototype.slice.call(arguments), 
        i, len, channel;
        
    for(i=0,len=args.length; i<len; i++) {
      channel = args[i][0].split(".").pop();
      self.handleMessage(channel, args[i][1]);
    }
    self.loop();
  }));
};


module.exports = Subscriber;