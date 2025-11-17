// AI角色记忆管理 - 让私聊和群聊记忆互通
import { WeChatFriend, WeChatGroup, ChatMessage } from '../components/WeChat';
import { Contact } from '../components/Contacts';

export interface MemoryMessage {
  content: string;
  timestamp: number;
  context: 'private' | 'group'; // 私聊还是群聊
  contextName: string; // 对话名称（好友名或群名）
  isMyMessage: boolean; // 是否是该AI角色发送的
  otherParticipants?: string[]; // 其他参与者（仅群聊）
}

/**
 * 获取AI角色的完整记忆（包括所有私聊和群聊）
 * @param aiContactId AI角色的联系人ID
 * @param friends 所有好友列表
 * @param groups 所有群组列表
 * @param userProfile 用户信息
 * @param allContacts 所有联系人
 * @param maxMessages 最多返回多少条记忆（默认50）
 */
export function getAiMemory(
  aiContactId: string,
  friends: WeChatFriend[],
  groups: WeChatGroup[],
  userProfile: { username: string },
  allContacts: Contact[],
  maxMessages: number = 50
): MemoryMessage[] {
  const memories: MemoryMessage[] = [];

  // 1. 收集私聊记忆
  const privateChatFriend = friends.find(f => f.contactId === aiContactId);
  if (privateChatFriend) {
    privateChatFriend.chatMessages.forEach(msg => {
      memories.push({
        content: msg.content,
        timestamp: msg.timestamp,
        context: 'private',
        contextName: `与${userProfile.username}的私聊`,
        isMyMessage: msg.senderId === aiContactId,
      });
    });
  }

  // 2. 收集群聊记忆（该AI参与的所有群聊）
  const groupsWithAi = groups.filter(g => g.memberIds.includes(aiContactId));
  
  groupsWithAi.forEach(group => {
    // 获取其他成员名称
    const otherMembers = group.memberIds
      .filter(id => id !== aiContactId)
      .map(id => {
        const contact = allContacts.find(c => c.id === id);
        return contact?.nickname || '成员';
      });

    group.chatMessages.forEach(msg => {
      const senderName = msg.senderId === 'me' 
        ? userProfile.username 
        : (allContacts.find(c => c.id === msg.senderId)?.nickname || '成员');

      memories.push({
        content: msg.content,
        timestamp: msg.timestamp,
        context: 'group',
        contextName: group.name,
        isMyMessage: msg.senderId === aiContactId,
        otherParticipants: otherMembers,
      });
    });
  });

  // 3. 按时间排序
  memories.sort((a, b) => a.timestamp - b.timestamp);

  // 4. 返回最近的N条记忆
  return memories.slice(-maxMessages);
}

/**
 * 将记忆格式化为AI可读的文本
 */
export function formatMemoryForAi(memories: MemoryMessage[], aiNickname: string): string {
  if (memories.length === 0) {
    return '暂无历史对话记录。';
  }

  const formattedMemories = memories.map(mem => {
    const time = new Date(mem.timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (mem.context === 'private') {
      return `[${time}][私聊] ${mem.isMyMessage ? '我' : '对方'}: ${mem.content}`;
    } else {
      const participants = mem.otherParticipants?.join('、') || '其他成员';
      return `[${time}][群聊:${mem.contextName}] ${mem.isMyMessage ? '我' : '其他人'}: ${mem.content}`;
    }
  });

  return `你的历史记忆（最近${memories.length}条）：\n${formattedMemories.join('\n')}`;
}

/**
 * 获取与当前对话相关的记忆摘要
 * @param aiContactId AI角色ID
 * @param currentContext 当前对话上下文：'private' 或群聊ID
 * @param friends 好友列表
 * @param groups 群组列表
 * @param userProfile 用户信息
 * @param allContacts 所有联系人
 * @param maxMemories 最多记住多少条（可选，使用角色资料里的上下文设置）
 * @param previewCount 跨场景预览条数（默认5条）
 */
export function getRelevantMemorySummary(
  aiContactId: string,
  currentContext: string, // 'private' 或群聊ID
  friends: WeChatFriend[],
  groups: WeChatGroup[],
  userProfile: { username: string },
  allContacts: Contact[],
  maxMemories?: number,  // 改为可选参数
  previewCount: number = 5
): string {
  // 如果没有提供maxMemories，使用默认值50（角色资料里的设置会控制实际使用的上下文）
  const allMemories = getAiMemory(aiContactId, friends, groups, userProfile, allContacts, maxMemories || 50);
  
  if (allMemories.length === 0) {
    return '';
  }

  // 统计信息
  const privateCount = allMemories.filter(m => m.context === 'private').length;
  const groupCount = allMemories.filter(m => m.context === 'group').length;
  const myMessageCount = allMemories.filter(m => m.isMyMessage).length;

  // 获取其他对话场景的记忆
  let otherContextMemories: MemoryMessage[] = [];
  
  if (currentContext === 'private') {
    // 如果当前是私聊，提取群聊记忆
    otherContextMemories = allMemories.filter(m => m.context === 'group').slice(-previewCount);
  } else {
    // 如果当前是群聊，提取私聊记忆
    otherContextMemories = allMemories.filter(m => m.context === 'private').slice(-previewCount);
  }

  if (otherContextMemories.length === 0) {
    return '';
  }

  const otherContextSummary = otherContextMemories.map(mem => {
    const time = new Date(mem.timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const content = mem.content || '[消息]';
    if (mem.context === 'private') {
      return `  - [${time}] 私聊中${mem.isMyMessage ? '我说' : '对方说'}：${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`;
    } else {
      return `  - [${time}] 在「${mem.contextName}」群聊中：${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`;
    }
  }).join('\n');

  return `
【记忆互通】你和这些人不只在这里有互动，你们${currentContext === 'private' ? '在群聊' : '私聊'}中也聊过天：
${otherContextSummary}

💡 重要提示：
- 你可以自然地提及这些记忆，比如"诶对了，之前${currentContext === 'private' ? '在群里' : '私聊时'}咱们说的那个..."
- 如果对方提到的话题和你的记忆有关，要能想起来并提及
- 保持记忆的连贯性，让对话更真实
- 不要说"根据我的记忆"这种AI式的话，要自然地说"我记得..."、"之前..."等`;
}