import { User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface ContactCardMessageProps {
  cardContactName: string;
  cardContactAvatar: string;
  onClick?: () => void;
}

export function ContactCardMessage({ cardContactName, cardContactAvatar, onClick }: ContactCardMessageProps) {
  return (
    <div 
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 max-w-[240px] cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={cardContactAvatar} />
          <AvatarFallback>
            <User className="w-6 h-6 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-gray-900 truncate">
            {cardContactName}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            个人名片
          </div>
        </div>
      </div>
    </div>
  );
}
