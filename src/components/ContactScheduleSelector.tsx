import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ChevronRight, Calendar, Clock } from 'lucide-react';

interface Contact {
  id: string;
  avatar: string;
  avatarType: 'url' | 'upload';
  realName: string;
  nickname: string;
  remark: string;
  personality?: string;
  experience?: string;
  hobbies?: string;
  age?: string;
  occupation?: string;
  otherInfo?: string;
}

interface ScheduleItem {
  id: string;
  contactId: string;
  startTime: string;
  endTime: string;
  activity: string;
  date: string;
}

interface ContactScheduleSelectorProps {
  selectedDate: Date;
  contacts: Contact[];
  schedules: ScheduleItem[];
  onSelectContact: (contactId: string) => void;
}

export function ContactScheduleSelector({
  selectedDate,
  contacts,
  schedules,
  onSelectContact
}: ContactScheduleSelectorProps) {
  // 计算每个联系人在当前日期的日程数量
  const getScheduleCountForContact = (contactId: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return schedules.filter(s => s.contactId === contactId && s.date === dateStr).length;
  };

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs text-blue-800 flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {selectedDate.toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b">
          <h3 className="flex items-center gap-2 text-gray-800">
            <Clock className="w-5 h-5 text-purple-500" />
            <span>选择AI角色管理日程</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">点击角色查看和编辑该角色的日程安排</p>
        </div>

        <div className="divide-y">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">暂无AI角色</p>
              <p className="text-xs mt-1">请先在联系人中添加AI角色</p>
            </div>
          ) : (
            contacts.map((contact) => {
              const scheduleCount = getScheduleCountForContact(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all group"
                >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                      {contact.nickname?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-800 truncate">
                        {contact.remark || contact.nickname || contact.realName}
                      </p>
                      {scheduleCount > 0 && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                          {scheduleCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {scheduleCount === 0 ? '暂无日程' : `已安排${scheduleCount}个日程`}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
