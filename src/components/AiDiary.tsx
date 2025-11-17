import React, { useState } from 'react';
import { X, BookHeart, Smile, Frown, Meh, Heart, Star, ChevronLeft, Trash2, Settings } from 'lucide-react';
import { Contact } from './Contacts';
import { StatusBar } from './StatusBar';

// 日记条目接口
export interface DiaryEntry {
  id: string;
  contactId: string; // AI角色ID
  date: string; // 日期 YYYY-MM-DD
  time: string; // 时间 HH:MM
  mood: 'happy' | 'sad' | 'neutral' | 'excited' | 'thoughtful'; // 心情
  weather?: string; // 天气
  content: string; // 日记完整内容（可以包含特殊标记）
  summary?: string; // 日记摘要（一句话总结，显示在列表中）
  relatedChatMessages?: string[]; // 相关的聊天消息ID
  createdAt: number; // 创建时间戳
  wordCount?: number; // 字数
  isCrumpled?: boolean; // 是否被撕掉/废弃（有褶皱效果）
}

interface AiDiaryProps {
  onClose: () => void;
  contacts: Contact[];
  diaryEntries: DiaryEntry[];
  onDiaryEntriesChange: (entries: DiaryEntry[]) => void;
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
}

// 心情图标
const MoodIcon = ({ mood }: { mood: DiaryEntry['mood'] }) => {
  switch (mood) {
    case 'happy':
      return <Smile className="w-5 h-5 text-yellow-500" />;
    case 'sad':
      return <Frown className="w-5 h-5 text-blue-500" />;
    case 'excited':
      return <Heart className="w-5 h-5 text-pink-500" />;
    case 'thoughtful':
      return <Star className="w-5 h-5 text-purple-500" />;
    default:
      return <Meh className="w-5 h-5 text-gray-500" />;
  }
};

// 心情文字
const MoodText = ({ mood }: { mood: DiaryEntry['mood'] }) => {
  const moodTexts = {
    happy: '开心',
    sad: '难过',
    neutral: '平静',
    excited: '兴奋',
    thoughtful: '沉思'
  };
  return <span>{moodTexts[mood]}</span>;
};

// 根据contactId生成一致的手写字体
const getHandwritingFont = (contactId: string): string => {
  // 使用contactId的哈希值来确定字体，保证同一个角色总是用同一种字体
  const hash = contactId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fonts = [
    '"Long Cang", "Ma Shan Zheng", cursive',
    '"Zhi Mang Xing", "Liu Jian Mao Cao", cursive',
    '"ZCOOL XiaoWei", "Ma Shan Zheng", cursive',
    '"ZCOOL KuaiLe", "Long Cang", cursive',
    '"Ma Shan Zheng", "Zhi Mang Xing", cursive',
    '"Liu Jian Mao Cao", "ZCOOL XiaoWei", cursive',
  ];
  return fonts[hash % fonts.length];
};

