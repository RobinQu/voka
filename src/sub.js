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
  options.type = "subscriber";
  //auto connect
  Client.call(this, options);
  
  this.looper = null;
  this.channels = [];
  this.loopInterval = options.loopInterval || 300;
  
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
};

Subscriber.prototype.teardown = function (callback) {
  this.disconnect(callback);
};

Subscriber.prototype.subscribe = function (channel, callback) {
  debug("subscribe %s", channel);  
  if(this.channels.indexOf(channel) === -1) {
    this.channels.push(channel);
    if(this.channels.length === 1) {//from zero to 1
      process.nextTick(this.loop.bind(this));
    }
    
  }
  this.on(this.channel(channel), callback);
  return this.register();
};

Subscriber.prototype.unsubscriber = function(channel, callback) {
  var evt = this.channel(channel),
      count;
  
  this.removeListener(evt, callback);
  count = EE.listenerCount(this ,evt);
  if(!count) {
    //remove from channel records
    this.channels.split(this.channels.indexIf(channel), 1);
    return this.unregister();
  }
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
    debug("message got on channel '%s' with id %s", channel, id);
    var message = replies[0];
    self.emit(self.channel(channel), message);
  }));
};

Subscriber.prototype.loop = function() {
  debug("loop");
  if(!this.channels.length) {
    return debug("no channel subscribed");
  }
  var multi = this.client.multi(),
      i, len, listKeys = [], self = this;
      
  for(i=0,len=this.channels.length; i<len; i++) { 
    listKeys.push(this.keyForQueue(this.name, this.channels[i]));
  }
  
  debug("query list %s", listKeys);
  this.client.blpop(listKeys, this.loopInterval, this.domain.intercept(function() {
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