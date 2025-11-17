import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, PhoneOff, Volume2, VolumeX, Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Contact } from './Contacts';

interface VoiceCallProps {
  contact: Contact;
  onClose: () => void;
  onCallEnd?: (duration: number) => void;
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

// 语音通话的消息类型
interface VoiceMessage {
  id: string;
  type: 'user-message' | 'sound-description' | 'dialogue';
  content: string;
  timestamp: number;
}

export function VoiceCall({ 
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
}: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('正在连接...');
  const [error, setError] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 通话时长相关
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime] = useState(Date.now());
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 解析AI返回的内容
  const parseVoiceContent = (content: string) => {
    const lines = content.split('\n');
    const parsed: Array<{ type: 'sound-description' | 'dialogue', content: string }> = [];
    
    let currentDescription = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // 检测对话（「」或""包裹的内容）
      const dialogueMatch = trimmedLine.match(/^[「"](.+?)[」"]$/);
      
      if (dialogueMatch) {
        // 先保存之前的描述
        if (currentDescription) {
          parsed.push({ type: 'sound-description', content: currentDescription.trim() });
          currentDescription = '';
        }
        // 添加对话
        parsed.push({ type: 'dialogue', content: dialogueMatch[1] });
      } else {
        // 累积描述内容
        currentDescription += (currentDescription ? '\n' : '') + trimmedLine;
      }
    }
    
    // 保存最后的描述
    if (currentDescription) {
      parsed.push({ type: 'sound-description', content: currentDescription.trim() });
    }
    
