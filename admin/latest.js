module.exports = function(app, webot) {

var memcached = require('../lib/memcached');
var latestUsers = new memcached.MemObj('wx_latest_users');

var async = require('async');

webot.afterReply(function save_latest(info, next) {
  if (info.text) {
    info.session.prev_text = info.text;
  }

  var uid = info.uid;

  latestUsers.get('ids', function(err, ids) {
    ids = ids || [];

    if (ids.indexOf(uid) != -1) {
      ids.splice(ids.indexOf(uid), 1);
    }
    ids.push(uid);
    ids = ids.slice(-50);

    console.log(ids);

    latestUsers.set('ids', ids, function(err) {
      next();
    });
  });
});

var session_obj = new memcached.MemObj('wx_session');

app.get('/admin/latest', function(req, res, next) {
  latestUsers.get('ids', function(err, ids) {
    async.map(ids || [], function(uid, next) {
      session_obj.get(uid, function(err, res) {
        if (res) {
          res.id = uid;
          delete res.cookie;
        }
        next(err, res);
      });
    }, function(err, sessions) {
      res.render('latest', {
        pagename: 'latest',
        sessions: sessions,
      });
    });
  });
});


};
