// RedPacketDialog Component - 红包发起界面
import { useState, useEffect } from 'react';
import { X, Gift, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Contact } from './Contacts';
import { publicAnonKey, projectId } from '../utils/supabase/info';

interface RedPacketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Contact | null;
  onConfirm: (amount: number, note: string, type: 'normal' | 'lucky', count: number) => void;
  isGroup?: boolean;
  userId: string;
}

export function RedPacketDialog({ isOpen, onClose, recipient, onConfirm, isGroup = false, userId }: RedPacketDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('恭喜发财，大吉大利');
  const [type, setType] = useState<'normal' | 'lucky'>('normal');
  const [count, setCount] = useState('1');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  console.log('[RedPacketDialog]渲染，isOpen:', isOpen, 'isGroup:', isGroup, 'recipient:', recipient);

  // 加载余额
  useEffect(() => {
    console.log('🧧 [RedPacketDialog] useEffect触发，isOpen:', isOpen);
    if (isOpen) {
      console.log('🧧 [RedPacketDialog] 开始加载余额...');
      loadBalance();
    }
  }, [isOpen]);

  const loadBalance = async () => {
    console.log('🧧 [RedPacketDialog] loadBalance函数开始执行');
    setLoadingBalance(true);
    try {
      console.log('🧧 [RedPacketDialog] 发送请求获取余额...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/balance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ userId })
        }
      );

      console.log('🧧 [RedPacketDialog] 收到响应，status:', response.status, 'ok:', response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('🧧 [RedPacketDialog] 获取余额成功:', data.balance);
        setBalance(data.balance || 0);
      } else {
        const errorText = await response.text();
        console.error('🧧 [RedPacketDialog] 获取余额失败，响应:', errorText);
      }
    } catch (error) {
      console.error('🧧 [RedPacketDialog] 获取余额异常:', error);
    } finally {
      setLoadingBalance(false);
      console.log('🧧 [RedPacketDialog] loadBalance函数执行完成');
    }
  };

  const handleAmountChange = (value: string) => {
    // 只允许数字和小数点，最多两位小数
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleCountChange = (value: string) => {
    // 只允许正整数
    const regex = /^\d*$/;
    if (regex.test(value) || value === '') {
      const num = parseInt(value) || 0;
      if (num <= 100) {
        setCount(value);
      }
    }
  };

  const handleNext = () => {
    const amountNum = parseFloat(amount);
    const countNum = parseInt(count) || 1;
    
    // 验证金额
    if (amountNum <= 0 || amountNum > 200) {
      return;
    }
    
    // 如果是拼手气红包，验证个数
    if (type === 'lucky' && countNum < 1) {
      return;
    }
    
    // 验证总金额不超过200元
    if (type === 'normal' && amountNum * countNum > 200) {
      return;
    }
    
    setStep('confirm');
  };

  const handleConfirm = () => {
    const amountNum = parseFloat(amount);
    const countNum = type === 'lucky' ? parseInt(count) || 1 : 1;
    onConfirm(amountNum, note, type, countNum);
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setNote('恭喜发财，大吉大利');
    setType('normal');
    setCount('1');
    setStep('input');
    onClose();
  };

  const amountNum = parseFloat(amount);
  const countNum = parseInt(count) || 1;
  const totalAmount = type === 'normal' ? amountNum * countNum : amountNum;
  const isValidAmount = amountNum > 0 && totalAmount <= 200;
  const isValidCount = countNum >= 1 && countNum <= 100;
  const hasEnoughBalance = totalAmount <= balance;
  const balanceShortage = totalAmount > balance ? totalAmount - balance : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-[340px] bg-white border-0 rounded-2xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{step === 'input' ? '发红包' : '确认红包'}</DialogTitle>
          <DialogDescription>
            {step === 'input' ? '输入红包金额和祝福语' : '确认红包信息'}
          </DialogDescription>
        </DialogHeader>
        {step === 'input' ? (
          // 输入页面
          <div className="flex flex-col h-[550px]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-base">发红包</span>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-gradient-to-br from-red-50 to-orange-50">
              {/* 当前余额显示 */}
              <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">零钱余额</span>
                  </div>
                  <div className="text-lg text-gray-900">
                    {loadingBalance ? (
                      <span className="text-sm text-gray-400">加载中...</span>
                    ) : (
                      <span>¥{balance.toFixed(2)} {/* balance值: {balance} */}</span>
                    )}
                  </div>
                </div>
              </div>

              {!isGroup && recipient && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">发给</div>
                  <div className="flex items-center gap-2">
                    <img src={recipient?.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-gray-900">{recipient?.remark || recipient?.nickname}</span>
                  </div>
                </div>
              )}

              {/* 红包类型选择（仅群聊显示） */}
              {isGroup && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">红包类型</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setType('normal');
                        setCount('1');
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        type === 'normal'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm">普通红包</div>
                      <div className="text-xs text-gray-500 mt-1">每人固定金额</div>
                    </button>
                    <button
                      onClick={() => setType('lucky')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        type === 'lucky'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm">拼手气红包</div>
                      <div className="text-xs text-gray-500 mt-1">金额随机</div>
                    </button>
                  </div>
                </div>
              )}

              {/* 红包个数（仅拼手气红包显示） */}
              {type === 'lucky' && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">红包个数</div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={count}
                      onChange={(e) => handleCountChange(e.target.value)}
                      placeholder="1"
                      className="text-lg"
                    />
                    <span className="text-sm text-gray-500">个</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">最多100个红包</div>
                </div>
              )}

              {/* 单个红包金额 */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  {type === 'lucky' ? '总金额' : '单个金额'}
                </div>
                <div className="flex items-baseline gap-1 bg-white rounded-lg p-3">
                  <span className="text-2xl text-red-600">¥</span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="border-0 text-3xl text-red-600 px-0 h-auto focus-visible:ring-0"
                    autoFocus
                  />
                </div>
                {type === 'normal' && countNum > 1 && (
                  <div className="text-sm text-gray-500 mt-1">
                    共 {countNum} 个，总金额 ¥{totalAmount.toFixed(2)}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">单个红包金额0.01~200元</div>
              </div>

              {/* 祝福语 */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">祝福语</div>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="恭喜发财，大吉大利"
                  className="text-sm"
                  maxLength={20}
                />
                <div className="text-xs text-gray-400 text-right mt-1">{note.length}/20</div>
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <Button
                onClick={handleNext}
                disabled={!isValidAmount || (type === 'lucky' && !isValidCount) || !hasEnoughBalance}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                塞钱进红包
              </Button>
              {!hasEnoughBalance && (
                <div className="text-sm text-red-500 mt-2">
                  余额不足，还需 ¥{balanceShortage.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ) : (
          // 确认页面
          <div className="flex flex-col h-[450px]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button onClick={() => setStep('input')} className="text-gray-500 hover:text-gray-700">
                ←
              </button>
              <span className="text-base">确认红包</span>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-500 to-orange-500">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Gift className="w-10 h-10 text-white" />
              </div>

              <div className="text-center text-white mb-6">
                <div className="text-4xl mb-2">¥{totalAmount.toFixed(2)}</div>
                {type === 'lucky' && (
                  <div className="text-sm opacity-90">拼手气红包 × {countNum}</div>
                )}
                {type === 'normal' && countNum > 1 && (
                  <div className="text-sm opacity-90">普通红包 × {countNum}，每个¥{amountNum.toFixed(2)}</div>
                )}
                <div className="text-base mt-3">{note}</div>
              </div>

              <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-white/80 text-center">
                  {isGroup 
                    ? '发出后24小时内未领取的红包将自动退回'
                    : '红包发出后对方可立即领取'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <Button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
              >
                发红包
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}