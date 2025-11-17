// GiftDialog Component - 礼物选择和发送界面（支持自定义礼物和价格）
import { useState, useEffect } from 'react';
import { X, Gift, Sparkles, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Contact } from './Contacts';
import { toast } from 'sonner@2.0.3';

interface GiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Contact | null;
  onConfirm: (giftId: string, giftName: string, giftIcon: string, message: string, price?: number) => void;
  userId?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  description: string;
  color: string;
  price?: number; // 礼物价格
  isCustom?: boolean; // 是否为自定义礼物
}

const DEFAULT_GIFT_ITEMS: GiftItem[] = [
  { 
    id: 'rose', 
    name: '玫瑰花', 
    icon: '🌹', 
    emoji: '🌹',
    description: '浪漫的爱意',
    color: 'from-pink-400 to-red-400',
    price: 1
  },
  { 
    id: 'heart', 
    name: '爱心', 
    icon: '❤️', 
    emoji: '❤️',
    description: '满满的心意',
    color: 'from-red-400 to-pink-500',
    price: 0.5
  },
  { 
    id: 'cake', 
    name: '蛋糕', 
    icon: '🎂', 
    emoji: '🎂',
    description: '甜蜜祝福',
    color: 'from-yellow-400 to-orange-400',
    price: 5
  },
  { 
    id: 'flower', 
    name: '花束', 
    icon: '💐', 
    emoji: '💐',
    description: '美好祝愿',
    color: 'from-purple-400 to-pink-400',
    price: 3
  },
  { 
    id: 'star', 
    name: '星星', 
    icon: '⭐', 
    emoji: '⭐',
    description: '闪耀光芒',
    color: 'from-yellow-300 to-yellow-500',
    price: 2
  },
  { 
    id: 'coffee', 
    name: '咖啡', 
    icon: '☕', 
    emoji: '☕',
    description: '暖心时刻',
    color: 'from-amber-600 to-amber-800',
    price: 4
  },
  { 
    id: 'music', 
    name: '音乐盒', 
    icon: '🎵', 
    emoji: '🎵',
    description: '动听旋律',
    color: 'from-blue-400 to-purple-500',
    price: 8
  },
  { 
    id: 'book', 
    name: '书籍', 
    icon: '📚', 
    emoji: '📚',
    description: '知识礼物',
    color: 'from-green-500 to-teal-500',
    price: 6
  },
  { 
    id: 'game', 
    name: '游戏手柄', 
    icon: '🎮', 
    emoji: '🎮',
    description: '欢乐时光',
    color: 'from-indigo-500 to-purple-600',
    price: 10
  },
  { 
    id: 'crown', 
    name: '皇冠', 
    icon: '👑', 
    emoji: '👑',
    description: '尊贵礼赠',
    color: 'from-yellow-500 to-amber-600',
    price: 20
  },
  { 
    id: 'teddy', 
    name: '玩具熊', 
    icon: '🧸', 
    emoji: '🧸',
    description: '温暖陪伴',
    color: 'from-amber-400 to-orange-500',
    price: 12
  },
  { 
    id: 'diamond', 
    name: '钻石', 
    icon: '💎', 
    emoji: '💎',
    description: '珍贵心意',
    color: 'from-cyan-400 to-blue-500',
    price: 50
  },
];

