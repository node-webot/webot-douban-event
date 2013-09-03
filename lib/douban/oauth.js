var api = require('douban-api');
var conf = require(process.cwd() + '/conf');

var mores = conf.douban_more || [ conf.douban ];

var i_tick = 0;
var n_mores = mores.length;
var n_main = 3;

function oauth2_item(item) {
  var is_specified = !!item;
  if (!item) {
    item = mores[i_tick]; 
    i_tick++;
    if (i_tick >= n_mores) i_tick = 0;
  }
  var ret = api(item.key, item.secret);
  var req_delay = get_req_delay(item.limit);
  if (is_specified) {
    req_delay = req_delay * n_main;
  } else {
    req_delay = req_delay / n_mores;
  }
  ret.req_delay = req_delay;
  return ret;
}

function get_req_delay(limit) {
  return 60000 / (limit || 10);
}


module.exports.n_main = n_main;
module.exports.n_mores = n_mores;

module.exports.main_req_delay = get_req_delay(conf.douban.limit);

module.exports.api = function() {
  return oauth2_item(conf.douban);
};
module.exports.api_more = function() {
  return oauth2_item();
};
