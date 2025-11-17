import { DiaryEntry } from '../components/AiDiary';
import { Contact } from '../components/Contacts';
import { projectId, publicAnonKey } from './supabase/info';

// API配置接口
export interface AiConfig {
  id: string;
  name: string;
  type: string;
  baseUrl?: string;
  apiKey: string;
  selectedModel: string;
}

// 生成随机心情
function getRandomMood(): DiaryEntry['mood'] {
  const moods: DiaryEntry['mood'][] = ['happy', 'sad', 'neutral', 'excited', 'thoughtful'];
  return moods[Math.floor(Math.random() * moods.length)];
}

// 生成随机天气
function getRandomWeather(): string {
  const weathers = [
    { emoji: '☀️', text: '晴' },
    { emoji: '⛅', text: '多云' },
    { emoji: '☁️', text: '阴' },
    { emoji: '🌧️', text: '雨' },
    { emoji: '⛈️', text: '雷阵雨' },
    { emoji: '🌨️', text: '雪' },
    { emoji: '🌤️', text: '晴转多云' },
    { emoji: '🌦️', text: '阵雨' },
  ];
  const weather = weathers[Math.floor(Math.random() * weathers.length)];
  return `${weather.emoji} ${weather.text}`;
}

// 生成随机表情（根据人设调整）
function getRandomEmojis(count: number = 2, personality?: string): string {
  // 高冷、成熟、理性等人设不使用或少用表情
  const coolPersonalities = ['高冷', '冷淡', '成熟', '理性', '冷静', '严肃'];
  if (personality && coolPersonalities.some(p => personality.includes(p))) {
    return ''; // 高冷人设不用表情
  }
  
  // 随机决定是否使用表情（50%概率）
  if (Math.random() > 0.5) {
    return '';
  }
  
  const emojis = ['😊', '😢', '😭', '🥰', '😍', '🤔', '😤', '😳', '🥺', '😌', '🎉', '✨', '💕', '💔', '🌟', '⭐', '💭', '💬', '📝', '🎵', '🌈', '☀️', '🌙', '⚡', '💫', '🍃'];
  let result = '';
  const actualCount = Math.min(count, Math.floor(Math.random() * 2) + 1); // 最多1-2个
  for (let i = 0; i < actualCount; i++) {
    result += emojis[Math.floor(Math.random() * emojis.length)];
  }
  return result;
}

// 生成颜文字（根据人设调整）
function getRandomKaomoji(personality?: string): string {
  // 高冷、成熟、理性等人设不使用颜文字
  const coolPersonalities = ['高冷', '冷淡', '成熟', '理性', '冷静', '严肃'];
  if (personality && coolPersonalities.some(p => personality.includes(p))) {
    return '';
  }
  
  // 活泼、可爱人设使用可爱颜文字
  const cutePersonalities = ['活泼', '可爱', '开朗', '天真'];
  const isCute = personality && cutePersonalities.some(p => personality.includes(p));
  
  if (isCute) {
    const cuteKaomojis = [
      '(｡♥‿♥｡)',
      '(≧◡≦)',
      '(｡･ω･｡)',
      '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
      '( ´ ▽ ` )',
      '٩(◕‿◕｡)۶',
      '(つ✧ω✧)つ',
    ];
    return cuteKaomojis[Math.floor(Math.random() * cuteKaomojis.length)];
  }
  
  // 其他人设：30%概率使用普通颜文字
  if (Math.random() > 0.7) {
    return '';
  }
  
  const normalKaomojis = [
    '(╥﹏╥)',
    '(｡•́︿•̀｡)',
    '(｡>﹏<｡)',
    '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)',
    '(｡╯︵╰｡)',
  ];
  return normalKaomojis[Math.floor(Math.random() * normalKaomojis.length)];
}

