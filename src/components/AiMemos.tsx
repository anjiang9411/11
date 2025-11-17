import { Clock, Heart, UserCircle } from 'lucide-react';
import { Contact, MemoEntry } from './Contacts';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

interface AiMemosProps {
  contacts: Contact[];
  userProfile: {
    username: string;
    avatar: string;
    realName?: string;
  };
}

export function AiMemos({ contacts, userProfile }: AiMemosProps) {
  // 收集所有角色的备忘录
  const allMemos: (MemoEntry & { contact: Contact })[] = [];
  
  contacts.forEach(contact => {
    if (contact.memos && contact.memos.length > 0) {
      contact.memos.forEach(memo => {
        allMemos.push({ ...memo, contact });
      });
    }
  });
  
  // 按时间倒序排列
  allMemos.sort((a, b) => b.timestamp - a.timestamp);
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // 今天，显示时间
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffInDays === 1) {
      return '昨天';
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}周前`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months}个月前`;
    } else {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 标题栏 */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h2 className="text-lg">Ta们的备忘录</h2>
            <p className="text-xs text-gray-500">记录关于你的点点滴滴</p>
          </div>
        </div>
      </div>
      
      {/* 备忘录列表 */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {allMemos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-400">还没有备忘录</p>
              <p className="text-sm text-gray-400 mt-2">AI角色会在聊天中记录关于你的观察</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allMemos.map((memo, index) => (
                <div key={memo.id}>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    {/* 角色信息 */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={memo.contact.avatar} />
                        <AvatarFallback>{memo.contact.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{memo.contact.remark || memo.contact.nickname}</span>
                          {memo.contact.userRemark && (
                            <span className="text-xs text-gray-400">
                              (叫你 "{memo.contact.userRemark}")
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(memo.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 备忘录内容 */}
                    <div className="bg-pink-50 rounded-lg p-3 relative">
                      <div className="absolute -top-2 left-8 w-4 h-4 bg-pink-50 transform rotate-45"></div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {memo.content}
                      </p>
                    </div>
                  </div>
                  
                  {/* 分隔线 */}
                  {index < allMemos.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* 底部提示 */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <UserCircle className="w-4 h-4" />
          <span>这些是AI角色从他们的视角记录的关于你的观察和想法</span>
        </div>
      </div>
    </div>
  );
}
