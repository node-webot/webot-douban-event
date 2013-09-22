module.exports = function (webot) {


webot.afterReply(function reply_output(info, next) {
  // item.geo means this is a event list reply
  if (Array.isArray(info.reply) && info.reply.length && info.reply[0].geo) {
    info.reply = info.reply.map(event_list_mapping);
    if (info.has_more) {
      info.reply.push({
        title: '回复 more 查看更多，回复活动序号对活动进行操作',
        picUrl: '',
        url: 'http://www.douban.com/location/',
      });
    }
  }
  next();
});


function event_list_mapping(item, i) {
  return {
    title: (i+1) + '. ' + item.title,
    picUrl: item.image_lmobile || '',
    url: item.adapt_url && item.adapt_url.replace('adapt', 'partner') || '',
    description: item.owner && eventDesc(item),
  };
}

function eventDesc(item) {
  return item.owner.name + ' / ' +
    (item.participant_count + item.wisher_count) + '人关注 / ' + item.address;
}


};
