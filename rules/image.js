module.exports = {
  pattern: function(info) {
    return info.is('image');
  },
  handler: function(info, next) {
    next(null, '图片很好看，可惜我暂时看不懂');
  },
};
