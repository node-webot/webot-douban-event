module.exports = function(app, webot) {

var async = require('async');
var User = require('../../model/user');

app.get('/admin/people', function(req, res, next) {
  var query = {};
  if (req.query.lottery) {
    query.active_lottery = req.query.lottery;
  }
  async.parallel([
    function(callback) {
      User.count(query, callback);
    },
    function(callback) {
      User.find(query, {
        sort: {
          'access_token': -1,
          'active_lottery': -1
        },
        limit:  2000
      }, callback);
    },
  ], function(err, result) {
    total = result[0];
    people = result[1];
    res.render('people', {
      pagename: 'people',
      total: total,
      people: people
    });
  });
});

app.post('/admin/people', function(req, res, next) {
  var silented = req.body.silented.split('\n');
  User.set_silented(silented, function() {
    res.redirect('/admin/people');
  });
});

};
