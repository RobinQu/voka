var debug = require("debug"),
    Client = require("./client"),
    EE = require("events").EventEmitter,
    Q = require("q"),
    short = require("shortid");

var Subscriber = function(options, callback) {
  if(!(this instanceof Subscriber)) {
    return new Subscriber(options, callback);
  }
  debug("construct");
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  this.name = options.name || short.generate();
  Client.call(this, options);
  //auto connect
  this.bootstrap(callback);
  this.emitter = new EE();
  this.chanels = [];
  this.looper = null;
  this.loopInterval = 200;
  this.checkTimeout = 0;
};

Subscriber.prototype.bootstrap = function (callback) {
  Q.ninvoke(this, "connect").then(function() {});
  this.connect(callback);
  this.loop();
};

Subscriber.prototype.teardown = function (callback) {
  this.disconnect(callback);
};

Subscriber.prototype.subscribe = Subscriber.prototype.on = function (channel, callback) {
  this.channels.push(channel);
  this.emitter.on(channel + ":message", callback);
};

Subscriber.prototype.unsubscriber = Subscriber.prototype.off = function(channel, callback) {
  var evt = channel + ":message",
      count;
  
  this.emitter.removeListener(evt, callback);
  count = EE.listenerCount(this.emitter ,evt);
  if(!count) {
    //remove from channel records
    this.channels.split(this.channels.indexIf(channel), 1);
  }
};

Subscriber.prototype.loop = function () {
  this.looper = setTimeout(this._loop.bind(this), this.loopInterval);
};

Subscriber.prototype.register = function () {
  return Q.ninvoke(this.client, "sadd", this.name);
};

Subscriber.prototype._loop = function () {
  var multi = this.client.multi(),
      i, len, listKeys = [];
  for(i=0,len=this.channels.length; i<len; i++) { 
    listKeys.push(this.keyForQueue(this.name, this.channels[i]));
  }
  this.client.blpop(listKeys, this.checkTimeout, function() {
    console.log(arguments);
  });
};


module.exports = Subscriber;