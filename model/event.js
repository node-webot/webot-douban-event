var utils = require('../lib/utils');
var extend = utils.extend;


function LocEvent(info) {
  if (!(this instanceof LocEvent)) {
    return new LocEvent(info);
  }
  var self = this;

  extend(self, info);
}

LocEvent.prototype.link = function() {
  return this.title.link("http://www.douban.com/event/" + this._id + "/");
}

LocEvent.prototype.toJSON = function() {
  return {
    _id: this._id,
    title: this.title
  };
};

LocEvent.loads = function(items) {
  return items.map(function(item, i) {
    return new LocEvent(item);
  });
};

module.exports = LocEvent;


