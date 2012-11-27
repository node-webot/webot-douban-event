var Iconv = require('iconv').Iconv;
var gbk_utf8 = new Iconv('gbk', 'utf-8');
var utf8_gb2312 = new Iconv('utf-8', 'gb2312');
var child_process = require('child_process');

var error = require('debug')('weixin:fanjian:error');

function convert(text, cb, conf) {
  conf = conf || 'zht2zhs.ini';
  try {
    var kid = child_process.spawn('opencc', ['-c', conf]);
    var buflist = [];
    kid.stdout.on('data', function(buf) {
      buflist.push(buf);
    });
    kid.stdin.write(text);
    kid.stdin.end();
    kid.stdout.on('end', function() {
      ret = Buffer.concat(buflist).toString();
      cb(ret);
    });
    return;
  } catch (e) {
    error(e);
    if ('trace' in e) e.trace();
  }
  return cb(text);
}
function fanjian(text, cb) {
  try {
    // 测试是否有繁体字符
    utf8_gb2312.convert(text);
  } catch (e) {
    return convert(text, cb);
  }
  return cb(text);
}
fanjian.zhs2zht = function(text, cb) {
  return convert(text, cb, 'zhs2zht.ini');
};
fanjian.middleware = function() {
  return function(req, res, next) {
    if (req.wx_data && req.wx_data.text) {
      fanjian(req.wx_data.text, function(ret) {
        if (ret) {
          if (ret !== req.wx_data.text) req.wx_data.is_zht = true;
          req.wx_data.text = ret;
        }
        next();
      });
    } else {
      return next();
    }
  };
};
fanjian.gbk_utf8 = gbk_utf8;

module.exports = fanjian;
