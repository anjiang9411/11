import React from 'react';
import { createPortal } from 'react-dom';
import { Copy, Forward, Star, RotateCcw, CheckSquare, MessageSquareQuote, Bell, Search, Edit } from 'lucide-react';

interface MessageContextMenuProps {
  isMe: boolean;
  message: any;
  position: { x: number; y: number; showBelow?: boolean };
  onClose: () => void;
  onCopy: () => void;
  onForward: () => void;
  onCollect: () => void;
  onRecall?: () => void;
  onMultiSelect: () => void;
  onQuote: () => void;
  onRemind: () => void;
  onSearch: () => void;
  onEdit?: () => void; // 新增：编辑消息
}

export function MessageContextMenu({
  isMe,
  message,
  position,
  onClose,
  onCopy,
  onForward,
  onCollect,
  onRecall,
  onMultiSelect,
  onQuote,
  onRemind,
  onSearch,
  onEdit // 新增
}: MessageContextMenuProps) {
  console.log('MessageContextMenu 渲染', { position, isMe, senderId: message?.senderId, onRecall, onEdit, messageType: message?.type });
  
  // 只有文本消息才能编辑
  const canEdit = isMe && onEdit && (!message?.type || message?.type === 'text');
  console.log('是否可以编辑:', canEdit, { isMe, hasOnEdit: !!onEdit, messageType: message?.type });
  
  const menuItems = [
    { icon: Copy, label: '复制', onClick: onCopy },
    { icon: Forward, label: '转发', onClick: onForward },
    { icon: Star, label: '收藏', onClick: onCollect },
    ...(canEdit ? [{ icon: Edit, label: '编辑', onClick: onEdit }] : []), // 只有自己的文本消息才能编辑
    { icon: RotateCcw, label: '撤回', onClick: onRecall },
    { icon: CheckSquare, label: '多选', onClick: onMultiSelect },
    { icon: MessageSquareQuote, label: '引用', onClick: onQuote },
    { icon: Bell, label: '提醒', onClick: onRemind },
    { icon: Search, label: '搜一搜', onClick: onSearch },
  ];

  console.log('菜单项数量:', menuItems.length, '包含撤回:', menuItems.some(item => item.label === '撤回'));

  return createPortal(
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 z-[99998] bg-black/20"
        onClick={onClose}
      />
      
      {/* 菜单 */}
      <div
        className="fixed z-[99999] bg-[#4c4c4c] rounded-lg shadow-xl py-2 min-w-[160px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: position.showBelow 
            ? 'translate(-50%, 0%) translateY(8px)' 
            : 'translate(-50%, -100%) translateY(-8px)'
        }}
      >
        <div className="grid grid-cols-4 gap-1 px-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 hover:bg-white/10 rounded-lg transition-colors"
            >
              <item.icon className="w-6 h-6 text-white mb-1" />
              <span className="text-[11px] text-white">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}