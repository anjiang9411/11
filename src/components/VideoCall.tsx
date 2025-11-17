import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Contact } from './Contacts';
import { publicAnonKey, projectId } from '../utils/supabase/info';

interface VideoCallProps {
  contact: Contact;
  onClose: () => void;
  onCallEnd?: (duration: number) => void; // 新增：通话结束回调，传入通话时长（秒）
  currentTime: string;
  worldBooks?: Array<{
    id: string;
    name: string;
    description: string;
    entries: Array<{
      keys: string[];
      content: string;
      enabled: boolean;
    }>;
  }>;
  rules?: Array<{
    id: string;
    name: string;
    content: string;
    enabled: boolean;
  }>;
  chatHistory?: Array<{
    senderId: string;
    content: string;
    timestamp: number;
  }>;
  // API配置相关
  apiConfigs: Array<{
    id: string;
    name: string;
    type: string;
    baseUrl?: string;
    apiKey: string;
    selectedModel: string;
  }>;
  selectedApiId: string;
  projectId: string;
  accessToken: string;
}

// 统一的消息类型 - 包含对话和描述
interface VideoMessage {
  id: string;
  type: 'user-message' | 'narrative' | 'dialogue'; // 三种类型：用户消息、叙述、对话
  content: string;
  timestamp: number;
}

