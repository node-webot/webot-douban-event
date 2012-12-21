var express = require('express');
var debug = require('debug');
var log = debug('weixin');
var error = debug('weixin:error');

var webot = require('weixin-robot');
var douban = require('./lib/douban');
var fanjian = require('./lib/fanjian');

webot.set('article props', {
  'pic': 'image_lmobile',
  'url': 'adapt_url',
  'desc': douban.eventDesc,
});

process.on('uncaughtException', function (err) {
  error('Caught exception: ' + err);
  if ('trace' in err) {
    err.trace();
  }
});

var robot = webot.robot(require('./rules/routes'), require('./rules/waits'));
var messages = require('./data/messages');
var conf = require('./conf');

var app = express();
app.use(express.static(__dirname + '/static'));
app.enable('trust proxy');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');
app.set('views', __dirname + '/templates');

var checkSig = webot.checkSig(conf.weixin);
app.get('/', checkSig);
app.post('/', checkSig, webot.bodyParser(), fanjian.middleware(), function(req, res, next) {
  var info = req.wx_data;

  res.type('xml');

  function end() {
    if (info.is_zht) {
      fanjian.zhs2zht(info.reply, function(ret) {
        info.reply = ret || info.reply;
        res.send(webot.makeMessage(info));
      });
      return;
    }
    res.send(webot.makeMessage(info));
  }

  if (!info) {
    info.reply = messages['400'];
    return end();
  }

  robot.reply(info, function(err, ret) {
    if (err == 404 && info.param && info.param.start) {
      info.reply = messages['NO_MORE'];
    } else if (err || !ret) {
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

var manager = require('./lib/manager');
var auth = express.basicAuth(function(user, pass) {
  var users = conf.users;
  return users && (user in users) && users[user]['passwd'] === pass;
});
app.get('/admin/', auth, manager.menu, manager.home(robot));
app.get('/admin/:sub', auth, manager.menu, manager.panel(robot));

var port = conf.port || 3000;
var hostname = conf.hostname || '127.0.0.1';
app.listen(port, hostname, function() {
  log('listening on ', hostname, port);
});
