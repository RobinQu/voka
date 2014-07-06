var voka = require("..");

voka.publisher(function(e, pub) {
  setInterval(function() {
    console.log("Process %s, publish time", process.pid);
    pub.publish("time", Date.now());
  }, 1000 * 1);
  
  pub.domain.on("error", function(e) {
    console.log(e);
  });
  
});

