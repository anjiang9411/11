import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronLeft, Plus, Clock, Trash2, Calendar, AlertCircle, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

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

interface ContactScheduleManagerProps {
  contact: Contact;
  selectedDate: Date;
  schedules: ScheduleItem[];
  onBack: () => void;
  onAddSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  onUpdateSchedule: (id: string, schedule: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
}

export function ContactScheduleManager({
  contact,
  selectedDate,
  schedules,
  onBack,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule
}: ContactScheduleManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    activity: ''
  });

  // 获取当前日期的日程
  const dateStr = selectedDate.toISOString().split('T')[0];
  const contactSchedules = schedules
    .filter(s => s.contactId === contact.id && s.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleAddClick = () => {
    setFormData({
      startTime: '09:00',
      endTime: '10:00',
      activity: ''
    });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setFormData({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      activity: schedule.activity
    });
    setIsEditDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!formData.activity.trim()) {
      toast.error('请输入活动内容');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }

    onAddSchedule({
      contactId: contact.id,
      startTime: formData.startTime,
      endTime: formData.endTime,
      activity: formData.activity.trim(),
      date: dateStr
    });

    setIsAddDialogOpen(false);
    toast.success('日程添加成功');
  };

  const handleConfirmEdit = () => {
    if (!editingSchedule) return;

    if (!formData.activity.trim()) {
      toast.error('请输入活动内容');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }

    onUpdateSchedule(editingSchedule.id, {
      startTime: formData.startTime,
      endTime: formData.endTime,
      activity: formData.activity.trim()
    });

    setIsEditDialogOpen(false);
    setEditingSchedule(null);
    toast.success('日程更新成功');
  };

  const handleDelete = (scheduleId: string) => {
    onDeleteSchedule(scheduleId);
    toast.success('日程已删除');
  };

  return (
    <>
      <div className="space-y-3">
        {/* 返回按钮和角色信息 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">返回角色列表</span>
          </button>

          <div className="flex items-center gap-3">
            <Avatar className="w-16 h-16 border-4 border-gradient-to-br from-purple-400 to-pink-400 shadow-lg">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xl">
                {contact.nickname?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg text-gray-800">
                {contact.remark || contact.nickname || contact.realName}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedDate.toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* AI提示 */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
          <p className="text-xs text-purple-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              该AI角色会在相应的时间段内收到日程提醒，并将当前日期识别为"今天"。
            </span>
          </p>
        </div>

        {/* 日程列表 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span>日程安排</span>
              <span className="text-xs text-gray-500">({contactSchedules.length})</span>
            </h3>
            <Button
              onClick={handleAddClick}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加日程
            </Button>
          </div>

          <div className="space-y-3">
            {contactSchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm">暂无日程安排</p>
                <p className="text-xs mt-1">点击"添加日程"为该角色创建日程</p>
              </div>
            ) : (
              contactSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="relative p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-sm text-purple-600">{schedule.startTime}</div>
                      <div className="text-xs text-gray-400">至</div>
                      <div className="text-sm text-purple-600">{schedule.endTime}</div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 break-words">{schedule.activity}</p>
                    </div>

                    <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(schedule)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 底部间距 */}
        <div className="h-4" />
      </div>

      {/* 添加日程对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[90vw] bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              添加日程
            </DialogTitle>
            <DialogDescription>
              为 {contact.remark || contact.nickname} 在 {selectedDate.toLocaleDateString('zh-CN')} 添加日程
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>活动内容</Label>
              <Textarea
                placeholder="例如：一起去咖啡厅聊天、讨论项目进度..."
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleConfirmAdd}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                确认添加
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑日程对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[90vw] bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Edit2 className="w-4 h-4 text-white" />
              </div>
              编辑日程
            </DialogTitle>
            <DialogDescription>
              修改 {contact.remark || contact.nickname} 的日程安排
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>活动内容</Label>
              <Textarea
                placeholder="例如：一起去咖啡厅聊天、讨论项目进度..."
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleConfirmEdit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                保存修改
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingSchedule(null);
                }}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
