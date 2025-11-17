import { PhoneOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Contact } from './Contacts';
import { motion } from 'motion/react';
import { useEffect } from 'react';

interface OutgoingVideoCallProps {
  contact: Contact;
  onCancel: () => void;
}

export function OutgoingVideoCall({ contact, onCancel }: OutgoingVideoCallProps) {
  // 震动效果
  useEffect(() => {
    // 检查浏览器是否支持震动API
    if ('vibrate' in navigator) {
      // 轻微震动提示
      navigator.vibrate(100);
      
      // 组件卸载时停止震动
      return () => {
        navigator.vibrate(0);
      };
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-white/10 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头像和信息 */}
        <div className="flex flex-col items-center gap-4">
          {/* 头像 - 带动画效果 */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Avatar className="w-24 h-24 border-4 border-white/20 shadow-xl">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="text-2xl">{contact.nickname[0]}</AvatarFallback>
            </Avatar>
          </motion.div>

          {/* 联系人名称 */}
          <div className="text-center">
            <h3 className="text-white text-xl font-medium mb-1">
              {contact.nickname}
            </h3>
            <p className="text-white/60 text-sm">正在呼叫...</p>
          </div>

          {/* 呼叫动画 */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 text-white/70 text-sm"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>等待对方接听...</span>
          </motion.div>

          {/* 波纹动画 */}
          <div className="relative w-20 h-20">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="absolute inset-0 border-2 border-blue-400 rounded-full"
                initial={{ opacity: 0.8, scale: 0.5 }}
                animate={{ 
                  opacity: 0,
                  scale: 1.5,
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.6,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {/* 挂断按钮 */}
          <div className="flex flex-col items-center gap-2">
            <Button
              size="icon"
              onClick={onCancel}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-105"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </Button>
            <span className="text-white/60 text-xs">取消</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
