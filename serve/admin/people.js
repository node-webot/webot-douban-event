module.exports = function(app, webot) {

var User = require('../../model/user');

app.get('/admin/people', function(req, res, next) {
  User.get_silented(function(err, r) {
    r = r || []
    res.render('people', {
      pagename: 'people',
      silented: r
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
