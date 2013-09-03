module.exports = function(app, webot) {

var debug = require('debug');
var verbose = debug('weixin:auth:verbose');
var log = debug('weixin:auth:log');
var error = debug('weixin:auth:error');

var async = require('async');
var User = require('../../model/user');
var AuthToken = require('../../model/auth');
var oauth = require('../../lib/douban/oauth');

var OAUTH_CALLBACK_URI = app._conf.site_root + 'auth/callback';

app.get('/auth/connect/:token', function(req, res, next) {
  var token = req.params.token;

  // save token to session
  req.session.auth_token = token;

  res.redirect(oauth.api().getAuthorizeUrl({
    redirect_uri: OAUTH_CALLBACK_URI,
    response_type: 'code',
  }));
});

/**
 * oauth callback from douban
 */
app.get('/auth/callback', function(req, res, next) {
  function show_error(msg) {
    res.render('error', { 'msg': msg || '未知错误' });
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
        // while get access_token with grant code from douban in the same time
        oauth.api().getToken(req.query.code, {
          grant_type: 'authorization_code',
          redirect_uri: OAUTH_CALLBACK_URI, 
        }, callback);
      },
    ], function(err, ret) {
      if (err) return show_error('获取用户信息失败');


      log('[auth callback]: %s, %s', ret[0], JSON.stringify(ret[1]))
      User({
        _id: ret[0].user_id,
      }).update({
        $upsert: true,
        name: ret[1].douban_user_name,
        access_token: ret[1],
      }, function(err, user) {
        if (err) return show_error('保存用户信息失败');
        res.redirect('/auth/ok');
      });
    });
  }
});

app.get('/auth/ok', function(req, res, next) {
  res.render('auth/ok');
});


};

