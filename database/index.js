var debug = require('debug');
var log = debug('weixin:database');


// unique key index option
var index_options = {
  unique: true,
  background: true,
  dropDups: true,
  w: 1
};
var sparse_option = {
  sparse: 1,
  background: true,
};

module.exports = function(db, next) {
  db.collection('user', function(err, r) {
    log('ensuring database "users"...');
    var n = 1;
    function _tick(err, r) {
      n--;
      if (err) console.error(err);
      if (n <= 0) tick();
    }
    r.ensureIndex({ 'loc': 1 }, sparse_option, _tick); 
  });

  var n = 1;
  function tick() {
    n--;
    if (n === 0) next(null, db);
  }
};