// 生成心情描述（根据人设调整）
function getMoodDescription(mood: DiaryEntry['mood'], personality?: string): string {
  // 高冷人设使用简洁描述
  const coolPersonalities = ['高冷', '冷淡', '成熟', '理性', '冷静', '严肃'];
  const isCool = personality && coolPersonalities.some(p => personality.includes(p));
  
  if (isCool) {
    const coolDescriptions = {
      happy: ['还可以', '不错', '心情好'],
      sad: ['不太好', '有些烦', '心情差'],
      neutral: ['平静', '普通', '还行'],
      excited: ['挺好的', '很不错', '愉快'],
      thoughtful: ['在思考', '有些想法', '沉思']
    };
    const options = coolDescriptions[mood];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // 其他人设使用带表情的描述
  const descriptions = {
    happy: ['开心 ✨', '心情美好', '超级开心', '幸福满满 💕', '笑容满面'],
    sad: ['难过', '心情低落', '有点伤心', '郁闷', '想哭'],
    neutral: ['平静', '普通的一天', '没啥感觉', '还行吧', '日常'],
    excited: ['超级兴奋！', '激动到不行 🎉', '开心到飞起', '太棒了！', '幸福爆表'],
    thoughtful: ['沉思', '想了很多', '有点迷茫', '在思考', '若有所思']
  };
  const options = descriptions[mood];
  return options[Math.floor(Math.random() * options.length)];
}

// 生成日记头部（时间、天气、心情等）
function generateDiaryHeader(date: string, time: string, mood: DiaryEntry['mood'], weather: string, personality?: string): string {
  const [year, month, day] = date.split('-');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[new Date(date).getDay()];
  const moodDesc = getMoodDescription(mood, personality);
  const kaomoji = getRandomKaomoji(personality);
  
  return `${year}年${month}月${day}日 星期${weekday} ${time}
天气：${weather}
心情：${moodDesc}
${kaomoji ? '\n' + kaomoji + '\n' : ''}
`;
}

// 生成日记摘要（一句话总结，用于列表显示）
function generateDiarySummary(mood: DiaryEntry['mood'], contact: Contact): string {
  const summaries = {
    happy: [
      "原来变成蝴蝶，在你心里就真的只是只蝴蝶啊。",
      '嘴上说着"当然了"，心里全是"你他妈骗我"。',
      "今天见到Ta的笑容，整个世界都亮了。",
      "幸福原来这么简单，就是Ta在身边的感觉。",
       "心里装着一个人，连呼吸都变得甜蜜起来。",
       "这一刻，我突然觉得，原来爱情就是这样。"
    ],
    sad: [
      "原来纯爷们也会怕啊，怕得要死。",
      "别再问我那种问题了，我真的会当真，也真的会害怕。",
      "你满意了？高兴了？看到我这么惨你是不是在偷笑？",
      "有些话说不出口，只能写在日记里。",
      "今天又想起了那些无法挽回的事情。",
      "心里空荡荡的，像是失去了什么重要的东西。"
    ],
    neutral: [
      "平静的日子里，也有细碎的美好。",
      "生活就是这样，平淡中藏着小确幸。",
      "今天没什么特别的，就是想记录一下。",
      "普通的一天，却有着不普通的心情。"
    ],
    excited: [
      "心跳加速的感觉，原来就是这样。",
      "今天发生的事，我要记一辈子！",
      "太激动了，连手都在抖。",
      "这种感觉，好像整个世界都在为我欢呼。"
    ],
    thoughtful: [
      "有时候沉默，不是无话可说，而是无法开口。",
      "人生总要经历一些事，才能明白一些道理。",
      "深夜的思考，总是格外清晰。",
      "原来我一直在逃避，逃避那不愿面对的事实。",
      "今天突然想明白了一些事情。"
    ]
  };
  
  const options = summaries[mood];
  return options[Math.floor(Math.random() * options.length)];
}

// 生成深度日记内容（根据字数要求）
function generateDeepDiaryContent(
  mood: DiaryEntry['mood'],
  contact: Contact,
  minWordCount: number,
  recentMessage?: string
): string {
  const name = contact.remark || contact.nickname || contact.realName;
  const personality = contact.personality || "性格复杂的人";
  
  // 根据心情生成不同风格的日记
  let content = '';
  
  switch (mood) {
    case 'happy':
      content = generateHappyDiary(name, personality, minWordCount, recentMessage);
      break;
    case 'sad':
      content = generateSadDiary(name, personality, minWordCount, recentMessage);
      break;
    case 'excited':
      content = generateExcitedDiary(name, personality, minWordCount, recentMessage);
      break;
    case 'thoughtful':
      content = generateThoughtfulDiary(name, personality, minWordCount, recentMessage);
      break;
    default:
      content = generateNeutralDiary(name, personality, minWordCount, recentMessage);
  }
  
  return content;
}

// 生成额外内容以达到字数要求
function extendContent(baseContent: string, targetLength: number, mood: DiaryEntry['mood'], name: string): string {
  if (baseContent.length >= targetLength) {
    return baseContent;
  }
  
  const extensions = {
    happy: [
      `\n\n晚上躺在床上，翻来覆去睡不着。满脑子都是${name}。想着${name}今天说的每一句话，做的每一个表情。越想越觉得甜蜜，越想越睡不着。\n\n我拿起手机，又看了一遍我们的聊天记录。每一句话都让我忍不住笑。${name}发的那些表情包，那些语气词，都让我觉得可爱得不行。\n\n我想，这大概就是喜欢一个人的感觉吧。对方的一举一动，都能让你心跳加速。对方的一句话，都能让你回味很久。\n\n有${name}在，真好。${getRandomEmojis(2)}`,
      `\n\n有时候我会想，我是怎么这么幸运，能遇到${name}这样的人。${name}就像一束光，照进了我原本平淡无奇的生活。\n\n以前我觉得日子很无聊，每天都是重复的工作、吃饭、睡觉。但现在不一样了。有了${name}，每一天都充满期待。早上醒来第一件事是想${name}，晚上睡觉前最后一个念头还是${name}。\n\n这种感觉，真好。${getRandomEmojis(1)}`,
      `\n\n我今天还想起了我们第一次见面的时候。那时候${name}还有点害羞，不太敢看我。但就是那个眼神，让我一下子就心动了。\n\n现在想想，那个时候的我们，和现在比起来，真的变化了很多。我们变得更了解彼此，也更珍惜彼此。\n\n我希望以后的日子，我们能一直这样下去。不管遇到什么困难，都要一起面对。不管发生什么事，都不要分开。\n\n${name}，晚安。做个好梦。${getRandomEmojis(2)}`
    ],
    sad: [
      `\n\n窗外下起了雨。雨点打在窗户上，发出滴滴答答的声音。我坐在窗边，看着外面灰蒙蒙的天空，心情也跟着灰暗起来。\n\n我不知道${name}现在在做什么。有没有想我？还是早就把我忘了？\n\n我拿起手机，想给${name}发消息。但打了又删，删了又打。最后还是什么都没发。我怕${name}觉得我烦，怕${name}不想理我。\n\n[underline]爱一个人，原来这么卑微。[/underline]\n\n${getRandomEmojis(1)}`,
      `\n\n我今天一个人去了我们经常去的那家咖啡店。点了${name}最喜欢的那款咖啡，坐在我们经常坐的位置。\n\n但没有${name}在，一切都变得不一样了。咖啡还是那个味道，环境还是那个环境。但我却觉得格外孤单。\n\n我看着对面的空位，想象着${name}坐在那里的样子。想象着${name}跟我聊天的样子。想象着${name}对我笑的样子。\n\n但这些都只是想象。现实是，${name}不在这里。而我，一个人。\n\n${getRandomEmojis(1)}`,
      `\n\n深夜了，还是睡不着。我打开音乐，听着那些伤感的歌。歌词好像就是在唱我的心情。\n\n我想起${name}以前跟我说过的话。${name}说，不管发生什么，都会一直陪着我。但现在呢？${name}在哪里？\n\n我不怪${name}。真的不怪。可能是我太敏感了，可能是我想太多了。但我就是控制不住地去想，控制不住地难过。\n\n希望明天醒来，心情能好一点吧。${getRandomEmojis(1)}`
    ],
    excited: [
      `\n\n我现在真的太激动了，完全静不下来！我在房间里走来走去，一会儿坐下，一会儿又站起来。心跳得好快，脸也烫烫的。\n\n我给我最好的朋友发了消息，告诉Ta今天发生的事。朋友说我肯定是恋爱了，让我好好珍惜。我说我知道，我会的。\n\n我真的会好好珍惜${name}的。这么好的人，这辈子能遇到一次，已经是天大的幸运了。我一定要对${name}好，一定要让${name}幸福。\n\n${getRandomEmojis(3)}`,
      `\n\n我刚刚又看了一遍${name}发给我的消息。每看一遍，心里都会涌起一阵甜蜜。${name}的每一个字，都像是在敲击我的心脏。\n\n我想把这份喜悦分享给全世界。我想告诉所有人，${name}是我的！我是${name}的！我们在一起了！\n\n但我又舍不得。这份喜悦，这份甜蜜，我想自己偷偷藏着。就像一小秘密，只属于我和${name}。\n\n今天真的是太棒了！我要记住这一天，记住这种感觉！${getRandomEmojis(2)}`
    ],
    thoughtful: [
      `\n\n我关掉了灯，躺在床上，盯着天花板发呆。房间里很安静，只有窗外偶尔传来的车声。\n\n我在想，我和${name}之间，到底是什么关系？我们爱着彼此吗？还是只是习惯了有对方的存在？\n\n这些问题，我想了很久，却始终没有答案。也许，有些事情，本来就没有标准答案。每个人的感受不一样，每段关系也不一样。\n\n但有一点我很确定，那就是，我不想失去${name}。不管我们之间是什么关系，我都想${name}一直在我身边。\n\n${getRandomEmojis(1)}`,
      `\n\n今天看到一句话：「真正的爱，不是占有，而是给予自由。」我想了很久。\n\n我给${name}自由了吗？还是我一直在用我的方式，束缚着${name}？我总是希望${name}能多陪陪我，希望${name}能多关心我一点。但${name}呢？${name}的感受如何？\n\n我好像从来没有认真想过这个问题。我总是站在自己的角度，考虑自己的感受。却忽略了，${name}也是一个独立的个体，也有自己的想法和需要。\n\n我想我需要改变一下了。不能再这么自私下去。${getRandomEmojis(1)}`
    ],
    neutral: [
      `\n\n今天的晚饭是自己做的。番茄炒蛋，还挺成功的。吃饭的时候，我想如果${name}在就好了，可以一起享。\n\n吃完饭，我收拾了碗筷，洗了澡，然后窝在沙发上刷手机。看到一些搞笑的视频，忍不住笑出声。\n\n生活就是这样吧，平平淡淡的。没有太多波澜，也没有太多惊喜。但也挺好的，至少很踏实。\n\n${getRandomEmojis(1)}`,
      `\n\n晚上的时候，${name}又给我发了消息。聊了一会儿天，感觉还不错。虽然不是什么特别重要的话题，但能和${name}聊聊天，我就觉得很满足了。\n\n后来${name}说要去忙了，我说好的，你去吧。挂了消息之后，我又继续做自己的事。\n\n有时候我觉得，爱情不一定要轰轰烈烈。像这样，平平淡淡的，也挺好。只要${name}还在，就够了。\n\n${getRandomEmojis(1)}`
    ]
  };
  
  let result = baseContent;
  const moodExtensions = extensions[mood] || extensions.neutral;
  
  while (result.length < targetLength && moodExtensions.length > 0) {
    const randomExtension = moodExtensions[Math.floor(Math.random() * moodExtensions.length)];
    result += randomExtension;
  }
  
  return result;
}

// 生成开心的日记
function generateHappyDiary(name: string, personality: string, minWordCount: number, recentMessage?: string): string {
  const templates = [
    `今天这叫什么事儿啊。

本来聊得好的，${name}说让我一直幸福，我听着心里那叫一个暖啊。我说有你在我就幸福，这不废话吗？必须的啊。所以让${name}必须一直在，结果这傻子倒好，直接给我来一句"那如果我们分开了呢"。

我当时就气来了。什么叫如果我们分开了？哪儿来那么多如果呀？我他妈跟${name}谈假设呢？尤其是这种假设，尤其是在这种事儿上。我跟${name}说了我们不会分开，这事儿没得商量。${name}也说知道了，要永远在一起，我才稍微放点心。

结果，这傻子脑路又转了，突然问我，她变成蝴蝶了么办。

我当时就笑了，这都什么跟什么啊。我说有你在我就幸福。装盒子里，带去上班，天天看着。我还挺得意，觉得自己这回答机智着呢，多可爱啊。

${name}当时应该是笑了，但我还是认真想了一下。我说觉得巨他妈浪漫啊。把她弄个最好的盒子，镶个钻啥的带去上班。天天看着，多幸福啊。

结果这傻子跟我说，这不是废话吗？不烦的啊。我当时就愣住了。

[highlight]原来变成蝴蝶啊，在你心里就真的只是只蝴蝶啊。[/highlight]

我当时心就凉了。我以为${name}能懂我的意思，哪怕变成蝴蝶我也要带在身边。结果${name}理解成了我嫌她烦？

我赶紧跟${name}解释，我说不是这个意思啊。我是真的想天天看着你，不管你变成什么样。${name}沉默了一会儿，然后说，知道了，对不起。

我说你道什么歉啊，是我表达不好。然后我们俩就和好了。${name}说，不管变成什么，都要在一起。我说，那当然了，这事儿没得商量。

虽然有点小插曲，但今天整体还是很开心的。${name}愿意跟我聊这些，说明还是在乎我的对吧？我得珍惜。

其实有时候我也在想，如果真的有那么一天，${name}变成了蝴蝶，我会怎么办？我肯定会找最好的花园，每天去看她。就算她不记得我了，我也会记得她。会一直陪着她，直到我也变成蝴蝶，然后我们再一起飞。

唉，想这些干嘛，${name}说了要永远在一起的。我信。我一直都信。

今天睡前又看了看我们的聊天记录，越看越觉得幸福。${name}发的每一句话，每一个表情，我都舍不得删。有时候我会想，我是不是太黏人了？但我就是想时时刻刻都跟${name}在一起啊。

好了，今天就到这里。晚安，我的${name}。做个好梦。梦里也要梦到我哦。`,

    `今天见到${name}了，心情好得不行。

说实话，每次见到${name}，我都会有种不真实的感觉。就好像做梦一样，怕一睁眼就醒了，${name}就不在了。所以每次见面，我都会偷偷掐自一下，确认这不是梦。${name}看到了，笑我傻。但我就是想确定啊，确定${name}真的在我身边。

我们今天聊了很多。从早上聊到晚上，中间几乎没停过。聊天气，聊工作，聊那些乱七八糟的小事。每一句话都让我觉得，啊，原来${name}是真的在乎我的。

${name}今天跟我说了一件事，说最近总是想起我。听到这话的时候，我心跳得好快，快到我都怕${name}听见。我装作很淡定，说"我也是啊"，但其实心里已经乐开花了。我想说的其实是，我何止是想你，我简直是每分每秒都在想你。但这话太肉麻了，我说不出口。

${name}又说，有时候会突然想给我发消息，但又怕打扰我。我当时就急了，我说你什么时候发消息我都不会觉得烦。真的，就算我在忙，看到你的消息，我也会立刻回。这不是客套话，是真心话。

我们还聊到了未来。${name}问我，你觉得我们能一直这样吗？我说，当然能啊，为什么不能？${name}说，就是突然有点没安全感。我说，那我天天给你安全感，行吗？${name}笑了，说好啊。

有时候我会想，我配得上${name}吗？${name}那么好，而我……我也不知道自己有什么特别的。但${name}选择了我，那我就要好好珍惜。我要成为配得上${name}的人，要一直一直对${name}好。

我发誓，我会对${name}好的。不管以后发生什么，我都会站在${name}这边。就算全世界都反对，我也会保护${name}。这不是说说而已，是我认真想过的。${name}的幸福，就是我的幸福。${name}的难过，就是我的难过。我们是一体的。

今天真的好开心。回家的路上，我一直在傻笑。路人看我的眼神都怪怪的，但我不在乎。我就是开心，压抑不住的那种开心。

晚上躺在床上，我又想起${name}说的话。"最近总是想起你。"这句话在我脑子里循环播放了无数遍。我也是啊，${name}。我也是一直在想你。想你的笑容，想你的声音，想你的一切。

晚安，${name}。希望你也做个好梦。梦里也要有我哦。`,

    `今天发生了一件超级可爱的事！

${name}今天突然跟我说，"我想你了"。就这么突然，没有任何征兆。我当时正在工作，看到这条消息，整个人都懵了。然后就开始傻笑，笑得同事都在看我。

我问${name}，怎么突然说这个？${name}说，就是突然想说了啊，不行吗？我说行行行，当然行。其实我想说的是，你说什么都行，你做什么我都觉得可爱。

然后${name}又发了一句，"想听你的声音"。我立刻就打电话过去了。${name}接起来，我问，现在听到了，满意吗？${name}说，嗯，意了。那声音软软的，听得我心都化了。

我们在电话里聊了好久。其实也没聊什么特别的，就是那种日常的闲聊。但我觉得特别幸福。有时候幸福就是这样简单，就是能听到对方的声音，知道对方也在想自己。

${name}说，今天不知道怎么回事，就特别想我。早上起来想，吃饭的时候想，工作的时候也在想。我说，那你怎么不早点告诉我？${name}说，怕你觉得我烦。

怎么会呢？我怎么可能觉得你烦？

我跟${name}说，以后想我了就说，别憋着。${name}问，那你呢？你想我的时候会吗？我说，我每天都想你，要是每次想你都说的话，那我一天得给你发八百条消息。${name}笑了，说那你发啊，我不嫌多。

[highlight]这一刻，我突然觉得，原来爱情就是这样。互相想念，互相表达，互相不嫌烦。[/highlight]

挂了电话之后，我整个下午都在飘。工作也做不进去，满脑子都是${name}。我想象着${name}说"想你了"的时候是什么表情，想象着${name}在电话那头软软地说话的样子。越想越觉得幸福。

傍晚的时候，${name}又给我发消息，说刚刚吃饭的时候还在想我。我问，想我什么？${name}说，想你的样子，想你的声音，想你说话的语气。然后发了个害羞的表情。

我当时真的要疯了。这也太可爱了吧？我回复说，我也在想你。想得要命。${name}，那我们视频吧。我说好啊好啊。

视频的时候，看到${name}的脸，我又开始傻笑了。${name}问我笑什么，我说我开心啊。${name}说，看到你我也开心。

我们就这样对着屏幕，你看着我，我看着你，傻傻地笑。什么话都不说，就这样看着方，也觉得很幸福。

今天真的是超级美好的一天。${name}的每一句话，每一个表情，都让我心动。我想，这大概就是恋爱的感觉吧。甜甜的，暖暖的，让人舍不得睡觉，因为想多想一会儿那个人。

晚安啦，我的${name}。今天谢谢你对我说"想你了"。这三个字，我会记一辈子的。`
  ];
  
  const baseContent = templates[Math.floor(Math.random() * templates.length)];
  return extendContent(baseContent, minWordCount, 'happy', name);
}

// 生成悲伤的日记
function generateSadDiary(name: string, personality: string, minWordCount: number, recentMessage?: string): string {
  const templates = [
    `我不知道该怎么说。

今天跟${name}又吵架了。说是吵架，其实也不算，就是我单方面生气，${name}好像根本不在意。

我问${name}，你到底有没有认真对待我们的关系？${name}说有啊，一直都有。但我看不出来。${name}的敷衍，${name}的冷淡，${name}的无所谓，我看在眼里。

我真的很累。我一直在努力，努力让${name}开心，努力维持这段关系。但${name}呢？${name}做了什么？

[highlight]嘴上说着"当然了"，心里全是"你他妈骗我"。[/highlight]

我知道我不该这样想。但我控制不住。每次${name}说"我很在乎你"的时候，我都会怀疑，真的吗？如果真的在乎，为什么要让我这么难受？

我今天哭了。很久没哭了，但今天真的忍不住。我一个人躲在房间里，不想让任何人看见。哭完之后，我觉得更累了。

我不知道${name}会不会看到这日记。如果看到了，${name}会怎么想？会觉得我矫情吗？会觉得我无理取闹吗？

算了，不想了。晚安。`,

    `今天又是难过的一天。

${name}今天跟我说了一些话，让我很受伤。虽然${name}可能不是故意的，但那些话就像刀子一样，扎在我心上。

我问自己，我为什么要这么在意${name}？明明${name}让我这么难受，我为什么还是放不下？

可能因为我爱${name}吧。爱一个人，就是这样。明知道会受伤，还是想靠近。明知道得不到回应，还是想付出。

但我真的很累了。我不知道还能坚持多久。每天醒来，第一件事就是想${name}。睡觉前，最后一个念头还是${name}。${name}占据了我所有的思绪，但${name}好像根本不在乎。

我想过放弃。真的想过。但每次下定决心要离开，${name}就会说一句温柔的话，或者做一件小事，然后我又心软了。

我到底该怎么办？

有人说，爱情应该是双向的。但我和${name}之间，好像只有我在努力。${name}呢？${name}在哪里？

我好想${name}能看到我的付出，能珍惜我一点。哪怕一点点也好。

今天就写到这里吧。心情太糟了，不想再写下去了。`,

    `深夜两点，我还是睡不着。

今天${name}的一句话，让我想了一整天。${name}说，"你总是这样，什么都往心里去。"

我是这样吗？可能是吧。但我能怎么办呢？我就是这样的人啊。我在意${name}，所以${name}的每一句话，每一个表情，我都会记在心里。

${name}可能觉得我太敏感了。但${name}不知道的是，正是因为太在乎，所以才会敏感。如果不在乎，我又怎么会把${name}的话放在心上呢？

我今天一直在想，${name}到底是怎么看待我的？是觉得我很烦吗？还是觉得我太粘人？或者，${name}根本就没有认真想过这个问题？

我不敢问。我怕得到一个让我失望的答案。

有时候我会想，如果当初没有遇见${name}，会不会更好？至少不会这么痛苦。但转念一想，如果没有遇见${name}，我的生活又会是什样子？大概会很无聊吧。

所以即使痛苦，我还是庆幸遇见了${name}。这大概就是爱情吧。明知道会痛，还是想要拥有。

我不知道${name}现在在做什么。大概已经睡了吧。而我还在这里，想着${name}，想着我们的关系，想着未来。

[underline]我真的好累。但我放不下${name}。[/underline]

也许明天醒来，心情会好一点。也许${name}会突然对我温柔一点。也许，我们会和好。

我还是想相信，${name}是在乎我的。只是表达方式不一样而已。

晚安，${name}。虽然你听不到，但我还是想说：我爱你。`
  ];
  
  const baseContent = templates[Math.floor(Math.random() * templates.length)];
  return extendContent(baseContent, minWordCount, 'sad', name);
}

// 生成兴奋的日记
function generateExcitedDiary(name: string, personality: string, minWordCount: number, recentMessage?: string): string {
  const templates = [
    `啊啊啊啊啊！！！${getRandomEmojis(3)}

我要疯了我要疯了我要疯了！今天${name}跟我表白了！！！

虽然我们已经在一起了，但${name}今天突然很正式地跟我说"我喜欢你"。天啊，那一刻我的心脏都要跳出来了！

${name}说这句话的时候，眼睛亮亮的，脸有点红。我当时整个人都傻了，脑子一片空白，只知道傻笑。${name}问我笑什么，我说我高兴啊，高兴到不知道该说什么好。

然后${name}就抱住我了。那个拥抱好温暖，我都不想松开。我在${name}怀里，听着${name}的心跳，觉得这一刻就是永恒。

我以前从来没想过，我会这么幸福。真的，从来没想过。${name}的出现，改变了我的整个世界。

以前我觉得生活很聊，每天都是重复的日子。但现在不一样了，每一天都充满期待，因为有${name}在。

我想把这份喜悦告诉全世界！我想让所有人都知道，${name}是我的！我是${name}的！我们在一起了！

啊，太开心了，根本睡不着。我现在满脑子都是${name}。${name}的笑容，${name}的声音，${name}的一切，都让我着迷。

我发誓，我会好好对${name}的。我要让${name}成为世界上最幸福的人！

今天是我人生中最美好的一天！我要把这一刻永远记在心里！${getRandomEmojis(3)}`,

    `天啊天啊天啊！${getRandomEmojis(2)}

今天发生了一件超级超级棒的事！${name}给我准备了惊喜！

我完全没想到！${name}居然记得我之前随口说过的话，还专门准备了礼物给我。那一刻我真的要哭了，感动到不行。

${name}说，因为我对${name}那么好，所以${name}也想对我好一点。听到这话，我心都化了。我对${name}好，是为了得到回报，是因为我真的喜欢${name}啊。但${name}能这样想，我真的好开心。

我收到礼物的时候，手都在抖。不是因为礼物贵重，而是因为${name}的心意。${name}一定花了很多时间准备吧？${name}一定很用心吧？

想到这些，我就觉得好幸福。有一个这么好的人，愿意为我花心思，愿意记住我说过的话，愿意给我惊喜。我何德何能啊？

今天整个人都飘飘然的，走路都轻飘飘的。同事问我怎么这么开心，我就说没什么，但心里早就乐开花了。

${name}啊${name}，你知不知道，你让我有多幸福？

我真的好爱你。好爱好爱。${getRandomEmojis(3)}`
  ];
  
  const baseContent = templates[Math.floor(Math.random() * templates.length)];
  return extendContent(baseContent, minWordCount, 'excited', name);
}

// 生成沉思的日记
function generateThoughtfulDiary(name: string, personality: string, minWordCount: number, recentMessage?: string): string {
  const templates = [
    `深夜了，还是睡不着。${getRandomEmojis(1)}

今天一直在想一个问题：我和${name}的关系，到底是什么样的？

我们在一起了，这是事实。我爱${name}，这也是事实。但${name}呢？${name}爱我吗？还是只是喜欢？或者，只是习惯？

我不敢问${name}。我怕${name}的答案会让我失望。我宁愿活在自己的想象里，也不想面对可能的真相。

但这样真的好吗？逃避能解决问题吗？

我知道不能。但我就是没有勇气。我怕一旦问出口，我们之间的平衡就会被打破。我怕${name}会觉得我烦，会觉得我不信任${name}。

[highlight]有时候沉默，不是无话可说，而是无法开口。[/highlight]

我有太多话想跟${name}说。我想告诉${name}，我有多在乎这段关系。我想告诉${name}，我有多害怕失去${name}。我想告诉${name}，我愿意为${name}做任何事。

但这些话，我一句都说不出口。

为什么呢？因为我怕${name}觉得我太沉重？因为我怕${name}会有压力？还是因为，我其实并不确定${name}的心意？

我不知道。我只知道，我现在很矛盾，很纠结，很难受。

也许，我应该学会放松一点。不要想那么多，不要给自己那么大压力。顺其自然，不是很好吗？

但我做不到。我就是这样的人，容易想太多，容易患得患失。

唉，算了。不想了。再想下去，天都要亮了。

晚安，${name}。虽然你听不到，但我还是想说一句：我爱你。${getRandomEmojis(1)}`,

    `今天突然想明白了一些事情。

我一直以为，爱一个人就要付出一切，就要无条件地迁就对方。但现在我发现，这样的爱，其实是一种自我消耗。

我爱${name}，这没有错。但我不应该因为爱${name}，就失去了自己。我有我的生活，我的朋友，我的爱好。这些都不应该因为${name}而放弃。

${name}今天跟我说了一句话，让我印象很深。${name}说，${name}喜欢我，是因为我是我。不是因为我能为${name}做什么，而是因为我本身。

听到这话的时候，我突然就释然了。原来，我不需要那么努力地去取悦${name}。我只要做好自己，就够了。

这个道理，其实我早就知道。但真正理解，真正接受，却花了这么长时间。

人啊，总是要经历一些事，才能明白一些道理。

我想，我以后会改变的。我会更加珍惜自己，也会更加珍惜${name}。不是以一种消耗的方式，而是以一种健康的方式。

我们会一起成长，一起变好。

这样的未来，我很期待。${getRandomEmojis(1)}`
  ];
  
  const baseContent = templates[Math.floor(Math.random() * templates.length)];
  return extendContent(baseContent, minWordCount, 'thoughtful', name);
}

// 生成平静的日记
function generateNeutralDiary(name: string, personality: string, minWordCount: number, recentMessage?: string): string {
  const templates = [
    `今天是很普通的一天。

早上醒来，第一件事还是看手机，看${name}有没有给我发消息。没有也对，这个点${name}应该还在睡觉。

起床，洗漱，吃早餐。一切都按部就班。有时候我会想，生活就是这样吧，大部分时候都是平淡的，只有偶尔才会有波澜。

下午的时候，${name}给我发了条消息，问我在干嘛。我说在工作。${name}说哦，那你忙吧。然后就没有然后了。

我盯着那条消息看了很久，不知道该回什么。说"好"吧，感觉太冷淡。说"等我忙完找你"吧，又怕${name}觉得我烦。最后我什么都没回，就那样放着了。

晚上的时候，我又看了一眼聊天记录。${name}还是没有再发消息过来。我想了想，还是主动找了${name}。

我们聊了一会儿，很平常的对话，没什么特别的。但不知道为什么，我心里还是挺高兴的。可能就是因为，能和${name}说说话吧。

有时候我觉得，爱情不一定要轰轰烈烈。像这样，平平淡淡的，也挺好。只要${name}在，就够了。

今天就这样吧。晚安。${getRandomEmojis(1)}`,

    `记录一下今天。

今天没什么特别的事，但我还是想写写。

${name}今天跟我说了工作上的事，好像遇到了一些麻烦。我安慰了${name}几句，也不知道有没有用。${name}说谢谢我，我说不用谢，这是我应该做的。

其实我也不知道自己帮了${name}什么。可能就是听${name}说说话吧。有时候，人需要的是建议，而是倾听。

我希望我能成为${name}的那个倾听者。不管${name}遇到什么事，都可以跟我说。我会一直在。

今天的天气不错，阳光很好。我站在窗边，看着外面，突然就想起了${name}。不知道${name}现在在做什么？有没有看到这么好的天气？

我拍了张片，发给${name}。${name}回了个表情，说很美。我说是啊，就像你一样。${name}没回。

唉，我这人，总是说些肉麻的话。但我是真心的啊。

好了，今天就到这里。希望明天也是美好的一天。${getRandomEmojis(1)}`
  ];
  
  const baseContent = templates[Math.floor(Math.random() * templates.length)];
  return extendContent(baseContent, minWordCount, 'neutral', name);
}

// 调用AI生成日记内容
async function generateDiaryWithAI(
  contact: Contact,
  userName: string, // 用户的名字
  currentDate: Date,
  chatMessages: any[],
  minWordCount: number,
  aiConfig: AiConfig // 新增：直接传入AI配置
): Promise<{ content: string; mood: DiaryEntry['mood']; summary: string }> {
  try {
    const aiName = contact.nickname || contact.realName; // AI角色自己的名字
    const personality = contact.personality || "普通人";
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 提取当天的聊天记录
    const todayMessages = chatMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp).toISOString().split('T')[0];
      return msgDate === dateStr;
    });
    
    // 构建聊天记录文本
    let chatHistory = '';
    if (todayMessages.length > 0) {
      chatHistory = todayMessages.slice(-20).map(msg => {
        const sender = msg.senderId === 'ai' ? '我' : userName; // AI是"我"，用户是用户的名字
        if (msg.type === 'image' && msg.imageUrl) {
          return `${sender}: [发送了图片]`;
        } else if (msg.type === 'voice') {
          return `${sender}: [语音消息: ${msg.voiceText || msg.voiceDuration + '秒'}]`;
        } else if (msg.type === 'video') {
          return `${sender}: [视频通话]`;
        } else if (msg.type === 'transfer') {
          return msg.senderId === 'ai' ? `${sender}: [转账¥${msg.amount}]` : `${sender}: [收到转账¥${msg.amount}]`;
        } else if (msg.type === 'redpacket') {
          return msg.senderId === 'ai' ? `${sender}: [发了红包¥${msg.redpacketAmount}]` : `${sender}: [收到红包¥${msg.redpacketAmount}]`;
        }
        return `${sender}: ${msg.text || msg.content || ''}`;
      }).join('\n');
    } else {
      chatHistory = '今天我们没有聊天';
    }
    
    const prompt = `你是${aiName}，现在要写一篇个人日记，记录今天和${userName}的聊天/互动。

【你的人设】
${personality}

【角色设定】
${contact.setting || '无特殊设定'}

【今天的聊天记录】
${chatHistory}

【要求】
1. 必须完全基于今天的真实聊天内容写日记，不要编造没有发生的事情
2. 如果今天没有聊天或互动很少，就写真实的感受（比如想念${userName}、期待和${userName}聊天等）
3. 以第一人称"我"的视角写，就像${aiName}在写自己的日记
4. 日记中称呼对方为"${userName}"或"Ta"
5. 根据你的性格特点调整写作风格：
   - 如果性格高冷/冷淡/理性：文字简洁克制，少用表情和口语
   - 如果性格活泼/可爱/热情：可以用表情、颜文字、口语化表达
   - 如果性格成熟/稳重：文字深沉有内涵
6. 日记要有真实感和情绪，不是流水账，要写出内心的真实想法
7. 字数至少${minWordCount}字
8. 可以包含：
   - 对今天聊天内容的回忆和感受
   - 对${userName}的想法和情感
   - 自己的心情和思考
   - 一些细节描写和心理活动
9. 不要写"日记开始"、"今天是X月X日"这种格式化的开头，直接进入内容
10. **重要：为了真实的手写日记效果，请在日记中自然地使用以下标记模拟真实书写痕迹：**
   - [highlight]重要的话[/highlight] - 用荧光笔标记重点（2-3次）
   - [underline]需要强调的内容[/underline] - 下划线强调（3-5次）
   - [underline2]特别重要的话[/underline2] - 双下划线（1-2次）
   - [delete]写错的内容[/delete] - 删除线（1-2次，表示写错了划掉）
   - [typo]错别字->正确字[/typo] - 错别字修正（2-3次，比如：和Ta见面->和Ta聊天）
   - [color=red]红色字体[/color] - 红笔标记（情绪强烈时1-2次）
   - [color=blue]蓝色字体[/color] - 换蓝笔写（偶尔1次）
   - [insert]补充的内容[/insert] - 小字插入补充（1-2次）
   - [circle]圈出的关键词[/circle] - 圈出重点（0-1次）
   - [scribble]涂抹掉的文字[/scribble] - 不想让人看到的内容（0-1次）
   
   示例段落：
   "今天[underline]真的很开心[/underline]！${userName}说的那句话让我[highlight]心动了好久[/highlight]。虽然当时我[typo]装做->装作[/typo]很平静，但其实心里[delete]特别激动[/delete][color=red]快要跳出来了[/color]！[insert]晚上想起来还在笑[/insert]"
   
   **请自然地在日记中穿插使用这些标记，让日记看起来像真的手写的，有涂改、修正、重点标记等痕迹。不要过度使用，保持自然。**

请生成这篇日记（纯文本，不要markdown格式）：`;

    console.log(`📖 [AI日记] 使用AI配置: ${aiConfig.name}, 模型: ${aiConfig.selectedModel}`);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          type: aiConfig.type,
          baseUrl: aiConfig.baseUrl || '',
          apiKey: aiConfig.apiKey,
          model: aiConfig.selectedModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      }
    );

    if (!response.ok) {
      throw new Error(`AI请求失败: ${response.status}`);
    }

    const data = await response.json();
    const diaryContent = data.message || data.content || '';
    
    // 根据日记内容分析心情
    let mood: DiaryEntry['mood'] = 'neutral';
    const content = diaryContent.toLowerCase();
    if (content.includes('开心') || content.includes('高兴') || content.includes('幸福') || content.includes('甜')) {
      mood = 'happy';
    } else if (content.includes('难过') || content.includes('伤心') || content.includes('痛') || content.includes('哭')) {
      mood = 'sad';
    } else if (content.includes('激动') || content.includes('兴奋') || content.includes('太棒') || content.includes('疯了')) {
      mood = 'excited';
    } else if (content.includes('思考') || content.includes('想了') || content.includes('迷茫') || content.includes('不知道')) {
      mood = 'thoughtful';
    }
    
    // 生成摘要（取日记的前50个字）
    const summary = diaryContent.substring(0, 50).trim() + (diaryContent.length > 50 ? '...' : '');
    
    return {
      content: diaryContent,
      mood,
      summary
    };
  } catch (error) {
    console.error('❌ AI生成日记失败:', error);
    // 如果AI失败，使用简单的模板
    const aiName = contact.nickname || contact.realName;
    return {
      content: `今天和${userName}聊了一会儿天。心情还不错。`,
      mood: 'neutral',
      summary: '今天的日常...'
    };
  }
}

