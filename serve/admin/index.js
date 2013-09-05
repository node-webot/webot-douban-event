module.exports = function(app, webot) {

var express = require('express');
var conf = require('../../conf');
var users = conf.users;

app.use('/admin/', express.basicAuth(function(user, pass) {
  return user in users && users[user].passwd === pass;
}));

app.locals({
  main_menu: [{
    name: 'home',
    title: '首页'
  }, {
    name: 'routes',
    title: '规则'
  }, {
    //name: 'waits',
    //title: '等待'
  //}, {
    name: 'people',
    title: '人'
  }, {
    name: 'latest',
    title: '最近'
  }]
});

app.get('/admin/', function(req, res, next) {
  return res.redirect('/admin/home');
});
app.get('/admin/home', function(req, res, next) {
  return res.render('panel', {
    pagename: 'home',
    n_rules: webot.routes.length,
    n_wait_rules: Object.keys(webot.waits).length,
  });
});

app.get('/admin/routes', function(req, res, next) {
  return res.render('routes', {
    pagename: 'routes',
    routes: webot.routes,
  });
});


['latest', 'people'].forEach(function(item) {
  require('./' + item)(app, webot);
});

};
