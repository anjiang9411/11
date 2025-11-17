// TransferDialog Component - 转账发起界面
import { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Contact } from './Contacts';

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Contact | null;
  onConfirm: (amount: number, note: string) => void;
}

export function TransferDialog({ isOpen, onClose, recipient, onConfirm }: TransferDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  const handleAmountChange = (value: string) => {
    // 只允许数字和小数点，最多两位小数
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleNext = () => {
    const amountNum = parseFloat(amount);
    if (amountNum > 0 && amountNum <= 200000) {
      setStep('confirm');
    }
  };

  const handleConfirm = () => {
    const amountNum = parseFloat(amount);
    onConfirm(amountNum, note);
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setNote('');
    setStep('input');
    onClose();
  };

  const amountNum = parseFloat(amount);
  const isValidAmount = amountNum > 0 && amountNum <= 200000;

  // 快捷金额
  const quickAmounts = [6.66, 8.88, 66, 88, 166, 188, 666, 888];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-[340px] bg-white border-0 rounded-2xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{step === 'input' ? '转账' : '确认转账'}</DialogTitle>
          <DialogDescription>
            {step === 'input' ? '输入转账金额和留言' : '确认转账信息'}
          </DialogDescription>
        </DialogHeader>
        {step === 'input' ? (
          // 输入金额页面
          <div className="flex flex-col h-[500px]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-base">转账</span>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">转账给</div>
                <div className="flex items-center gap-2">
                  <img src={recipient?.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <span>{recipient?.remark || recipient?.nickname}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">转账金额</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl">¥</span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="border-0 border-b-2 border-gray-300 rounded-none text-4xl px-0 h-auto focus-visible:ring-0 focus-visible:border-green-500"
                    autoFocus
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">单笔限额¥200,000.00</div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">添加转账说明（选填）</div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="恭喜发财，大吉大利"
                  className="resize-none h-20 text-sm"
                  maxLength={50}
                />
                <div className="text-xs text-gray-400 text-right mt-1">{note.length}/50</div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">快捷金额</div>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                    >
                      ¥{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t">
              <Button
                onClick={handleNext}
                disabled={!isValidAmount}
                className="w-full bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                下一步
              </Button>
            </div>
          </div>
        ) : (
          // 确认页面
          <div className="flex flex-col max-h-[550px]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button onClick={() => setStep('input')} className="text-gray-500 hover:text-gray-700">
                ←
              </button>
              <span className="text-base">确认转账</span>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 overflow-y-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>

              <div className="text-center mb-6">
                <div className="text-3xl mb-2">¥{amountNum.toFixed(2)}</div>
                <div className="text-gray-500 text-sm">转账给 {recipient?.remark || recipient?.nickname}</div>
                {note && (
                  <div className="text-sm text-gray-400 mt-2">"{note}"</div>
                )}
              </div>

              <div className="w-full bg-white rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">支付方式</span>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-500" />
                    <span className="text-sm">零钱</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  温馨提示：转账将在24小时内到账，对方未领取将自动退回
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <Button
                onClick={handleConfirm}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                确认转账
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Wallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
    </svg>
  );
}