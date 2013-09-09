process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
  if ('trace' in err) {
    err.trace();
  }
  if ('stack' in err) {
    console.error(err.stack);
  }
  process.exit();
});

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

  if (Array.isArray(info.reply)) {
    info.reply = info.reply.map(event_list_mapping);
    if (info.has_more) {
      info.reply.push({
        title: '回复 more 查看更多，回复 do 查看其他可用操作',
        picUrl: '',
        url: 'http://www.douban.com/location/',
      });
    }
  }

  if (!info.is_zht) return next();

  fanjian.zhs2zht(info.reply, function(ret) {
    info.reply = ret || info.reply;
    next();
  });
});

function event_list_mapping(item, i) {
  return {
    title: (i+1) + '. ' + item.title,
    picUrl: item.image_lmobile || '',
    url: item.adapt_url && item.adapt_url.replace('adapt', 'partner') || '',
    description: item.owner && douban.event.eventDesc(item),
  };
}



require('./serve')(app, webot);

webot.watch(app, conf.weixin);

var port = conf.port || 3000;
var hostname = conf.hostname || '127.0.0.1';

app.listen(port, hostname, function() {
  log('listening on ', hostname, port);
});

app.enable('trust proxy');
