import { useEffect, useRef } from 'react';
import { MomentPost, MomentComment } from './Moments';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Contact {
  id: string;
  avatar: string;
  nickname: string;
  remark: string;
  personality?: string;
  experience?: string;
  hobbies?: string;
  knownFriends?: string[];
  isAi?: boolean; // 添加AI标识
}

interface ApiConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'custom' | 'google';
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
}

interface AiMomentsConfig {
  autoPostEnabled: boolean;
  autoPostContactIds: string[];
  postIntervalMin: number;
  postIntervalMax: number;
  autoLikeEnabled: boolean;
  autoLikeContactIds: string[];
  likeChance: number;
  autoCommentEnabled: boolean;
  autoCommentContactIds: string[];
  commentChance: number;
}

interface AiMomentsManagerProps {
  config: AiMomentsConfig;
  contacts: Contact[];
  moments: MomentPost[];
  onMomentsChange: (moments: MomentPost[]) => void;
  apiConfigs: ApiConfig[];
  selectedApiId: string;
  currentUserId: string; // 当前登录用户ID
}

export function AiMomentsManager({
  config,
  contacts,
  moments,
  onMomentsChange,
  apiConfigs,
  selectedApiId,
  currentUserId
}: AiMomentsManagerProps) {
  const postTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastPostTimeRef = useRef<Map<string, number>>(new Map());
  const processedMomentsRef = useRef<Set<string>>(new Set()); // 记录已处理过的朋友圈
  const processedCommentsRef = useRef<Set<string>>(new Set()); // 记录已处理过的评论

  // 生成朋友圈内容
  const generateMomentContent = async (contact: Contact): Promise<string> => {
    const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
    
    console.log('🔍 [朋友圈生成] 配置检查:', {
      apiConfigsCount: apiConfigs.length,
      selectedApiId,
      selectedConfig: selectedConfig ? {
        id: selectedConfig.id,
        name: selectedConfig.name,
        type: selectedConfig.type,
        hasApiKey: !!selectedConfig.apiKey,
        hasSelectedModel: !!selectedConfig.selectedModel,
        selectedModel: selectedConfig.selectedModel
      } : 'NOT_FOUND'
    });
    
    if (!selectedConfig || !selectedConfig.apiKey) {
      console.error('❌ [朋友圈生成] 未找到有效的API配置');
      return '';
    }
    
    // 验证API配置完整性
    if (!selectedConfig.selectedModel) {
      console.error(`❌ [朋友圈] AI配置\"${selectedConfig.name}\"未选择模型`);
      return '';
    }
    
    // 再次验证type字段
    if (!selectedConfig.type) {
      console.error(`❌ [朋友圈] AI配置\"${selectedConfig.name}\"缺少type字段`);
      return '';
    }

    try {
      const systemPrompt = `你是${contact.nickname}${contact.personality ? `，性格：${contact.personality}` : ''}${contact.hobbies ? `，兴趣：${contact.hobbies}` : ''}。
请以${contact.nickname}的身份，发一条真实自然的朋友圈动态。

要求：
1. 内容要符合这个角色的性格和兴趣
2. 可以是日常生活、心情感悟、分享照片/视频、转发文章等
3. 语气要自然、口语化，可以有表情符号
4. 长度控制在10-100字之间
5. 不要太正式，要像真实的朋友圈
6. 可以偶尔打错字、用���络用语

只需要输出朋友圈文字内容，不要其他说明。`;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            type: selectedConfig.type,
            apiKey: selectedConfig.apiKey,
            baseUrl: selectedConfig.baseUrl || '',
            model: selectedConfig.selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '发一条朋友圈吧' }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error('AI生成失败');
      }

      const data = await response.json();
      return data.message || data.messages?.[0] || '';
    } catch (error) {
      console.error('生成朋友圈内容失败:', error);
      return '';
    }
  };

  // 生成AI评论
  const generateComment = async (
    contact: Contact,
    post: MomentPost,
    postAuthor: Contact
  ): Promise<string> => {
    const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
    
    console.log('🔍 [评论生成] 配置检查:', {
      apiConfigsCount: apiConfigs.length,
      selectedApiId,
      selectedConfig: selectedConfig ? {
        id: selectedConfig.id,
        name: selectedConfig.name,
        type: selectedConfig.type,
        hasApiKey: !!selectedConfig.apiKey,
        hasSelectedModel: !!selectedConfig.selectedModel,
        selectedModel: selectedConfig.selectedModel
      } : 'NOT_FOUND'
    });
    
    if (!selectedConfig || !selectedConfig.apiKey) {
      console.error('❌ [评论生成] 未找到有效的API配置');
      return '';
    }

    // 验证API配置完整性
    if (!selectedConfig.selectedModel) {
      console.error(`❌ [朋友圈评论] AI配置\"${selectedConfig.name}\"未选择模型`);
      return '';
    }
    
    // 再次验证type字段
    if (!selectedConfig.type) {
      console.error(`❌ [朋友圈评论] AI配置\"${selectedConfig.name}\"缺少type字段`);
      return '';
    }

    try {
      const systemPrompt = `你是${contact.nickname}${contact.personality ? `，性格：${contact.personality}` : ''}。
你的好友${postAuthor.nickname}刚发了一条朋友圈：
"${post.content}"

请以${contact.nickname}的身份，给这条朋友圈写一条评论。

要求：
1. 评论要符合你的性格
2. 语气要自然、口语化
3. 长度控制在5-30字
4. 可以用表情符号
5. 可以开玩笑、调侃、鼓励等
6. 要像真实朋友之间的互动
7. 可以偶尔打错字

只需要输出评论内容，不要其他说明。`;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            type: selectedConfig.type,
            apiKey: selectedConfig.apiKey,
            baseUrl: selectedConfig.baseUrl || '',
            model: selectedConfig.selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '写一条评论吧' }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error('AI生成失败');
      }

      const data = await response.json();
      return data.message || data.messages?.[0] || '';
    } catch (error) {
      console.error('生成评论失败:', error);
      return '';
    }
  };

  // AI发朋友圈
  const postMoment = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    console.log(`🎭 ${contact.nickname} 准备发朋友圈...`);

    const content = await generateMomentContent(contact);
    if (!content) {
      console.log('❌ 朋友圈内容生成失败');
      return;
    }

    const newMoment: MomentPost = {
      id: `moment-${Date.now()}-${Math.random()}`,
      contactId: contact.id,
      content,
      images: [], // 暂时不添加图片
      likes: [],
      comments: [],
      createdAt: Date.now()
    };

    onMomentsChange([newMoment, ...moments]);
    console.log(`✅ ${contact.nickname} 发布了朋友圈: ${(content || '').substring(0, 30)}...`);

    // 更新最后发布时间
    lastPostTimeRef.current.set(contactId, Date.now());
  };

  // 调度AI发朋友圈
  const schedulePost = (contactId: string) => {
    // 清除旧的定时器
    const oldTimer = postTimersRef.current.get(contactId);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }

    // 计算随机间隔
    const interval = Math.random() * (config.postIntervalMax - config.postIntervalMin) + config.postIntervalMin;
    
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      console.log(`⏰ 为 ${contact.nickname} 设置朋友圈定时器: ${Math.round(interval / 60)} 分钟后`);
    }

    const timer = setTimeout(() => {
      postMoment(contactId);
      // 发完后继续调度下一次
      schedulePost(contactId);
    }, interval * 1000);

    postTimersRef.current.set(contactId, timer);
  };

  // AI点赞
  const likePost = (post: MomentPost, aiContactId: string) => {
    // 检查是否已经点过赞
    if (post.likes.includes(aiContactId)) return;

    // 概率判断
    if (Math.random() > config.likeChance) return;

    const updatedMoments = moments.map(m => {
      if (m.id === post.id) {
        return {
          ...m,
          likes: [...m.likes, aiContactId]
        };
      }
      return m;
    });

    onMomentsChange(updatedMoments);

    const aiContact = contacts.find(c => c.id === aiContactId);
    const postAuthor = contacts.find(c => c.id === post.contactId);
    if (aiContact && postAuthor) {
      console.log(`👍 ${aiContact.nickname} 点赞了 ${postAuthor.nickname} 的朋友圈`);
    }
  };

  // AI评论
  const commentPost = async (post: MomentPost, aiContactId: string) => {
    // 检查是否已经评论过
    if (post.comments.some(c => c.userId === aiContactId)) return;

    // 概率判断
    if (Math.random() > config.commentChance) return;

    const aiContact = contacts.find(c => c.id === aiContactId);
    const postAuthor = contacts.find(c => c.id === post.contactId);
    if (!aiContact || !postAuthor) return;

    const commentContent = await generateComment(aiContact, post, postAuthor);
    if (!commentContent) return;

    const newComment: MomentComment = {
      id: `comment-${Date.now()}-${Math.random()}`,
      userId: aiContactId,
      content: commentContent,
      createdAt: Date.now()
    };

    const updatedMoments = moments.map(m => {
      if (m.id === post.id) {
        return {
          ...m,
          comments: [...m.comments, newComment]
        };
      }
      return m;
    });

    onMomentsChange(updatedMoments);
    console.log(`💬 ${aiContact.nickname} 评论了 ${postAuthor.nickname} 的朋友圈: ${commentContent}`);
  };

  // AI回复评论
  const replyToComment = async (
    post: MomentPost,
    comment: MomentComment,
    aiContactId: string
  ) => {
    const aiContact = contacts.find(c => c.id === aiContactId);
    const commenter = contacts.find(c => c.id === comment.userId);
    if (!aiContact || !commenter) return;

    const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
    
    console.log('🔍 [评论回复] 配置检查:', {
      apiConfigsCount: apiConfigs.length,
      selectedApiId,
      selectedConfig: selectedConfig ? {
        id: selectedConfig.id,
        name: selectedConfig.name,
        type: selectedConfig.type,
        hasApiKey: !!selectedConfig.apiKey,
        hasSelectedModel: !!selectedConfig.selectedModel,
        selectedModel: selectedConfig.selectedModel
      } : 'NOT_FOUND'
    });
    
    if (!selectedConfig || !selectedConfig.apiKey) {
      console.error('❌ [评论回复] 未找到有效的API配置');
      return;
    }

    // 验证API配置完整性
    if (!selectedConfig.selectedModel) {
      console.error(`❌ [朋友圈回复] AI配置\"${selectedConfig.name}\"未选择模型`);
      return;
    }
    
    // 再次验证type字段
    if (!selectedConfig.type) {
      console.error(`❌ [朋友圈回复] AI配置\"${selectedConfig.name}\"缺少type字段`);
      return;
    }

    try {
      const systemPrompt = `你是${aiContact.nickname}${aiContact.personality ? `，性格：${aiContact.personality}` : ''}。

你刚发了一条朋友圈：
"${post.content}"

你的好友${commenter.nickname}评论了：
"${comment.content}"

请以${aiContact.nickname}的身份回复这条评论。

要求：
1. 回复要符合你的性格
2. 语气要自然、口语化、亲切
3. 长度控制在5-30字
4. 可以用表情符号
5. 要像真实朋友之间的互动
6. 可以开玩笑、感谢、调侃等
7. 可以偶尔打错字

只需要输出回复内容，不要其他说明。`;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            type: selectedConfig.type,
            apiKey: selectedConfig.apiKey,
            baseUrl: selectedConfig.baseUrl || '',
            model: selectedConfig.selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '回复这条评论吧' }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error('AI生成失败');
      }

      const data = await response.json();
      const replyContent = data.message || data.messages?.[0] || '';
      
      if (!replyContent) return;

      const newReply: MomentComment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        userId: aiContactId,
        content: replyContent,
        replyTo: comment.id,
        createdAt: Date.now()
      };

      const updatedMoments = moments.map(m => {
        if (m.id === post.id) {
          return {
            ...m,
            comments: [...m.comments, newReply]
          };
        }
        return m;
      });

      onMomentsChange(updatedMoments);
      console.log(`💬 ${aiContact.nickname} 回复了 ${commenter.nickname} 的评论: ${replyContent}`);
    } catch (error) {
      console.error('生成回复失败:', error);
    }
  };

  // 处理新朋友圈的互动
  useEffect(() => {
    if (!config.autoLikeEnabled && !config.autoCommentEnabled) return;

    // 找出新的朋友圈（未处理过的）
    const newMoments = moments.filter(m => !processedMomentsRef.current.has(m.id));
    
    if (newMoments.length === 0) return;

    console.log(`📱 发现 ${newMoments.length} 条新朋友圈`);

    newMoments.forEach(post => {
      // 标记为已处理
      processedMomentsRef.current.add(post.id);

      // 如果是用户自己发的，跳过
      if (post.contactId === currentUserId) return;

      const postAuthor = contacts.find(c => c.id === post.contactId);
      if (!postAuthor) return;

      // 找出所有认识发布者的AI
      const interestedAiIds = contacts
        .filter(c => {
          // 必须是启用了互动的AI
          const isLikeEnabled = config.autoLikeEnabled && config.autoLikeContactIds.includes(c.id);
          const isCommentEnabled = config.autoCommentEnabled && config.autoCommentContactIds.includes(c.id);
          
          if (!isLikeEnabled && !isCommentEnabled) return false;

          // 必须认识发布者
          return c.knownFriends?.includes(post.contactId);
        })
        .map(c => c.id);

      if (interestedAiIds.length === 0) return;

      console.log(`👥 ${interestedAiIds.length} 个AI认识 ${postAuthor.nickname}`);

      // 随机延迟一段时间后进行互动（模拟真实查看朋友圈的时间）
      interestedAiIds.forEach((aiId, index) => {
        const delay = Math.random() * 60000 + index * 5000; // 0-60秒随机延迟 + 递增延迟

        setTimeout(() => {
          // 先尝试点赞
          if (config.autoLikeEnabled && config.autoLikeContactIds.includes(aiId)) {
            likePost(post, aiId);
          }

          // 再尝试评论（延迟一点）
          if (config.autoCommentEnabled && config.autoCommentContactIds.includes(aiId)) {
            setTimeout(() => {
              commentPost(post, aiId);
            }, Math.random() * 10000 + 5000); // 5-15秒后评论
          }
        }, delay);
      });
    });
  }, [moments, config, contacts]);

  // 启动/停止AI主动发朋友圈
  useEffect(() => {
    if (!config.autoPostEnabled || config.autoPostContactIds.length === 0) {
      // 清除所有定时器
      postTimersRef.current.forEach(timer => clearTimeout(timer));
      postTimersRef.current.clear();
      return;
    }

    // 为每个启用的AI设置定时器
    config.autoPostContactIds.forEach(contactId => {
      // 检查是否已经有定时器
      if (!postTimersRef.current.has(contactId)) {
        // 如果是首次启动，随机一个初始延迟（避免所有AI同时发）
        const initialDelay = Math.random() * config.postIntervalMin * 1000;
        
        setTimeout(() => {
          schedulePost(contactId);
        }, initialDelay);
      }
    });

    // 清理函数
    return () => {
      postTimersRef.current.forEach(timer => clearTimeout(timer));
      postTimersRef.current.clear();
    };
  }, [config.autoPostEnabled, config.autoPostContactIds, config.postIntervalMin, config.postIntervalMax]);

  // 监听AI朋友圈的新评论，并自动回复
  useEffect(() => {
    // 找出所有AI角色
    const aiContacts = contacts.filter(c => c.isAi === true);
    const aiContactIds = aiContacts.map(c => c.id);
    
    if (aiContactIds.length === 0) {
      console.log('⚠️ [AI朋友圈回复] 没有找到AI角色');
      return;
    }
    
    // 找出AI角色的朋友圈
    const aiMoments = moments.filter(m => aiContactIds.includes(m.contactId));
    
    console.log(`📱 [AI朋友圈回复] 正在监听 ${aiMoments.length} 条AI朋友圈的评论`);

    aiMoments.forEach(moment => {
      // 找出这条朋友圈的新评论（未处理过的）
      const newComments = moment.comments.filter(comment => 
        !processedCommentsRef.current.has(comment.id) &&
        comment.userId !== moment.contactId && // 不是AI自己的评论
        !comment.replyTo && // 只处理直接评论，不处理回复（避免无限循环）
        comment.userId === currentUserId // 是用户的评论
      );

      if (newComments.length === 0) return;

      const momentOwner = contacts.find(c => c.id === moment.contactId);
      console.log(`💬 发现 ${newComments.length} 条新评论在 ${momentOwner?.nickname || moment.contactId} 的朋友圈`);

      newComments.forEach(comment => {
        // 标记为已处理
        processedCommentsRef.current.add(comment.id);

        // AI角色有80%概率回复用户的评论
        if (Math.random() < 0.8) {
          // 随机延迟3-15秒后回复（模拟真实看到评论并回复的时间）
          const delay = Math.random() * 12000 + 3000;
          
          setTimeout(() => {
            replyToComment(moment, comment, moment.contactId);
          }, delay);
        } else {
          console.log(`😶 ${moment.contactId} 选择不回复这条评论（20%概率）`);
        }
      });
    });
  }, [moments, contacts, currentUserId]);

  return null; // 这个组件不渲染任何UI
}