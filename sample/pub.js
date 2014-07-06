var voka = require("..");

voka.publisher(function(e, pub) {
  if(e) {
    console.log(e);
    process.exit();
  }
  setInterval(function() {
    console.log("Process %s, publish time", process.pid);
    pub.publish("time", Date.now());
  }, 1000 * 1);
  
  pub.on("error", function(e) {
    console.log(e);
  });
  
});

