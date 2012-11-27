var Iconv = require('iconv').Iconv;
var gbk_utf8 = new Iconv('gbk', 'utf-8');
var utf8_gb2312 = new Iconv('utf-8', 'gb2312');
var child_process = require('child_process');

function fanjian(text, cb) {
  try {
    // 测试是否有繁体字符
    utf8_gb2312.convert(text);
  } catch (e) {
    try {
      var kid = child_process.spawn('opencc', ['-c', 'zht2zhs.ini']);
      var buflist = [];
      kid.stdout.on('data', function(buf) {
        buflist.push(buf);
      });
      kid.stdin.write(text);
      kid.stdin.end();
      kid.stdout.on('end', function() {
        cb(Buffer.concat(buflist).toString());
      });
      return;
    } catch (e) {
      console.log(e);
    }
  }
  return cb(text);
}
fanjian.middleware = function() {
  return function(req, res, next) {
    if (req.wx_data && req.wx_data.text) {
      fanjian(req.wx_data.text, function(ret) {
        if (ret) {
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
