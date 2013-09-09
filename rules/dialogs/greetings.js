function pad(n) {
  if (n === 0) return 24;
  if (n < 10) n = '0' + n;
  return n;
}

var greetings = [];
greetings.push([
  /^(早上?好?|(good )?morning)/i,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    if (h < 3) return '[嘘] 我这边还是深夜呢，别吵着大家了';
    if (h < 5) return '您起得可真早呀！';
    if (h < 7) return '早啊官人！给您请安了！\n 今天想做什么计划好了吗？';
    if (h < 9) return 'Morning, sir! 新的一天又开始了！您今天心情怎么样？';
    if (h < 12) return '这都几点了，还早啊...';
    if (h < 14) return '人家中午饭都吃过了，还早呐？';
    if (h < 19) return '如此美好的下午，是很适合出门逛逛的';
    if (h < 21) return '现在...好像...是晚上吧..';
    if (h >= 21) return '您还是早点睡吧...';
  }
]);
greetings.push([
  /^(午安|中午好|good noon)/i,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    if (h < 14 && h > 10) return '你也午安了！';
    return '我们这边好像不是中午哦..';
  }
]);
greetings.push([
  /^(下午好|(good )?afternoon)/i,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    if (h < 12) return '这太阳还在东边呢，说下午有点早吧...';
    if (h > 18) return '现在，应该是问“晚上好”了吧？...您老师没教你么？';
    return '[太阳]你好呀，今天心情怎么样？';
  }
]);
greetings.push([
  /^(晚上好|(good )?evening)/i,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    if (h < 4) return '现在已经很晚了，您怎么还不睡呢？经常熬夜对身体不好呢';
    if (h < 10) return '这大清早的……你不在东八区么？';
    if (h < 17) return '这不还没到晚上吗？';
    if (h > 20) return '差不多该洗洗睡了哟！早睡有益身体健康';
    return '您也好！要不今晚上去看点戏吧？';
  }
]);
greetings.push([
  /^(晚安|(good )?night)/i,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    if (h < 3) return '晚安朋友，期待明天再与你相遇...[月亮]';
    if (h < 6) return '您睡得实在太晚啦！赶快抓紧时间休息吧！';
    if (h < 10) return '这大清早的……您是折腾个什么劲儿啊？';
    if (h < 18) return '这不还没到晚上吗？';
    if (h > 20) return '好的，做个好梦。期待明天与你再见！';
    return '睡这么早好浪费时间哦……何不再看会儿书？';
  }
]);
greetings.push([
  /(现在|当前|北京)(时刻|时间|几点)|报时|几点了|^(time|时间)$/,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    var t = '现在是北京时间' + pad(h) + '点' + pad(d.getMinutes()) + '分';
    if (h < 4 || h > 22) return t + '，夜深了，早点睡吧 [月亮]';
    if (h < 6) return t + '，您还是再多睡会儿吧';
    if (h < 9) return t + '，又是一个美好的清晨呢，今天准备去哪里玩呢？';
    if (h < 12) return t + '，一日之计在于晨，今天要做的事情安排好了吗？';
    if (h < 15) return t + '，午后的冬日是否特别动人？';
    if (h < 19) return t + '，又是一个充满活力的下午！今天你的任务完成了吗？';
    if (h <= 22) return t + '，这样一个美好的夜晚，有没有去看什么演出？';
    return t;
  }
]);
greetings.push([
  /(这个?(时间|点)|这么晚)了/,
  function(info) {
    var d = new Date();
    var h = d.getHours();
    if (h < 4) return '是呀，干这活儿就是有点辛苦呢';
    if (h < 13) return '你搞笑吧，太阳都还在东边呢~';
    if (h < 18) return '不是吧，太阳都还没落山呢...';
    if (h < 20) return '现在正是一天中的黄金事件呀！';
    if (h < 23) return '开玩笑，才11点不到好么...';
    return t;
  }
]);
module.exports = greetings;
