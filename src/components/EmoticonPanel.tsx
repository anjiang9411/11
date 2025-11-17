import { useState, useRef } from 'react';
import { X, Upload, Link2, Plus, Trash2, ImagePlus, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ScrollArea } from './ui/scroll-area';

export interface CustomEmoji {
  id: string;
  url: string;
  description: string; // AI理解用
}

interface EmoticonPanelProps {
  onSelect: (emoji: string, description?: string) => void;
  onClose: () => void;
  customEmojis: CustomEmoji[];
  onCustomEmojisChange: (emojis: CustomEmoji[]) => void;
}

// 默认微信表情（使用emoji Unicode）
const DEFAULT_WECHAT_EMOJIS = [
  { emoji: '😀', description: '微笑' },
  { emoji: '😃', description: '开心' },
  { emoji: '😄', description: '大笑' },
  { emoji: '😁', description: '咧嘴笑' },
  { emoji: '😆', description: '哈哈' },
  { emoji: '😅', description: '尴尬笑' },
  { emoji: '🤣', description: '笑哭' },
  { emoji: '😂', description: '喜极而泣' },
  { emoji: '🙂', description: '微微笑' },
  { emoji: '😊', description: '害羞' },
  { emoji: '😇', description: '天使' },
  { emoji: '🥰', description: '爱心眼' },
  { emoji: '😍', description: '花痴' },
  { emoji: '🤩', description: '星星眼' },
  { emoji: '😘', description: '飞吻' },
  { emoji: '😗', description: '亲亲' },
  { emoji: '😚', description: '害羞亲' },
  { emoji: '😙', description: '微笑亲' },
  { emoji: '🥲', description: '含泪微笑' },
  { emoji: '😋', description: '馋' },
  { emoji: '😛', description: '吐舌' },
  { emoji: '😜', description: '俏皮' },
  { emoji: '🤪', description: '疯狂' },
  { emoji: '😝', description: '调皮' },
  { emoji: '🤑', description: '发财' },
  { emoji: '🤗', description: '抱抱' },
  { emoji: '🤭', description: '捂嘴笑' },
  { emoji: '🫢', description: '惊讶捂嘴' },
  { emoji: '🫣', description: '偷看' },
  { emoji: '🤫', description: '嘘' },
  { emoji: '🤔', description: '思考' },
  { emoji: '🫡', description: '敬礼' },
  { emoji: '🤐', description: '闭嘴' },
  { emoji: '🤨', description: '质疑' },
  { emoji: '😐', description: '面无表情' },
  { emoji: '😑', description: '无语' },
  { emoji: '😶', description: '沉默' },
  { emoji: '🫥', description: '虚空' },
  { emoji: '😶‍🌫️', description: '迷雾' },
  { emoji: '😏', description: '得意' },
  { emoji: '😒', description: '不悦' },
  { emoji: '🙄', description: '翻白眼' },
  { emoji: '😬', description: '露齿' },
  { emoji: '😮‍💨', description: '呼气' },
  { emoji: '🤥', description: '说谎' },
  { emoji: '😌', description: '如释重负' },
  { emoji: '😔', description: '沉思' },
  { emoji: '😪', description: '困' },
  { emoji: '🤤', description: '流口水' },
  { emoji: '😴', description: '睡' },
  { emoji: '😷', description: '口罩' },
  { emoji: '🤒', description: '发烧' },
  { emoji: '🤕', description: '受伤' },
  { emoji: '🤢', description: '恶心' },
  { emoji: '🤮', description: '吐' },
  { emoji: '🤧', description: '打喷嚏' },
  { emoji: '🥵', description: '热' },
  { emoji: '🥶', description: '冷' },
  { emoji: '😵', description: '晕' },
  { emoji: '😵‍💫', description: '眩晕' },
  { emoji: '🤯', description: '爆炸头' },
  { emoji: '🤠', description: '牛仔' },
  { emoji: '🥳', description: '庆祝' },
  { emoji: '🥸', description: '伪装' },
  { emoji: '😎', description: '酷' },
  { emoji: '🤓', description: '书呆子' },
  { emoji: '🧐', description: '单片眼镜' },
  { emoji: '😕', description: '困惑' },
  { emoji: '🫤', description: '不确定' },
  { emoji: '😟', description: '担心' },
  { emoji: '🙁', description: '轻微不悦' },
  { emoji: '😮', description: '惊讶张嘴' },
  { emoji: '😯', description: '惊讶' },
  { emoji: '😲', description: '震惊' },
  { emoji: '😳', description: '脸红' },
  { emoji: '🥺', description: '恳求' },
  { emoji: '🥹', description: '感动' },
  { emoji: '😦', description: '皱眉惊讶' },
  { emoji: '😧', description: '痛苦' },
  { emoji: '😨', description: '害怕' },
  { emoji: '😰', description: '焦虑' },
  { emoji: '😥', description: '失望' },
  { emoji: '😢', description: '哭' },
  { emoji: '😭', description: '大哭' },
  { emoji: '😱', description: '尖叫' },
  { emoji: '😖', description: '难受' },
  { emoji: '😣', description: '坚持' },
  { emoji: '😞', description: '失落' },
  { emoji: '😓', description: '冷汗' },
  { emoji: '😩', description: '疲惫' },
  { emoji: '😫', description: '崩溃' },
  { emoji: '🥱', description: '打哈欠' },
  { emoji: '😤', description: '哼' },
  { emoji: '😡', description: '愤怒' },
  { emoji: '😠', description: '生气' },
  { emoji: '🤬', description: '骂人' },
  { emoji: '👍', description: '点赞' },
  { emoji: '👎', description: '踩' },
  { emoji: '👏', description: '鼓掌' },
  { emoji: '🙏', description: '祈祷' },
  { emoji: '🤝', description: '握手' },
  { emoji: '❤️', description: '爱心' },
  { emoji: '💔', description: '心碎' },
  { emoji: '💕', description: '两颗心' },
  { emoji: '💖', description: '闪亮心' },
  { emoji: '💗', description: '心动' },
  { emoji: '💓', description: '怦然心动' },
  { emoji: '💞', description: '旋转心' },
  { emoji: '💝', description: '礼物心' },
  { emoji: '🌹', description: '玫瑰' },
  { emoji: '🌸', description: '樱花' },
  { emoji: '🌺', description: '花' },
  { emoji: '🌻', description: '太阳花' },
  { emoji: '🌷', description: '郁金香' },
  { emoji: '🎂', description: '蛋糕' },
  { emoji: '🎉', description: '庆祝彩带' },
  { emoji: '🎁', description: '礼物' },
  { emoji: '🎈', description: '气球' },
  { emoji: '🔥', description: '火' },
  { emoji: '⭐', description: '星星' },
  { emoji: '✨', description: '闪光' },
  { emoji: '💫', description: '眩晕星' },
  { emoji: '💥', description: '爆炸' },
  { emoji: '💢', description: '怒' },
  { emoji: '💦', description: '汗' },
  { emoji: '💨', description: '冲' },
  { emoji: '🕐', description: '1点' },
  { emoji: '☀️', description: '太阳' },
  { emoji: '🌙', description: '月亮' },
  { emoji: '⛅', description: '多云' },
  { emoji: '🌈', description: '彩虹' },
];