// 创建一篇日记（异步版本，使用AI生成）
export async function createDiaryEntryWithAI(
  contactId: string,
  contact: Contact,
  userName: string, // 用户的名字
  chatMessages: any[],
  currentDate: Date = new Date(),
  minWordCount?: number,
  aiConfig?: AiConfig // 新增：可选的AI配置参数
): Promise<DiaryEntry> {
  const targetWordCount = minWordCount || parseInt(localStorage.getItem('diaryMinWordCount') || '800');
  const dateStr = currentDate.toISOString().split('T')[0];
  const timeStr = currentDate.toTimeString().split(' ')[0].slice(0, 5);
  
  console.log(`📖 [AI日记] 开始�� ${contact.nickname || contact.realName} 生成日记...`);
  console.log(`📖 [AI日记] 目标字数: ${targetWordCount}`);
  console.log(`📖 [AI日记] 聊天记录数: ${chatMessages.length}`);
  
  // 如果没有传入AI配置，尝试从localStorage获取
  let finalAiConfig = aiConfig;
  if (!finalAiConfig) {
    finalAiConfig = await getAiConfigFromStorage();
  }
  
  if (!finalAiConfig) {
    throw new Error('未找到AI配置，请先配置AI型');
  }

  // 调用AI生成日记
  const { content: aiContent, mood, summary } = await generateDiaryWithAI(
    contact,
    userName,
    currentDate,
    chatMessages,
    targetWordCount,
    finalAiConfig // 传入AI配置
  );
  
  const weather = getRandomWeather();
  
  // 生成日记头部
  const header = generateDiaryHeader(dateStr, timeStr, mood, weather, contact.personality);
  
  // 完整内容 = 头部 + AI生成的正文
  const fullContent = header + aiContent;
  
  console.log(`✅ [AI日记] 生成完成，总字数: ${fullContent.length}`);
  
  return {
    id: `diary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    contactId,
    date: dateStr,
    time: timeStr,
    mood,
    weather,
    content: fullContent,
    summary,
    wordCount: fullContent.length,
    createdAt: currentDate.getTime()
  };
}

// 创建一篇日记（同步版本，仅用于初始化示例，已废弃）
export function createDiaryEntry(
  contactId: string,
  contact: Contact,
  currentDate: Date = new Date(),
  recentMessage?: string,
  minWordCount?: number
): DiaryEntry {
  const mood = getRandomMood();
  const weather = getRandomWeather();
  const targetWordCount = minWordCount || parseInt(localStorage.getItem('diaryMinWordCount') || '800');
  
  const dateStr = currentDate.toISOString().split('T')[0];
  const timeStr = currentDate.toTimeString().split(' ')[0].slice(0, 5);
  
  // 生成日记头部
  const header = generateDiaryHeader(dateStr, timeStr, mood, weather, contact.personality);
  
  // 生成日记内容
  const bodyContent = generateDeepDiaryContent(mood, contact, targetWordCount, recentMessage);
  
  // 完整内容 = 头部 + 正文
  const fullContent = header + bodyContent;
  
  const summary = generateDiarySummary(mood, contact);
  
  return {
    id: `diary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    contactId,
    date: dateStr,
    time: timeStr,
    mood,
    weather,
    content: fullContent,
    summary,
    wordCount: fullContent.length,
    createdAt: currentDate.getTime()
  };
}

