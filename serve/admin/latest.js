module.exports = function(app, webot) {

var User = require('../../model/user');
var async = require('async');

webot.afterReply(function save_latest(info, next) {
  if (info.text) {
    info.user.update({
      prev_text: info.text
    }, function() {
      next();
    });
  } else {
    next();
  }
});

app.get('/admin/latest', function(req, res, next) {
  User.find(null, {
    sort: {
      mtime: -1
    }
  }, function(err, users) {
    res.render('latest', {
      pagename: 'latest',
      people: users,
    });
  });
});


};
