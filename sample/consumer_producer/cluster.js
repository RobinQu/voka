var cluster = require("cluster");

if(cluster.isMaster) {
  var numOfProducer = 2, numOfConsumer = 4;
  while(numOfProducer--) {
    cluster.fork({
      TYPE: "producer",
      DEBUG: process.env.DEBUG
    });
  }
  while(numOfConsumer--) {
    cluster.fork({
      TYPE: "consumer",
      DEBUG: process.env.DEBUG
    });
  }
} else {
  var type = process.env.TYPE;
  if(type) {
    require("./" + type);
  }
}