var cluster = require("cluster");

var numsub = 5, i;

if(cluster.isMaster) {
  for(i=0; i<numsub; i++) {
    cluster.fork({
      DEBUG: process.env.DEBUG
    });
  }
  require("./pub");
  
  cluster.on("online", function(worker) {
    console.log("worker is online, pid %s", worker.process.pid);
  });
} else {
  require("./sub");
}