// 渲染日记内容（处理特殊标记 + 手写效果）
const DiaryContent = ({ content, contactId }: { content: string; contactId: string }) => {
  const handwritingFont = getHandwritingFont(contactId);
  
  // 解析内容中的特殊标记
  // [delete]删除的内容[/delete] - 删除线
  // [highlight]重点内容[/highlight] - 荧光笔标记
  // [underline]下划线内容[/underline] - 下划线
  // [underline2]双下划线内容[/underline2] - 双下划线
  // [wavy]波浪线内容[/wavy] - 波浪下划线
  // [scribble]涂抹内容[/scribble] - 涂抹痕迹
  // [cross]划掉的内容[/cross] - 交叉划线
  // [circle]圈出的内容[/circle] - 圆圈标记
  // [color=red]红色文字[/color] - 彩色文字
  // [typo]错字->正确[/typo] - 错别字修正
  // [insert]插入的内容[/insert] - 补充内容
  // [margin]旁批内容[/margin] - 边缘批注
  
  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // 匹配所有标记（包括color标记）
    const regex = /\[(delete|highlight|underline|underline2|wavy|scribble|cross|circle|typo|insert|margin|color=[a-z]+)\](.*?)\[\/(delete|highlight|underline|underline2|wavy|scribble|cross|circle|typo|insert|margin|color)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // 添加标记前的普通文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }

      const type = match[1];
      const innerText = match[2];

      // 根据类型渲染
      if (type.startsWith('color=')) {
        // 处理颜色标记
        const color = type.split('=')[1];
        const colorMap: Record<string, string> = {
          red: '#dc2626',
          blue: '#2563eb',
          green: '#16a34a',
          purple: '#9333ea',
          orange: '#ea580c',
          pink: '#db2777',
          brown: '#92400e',
        };
        parts.push(
          <span
            key={`mark-${key++}`}
            style={{ color: colorMap[color] || '#000' }}
          >
            {innerText}
          </span>
        );
      } else {
        // 处理其他标记
        switch (type) {
          case 'delete':
            // 删除线 - 用红色粗线划掉
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block mx-0.5"
              >
                <span className="text-gray-400">
                  {innerText}
                </span>
                <span 
                  className="absolute inset-0 flex items-center pointer-events-none"
                  style={{
                    transform: `rotate(${Math.random() * 4 - 2}deg)`,
                  }}
                >
                  <span className="w-full h-0.5 bg-red-500/80" style={{
                    transform: `scaleY(${1.2 + Math.random() * 0.3})`,
                  }}></span>
                </span>
              </span>
            );
            break;

          case 'highlight':
            // 荧光笔标记
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block px-1 -mx-0.5"
              >
                <span 
                  className="absolute inset-0 bg-yellow-200/70 -skew-x-3"
                  style={{
                    transform: `translateY(${Math.random() * 2}px) skew(${Math.random() * 2 - 1}deg)`,
                  }}
                ></span>
                <span className="relative">{innerText}</span>
              </span>
            );
            break;

          case 'underline':
            // 单下划线 - 手写风格
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block"
              >
                <span>{innerText}</span>
                <svg 
                  className="absolute bottom-0 left-0 w-full h-1 pointer-events-none"
                  style={{ transform: 'translateY(2px)' }}
                >
                  <path
                    d={`M 0 ${2 + Math.random()} Q ${innerText.length * 2} ${Math.random() * 2}, ${innerText.length * 4} ${2 + Math.random()}`}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            );
            break;

          case 'underline2':
            // 双下划线
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block"
              >
                <span>{innerText}</span>
                <span className="absolute bottom-0 left-0 w-full flex flex-col gap-0.5" style={{ transform: 'translateY(3px)' }}>
                  <span className="w-full h-px bg-red-500/80"></span>
                  <span className="w-full h-px bg-red-500/80"></span>
                </span>
              </span>
            );
            break;

          case 'wavy':
            // 波浪下划线
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block"
              >
                <span>{innerText}</span>
                <svg 
                  className="absolute bottom-0 left-0 w-full h-2 pointer-events-none"
                  style={{ transform: 'translateY(2px)' }}
                >
                  <path
                    d={`M 0 ${1 + Math.sin(0) * 0.5} ${Array.from({ length: 20 }, (_, i) => 
                      `L ${(i + 1) * innerText.length * 0.2} ${1 + Math.sin((i + 1) * 0.5) * 1}`
                    ).join(' ')}`}
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </span>
            );
            break;

          case 'scribble':
            // 涂抹痕迹 - 用半透明色块覆盖
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block"
              >
                <span className="opacity-40 blur-[1px]">{innerText}</span>
                <span 
                  className="absolute inset-0 bg-gray-800/30"
                  style={{
                    transform: `rotate(${Math.random() * 3 - 1.5}deg) scaleY(${1.2 + Math.random() * 0.3})`,
                    filter: 'blur(0.5px)',
                  }}
                ></span>
              </span>
            );
            break;

          case 'cross':
            // 交叉划线
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block mx-1"
              >
                <span className="text-gray-400">{innerText}</span>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="#ef4444" strokeWidth="2" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="#ef4444" strokeWidth="2" />
                </svg>
              </span>
            );
            break;

          case 'circle':
            // 圆圈标记
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block px-2 mx-1"
              >
                <span className="relative z-10">{innerText}</span>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scale(1.3)' }}>
                  <ellipse
                    cx="50%"
                    cy="50%"
                    rx="45%"
                    ry="60%"
                    stroke="#ef4444"
                    strokeWidth="2"
                    fill="none"
                    style={{
                      transform: `rotate(${Math.random() * 10 - 5}deg)`,
                    }}
                  />
                </svg>
              </span>
            );
            break;

          case 'typo':
            // 格式：错字->正确
            const [wrong, correct] = innerText.split('->');
            parts.push(
              <span key={`mark-${key++}`} className="relative inline-block mx-0.5">
                <span className="line-through text-gray-400/70 decoration-red-400 decoration-2">{wrong}</span>
                {correct && (
                  <span className="ml-1 text-blue-600 inline-block" style={{
                    fontSize: '0.9em',
                  }}>
                    {correct}
                  </span>
                )}
              </span>
            );
            break;

          case 'insert':
            // 插入的内容 - 小号字体，带箭头
            parts.push(
              <span
                key={`mark-${key++}`}
                className="relative inline-block"
              >
                <span className="inline-block text-blue-600 px-1" style={{
                  fontSize: '0.85em',
                  transform: 'translateY(-4px)',
                }}>
                  ↑{innerText}
                </span>
              </span>
            );
            break;

          case 'margin':
            // 旁批 - 显示在右侧
            parts.push(
              <span key={`mark-${key++}`} className="relative inline-block">
                <span className="absolute left-full ml-2 text-xs text-purple-600 whitespace-nowrap" style={{
                  top: '-0.5em',
                }}>
                  [{innerText}]
                </span>
              </span>
            );
            break;
        }
      }

      lastIndex = regex.lastIndex;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div 
      className="whitespace-pre-wrap leading-loose"
      style={{ fontFamily: handwritingFont }}
    >
      {parseContent(content)}
    </div>
  );
};

