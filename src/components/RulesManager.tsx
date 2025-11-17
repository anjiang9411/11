import { useState } from 'react';
import { X, Plus, Trash2, Edit2, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

export interface Rule {
  id: string;
  name: string;
  content: string;
  description?: string;
}

interface RulesManagerProps {
  onClose: () => void;
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

export function RulesManager({ onClose, rules, onRulesChange }: RulesManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      content: '',
      description: ''
    });
    setShowAddDialog(true);
  };

  const handleOpenEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      content: rule.content,
      description: rule.description || ''
    });
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('请输入规则名称');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('请输入规则内容');
      return;
    }

    const ruleData: Rule = {
      id: editingRule?.id || Date.now().toString(),
      name: formData.name.trim(),
      content: formData.content.trim(),
      description: formData.description.trim()
    };

    if (editingRule) {
      onRulesChange(rules.map(r => r.id === editingRule.id ? ruleData : r));
      toast.success('规则已更新');
    } else {
      onRulesChange([...rules, ruleData]);
      toast.success('规则已添加');
    }

    setShowAddDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个规则吗？')) {
      onRulesChange(rules.filter(r => r.id !== id));
      toast.success('规则已删除');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg">规则管理</h1>
        <button
          onClick={handleOpenAdd}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 规则列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {rules.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>还没有规则</p>
                <p className="text-sm mt-2">点击右上角"+"添加规则</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-sm text-gray-500 mb-2">{rule.description}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                          {rule.content}
                        </p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
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
            <DialogTitle>{editingRule ? '编辑规则' : '添加规则'}</DialogTitle>
            <DialogDescription>
              规则定义AI的行为准则、对话规则、禁忌事项等，AI会严格遵守这些规则
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* 名称 */}
              <div>
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：聊天规则、行为准则"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* 描述 */}
              <div>
                <Label htmlFor="description">描述（可选）</Label>
                <Input
                  id="description"
                  placeholder="简短描述这个规则的内容"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* 内容 */}
              <div>
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="输入规则的详细内容，如行为准则、对话规则、禁止的话题等"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI会在聊天时遵守这些规则，确保对话符合预期
                </p>
              </div>
            </div>
          </ScrollArea>

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
    </div>
  );
}
