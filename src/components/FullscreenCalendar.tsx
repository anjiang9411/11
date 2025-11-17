import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { ContactScheduleSelector } from './ContactScheduleSelector';
import { ContactScheduleManager } from './ContactScheduleManager';

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

interface FullscreenCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
  schedules: ScheduleItem[];
  onAddSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  onUpdateSchedule: (id: string, schedule: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
  contacts: Contact[];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export function FullscreenCalendar({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  contacts
}: FullscreenCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [view, setView] = useState<'calendar' | 'contactList' | 'contactSchedule'>('calendar');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [isOpen, selectedDate]);

  // 只在打开/关闭时重置视图
  useEffect(() => {
    if (isOpen) {
      setView('calendar');
      setSelectedContactId(null);
    }
  }, [isOpen]);

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = firstDayOfWeek;
    
    const totalDays = Math.ceil((firstDayOfWeek + lastDay.getDate()) / 7) * 7;
    const nextMonthDays = totalDays - firstDayOfWeek - lastDay.getDate();
    
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasSchedule: boolean;
    }> = [];
    
    // 上个月的日期
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, selectedDate),
        hasSchedule: getSchedulesForDate(date).length > 0
      });
    }
    
    // 当月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, selectedDate),
        hasSchedule: getSchedulesForDate(date).length > 0
      });
    }
    
    // 下个月的日期
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, selectedDate),
        hasSchedule: getSchedulesForDate(date).length > 0
      });
    }
    
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => s.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    onDateChange(date);
    setView('contactList');
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setView('contactSchedule');
  };

  const handleBackToContactList = () => {
    setSelectedContactId(null);
    setView('contactList');
  };

  const handleBackToCalendar = () => {
    setView('calendar');
    setSelectedContactId(null);
  };

  const calendarDays = generateCalendarDays();
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  console.log('🟢🟢🟢 FullscreenCalendar render, current view:', view);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50">
      <div className="flex flex-col h-full">
        {/* 头部 */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {view !== 'calendar' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={view === 'contactSchedule' ? handleBackToContactList : handleBackToCalendar}
                    className="h-9 w-9 p-0 text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-lg text-gray-900">
                      {view === 'calendar' ? '日历' : view === 'contactList' ? '选择角色' : '日程管理'}
                    </h1>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 月份导航 - 仅在日历视图显示 */}
            {view === 'calendar' && (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center">
                  <h2 className="text-base text-gray-900">
                    {currentMonth.getFullYear()}年 {MONTHS[currentMonth.getMonth()]}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 内容区域 - 根据视图显示不同内容 */}
        <div className="flex-1 overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-4">
            {view === 'calendar' && (
              <div className="space-y-3">
                {/* 日历网格 */}
                <div 
                  ref={calendarRef}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                >
                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                    {WEEKDAYS.map((day) => (
                      <div 
                        key={day}
                        className="text-center py-2 text-xs text-gray-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 日期网格 */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, index) => {
                      const isWeekend = index % 7 === 0 || index % 7 === 6;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDateClick(day.date);
                          }}
                          className={`
                            relative aspect-square p-1.5 text-sm border-r border-b border-gray-100
                            transition-colors duration-150
                            ${!day.isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-700'}
                            ${day.isToday && !day.isSelected ? 'bg-blue-50 text-blue-600' : ''}
                            ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                            ${!day.isSelected && !day.isToday && day.isCurrentMonth ? 'hover:bg-gray-50' : ''}
                            ${isWeekend && day.isCurrentMonth && !day.isSelected && !day.isToday ? 'text-gray-500' : ''}
                            ${index % 7 === 6 ? 'border-r-0' : ''}
                            ${index >= calendarDays.length - 7 ? 'border-b-0' : ''}
                          `}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className={`${day.isSelected || day.isToday ? 'font-medium' : ''}`}>
                              {day.date.getDate()}
                            </span>
                            {day.hasSchedule && (
                              <div className="mt-0.5">
                                <div className={`w-1 h-1 rounded-full ${day.isSelected ? 'bg-white' : day.isToday ? 'bg-blue-500' : 'bg-blue-400'}`} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* 提示文字 */}
                <div className="text-center text-xs text-gray-400 pt-1">
                  点击日期查看和管理日程
                </div>
              </div>
            )}

            {view === 'contactList' && (
              <ContactScheduleSelector
                selectedDate={selectedDate}
                contacts={contacts}
                schedules={schedules}
                onSelectContact={handleSelectContact}
              />
            )}

            {view === 'contactSchedule' && selectedContact && (
              <ContactScheduleManager
                contact={selectedContact}
                selectedDate={selectedDate}
                schedules={schedules}
                onBack={handleBackToContactList}
                onAddSchedule={onAddSchedule}
                onUpdateSchedule={onUpdateSchedule}
                onDeleteSchedule={onDeleteSchedule}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}