import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Wallet, QrCode, CreditCard, Banknote, Gift, History, ArrowUpRight, ArrowDownLeft, TrendingUp, Users } from 'lucide-react';
import { StatusBar } from './StatusBar';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface WeChatWalletProps {
  onClose: () => void;
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
  userId: string;
}

export function WeChatWallet({
  onClose,
  realTime,
  batteryLevel,
  isCharging,
  userId
}: WeChatWalletProps) {
  const [balance, setBalance] = useState(0);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 预设金额选项
  const presetAmounts = [10, 50, 100, 200, 500, 1000];

  // 加载余额
  useEffect(() => {
    loadBalance();
  }, [userId]);

  const loadBalance = async () => {
    try {
      console.log('💰 [钱包] 加载余额，userId:', userId);
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

      if (response.ok) {
        const data = await response.json();
        console.log('💰 [钱包] 查询余额成功:', data.balance, 'userId:', userId);
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('加载余额失败:', error);
    }
  };

  // 充值
  const handleRecharge = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }

    if (amount > 50000) {
      toast.error('单次充值金额不能超过50000元');
      return;
    }

    setIsLoading(true);
    try {
      console.log('💰 [充值] 开始充值:', amount);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/recharge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ userId, amount })
        }
      );

      console.log('💰 [充值] 响应状态:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('💰 [充值] 充值成功，新余额:', data.balance);
        setBalance(data.balance);
        toast.success(`充值成功！已充值¥${amount.toFixed(2)}`);
        setShowRechargeDialog(false);
        setSelectedAmount(null);
        setCustomAmount('');
      } else {
        // 尝试解析错误信息
        try {
          const errorData = await response.json();
          console.error('💰 [充值] 充值失败:', errorData);
          toast.error(errorData.error || '充值失败，请重试');
        } catch {
          const errorText = await response.text();
          console.error('💰 [充值] 充值失败（文本）:', errorText);
          toast.error('充值失败，请重试');
        }
      }
    } catch (error) {
      console.error('💰 [充值] 充值异常:', error);
      toast.error('充值失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 提现
  const handleWithdraw = async () => {
    if (balance <= 0) {
      toast.error('余额不足');
      return;
    }
    toast.info('提现功能开发中');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#EDEDED] flex flex-col">
      {/* 状态栏 */}
      <StatusBar realTime={realTime} batteryLevel={batteryLevel} isCharging={isCharging} />

      {/* 顶部导航栏 */}
      <div className="bg-white border-b">
        <div className="h-[50px] flex items-center justify-between px-4">
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <span className="text-gray-800">服务</span>
          <div className="w-8 h-8"></div>
        </div>
      </div>

      {/* 主内容区 */}
      <ScrollArea className="flex-1">
        {/* 钱包余额卡片 */}
        <div className="relative bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 mx-4 mt-4 rounded-2xl p-6 shadow-xl overflow-hidden">
          {/* 装饰性背景圆圈 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-lg">零钱</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white opacity-70" />
            </div>
            <div className="mb-6">
              <div className="text-white text-sm opacity-90 mb-1">账户余额</div>
              <div className="text-white text-5xl tracking-tight">
                ¥{balance.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRechargeDialog(true)}
                className="flex-1 bg-white text-green-700 py-3 rounded-xl transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>充值</span>
              </button>
              <button 
                onClick={handleWithdraw}
                className="flex-1 bg-white bg-opacity-20 text-white py-3 rounded-xl transition-all hover:bg-opacity-30 active:scale-95 backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>提现</span>
              </button>
            </div>
          </div>
        </div>

        {/* 快捷功能 */}
        <div className="bg-white mt-4 rounded-2xl mx-4 p-5 shadow-sm">
          <div className="grid grid-cols-4 gap-4">
            <button 
              onClick={() => toast.info('收付款功能开发中')}
              className="flex flex-col items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-md">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-700">收付款</span>
            </button>
            <button 
              onClick={() => toast.info('转账功能开发中')}
              className="flex flex-col items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-md">
                <Banknote className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-700">转账</span>
            </button>
            <button 
              onClick={() => toast.info('群收款功能开发中')}
              className="flex flex-col items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-md">
                <Users className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-700">群收款</span>
            </button>
            <button 
              onClick={() => toast.info('红包功能开发中')}
              className="flex flex-col items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-700">红包</span>
            </button>
          </div>
        </div>

        {/* 理财与账单 */}
        <div className="bg-white mt-4 rounded-2xl mx-4 shadow-sm overflow-hidden">
          <button 
            onClick={() => toast.info('理财通功能开发中')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] text-gray-800">理财通</p>
              <p className="text-xs text-gray-400 mt-1">基金 · 股票 · 黄金</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button 
            onClick={() => toast.info('账单功能开发中')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <History className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] text-gray-800">账单</p>
              <p className="text-xs text-gray-400 mt-1">查看交易记录</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 银行卡 */}
        <div className="bg-white mt-4 mb-4 rounded-2xl mx-4 shadow-sm overflow-hidden">
          <button 
            onClick={() => toast.info('银行卡功能开发中')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] text-gray-800">银行卡</p>
              <p className="text-xs text-gray-400 mt-1">未添加银行卡</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </ScrollArea>

      {/* 充值对话框 */}
      <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>充值零钱</DialogTitle>
            <DialogDescription>选择充值金额或输入自定义金额</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 当前余额 */}
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">当前余额</p>
              <p className="text-2xl font-medium text-gray-800">¥{balance.toFixed(2)}</p>
            </div>

            {/* 预设金额 */}
            <div>
              <p className="text-sm text-gray-600 mb-3">选择金额</p>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`py-3 rounded-lg border-2 transition-all ${
                      selectedAmount === amount
                        ? 'border-green-600 bg-green-50 text-green-600'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义金额 */}
            <div>
              <p className="text-sm text-gray-600 mb-2">或输入金额</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <Input
                  type="number"
                  placeholder="请输入金额"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">单次充值上限¥50,000</p>
            </div>

            {/* 充值按钮 */}
            <Button
              onClick={handleRecharge}
              disabled={isLoading || (!selectedAmount && !customAmount)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? '充值中...' : `确认充值${selectedAmount || customAmount ? ` ¥${(selectedAmount || parseFloat(customAmount) || 0).toFixed(2)}` : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}