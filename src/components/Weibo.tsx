import { useState, useRef, useEffect } from 'react';
import { X, Home, Compass, MessageCircle, User, Plus, Search, Settings, Heart, MessageSquare, Share2, MoreHorizontal, ChevronLeft, Send, Image as ImageIcon, AtSign, Smile, MapPin, Camera, Video, TrendingUp, Star, Eye, Clock, Bell, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { StatusBar } from './StatusBar';
import { Contact } from './Contacts';
import { toast } from 'sonner@2.0.3';

interface WeiboProps {
  onClose: () => void;
  currentTime: string;
  userProfile: {
    avatar: string;
    username: string;
    signature: string;
  };
  contacts: Contact[];
}

// 微博帖子接口
interface WeiboPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorVerified?: boolean;
  content: string;
  images?: string[];
  video?: string;
  location?: string;
  timestamp: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  comments?: WeiboComment[];
  tags?: string[]; // 帖子所属的标签（用于过滤显示）
}

// 评论接口
interface WeiboComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  likeCount: number;
  isLiked: boolean;
  replyTo?: string; // 回复的评论ID
}

// 消息接口
interface WeiboMessage {
  id: string;
  type: 'comment' | 'like' | 'follow' | 'at' | 'private';
  fromId: string;
  fromName: string;
  fromAvatar: string;
  content?: string;
  postId?: string;
  postContent?: string;
  timestamp: number;
  isRead: boolean;
}