// 从localStorage加载自定义礼物
const loadCustomGifts = (userId?: string): GiftItem[] => {
  try {
    const key = userId ? `custom_gifts_${userId}` : 'custom_gifts';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// 保存自定义礼物到localStorage
const saveCustomGifts = (gifts: GiftItem[], userId?: string) => {
  try {
    const key = userId ? `custom_gifts_${userId}` : 'custom_gifts';
    localStorage.setItem(key, JSON.stringify(gifts));
  } catch (error) {
    console.error('保存自定义礼物失败:', error);
  }
};

export function GiftDialog({ isOpen, onClose, recipient, onConfirm, userId }: GiftDialogProps) {
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'create'>('select');
  const [customGifts, setCustomGifts] = useState<GiftItem[]>([]);
  const [allGifts, setAllGifts] = useState<GiftItem[]>([]);
  
  // 创建自定义礼物的表单状态
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('🎁');
  const [customDescription, setCustomDescription] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customColor, setCustomColor] = useState('from-pink-400 to-purple-400');
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);

  // 加载自定义礼物
  useEffect(() => {
    const loaded = loadCustomGifts(userId);
    setCustomGifts(loaded);
    setAllGifts([...DEFAULT_GIFT_ITEMS, ...loaded]);
  }, [userId]);

  const handleSelectGift = (gift: GiftItem) => {
    setSelectedGift(gift);
    setMessage(`送你一个${gift.name}${gift.emoji}`);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedGift) return;
    onConfirm(selectedGift.id, selectedGift.name, selectedGift.emoji, message, selectedGift.price);
    handleClose();
  };

  const handleClose = () => {
    setSelectedGift(null);
    setMessage('');
    setStep('select');
    setEditingGiftId(null);
    resetCustomForm();
    onClose();
  };

  const resetCustomForm = () => {
    setCustomName('');
    setCustomIcon('🎁');
    setCustomDescription('');
    setCustomPrice('');
    setCustomColor('from-pink-400 to-purple-400');
  };

  const handleCreateCustomGift = () => {
    setStep('create');
    setEditingGiftId(null);
    resetCustomForm();
  };

  const handleEditGift = (gift: GiftItem) => {
    setEditingGiftId(gift.id);
    setCustomName(gift.name);
    setCustomIcon(gift.icon);
    setCustomDescription(gift.description);
    setCustomPrice(gift.price?.toString() || '');
    setCustomColor(gift.color);
    setStep('create');
  };

  const handleDeleteGift = (giftId: string) => {
    const updated = customGifts.filter(g => g.id !== giftId);
    setCustomGifts(updated);
    saveCustomGifts(updated, userId);
    setAllGifts([...DEFAULT_GIFT_ITEMS, ...updated]);
    toast.success('礼物已删除');
  };

  const handleSaveCustomGift = () => {
    if (!customName.trim()) {
      toast.error('请输入礼物名称');
      return;
    }
    if (!customIcon.trim()) {
      toast.error('请输入礼物图标');
      return;
    }

    const price = customPrice ? parseFloat(customPrice) : undefined;
    if (customPrice && (isNaN(price!) || price! < 0)) {
      toast.error('请输入有效的价格');
      return;
    }

    if (editingGiftId) {
      // 编辑现有礼物
      const updated = customGifts.map(g => 
        g.id === editingGiftId 
          ? {
              ...g,
              name: customName,
              icon: customIcon,
              emoji: customIcon,
              description: customDescription,
              price,
              color: customColor
            }
          : g
      );
      setCustomGifts(updated);
      saveCustomGifts(updated, userId);
      setAllGifts([...DEFAULT_GIFT_ITEMS, ...updated]);
      toast.success('礼物已更新');
    } else {
      // 创建新礼物
      const newGift: GiftItem = {
        id: `custom_${Date.now()}`,
        name: customName,
        icon: customIcon,
        emoji: customIcon,
        description: customDescription,
        color: customColor,
        price,
        isCustom: true
      };
      const updated = [...customGifts, newGift];
      setCustomGifts(updated);
      saveCustomGifts(updated, userId);
      setAllGifts([...DEFAULT_GIFT_ITEMS, ...updated]);
      toast.success('自定义礼物已创建');
    }

    setStep('select');
    resetCustomForm();
    setEditingGiftId(null);
  };

  const colorOptions = [
    { name: '粉紫渐变', value: 'from-pink-400 to-purple-400' },
    { name: '红粉渐变', value: 'from-red-400 to-pink-500' },
    { name: '黄橙渐变', value: 'from-yellow-400 to-orange-400' },
    { name: '蓝紫渐变', value: 'from-blue-400 to-purple-500' },
    { name: '绿青渐变', value: 'from-green-500 to-teal-500' },
    { name: '金黄渐变', value: 'from-yellow-500 to-amber-600' },
    { name: '青蓝渐变', value: 'from-cyan-400 to-blue-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-[360px] bg-white border-0 rounded-2xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {step === 'select' ? '选择礼物' : step === 'confirm' ? '确认礼物' : '自定义礼物'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' ? '选择一个礼物发送给好友' : step === 'confirm' ? '确认礼物信息' : '创建或编辑自定义礼物'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'select' ? (
          // 选择礼物页面
          <div className="flex flex-col h-[550px]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-base">选择礼物</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCreateCustomGift}
                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  自定义
                </button>
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
              {recipient && (
                <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-2">送给</div>
                  <div className="flex items-center gap-2">
                    <img src={recipient?.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-gray-900">{recipient?.remark || recipient?.nickname}</span>
                  </div>
                </div>
              )}

              {/* 自定义礼物区域 */}
              {customGifts.length > 0 && (
                <>
                  <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    我的自定义礼物
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {customGifts.map((gift) => (
                      <div key={gift.id} className="relative group">
                        <button
                          onClick={() => handleSelectGift(gift)}
                          className="w-full flex flex-col items-center gap-2 p-3 bg-white rounded-xl hover:shadow-md transition-all active:scale-95"
                        >
                          <div className={`w-16 h-16 bg-gradient-to-br ${gift.color} rounded-full flex items-center justify-center text-3xl shadow-lg`}>
                            {gift.icon}
                          </div>
                          <div className="text-sm text-gray-700 text-center leading-tight">
                            {gift.name}
                          </div>
                          {gift.price !== undefined && (
                            <div className="text-xs text-pink-600 flex items-center gap-0.5">
                              <DollarSign className="w-3 h-3" />
                              {gift.price}
                            </div>
                          )}
                        </button>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGift(gift);
                            }}
                            className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGift(gift.id);
                            }}
                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 默认礼物区域 */}
              <div className="text-sm text-gray-600 mb-2">默认礼物</div>
              <div className="grid grid-cols-3 gap-3 pb-2">
                {DEFAULT_GIFT_ITEMS.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSelectGift(gift)}
                    className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl hover:shadow-md transition-all active:scale-95"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${gift.color} rounded-full flex items-center justify-center text-3xl shadow-lg`}>
                      {gift.icon}
                    </div>
                    <div className="text-sm text-gray-700 text-center leading-tight">
                      {gift.name}
                    </div>
                    {gift.price !== undefined && (
                      <div className="text-xs text-pink-600 flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3" />
                        {gift.price}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : step === 'confirm' ? (
          // 确认页面
          <div className="flex flex-col h-[500px]">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
              <button onClick={() => setStep('select')} className="text-gray-500 hover:text-gray-700">
                ←
              </button>
              <span className="text-base">确认礼物</span>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col items-center p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
              {selectedGift && (
                <>
                  <div className="relative mb-6 mt-4">
                    <div className={`w-24 h-24 bg-gradient-to-br ${selectedGift.color} rounded-full flex items-center justify-center text-5xl shadow-2xl animate-pulse`}>
                      {selectedGift.icon}
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-2xl mb-2">{selectedGift.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{selectedGift.description}</div>
                    {selectedGift.price !== undefined && (
                      <div className="flex items-center justify-center gap-1 text-pink-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-lg">{selectedGift.price}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full mb-4 max-w-sm">
                    <div className="text-sm text-gray-600 mb-2">附言</div>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="说点什么..."
                      className="text-sm bg-white/80 backdrop-blur-sm"
                      maxLength={50}
                    />
                    <div className="text-xs text-gray-400 text-right mt-1">{message.length}/50</div>
                  </div>

                  <div className="w-full bg-white/60 backdrop-blur-sm rounded-lg p-3 max-w-sm mb-4">
                    <div className="text-xs text-gray-600 text-center">
                      礼物将立即发送给{recipient?.remark || recipient?.nickname}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t bg-white flex-shrink-0">
              <Button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                <Gift className="w-4 h-4 mr-2" />
                发送礼物
              </Button>
            </div>
          </div>
        ) : (
          // 自定义礼物创建/编辑页面
          <div className="flex flex-col h-[550px]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button onClick={() => {
                setStep('select');
                setEditingGiftId(null);
                resetCustomForm();
              }} className="text-gray-500 hover:text-gray-700">
                ←
              </button>
              <span className="text-base">{editingGiftId ? '编辑礼物' : '自定义礼物'}</span>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
              <div className="space-y-4 pb-2">
                {/* 礼物图标预览 */}
                <div className="flex justify-center mb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${customColor} rounded-full flex items-center justify-center text-4xl shadow-lg`}>
                    {customIcon || '🎁'}
                  </div>
                </div>

                {/* 礼物名称 */}
                <div>
                  <Label htmlFor="gift-name">礼物名称 *</Label>
                  <Input
                    id="gift-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="例如：玫瑰花"
                    className="mt-1"
                    maxLength={10}
                  />
                </div>

                {/* 礼物图标 */}
                <div>
                  <Label htmlFor="gift-icon">礼物图标 (Emoji) *</Label>
                  <Input
                    id="gift-icon"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    placeholder="例如：🌹"
                    className="mt-1"
                    maxLength={4}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    在电脑上按 Win + . 或 Mac 上按 Ctrl + Cmd + Space 打开Emoji面板
                  </div>
                </div>

                {/* 礼物描述 */}
                <div>
                  <Label htmlFor="gift-desc">礼物描述</Label>
                  <Input
                    id="gift-desc"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="例如：浪漫的爱意"
                    className="mt-1"
                    maxLength={20}
                  />
                </div>

                {/* 礼物价格 */}
                <div>
                  <Label htmlFor="gift-price">礼物价格</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="gift-price"
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* 颜色选择 */}
                <div>
                  <Label>礼物颜色</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setCustomColor(color.value)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          customColor === color.value 
                            ? 'border-pink-500 shadow-md' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-full h-8 bg-gradient-to-r ${color.value} rounded`}></div>
                        <div className="text-xs text-center mt-1">{color.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <Button
                onClick={handleSaveCustomGift}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {editingGiftId ? '保存修改' : '创建礼物'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}