// RedPacketMessage Component - 红包消息显示
import { Gift, Check } from 'lucide-react';

interface RedPacketMessageProps {
  note: string;
  amount?: number;
  type?: 'normal' | 'lucky';
  count?: number;
  status?: 'pending' | 'finished' | 'expired';
  receivers?: Array<{ userId: string; amount: number; timestamp: number }>;
  isReceived?: boolean; // 当前用户是否已领取
  receivedAmount?: number; // 当前用户领取的金额
  onClick?: () => void;
}

export function RedPacketMessage({
  note,
  amount,
  type = 'normal',
  count = 1,
  status = 'pending',
  receivers = [],
  isReceived = false,
  receivedAmount,
  onClick
}: RedPacketMessageProps) {
  const isExpired = status === 'expired';
  const isFinished = status === 'finished';
  const receivedCount = receivers.length;

  return (
    <div 
      onClick={(e) => {
        if (isExpired) return;
        console.log('🧧 [RedPacketMessage] 点击红包消息');
        onClick?.();
      }}
      className={`bg-gradient-to-br from-red-500 to-orange-500 rounded-lg p-4 max-w-[240px] ${
        isExpired ? 'opacity-60' : 'cursor-pointer active:scale-95'
      } transition-all shadow-lg`}
    >
      <div className="flex items-start gap-3">
        {/* 红包图标 */}
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-white" />
        </div>

        {/* 红包内容 */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm mb-1 truncate">{note}</div>
          {type === 'lucky' && !isExpired && (
            <div className="text-white/80 text-xs">
              {isFinished ? '已抢完' : `${receivedCount}/${count} 个红包`}
            </div>
          )}
          {isExpired && (
            <div className="text-white/80 text-xs">已过期</div>
          )}
        </div>

        {/* 已领取标记 */}
        {isReceived && !isExpired && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* 已领取金额 */}
      {isReceived && receivedAmount !== undefined && !isExpired && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="text-white/80 text-xs">
            已领取 ¥{receivedAmount.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}