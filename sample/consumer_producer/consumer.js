var voka = require("../..");

voka.subscriber({name: "consumer"}, function (e, sub) {
  if(e) {
    console.log(e);
    process.exit(1);
    return;
  }
  sub.subscribe("goods", function (good) {
    console.log("Consumer %s receives good: %s", sub.uuid, good);
  });
});