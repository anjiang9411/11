// 聊天记录转发卡片组件
import { useState } from 'react';
import { Contact } from './Contacts';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

interface ChatForwardCardProps {
  messages: ChatMessage[];
  contacts: Contact[];
  fromContact: Contact;
}

export function ChatForwardCard({ messages, contacts, fromContact }: ChatForwardCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getContactName = (id: string) => {
    if (id === 'me') return '你';
    const contact = contacts.find(c => c.id === id);
    return contact?.nickname || contact?.realName || '未知';
  };

  const getContactAvatar = (id: string) => {
    if (id === 'me') return null; // 用户自己的头像可以在WeChat组件中定义
    const contact = contacts.find(c => c.id === id);
    return contact?.avatar || null;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 清理消息内容，移除特殊格式标记
  const cleanContent = (content: string): string => {
    // 移除图片标记
    if (content.startsWith('[IMAGE:')) {
      return '[图片]';
    }
    // 移除位置标记
    if (content.startsWith('[LOCATION:')) {
      return '[位置]';
    }
    // 移除朋友圈标记
    if (content.startsWith('[MOMENT:')) {
      return '[朋友圈]';
    }
    // 移除聊天记录卡片标记
    const chatCardMatch = content.match(/^\[CHAT_CARD:([^:]+):([^\]]+)\](.*)/);
    if (chatCardMatch) {
      const text = chatCardMatch[3];
      return text || '[聊天记录]';
    }
    // 移除引用标记
    const replyMatch = content.match(/^\[REPLY:([^\]]+)\](.*)/);
    if (replyMatch) {
      return replyMatch[2] || content;
    }
    // 移除所有其他方括号标记
    if (content.startsWith('[') && content.includes(']')) {
      const endBracket = content.indexOf(']');
      const possibleTag = content.substring(0, endBracket + 1);
      // 如果看起来像标记格式，返回简化版本
      if (possibleTag.includes(':')) {
        const tagType = content.substring(1, content.indexOf(':'));
        return `[${tagType}]`;
      }
    }
    // 返回原始内容
    return content;
  };

  // 生成预览文本（显示前几条消息的发送者）
  const getPreviewText = () => {
    const senderNames = messages.slice(0, 3).map(msg => getContactName(msg.senderId));
    const uniqueNames = Array.from(new Set(senderNames));
    return uniqueNames.join('、');
  };

  // 获取第一条可显示的消息内容
  const getFirstMessagePreview = (): string => {
    for (const msg of messages) {
      const cleaned = cleanContent(msg.content);
      if (cleaned && cleaned.trim() && cleaned !== '[聊天记录]') {
        return cleaned;
      }
    }
    return '聊天记录';
  };

  return (
    <>
      {/* 卡片预览 - 点击打开对话框 */}
      <div 
        className="bg-white rounded-lg p-3 border border-gray-200 max-w-[280px] cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          {fromContact.avatar ? (
            <ImageWithFallback 
              src={fromContact.avatar} 
              alt={fromContact.nickname}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-sm">
              {fromContact.nickname[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{fromContact.nickname}</div>
            <div className="text-xs text-gray-500">聊天记录</div>
          </div>
        </div>
        
        {/* 只显示预览 */}
        <div className="py-2 space-y-1">
          <div className="text-xs text-gray-600 truncate">
            {getPreviewText()}
          </div>
          {messages.length > 0 && (
            <div className="text-xs text-gray-400 truncate">
              {getFirstMessagePreview()}
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 text-center">
          聊天记录
        </div>
      </div>

      {/* 对话框 - 显示完整聊天记录 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md h-[600px] p-0 gap-0">
          <DialogDescription className="sr-only">
            查看来自{fromContact.nickname}的{messages.length}条转发聊天记录
          </DialogDescription>
          
          {/* 自定义标题栏 */}
          <div className="px-4 py-3 border-b">
            <DialogTitle className="text-base">聊天记录</DialogTitle>
          </div>

          {/* 来源信息 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
            {fromContact.avatar ? (
              <ImageWithFallback 
                src={fromContact.avatar} 
                alt={fromContact.nickname}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                {fromContact.nickname[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{fromContact.nickname}</div>
              <div className="text-xs text-gray-500">共{messages.length}条消息</div>
            </div>
          </div>

          {/* 聊天记录列表 */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const senderName = getContactName(msg.senderId);
                const isMe = msg.senderId === 'me';
                
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* 发送者和时间 */}
                    <div className="flex items-center gap-2 mb-1 px-2">
                      <span className="text-xs text-gray-500">{senderName}</span>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                    
                    {/* 消息内容 */}
                    <div 
                      className={`px-3 py-2 rounded-lg max-w-[70%] break-words ${
                        isMe 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{cleanContent(msg.content)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
