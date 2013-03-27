module.exports = {
  port: 3000,
  hostname: '127.0.0.1',
  douban: {
    apikey: '004bd0da70f50d1000e3728f52df2730'
  },
  memcached: {
    hosts: '127.0.0.1:11211',
    options: {
      retries: 2
    }
  },
  users: {
    admin: {
      passwd: 'admin'
    }
  },
  amap: '5d43370486bad3aeb0c89642b3836438',
  mixpanel: 'keyboardcat',
  weixin: 'keyboardcat123'
};
var environ = process.env.NODE_ENV || 'development';
try {
  var localConf = require('./' + environ);
  for (var i in localConf) {
    module.exports[i] = localConf[i];
  }
} catch (e) {}
