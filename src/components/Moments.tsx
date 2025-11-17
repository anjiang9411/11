import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, MoreHorizontal, Heart, MessageCircle, Share2, Upload, Link, Trash2, Users, User } from 'lucide-react';
import { Contact } from './Contacts';
import { StatusBar } from './StatusBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { WeChatGroup, WeChatFriend } from './WeChat';

// 朋友圈动态接口
export interface MomentPost {
  id: string;
  contactId: string; // 发布者ID
  content: string; // 文字内容
  images?: string[]; // 图片（最多9张）
  video?: string; // 视频
  location?: string; // 位置
  likes: string[]; // 点赞的用户ID数组
  comments: MomentComment[]; // 评论
  createdAt: number; // 发布时间戳
}

// 评论接口
export interface MomentComment {
  id: string;
  userId: string; // 评论者ID
  content: string; // 评论内容
  replyTo?: string; // 回复的评论ID
  createdAt: number; // 评论时间戳
}

interface MomentsProps {
  onClose: () => void;
  currentUser: Contact; // 当前用户
  contacts: Contact[]; // 所有联系人
  moments: MomentPost[]; // 所有朋友圈动态
  onMomentsChange: (moments: MomentPost[]) => void;
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
  weChatFriends?: WeChatFriend[]; // 微信好友列表（用于分享）
  weChatGroups?: WeChatGroup[]; // 微信群聊列表（用于分享）
  onShareToChat?: (targetId: string, momentId: string, isGroup: boolean) => void; // 分享回调
}

