import { Camera, Video, Phone, MapPin, Gift, Folder, User, Star, Music, CreditCard, Image } from 'lucide-react';

interface PlusMenuPanelProps {
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

interface MenuItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
}

const MENU_ITEMS: MenuItem[] = [
  { 
    id: 'photo', 
    name: '相册', 
    icon: <Image className="w-7 h-7" />, 
    bgColor: 'bg-[#9A8FD9]' 
  },
  { 
    id: 'camera', 
    name: '拍摄', 
    icon: <Camera className="w-7 h-7" />, 
    bgColor: 'bg-[#6FA3DA]' 
  },
  { 
    id: 'video-call', 
    name: '视频通话', 
    icon: <Video className="w-7 h-7" />, 
    bgColor: 'bg-[#77D0A6]' 
  },
  { 
    id: 'location', 
    name: '位置', 
    icon: <MapPin className="w-7 h-7" />, 
    bgColor: 'bg-[#82C869]' 
  },
  { 
    id: 'red-packet', 
    name: '红包', 
    icon: <Gift className="w-7 h-7" />, 
    bgColor: 'bg-[#EA6A5C]' 
  },
  { 
    id: 'transfer', 
    name: '转账', 
    icon: <CreditCard className="w-7 h-7" />, 
    bgColor: 'bg-[#F5A556]' 
  },
  { 
    id: 'voice-call', 
    name: '语音通话', 
    icon: <Phone className="w-7 h-7" />, 
    bgColor: 'bg-[#6EB5E0]' 
  },
  { 
    id: 'gift', 
    name: '礼物', 
    icon: <Gift className="w-7 h-7" />, 
    bgColor: 'bg-[#E89ABB]' 
  },
  { 
    id: 'card', 
    name: '名片', 
    icon: <User className="w-7 h-7" />, 
    bgColor: 'bg-[#7E8DB8]' 
  },
  { 
    id: 'favorite', 
    name: '收藏', 
    icon: <Star className="w-7 h-7" />, 
    bgColor: 'bg-[#E5BE6F]' 
  },
  { 
    id: 'music', 
    name: '音乐', 
    icon: <Music className="w-7 h-7" />, 
    bgColor: 'bg-[#76C495]' 
  },
  { 
    id: 'file', 
    name: '文件', 
    icon: <Folder className="w-7 h-7" />, 
    bgColor: 'bg-[#8C9AAD]' 
  },
];

export function PlusMenuPanel({ onClose, onSelectAction }: PlusMenuPanelProps) {
  const handleSelectItem = (itemId: string) => {
    console.log('[PlusMenuPanel]点击项目:', itemId);
    onSelectAction(itemId);
  };

  console.log('[PlusMenuPanel]组件已渲染');
  
  return (
    <div 
      className="bg-white border-t border-gray-200" 
      style={{ 
        height: '240px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
      onClick={(e) => {
        console.log('[PlusMenuPanel]容器被点击');
      }}
    >
      <div className="h-full overflow-y-auto px-3 py-4">
        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={(e) => {
                console.log('[PlusMenuPanel]按钮onClick触发！', { 
                  itemId: item.id, 
                  itemName: item.name
                });
                e.stopPropagation();
                handleSelectItem(item.id);
              }}
              onMouseDown={(e) => {
                console.log('[PlusMenuPanel]按钮onMouseDown触发！', item.id, item.name);
              }}
              onTouchStart={(e) => {
                console.log('[PlusMenuPanel]按钮onTouchStart触发！', item.id, item.name);
              }}
              className="flex flex-col items-center gap-2 active:opacity-60 transition-opacity"
            >
              <div 
                className={`w-[54px] h-[54px] ${item.bgColor} rounded-xl flex items-center justify-center text-white`}
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                {item.icon}
              </div>
              <span className="text-[11px] text-gray-600 leading-tight text-center">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}