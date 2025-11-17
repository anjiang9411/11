import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Heart, MessageCircle, Camera } from 'lucide-react';
import { Contact } from './Contacts';
import { StatusBar } from './StatusBar';
import { MomentPost, MomentComment } from './Moments';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface ContactMomentsProps {
  contact: Contact;
  onClose: () => void;
  currentUser: Contact;
  contacts: Contact[];
  moments: MomentPost[];
  onMomentsChange: (moments: MomentPost[]) => void;
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
}

export function ContactMoments({
  contact,
  onClose,
  currentUser,
  contacts,
  moments,
  onMomentsChange,
  realTime,
  batteryLevel,
  isCharging
}: ContactMomentsProps) {
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentingMomentId, setCommentingMomentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null); // 正在回复的评论ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // 获取联系人信息
  const getContactById = (id: string) => {
    if (id === currentUser.id) return currentUser;
    return contacts.find(c => c.id === id) || {
      id: id,
      realName: '未知用户',
      nickname: '未知用户',
      avatar: '',
      phone: '',
      signature: ''
    };
  };

  // 格式化时间
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

    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  // 点赞/取消点赞
  const handleToggleLike = (momentId: string) => {
    const updatedMoments = moments.map(moment => {
      if (moment.id === momentId) {
        const likes = [...moment.likes];
        const userIndex = likes.indexOf(currentUser.id);
        if (userIndex > -1) {
          likes.splice(userIndex, 1);
        } else {
          likes.push(currentUser.id);
        }
        return { ...moment, likes };
      }
      return moment;
    });
    onMomentsChange(updatedMoments);
    setActiveMenuId(null);
  };

  // 打开评论对话框
  const handleOpenComment = (momentId: string, replyToCommentId?: string) => {
    setCommentingMomentId(momentId);
    setReplyingToCommentId(replyToCommentId || null);
    setShowCommentDialog(true);
    setActiveMenuId(null);
  };

  // 发送评论
  const handleSendComment = () => {
    if (!commentText.trim() || !commentingMomentId) return;

    const newComment: MomentComment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      content: commentText.trim(),
      createdAt: Date.now(),
      replyTo: replyingToCommentId // 添加回复的评论ID
    };

    const updatedMoments = moments.map(moment => {
      if (moment.id === commentingMomentId) {
        return {
          ...moment,
          comments: [...moment.comments, newComment]
        };
      }
      return moment;
    });

    onMomentsChange(updatedMoments);
    setCommentText('');
    setShowCommentDialog(false);
    setCommentingMomentId(null);
    setReplyingToCommentId(null); // 重置回复的评论ID
  };

  // 筛选该联系人的朋友圈
  const contactMoments = moments.filter(m => m.contactId === contact.id).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#ededed] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 状态栏 */}
      <StatusBar realTime={realTime} batteryLevel={batteryLevel} isCharging={isCharging} />

      {/* 整页滚动容器 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 封面区域 */}
        <div className="relative">
          {/* 封面图片 */}
          <div 
            className="relative h-[280px] bg-cover bg-center"
            style={{ backgroundImage: contact.avatar ? `url(${contact.avatar})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {/* 顶部返回按钮 */}
            <button 
              onClick={onClose}
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-30 z-10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            {/* 用户信息 */}
            <div className="absolute bottom-4 right-4 flex items-end gap-3">
              <div className="text-right text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <p className="font-medium text-[17px] mb-1">
                  {contact.remark || contact.nickname || contact.realName}
                </p>
                {contact.signature && (
                  <p className="text-sm opacity-90">
                    {contact.signature}
                  </p>
                )}
              </div>
              <img
                src={contact.avatar}
                alt="头像"
                className="w-16 h-16 rounded-lg border-2 border-white object-cover"
              />
            </div>
          </div>
        </div>

        {/* 朋友圈列表 */}
        <div className="bg-white">
          {contactMoments.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-sm">暂无朋友圈</p>
            </div>
          ) : (
            <>
              {contactMoments.map((moment) => {
                const author = getContactById(moment.contactId);
                const isLiked = moment.likes.includes(currentUser.id);

                return (
                  <div key={moment.id} className="border-b border-gray-100 px-4 py-3">
                    <div className="flex gap-3">
                      {/* 头像 */}
                      <img
                        src={author.avatar || ''}
                        alt={author.nickname}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                      />

                      {/* 内容区 */}
                      <div className="flex-1 min-w-0">
                        {/* 昵称 */}
                        <p className="text-[15px] text-blue-600 mb-1">
                          {author.remark || author.nickname || author.realName}
                        </p>

                        {/* 文字内容 */}
                        {moment.content && (
                          <p className="text-[15px] text-gray-800 mb-2 whitespace-pre-wrap">
                            {moment.content}
                          </p>
                        )}

                        {/* 图片网格 */}
                        {moment.images && moment.images.length > 0 && (
                          <div className={`grid gap-1 mb-2 ${
                            moment.images.length === 1 ? 'grid-cols-1' : 
                            moment.images.length === 2 ? 'grid-cols-2' : 
                            moment.images.length === 4 ? 'grid-cols-2' : 
                            'grid-cols-3'
                          }`}>
                            {moment.images.slice(0, 9).map((img, idx) => (
                              <div 
                                key={idx} 
                                className={`aspect-square bg-gray-100 rounded overflow-hidden ${
                                  moment.images!.length === 1 ? 'max-w-[200px]' : ''
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

                        {/* 位置 */}
                        {moment.location && (
                          <p className="text-xs text-blue-600 mb-2">
                            📍 {moment.location}
                          </p>
                        )}

                        {/* 时间和更多按钮区域 */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400">
                            {formatTime(moment.createdAt)}
                          </p>
                          
                          {/* 更多按钮 - 右下角 */}
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === moment.id ? null : moment.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            
                            {/* 弹出菜单 - 点赞和评论横条 */}
                            {activeMenuId === moment.id && (
                              <div 
                                className="absolute right-0 bottom-full mb-1 flex items-center gap-0 bg-[#4c4c4c] rounded-md overflow-hidden shadow-lg z-10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleToggleLike(moment.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#5c5c5c] transition-colors border-r border-gray-600 whitespace-nowrap"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                  <span className="text-xs text-white">{isLiked ? '取消' : '赞'}</span>
                                </button>
                                <button
                                  onClick={() => handleOpenComment(moment.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#5c5c5c] transition-colors whitespace-nowrap"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                                  <span className="text-xs text-white">评论</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 点赞和评论区 */}
                        {(moment.likes.length > 0 || moment.comments.length > 0) && (
                          <div className="bg-gray-50 px-3 py-2 rounded">
                            {/* 点赞列表 */}
                            {moment.likes.length > 0 && (
                              <div className="flex items-start gap-1 text-xs text-gray-600">
                                <Heart className="w-3 h-3 mt-0.5 flex-shrink-0 fill-red-500 text-red-500" />
                                <p className="flex-1">
                                  {moment.likes.map((likeId, idx) => {
                                    const liker = getContactById(likeId);
                                    const name = liker.remark || liker.nickname || liker.realName;
                                    return (
                                      <span key={likeId} className="text-blue-600">
                                        {name}{idx < moment.likes.length - 1 ? ', ' : ''}
                                      </span>
                                    );
                                  })}
                                </p>
                              </div>
                            )}

                            {/* 评论列表 */}
                            {moment.comments.length > 0 && (
                              <div className={`space-y-1 ${moment.likes.length > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}`}>
                                {moment.comments.map((comment) => {
                                  const commenter = getContactById(comment.userId);
                                  const commenterName = commenter.remark || commenter.nickname || commenter.realName;
                                  
                                  return (
                                    <p 
                                      key={comment.id} 
                                      className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                                      onClick={() => handleOpenComment(moment.id, comment.id)}
                                    >
                                      <span className="text-blue-600">{commenterName}</span>
                                      {comment.replyTo && (() => {
                                        const replyToComment = moment.comments.find(c => c.id === comment.replyTo);
                                        if (replyToComment) {
                                          const replyToUser = getContactById(replyToComment.userId);
                                          return (
                                            <>
                                              {' 回复 '}
                                              <span className="text-blue-600">
                                                {replyToUser.remark || replyToUser.nickname}
                                              </span>
                                            </>
                                          );
                                        }
                                        return null;
                                      })()}
                                      : {comment.content}
                                    </p>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* 评论对话框 */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>发表评论</DialogTitle>
            <DialogDescription>
              {replyingToCommentId && commentingMomentId && (() => {
                const moment = moments.find(m => m.id === commentingMomentId);
                if (moment) {
                  const replyToComment = moment.comments.find(c => c.id === replyingToCommentId);
                  if (replyToComment) {
                    const replyToUser = getContactById(replyToComment.userId);
                    const replyToName = replyToUser.remark || replyToUser.nickname || replyToUser.realName;
                    return `回复 ${replyToName}`;
                  }
                }
                return '说点什么吧';
              })() || '说点什么吧'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button 
                onClick={handleSendComment} 
                disabled={!commentText.trim()}
              >
                发送
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}