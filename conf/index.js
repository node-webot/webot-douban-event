module.exports = {
  port: 3000,
  hostname: '127.0.0.1',
  douban: {
    apikey: ''
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
  site_root: 'http://127.0.0.1:3000/',
  salt: 'hirobot',
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
