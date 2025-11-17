import { useState } from 'react';
import { Camera } from 'lucide-react';
import { ChatMessage } from './WeChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface CameraMessageProps {
  message: ChatMessage;
  onLongPressStart: (e: any) => void;
  onLongPressEnd: () => void;
}

export const CameraMessage = ({ message, onLongPressStart, onLongPressEnd }: CameraMessageProps) => {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-1">
        <div
          onTouchStart={onLongPressStart}
          onTouchEnd={onLongPressEnd}
          onMouseDown={onLongPressStart}
          onMouseUp={onLongPressEnd}
          onMouseLeave={onLongPressEnd}
          onClick={() => setShowDescription(true)}
          className="relative rounded-lg w-[200px] h-[200px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)] opacity-50" />
          
          {/* 相机图标 */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-xs text-gray-500 font-medium">点击查看拍摄内容</div>
          </div>
          
          {/* 角标提示 */}
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full">
            拍摄
          </div>
        </div>
      </div>

      {/* 查看拍摄内容对话框 */}
      <Dialog open={showDescription} onOpenChange={setShowDescription}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              拍摄内容
            </DialogTitle>
            <DialogDescription>
              查看拍摄的内容描述
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] max-h-[300px] overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {message.cameraDescription || '[无描述]'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};