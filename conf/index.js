module.exports = {
  port: 3000,
  hostname: '127.0.0.1',
  douban: {
    key: '',
    secret: ''
  },
  douban_more: [],
  redis: {
    prefix: 'wx_event:'
  },
  mongo: {
    host: '127.0.0.1',
    port: '27017',
    dbname: 'weixin-event',
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

if (process.env.BAE_ENV_ADDR_MONGO_IP) {
  environ = 'bae';
}

try {
  var localConf = require('./' + environ);
  for (var i in localConf) {
    module.exports[i] = localConf[i];
  }
} catch (e) {}
