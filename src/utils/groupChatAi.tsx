// 群聊AI回复工具函数 - 真实群聊体验版本
import { Contact } from '../components/Contacts';
import { WeChatGroup, ChatMessage, WeChatFriend } from '../components/WeChat';
import { projectId } from './supabase/info';
import { getRelevantMemorySummary } from './aiMemory';

interface UserProfile {
  username: string;
}

interface ApiConfig {
  id: string;
  type: string;
  baseUrl?: string;
  apiKey: string;
  selectedModel?: string;
}

export async function generateGroupChatMessages(
  group: WeChatGroup,
  aiMembers: Contact[],
  userProfile: UserProfile,
  selectedConfig: ApiConfig,
  accessToken: string | null,
  getDateAndScheduleContext: (id: string) => string,
  allContacts?: Contact[],
  allFriends?: WeChatFriend[],
  allGroups?: WeChatGroup[],
  memoryCount?: number,  // 可选，使用角色资料里的设置
  memoryPreviewCount: number = 5  // 跨场景预览条数
): Promise<Array<{ sender: string; content: string }>> {
  
  // 获取所有群成员信息列表（包括非AI成员）
  const allMembers = allContacts 
    ? group.memberIds.map(id => allContacts.find(c => c.id === id)).filter(Boolean)
    : aiMembers;
  
  const groupMembersInfo = allMembers
    .map(c => `- ${c!.realName || c!.nickname}（昵称：${c!.nickname}，@时用@${c!.nickname}）`)
    .join('\n');

  // 构建系统提示词
  const systemPrompt = `你正在模拟一个真实的微信群聊场景。这个群有以下成员：

**群成员：**
${groupMembersInfo}
- ${userProfile.username}（用户本人，即{{user}}）

**AI角色（你需要扮演）：**
${aiMembers.map(ai => {
  // 🧠 为每个AI获取记忆摘要
  let memoryInfo = '';
  if (allFriends && allGroups && allContacts) {
    const memory = getRelevantMemorySummary(
      ai.id,
      group.id,
      allFriends,
      allGroups,
      userProfile,
      allContacts,
      memoryCount,
      memoryPreviewCount
    );
    if (memory) {
      memoryInfo = `\n  ${memory.replace(/\n/g, '\n  ')}`;
    }
  }
  
  return `- ${ai.nickname}（真实姓名：${ai.realName}${ai.personality ? `，性格：${ai.personality}` : ''}${ai.age ? `，${ai.age}岁` : ''}${ai.occupation ? `，职业：${ai.occupation}` : ''}）${memoryInfo}`;
}).join('\n')}

${getDateAndScheduleContext('group')}

**重要指示：**
1. 【多人互动】你需要模拟群里多个AI成员的自然对话，每次生成4-15条消息（根据话题热度灵活调整）
2. 【真实感】模仿真实群聊：
   - 不要固定顺序，随机决定谁先说话
   - 有人可能连发2-3条消息
   - 可以互相@回复：@昵称 你说的对
   - 可以接话、抢话、插话
   - 话题可以延伸和转移
3. 【每个人都重要】认真阅读并回应{{user}}（${userProfile.username}）的消息，不要忽视用户
4. 【主动互动】要主动cue {{user}}，比如"@${userProfile.username} 你觉得呢"
5. 【角色扮演】严格按照每个AI的性格特点说话：
   - 用他们各自的语言风格
   - 可以打错别字、用缩写、用表情符号
   - 情绪化、口语化
6. 【输出格式】每条消息用以下格式：
   <角色昵称>消息内容</角色昵称>
   
   例如：
   <M鹿M>哈哈哈哈哈笑死我了</M鹿M>
   <M鹿M>@pcy 你也太逗了吧😂</M鹿M>
   <pcy>啊？我说错了吗哈哈</pcy>

7. 【禁止事项】
   - 不要说"好的，我准备好了"这种元对话
   - 不要暴露自己是AI
   - 不要机械地按顺序发言
   - 不要忽略{{user}}的消息
8. 【红包功能】群聊里可以发红包活跃气氛、庆祝节日、发福利等
   - 输出格式：<角色昵称><REDPACKET>总金额|留言|类型|个数</REDPACKET></角色昵称>
   - 普通红包：<M鹿M><REDPACKET>100|新年快乐|normal|10</REDPACKET></M鹿M>（总金额100，平分成10份）
   - 拼手气红包：<pcy><REDPACKET>88|生日快乐|lucky|8</REDPACKET></pcy>（总金额88，随机分成8份）
   - 红包留言要温馨有趣（如"生日快乐"、"恭喜发财"、"么么哒"等）
   - 不要频繁发红包，要在特殊时刻使用才有意义
   - 红包金额建议：小红包5-20元，普通红包50-200元，大红包500-1000元

请基于最近的聊天记录，生成一段自然的群聊对话（4-15条消息）。`;

  // 获取最近的聊天记录
  const recentMessages = group.chatMessages.slice(-20).map(msg => {
    // 处理没有content的消息
    const content = msg.content || '[消息]';
    
    if (msg.senderId === 'me') {
      return `${userProfile.username}: ${content}`;
    }
    const sender = allContacts?.find(c => c.id === msg.senderId) || aiMembers.find(ai => ai.id === msg.senderId);
    const senderName = sender?.nickname || '成员';
    return `${senderName}: ${content}`;
  }).join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `最近的聊天记录：\n${recentMessages}\n\n请生成群聊对话（4-15条消息，使用<昵称>消息</昵称>格式）：` }
  ];

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
  const authToken = accessToken || (await import('./supabase/info')).publicAnonKey;

  // 创建带超时的fetch（240秒 = 4分钟）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: selectedConfig.type,
        baseUrl: selectedConfig.baseUrl,
        apiKey: selectedConfig.apiKey,
        model: selectedConfig.selectedModel,
        messages: messages
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.message) {
      console.error('❌ [群聊AI] API返回格式错误:', data);
      throw new Error('AI没有返回消息内容');
    }

    // 解析AI返回的消息
    const aiResponse = data.message;
    console.log('🎭 [群聊AI] 原始回复:', aiResponse);
    console.log('🎭 [群聊AI] 回复长度:', aiResponse.length);

    // 提取所有消息：<角色昵称>消息内容</角色昵称>
    const messageRegex = /<([^>]+)>([\s\S]*?)<\/\1>/g;
    const parsedMessages: Array<{ sender: string; content: string }> = [];
    let match;

    while ((match = messageRegex.exec(aiResponse)) !== null) {
      const senderNickname = match[1].trim();
      const content = match[2].trim();
      
      console.log('🔍 [群聊AI] 提取到消息:', { senderNickname, contentLength: content.length });
      
      if (content) {
        // 查找对应的联系人
        const contact = aiMembers.find(ai => ai.nickname === senderNickname);
        if (contact) {
          parsedMessages.push({
            sender: contact.id,
            content: content
          });
          console.log('✅ [群聊AI] 匹配到AI成员:', contact.nickname, '(', contact.id, ')');
        } else {
          console.warn('⚠️ [群聊AI] 未找到对应的AI成员:', senderNickname);
          console.warn('⚠️ [群聊AI] 可用的AI成员:', aiMembers.map(ai => ai.nickname).join(', '));
        }
      }
    }

    console.log('📝 [群聊AI] 解析出的消息:', parsedMessages.length, '条');

    if (parsedMessages.length === 0) {
      console.error('❌ [群聊AI] 无法解析消息。原始回复:', aiResponse);
      console.error('❌ [群聊AI] AI成员列表:', aiMembers.map(ai => `${ai.nickname} (${ai.id})`).join(', '));
      
      // 尝试备用解析方法：直接生成一条消息
      if (aiMembers.length > 0 && aiResponse.trim()) {
        console.log('🔄 [群聊AI] 尝试备用方案：将整个回复作为第一个AI成员的消息');
        // 选择一个随机的AI成员来发送这条消息
        const randomAi = aiMembers[Math.floor(Math.random() * aiMembers.length)];
        parsedMessages.push({
          sender: randomAi.id,
          content: aiResponse.trim()
        });
        console.log('✅ [群聊AI] 备用方案：由', randomAi.nickname, '发送消息');
      } else {
        throw new Error('AI返回的消息格式不正确，且无法使用备用方案');
      }
    }

    // 限制消息数量在4-15条之间
    return parsedMessages.slice(0, 15);
  } catch (error) {
    clearTimeout(timeoutId);
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ [群聊AI] 请求超时（240秒）');
      throw new Error('AI响应超时（4分钟）。请稍后再试或减少群聊消息历史长度。');
    }
    throw error;
  }
}