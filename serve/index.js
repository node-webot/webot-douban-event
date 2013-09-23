module.exports = function(app, webot) {

  ['admin', 'auth'].forEach(function(item) {
    require('./' + item)(app, webot);
  });

};