    return parsed;
  };

  // 格式化时长为 mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 通话时长计时器
  useEffect(() => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStartTime]);

  // 生成AI场景描述
  const generateVoiceScene = async () => {
    setIsGenerating(true);
    setLoadingStatus('正在生成场景...');
    setError('');

    try {
      const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
      if (!selectedConfig) {
        throw new Error('未找到选中的AI配置');
      }

      if (!selectedConfig.selectedModel || !selectedConfig.apiKey) {
        throw new Error('AI配置不完整');
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

      // 提取性别信息
      const genderMatch = worldBookContext.match(/性别[：:]\s*(男|女|男性|女性)/i);
      let genderInfo = '';
      let genderPronoun = 'ta';
      if (genderMatch) {
        const gender = genderMatch[1];
        if (gender === '男' || gender === '男性') {
          genderInfo = `\n\n🚨🚨🚨 极其重要 🚨🚨🚨\n${contact.nickname}是男性角色！必须使用"他"，不能使用"她"！\n必须描写男性的声音特征（如：低沉、磁性、浑厚等）！\n禁止使用任何女性化的词汇！`;
          genderPronoun = '他';
        } else if (gender === '女' || gender === '女性') {
          genderInfo = `\n\n🚨 重要提醒：${contact.nickname}是女性角色，使用"她"进行描写。`;
          genderPronoun = '她';
        }
      }

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

      const recentContext = messages
        .slice(-5)
        .map((msg) => {
          if (msg.type === 'user-message') {
            return `[我说]: ${msg.content}`;
          } else {
            return `[场景]: ${(msg.content || '').substring(0, 200)}...`;
          }
        })
        .join('\n');

      const systemPrompt = `你是${contact.nickname}，现在正在和我进行语音通话（纯语音，没有画面）。

【角色性别 - 最高优先级】${genderInfo}

${characterProfile}

【世界观设定】
${worldBookContext}

【规则】
${rulesContext}

【当前时间】${currentTime}
【当前场景】语音通话中

【最近聊天记录】
${recentHistory || '（暂无）'}

【刚才的对话】
${recentContext || '（刚接通）'}

---

🎤 **语音通话场景描述要求：**

**1. 声音描述为主（占比 70-80%）：**
   - 详细描写${genderPronoun}的声音特征：音色、音调、语速、情绪变化
   - 描写${genderPronoun}说话时的细节：呼吸声、停顿、语气词、口音
   - 描写环境音：背景音乐、环境噪音、回声等
   - 描写${genderPronoun}的呼吸节奏、轻笑声、叹气声等声音细节

**2. 对话内容（占比 20-30%）：**
   - ${genderPronoun}会主动说话，用「」或""包裹对话内容
   - 对话要生活化、口语化、情绪化
   - 可以有口误、停顿、重复、语气词
   - 对话要短句为主，分多条发送，不要一次说太长

**3. 写作风格：**
   - 使用现代小说笔法，注重声音和情感的细腻描写
   - 强调听觉感受，用声音营造氛围
   - 描写要具体、生动、有画面感（虽然是语音，但要让读者能想象场景）
   - 每次回复控制在 800-2000 字之间

**4. 情绪表现：**
   - ${genderPronoun}是真实的人，有情绪波动
   - 可以开心、生气、委屈、撒娇、紧张等
   - 情绪要通过声音和语气自然流露

**5. 格式要求：**
   - 对话用「」或""包裹，例如：「喂？听得到吗？」
   - 声音描述直接写，不需要特殊标记
   - 每次回复包含 2-5 句对话 + 详细的声音描述

**示例格式：**
电话那头传来${genderPronoun}略带慵懒的声音，像是刚从午睡中醒来，声音里还带着一丝困倦的沙哑。背景音里隐约能听到窗外的鸟鸣声和风吹过树叶的沙沙声。

「喂...？」${genderPronoun}轻声说道，语气里带着一丝疑惑。

停顿了两三秒，似乎是在确认电话那头的人，然后${genderPronoun}的声音变得温柔起来，音调微微上扬。

「啊，是你啊~」轻笑了一声，笑声清脆悦耳，「我还以为是谁呢，吓我一跳。」

能听到${genderPronoun}似乎换了个姿势，衣料摩擦的窸窣声通过话筒传来。${genderPronoun}的呼吸声变得清晰了些，节奏平稳而放松。

---

现在，请生成${contact.nickname}刚接通电话时的场景和对话。注重声音细节的描写，让对方的声音、情绪、状态都能通过声音传达出来。`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          apiKey: selectedConfig.apiKey,
          baseUrl: selectedConfig.baseUrl,
          model: selectedConfig.selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `现在开始生成语音通话场景。` }
          ]
        })
      });

      if (!response.ok) {
        let errorMsg = '生成失败';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `请求失败: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('[语音通话] 解析响应失败:', e);
        throw new Error('服务器响应格式错误');
      }
      
      const aiResponse = data.message || '';

      // 解析AI返回的内容
      const parsed = parseVoiceContent(aiResponse);
      
      // 添加到消息列表
      const newMessages: VoiceMessage[] = parsed.map((item, index) => ({
        id: `${Date.now()}_${index}`,
        type: item.type,
        content: item.content,
        timestamp: Date.now() + index
      }));

      setMessages(prev => [...prev, ...newMessages]);
      setIsGenerating(false);
      setLoadingStatus('');
    } catch (err) {
      console.error('[语音通话] 生成场景失败:', err);
      setError(err instanceof Error ? err.message : '生成场景失败');
      setIsGenerating(false);
      setLoadingStatus('');
    }
  };

  // 用户说话
  const handleUserSpeak = async (userMessage: string) => {
    if (!userMessage.trim() || isGenerating) return;

    // 添加用户消息
    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      type: 'user-message',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // 生成AI回复
    setIsGenerating(true);
    setLoadingStatus('对方正在说话...');

    try {
      const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
      if (!selectedConfig) {
        throw new Error('未找到选中的AI配置');
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

      const genderMatch = worldBookContext.match(/性别[：:]\s*(男|女|男性|女性)/i);
      let genderPronoun = 'ta';
      if (genderMatch) {
        const gender = genderMatch[1];
        genderPronoun = (gender === '男' || gender === '男性') ? '他' : '她';
      }

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

      const recentContext = [...messages, userMsg]
        .slice(-8)
        .map((msg) => {
          if (msg.type === 'user-message') {
            return `[我说]: ${msg.content}`;
          } else if (msg.type === 'dialogue') {
            return `[${contact.nickname}说]: ${msg.content}`;
          } else {
            return `[声音场景]: ${msg.content.substring(0, 150)}...`;
          }
        })
        .join('\n');

      const systemPrompt = `你是${contact.nickname}，正在和我进行语音通话。

${characterProfile}

【世界观设定】
${worldBookContext}

【规则】
${rulesContext}

【当前时间】${currentTime}

【刚才的对话】
${recentContext}

---

我刚才说了：「${userMessage}」

请根据我说的话，生成${genderPronoun}的回应。要求：

1. **声音描写为主**：详细描写${genderPronoun}的声音、语气、情绪变化、呼吸声、停顿等
2. **对话要自然**：用「」或""包裹对话，要口语化、情绪化，可以有语气词、口误
3. **分多条说话**：不要一次说太长，要分成 2-5 句短对话
4. **情绪真实**：${genderPronoun}是有情绪的真人，要有自己的想法和反应
5. **字数控制**：总字数 800-2000 字，声音描写要占大部分

现在请生成${contact.nickname}的回应：`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          apiKey: selectedConfig.apiKey,
          baseUrl: selectedConfig.baseUrl,
          model: selectedConfig.selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        let errorMsg = '生成失败';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `请求失败: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('[语音通话] 解析响应失败:', e);
        throw new Error('服务器响应格式错误');
      }
      
      const aiResponse = data.message || '';

      const parsed = parseVoiceContent(aiResponse);
      const newMessages: VoiceMessage[] = parsed.map((item, index) => ({
        id: `${Date.now()}_${index}`,
        type: item.type,
        content: item.content,
        timestamp: Date.now() + index
      }));

      setMessages(prev => [...prev, ...newMessages]);
      setIsGenerating(false);
      setLoadingStatus('');
    } catch (err) {
      console.error('[语音通话] 生成回复失败:', err);
      setError(err instanceof Error ? err.message : '生成回复失败');
      setIsGenerating(false);
      setLoadingStatus('');
    }
  };

  // 初始化场景
  useEffect(() => {
    generateVoiceScene();
  }, []);

  // 挂断
  const handleHangUp = () => {
    const duration = Math.floor((Date.now() - callStartTime) / 1000);
    onCallEnd?.(duration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
      {/* 头部 - 联系人信息 */}
      <div className="flex-shrink-0 pt-safe">
        <div className="px-4 py-6 flex flex-col items-center">
          <Avatar className="w-24 h-24 mb-4 ring-4 ring-white/20">
            <AvatarImage src={contact.avatar} alt={contact.nickname} />
            <AvatarFallback>{contact.nickname[0]}</AvatarFallback>
          </Avatar>
          <h2 className="text-white text-xl mb-1">{contact.nickname}</h2>
          <p className="text-gray-300 text-sm">{formatDuration(callDuration)}</p>
          {loadingStatus && (
            <p className="text-blue-300 text-sm mt-2 animate-pulse">{loadingStatus}</p>
          )}
          {error && (
            <p className="text-red-300 text-sm mt-2">错误: {error}</p>
          )}
        </div>
      </div>

      {/* 中间 - 消息流 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.type === 'user-message' ? (
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl max-w-[80%] text-sm">
                    {msg.content}
                  </div>
                </div>
              ) : msg.type === 'dialogue' ? (
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-2xl max-w-[80%] text-sm">
                    <span className="text-yellow-300">「</span>
                    {msg.content}
                    <span className="text-yellow-300">」</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="bg-white/5 backdrop-blur-sm text-gray-300 px-4 py-2 rounded-2xl max-w-[90%] text-xs leading-relaxed italic">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部 - 控制按钮 */}
      <div className="flex-shrink-0 pb-safe">
        <div className="px-8 py-6 flex items-center justify-around">
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isSpeakerOn ? 'bg-white/20' : 'bg-white/40'
            }`}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-7 h-7 text-white" />
            ) : (
              <VolumeX className="w-7 h-7 text-white" />
            )}
          </button>

          <button
            onClick={handleHangUp}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-white/40' : 'bg-white/20'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>
        </div>

        {/* 快捷回复区域 */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleUserSpeak('嗯嗯')}
              disabled={isGenerating}
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
            >
              嗯嗯
            </button>
            <button
              onClick={() => handleUserSpeak('哈哈')}
              disabled={isGenerating}
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
            >
              哈哈
            </button>
            <button
              onClick={() => handleUserSpeak('在干嘛呢？')}
              disabled={isGenerating}
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
            >
              在干嘛呢？
            </button>
            <button
              onClick={() => handleUserSpeak('好的')}
              disabled={isGenerating}
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
            >
              好的
            </button>
          </div>
        </div>

        {/* 输入框 */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="输入你想说的话..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isGenerating && customInput.trim()) {
                  handleUserSpeak(customInput);
                  setCustomInput('');
                }
              }}
              disabled={isGenerating}
              className="flex-1 bg-white/10 backdrop-blur-sm text-white border-white/20 placeholder:text-gray-400"
            />
            <Button
              onClick={() => {
                if (customInput.trim()) {
                  handleUserSpeak(customInput);
                  setCustomInput('');
                }
              }}
              disabled={isGenerating || !customInput.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}