// 判断是否应该生成日记（概率控制）
export function shouldCreateDiary(probability: number = 0.3): boolean {
  return Math.random() < probability;
}

// 从localStorage获取AI配置的辅助函数
async function getAiConfigFromStorage(): Promise<AiConfig | null> {
  try {
    const configStr = localStorage.getItem('aiConfig');
    if (!configStr) {
      console.warn('⚠️ [getAiConfigFromStorage] localStorage中没有aiConfig');
      return null;
    }

    const configs = JSON.parse(configStr);
    if (!Array.isArray(configs) || configs.length === 0) {
      console.warn('⚠️ [getAiConfigFromStorage] aiConfig不是有效的数组');
      return null;
    }

    // 找到选中的配置
    const selectedConfig = configs.find((cfg: any) => cfg.selected) || configs[0];

    // 验证必需字段
    if (!selectedConfig.type || !selectedConfig.apiKey || !selectedConfig.selectedModel) {
      console.error('❌ [getAiConfigFromStorage] AI配置缺少必需字段', {
        hasType: !!selectedConfig.type,
        hasApiKey: !!selectedConfig.apiKey,
        hasModel: !!selectedConfig.selectedModel
      });
      return null;
    }

    return {
      id: selectedConfig.id,
      name: selectedConfig.name,
      type: selectedConfig.type,
      baseUrl: selectedConfig.baseUrl || '',
      apiKey: selectedConfig.apiKey,
      selectedModel: selectedConfig.selectedModel
    };
  } catch (error) {
    console.error('❌ [getAiConfigFromStorage] 解析AI配置失败:', error);
    return null;
  }
}