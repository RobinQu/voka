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
  
  it("should publish message to redis", function(done) {
    
    sub1.subscribe("type2", function(message) {
      expect(message).to.equal("foo");
      done();
    });
    pub.publish("type2", "foo");
    // setTimeout(function() {
    //   pub.publish("type2", "foo").then(function() {
    //     pub.client.lpop("voka." + sub1.name + ".type2", function(e, id) {
    //       pub.client.get("voka." + sub1.name  + ".messages." + id, function(e, message) {
    //         expect(e).not.to.be.ok;
    //         expect(message).to.equal("foo");
    //
    //         pub.client.lpop("voka." + sub2.name + ".type2", function(e, id) {
    //           pub.client.get("voka." + sub2.name  + ".messages." + id, function(e, message) {
    //             expect(message).to.equal("foo");
    //             done();
    //           });
    //         });
    //       });
    //     });
    //   });
    // }, 100);
  });
  
  
});