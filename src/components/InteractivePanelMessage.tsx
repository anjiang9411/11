import React, { useState } from 'react';
import { ChevronRight, Globe, MessageCircle, Image as ImageIcon, Users, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

// 面板类型
type PanelType = 'browser-history' | 'chat-list' | 'chat-screenshot' | 'app-list';

// 面板数据接口
interface BrowserHistoryItem {
  id: string;
  title: string;
  url: string;
  visitTime: string;
  favicon?: string;
}

interface ChatListItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
}

interface ChatScreenshot {
  id: string;
  chatName: string;
  timestamp: string;
  imageUrl: string;
  messages: {
    sender: string;
    content: string;
    time: string;
  }[];
}

interface AppItem {
  id: string;
  name: string;
  icon: string;
  lastUsed: string;
}

interface InteractivePanelData {
  type: PanelType;
  title: string;
  browserHistory?: BrowserHistoryItem[];
  chatList?: ChatListItem[];
  chatScreenshots?: ChatScreenshot[];
  appList?: AppItem[];
}

interface InteractivePanelMessageProps {
  data: InteractivePanelData;
}

export function InteractivePanelMessage({ data }: InteractivePanelMessageProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 渲染预览内容（面板外部显示）
  const renderPreview = () => {
    const getIcon = () => {
      switch (data.type) {
        case 'browser-history':
          return <Globe className="w-4 h-4" />;
        case 'chat-list':
          return <MessageCircle className="w-4 h-4" />;
        case 'chat-screenshot':
          return <ImageIcon className="w-4 h-4" />;
        case 'app-list':
          return <Users className="w-4 h-4" />;
      }
    };

    const getCount = () => {
      switch (data.type) {
        case 'browser-history':
          return data.browserHistory?.length || 0;
        case 'chat-list':
          return data.chatList?.length || 0;
        case 'chat-screenshot':
          return data.chatScreenshots?.length || 0;
        case 'app-list':
          return data.appList?.length || 0;
      }
    };

    return (
      <button
        onClick={() => setShowDetail(true)}
        className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors w-full max-w-[280px]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{data.title}</p>
              <p className="text-xs text-gray-500">{getCount()} 项</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </button>
    );
  };

  // 渲染浏览器历史详情
  const renderBrowserHistory = () => {
    if (!data.browserHistory) return null;

    return (
      <div className="space-y-1">
        {data.browserHistory.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-full p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.favicon ? (
                  <img src={item.favicon} alt="" className="w-5 h-5" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate font-medium">{item.title}</p>
                <p className="text-xs text-blue-600 truncate">{item.url}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.visitTime}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // 渲染聊天列表详情
  const renderChatList = () => {
    if (!data.chatList) return null;

    return (
      <div className="space-y-1">
        {data.chatList.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-full p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
          >
            <div className="flex items-start gap-3">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-11 h-11 rounded-md object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{item.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate flex-1">{item.lastMessage}</p>
                  {item.unread && item.unread > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                      {item.unread > 99 ? '99+' : item.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // 渲染聊天截图详情
  const renderChatScreenshots = () => {
    if (!data.chatScreenshots) return null;

    return (
      <div className="grid grid-cols-2 gap-2 p-2">
        {data.chatScreenshots.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="relative rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.chatName}
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-xs text-white font-medium truncate">{item.chatName}</p>
              <p className="text-xs text-white/80">{item.timestamp}</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // 渲染应用列表详情
  const renderAppList = () => {
    if (!data.appList) return null;

    return (
      <div className="space-y-1">
        {data.appList.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-full p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {item.lastUsed}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // 渲染详情弹窗内容
  const renderDetailContent = () => {
    if (!selectedItem) return null;

    if (data.type === 'browser-history') {
      const item = selectedItem as BrowserHistoryItem;
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              {item.favicon ? (
                <img src={item.favicon} alt="" className="w-7 h-7" />
              ) : (
                <Globe className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {item.url}
              </a>
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500">访问时间</p>
            <p className="text-sm text-gray-900 mt-1">{item.visitTime}</p>
          </div>
        </div>
      );
    }

    if (data.type === 'chat-screenshot') {
      const item = selectedItem as ChatScreenshot;
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">{item.chatName}</h3>
            <p className="text-xs text-gray-500">{item.timestamp}</p>
          </div>
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.chatName}
              className="w-full rounded-lg border border-gray-200"
            />
          )}
          {item.messages && item.messages.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">消息内容</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {item.messages.map((msg, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{msg.sender}</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600">
        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedItem, null, 2)}</pre>
      </div>
    );
  };

  return (
    <>
      {renderPreview()}

      {/* 列表弹窗 */}
      <Dialog open={showDetail && !selectedItem} onOpenChange={(open) => !open && setShowDetail(false)}>
        <DialogContent className="max-w-[420px] max-h-[600px] p-0 overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">{data.title}</DialogTitle>
          <DialogDescription className="sr-only">查看详细列表</DialogDescription>
          
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
            <h3 className="font-medium text-gray-900">{data.title}</h3>
            <button
              onClick={() => setShowDetail(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 列表内容 */}
          <div className="overflow-y-auto max-h-[520px]">
            {data.type === 'browser-history' && renderBrowserHistory()}
            {data.type === 'chat-list' && renderChatList()}
            {data.type === 'chat-screenshot' && renderChatScreenshots()}
            {data.type === 'app-list' && renderAppList()}
          </div>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-[420px] max-h-[600px] overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">详细信息</DialogTitle>
          <DialogDescription className="sr-only">查看项目详情</DialogDescription>
          
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
            <button
              onClick={() => setSelectedItem(null)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← 返回
            </button>
            <button
              onClick={() => {
                setSelectedItem(null);
                setShowDetail(false);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 详情内容 */}
          <div className="overflow-y-auto max-h-[520px] px-4 pb-4">
            {renderDetailContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 解析面板数据的工具函数
export function parsePanelMessage(content: string): InteractivePanelData | null {
  const panelMatch = content.match(/\[PANEL:([^\]]+)\]([\s\S]*?)\[\/PANEL\]/);
  if (!panelMatch) return null;

  const type = panelMatch[1] as PanelType;
  const jsonData = panelMatch[2].trim();

  try {
    const data = JSON.parse(jsonData);
    return {
      type,
      ...data
    };
  } catch (e) {
    console.error('解析面板数据失败:', e);
    return null;
  }
}
