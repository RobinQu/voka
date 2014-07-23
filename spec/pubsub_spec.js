var voka = require(".."),
    expect = require("chai").expect;

describe("Publisher", function() {
  
  
  var pub = voka.publisher(),
      sub1 = voka.subscriber(),
      sub2 = voka.subscriber();
  
  
  after(function() {
    pub.teardown();
    sub1.teardown();
    sub2.teardown();
  });
  
  xit("should publish message to redis", function(done) {
    
    sub1.subscribe("type2", function(message) {
      expect(message).to.equal("foo");
      done();
    });
    pub.publish("type2", "foo");

  });
  
  it("should accept json object", function (done) {
    sub1.subscribe("type2", function (message) {
      console.log(message);
      expect(message.foo).to.equal("bar");
      done();
    });
    pub.publish("type2", {foo:"bar"});
  });
  
  
});