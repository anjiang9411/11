import { motion } from 'motion/react';
import { Music, BookOpen, MessageCircle, Share2, Phone, Chrome, ShoppingBag, Mail, Sun, Wind, Calendar as CalendarIcon, Search, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { MessageNotification, NotificationMessage } from './MessageNotification';

interface MusicTrack {
  id: string;
  url: string;
  title: string;
  artist: string;
}

interface MusicData {
  playlist: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface Widget {
  id: string;
  type: 'music' | 'diary' | 'calendar';
  title: string;
  data?: any;
  enabled: boolean;
}

interface SocialApp {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconType: string;
  customIconUrl?: string;
  color: string;
  bgColor: string;
}

interface PhoneHomeScreenProps {
  widgets: Widget[];
  socialApps: SocialApp[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  currentTime: Date;
  renderAppIcon: (app: SocialApp) => React.ReactNode;
  musicData: MusicData;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  onMusicClick: () => void;
  getCurrentTrack: () => MusicTrack | null;
  onAppClick: (app: SocialApp) => void;
  notificationMessages?: NotificationMessage[];
  onDismissNotification?: (id: string) => void;
  onCalendarClick?: () => void;
}

export function PhoneHomeScreen({ 
  widgets, 
  socialApps, 
  currentPage, 
  setCurrentPage,
  currentTime,
  renderAppIcon,
  musicData,
  togglePlayPause,
  playNext,
  playPrevious,
  onMusicClick,
  getCurrentTrack,
  onAppClick,
  notificationMessages = [],
  onDismissNotification = () => {},
  onCalendarClick = () => {}
}: PhoneHomeScreenProps) {
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'music':
        const currentTrack = getCurrentTrack();
        const progress = musicData.duration > 0 ? (musicData.currentTime / musicData.duration) * 100 : 0;
        
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onMusicClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-3 shadow-xl border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-pink-300" />
              <span className="text-white text-xs">音乐播放器</span>
            </div>
            <div className="text-white/90 text-xs mb-1 truncate">
              {currentTrack?.title || '暂无音乐'}
            </div>
            <div className="text-white/60 text-[10px] mb-2 truncate">
              {currentTrack?.artist || '点击添加音乐'}
            </div>
            
            {/* 播放控制按钮 */}
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playPrevious();
                }}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center hover:from-pink-500 hover:to-purple-600 transition-all shadow-md"
              >
                {musicData.isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNext();
                }}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            
            {/* 进度条 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-white/60 text-[9px] min-w-[32px]">
                {formatTime(musicData.currentTime)}
              </span>
            </div>
          </motion.div>
        );

      case 'calendar':
        const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        
        // 使用widget.data中的selectedDate或当前时间
        const displayDate = widget.data?.selectedDate ? new Date(widget.data.selectedDate) : currentTime;
        
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onCalendarClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-3 shadow-xl border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-4 h-4 text-blue-300" />
              <span className="text-white text-xs">今日</span>
            </div>
            <div className="text-white/90 text-xl mb-1">{displayDate.getDate()}</div>
            <div className="text-white/60 text-[10px]">{displayDate.getFullYear()}年{monthNames[displayDate.getMonth()]}</div>
            <div className="text-white/60 text-[10px] mt-1">{dayNames[displayDate.getDay()]}</div>
          </motion.div>
        );

      case 'diary':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-amber-200/50"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-800">每日日记</span>
                </div>
                <span className="text-2xl">{widget.data?.mood === 'happy' ? '😊' : widget.data?.mood === 'sad' ? '😢' : '😐'}</span>
              </div>
              <div className="text-sm text-gray-700 line-clamp-2">
                {widget.data?.content || '今天还没有记录...'}
              </div>
              <div className="text-xs text-gray-500">{currentTime.toLocaleDateString('zh-CN')}</div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const totalPages = Math.max(2, Math.ceil(socialApps.length / 4));

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* 消息通知弹幕 */}
      <MessageNotification 
        messages={notificationMessages} 
        onDismiss={onDismissNotification} 
      />
      
      {/* 页面容器 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, { offset, velocity }) => {
          const swipe = Math.abs(offset.x) * velocity.x;
          if (swipe < -1000 && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
          } else if (swipe > 1000 && currentPage > 0) {
            setCurrentPage(currentPage - 1);
          }
        }}
        animate={{ x: -currentPage * 100 + '%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex h-full"
      >
        {/* 第一页 - 左边小组件 + 右边应用 */}
        <div className="min-w-full px-1 flex gap-3 h-full">
          {/* 左边小组件区域 */}
          <div className="flex flex-col gap-3 w-[45%]">
            {widgets.filter(w => w.enabled).slice(0, 2).map((widget, index) => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                {renderWidget(widget)}
              </motion.div>
            ))}
          </div>

          {/* 右边应用图标区域 - 2x2网格 */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {socialApps.slice(0, 4).map((app, index) => (
              <motion.button
                key={app.id}
                onClick={() => onAppClick(app)}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + index * 0.05,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                whileHover={{ 
                  scale: 1.1,
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-2 group relative"
              >
                {/* 图标发光效果 */}
                <div className={`absolute inset-0 top-0 w-16 h-16 mx-auto bg-gradient-to-br ${app.bgColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>
                
                {/* 图标容器 */}
                <motion.div 
                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${app.bgColor} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                  whileTap={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-white/20"></div>
                  <div className="text-white relative z-10">
                    {renderAppIcon(app)}
                  </div>
                </motion.div>
                
                {/* 应用名称 */}
                <span className="text-white text-xs drop-shadow-lg line-clamp-1 w-full text-center px-1">
                  {app.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 后续页面 - 每页4个应用图标 (2x2) */}
        {Array.from({ length: totalPages - 1 }).map((_, pageIndex) => {
          const startIndex = (pageIndex + 1) * 4;
          const endIndex = startIndex + 4;
          const pageApps = socialApps.slice(startIndex, endIndex);
          
          if (pageApps.length === 0) return null;
          
          return (
            <div key={pageIndex + 1} className="min-w-full px-1">
              <div className="grid grid-cols-2 gap-4 max-w-[180px] mx-auto">
                {pageApps.map((app, index) => (
                  <motion.button
                    key={app.id}
                    onClick={() => onAppClick(app)}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.2 + index * 0.05,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    whileHover={{ 
                      scale: 1.1,
                      y: -5,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-2 group relative"
                  >
                    {/* 图标发光效果 */}
                    <div className={`absolute inset-0 top-0 w-16 h-16 mx-auto bg-gradient-to-br ${app.bgColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>
                    
                    {/* 图标容器 */}
                    <motion.div 
                      className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${app.bgColor} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                      whileTap={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-white/20"></div>
                      <div className="text-white relative z-10">
                        {renderAppIcon(app)}
                      </div>
                    </motion.div>
                    
                    {/* 应用名称 */}
                    <span className="text-white text-xs drop-shadow-lg line-clamp-1 w-full text-center px-1">
                      {app.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>



      {/* 页面指示器 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`h-2 rounded-full transition-all ${
              currentPage === index ? 'w-6 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
