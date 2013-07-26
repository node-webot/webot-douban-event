module.exports = function(app, webot) {

var async = require('async');
var User = require('../../model/user');
var AuthToken = require('../../model/auth');
var oauth = require('../../lib/douban/oauth');

var OAUTH_CALLBACK_URI = app._conf.site_root + '/auth/callback';

app.get('/auth/connect/:token', function(req, res, next) {
  var token = res.params.token;

  // save session to token
  req.session.auth_token = token;

  res.redirect(oauth().getAuthorizeUrl({
    redirect_uri: OAUTH_CALLBACK_URI,
    response_type: 'code',
  }));
});

app.get('/auth/callback', function(req, res, next) {

  function show_error(msg) {
    res.render('/error', { 'msg': msg || '未知错误' });
  }

  if (req.query.error) {
    return show_error('授权失败');
  }

  if (req.query.code) {
    async.parallel([
      function(callback) {
        // figure out real user_id from session's auth_token
        AuthToken.get(req.session.auth_token, callback);
      },
      function(callback) {
        // get access_token with grant code from douban
        oauth().getToken(req.query.code, {
          redirect_uri: OAUTH_CALLBACK_URI, 
        }, callback);
      },
    ], function(err, ret) {
      if (err) return show_error('获取用户信息失败');
      User({
        _id: ret[0].user_id,
      }).update({
        $upsert: true,
        access_token: ret[1],
      }, function(err, user) {
        if (err) return show_error('保存用户信息失败');
        res.render('/auth/ok');
      });
    });
  }

  return res.send(400);
});


};

