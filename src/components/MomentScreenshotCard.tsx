// 朋友圈截图卡片组件
import { Contact } from './Contacts';
import { MomentPost } from './Moments';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface MomentScreenshotCardProps {
  moment: MomentPost;
  author: Contact;
  contacts: Contact[];
  onClick?: () => void; // ✨ 添加点击回调
}

export function MomentScreenshotCard({ moment, author, contacts, onClick }: MomentScreenshotCardProps) {
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
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div 
      className="bg-white rounded-lg p-3 border border-gray-200 max-w-[300px] cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* 顶部作者信息 */}
      <div className="flex items-start gap-2 pb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={author.avatar} alt={author.nickname} />
          <AvatarFallback>{author.nickname[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-blue-600">{author.nickname}</div>
          <div className="text-xs text-gray-400 mt-0.5">{formatTime(moment.createdAt)}</div>
        </div>
      </div>

      {/* 内容 */}
      <div className="text-sm text-gray-900 break-words whitespace-pre-wrap mb-3">
        {moment.content}
      </div>

      {/* 图片（如果有） */}
      {moment.images && moment.images.length > 0 && (
        <div className={`grid gap-1 mb-3 ${
          moment.images.length === 1 ? 'grid-cols-1' :
          moment.images.length === 2 ? 'grid-cols-2' :
          moment.images.length === 4 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {moment.images.slice(0, 9).map((img, idx) => (
            <div 
              key={idx} 
              className={`aspect-square bg-gray-100 rounded overflow-hidden ${
                moment.images!.length === 1 ? 'max-h-[200px]' : ''
              }`}
            >
              <img 
                src={img} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* 点赞和评论统计 */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
        {moment.likes.length > 0 && (
          <div className="flex items-center gap-1">
            <span>❤️</span>
            <span>{moment.likes.length}</span>
          </div>
        )}
        {moment.comments.length > 0 && (
          <div className="flex items-center gap-1">
            <span>💬</span>
            <span>{moment.comments.length}</span>
          </div>
        )}
      </div>

      {/* 评论预览（最多显示2条） */}
      {moment.comments.length > 0 && (
        <div className="mt-2 bg-gray-50 rounded p-2 space-y-1.5 text-xs">
          {moment.comments.slice(0, 2).map((comment) => {
            const commenter = contacts.find(c => c.id === comment.userId);
            return (
              <div key={comment.id} className="text-gray-700">
                <span className="text-blue-600 font-medium">{commenter?.nickname || '某人'}</span>
                <span className="text-gray-500">: </span>
                <span>{comment.content}</span>
              </div>
            );
          })}
          {moment.comments.length > 2 && (
            <div className="text-gray-400 text-center">
              共{moment.comments.length}条评论
            </div>
          )}
        </div>
      )}
    </div>
  );
}