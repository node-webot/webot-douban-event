module.exports = function(app, webot) {

  ['admin', 'auth'].forEach(function(item) {
    require('./' + item)(app, webot);
  });

  app.get('help/drama', function(req, res, next) {
    res.render('help/drama');
  });

};
