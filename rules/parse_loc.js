var pwd = process.cwd();

var parser = require(pwd + '/lib/parser');

module.exports = {
  'handler': function(info, next) {
    info.param = parser.listParam(info.text);

    var uid = info.param.uid = info.from;
    var u = info.user;

    var loc = info.param['loc'];
    if (loc) {
      info._ori_loc = loc;
      u.update({ loc: loc }, function() {
        next();
      });
    } else {
      info.param['loc'] = u.loc;
      next();
    }
  },
};
