// RedPacketDetail Component - 红包详情和领取界面
import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface RedPacketReceiver {
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  timestamp: number;
  isLuckiest?: boolean;
}

interface RedPacketDetailProps {
  isOpen: boolean;
  onClose: () => void;
  senderName: string;
  senderAvatar: string;
  note: string;
  type: 'normal' | 'lucky';
  totalAmount: number;
  count: number;
  receivers: RedPacketReceiver[];
  status: 'pending' | 'finished' | 'expired';
  canReceive: boolean; // 当前用户是否可以领取
  onReceive?: () => void;
  currentUserReceived?: RedPacketReceiver; // 当前用户领取的信息
}

export function RedPacketDetail({
  isOpen,
  onClose,
  senderName,
  senderAvatar,
  note,
  type,
  totalAmount,
  count,
  receivers,
  status,
  canReceive,
  onReceive,
  currentUserReceived
}: RedPacketDetailProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // 当对话框打开/关闭或者currentUserReceived变化时，重置showDetail状态
  useEffect(() => {
    if (!isOpen) {
      setShowDetail(false);
    }
  }, [isOpen]);

  // 调试信息
  console.log('🧧 [RedPacketDetail] 打开红包详情:', {
    canReceive,
    currentUserReceived,
    receivers,
    status,
    showDetail,
    isOpen
  });

  const handleOpen = async () => {
    console.log('🧧 [RedPacketDetail] handleOpen被调用:', { canReceive, isOpening });
    if (!canReceive || isOpening) {
      console.log('🧧 [RedPacketDetail] 无法领取:', { canReceive, isOpening });
      return;
    }
    
    setIsOpening(true);
    console.log('🧧 [RedPacketDetail] 开始领取动画');
    // 模拟开红包动画
    setTimeout(() => {
      console.log('🧧 [RedPacketDetail] 调用onReceive');
      if (onReceive) {
        onReceive();
      }
      setIsOpening(false);
      setShowDetail(true);
    }, 800);
  };

  const handleClose = () => {
    setShowDetail(false);
    onClose();
  };

  // 找出手气最佳（只有在红包被领完时才计算）
  const luckiestReceiver = type === 'lucky' && status === 'finished' && receivers.length > 0
    ? receivers.reduce((max, r) => r.amount > max.amount ? r : max, receivers[0])
    : null;

  const receivedCount = receivers.length;
  const receivedAmount = receivers.reduce((sum, r) => sum + r.amount, 0);
  const isExpired = status === 'expired';
  const isFinished = status === 'finished';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-[340px] bg-transparent border-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {!showDetail && !currentUserReceived ? '领取红包' : '红包详情'}
          </DialogTitle>
          <DialogDescription>
            {!showDetail && !currentUserReceived 
              ? `${senderName}的红包 - ${note}` 
              : `查看红包领取详情`}
          </DialogDescription>
        </DialogHeader>
        {!showDetail && !currentUserReceived ? (
          // 开红包界面
          <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative">
              {/* 关闭按钮 */}
              <button 
                onClick={handleClose}
                className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 头部信息 */}
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <img 
                  src={senderAvatar} 
                  alt={senderName}
                  className="w-14 h-14 rounded-full mb-3 ring-4 ring-white/30"
                />
                <div className="text-white text-base mb-1">{senderName}的红包</div>
                <div className="text-white/90 text-sm">{note}</div>
              </div>

              {/* 红包主体 */}
              <div className="flex flex-col items-center pb-8">
                {canReceive && !isExpired ? (
                  <button
                    onClick={handleOpen}
                    disabled={isOpening}
                    className={`w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all ${
                      isOpening ? 'scale-110 animate-pulse' : 'hover:scale-105'
                    }`}
                  >
                    <Gift className={`w-12 h-12 text-white ${isOpening ? 'animate-bounce' : ''}`} />
                  </button>
                ) : (
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Gift className="w-12 h-12 text-white/50" />
                  </div>
                )}
                
                <div className="text-white/80 text-sm mt-4">
                  {isExpired ? '红包已过期' : 
                   isFinished ? '手慢了，红包已被抢完' :
                   canReceive ? '点击开红包' : ''}
                </div>
              </div>

              {/* 底部信息 */}
              {type === 'lucky' && (
                <div className="bg-white/10 backdrop-blur-sm py-3 text-center">
                  <div className="text-white/80 text-xs">
                    {receivedCount}/{count} 个红包，已领取 ¥{receivedAmount.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // 红包详情界面
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[600px] flex flex-col">
            {/* 顶部领取信息 */}
            <div className="bg-gradient-to-br from-red-500 to-orange-500 px-6 py-8 text-center relative">
              <button 
                onClick={handleClose}
                className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {currentUserReceived && (
                <>
                  <div className="text-white text-4xl mb-2">
                    ¥{currentUserReceived.amount.toFixed(2)}
                  </div>
                  {currentUserReceived.isLuckiest && (
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs mb-2">
                      🎉 手气最佳
                    </div>
                  )}
                  <div className="text-white/90 text-sm">{senderName}的红包</div>
                  <div className="text-white/80 text-xs mt-1">{note}</div>
                </>
              )}
            </div>

            {/* 领取记录 */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50 to-white">
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-3">
                  {type === 'lucky' ? '拼手气红包' : '普通红包'} · 已领取{receivedCount}/{count}
                </div>
                
                <div className="space-y-2">
                  {receivers
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((receiver, index) => {
                      const isLuckiest = luckiestReceiver?.userId === receiver.userId;
                      const isCurrentUser = currentUserReceived?.userId === receiver.userId;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isCurrentUser ? 'bg-red-50' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <img 
                            src={receiver.userAvatar}
                            alt={receiver.userName}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm truncate">
                                {receiver.userName}
                                {isCurrentUser && <span className="text-gray-400">（我）</span>}
                              </span>
                              {isLuckiest && type === 'lucky' && (
                                <span className="text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                                  手气最佳
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(receiver.timestamp).toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="text-base flex-shrink-0">
                            ¥{receiver.amount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 统计信息 */}
                {type === 'lucky' && receivers.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                    <div className="flex justify-between mb-1">
                      <span>总金额</span>
                      <span>¥{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>已领取</span>
                      <span>¥{receivedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}