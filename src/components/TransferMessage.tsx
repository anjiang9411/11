// TransferMessage Component - 微信转账消息卡片
import { CreditCard } from 'lucide-react';
import { ChatMessage } from './WeChat';

interface TransferMessageProps {
  message: ChatMessage;
  isMe: boolean;
  onReceive?: (messageId: string) => void;
  onLongPressStart?: (e: React.TouchEvent | React.MouseEvent) => void;
  onLongPressEnd?: () => void;
}

export function TransferMessage({ message, isMe, onReceive, onLongPressStart, onLongPressEnd }: TransferMessageProps) {
  const { transferAmount, transferNote, transferStatus } = message;

  const handleClick = () => {
    // 只有接收方且转账待领取时才能点击领取
    if (!isMe && transferStatus === 'pending' && onReceive) {
      onReceive(message.id);
    }
  };

  const eventHandlers = {
    onTouchStart: onLongPressStart,
    onTouchEnd: onLongPressEnd,
    onMouseDown: onLongPressStart,
    onMouseUp: onLongPressEnd,
    onMouseLeave: onLongPressEnd,
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-lg p-4 w-[260px] shadow-lg ${
        !isMe && transferStatus === 'pending' ? 'hover:from-orange-500 hover:to-orange-600 cursor-pointer' : 'cursor-default'
      } transition-all`}
      {...eventHandlers}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium">微信转账</div>
          {transferNote && (
            <div className="text-sm opacity-90 mt-0.5">{transferNote}</div>
          )}
        </div>
      </div>
      
      <div className="h-px bg-white/20 mb-3" />
      
      <div className="flex items-center justify-between">
        <div className="text-2xl">¥{transferAmount?.toFixed(2)}</div>
        <div className="text-sm opacity-90">
          {transferStatus === 'pending' && (isMe ? '待对方领取' : '点击领取')}
          {transferStatus === 'received' && (isMe ? '对方已领取' : '已领取')}
          {transferStatus === 'expired' && '已过期'}
        </div>
      </div>

      {transferStatus === 'received' && message.transferReceivedAt && (
        <div className="text-xs opacity-75 mt-2 text-right">
          {new Date(message.transferReceivedAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })} 已存入零钱
        </div>
      )}
    </button>
  );
}