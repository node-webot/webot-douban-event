var express = require('express');
var debug = require('debug');
var log = debug('weixin');
var error = debug('weixin:error');

var webot = require('weixin-robot');
var User = require('./model/user');
var douban = require('./lib/douban');
var fanjian = require('./lib/fanjian');
var memcached = require('./lib/memcached');

var messages = require('./data/messages');
var conf = require('./conf');

webot.codeReplies = messages;

var app = express();

app._conf = conf;
app.use(express.static(__dirname + '/static'));
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');
app.set('views', __dirname + '/templates');

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: conf.salt, store: new memcached.MemObj('wx_session') }));

// load rules
require('./rules')(webot);

var ONE_HOUR = 3600000;

webot.beforeReply(function ensure_zhs(info, next) {
  // add alias
  info.from = info.uid;

  // find user
  User.getOrCreate(info.uid, function(err, user) {
    if (err) {
      info.ended = true;
      return next(err);
    }

    info.user = user;

    // waiter will expire
    if (user.mtime < new Date() - ONE_HOUR) {
      delete info.session.waiter;
    }

    if (!info.text) return next();

    fanjian(info.text, function(ret) {
      if (ret !== info.text) info.is_zht = true;
      info.text = ret;
      next();
    });
  });
});

webot.afterReply(function reply_output(info, next) {
  if (info.err == 404 && info.param.start) {
    info.reply = messages['NO_MORE'];
  } else if (info.err || !info.reply) {
    //res.statusCode = (typeof err === 'number' ? err : 500);
    info.reply = info.reply || messages[String(info.err)] || messages['503'];
  }

  if (!info.is_zht) return next();

  fanjian.zhs2zht(info.reply, function(ret) {
    info.reply = ret || info.reply;
    next();
  });
});

require('./serve')(app, webot);

webot.watch(app, conf.weixin);

var port = conf.port || 3000;
var hostname = conf.hostname || '127.0.0.1';

app.listen(port, hostname, function() {
  log('listening on ', hostname, port);
});

app.enable('trust proxy');
