var voka = require("..");

voka.subscriber(function(e, sub) {
  sub.subscribe("time", function(date) {
    console.log("Process %s, time recieved %s", process.pid, date);
  });
  sub.domain.on("error", function(e) {
    console.log(e);
  });
});
