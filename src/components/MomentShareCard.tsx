import React from 'react';
import { Image, MapPin } from 'lucide-react';

interface MomentShareCardProps {
  authorName: string;
  content: string;
  images?: string[];
  location?: string;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function MomentShareCard({ 
  authorName, 
  content, 
  images,
  location,
  onClick,
  onPointerDown
}: MomentShareCardProps) {
  return (
    <div 
      onClick={onClick}
      onPointerDown={onPointerDown}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:bg-gray-50 transition-all hover:shadow-md w-full"
    >
      {/* 顶部标题 */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100 flex items-center gap-2">
        <div className="w-1.5 h-5 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-sm" />
        <span className="text-sm text-gray-700 font-medium">朋友圈</span>
      </div>

      {/* 内容区 - 移除固定高度，让内容自然排列 */}
      <div className="p-4 space-y-3">
        {/* 发布者 */}
        <p className="text-sm text-blue-600 font-medium">{authorName}</p>

        {/* 文字内容 - 增加行数限制确保显示完整但不过长 */}
        {content && (
          <p className="text-[13px] text-gray-800 leading-relaxed line-clamp-4">
            {content}
          </p>
        )}

        {/* 图片预览 - 调整尺寸使其更紧凑 */}
        {images && images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.slice(0, 3).map((img, idx) => (
              <div 
                key={idx} 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm"
              >
                <img 
                  src={img} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {images.length > 3 && (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <div className="text-center">
                  <Image className="w-5 h-5 text-gray-500 mx-auto mb-0.5" />
                  <span className="text-xs text-gray-600 font-medium">+{images.length - 3}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 位置 */}
        {location && (
          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
}