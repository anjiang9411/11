import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Heart, MessageCircle, X } from 'lucide-react';
import { MomentPost, MomentComment } from './Moments';
import { Contact } from './Contacts';

interface MomentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moment: MomentPost | null;
  currentUser: Contact;
  contacts: Contact[];
  onLike?: (momentId: string) => void;
  onComment?: (momentId: string, content: string, replyToCommentId?: string) => void;
}

export function MomentDetailDialog({
  open,
  onOpenChange,
  moment,
  currentUser,
  contacts,
  onLike,
  onComment
}: MomentDetailDialogProps) {
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  // 添加调试日志 - 在return前
  console.log('🎴 [MomentDetailDialog] 渲染开始', {
    open,
    momentId: moment?.id,
    momentContent: moment?.content,
    moment是否存在: !!moment,
    momentLikes: moment?.likes
  });

  if (!moment) {
    console.log('🎴 [MomentDetailDialog] moment为null，返回null');
    return null;
  }

  console.log('🎴 [MomentDetailDialog] 准备渲染Dialog组件', { open });

  // 获取联系人信息
  const getContact = (contactId: string): Contact => {
    return contacts.find(c => c.id === contactId) || currentUser;
  };

  const author = getContact(moment.contactId);
  const isLiked = moment.likes.includes(currentUser.id);
  
  console.log('🎴 [MomentDetailDialog] isLiked计算结果', {
    currentUserId: currentUser.id,
    momentLikes: moment.likes,
    isLiked,
    包含检查: moment.likes.includes(currentUser.id),
    包含me检查: moment.likes.includes('me')
  });

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  // 处理点赞
  const handleLike = () => {
    console.log('🔥 [MomentDetailDialog-handleLike] 点赞按钮点击', {
      momentId: moment.id,
      currentUserId: currentUser.id,
      当前点赞列表: moment.likes,
      isLiked: moment.likes.includes(currentUser.id)
    });
    if (onLike) {
      onLike(moment.id);
    }
  };

  // 处理评论
  const handleSubmitComment = () => {
    if (!commentText.trim() || !onComment) return;
    onComment(moment.id, commentText, replyingToCommentId || undefined);
    setCommentText('');
    setReplyingToCommentId(null);
  };

  // 处理回复评论
  const handleReplyComment = (commentId: string, userName: string) => {
    setReplyingToCommentId(commentId);
    setCommentText(`回复 ${userName}: `);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log('🎴 [MomentDetailDialog] Dialog onOpenChange被调用', { newOpen, 当前open: open });
        onOpenChange(newOpen);
      }}
    >
      <DialogContent 
        className="max-w-[480px] max-h-[85vh] p-0 overflow-hidden [&>button]:hidden"
        style={{ zIndex: 10000 }}
      >
        {/* 无障碍标题和描述 - 视觉上隐藏但对屏幕阅读器可见 */}
        <DialogTitle className="sr-only">
          朋友圈详情 - {author.remark || author.nickname || author.realName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          查看和互动朋友圈动态，包括点赞和评论
        </DialogDescription>
        
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
          <span className="text-gray-900">朋友圈详情</span>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] bg-[#f5f5f5]">
          {/* 朋友圈内容 */}
          <div className="bg-white p-4 mb-2">
            {/* 发布者信息 */}
            <div className="flex items-start gap-3 mb-3">
              <img 
                src={author.avatar} 
                alt={author.nickname}
                className="w-11 h-11 rounded-md object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-blue-600 text-[15px] font-medium mb-1">
                  {author.remark || author.nickname || author.realName}
                </p>
                <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {moment.content}
                </p>
              </div>
            </div>

            {/* 图片九宫格 */}
            {moment.images && moment.images.length > 0 && (
              <div className={`grid gap-1.5 mt-3 ml-14 ${
                moment.images.length === 1 ? 'grid-cols-1' : 
                moment.images.length === 2 ? 'grid-cols-2' :
                moment.images.length === 4 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {moment.images.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`bg-gray-100 rounded-lg overflow-hidden ${
                      moment.images!.length === 1 ? 'aspect-[4/3] max-w-[240px]' : 'aspect-square'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt=""
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 可以添加图片预览功能
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 位置信息 */}
            {moment.location && (
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-2 ml-14">
                <span>{moment.location}</span>
              </div>
            )}

            {/* 时间 */}
            <div className="text-xs text-gray-400 mt-2 ml-14">
              {formatTime(moment.createdAt)}
            </div>

            {/* 点赞和评论区域 */}
            {(moment.likes.length > 0 || moment.comments.length > 0) && (
              <div className="mt-3 ml-14 bg-gray-50 rounded-lg p-2.5">
                {/* 点赞列表 */}
                {moment.likes.length > 0 && (
                  <div className="flex items-start gap-1.5 text-xs">
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-gray-700 leading-relaxed">
                      {moment.likes.map((likeUserId, idx) => {
                        const likeUser = getContact(likeUserId);
                        const displayName = likeUser.remark || likeUser.nickname || likeUser.realName;
                        return (
                          <span key={likeUserId}>
                            <span className="text-blue-600">{displayName}</span>
                            {idx < moment.likes.length - 1 ? '，' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 分隔线 */}
                {moment.likes.length > 0 && moment.comments.length > 0 && (
                  <div className="h-px bg-gray-200 my-2" />
                )}

                {/* 评论列表 */}
                {moment.comments.length > 0 && (
                  <div className="space-y-2">
                    {moment.comments.map((comment) => {
                      const commenter = getContact(comment.userId);
                      const commenterName = commenter.remark || commenter.nickname || commenter.realName;
                      
                      // 如果是回复评论，找到被回复的用户
                      let replyToName = '';
                      if (comment.replyTo) {
                        const originalComment = moment.comments.find(c => c.id === comment.replyTo);
                        if (originalComment) {
                          const replyToUser = getContact(originalComment.userId);
                          replyToName = replyToUser.remark || replyToUser.nickname || replyToUser.realName;
                        }
                      }

                      return (
                        <div 
                          key={comment.id} 
                          className="text-xs leading-relaxed cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
                          onClick={() => handleReplyComment(comment.id, commenterName)}
                        >
                          <span className="text-blue-600">{commenterName}</span>
                          {replyToName && (
                            <>
                              <span className="text-gray-500"> 回复 </span>
                              <span className="text-blue-600">{replyToName}</span>
                            </>
                          )}
                          <span className="text-gray-500">：</span>
                          <span className="text-gray-700">{comment.content}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="border-t bg-white px-4 py-3 sticky bottom-0">
          <div className="flex items-center gap-3">
            {/* 评论输入框 */}
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitComment();
                }
              }}
              placeholder={replyingToCommentId ? "输入回复内容..." : "说点什么..."}
              className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm outline-none focus:bg-gray-200 transition-colors"
            />

            {/* 操作按钮 */}
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-all ${
                isLiked 
                  ? 'bg-red-50 text-red-500' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>

            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className={`p-2 rounded-full transition-all ${
                commentText.trim()
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}