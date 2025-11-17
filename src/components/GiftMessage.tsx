// GiftMessage Component - 礼物消息显示组件（支持价格显示）
import { Gift, Sparkles, DollarSign } from 'lucide-react';
import { ChatMessage } from './WeChat';

interface GiftMessageProps {
  message: ChatMessage;
  isMe: boolean;
  onLongPressStart?: (e: React.TouchEvent) => void;
  onLongPressEnd?: () => void;
}

export function GiftMessage({ message, isMe, onLongPressStart, onLongPressEnd }: GiftMessageProps) {
  // 防御性检查
  if (!message) {
    return null;
  }

  const giftIcon = message.giftIcon || '🎁';
  const giftName = message.giftName || '礼物';
  const giftMessage = message.giftMessage || '';
  const giftPrice = message.giftPrice;

  return (
    <div 
      className="max-w-[240px] select-none cursor-pointer active:opacity-80 transition-opacity"
      onTouchStart={onLongPressStart}
      onTouchEnd={onLongPressEnd}
    >
      <div className={`
        rounded-2xl p-4 shadow-md
        bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100
        border-2 border-white
      `}>
        {/* 礼物图标 */}
        <div className="flex items-center justify-center mb-3 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full flex items-center justify-center text-4xl shadow-lg">
            {giftIcon}
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        {/* 礼物信息 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Gift className="w-4 h-4 text-pink-600" />
            <span className="text-sm text-gray-700">{giftName}</span>
          </div>
          
          {/* 价格显示 */}
          {giftPrice !== undefined && (
            <div className="flex items-center justify-center gap-0.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-pink-600" />
              <span className="text-sm text-pink-600">{giftPrice}</span>
            </div>
          )}
          
          {giftMessage && (
            <div className="text-xs text-gray-600 mt-2 px-2 py-1 bg-white/60 rounded-lg">
              {giftMessage}
            </div>
          )}
        </div>

        {/* 底部装饰 */}
        <div className="flex items-center justify-center gap-1 mt-3 opacity-40">
          <Sparkles className="w-3 h-3 text-pink-500" />
          <Sparkles className="w-2 h-2 text-purple-500" />
          <Sparkles className="w-3 h-3 text-blue-500" />
        </div>
      </div>
    </div>
  );
}