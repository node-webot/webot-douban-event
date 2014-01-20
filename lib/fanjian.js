var OpenCC = require('opencc');

var error = require('debug')('weixin:fanjian:error');

var zhs2zht = new OpenCC('s2t.json');
var zht2zhs = new OpenCC('t2s.json');

// 确保都是简体字
function fanjian(text, cb) {
  zht2zhs.convert(text, function(err, converted) {
    if (err) error(err);
    cb(converted || text);
  });
}

fanjian.zhs2zht = function(text, cb) {
  var need_parse = false;
  if (typeof text === 'object') {
    text = JSON.stringify(text);
    need_parse = true;
  }
  return zhs2zht.convert(text, function(err, converted) {
    if (err) error(err);
    if (need_parse) {
      try {
        converted = JSON.parse(converted);
      } catch (e) {
        converted = null;
      }
    }
    cb(converted || text);
  });
};

module.exports = fanjian;
