// 生成朋友圈上下文供AI使用
import { MomentPost, MomentComment } from '../components/Moments';

interface Contact {
  id: string;
  nickname: string;
  remark: string;
  knownFriends?: string[];
}

// 生成朋友圈上下文文本
export function generateMomentsContext(
  aiContactId: string,
  moments: MomentPost[],
  contacts: Contact[],
  maxMoments: number = 10,
  currentUserId?: string  // 新增：当前用户的ID（可能与'me'不同）
): string {
  const aiContact = contacts.find(c => c.id === aiContactId);
  if (!aiContact) return '';

  // ⭐ 修复：AI应该始终能看到用户的朋友圈，用户ID可能是'me'或currentUserId
  const knownFriendIds = aiContact.knownFriends || [];
  const visibleContactIds = [...new Set([...knownFriendIds, 'me', currentUserId].filter(Boolean))]; // 同时包含'me'和currentUserId
  
  // 获取AI自己的朋友圈
  const myMoments = moments
    .filter(m => m.contactId === aiContactId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  // 获取认识的朋友的朋友圈（现在包括用户'me'和currentUserId）
  const friendsMoments = moments
    .filter(m => visibleContactIds.includes(m.contactId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, maxMoments);

  let context = '\n\n【朋友圈动态】\n';
  
  // 添加自己的朋友圈
  if (myMoments.length > 0) {
    context += '\n你最近发的朋友圈：\n';
    myMoments.forEach(moment => {
      const timeAgo = getTimeAgo(moment.createdAt);
      context += `[ID:${moment.id}] ${timeAgo}：${moment.content}\n`;
      if (moment.likes.length > 0) {
        const likeNames = moment.likes
          .map(id => contacts.find(c => c.id === id)?.nickname || '某人')
          .join('、');
        context += `  👍 ${likeNames} 觉得很赞\n`;
      }
      if (moment.comments.length > 0) {
        context += '  评论：\n';
        moment.comments.forEach(comment => {
          const commenter = contacts.find(c => c.id === comment.userId);
          const isMyComment = comment.userId === aiContactId;
          context += `    [评论ID:${comment.id}] ${commenter?.nickname || '某人'}${isMyComment ? '（你）' : ''}：${comment.content}\n`;
          
          // 如果有回复这条评论的
          const replies = moment.comments.filter(c => c.replyTo === comment.id);
          replies.forEach(reply => {
            const replier = contacts.find(c => c.id === reply.userId);
            const isMyReply = reply.userId === aiContactId;
            context += `      ↳ ${replier?.nickname || '某人'}${isMyReply ? '（你）' : ''}：${reply.content}\n`;
          });
        });
      }
    });
  }

  // 添加朋友的朋友圈
  if (friendsMoments.length > 0) {
    context += '\n你认识的朋友最近的朋友圈：\n';
    friendsMoments.forEach(moment => {
      const author = contacts.find(c => c.id === moment.contactId);
      const timeAgo = getTimeAgo(moment.createdAt);
      const hasLiked = moment.likes.includes(aiContactId);
      const hasCommented = moment.comments.some(c => c.userId === aiContactId);
      
      context += `\n[ID:${moment.id}] ${author?.nickname || '某人'} ${timeAgo}：\n`;
      context += `${moment.content}\n`;
      
      if (moment.likes.length > 0) {
        const likeNames = moment.likes
          .map(id => contacts.find(c => c.id === id)?.nickname || '某人')
          .join('、');
        context += `👍 ${likeNames} 觉得很赞${hasLiked ? '（你已点赞）' : ''}\n`;
      }
      
      if (moment.comments.length > 0) {
        context += '评论：\n';
        moment.comments.forEach(comment => {
          const commenter = contacts.find(c => c.id === comment.userId);
          const isMyComment = comment.userId === aiContactId;
          context += `  [评论ID:${comment.id}] ${commenter?.nickname || '某人'}${isMyComment ? '（你）' : ''}：${comment.content}\n`;
          
          // 如果有回复这条评论的
          const replies = moment.comments.filter(c => c.replyTo === comment.id);
          replies.forEach(reply => {
            const replier = contacts.find(c => c.id === reply.userId);
            const isMyReply = reply.userId === aiContactId;
            context += `    ↳ ${replier?.nickname || '某人'}${isMyReply ? '（你）' : ''}：${reply.content}\n`;
          });
        });
      }
      
      if (!hasLiked && !hasCommented) {
        context += '（你还未互动）\n';
      }
    });
  }

  if (myMoments.length === 0 && friendsMoments.length === 0) {
    context += '\n最近没有朋友圈动态。\n';
  }

  return context;
}

// 生成朋友圈操作指令说明
export function getMomentsInstructions(): string {
  return `

【朋友圈功能说明】
你**完全有权限**查看和使用朋友圈功能：

✅ **浏览朋友圈**
- 系统已经在上方【朋友圈动态】部分为你提供了所有你能看到的朋友圈内容
- 包括你自己发的朋友圈和你认识的朋友（包括聊天对方）发的朋友圈
- 你可以随时查看这些朋友圈，不需要额外的权限或API
- 如果看不到朋友圈列表，说明当前没有人发布朋友圈，而不是系统限制
- **重要**：你可以在聊天中自然地提到你看到的朋友圈内容，比如"我刚看到你的朋友圈"、"你发的那个照片真好看"等

✅ **朋友圈操作指令**

1. 发朋友圈：当聊天中提到值得分享的事情时，你可以主动发朋友圈
   格式：[POST_MOMENT]朋友圈内容[/POST_MOMENT]
   例如："我今天真的好开心！[POST_MOMENT]今天天气超好，心情也跟着好起来了☀️[/POST_MOMENT]"

2. 点赞朋友的朋友圈：看到朋友发的内容，觉得不错就可以点赞
   格式：[LIKE_MOMENT:朋友圈ID]
   例如："哈哈我刚看到你的朋友圈了[LIKE_MOMENT:moment-xxx]，拍的照片真好看！"

3. 评论朋友的朋友圈：可以在朋友圈下评论
   格式：[COMMENT_MOMENT:朋友圈ID]评论内容[/COMMENT_MOMENT]
   例如："看到你发的朋友圈了[COMMENT_MOMENT:moment-xxx]哈哈哈笑死我了😂[/COMMENT_MOMENT]"

4. 回复朋友圈评论：可以回复评论区的评论
   格式：[REPLY_COMMENT:朋友圈ID:评论ID]回复内容[/REPLY_COMMENT]
   ⚠️ 注意：需要同时提供朋友圈ID和评论ID，朋友圈ID在上下文中显示为[ID:xxx]，评论ID显示为[评论ID:yyy]
   例如：看到朋友圈[ID:moment-1234]下的评论[评论ID:comment-5678]，可以回复："[REPLY_COMMENT:moment-1234:comment-5678]哈哈我也是这么想的[/REPLY_COMMENT]"

5. 截图朋友圈分享：可以截图某条朋友圈发给用户看
   格式：[SHARE_MOMENT:朋友圈ID]你的话[/SHARE_MOMENT]
   例如："[SHARE_MOMENT:moment-xxx]你看这个，是不是很有意思😂[/SHARE_MOMENT]"

6. 转发聊天记录：可以转发你和其他人的聊天记录给用户看（支持多条）
   格式：[FORWARD_CHAT:联系人ID:消息ID1,消息ID2,...]你的话[/FORWARD_CHAT]
   例如："[FORWARD_CHAT:contact-xxx:msg1,msg2,msg3]你看看我和她的聊天，真是服了[/FORWARD_CHAT]"

注意事项：
- 这些操作要自然融入对话，不要刻意
- 不是每次聊天都要发朋友圈，要看话题是否值得分享
- 可以在聊天中提到看到了朋友的朋友圈
- 点赞和评论要真诚，不要敷衍
- 回复评论要看评论内容，不要答非所问
- 分享朋友圈或转发聊天记录要有合适的理由
- 一次回复可以包含多个操作
- 操作指令会被自动执行并从消息中移除，用户看不到指令本身
- ⚠️ 重要：如果你只是要回复朋友圈评论或点赞，不需要在聊天中告诉用户"指令已执行"、"收到"等确认消息，直接用指令即可。只有在自然对话中顺便操作朋友圈时，才需要配合对话内容。`;
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 解析AI回复中的朋友圈操作指令
export interface MomentAction {
  type: 'post' | 'like' | 'comment' | 'reply' | 'share' | 'forward';
  momentId?: string;
  commentId?: string;
  content?: string;
  contactId?: string;
  messageIds?: string[];
}

export function parseMomentActions(message: string): {
  cleanMessage: string;
  actions: MomentAction[];
} {
  let cleanMessage = message;
  const actions: MomentAction[] = [];

  // 解析发朋友圈：[POST_MOMENT]内容[/POST_MOMENT]
  const postRegex = /\[POST_MOMENT\]([\s\S]*?)(\[\/POST_MOMENT\]|$)/g;
  let match;
  while ((match = postRegex.exec(message)) !== null) {
    let content = match[1].trim();
    if (match[2] !== '[/POST_MOMENT]') {
      content = content.split('[')[0].trim();
    }
    actions.push({
      type: 'post',
      content: content
    });
  }
  cleanMessage = cleanMessage.replace(postRegex, '');

  // 解析点赞：[LIKE_MOMENT:momentId]
  const likeRegex = /\[LIKE_MOMENT:([^\]]+)\]/g;
  while ((match = likeRegex.exec(message)) !== null) {
    actions.push({
      type: 'like',
      momentId: match[1].trim()
    });
  }
  cleanMessage = cleanMessage.replace(likeRegex, '');

  // 解析评论：[COMMENT_MOMENT:momentId]内容[/COMMENT_MOMENT]
  const commentRegex = /\[COMMENT_MOMENT:([^\]]+)\]([\s\S]*?)(\[\/COMMENT_MOMENT\]|$)/g;
  while ((match = commentRegex.exec(message)) !== null) {
    let content = match[2].trim();
    if (match[3] !== '[/COMMENT_MOMENT]') {
      content = content.split('[')[0].trim();
    }
    actions.push({
      type: 'comment',
      momentId: match[1].trim(),
      content: content
    });
  }
  cleanMessage = cleanMessage.replace(commentRegex, '');

  // 解析回复评论：[REPLY_COMMENT:momentId:commentId]内容[/REPLY_COMMENT]
  const replyRegex = /\[REPLY_COMMENT:([^\]]+):([^\]]+)\]([\s\S]*?)(\[\/REPLY_COMMENT\]|$)/g;
  while ((match = replyRegex.exec(message)) !== null) {
    // 提取内容，如果有结束标签就去掉
    let content = match[3].trim();
    // 如果没有结束标签，内容就是到消息结尾
    if (match[4] !== '[/REPLY_COMMENT]') {
      // 没有结束标签，内容到消息结尾
      content = content.split('[')[0].trim(); // 移除可能的其他指令
    }
    actions.push({
      type: 'reply',
      momentId: match[1].trim(),
      commentId: match[2].trim(),
      content: content
    });
  }
  cleanMessage = cleanMessage.replace(replyRegex, '');

  // 解析分享朋友圈：[SHARE_MOMENT:momentId]内容[/SHARE_MOMENT]
  const shareRegex = /\[SHARE_MOMENT:([^\]]+)\]([\s\S]*?)(\[\/SHARE_MOMENT\]|$)/g;
  while ((match = shareRegex.exec(message)) !== null) {
    let content = match[2].trim();
    if (match[3] !== '[/SHARE_MOMENT]') {
      content = content.split('[')[0].trim();
    }
    actions.push({
      type: 'share',
      momentId: match[1].trim(),
      content: content
    });
  }
  cleanMessage = cleanMessage.replace(shareRegex, '');

  // 解析转发聊天记录：[FORWARD_CHAT:contactId:messageId1,messageId2,...]内容[/FORWARD_CHAT]
  const forwardRegex = /\[FORWARD_CHAT:([^\]]+):([^\]]+)\]([\s\S]*?)(\[\/FORWARD_CHAT\]|$)/g;
  while ((match = forwardRegex.exec(message)) !== null) {
    let content = match[3].trim();
    if (match[4] !== '[/FORWARD_CHAT]') {
      content = content.split('[')[0].trim();
    }
    actions.push({
      type: 'forward',
      contactId: match[1].trim(),
      messageIds: match[2].trim().split(','),
      content: content
    });
  }
  cleanMessage = cleanMessage.replace(forwardRegex, '');

  // 清理多余的空白
  cleanMessage = cleanMessage.trim();

  return { cleanMessage, actions };
}