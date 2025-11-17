import { useState, useRef } from 'react';
import { X, Plus, Upload, Link as LinkIcon, Trash2, Edit2, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { StatusBar } from './StatusBar';

export interface Contact {
  id: string;
  avatar: string;
  avatarType: 'url' | 'upload'; // 头像类型
  realName: string; // 本名（现实中的名称）
  nickname: string; // 网络昵称（OC自己取的）
  remark: string; // 备注（用户给OC的）
  userRemark?: string; // AI角色给用户的备注名
  lastRemarkChangeTime?: number; // 上次更改用户备注名的时间戳
  personality?: string; // 性格
  experience?: string; // 经历/背景
  hobbies?: string; // 喜好/兴趣
  age?: string; // 年龄
  occupation?: string; // 职业
  otherInfo?: string; // 其他信息
  isOnline?: boolean; // 是否在线
  statusText?: string; // 状态文字（如"开心😊"、"emo中"等）
  wechatId?: string; // 微信号
  region?: string; // 地区
  signature?: string; // 个性签名
  location?: string; // 所在地区（AI可修改）
  isStarred?: boolean; // 是否星标好友
  isBlacklisted?: boolean; // 是否在黑名单
  blockedByUser?: boolean; // 用户是否拉黑了该角色（用户看不到角色回复，但角色能看到用户消息）
  blockedByContact?: boolean; // 角色是否拉黑了用户（用户发消息显示红色感叹号，角色看不到用户消息，但用户能看到角色消息）
  patMessage?: string; // AI的拍一拍后缀（AI可自己修改）
  contextMemoryCount?: number; // 上下文记忆条数（默认10）
  worldBooks?: string[]; // 关联的世界书ID数组
  rules?: string[]; // 关联的规则ID数组
  knownFriends?: string[]; // 认识的好友ID列表
  avatarLibrary?: AvatarItem[]; // 头像库
  isAi?: boolean; // AI角色标识
  memos?: MemoEntry[]; // 备忘录列表（AI角色记录关于用户的观察和想法）
}

// 备忘录项
export interface MemoEntry {
  id: string;
  content: string; // 备忘录内容（从角色的角度记录关于用户的观察）
  timestamp: number; // 记录时间
  contactId: string; // 记录者的ID（哪个角色写的）
}

// 头像库项
export interface AvatarItem {
  id: string;
  url: string;
  emotion: string; // 情绪/场景标签（如"开心"、"生气"、"默认"）
  description: string; // 详细描述（帮助AI理解何时使用）
}

interface ContactsProps {
  onClose: () => void;
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
}

export function Contacts({ onClose, contacts, onContactsChange, realTime, batteryLevel, isCharging }: ContactsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [avatarTab, setAvatarTab] = useState<'url' | 'upload'>('url');
  const [detailTab, setDetailTab] = useState<'basic' | 'details'>('basic');
  const [formData, setFormData] = useState({
    avatar: '',
    realName: '',
    nickname: '',
    remark: '',
    personality: '',
    experience: '',
    hobbies: '',
    age: '',
    occupation: '',
    otherInfo: '',
    wechatId: '',
    region: '',
    signature: '',
    patMessage: '',
    contextMemoryCount: 10,
    worldBooks: [] as string[],
    rules: [] as string[],
    knownFriends: [] as string[],
    avatarLibrary: [] as AvatarItem[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      avatar: '',
      realName: '',
      nickname: '',
      remark: '',
      personality: '',
      experience: '',
      hobbies: '',
      age: '',
      occupation: '',
      otherInfo: '',
      wechatId: '',
      region: '',
      signature: '',
      patMessage: '',
      contextMemoryCount: 10,
      worldBooks: [] as string[],
      rules: [] as string[],
      knownFriends: [] as string[],
      avatarLibrary: [] as AvatarItem[]
    });
    setAvatarTab('url');
    setDetailTab('basic');
    setShowAddDialog(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      avatar: contact.avatar,
      realName: contact.realName,
      nickname: contact.nickname,
      remark: contact.remark,
      personality: contact.personality || '',
      experience: contact.experience || '',
      hobbies: contact.hobbies || '',
      age: contact.age || '',
      occupation: contact.occupation || '',
      otherInfo: contact.otherInfo || '',
      wechatId: contact.wechatId || '',
      region: contact.region || '',
      signature: contact.signature || '',
      patMessage: contact.patMessage || '',
      contextMemoryCount: contact.contextMemoryCount || 10,
      worldBooks: contact.worldBooks || [] as string[],
      rules: contact.rules || [] as string[],
      knownFriends: contact.knownFriends || [] as string[],
      avatarLibrary: contact.avatarLibrary || [] as AvatarItem[]
    });
    setAvatarTab(contact.avatarType);
    setDetailTab('basic');
    setShowAddDialog(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 检查文件大小 (限制为 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    // 转换为 base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData({ ...formData, avatar: result });
      toast.success('图片已上传');
    };
    reader.onerror = () => {
      toast.error('图片上传失败');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // 验证必填字段
    if (!formData.realName.trim()) {
      toast.error('请输入本名');
      return;
    }
    if (!formData.nickname.trim()) {
      toast.error('请输入网络昵称');
      return;
    }
    if (!formData.avatar.trim()) {
      toast.error('请设置头像');
      return;
    }

    const contactData: Contact = {
      id: editingContact?.id || Date.now().toString(),
      avatar: formData.avatar,
      avatarType: avatarTab,
      realName: formData.realName.trim(),
      nickname: formData.nickname.trim(),
      remark: formData.remark.trim(),
      personality: formData.personality.trim(),
      experience: formData.experience.trim(),
      hobbies: formData.hobbies.trim(),
      age: formData.age.trim(),
      occupation: formData.occupation.trim(),
      otherInfo: formData.otherInfo.trim(),
      wechatId: formData.wechatId.trim(),
      region: formData.region.trim(),
      signature: formData.signature.trim(),
      patMessage: formData.patMessage.trim(),
      contextMemoryCount: formData.contextMemoryCount,
      worldBooks: formData.worldBooks,
      rules: formData.rules,
      knownFriends: formData.knownFriends,
      avatarLibrary: formData.avatarLibrary,
      isAi: true // 所有通过联系人管理器创建的都是AI角色
    };

    if (editingContact) {
      // 编辑现有联系人
      onContactsChange(contacts.map(c => c.id === editingContact.id ? contactData : c));
      toast.success('联系人已更新');
    } else {
      // 添加新联系人
      onContactsChange([...contacts, contactData]);
      toast.success('联系人已添加');
    }

    setShowAddDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个联系人吗？')) {
      onContactsChange(contacts.filter(c => c.id !== id));
      toast.success('联系人已删除');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 状态栏 */}
      <StatusBar 
        realTime={realTime}
        batteryLevel={batteryLevel}
        isCharging={isCharging}
        theme="light"
      />
      
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg">通讯录</h1>
        <button
          onClick={handleOpenAdd}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 联系人列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {contacts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Phone className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>还没有联系人</p>
                <p className="text-sm mt-2">点击右上角"+"添加OC</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowDetailDialog(true);
                    }}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate">{contact.nickname}</p>
                        {contact.remark && (
                          <span className="text-sm text-gray-400">({contact.remark})</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{contact.realName}</p>
                      {contact.occupation && (
                        <p className="text-xs text-gray-400 truncate">{contact.occupation}</p>
                      )}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEdit(contact)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingContact ? '编辑联系人' : '添加联系人'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingContact ? '编辑现有联系人的信息' : '添加新联系人到通讯录'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as 'basic' | 'details')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="details">详细资料</TabsTrigger>
            </TabsList>

            {/* 基本信息标签页 */}
            <TabsContent value="basic" className="flex-1 mt-4">
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-4">
                  {/* 头像设置 */}
                  <div>
                    <Label>头像</Label>
                    <div className="mt-2">
                      {/* 头像预览 */}
                      <div className="flex justify-center mb-4">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={formData.avatar} />
                          <AvatarFallback className="text-2xl">
                            {formData.nickname ? formData.nickname[0] : '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* 头像选择方式 */}
                      <div className="flex gap-2 mb-3">
                        <Button
                          type="button"
                          variant={avatarTab === 'url' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAvatarTab('url')}
                          className="flex-1"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          URL链接
                        </Button>
                        <Button
                          type="button"
                          variant={avatarTab === 'upload' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAvatarTab('upload')}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          本地上传
                        </Button>
                      </div>

                      {/* URL输入 */}
                      {avatarTab === 'url' && (
                        <Input
                          placeholder="输入图片URL"
                          value={formData.avatar}
                          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        />
                      )}

                      {/* 文件上传 */}
                      {avatarTab === 'upload' && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            选择图片
                          </Button>
                          {formData.avatar && (
                            <p className="text-sm text-gray-500 mt-2 text-center">
                              图片已上传
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 本名 */}
                  <div>
                    <Label htmlFor="realName">本名</Label>
                    <Input
                      id="realName"
                      placeholder="现实中的名称"
                      value={formData.realName}
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                    />
                  </div>

                  {/* 网络昵称 */}
                  <div>
                    <Label htmlFor="nickname">网络昵称</Label>
                    <Input
                      id="nickname"
                      placeholder="OC的网络昵称"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">艾特时显示的名称</p>
                  </div>

                  {/* 备注 */}
                  <div>
                    <Label htmlFor="remark">备注</Label>
                    <Input
                      id="remark"
                      placeholder="你对这个OC的备注"
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 详细资料标签页 */}
            <TabsContent value="details" className="flex-1 mt-4">
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-4">
                  {/* 年龄 */}
                  <div>
                    <Label htmlFor="age">年龄</Label>
                    <Input
                      id="age"
                      placeholder="例如：18 或 20岁"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>

                  {/* 职业 */}
                  <div>
                    <Label htmlFor="occupation">职业</Label>
                    <Input
                      id="occupation"
                      placeholder="例如：学生、设计师、冒险家"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    />
                  </div>

                  {/* 性格 */}
                  <div>
                    <Label htmlFor="personality">性格</Label>
                    <Textarea
                      id="personality"
                      placeholder="描述OC的性格特点，如：开朗活泼、内向温柔、冷静理智等"
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* 经历 */}
                  <div>
                    <Label htmlFor="experience">经历/背景</Label>
                    <Textarea
                      id="experience"
                      placeholder="描述OC的过往经历、成长背景、重要事件等"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      rows={5}
                    />
                  </div>

                  {/* 喜好 */}
                  <div>
                    <Label htmlFor="hobbies">喜好/兴趣</Label>
                    <Textarea
                      id="hobbies"
                      placeholder="列举OC的兴趣爱好、喜欢的事物等，如：音乐、绘画、旅行、美食等"
                      value={formData.hobbies}
                      onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* 其他信息 */}
                  <div>
                    <Label htmlFor="otherInfo">其他信息</Label>
                    <Textarea
                      id="otherInfo"
                      placeholder="其他想要记录的信息，如特殊能力、口头禅、标志性物品等"
                      value={formData.otherInfo}
                      onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* 认识的好友 */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" />
                      认识的好友（可多选）
                    </Label>
                    <div className="text-xs text-gray-500 mb-3">
                      选择这个角色在社交网络中认识的其他好友，AI在聊天时可能会提到他们
                    </div>
                    <ScrollArea className="h-[200px] border rounded-lg p-3">
                      <div className="space-y-2">
                        {contacts
                          .filter(c => c.id !== (editingContact?.id || formData.id))
                          .map(contact => (
                            <div key={contact.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
                              <Checkbox
                                id={`friend-${contact.id}`}
                                checked={(formData.knownFriends || []).includes(contact.id)}
                                onCheckedChange={(checked) => {
                                  const currentKnown = formData.knownFriends || [];
                                  if (checked) {
                                    setFormData({ 
                                      ...formData, 
                                      knownFriends: [...currentKnown, contact.id] 
                                    });
                                  } else {
                                    setFormData({ 
                                      ...formData, 
                                      knownFriends: currentKnown.filter(id => id !== contact.id) 
                                    });
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`friend-${contact.id}`}
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                              >
                                <Avatar className="w-8 h-8 rounded-md">
                                  <AvatarImage src={contact.avatar} />
                                  <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{contact.remark || contact.nickname}</span>
                              </label>
                            </div>
                          ))}
                        {contacts.filter(c => c.id !== (editingContact?.id || formData.id)).length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无其他联系人
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* 微信号 */}
                  <div>
                    <Label htmlFor="wechatId">微信号</Label>
                    <Input
                      id="wechatId"
                      placeholder="例如：wxid_abc123"
                      value={formData.wechatId}
                      onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                    />
                  </div>

                  {/* 地区 */}
                  <div>
                    <Label htmlFor="region">地区</Label>
                    <Input
                      id="region"
                      placeholder="例如：北京 朝阳"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>

                  {/* 个性签名 */}
                  <div>
                    <Label htmlFor="signature">个性签名</Label>
                    <Textarea
                      id="signature"
                      placeholder="角色的个性签名"
                      value={formData.signature}
                      onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* 拍一拍后缀 */}
                  <div>
                    <Label htmlFor="patMessage">拍一拍后缀</Label>
                    <Textarea
                      id="patMessage"
                      placeholder="AI的拍一拍后缀"
                      value={formData.patMessage}
                      onChange={(e) => setFormData({ ...formData, patMessage: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* 操作按钮 - 放在Tabs外面 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1"
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 详情查看对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>联系人详情</DialogTitle>
            <DialogDescription className="sr-only">
              查看联系人的详细信息
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* 头像和基本信息 */}
                <div className="flex flex-col items-center">
                  <Avatar className="w-24 h-24 mb-3">
                    <AvatarImage src={selectedContact.avatar} />
                    <AvatarFallback className="text-2xl">{selectedContact.nickname[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl">{selectedContact.nickname}</h3>
                  <p className="text-sm text-gray-500">{selectedContact.realName}</p>
                  {selectedContact.remark && (
                    <p className="text-sm text-purple-600 mt-1">备注：{selectedContact.remark}</p>
                  )}
                </div>

                {/* 详细信息 */}
                <div className="space-y-4">
                  {selectedContact.age && (
                    <div>
                      <Label className="text-gray-600">年龄</Label>
                      <p className="mt-1">{selectedContact.age}</p>
                    </div>
                  )}

                  {selectedContact.occupation && (
                    <div>
                      <Label className="text-gray-600">职业</Label>
                      <p className="mt-1">{selectedContact.occupation}</p>
                    </div>
                  )}

                  {selectedContact.personality && (
                    <div>
                      <Label className="text-gray-600">性格</Label>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedContact.personality}</p>
                    </div>
                  )}

                  {selectedContact.experience && (
                    <div>
                      <Label className="text-gray-600">经历/背景</Label>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedContact.experience}</p>
                    </div>
                  )}

                  {selectedContact.hobbies && (
                    <div>
                      <Label className="text-gray-600">喜好/兴趣</Label>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedContact.hobbies}</p>
                    </div>
                  )}

                  {selectedContact.otherInfo && (
                    <div>
                      <Label className="text-gray-600">其他信息</Label>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedContact.otherInfo}</p>
                    </div>
                  )}

                  {selectedContact.knownFriends && selectedContact.knownFriends.length > 0 && (
                    <div>
                      <Label className="text-gray-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        认识的好友
                      </Label>
                      <div className="mt-2 space-y-2">
                        {selectedContact.knownFriends.map(friendId => {
                          const friend = contacts.find(c => c.id === friendId);
                          if (!friend) return null;
                          return (
                            <div key={friendId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                              <Avatar className="w-8 h-8 rounded-md">
                                <AvatarImage src={friend.avatar} />
                                <AvatarFallback className="rounded-md">{friend.nickname[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{friend.remark || friend.nickname}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedContact.patMessage && (
                    <div>
                      <Label className="text-gray-600">拍一拍后缀</Label>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedContact.patMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              className="flex-1"
            >
              关闭
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedContact) {
                  setShowDetailDialog(false);
                  handleOpenEdit(selectedContact);
                }
              }}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 修正Phone导入
function Phone({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}