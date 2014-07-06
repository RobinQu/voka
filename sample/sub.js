var voka = require("..");

voka.subscriber(function(e, sub) {
  sub.on("time", function(date) {
    console.log("Process %s, time recieved %s", process.pid, date);
  });
});
