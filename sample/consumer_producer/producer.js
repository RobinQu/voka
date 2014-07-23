var voka = require("../..");

voka.publisher({
  name: "producer"
}, function (e, pub) {
  if(e) {
    console.log(e);
    process.exit(1);
    return;
  }
  setInterval(function () {
    var good = Date.now();
    console.log("Producer %s produces a good: %s", pub.uuid, good);
    pub.publish("goods", good);
  }, 500);
});