export function AiDiary({ onClose, contacts, diaryEntries, onDiaryEntriesChange, realTime, batteryLevel, isCharging }: AiDiaryProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [minWordCount, setMinWordCount] = useState<number>(() => {
    const saved = localStorage.getItem('diaryMinWordCount');
    return saved ? parseInt(saved) : 800;
  });

  // 保存字数设置
  const saveWordCountSetting = (count: number) => {
    setMinWordCount(count);
    localStorage.setItem('diaryMinWordCount', count.toString());
  };

  // 获取有日记的AI角色
  const aiWithDiaries = contacts.filter(contact => 
    diaryEntries.some(entry => entry.contactId === contact.id)
  );

  // 获取当前选中角色的日记（按时间倒序）
  const currentDiaries = selectedContactId
    ? diaryEntries
        .filter(entry => entry.contactId === selectedContactId)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedDiary = diaryEntries.find(d => d.id === selectedDiaryId);

  // 删除日记
  const handleDeleteDiary = (diaryId: string) => {
    if (window.confirm('确定要删除这篇日记吗？')) {
      const updatedEntries = diaryEntries.filter(entry => entry.id !== diaryId);
      onDiaryEntriesChange(updatedEntries);
      setSelectedDiaryId(null);
    }
  };

  // 如果正在查看日记详情
  if (selectedDiaryId && selectedDiary) {
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
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b shadow-sm">
          <button onClick={() => setSelectedDiaryId(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-medium">日记正文</h1>
          <button onClick={() => handleDeleteDiary(selectedDiary.id)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* 日记详情内容 - 仿真手写纸张效果 */}
        <div 
          className={`flex-1 overflow-y-auto relative ${
            selectedDiary.isCrumpled 
              ? 'bg-gradient-to-br from-amber-100/80 via-yellow-100/60 to-orange-100/80' 
              : 'bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/50'
          }`}
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE and Edge
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
          
          {/* 纸张纹理背景 */}
          <div 
            className={`absolute inset-0 pointer-events-none ${
              selectedDiary.isCrumpled ? 'opacity-20' : 'opacity-10'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
          
          {/* 褶皱效果遮罩 - 仅在isCrumpled为true时显示 */}
          {selectedDiary.isCrumpled && (
            <>
              {/* 褶皱纹理层 */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, transparent 30%, rgba(0,0,0,0.03) 30%, rgba(0,0,0,0.03) 35%, transparent 35%),
                    linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.03) 30%, rgba(0,0,0,0.03) 35%, transparent 35%),
                    linear-gradient(60deg, transparent 40%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.02) 42%, transparent 42%),
                    linear-gradient(-60deg, transparent 40%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.02) 42%, transparent 42%)
                  `,
                  backgroundSize: '20px 20px, 20px 20px, 15px 15px, 15px 15px',
                  backgroundPosition: '0 0, 10px 10px, 5px 5px, 15px 15px',
                }}
              ></div>
              
              {/* 随机褶皱阴影 */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(ellipse at 20% 30%, rgba(0,0,0,0.08) 0%, transparent 40%),
                    radial-gradient(ellipse at 80% 20%, rgba(0,0,0,0.06) 0%, transparent 35%),
                    radial-gradient(ellipse at 40% 70%, rgba(0,0,0,0.05) 0%, transparent 30%),
                    radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.07) 0%, transparent 40%),
                    radial-gradient(ellipse at 15% 85%, rgba(0,0,0,0.04) 0%, transparent 25%)
                  `,
                }}
              ></div>
            </>
          )}
          
          <div 
            className="relative p-6 max-w-md mx-auto"
            style={selectedDiary.isCrumpled ? {
              filter: 'contrast(0.95) brightness(0.98)',
            } : undefined}
          >
            {/* 日期标题 - 手写风格 */}
            <div className="mb-8 pb-4 border-b-2 border-amber-200/50">
              <h2 
                className="text-xl tracking-wide"
                style={{
                  fontFamily: '"Long Cang", "Ma Shan Zheng", "Zhi Mang Xing", "Liu Jian Mao Cao", cursive',
                  transform: `rotate(-0.5deg)`,
                  letterSpacing: '0.05em',
                }}
              >
                {selectedDiary.date.split('-')[0]}年{selectedDiary.date.split('-')[1]}月{selectedDiary.date.split('-')[2]}日 
                <span className="ml-2 text-base text-gray-500">
                  星期{['日', '一', '二', '三', '四', '五', '六'][new Date(selectedDiary.date).getDay()]}
                </span>
              </h2>
              {selectedDiary.weather && (
                <p className="text-sm text-gray-500 mt-2" style={{
                  fontFamily: '"Long Cang", cursive',
                }}>
                  {selectedDiary.weather}
                </p>
              )}
            </div>

            {/* 日记正文 - 手写字体效果 */}
            <div 
              className="text-[17px] text-gray-800 leading-loose tracking-wide"
              style={{
                fontFamily: '"Long Cang", "Ma Shan Zheng", "Zhi Mang Xing", "Liu Jian Mao Cao", "ZCOOL XiaoWei", "ZCOOL KuaiLe", cursive',
                textIndent: '2em',
                wordSpacing: '0.1em',
              }}
            >
              <DiaryContent content={selectedDiary.content} contactId={selectedDiary.contactId} />
            </div>

            {/* 落款 - 日记作者 */}
            {selectedContact && (
              <div 
                className="mt-12 text-right text-gray-600"
                style={{
                  fontFamily: '"Long Cang", cursive',
                  transform: 'rotate(-1deg)',
                }}
              >
                <p className="text-sm">
                  —— {selectedContact.nickname || selectedContact.realName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedDiary.time}
                </p>
              </div>
            )}

            {/* 装饰性墨点 */}
            <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-gray-300/30 blur-sm"></div>
            <div className="absolute bottom-20 left-12 w-1.5 h-1.5 rounded-full bg-gray-300/40 blur-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  // 日记列表视图
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
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 flex items-center justify-between border-b shadow-sm">
        <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <BookHeart className="w-5 h-5 text-pink-500" />
          <h1 className="font-medium">日记本</h1>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1 rounded-full transition-colors ${showSettings ? 'bg-white/70' : 'hover:bg-white/50'}`}
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="bg-white border-b p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">日记最少字数</label>
            <span className="text-sm text-gray-500">{minWordCount}字</span>
          </div>
          <input
            type="range"
            min="500"
            max="3000"
            step="100"
            value={minWordCount}
            onChange={(e) => saveWordCountSetting(parseInt(e.target.value))}
            className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>500</span>
            <span>1500</span>
            <span>3000</span>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 设置后，AI角色写日记时会至少写这么多字
          </p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧角色列表 */}
        <div 
          className="w-28 bg-gray-50 border-r overflow-y-auto"
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE and Edge
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {aiWithDiaries.map(contact => {
            const diaryCount = diaryEntries.filter(e => e.contactId === contact.id).length;
            return (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContactId(contact.id);
                  setSelectedDiaryId(null);
                }}
                className={`w-full p-3 flex flex-col items-center gap-2 border-b transition-colors ${
                  selectedContactId === contact.id
                    ? 'bg-white border-l-4 border-l-pink-500 shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
              >
                <img
                  src={contact.avatar}
                  alt={contact.nickname || contact.realName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
                <div className="text-xs text-center">
                  <p className="truncate w-full font-medium">{contact.remark || contact.nickname || contact.realName}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{diaryCount}篇</p>
                </div>
              </button>
            );
          })}
          
          {aiWithDiaries.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">
              <BookHeart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              暂无日记
            </div>
          )}
        </div>

        {/* 右侧日记列表 */}
        <div 
          className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-pink-50/30"
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE and Edge
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {selectedContactId ? (
            <div className="p-4 space-y-3">
              {currentDiaries.map(entry => (
                <div
                  key={entry.id}
                  className="relative w-full bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-pink-200"
                  onClick={() => setSelectedDiaryId(entry.id)}
                  style={{
                    transform: `rotate(${Math.random() * 0.5 - 0.25}deg)`,
                  }}
                >
                  {/* 日记头部 */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={selectedContact?.avatar}
                      alt={selectedContact?.nickname || selectedContact?.realName}
                      className="w-10 h-10 rounded-full shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedContact?.remark || selectedContact?.nickname || selectedContact?.realName}</p>
                      <p className="text-xs text-gray-400">
                        {entry.date}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDiary(entry.id);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* 日记摘要（引用样式） */}
                  <div 
                    className="text-sm text-gray-600 leading-relaxed pl-3 border-l-2 border-pink-300"
                    style={{
                      fontFamily: '"Long Cang", cursive',
                    }}
                  >
                    {entry.summary || entry.content.slice(0, 50) + '...'}
                  </div>

                  {/* 装饰角标 */}
                  <div className="absolute top-2 right-2 w-8 h-8 opacity-5">
                    <BookHeart className="w-full h-full text-pink-400" />
                  </div>
                </div>
              ))}

              {currentDiaries.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <BookHeart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Ta还没有写日记</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BookHeart className="w-20 h-20 mx-auto mb-4 opacity-20" />
                <p>选择一个AI角色查看Ta的日记</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}