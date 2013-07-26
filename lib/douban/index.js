var extend = require('../utils').extend;
module.exports = extend({
  event: require('./event'),
}, require('./oauth'));
