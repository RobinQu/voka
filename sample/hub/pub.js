var voka = require("../..");

voka.publisher(function(e, pub) {
  if(e) {
    console.log(e);
    process.exit(1);
  }
  
  setInterval(function() {
    pub.publish("chat", {
      name: pub.name,
      time: Date.now()
    });
  }, 1000 * 2);
  
});