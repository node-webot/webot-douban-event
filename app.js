var express = require('express');
var debug = require('debug');
var log = debug('webot');

var webot = require('weixin-robot');
var douban = require('./lib/douban');

webot.set('article props', {
  'pic': 'image_lmobile',
  'url': 'adapt_url',
  'desc': douban.eventDesc,
});

var robot = webot.robot(require('./rules/routes'), require('./rules/waits'));
var messages = require('./data/messages');
var conf = require('./conf');

var app = express();
app.enable('trust proxy');

var checkSig = webot.checkSig(conf.weixin);

app.get('/', checkSig);
app.post('/', checkSig, webot.bodyParser(), function(req, res, next) {
  var info = req.wx_data;

  res.type('xml');

  function end() {
    res.send(webot.makeMessage(info));
  }

  if (!info) {
    info.reply = messages['400'];
    return end();
  }

  robot.reply(info, function(err, ret) {
    if (err || !ret) {
      //res.statusCode = (typeof err === 'number' ? err : 500);
      info.reply = ret || messages[String(err)] || messages['503'];
    } else if (ret instanceof Array) {
      info.items = ret;
    } else if (typeof ret == 'string') {
      info.reply = ret;
    } else {
      info.reply = messages['400'];
    }
    end();
  });
});
var port = conf.port || 3000;
var hostname = conf.hostname || '127.0.0.1';
app.listen(port, hostname, function() {
  log('listening on ', hostname, port);
});
