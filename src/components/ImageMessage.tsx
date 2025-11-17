import { ChatMessage } from './WeChat';

interface ImageMessageProps {
  message: ChatMessage;
  onLongPressStart: (e: any) => void;
  onLongPressEnd: () => void;
}

export const ImageMessage = ({ message, onLongPressStart, onLongPressEnd }: ImageMessageProps) => {
  return (
    <div className="flex flex-col gap-1">
      <img
        src={message.imageUrl}
        alt="发送的图片"
        onTouchStart={onLongPressStart}
        onTouchEnd={onLongPressEnd}
        onMouseDown={onLongPressStart}
        onMouseUp={onLongPressEnd}
        onMouseLeave={onLongPressEnd}
        className="rounded-lg max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => {
          window.open(message.imageUrl, '_blank');
        }}
      />
    </div>
  );
};
