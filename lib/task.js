/*
* task pools
*/
var debug = require('debug');
var log = debug('dbj:pool:info');
var error = debug('dbj:pool:error');

var gpool = require('generic-pool');

var douban = require('./douban/oauth');

// http(s) request pool
var api_pool = gpool.Pool({
  name: 'api',
  create: function(callback) {
    callback(null, douban.api());
  },
  destroy: function() { },
  // 主请求池允许开多个 client ，防止单个请求挂起时影响后续所有请求
  max: douban.n_main,
  //min: 5,
  priorityRange: 6,
  //log: conf.debug ? log : false
});

// random request for public apis
var api_pool2 = gpool.Pool({
  name: 'api',
  create: function(callback) {
    var oauth2 = douban.api_more();
    callback(null, oauth2.clientFromToken(null));
  },
  destroy: function() { },
  max: douban.n_mores,
  //min: 5,
  priorityRange: 6,
  //log: conf.debug ? log : false
});

var computings = { n: 0 };
var compute_pool = gpool.Pool({
  name: 'compute',
  create: function(callback) {
    computings.n++;
    callback(null, computings);
  },
  destroy: function() { computings.n--; },
  max: 2,
  priorityRange: 6,
});

function queue(pool, default_priority) {
  return function(fn, priority) {
    pool.acquire(function(err, client) {
      // `fn` defination is like `fn(db, next)`;
      if (fn.length === 2) {
        //log('async calling job');
        fn(client, function(err) {
          if (err) error('async job:\n%s\nfailed because:\n%s', job.toString(), err);
          // release the client after job done
          pool.release(client);
        });
      } else {
        fn(client);
        pool.release(client);
      }
    }, typeof priority === 'undefined' ? default_priority : priority);
  }
}

var api = queue(api_pool, 3); // default priority is 3

module.exports = {
  api_pool: api_pool,
  api_pool2: api_pool2,
  compute_pool: compute_pool,
  compute: queue(compute_pool),
  api: api,
  user_api: function(user, fn) {
    api(function(oauth2) {
      var client = oauth2.clientFromToken(user.access_token, user._id);
      client.on('refreshed', function(new_token) {
        user.update({ access_token: new_token });
      });
      fn(client);
    });
  },
  api2: queue(api_pool2, 3),
  API_REQ_DELAY: douban.main_req_delay,
  API_REQ_PERPAGE: 100,
  queue: queue
};
