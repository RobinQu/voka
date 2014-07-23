var isJSON = require("is-json");


exports.serialize = function(obj) {
  if(isJSON(obj, true)) {
    return JSON.stringify(obj);
  }
  return obj;
};

exports.deserialize = function(obj) {
  if(isJSON(obj)) {
    return JSON.parse(obj);
  }
  return obj;
};