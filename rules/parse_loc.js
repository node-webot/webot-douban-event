var pwd = process.cwd();
var user = require(pwd + '/model/user');

var parser = require(pwd + '/lib/parser');

var cmds = ['search|搜索|\\bs\\b', 'stop_search|别闹了'];

module.exports = {
  'handler': function(info, next) {
    var _text = info.text;

    if (!_text) return next();

    // parse command
    var lead = _text.split(/\s+/)[0];
    for (var i = 0, l = cmds.length; i < l; i++) {
      if (lead.search(cmds[i]) === 0) {
        info.cmd = _text.cmd = cmds[i].split('|')[0];
      }
    }

    info.param = parser.listParam(info.text);
    info.param._text = _text;

    var uid = info.param.uid = info.from;
    var u = info.u = user(uid);

    var loc = info.param['loc'];
    if (loc) {
      info._ori_loc = loc;
      u.setLoc(loc);
      next();
    } else {
      u.getLoc(function(err, loc) {
        if (loc) {
          info.param['loc'] = loc;
        }
        next();
      });
    }
  },
};
