import { useState, useRef } from 'react';
import { ArrowLeft, Camera, ChevronRight, Upload, Link as LinkIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

interface UserProfile {
  avatar: string;
  username: string;
  signature: string;
  gender?: 'male' | 'female' | 'unspecified';
  region?: string;
  wechatId?: string;
  patMessage?: string;
  ringtone?: string;
  address?: string;
}

interface UserProfileSettingsProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onClose: () => void;
}

export function UserProfileSettings({ profile, onProfileChange, onClose }: UserProfileSettingsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [ringtoneDialogOpen, setRingtoneDialogOpen] = useState(false);
  const [ringtoneUrl, setRingtoneUrl] = useState('');
  const [isPlayingRingtone, setIsPlayingRingtone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ringtoneInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const handleSave = (field: keyof UserProfile) => {
    onProfileChange({
      ...profile,
      [field]: tempValue
    });
    setEditingField(null);
    toast.success('保存成功');
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onProfileChange({
          ...profile,
          avatar: result
        });
        setAvatarDialogOpen(false);
        toast.success('头像已更新');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUrl = () => {
    if (avatarUrl.trim()) {
      onProfileChange({
        ...profile,
        avatar: avatarUrl.trim()
      });
      setAvatarDialogOpen(false);
      setAvatarUrl('');
      toast.success('头像已更新');
    }
  };

  const handleRingtoneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onProfileChange({
          ...profile,
          ringtone: result
        });
        setRingtoneDialogOpen(false);
        toast.success('来电铃声已更新');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRingtoneUrl = () => {
    if (ringtoneUrl.trim()) {
      onProfileChange({
        ...profile,
        ringtone: ringtoneUrl.trim()
      });
      setRingtoneDialogOpen(false);
      setRingtoneUrl('');
      toast.success('来电铃声已更新');
    }
  };

  const playRingtone = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlayingRingtone(true);
    }
  };

  const pauseRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingRingtone(false);
    }
  };

  const renderField = (
    label: string,
    field: keyof UserProfile,
    value: string,
    placeholder: string = '',
    type: 'text' | 'select' = 'text',
    selectOptions?: { value: string; label: string }[]
  ) => {
    const isEditing = editingField === field;

    return (
      <div className="bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{label}</span>
          {isEditing ? (
            <div className="flex-1 ml-4 flex items-center gap-2">
              {type === 'select' && selectOptions ? (
                <Select value={tempValue} onValueChange={setTempValue}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1"
                  autoFocus
                />
              )}
              <Button size="sm" onClick={() => handleSave(field)}>保存</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>取消</Button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer flex-1 justify-end"
              onClick={() => handleEdit(field, value)}
            >
              <span className="text-gray-900 text-right truncate max-w-[200px]">
                {value || <span className="text-gray-400">{placeholder}</span>}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#EDEDED] z-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-[#393A3E] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg">个人信息</h1>
        </div>
      </div>

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="pb-4">
          {/* 头像 */}
          <div className="bg-white px-4 py-3 mb-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">头像</span>
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Avatar className="w-14 h-14">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{profile.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 名字 */}
          {renderField('名字', 'username', profile.username, '请输入名字')}

          {/* 微信号 */}
          <div className="mb-2" />
          {renderField('微信号', 'wechatId', profile.wechatId || '', '请输入微信号')}

          {/* 我的二维码 */}
          <div className="mb-2" />
          <div className="bg-white px-4 py-3">
            <div className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-600">我的二维码</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* 更多 */}
          <div className="mb-2" />
          <div className="bg-white">
            {renderField('拍一拍', 'patMessage', profile.patMessage || '', '设置拍一拍后缀')}
            <Separator />
            {renderField('性别', 'gender', profile.gender || 'unspecified', '选择性别', 'select', [
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'unspecified', label: '未设置' }
            ])}
            <Separator />
            {renderField('地区', 'region', profile.region || '', '请输入地区')}
            <Separator />
            {renderField('个性签名', 'signature', profile.signature, '请输入个性签名')}
          </div>

          {/* 来电铃声 */}
          <div className="mb-2" />
          <div className="bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">来电铃声</span>
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setRingtoneDialogOpen(true)}
              >
                <span className="text-gray-900 text-right truncate max-w-[200px]">
                  {profile.ringtone ? '已设置' : <span className="text-gray-400">未设置</span>}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 播放来电铃声 */}
          {profile.ringtone && (
            <>
              <div className="mb-2" />
              <div className="bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">试听铃声</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isPlayingRingtone ? pauseRingtone : playRingtone}
                  >
                    {isPlayingRingtone ? '暂停' : '播放'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* 我的地址 */}
          <div className="mb-2" />
          {renderField('我的地址', 'address', profile.address || '', '请输入地址')}

          {/* 更多信息 */}
          <div className="mb-2" />
          <div className="bg-white">
            <div className="px-4 py-3 flex items-center justify-between cursor-pointer">
              <span className="text-gray-600">更多信息</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* 头像选择对话框 */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>更换头像</DialogTitle>
            <DialogDescription>选择或上传一个新头像</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              上传本地图片
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            
            <div className="space-y-2">
              <Label>或输入图片URL</Label>
              <div className="flex gap-2">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <Button onClick={handleAvatarUrl}>
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 来电铃声选择对话框 */}
      <Dialog open={ringtoneDialogOpen} onOpenChange={setRingtoneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>更换来电铃声</DialogTitle>
            <DialogDescription>选择或上传一个新来电铃声</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => ringtoneInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              上传本地文件
            </Button>
            <input
              ref={ringtoneInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleRingtoneUpload}
            />
            
            <div className="space-y-2">
              <Label>或输入音频URL</Label>
              <div className="flex gap-2">
                <Input
                  value={ringtoneUrl}
                  onChange={(e) => setRingtoneUrl(e.target.value)}
                  placeholder="https://example.com/ringtone.mp3"
                />
                <Button onClick={handleRingtoneUrl}>
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {profile.ringtone && (
              <Button
                onClick={() => {
                  onProfileChange({
                    ...profile,
                    ringtone: ''
                  });
                  setRingtoneDialogOpen(false);
                  setIsPlayingRingtone(false);
                  toast.success('来电铃声已删除');
                }}
                variant="destructive"
                className="w-full"
              >
                删除当前铃声
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 来电铃声播放器 */}
      <audio 
        ref={audioRef} 
        src={profile.ringtone}
        onEnded={() => setIsPlayingRingtone(false)}
      />
    </div>
  );
}