export function EmoticonPanel({ onSelect, onClose, customEmojis, onCustomEmojisChange }: EmoticonPanelProps) {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [showAddCustomDialog, setShowAddCustomDialog] = useState(false);
  const [addMethod, setAddMethod] = useState<'local' | 'url' | 'batch' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 单个上传状态
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  
  // 本地上传状态
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');
  const [localDescription, setLocalDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 批量URL上传状态
  const [batchUrls, setBatchUrls] = useState('');

  // 处理表情选择
  const handleSelectEmoji = (emoji: string, description?: string) => {
    onSelect(emoji, description);
    // 不关闭面板，允许连续选择
  };

  // 处理本地文件选择
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setLocalFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLocalPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // 处理添加本地上传的表情
  const handleAddLocalEmoji = () => {
    if (!localFile || !localPreview) {
      toast.error('请选择图片文件');
      return;
    }
    if (!localDescription.trim()) {
      toast.error('请输入图片描述（方便AI理解表情含义）');
      return;
    }

    const newEmoji: CustomEmoji = {
      id: Date.now().toString(),
      url: localPreview, // 使用base64 data URL
      description: localDescription.trim(),
    };

    onCustomEmojisChange([...customEmojis, newEmoji]);
    toast.success('已添加自定义表情');
    
    // 重置表单
    setLocalFile(null);
    setLocalPreview('');
    setLocalDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAddCustomDialog(false);
    setAddMethod(null);
  };

  // 处理添加自定义表情（URL方式）
  const handleAddCustomEmoji = () => {
    if (!uploadUrl.trim()) {
      toast.error('请输入图片URL');
      return;
    }
    if (!uploadDescription.trim()) {
      toast.error('请输入图片描述（方便AI理解）');
      return;
    }

    const newEmoji: CustomEmoji = {
      id: Date.now().toString(),
      url: uploadUrl.trim(),
      description: uploadDescription.trim(),
    };

    onCustomEmojisChange([...customEmojis, newEmoji]);
    toast.success('已添加自定义表情');
    
    // 重置表单
    setUploadUrl('');
    setUploadDescription('');
    setShowAddCustomDialog(false);
    setAddMethod(null);
  };

  // 处理批量添加
  const handleBatchAddEmojis = () => {
    if (!batchUrls.trim()) {
      toast.error('请输入表情数据');
      return;
    }

    // 解析格式：描述-url,描述-url
    const lines = batchUrls.split(',').map(line => line.trim()).filter(line => line);
    const newEmojis: CustomEmoji[] = [];
    let errorCount = 0;

    for (const line of lines) {
      const parts = line.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const [description, url] = parts;
        if (description && url) {
          newEmojis.push({
            id: `${Date.now()}-${Math.random()}`,
            url,
            description,
          });
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    }

    if (newEmojis.length > 0) {
      onCustomEmojisChange([...customEmojis, ...newEmojis]);
      toast.success(`成功添加 ${newEmojis.length} 个表情${errorCount > 0 ? `，${errorCount} 个格式错误已忽略` : ''}`);
      setBatchUrls('');
      setShowAddCustomDialog(false);
      setAddMethod(null);
    } else {
      toast.error('未能添加任何表情，请检查格式');
    }
  };

  // 删除自定义表情
  const handleDeleteCustomEmoji = (id: string) => {
    onCustomEmojisChange(customEmojis.filter(e => e.id !== id));
    toast.success('已删除表情');
  };

  // 筛选默认表情（根据搜索）
  const filteredDefaultEmojis = searchQuery
    ? DEFAULT_WECHAT_EMOJIS.filter(item => 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DEFAULT_WECHAT_EMOJIS;

  // 筛选自定义表情（根据搜索）
  const filteredCustomEmojis = searchQuery
    ? customEmojis.filter(emoji => 
        emoji.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customEmojis;

  return (
    <>
      <div className="bg-white border-t border-gray-200" style={{ height: '240px', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <div className="h-full flex flex-col">
          {/* 头部 - 搜索栏 */}
          <div className="flex items-center px-2 py-2 border-b border-gray-100">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索表情..."
                className="h-8 pl-8 pr-3 text-sm"
              />
            </div>
          </div>

          {/* 标签栏 */}
          <div className="flex items-center px-2 py-1.5 border-b border-gray-100">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'default' | 'custom')} className="flex-1">
              <TabsList className="h-7 bg-gray-50 p-0.5">
                <TabsTrigger value="default" className="text-xs px-3">😊 微信表情</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs px-3">⭐ 自定义</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {activeTab === 'default' && (
              <>
                {filteredDefaultEmojis.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <p>未找到相关表情</p>
                    <p className="text-sm mt-1">试试其他关键词</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {filteredDefaultEmojis.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectEmoji(item.emoji, item.description)}
                        className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-all active:scale-95"
                        title={item.description}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'custom' && (
              <div>
                {customEmojis.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <p>还没有自定义表情</p>
                    <p className="text-sm mt-1">点击下方按钮添加</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {filteredCustomEmojis.map((emoji) => (
                      <div key={emoji.id} className="relative group">
                        <button
                          onClick={() => handleSelectEmoji(`[自定义:${emoji.description}]`, emoji.description)}
                          className="w-full aspect-square hover:bg-gray-100 rounded p-1 transition-colors overflow-hidden"
                          title={emoji.description}
                        >
                          <ImageWithFallback
                            src={emoji.url}
                            alt={emoji.description}
                            className="w-full h-full object-cover rounded"
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomEmoji(emoji.id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 添加按钮 */}
                <div className="mt-3 flex gap-2 justify-center flex-wrap">
                  <Button
                    onClick={() => {
                      setAddMethod('local');
                      setShowAddCustomDialog(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <ImagePlus className="w-4 h-4" />
                    本地上传
                  </Button>
                  <Button
                    onClick={() => {
                      setAddMethod('url');
                      setShowAddCustomDialog(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <Link2 className="w-4 h-4" />
                    URL上传
                  </Button>
                  <Button
                    onClick={() => {
                      setAddMethod('batch');
                      setShowAddCustomDialog(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    批量URL
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加自定义表情对话框 */}
      <Dialog open={showAddCustomDialog} onOpenChange={(open) => {
        setShowAddCustomDialog(open);
        if (!open) {
          // 关闭时重置所有状态
          setLocalFile(null);
          setLocalPreview('');
          setLocalDescription('');
          setUploadUrl('');
          setUploadDescription('');
          setBatchUrls('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addMethod === 'local' ? '本地上传表情' : addMethod === 'url' ? '添加自定义表情' : '批量添加表情'}
            </DialogTitle>
            <DialogDescription>
              {addMethod === 'local' 
                ? '上传本地图片并添加描述，帮助AI理解表情含义'
                : addMethod === 'url' 
                  ? '输入图片URL和描述（描述用于AI理解表情含义）'
                  : '格式：图片意思-url，图片意思-url（多个用逗号分隔）'
              }
            </DialogDescription>
          </DialogHeader>

          {addMethod === 'local' ? (
            <div className="space-y-4 pt-4">
              <div>
                <Label>选择图片文件</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLocalFileSelect}
                    className="hidden"
                    id="local-emoji-upload"
                  />
                  <label
                    htmlFor="local-emoji-upload"
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {localPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <ImageWithFallback
                          src={localPreview}
                          alt="预览"
                          className="w-24 h-24 object-cover rounded"
                        />
                        <p className="text-sm text-gray-500">点击重新选择</p>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-500">点击选择图片（最大5MB）</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div>
                <Label>图片描述（必填）</Label>
                <Input
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  placeholder="例如：开心、笑脸、比心、点赞等"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 描述会帮助AI理解表情含义，请清楚说明这个表情代表什么意思或情绪
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddCustomDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAddLocalEmoji} disabled={!localFile || !localDescription.trim()}>
                  添加
                </Button>
              </div>
            </div>
          ) : addMethod === 'url' ? (
            <div className="space-y-4 pt-4">
              <div>
                <Label>图片URL</Label>
                <Input
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/emoji.png"
                />
              </div>
              <div>
                <Label>图片描述</Label>
                <Input
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="例如：开心、笑脸、比心等"
                />
                <p className="text-xs text-gray-500 mt-1">
                  描述会帮助AI理解表情含义，在AI回复时使用
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddCustomDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAddCustomEmoji}>
                  添加
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div>
                <Label>批量输入</Label>
                <Textarea
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  placeholder="开心-https://example.com/1.png,悲伤-https://example.com/2.png,惊讶-https://example.com/3.png"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  每个表情格式：描述-URL，多个表情用英文逗号分隔
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddCustomDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleBatchAddEmojis}>
                  批量添加
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}