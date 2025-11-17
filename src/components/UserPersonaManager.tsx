// 用户人设管理器
import { useState } from 'react';
import { X, Plus, Edit, Trash2, Check, User, Briefcase, Heart, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';

export interface UserPersona {
  id: string;
  name: string; // 人设名称
  description: string; // 人设描述
  personality: string; // 性格特点
  interests: string; // 兴趣爱好
  occupation: string; // 职业信息
  background: string; // 背景故事
  isActive: boolean; // 是否为当前激活的人设
  createdAt: number;
}

interface UserPersonaManagerProps {
  onClose: () => void;
  personas: UserPersona[];
  onPersonasChange: (personas: UserPersona[]) => void;
}

export function UserPersonaManager({ onClose, personas, onPersonasChange }: UserPersonaManagerProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<UserPersona | null>(null);

  // 编辑表单状态
  const [formData, setFormData] = useState<Omit<UserPersona, 'id' | 'isActive' | 'createdAt'>>({
    name: '',
    description: '',
    personality: '',
    interests: '',
    occupation: '',
    background: ''
  });

  // 打开新建人设
  const handleCreate = () => {
    setEditingPersona(null);
    setFormData({
      name: '',
      description: '',
      personality: '',
      interests: '',
      occupation: '',
      background: ''
    });
    setShowEditor(true);
  };

  // 打开编辑人设
  const handleEdit = (persona: UserPersona) => {
    setEditingPersona(persona);
    setFormData({
      name: persona.name,
      description: persona.description,
      personality: persona.personality,
      interests: persona.interests,
      occupation: persona.occupation,
      background: persona.background
    });
    setShowEditor(true);
  };

  // 保存人设
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('请输入人设名称');
      return;
    }

    if (editingPersona) {
      // 编辑现有人设
      const updated = personas.map(p =>
        p.id === editingPersona.id
          ? { ...p, ...formData }
          : p
      );
      onPersonasChange(updated);
      toast.success('人设已更新');
    } else {
      // 创建新人设
      const newPersona: UserPersona = {
        id: Date.now().toString(),
        ...formData,
        isActive: personas.length === 0, // 如果是第一个人设，自动激活
        createdAt: Date.now()
      };
      onPersonasChange([...personas, newPersona]);
      toast.success('人设已创建');
    }

    setShowEditor(false);
  };

  // 删除人设
  const handleDelete = (id: string) => {
    const persona = personas.find(p => p.id === id);
    if (persona?.isActive && personas.length > 1) {
      toast.error('请先切换到其他人设再删除当前人设');
      return;
    }

    const filtered = personas.filter(p => p.id !== id);
    onPersonasChange(filtered);
    setDeleteConfirm(null);
    toast.success('人设已删除');
  };

  // 激活人设
  const handleActivate = (id: string) => {
    const updated = personas.map(p => ({
      ...p,
      isActive: p.id === id
    }));
    onPersonasChange(updated);
    toast.success('人设已切换');
  };

  // 获取激活的人设
  const activePersona = personas.find(p => p.isActive);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg">我的人设</h1>
        <button
          onClick={handleCreate}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 当前激活的人设 */}
          {activePersona && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-500">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{activePersona.name}</p>
                    <p className="text-xs text-green-600">当前使用中</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(activePersona)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{activePersona.description || '暂无描述'}</p>
              <Button
                className="w-full mt-3"
                variant="outline"
                onClick={() => setShowDetail(activePersona)}
              >
                查看详情
              </Button>
            </div>
          )}

          {/* 人设列表 */}
          <div className="space-y-2">
            <h3 className="text-sm text-gray-500 px-2">全部人设 ({personas.length})</h3>
            {personas.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>还没有创建人设</p>
                <p className="text-sm mt-2">点击右上角的"+"创建你的第一个人设</p>
              </div>
            ) : (
              personas.map(persona => (
                <div
                  key={persona.id}
                  className={`bg-white rounded-lg p-4 border transition-all ${
                    persona.isActive
                      ? 'border-green-500 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{persona.name}</h3>
                        {persona.isActive && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                            使用中
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {persona.description || '暂无描述'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {!persona.isActive && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleActivate(persona.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        使用此人设
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDetail(persona)}
                    >
                      详情
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(persona)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(persona.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 编辑/创建对话框 */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingPersona ? '编辑人设' : '创建人设'}</DialogTitle>
            <DialogDescription>
              填写下面的信息来创建你的个性化人设，AI 会根据你的人设特点来对话
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  人设名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：职场精英、文艺青年、运动达人..."
                  maxLength={20}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">人设描述</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简单描述一下这个人设的特点..."
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  性格特点
                </label>
                <Textarea
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="例如：开朗活泼、沉稳内敛、幽默风趣..."
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">兴趣爱好</label>
                <Textarea
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="例如：喜欢阅读、摄影、旅游、健身..."
                  rows={2}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  职业信息
                </label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="例如：互联网产品经理、自由设计师..."
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  背景故事
                </label>
                <Textarea
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="可以写一些关于这个人设的背景故事、经历等..."
                  rows={4}
                  maxLength={500}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setShowEditor(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showDetail?.name}
              {showDetail?.isActive && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  使用中
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {showDetail?.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">描述</h4>
                  <p className="text-sm">{showDetail.description}</p>
                </div>
              )}

              {showDetail?.personality && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    性格特点
                  </h4>
                  <p className="text-sm">{showDetail.personality}</p>
                </div>
              )}

              {showDetail?.interests && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">兴趣爱好</h4>
                  <p className="text-sm">{showDetail.interests}</p>
                </div>
              )}

              {showDetail?.occupation && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    职业信息
                  </h4>
                  <p className="text-sm">{showDetail.occupation}</p>
                </div>
              )}

              {showDetail?.background && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    背景故事
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{showDetail.background}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-400">
                  创建时间：{new Date(showDetail?.createdAt || 0).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            {showDetail && !showDetail.isActive && (
              <Button
                className="flex-1"
                onClick={() => {
                  handleActivate(showDetail.id);
                  setShowDetail(null);
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                使用此人设
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (showDetail) {
                  setShowDetail(null);
                  handleEdit(showDetail);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              编辑
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个人设吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
