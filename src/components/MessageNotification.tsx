import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export interface NotificationMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: number;
}

interface MessageNotificationProps {
  messages: NotificationMessage[];
  onDismiss: (id: string) => void;
}

export function MessageNotification({ messages, onDismiss }: MessageNotificationProps) {
  // 播放消息提示音
  const playNotificationSound = () => {
    // 使用 Web Audio API 创建提示音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 设置音调和音量
    oscillator.frequency.value = 800; // 频率 (Hz)
    gainNode.gain.value = 0.3; // 音量
    
    // 播放 0.1 秒
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    // 第二个音
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 1000;
      gainNode2.gain.value = 0.3;
      
      oscillator2.start();
      oscillator2.stop(audioContext.currentTime + 0.1);
    }, 100);
  };

  // 当有新消息时播放提示音
  useEffect(() => {
    if (messages.length > 0) {
      playNotificationSound();
    }
  }, [messages.length]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
            className="w-full pointer-events-auto"
          >
            {/* 仿微信通知样式 */}
            <div className="mx-2 mt-2 backdrop-blur-2xl bg-white/98 rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden">
              <div className="p-3 flex items-start gap-3">
                {/* 左侧头像 */}
                <div className="flex-shrink-0">
                  <Avatar className="w-11 h-11 ring-1 ring-gray-200/50">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                      {message.senderName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* 右侧内容区域 */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* 上方：发送者名称和关闭按钮 */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[13px] text-gray-900 truncate">{message.senderName}</span>
                    <button
                      onClick={() => onDismiss(message.id)}
                      className="ml-2 w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                      aria-label="关闭通知"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* 下方：消息内容 */}
                  <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
