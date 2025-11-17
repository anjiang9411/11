import { useState } from 'react';
import { X, Plus, Trash2, Edit2, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

export interface WorldBook {
  id: string;
  name: string;
  content: string;
  description?: string;
}

interface WorldBookManagerProps {
  onClose: () => void;
  worldBooks: WorldBook[];
  onWorldBooksChange: (worldBooks: WorldBook[]) => void;
}

export function WorldBookManager({ onClose, worldBooks, onWorldBooksChange }: WorldBookManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<WorldBook | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      name: '',
      content: '',
      description: ''
    });
    setShowAddDialog(true);
  };

  const handleOpenEdit = (book: WorldBook) => {
    setEditingBook(book);
    setFormData({
      name: book.name,
      content: book.content,
      description: book.description || ''
    });
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('请输入世界书名称');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('请输入世界书内容');
      return;
    }

    const bookData: WorldBook = {
      id: editingBook?.id || Date.now().toString(),
      name: formData.name.trim(),
      content: formData.content.trim(),
      description: formData.description.trim()
    };

    if (editingBook) {
      onWorldBooksChange(worldBooks.map(b => b.id === editingBook.id ? bookData : b));
      toast.success('世界书已更新');
    } else {
      onWorldBooksChange([...worldBooks, bookData]);
      toast.success('世界书已添加');
    }

    setShowAddDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个世界书吗？')) {
      onWorldBooksChange(worldBooks.filter(b => b.id !== id));
      toast.success('世界书已删除');
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
        <h1 className="text-lg">世界书管理</h1>
        <button
          onClick={handleOpenAdd}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 世界书列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {worldBooks.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>还没有世界书</p>
                <p className="text-sm mt-2">点击右上角"+"添加世界书</p>
              </div>
            ) : (
              <div className="space-y-3">
                {worldBooks.map((book) => (
                  <div
                    key={book.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{book.name}</h3>
                        {book.description && (
                          <p className="text-sm text-gray-500 mb-2">{book.description}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                          {book.content}
                        </p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(book)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
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
            <DialogTitle>{editingBook ? '编辑世界书' : '添加世界书'}</DialogTitle>
            <DialogDescription>
              世界书包含背景设定、世界观、人物关系等信息，AI会在回复时参考这些内容
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* 名称 */}
              <div>
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：学校设定、魔法世界观"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* 描述 */}
              <div>
                <Label htmlFor="description">描述（可选）</Label>
                <Input
                  id="description"
                  placeholder="简短描述这个世界书的内容"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* 世界观/背景设定 */}
              <div>
                <Label htmlFor="content">世界观/背景设定 *</Label>
                <Textarea
                  id="content"
                  placeholder="输入世界书的详细内容，如背景设定、世界观、人物关系、地点描述等"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI会在聊天时读取这些内容，帮助它更好地理解世界背景和设定
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