export function Weibo({ onClose, currentTime, userProfile, contacts }: WeiboProps) {
  const [currentTab, setCurrentTab] = useState<'home' | 'discover' | 'message' | 'profile'>('home');
  const [homeTab, setHomeTab] = useState<'recommend' | 'following'>('recommend'); // 首页的推荐/关注切换
  const [recommendSubTab, setRecommendSubTab] = useState('热门'); // 推荐板块的子标签
  const [customTags, setCustomTags] = useState<string[]>([]); // 用户自定义标签
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [posts, setPosts] = useState<WeiboPost[]>([]);
  const [messages, setMessages] = useState<WeiboMessage[]>([]);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<WeiboPost | null>(null);
  const [postContent, setPostContent] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // 默认推荐子标签
  const defaultRecommendTags = ['热门', '同城', '实时', '榜单', '游戏'];
  const allRecommendTags = [...defaultRecommendTags, ...customTags];

  // 移除自动生成 - 改为手动点击才生成
  // useEffect(() => {
  //   if (homeTab === 'recommend') {
  //     handleGenerateContent();
  //   }
  // }, [recommendSubTab]);

  // 过滤显示的帖子
  const filteredPosts = homeTab === 'recommend' 
    ? posts.filter(post => post.tags && post.tags.includes(recommendSubTab))
    : posts.filter(post => !post.tags || post.tags.length === 0); // 关注Tab显示没有标签的帖子

  // 初始化模拟数据
  useEffect(() => {
    // 模拟微博帖子
    const mockPosts: WeiboPost[] = [
      {
        id: 'post1',
        authorId: contacts[0]?.id || 'user1',
        authorName: contacts[0]?.nickname || '好友1',
        authorAvatar: contacts[0]?.avatar || '',
        authorVerified: true,
        content: '今天天气真好，出来散散步☀️ 心情也变得美好起来了～',
        images: [],
        timestamp: Date.now() - 3600000,
        likeCount: 42,
        commentCount: 8,
        shareCount: 3,
        isLiked: false,
        comments: []
      },
      {
        id: 'post2',
        authorId: contacts[1]?.id || 'user2',
        authorName: contacts[1]?.nickname || '好友2',
        authorAvatar: contacts[1]?.avatar || '',
        content: '分享一下今天的下午茶🍰 生活需要仪式感！',
        timestamp: Date.now() - 7200000,
        likeCount: 128,
        commentCount: 23,
        shareCount: 12,
        isLiked: true,
        comments: []
      }
    ];
    setPosts(mockPosts);

    // 模拟消息
    const mockMessages: WeiboMessage[] = [
      {
        id: 'msg1',
        type: 'comment',
        fromId: contacts[0]?.id || 'user1',
        fromName: contacts[0]?.nickname || '好友1',
        fromAvatar: contacts[0]?.avatar || '',
        content: '说得好！',
        postContent: '今天的心情',
        timestamp: Date.now() - 1800000,
        isRead: false
      },
      {
        id: 'msg2',
        type: 'like',
        fromId: contacts[1]?.id || 'user2',
        fromName: contacts[1]?.nickname || '好友2',
        fromAvatar: contacts[1]?.avatar || '',
        postContent: '分享日常',
        timestamp: Date.now() - 3600000,
        isRead: false
      }
    ];
    setMessages(mockMessages);
    setUnreadMessageCount(mockMessages.filter(m => !m.isRead).length);
  }, [contacts]);

  // 发布微博
  const handlePublishPost = () => {
    if (!postContent.trim()) {
      toast.error('请输入微博内容');
      return;
    }

    const newPost: WeiboPost = {
      id: `post_${Date.now()}`,
      authorId: 'me',
      authorName: userProfile.username,
      authorAvatar: userProfile.avatar,
      content: postContent,
      timestamp: Date.now(),
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isLiked: false,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setPostContent('');
    setShowPostDialog(false);
    toast.success('发布成功');
  };

  // 点赞微博
  const handleLikePost = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
        };
      }
      return post;
    }));
  };

  // 评论微博
  const handleCommentPost = (post: WeiboPost) => {
    setSelectedPost(post);
    setShowCommentDialog(true);
  };

  // 发送评论
  const handleSendComment = () => {
    if (!commentContent.trim() || !selectedPost) return;

    const newComment: WeiboComment = {
      id: `comment_${Date.now()}`,
      authorId: 'me',
      authorName: userProfile.username,
      authorAvatar: userProfile.avatar,
      content: commentContent,
      timestamp: Date.now(),
      likeCount: 0,
      isLiked: false
    };

    setPosts(posts.map(post => {
      if (post.id === selectedPost.id) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
          commentCount: post.commentCount + 1
        };
      }
      return post;
    }));

    setCommentContent('');
    setShowCommentDialog(false);
    toast.success('评论成功');
  };

  // 转发微博
  const handleSharePost = (postId: string) => {
    toast.success('转发成功');
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, shareCount: post.shareCount + 1 };
      }
      return post;
    }));
  };

  // 添加自定义标签
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error('请输入标签名称');
      return;
    }
    if (allRecommendTags.includes(newTagName.trim())) {
      toast.error('标签已存在');
      return;
    }
    setCustomTags([...customTags, newTagName.trim()]);
    setNewTagName('');
    setShowAddTagDialog(false);
    toast.success('标签添加成功');
  };

  // API生成微博内容
  const handleGenerateContent = async () => {
    setIsGeneratingContent(true);
    toast.info('正在生成内容...');

    try {
      // TODO: 这里应该调用后端API生成内容
      // 示例：根据当前选中的标签生成相应的微博内容
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟API调用

      // 真实用户名库
      const realUsernames = [
        '甜橘oo', '夜渡舟前', '满湘晨狼', '碎雾缀王', '超自然起司饼',
        '小鹿乱撞', '猫系少女', '奶茶成精', '柠檬不萌', '糖分超标',
        '月亮邮递员', '星星收集者', '云朵贩卖机', '银河摆渡人', '宇宙快递员',
        '梦里的鱼', '晚风说', '清晨的粥', '午后的猫', '深夜的狗',
        '爱吃饭的小熊', '爱睡觉的兔子', '爱笑的橘猫', '爱哭的小鹿'
      ];

      // 来源设备
      const sources = [
        'iPhone 15', 'iPhone 15 Pro Max', 'iPhone 14', 'iPhone 13',
        'HUAWEI Mate 60', 'HUAWEI P60', 'vivo X100', 'OPPO Find X7',
        '小米14', '微博视频号', '微博网页版'
      ];

      // 根据不同标签生成不同类型的内容
      const contentTemplates: { [key: string]: Array<{text: string, hasImage?: boolean}> } = {
        '热门': [
          { text: '早上去买早餐，老板娘说今天的油条特别酥，结果真的超好吃！！配上豆浆简直绝了😋 这家店开了快二十年了吧，小时候就吃他家的，味道一直都很稳定。现在物价涨了，但是他们家还是保持原价，真的是业界良心了👍', hasImage: true },
          { text: '刚刚在地铁上看到一个小朋友，大概三四岁的样子，跟妈妈说"妈妈我想吃冰淇淋"，妈妈说"不行，你感冒了"。然后小朋友眨巴眨巴眼睛，超认真地说"那我明天再感冒行不行？"哈哈哈哈哈笑死我了，小孩子的脑回路真的太可爱了😂😂😂' },
          { text: '#今日份快乐# 下班路上偶遇了一只超可爱的小橘猫🐱 蹲在路边看着来来往往的人，看到我的时候还喵了一声，太治愈了吧！跟它玩了十几分钟，感觉一天的疲惫都烟消云散了～果然猫咪是人类的精神支柱啊💕', hasImage: true },
          { text: '刚刚看了一部电影，看到最后哭得稀里哗啦的😭 旁边坐的小哥递给我纸巾，还小声说"我也哭了"…社交恐惧症的我竟然跟陌生人聊了好久，原来电影真的能拉近人与人之间的距离啊' },
          { text: '今天终于把拖了一个月的房间整理完了！！扔了好多没用的东西，整个人都神清气爽✨ 果然断舍离是真的有用啊，感觉人生都被治愈了。准备奖励自己去吃顿大餐🍜', hasImage: true },
          { text: '笑死，刚才妈妈打电话来说"你是不是把我微信删了？为什么我发的消息你都不回？"我说"妈你发到家族群了，不是私聊我"……老年人玩手机真的太可爱了哈哈哈' },
          { text: '今天路过以前的学校，发现食堂阿姨还在！！！她居然还记得我最爱吃红烧肉🥺 给我打了超大一勺，还说"你现在工作了吧要多吃点"，瞬间泪目…果然有些人有些味道，真的会一直刻在记忆里', hasImage: true },
          { text: '凌晨三点被楼上的脚步声吵醒，正想发火的时候突然听到楼上传来婴儿的哭声…唉，当父母真的太不容易了。想起我爸妈当年照顾我也是这样，瞬间就不生气了。明天准备给楼上送点补品，互相理解吧💪' },
          { text: '今天健身房遇到一个大爷，七十多岁了还在练深蹲，教练说他已经坚持锻炼快二十年了！！问他为什么这么自律，大爷笑着说"我要活到一百岁，看看这个世界还会变成什么样子"……瞬间感觉自己的三天打鱼两天晒网真的太丢人了🔥', hasImage: false },
          { text: '#深夜食堂# 夜宵吃了碗泡面，加了火腿肠、鸡蛋、青菜、芝士…这可能是我这辈子吃过最豪华的泡面了😂 虽然知道不健康，但是真的太香了啊！明天一定要去跑步消耗掉这些热量💪', hasImage: true },
        ],
        '同城': [
          { text: '咱们本地人注意了！！xx路那家开了十几年的老火锅店要拆迁了😭 老板说这个月底就要关门了，有时间的朋友赶紧去吃一顿吧，真的是承载了太多回忆的地方…第一次跟男朋友吃饭就是在那儿，现在都结婚三年了', hasImage: true },
          { text: '今天去中山公园散步，发现湖边的樱花开了！！！现在去拍照的人还不多，想去的姐妹们抓紧时间啊📸 我拍了好多美美的照片，感觉可以发朋友圈装一整年的文艺青年了哈哈哈', hasImage: true },
          { text: '刚才在市中心的商场看到了Chanel的快闪店！！有好多新款包包，虽然买不起但是看看也是开心的😭 而且工作人员态度超好，还给我试了好几款，拍了照发给闺蜜馋她哈哈哈💕', hasImage: true },
          { text: '友情提示：地铁3号线xx站今天在维修，建议绕行！我刚才差点迟到，还好提前出门了。上班族们注意规划路线啊～', hasImage: false },
          { text: '今天下午三点左右，在xx路和xx路路口捡到一只小泰迪，脖子上有粉色项圈。已经带回家了，有丢狗狗的主人请联系我！！小家伙现在很乖，给了点水和狗粮🐕', hasImage: true },
          { text: '本地生活太幸福了！！楼下新开了一家24小时便利店，大晚上想吃什么都能买到😋 关键是价格还不贵，比某森贵族便利店良心多了。今晚买了关东煮和包子当夜宵，满足～', hasImage: true },
          { text: '咱们市今年的灯光秀也太美了吧！！！刚才跟朋友去江边看了，配合着音乐简直美哭😍 感觉咱们这座城市越来越好了，作为土生土长的本地人真的好骄傲啊✨', hasImage: true },
          { text: '问一下大家，咱们这儿哪里可以学游泳啊？想给孩子报个游泳班，看了几家都太贵了…有没有性价比高一点的推荐？', hasImage: false },
        ],
        '实时': [
          { text: '卧槽，刚才在小区门口看到有人在发传单，走近一看居然是我高中同学！！！我俩都愣住了，然后相视一笑…他说现在在创业，我说加油。社会真的很不容易，大家都在努力生活着💪', hasImage: false },
          { text: '突发！！！刚刚在楼下看到一辆超跑，车牌号是六个8！！！围观的人都拍照，车主是个年轻小伙子，开窗笑了笑就走了。贫穷限制了我的想象系列…', hasImage: true },
          { text: '等等，刚才看新闻说咱们这边要建地铁新线路了？？？经过我家小区附近？！！那我家房子是不是要升值了哈哈哈😂 不过说真的，交通方便了对我们上班族来说真的太友好了', hasImage: false },
          { text: '卧槽这个热搜我真的绷不住了😂😂😂 笑到肚子疼，这届网友真的太有才了哈哈哈。一定要去看看评论区，比正文还精彩！', hasImage: false },
          { text: '刚刚发生了一件超暖心的事！在公交车上看到一个老奶奶要下车，但是人太多挤不过去，一个小朋友主动让开还搀扶着老奶奶下车…这个社会还是好人多啊🥺💕', hasImage: false },
          { text: '实时更新：刚才路过商场看到��搞活动，好多东西都打折！！妹子们冲啊，我已经买了两件衣服了，超便宜！预计活动到晚上九点🛍️', hasImage: true },
          { text: '卧槽，我朋友圈是不是被黑了？为什么突然多了好多赌博广告？？有没有懂的朋友教教我怎么解决啊，急！！', hasImage: false },
          { text: '刚看到的消息，今晚有流星雨！！！想看的朋友可以出门了，据说最佳观测时间是晚上11点到凌晨2点。我准备去楼顶蹲守了✨🌠', hasImage: false },
        ],
        '榜单': [
          { text: '看了今天的榜单，怎么全是我不认识的人哈哈哈😂 我是不是落伍了？还是现在的年轻人审美跟我不一样了？', hasImage: false },
          { text: '#热门榜单# 这个月的榜单质量真的高啊！每一个都是干货满满，已经收藏了好几条准备慢慢看。榜单的存在真的太有意义了，帮我们筛选出了最有价值的内容👍', hasImage: false },
          { text: '恭喜xx登顶榜单！！！实至名归啊，从路人粉变成真爱粉，一路见证ta成长到现在🥺 希望以后越来越好，我们永远支持你💪', hasImage: true },
          { text: '说实话这期榜单我有点不服…明明xxx更应该上榜的，怎么连提名都没有？是不是评选标准有问题啊？', hasImage: false },
          { text: '榜单更新啦！！大家快去看，今天的榜单太炸了，前三名竞争好激烈。我已经把喜欢的都投票了，大家也快去支持自己的爱豆吧🔥', hasImage: false },
          { text: '今天的音乐榜单也太对我胃口了吧！前十名我居然都听过，而且都超喜欢😍 果然榜单是最能代表大众审美的，已经把整个榜单的歌都加到歌单里了🎵', hasImage: false },
          { text: '笑死，美食榜单第一名居然是我家楼下的那家小店？？我吃了快五年了，从来没觉得有多特别啊哈哈哈。不过确实挺好吃的，就是环境一般般🍜', hasImage: true },
          { text: '#书单推荐# 这个月的书单榜单我全部读完了！！最喜欢第三本，真的太精彩了。爱看书的姐妹们可以参考一下榜单，质量都很高📚', hasImage: false },
        ],
        '游戏': [
          { text: '今天运气爆棚！！！抽卡十连出了两个SSR😭😭😭 其中一个还是我最想要的角色！！感觉用光了今年所有的运气，明天买彩票说不定能中奖哈哈哈🎉', hasImage: true },
          { text: '有没有人一起开黑的？我打辅助，会保人会开团，就是有点菜🥺 求大佬带飞，钻石段位，能语音～', hasImage: false },
          { text: '这个新版本的boss也太难打了吧？？？我已经团灭十几次了还没过😭 有没有大佬出个攻略啊，求求了', hasImage: false },
          { text: '终于！！终于上王者了！！！撒花🎉🎉🎉 从青铜打到王者用了整整三个月，期间摔了两个手机哈哈哈。要感谢一路上遇到的神仙队友们，也感谢那些坑我的队友让我变强💪', hasImage: true },
          { text: '队友真的…我真的不想吐槽了😅 这局打得我心态都崩了，明明是必赢的局，硬生生被送成必输局。算了算了，不生气，毕竟只是游戏，开心最重要', hasImage: false },
          { text: '新出的这个角色/英雄也太强了吧！！我刚买了玩了几局，简直无敌。预感要被削弱了，趁着还没削赶紧多玩几把哈哈哈', hasImage: true },
          { text: '有大佬愿意带我上分吗？🥺 我真的很乖会听指挥，虽然技术不太好但是意识还可以！承诺不送不挂机，求带求带～', hasImage: false },
          { text: '今天打游戏遇到一个超好的队友！虽然我们输了，但是他一直在鼓励大家，说"没关系，再来一把"。游戏本来就是为了开心，遇到这样的队友真的太幸运了💕', hasImage: false },
          { text: '肝了一个通宵终于把活动任务做完了！！！奖励真的很丰厚，各种材料和道具拿到手软。虽然有点困但是很值得😤 准备睡一觉起来继续肝哈哈', hasImage: true },
        ]
      };

      // 表情符号库
      const emojis = ['😂', '🤣', '😭', '😊', '🥰', '😍', '🤔', '😱', '🔥', '💕', '✨', '🎉', '👍', '💪', '🙏', '❤️', '💯'];

      // 图片URL池
      const imageUrls = [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
      ];

      // 生成6-9条微博
      const count = Math.floor(Math.random() * 4) + 6; // 6-9条
      const generatedPosts: WeiboPost[] = [];

      for (let i = 0; i < count; i++) {
        const username = realUsernames[Math.floor(Math.random() * realUsernames.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const templates = contentTemplates[recommendSubTab] || contentTemplates['热门'];
        const template = templates[Math.floor(Math.random() * templates.length)];
        let content = template.text;

        // 可选：随机添加额外emoji（概率降低到20%，避免太多）
        if (Math.random() > 0.8) {
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          content += emoji;
        }

        // 生成真实的互动数据
        const baseMultiplier = Math.random() * 10;
        const likeCount = Math.floor(Math.random() * 10000 * baseMultiplier);
        const commentCount = Math.floor(likeCount * (0.05 + Math.random() * 0.15));
        const shareCount = Math.floor(likeCount * (0.01 + Math.random() * 0.05));

        // 决定是否有图片
        const hasImage = template.hasImage && Math.random() > 0.3;
        const imageCount = hasImage ? Math.floor(Math.random() * 3) + 1 : 0; // 1-3张图片
        const images = hasImage ? Array.from({ length: imageCount }, () => 
          imageUrls[Math.floor(Math.random() * imageUrls.length)]
        ) : undefined;

        generatedPosts.push({
          id: `gen_post_${Date.now()}_${i}`,
          authorId: `ai_user_${Date.now()}_${i}`,
          authorName: username,
          authorAvatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          authorVerified: Math.random() > 0.6, // 40%概率认证
          content: content,
          images: images,
          timestamp: Date.now() - Math.floor(Math.random() * 86400000), // 0-24小时内
          likeCount: likeCount,
          commentCount: commentCount,
          shareCount: shareCount,
          isLiked: false,
          comments: [],
          tags: [recommendSubTab],
          location: Math.random() > 0.7 ? ['北京', '上海', '广州', '深圳', '杭州', '成都'][Math.floor(Math.random() * 6)] : undefined,
        });
      }

      setPosts([...generatedPosts, ...posts]);
      toast.success(`成功生成${count}条${recommendSubTab}相关内容`);
    } catch (error) {
      toast.error('生成内容失败，请重试');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString();
  };

  // 渲染微博卡片
  const renderPostCard = (post: WeiboPost) => (
    <div key={post.id} className="bg-white border-b px-4 py-3">
      {/* 头部 */}
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={post.authorAvatar} />
          <AvatarFallback>{post.authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{post.authorName}</span>
            {post.authorVerified && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">V</Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">{formatTime(post.timestamp)}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* 内容 */}
      <div className="mt-3 text-sm leading-relaxed">{post.content}</div>

      {/* 图片（如果有） */}
      {post.images && post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {post.images.map((img, idx) => (
            <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* 位置（如果有） */}
      {post.location && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-500">
          <MapPin className="w-3 h-3" />
          <span>{post.location}</span>
        </div>
      )}

      {/* 互动按钮 */}
      <div className="mt-4 flex items-center justify-between text-gray-500">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
          onClick={() => handleLikePost(post.id)}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likeCount > 0 ? post.likeCount : '赞'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => handleCommentPost(post)}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentCount > 0 ? post.commentCount : '评论'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => handleSharePost(post.id)}
        >
          <Share2 className="w-4 h-4" />
          <span>{post.shareCount > 0 ? post.shareCount : '转发'}</span>
        </Button>
      </div>
    </div>
  );

  // 首页
  const renderHomePage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* 顶部栏 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-medium">首页</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tab切换：推荐/关注 */}
      <div className="bg-white border-b shrink-0">
        <div className="flex items-center h-12">
          <button
            onClick={() => setHomeTab('recommend')}
            className={`flex-1 h-full flex items-center justify-center relative ${
              homeTab === 'recommend' ? 'text-orange-500' : 'text-gray-600'
            }`}
          >
            <span className="font-medium">推荐</span>
            {homeTab === 'recommend' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
          <button
            onClick={() => setHomeTab('following')}
            className={`flex-1 h-full flex items-center justify-center relative ${
              homeTab === 'following' ? 'text-orange-500' : 'text-gray-600'
            }`}
          >
            <span className="font-medium">关注</span>
            {homeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        </div>
      </div>

      {/* 推荐板块的子标签 - 仅在推荐Tab显示 */}
      {homeTab === 'recommend' && (
        <div className="bg-white border-b px-2 py-2 shrink-0">
          <ScrollArea className="w-full">
            <div className="flex gap-2 items-center">
              {allRecommendTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setRecommendSubTab(tag)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${
                    recommendSubTab === tag
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                onClick={() => setShowAddTagDialog(true)}
                className="px-3 py-1 rounded-full whitespace-nowrap text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                添加
              </button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* 微博列表 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {homeTab === 'recommend' && (
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <span className="text-sm text-gray-600">当前查看：{recommendSubTab}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateContent}
              disabled={isGeneratingContent}
              className="h-7 text-xs"
            >
              {isGeneratingContent ? '生成中...' : 'AI生成内容'}
            </Button>
          </div>
        )}
        {filteredPosts.map(post => renderPostCard(post))}
      </div>

      {/* 发布按钮 */}
      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setShowPostDialog(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );

  // 发现页
  const renderDiscoverPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索微博、用户"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-0"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="bg-white border-b">
        <Tabs defaultValue="hot" className="w-full">
          <TabsList className="w-full justify-start h-12 rounded-none border-0 bg-transparent">
            <TabsTrigger value="hot" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
              热门
            </TabsTrigger>
            <TabsTrigger value="recommend" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
              推荐
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
              视频
            </TabsTrigger>
            <TabsTrigger value="nearby" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
              同城
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 热搜列表 */}
      <ScrollArea className="flex-1">
        <div className="bg-white mt-2">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="font-medium">微博热搜</span>
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rank) => (
            <div key={rank} className="px-4 py-3 border-b flex items-center gap-3 hover:bg-gray-50">
              <div className={`w-6 h-6 flex items-center justify-center rounded text-sm font-medium ${
                rank <= 3 ? 'bg-orange-500 text-white' : 'text-gray-500'
              }`}>
                {rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">示例热搜话题 {rank}</span>
                  {rank <= 3 && <Badge variant="destructive" className="h-4 px-1 text-xs">热</Badge>}
                </div>
                <div className="text-xs text-gray-500 mt-1">{Math.floor(Math.random() * 1000000)}万阅读</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // 消息页
  const renderMessagePage = () => (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-medium">消息</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 消息分类 */}
      <div className="bg-white border-b grid grid-cols-4 gap-4 px-4 py-4">
        <button className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-orange-500" />
            </div>
            {unreadMessageCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadMessageCount}
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-600">评论</span>
        </button>
        <button className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <span className="text-xs text-gray-600">赞</span>
        </button>
        <button className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <AtSign className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xs text-gray-600">@我</span>
        </button>
        <button className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-purple-500" />
          </div>
          <span className="text-xs text-gray-600">私信</span>
        </button>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1">
        <div className="bg-white mt-2">
          {messages.map((msg) => (
            <div key={msg.id} className="px-4 py-3 border-b flex items-start gap-3 hover:bg-gray-50">
              <Avatar className="w-12 h-12">
                <AvatarImage src={msg.fromAvatar} />
                <AvatarFallback>{msg.fromName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{msg.fromName}</span>
                  {!msg.isRead && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {msg.type === 'comment' && `评论了你：${msg.content}`}
                  {msg.type === 'like' && '赞了你的微博'}
                  {msg.type === 'follow' && '关注了你'}
                  {msg.type === 'at' && `@了你：${msg.content}`}
                </div>
                {msg.postContent && (
                  <div className="text-xs text-gray-400 mt-1 bg-gray-50 px-2 py-1 rounded">
                    {msg.postContent}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // 个人主页
  const renderProfilePage = () => (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-medium">我</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* 个人信息卡片 */}
        <div className="bg-white border-b p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback>{userProfile.username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium text-lg">{userProfile.username}</div>
              <div className="text-sm text-gray-500 mt-1">{userProfile.signature}</div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div>
                  <span className="font-medium">128</span>
                  <span className="text-gray-500 ml-1">关注</span>
                </div>
                <div>
                  <span className="font-medium">1.2K</span>
                  <span className="text-gray-500 ml-1">粉丝</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="bg-white border-b grid grid-cols-4 gap-4 px-4 py-4 mt-2">
          <button className="flex flex-col items-center gap-1">
            <Eye className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">主页访客</span>
            <span className="text-sm font-medium">236</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Star className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">收藏</span>
            <span className="text-sm font-medium">42</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">历史</span>
            <span className="text-sm font-medium">158</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <ThumbsUp className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">赞过</span>
            <span className="text-sm font-medium">89</span>
          </button>
        </div>

        {/* 我的微博 */}
        <div className="mt-2">
          <div className="bg-white px-4 py-3 border-b">
            <span className="font-medium">我的微博</span>
          </div>
          {posts.filter(p => p.authorId === 'me').map(post => renderPostCard(post))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <StatusBar currentTime={currentTime} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'home' && renderHomePage()}
        {currentTab === 'discover' && renderDiscoverPage()}
        {currentTab === 'message' && renderMessagePage()}
        {currentTab === 'profile' && renderProfilePage()}
      </div>

      {/* 底部导航栏 */}
      <div className="bg-white border-t flex items-center justify-around h-14 pb-safe">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            currentTab === 'home' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">首页</span>
        </button>
        <button
          onClick={() => setCurrentTab('discover')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            currentTab === 'discover' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <Compass className="w-6 h-6" />
          <span className="text-xs">发现</span>
        </button>
        <button
          onClick={() => setCurrentTab('message')}
          className={`flex flex-col items-center gap-1 px-4 py-2 relative ${
            currentTab === 'message' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs">消息</span>
          {unreadMessageCount > 0 && (
            <Badge className="absolute top-1 right-2 h-4 w-4 flex items-center justify-center p-0 text-xs">
              {unreadMessageCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            currentTab === 'profile' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs">我</span>
        </button>
      </div>

      {/* 发布微博对话框 */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle>发布微博</DialogTitle>
            <DialogDescription>分享你的新鲜事和生活点滴</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="分享新鲜事..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-32 resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AtSign className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MapPin className="w-5 h-5" />
                </Button>
              </div>
              <Button onClick={handlePublishPost} disabled={!postContent.trim()}>
                发布
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 评论对话框 */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle>评论</DialogTitle>
            <DialogDescription>写下你对这条微博的看法</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPost && (
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                {selectedPost.content}
              </div>
            )}
            <Textarea
              placeholder="写下你的评论..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="min-h-24 resize-none"
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="w-5 h-5" />
              </Button>
              <Button onClick={handleSendComment} disabled={!commentContent.trim()}>
                发送
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加标签对话框 */}
      <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle>添加标签</DialogTitle>
            <DialogDescription>为推荐板块添加自定义标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="输入标签名称..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <Button onClick={() => setShowAddTagDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddTag} disabled={!newTagName.trim()}>
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}