export function Moments({ 
  onClose, 
  currentUser, 
  contacts, 
  moments, 
  onMomentsChange,
  realTime, 
  batteryLevel, 
  isCharging,
  weChatFriends = [],
  weChatGroups = [],
  onShareToChat
}: MomentsProps) {
  const [coverImage, setCoverImage] = useState<string>(() => {
    const saved = localStorage.getItem('momentsCoverImage');
    return saved || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop';
  });
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); // 当前打开菜单的动态ID
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentingMomentId, setCommentingMomentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null); // 正在回复的评论ID
  const [showHeader, setShowHeader] = useState(false); // 是否显示顶部标题栏
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 发布动态相关状态
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postLocation, setPostLocation] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareText, setShareText] = useState('');
  const [shareTargetMomentId, setShareTargetMomentId] = useState<string | null>(null); // 要分享的动态ID
  const [shareSearchText, setShareSearchText] = useState(''); // 分享选择器搜索文本

  // 监听滚动
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      // 当滚动超过封面高度的一半时显示标题栏
      setShowHeader(scrollTop > 140);
    }
  };

  // 保存封面图片
  const handleSaveCoverImage = (url: string) => {
    setCoverImage(url);
    localStorage.setItem('momentsCoverImage', url);
    setShowCoverOptions(false);
  };

  // 通过URL更换封面
  const handleChangeCoverByUrl = () => {
    if (coverUrlInput.trim()) {
      handleSaveCoverImage(coverUrlInput.trim());
      setCoverUrlInput('');
    }
  };

  // 通过本地文件更换封面
  const handleChangeCoverByFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          handleSaveCoverImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = realTime.getTime();
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

  // 获取联系人信息
  const getContact = (id: string) => {
    return contacts.find(c => c.id === id) || currentUser;
  };

  // 点赞/取消点赞
  const handleToggleLike = (momentId: string) => {
    const updatedMoments = moments.map(m => {
      if (m.id === momentId) {
        const isLiked = m.likes.includes(currentUser.id);
        console.log('🔥 [Moments-handleToggleLike] 点赞操作', {
          momentId,
          currentUserId: currentUser.id,
          当前点赞状态: isLiked ? '已点赞' : '未点赞',
          当前点赞列表: m.likes,
          操作: isLiked ? '取消点赞' : '添加点赞'
        });
        
        // 🔥 修复：确保去重，防止重复添加
        const newLikes = isLiked 
          ? m.likes.filter(id => id !== currentUser.id)
          : [...new Set([...m.likes, currentUser.id])]; // 使用Set去重
        
        console.log('🔥 [Moments-handleToggleLike] 新的点赞列表（已去重）', newLikes);
        
        return {
          ...m,
          likes: newLikes
        };
      }
      return m;
    });
    console.log('🔥 [Moments-handleToggleLike] 更新后的moments', {
      momentId,
      更新后的点赞列表: updatedMoments.find(m => m.id === momentId)?.likes
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

  // 提交评论
  const handleSubmitComment = () => {
    if (!commentText.trim() || !commentingMomentId) return;

    const newComment: MomentComment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      content: commentText.trim(),
      replyTo: replyingToCommentId || undefined,
      createdAt: Date.now()
    };

    const updatedMoments = moments.map(m => {
      if (m.id === commentingMomentId) {
        return {
          ...m,
          comments: [...m.comments, newComment]
        };
      }
      return m;
    });

    onMomentsChange(updatedMoments);
    setCommentText('');
    setShowCommentDialog(false);
    setCommentingMomentId(null);
    setReplyingToCommentId(null);
  };

  // 添加图片到动态（通过本地文件）
  const handleAddImageByFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const maxImages = 9 - postImages.length;
      const filesToRead = Math.min(files.length, maxImages);
      
      let readCount = 0;
      for (let i = 0; i < filesToRead; i++) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            newImages.push(result);
          }
          readCount++;
          if (readCount === filesToRead) {
            setPostImages([...postImages, ...newImages]);
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
    if (postImageInputRef.current) {
      postImageInputRef.current.value = '';
    }
  };

  // 添加图片到动态（通过URL）
  const handleAddImageByUrl = () => {
    if (imageUrlInput.trim() && postImages.length < 9) {
      setPostImages([...postImages, imageUrlInput.trim()]);
      setImageUrlInput('');
      setShowImageOptions(false);
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index));
  };

  // 发布动态
  const handlePublishPost = () => {
    if (!postContent.trim() && postImages.length === 0) return;

    const newPost: MomentPost = {
      id: Date.now().toString(),
      contactId: currentUser.id,
      content: postContent.trim(),
      images: postImages.length > 0 ? postImages : undefined,
      location: postLocation.trim() || undefined,
      likes: [],
      comments: [],
      createdAt: realTime.getTime()
    };

    onMomentsChange([newPost, ...moments]);
    
    // 置表单
    setPostContent('');
    setPostImages([]);
    setPostLocation('');
    setShowPostDialog(false);
  };

  // 分享动态
  const handleShareMoment = (momentId: string) => {
    setShareTargetMomentId(momentId);
    setShowShareDialog(true);
    setActiveMenuId(null);
    setShareSearchText('');
  };

  // 分享给特定联系人或群聊
  const handleShareToTarget = (targetId: string, isGroup: boolean) => {
    if (!shareTargetMomentId || !onShareToChat) return;
    onShareToChat(targetId, shareTargetMomentId, isGroup);
    setShowShareDialog(false);
    setShareTargetMomentId(null);
    setShareSearchText('');
  };



  // 删除动态
  const handleDeleteMoment = (momentId: string) => {
    if (confirm('确定要删除这条动态吗？')) {
      const updatedMoments = moments.filter(m => m.id !== momentId);
      onMomentsChange(updatedMoments);
      setActiveMenuId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#ededed] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 状态栏 */}
      <StatusBar realTime={realTime} batteryLevel={batteryLevel} isCharging={isCharging} />

      {/* 固定标题栏 - 滚动时显示 */}
      <div 
        className={`absolute top-[24px] left-0 right-0 bg-[#ededed] border-b border-gray-200 transition-all duration-300 z-40 ${
          showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="h-[50px] flex items-center justify-between px-4">
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <span className="text-gray-800">朋友圈</span>
          <button 
            onClick={() => setShowPostDialog(true)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <Camera className="w-5 h-5 text-gray-800" />
          </button>
        </div>
      </div>

      {/* 整页滚动器 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollContainerRef} onScroll={handleScroll}>
        {/* 封面区域 */}
        <div className="relative">
          {/* 封面图片 - 可点击更换 */}
          <div 
            className="relative h-[280px] bg-cover bg-center cursor-pointer"
            style={{ backgroundImage: `url(${coverImage})` }}
            onClick={() => setShowCoverOptions(true)}
          >
            {/* 顶部返回按钮 */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-30 z-10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            {/* 发布动态按钮 */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowPostDialog(true);
              }}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-30 z-10"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>

            {/* 用户信息 */}
            <div className="absolute bottom-4 right-4 flex items-end gap-3">
              <div className="text-right text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <p className="font-medium text-[17px] mb-1">
                  {currentUser.remark || currentUser.nickname || currentUser.realName}
                </p>
                {currentUser.signature && (
                  <p className="text-sm opacity-90">
                    {currentUser.signature}
                  </p>
                )}
              </div>
              <img
                src={currentUser.avatar}
                alt="头像"
                className="w-16 h-16 rounded-lg border-2 border-white object-cover"
              />
            </div>
          </div>
        </div>

        {/* 朋友圈列表 */}
        <div className="bg-white">
          {moments.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-sm">暂无朋友圈</p>
            </div>
          ) : (
            <>
              {moments.map((moment) => {
                const contact = getContact(moment.contactId);
                const isLiked = moment.likes.includes(currentUser.id);

                return (
                  <div key={moment.id} className="border-b border-gray-100 px-4 py-3">
                    <div className="flex gap-3">
                      {/* 头像 */}
                      <img
                        src={contact.avatar}
                        alt={contact.nickname}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                      />

                      {/* 内容区 */}
                      <div className="flex-1 min-w-0">
                        {/* 昵称 */}
                        <p className="text-[15px] text-blue-600 mb-1">
                          {contact.remark || contact.nickname || contact.realName}
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

                        {/* 时间和更多按钮区 */}
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
                                <button
                                  onClick={() => handleShareMoment(moment.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#5c5c5c] transition-colors whitespace-nowrap"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-white" />
                                  <span className="text-xs text-white">分享</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteMoment(moment.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#5c5c5c] transition-colors whitespace-nowrap"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-white" />
                                  <span className="text-xs text-white">删除</span>
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
                                    const liker = getContact(likeId);
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
                                  const commenter = getContact(comment.userId);
                                  const commenterName = commenter.remark || commenter.nickname || commenter.realName;
                                  
                                  // 获取被回复者的信息
                                  let replyToName = '';
                                  if (comment.replyTo) {
                                    const replyToComment = moment.comments.find(c => c.id === comment.replyTo);
                                    if (replyToComment) {
                                      const replyToUser = getContact(replyToComment.userId);
                                      replyToName = replyToUser.remark || replyToUser.nickname || replyToUser.realName;
                                    }
                                  }
                                  
                                  return (
                                    <p 
                                      key={comment.id} 
                                      className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                                      onClick={() => handleOpenComment(moment.id, comment.id)}
                                    >
                                      <span className="text-blue-600">{commenterName}</span>
                                      {comment.replyTo && replyToName && (
                                        <>
                                          {' 回复 '}
                                          <span className="text-blue-600">
                                            {replyToName}
                                          </span>
                                        </>
                                      )}
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

      {/* 封面选项对话框 */}
      <Dialog open={showCoverOptions} onOpenChange={setShowCoverOptions}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>更换封面</DialogTitle>
            <DialogDescription>选择一张图片作为你的朋友圈封面</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 上传图片 */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">从本地上传</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cover-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleChangeCoverByFile}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  选择图片文件
                </Button>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">或</span>
              </div>
            </div>

            {/* URL输入 */}
            <div className="space-y-2">
              <Label htmlFor="cover-url" className="text-sm text-gray-700">输入图片链接</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cover-url"
                  type="text"
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleChangeCoverByUrl();
                    }
                  }}
                />
                <Button
                  variant="default"
                  onClick={handleChangeCoverByUrl}
                  disabled={!coverUrlInput.trim()}
                >
                  确认
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 评论对话框 */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>评论</DialogTitle>
            <DialogDescription>
              {replyingToCommentId && commentingMomentId && (() => {
                const moment = moments.find(m => m.id === commentingMomentId);
                if (moment) {
                  const replyToComment = moment.comments.find(c => c.id === replyingToCommentId);
                  if (replyToComment) {
                    const replyToUser = getContact(replyToComment.userId);
                    const replyToName = replyToUser.remark || replyToUser.nickname || replyToUser.realName;
                    return `回复 ${replyToName}`;
                  }
                }
                return '添加你的评论';
              })() || '添加你的评论'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 评论输入框 */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">添加评论</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="comment-text"
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="输入你的评论..."
                  className="flex-1"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  variant="default"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 发布动态对话框 */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>发布动态</DialogTitle>
            <DialogDescription>分享你的想法和照片</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 文字内容 */}
            <div className="space-y-2">
              <Label htmlFor="post-content" className="text-sm text-gray-700">文字内容</Label>
              <Textarea
                id="post-content"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="分享你的想法..."
                className="min-h-[100px]"
              />
            </div>

            {/* 图片展示和管理 */}
            {postImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">已选择的图片 ({postImages.length}/9)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {postImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 添加图片 */}
            {postImages.length < 9 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">添加图片</Label>
                <div className="flex gap-2">
                  {/* 本地上传 */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={postImageInputRef}
                    onChange={handleAddImageByFile}
                  />
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => postImageInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    本地上传
                  </Button>

                  {/* URL输入 */}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowImageOptions(!showImageOptions)}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    图片链接
                  </Button>
                </div>

                {/* URL输入框 */}
                {showImageOptions && (
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="输入图片URL..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddImageByUrl();
                        }
                      }}
                    />
                    <Button
                      variant="default"
                      onClick={handleAddImageByUrl}
                      disabled={!imageUrlInput.trim()}
                    >
                      添加
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 位置 */}
            <div className="space-y-2">
              <Label htmlFor="post-location" className="text-sm text-gray-700">位置（可选）</Label>
              <Input
                id="post-location"
                type="text"
                value={postLocation}
                onChange={(e) => setPostLocation(e.target.value)}
                placeholder="你在哪里..."
              />
            </div>

            {/* 发布按钮 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPostDialog(false);
                  setPostContent('');
                  setPostImages([]);
                  setPostLocation('');
                  setShowImageOptions(false);
                }}
              >
                取消
              </Button>
              <Button
                variant="default"
                onClick={handlePublishPost}
                disabled={!postContent.trim() && postImages.length === 0}
              >
                发布
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分享动态对话框 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>分享给朋友</DialogTitle>
            <DialogDescription>选择要分享的联系人或群聊</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 搜索框 */}
            <div className="space-y-2">
              <Input
                type="text"
                value={shareSearchText}
                onChange={(e) => setShareSearchText(e.target.value)}
                placeholder="搜索联系人或群聊..."
                className="w-full"
              />
            </div>

            {/* 联系人和群聊列表 */}
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {/* 好友列表 */}
              {weChatFriends
                .filter(friend => {
                  const searchLower = shareSearchText.toLowerCase();
                  const contact = getContact(friend.contactId);
                  const name = contact.remark || contact.nickname || contact.realName || '';
                  return name.toLowerCase().includes(searchLower);
                })
                .map(friend => {
                  const contact = getContact(friend.contactId);
                  return (
                    <button
                      key={friend.contactId}
                      onClick={() => handleShareToTarget(friend.contactId, false)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <img
                        src={contact.avatar}
                        alt={contact.nickname}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm truncate">
                          {contact.remark || contact.nickname || contact.realName}
                        </p>
                      </div>
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  );
                })}

              {/* 群聊列表 */}
              {weChatGroups
                .filter(group => {
                  const searchLower = shareSearchText.toLowerCase();
                  return (group.name || '').toLowerCase().includes(searchLower);
                })
                .map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleShareToTarget(group.id, true)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm truncate">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.memberIds.length}人</p>
                    </div>
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}