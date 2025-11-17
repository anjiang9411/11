import { MapPin } from 'lucide-react';
import { ChatMessage } from './WeChat';

interface LocationMessageProps {
  message: ChatMessage;
  onLongPressStart: (e: any) => void;
  onLongPressEnd: () => void;
}

export const LocationMessage = ({ message, onLongPressStart, onLongPressEnd }: LocationMessageProps) => {
  return (
    <div
      onTouchStart={onLongPressStart}
      onTouchEnd={onLongPressEnd}
      onMouseDown={onLongPressStart}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      className="bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
      style={{
        width: '240px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* 地图缩略图 */}
      <div className="relative h-[120px] bg-gradient-to-br from-blue-100 via-green-100 to-blue-50 flex items-center justify-center">
        {/* 地图网格背景 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* 地图标记 */}
        <div className="relative z-10">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <MapPin className="w-7 h-7 text-white" fill="white" />
          </div>
          {/* 标记底部阴影 */}
          <div className="w-8 h-2 bg-black/20 rounded-full mx-auto mt-1 blur-sm" />
        </div>
      </div>
      
      {/* 位置信息 */}
      <div className="p-3 bg-white">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-900 font-medium line-clamp-2">
              {message.locationAddress || '位置'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              位置信息
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