export function VideoCall({ 
  contact, 
  onClose, 
  onCallEnd,
  currentTime,
  worldBooks = [],
  rules = [],
  chatHistory = [],
  apiConfigs,
  selectedApiId,
  projectId,
  accessToken
}: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [messages, setMessages] = useState<VideoMessage[]>([]); // 统一的消息流
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('正在连接视频...');
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 通话时长相关状态
  const [callDuration, setCallDuration] = useState(0); // 秒数
  const [callStartTime] = useState(Date.now()); // 通话开始时间
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 解析叙述文本，识别对话和描述
  const parseNarrativeContent = (content: string) => {
    // 将内容按行分割
    const lines = content.split('\n');
    const parsed: Array<{ type: 'narrative' | 'dialogue', content: string }> = [];
    
    let currentNarrative = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检查是否是对话行（支持中文引号""、英文引号""、以及「」）
      const dialogueMatch = trimmedLine.match(/^["\"「](.*?)["\"」]$/);
      
      if (dialogueMatch) {
        // 如果之前有累积的叙述文本，先添加
        if (currentNarrative) {
          parsed.push({ type: 'narrative', content: currentNarrative.trim() });
          currentNarrative = '';
        }
        // 添加对话
        parsed.push({ type: 'dialogue', content: dialogueMatch[1] });
      } else if (trimmedLine === '') {
        // 空行，继续累积到叙述中
        if (currentNarrative) {
          currentNarrative += '\n';
        }
      } else {
        // 叙述文本
        currentNarrative += (currentNarrative ? '\n' : '') + trimmedLine;
      }
    }
    
    // 添加最后的叙述文本
    if (currentNarrative) {
      parsed.push({ type: 'narrative', content: currentNarrative.trim() });
    }
    
    return parsed;
  };

  // 生成初始角色描述
  useEffect(() => {
    generateInitialDescription();
  }, []);

  const generateInitialDescription = async () => {
    setIsGenerating(true);
    setLoadingStatus('正在生成画面描述...');
    
    try {
      console.log('🎥 [视频通话] 查API配置...');
      
      if (!apiConfigs || apiConfigs.length === 0) {
        console.error('❌ [视频通话] 未找到API配置');
        setError('⚠️ 未找到API配置，请先在设置中配置API');
        throw new Error('未找到API配置，请先在设置中配置API');
      }

      const selectedConfig = apiConfigs.find(config => config.id === selectedApiId) || apiConfigs[0];
      console.log('✅ [视频通话] 使用API配置:', {
        type: selectedConfig.type,
        model: selectedConfig.selectedModel,
        hasApiKey: !!selectedConfig.apiKey
      });
      
      // 验证API配置完整性
      if (!selectedConfig.selectedModel) {
        const errorMsg = `AI配置"${selectedConfig.name}"未选择模型`;
        console.error('❌ [视频通话] AI配置未选择模型');
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!selectedConfig.apiKey) {
        const errorMsg = `AI配置"${selectedConfig.name}"缺少API密钥`;
        console.error('❌ [视频通话] AI配置缺少API密钥');
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const worldBookContext = worldBooks
        .filter(book => book.entries.some(entry => entry.enabled))
        .map(book => {
          const enabledEntries = book.entries.filter(entry => entry.enabled);
          return `${book.name}:\n${enabledEntries.map(entry => entry.content).join('\n')}`;
        })
        .join('\n\n');

      const rulesContext = rules
        .filter(rule => rule.enabled)
        .map(rule => `${rule.name}: ${rule.content}`)
        .join('\n');

      const recentHistory = chatHistory.slice(-10).map(msg => {
        const sender = msg.senderId === 'me' ? '我' : contact.nickname;
        return `${sender}: ${msg.content}`;
      }).join('\n');

      // 🔥 关键修复：从worldBooks中提取性别信息
      const genderMatch = worldBookContext.match(/性别[：:]\s*(男|女|男性|女性)/i);
      let genderInfo = '';
      let genderPronoun = 'ta';
      if (genderMatch) {
        const gender = genderMatch[1];
        if (gender === '男' || gender === '男性') {
          genderInfo = `\n\n🚨🚨🚨 极其重要 🚨🚨🚨\n${contact.nickname}是男性角色！必须使用"他"，不能使用"她"！\n必须描写男性的外貌特征、体态、声音、动作！\n禁止使用任何女性化的词汇（如：娇小、她、柔美等）！`;
          genderPronoun = '他';
        } else if (gender === '女' || gender === '女性') {
          genderInfo = `\n\n🚨 重要提醒：${contact.nickname}是女性角色，使用"她"进行描写。`;
          genderPronoun = '她';
        }
      }

      // 🔥 构建完整的角色人设信息（在handleUserSpeak中也需要定义）
      const characterProfile = `
【角色基本信息】
本名：${contact.realName}
昵称：${contact.nickname}
${contact.age ? `年龄：${contact.age}` : ''}
${contact.occupation ? `职业：${contact.occupation}` : ''}

【性格特征】
${contact.personality || '（未设定）'}

【经历背景】
${contact.experience || '（未设定）'}

【兴趣爱好】
${contact.hobbies || '（未设定）'}

${contact.otherInfo ? `【其他信息】\n${contact.otherInfo}` : ''}
`.trim();

      // 获取最近的上下文
      const recentContext = messages
        .slice(-5)
        .map((msg) => {
          if (msg.type === 'user-message') {
            return `[我说]: ${msg.content}`;
          } else {
            return `[画面]: ${(msg.content || '').substring(0, 200)}...`;
          }
        })
        .join('\n');

      const systemPrompt = `你是${contact.nickname}，现在正在和我进行视频通话。

【角色性别 - 最高优先级】${genderInfo}

${characterProfile}

【世界观设定】
${worldBookContext}

【规则】
${rulesContext}

【当前时间】${currentTime}
【当前场景】视频通话中

【最近的对话和画面】
${recentContext}`;

      console.log('📚 [视频通话] 世界观设定:', worldBookContext);
      console.log('📜 [视频通话] 规则设定:', rulesContext);
      console.log('💬 [视频通话] 聊天历史:', recentHistory);
      console.log('🚹🚺 [视频通话] 检测到的性别:', genderPronoun);

      const prompt = `你现在要描述${contact.nickname}在视频通话中的初始画面。

【角色性别 - 最高优先级】${genderInfo}

${characterProfile}

【世界观设定】
${worldBookContext}

【规则】
${rulesContext}

【最近的聊天记录】
${recentHistory}

【当前时间】${currentTime}

⚠️ 特别提醒 - 必须严格遵守：
1. 严格按照上述【角色基本信息】中的性别、年龄、职业进行描写
2. 严格按照【性格特征】描写角色的言行举止、表情、语气
3. 严格按照【经历背景】理解角色的状态和心境
4. 严格按照【兴趣爱好】选择场景中出现的物品、环境细节
5. 不要添加或改变任何未在人设中提到的特征
6. 不要臆想或创造与人设矛盾的内容
7. 描写的每一个细节都要符合角色设定

<载入现代小说数据包: "以现代文学为基础，参考优秀现代小说作品，行文优美、流畅，简明扼要">
{立体人物塑造: ["通过细节暗示角色情绪，利用现代社交方式强化人物关系的真实感", "角色的职业、成长经历、社会地位影响他们的思维模式与行为方式", "结合语气、表情或肢体语言，让对白更富表现力"], 场景建构: ["通过真实场景与具体物品增强代入感，使故事更具生活气息", "空间关系的情绪隐喻", "氛围层层递进，逐步缩小外界干扰，突出角色的心理变化"], 叙事节奏: ["利用具体事物承载情感变化", "在重要剧情点推动情感变化，让角色成长具备现实合理性"]}
</载入现代小说数据包>

请用现代小说的笔法，详细描述${contact.nickname}现在在视频画面中的样子。要求：

【视觉层面 - 从远到近的观察】
1. 整体环境氛围（房间光线的质感、色温、时间感；窗外或背景的细节；空间给人的感觉）
2. 人物在空间中的位置（坐姿、倚靠的物品、与周围物品的关系）
3. 服装细节（材质、颜色、穿着的随意或正式程度、衣物的褶皱或状态）
4. 发型与容（发丝的状态、是否有刘海垂落、妆容的精致度、此刻的状态感）

【神情动作 - 微观的情绪捕捉】
5. 眼神的具体描写（瞳孔的光泽、视线的方向、眼角的弧度、睫毛的颤动）
6. 面部表情的细微变化（嘴角的弧度、脸颊是否有微红、眉梢的状态、鼻翼的细微动作）
7. 肢体语言（手指的位置、手臂的姿态、肩膀的松紧、身体的前倾或后仰）
8. 此刻正在做的动作（拿着什么物品、手指的小动作、呼吸的节奏）

【情绪与氛围】
9. 通过环境细节暗示ta的心情（比如桌上的物品摆放、窗帘的状态、周围的声音）
10. 此刻ta给人的整体感觉（放松/紧张、开心/疲惫、期待/平静等，但要通过具体细节呈现）
11. 视频接通瞬间ta的微反应（看到你时眼神的变化、嘴角的动作、身体的调整）

【文学要求】
- 字数：800-2000字
- 用第三人称，现在时态
- 像写现代小说一样细腻、有画面感
- 每个细节都要具体，避免笼统的形容词
- 通过具体的物品、光影、动作来展现人物状态
- 符合角色设定、当前时间和最近的聊天氛围
- 要有生活气息和真实感，像真正的视频通话画面
- 描写要有层次感：从环境→人物→神情→细节
- 用细节暗示情绪，不要直接说"她很开心"，而是描写"嘴角不自觉上扬"
- ⚠️ 必须分段！每个段落之间空一行，每段3-5行
- ⚠️ 必须包含对话！在描述的最后加上角色看到视频接通后说的第一句话

【格式示例】
（环境描述段落）
午后的阳光透过窗帘的缝隙斜斜地洒进来，在房间里投下温暖的光斑。空气中飘着淡淡的咖啡香。

（人物描述段落）
他坐在书桌前，穿着一件宽松的灰色卫衣。头发有些凌乱，像是刚从被窝里爬起来不久。

（神情动作段落）
视频接通的瞬间，他抬起头，眼睛眯了眯，似乎在适应屏幕的光线。嘴角慢慢扬起，露出一个懒洋洋的笑。

"哟，在呢在呢。"

只输出描述内容，不要有任何前缀、标题或解释。直接开始描写画面。`; 
      
      console.log('🎬 [视频通话] 开始生成初始画面描述...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            type: selectedConfig.type,
            baseUrl: selectedConfig.baseUrl,
            apiKey: selectedConfig.apiKey,
            model: selectedConfig.selectedModel,
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const narrativeContent = data.message || `${contact.nickname}看着镜头，微微一笑。`;
          
          // 解析内容，拆分成叙述和对话消息
          const parsed = parseNarrativeContent(narrativeContent);
          const newMessages: VideoMessage[] = [];
          let timestamp = Date.now() + 1;
          
          for (const item of parsed) {
            if (item.type === 'dialogue') {
              // 对话消息
              newMessages.push({
                id: `${timestamp}`,
                type: 'dialogue',
                content: item.content,
                timestamp: timestamp++
              });
            } else {
              // 叙述消息
              newMessages.push({
                id: `${timestamp}`,
                type: 'narrative',
                content: item.content,
                timestamp: timestamp++
              });
            }
          }
          
          setMessages(prev => [...prev, ...newMessages]);
          
          // 清除加载状态
          setLoadingStatus('');
        } else {
          throw new Error(data.error || 'API调用失败');
        }
      } else {
        throw new Error('API调用失败');
      }
    } catch (error) {
      console.error('生成回复失败:', error);
      
      // 错误提示消息
      const fallbackNarrative: VideoMessage = {
        id: (Date.now() + 1).toString(),
        type: 'narrative',
        content: `画面突然卡顿了一下。${contact.nickname}皱了皱眉，有些无奈地看着镜头。`,
        timestamp: Date.now() + 1
      };
      const fallbackDialogue: VideoMessage = {
        id: (Date.now() + 2).toString(),
        type: 'dialogue',
        content: '诶...网络好像有点不太好...',
        timestamp: Date.now() + 2
      };
      setMessages(prev => [...prev, fallbackNarrative, fallbackDialogue]);
      
      // 清除加载状态
      setLoadingStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUserSpeak = async (message: string) => {
    if (!message.trim()) return;

    // 添加用户消息
    const userMsg: VideoMessage = {
      id: Date.now().toString(),
      type: 'user-message',
      content: message.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // 生成AI回复（包含叙述和对话的完整内容）
    setIsGenerating(true);
    
    try {
      if (!apiConfigs || apiConfigs.length === 0) {
        throw new Error('未找到API配置');
      }

      const selectedConfig = apiConfigs.find(config => config.id === selectedApiId) || apiConfigs[0];
      
      // 验证API配置完整性
      if (!selectedConfig.selectedModel) {
        const errorMsg = `AI配置"${selectedConfig.name}"未选择模型`;
        console.error('❌ [视频通话] AI配置未选择模型');
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!selectedConfig.apiKey) {
        const errorMsg = `AI配置"${selectedConfig.name}"缺少API密钥`;
        console.error('❌ [视频通话] AI配置缺少API密钥');
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const worldBookContext = worldBooks
        .filter(book => book.entries.some(entry => entry.enabled))
        .map(book => {
          const enabledEntries = book.entries.filter(entry => entry.enabled);
          return `${book.name}:\n${enabledEntries.map(entry => entry.content).join('\n')}`;
        })
        .join('\n\n');

      const rulesContext = rules
        .filter(rule => rule.enabled)
        .map(rule => `${rule.name}: ${rule.content}`)
        .join('\n');

      // 🔥 关键修复：从worldBooks中提取性别信息
      const genderMatch = worldBookContext.match(/性别[：:]\s*(男|女|男性|女性)/i);
      let genderInfo = '';
      let genderPronoun = 'ta';
      if (genderMatch) {
        const gender = genderMatch[1];
        if (gender === '男' || gender === '男性') {
          genderInfo = `\n\n🚨🚨🚨 极其重要 🚨🚨🚨\n${contact.nickname}是男性角色！必须使用"他"，不能使用"她"！\n必须描写男性的外貌特征、体态、声音、动作！\n禁止使用任何女性化的词汇（如：娇小、她、柔美等）！`;
          genderPronoun = '他';
        } else if (gender === '女' || gender === '女性') {
          genderInfo = `\n\n🚨 重要提醒：${contact.nickname}是女性角色，使用"她"进行描写。`;
          genderPronoun = '她';
        }
      }

      // 🔥 构建完整的角色人设信息（在handleUserSpeak中也需要定义）
      const characterProfile = `
【角色基本信息】
本名：${contact.realName}
昵称：${contact.nickname}
${contact.age ? `年龄：${contact.age}` : ''}
${contact.occupation ? `职业：${contact.occupation}` : ''}

【性格特征】
${contact.personality || '（未设定）'}

【经历背景】
${contact.experience || '（未设定）'}

【兴趣爱好】
${contact.hobbies || '（未设定）'}

${contact.otherInfo ? `【其他信息】\n${contact.otherInfo}` : ''}
`.trim();

      // 获取最近的上下文
      const recentContext = messages
        .slice(-5)
        .map(msg => {
          if (msg.type === 'user-message') {
            return `[我说]: ${msg.content}`;
          } else {
            return `[画面]: ${msg.content.substring(0, 200)}...`;
          }
        })
        .join('\n');

      const systemPrompt = `你是${contact.nickname}，现在正在和我进行视频通话。

【角色性别 - 最高优先级】${genderInfo}

${characterProfile}

【世界观设定】
${worldBookContext}

【规则】
${rulesContext}

【当前时间】${currentTime}
【当前场景】视频通话中

【最近的对话和画面】
${recentContext}

⚠️ 角色扮演要求 - 必须严格遵守：
1. 严格按照【角色基本信息】的性别、年龄、职业进行描写和对话
2. 严格按照【性格特征】说话、做动作、表达情绪
3. 严格按照【经历背景】理解当前心境和状态
4. 严格按照【兴趣爱好】选择话题和环境物品
5. 所有描写和对话必须符合角色人设，不得违背
6. 不要添加或创造任何与人设矛盾的内容

<载入现代小说数据包>
{立体人物塑造: ["通过细节暗示角色情绪", "结合语气、表情或肢体语言，让对白更富表现力"], 场景建构: ["通过真实场景与具体物品增强代入感", "氛围层层递进，突出角色的心理变化"], 叙事节奏: ["利用具体事物承载情感变化"]}
</载入现代小说数据包>

我刚才说："${message.trim()}"

请用现代小说的笔法，描述${contact.nickname}听到这句话后在视频画面中的反应和回复。输出要求：

【格式要求 - 非常重要】
1. 叙述性描写和对话要自然交织
2. 对话内容必须单独成行，前后都要换行
3. 对话用引号包裹，例如："你好呀"
4. 可以有多句对话，每句对话都要单独成行
5. 叙述描写和对话穿插进行

【内容要求】
- 先描述ta听到我说话时的微表情变化（100-200字）
- 然后是ta的第一句回复（对话，单独一行）
- 继续描述ta说话时的神情、动作、语气（100-200字）
- 如果话题需要，可以再说一两句话（对话，每句单独一行）
- 最后描述ta此刻的状态、氛围（100-200字）

【叙述要求】
- 描写要细腻：眼神、嘴角、手部动作、身体姿态
- 用光线、物品、声音营造氛围
- 通过细节暗示情绪，不要直接说"开心""紧张"
- 符合角色性格和当前情境

【对话要求】
- 口语化、生活化（一般10-30字一句）
- 可以有语气词、停顿、口误
- 符合视频通话的习惯
- 体现真实的情绪

输出格式示例：
光线从窗外斜斜地照进来，在ta的脸颊上投下温柔的光晕。ta听到这句话，眼神微微一动，睫毛轻轻颤了颤，嘴角慢慢扬起一个弧度。

"诶，你在说什么呀？"

ta的声音带着一丝慵懒，手指无意识地绕着发梢。身体微微向前倾，眼睛弯成了月牙状，像是在忍着笑。

"我可是一直都在听的～"

ta说完这句话，又靠回椅背上，窗外传来几声鸟鸣。ta的视线飘向窗外，然后又看回镜头，眸子里闪过一丝促狭的笑意。

⚠️ 重要提醒：严格按照角色设定中的性别使用正确的人称代词（他/她），不要使用"ta"这种模糊代词。

直接输出内容，不要有任何标题、前缀或解释。`; 
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            type: selectedConfig.type,
            baseUrl: selectedConfig.baseUrl,
            apiKey: selectedConfig.apiKey,
            model: selectedConfig.selectedModel,
            messages: [
              { role: 'system', content: systemPrompt }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const narrativeContent = data.message || `${contact.nickname}看着镜头，微微一笑。`;
          
          // 解析内容，拆分成叙述和对话消息
          const parsed = parseNarrativeContent(narrativeContent);
          const newMessages: VideoMessage[] = [];
          let timestamp = Date.now() + 1;
          
          for (const item of parsed) {
            if (item.type === 'dialogue') {
              // 对话消息
              newMessages.push({
                id: `${timestamp}`,
                type: 'dialogue',
                content: item.content,
                timestamp: timestamp++
              });
            } else {
              // 叙述消息
              newMessages.push({
                id: `${timestamp}`,
                type: 'narrative',
                content: item.content,
                timestamp: timestamp++
              });
            }
          }
          
          setMessages(prev => [...prev, ...newMessages]);
        } else {
          throw new Error(data.error || 'API调用失败');
        }
      } else {
        throw new Error('API调用失败');
      }
    } catch (error) {
      console.error('生成回复失败:', error);
      
      // 错误提示消息
      const fallbackNarrative: VideoMessage = {
        id: (Date.now() + 1).toString(),
        type: 'narrative',
        content: `画面突然卡顿了一下。${contact.nickname}皱了皱眉，有些无奈地看着镜头。`,
        timestamp: Date.now() + 1
      };
      const fallbackDialogue: VideoMessage = {
        id: (Date.now() + 2).toString(),
        type: 'dialogue',
        content: '诶...网络好像有点不太好...',
        timestamp: Date.now() + 2
      };
      setMessages(prev => [...prev, fallbackNarrative, fallbackDialogue]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 启动通话计时器
  useEffect(() => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStartTime]);

  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理挂断
  const handleEndCall = () => {
    // 调用回调传递通话时长
    if (onCallEnd) {
      onCallEnd(callDuration);
    }
    // 关闭通话界面
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex-shrink-0 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white/30">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>{contact.nickname[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{contact.nickname}</div>
              <div className="text-xs text-white/70 flex items-center gap-2">
                <span>{currentTime}</span>
                <span className="text-green-400">•</span>
                <span className="text-green-400">{formatDuration(callDuration)}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 主内容区 - 可滚动的消息流 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
        {/* 加载状态 */}
        {loadingStatus && (
          <div className="flex justify-center items-center py-8">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 max-w-md shadow-2xl border border-white/20">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <div className="text-white/90 text-sm">{loadingStatus}</div>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="flex justify-center py-4">
            <div className="bg-red-500/80 backdrop-blur-md rounded-2xl p-4 max-w-md shadow-2xl border border-red-300/30">
              <div className="text-white text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* 统一的消息流 */}
        <div className="space-y-4 pb-4">
          {messages.map((msg) => {
            if (msg.type === 'user-message') {
              // 用户消息 - 右侧绿色气泡
              return (
                <div key={msg.id} className="flex justify-end px-2">
                  <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-green-500 text-white shadow-lg">
                    <div className="text-sm leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              );
            } else if (msg.type === 'narrative') {
              // 叙述消息 - 居中黑色半透明大框
              return (
                <div key={msg.id} className="flex justify-center px-2">
                  <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 max-w-2xl shadow-2xl border border-white/10 w-full">
                    <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            } else if (msg.type === 'dialogue') {
              // 对话消息 - 左侧白色气泡
              return (
                <div key={msg.id} className="flex justify-start px-2">
                  <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-white/90 text-gray-900 shadow-lg">
                    <div className="text-sm leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              );
            }
          })}

          {/* 正在生成的提示 */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white/90 px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* 自动滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="flex-shrink-0 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="flex items-center justify-center gap-6 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            } text-white`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-14 h-14 rounded-full ${
              !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            } text-white`}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
        </div>

        {/* 快捷输入区 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="输入要说的话..."
            className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleUserSpeak(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            variant="ghost"
            className="bg-white/20 hover:bg-white/30 text-white rounded-full px-6"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input?.value.trim()) {
                handleUserSpeak(input.value);
                input.value = '';
              }
            }}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}