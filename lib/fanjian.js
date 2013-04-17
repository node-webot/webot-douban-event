var Iconv = require('iconv').Iconv;
var gbk_utf8 = new Iconv('gbk', 'utf-8');
var utf8_gb2312 = new Iconv('utf-8', 'gb2312');
var OpenCC = require('opencc');

var error = require('debug')('weixin:fanjian:error');

var zhs2zht = new OpenCC('zhs2zht.ini');
var zht2zhs = new OpenCC('zht2zhs.ini');

zhs2zht.setConversionMode(OpenCC.CONVERSION_FAST);
zht2zhs.setConversionMode(OpenCC.CONVERSION_FAST);

// 确保都是简体字
function fanjian(text, cb) {
  zht2zhs.convert(text, function(err, converted) {
    if (err) error(err);
    cb(converted || text);
  });
}

fanjian.zhs2zht = function(text, cb) {
  return zhs2zht.convert(text, function(err, converted) {
    if (err) error(err);
    cb(converted || text);
  });
};
fanjian.middleware = function() {
  return function(req, res, next) {
    if (req.wx_data && req.wx_data.text) {
      fanjian(req.wx_data.text, function(ret) {
        if (ret !== req.wx_data.text) req.wx_data.is_zht = true;
        req.wx_data.Content = ret;
        next();
      });
    } else {
      return next();
    }
  };
};
fanjian.gbk_utf8 = gbk_utf8;

module.exports = fanjian;
