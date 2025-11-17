import { Signal, Battery, BatteryCharging } from 'lucide-react';
import { motion } from 'motion/react';

interface StatusBarProps {
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
  theme?: 'light' | 'dark';
}

export function StatusBar({ realTime, batteryLevel, isCharging, theme = 'dark' }: StatusBarProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  
  // 安全检查：如果 realTime 未定义，使用当前时间
  const currentTime = realTime || new Date();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className={`flex justify-between items-center ${textColor} text-xs px-4 py-2 flex-shrink-0`}
    >
      <span className="opacity-90">
        {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
      </span>
      <div className="flex gap-1 items-center opacity-90">
        <Signal className="w-3 h-3" />
        {isCharging ? (
          <BatteryCharging className="w-3 h-3" />
        ) : (
          <Battery className="w-3 h-3" />
        )}
        <span>{batteryLevel}%</span>
      </div>
    </motion.div>
  );
}