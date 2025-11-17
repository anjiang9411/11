// WeChat Component - API Timeout Fix v3.0
// 修复超时问题：增加超时时间到240秒（4分钟），优化重试机制到8秒延迟
import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { X, MessageCircle, Phone, Users, User, ChevronRight, ChevronDown, Search, Plus, ArrowLeft, Send, Smile, MoreHorizontal, Bot, RefreshCw, Settings, Pin, Trash2, Mail, MailOpen, Mic, Upload, Link as LinkIcon, BellOff, Image as ImageIcon, Briefcase, Star, Camera, CreditCard, Sticker, Bell, QrCode, Wallet, BookOpen, FileText, BookHeart, Folder, FolderOpen, Edit, Move, Share2, List, Clock, MapPin, Heart, Video, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { toast } from 'sonner@2.0.3';
import { Contact } from './Contacts';
import { EmoticonPanel, CustomEmoji } from './EmoticonPanel';
import { PlusMenuPanel } from './PlusMenuPanel';
import { ContactProfile } from './ContactProfile';
import { ContactMoments } from './ContactMoments';
import { UserProfileSettings } from './UserProfileSettings';
import { UserPersonaManager, UserPersona } from './UserPersonaManager';
import { WorldBook } from './WorldBookManager';
import { Rule } from './RulesManager';
import { StatusBar } from './StatusBar';
import { MomentPost, MomentComment } from './Moments';
import { generateMomentsContext, getMomentsInstructions, parseMomentActions } from '../utils/momentsContext';
import { ChatForwardCard } from './ChatForwardCard';
import { MomentScreenshotCard } from './MomentScreenshotCard';
import { WeChatWallet } from './WeChatWallet';
import { MessageContextMenu } from './MessageContextMenu';
import { ImageMessage } from './ImageMessage';
import { CameraMessage } from './CameraMessage';
import { LocationMessage } from './LocationMessage';
import { TransferMessage } from './TransferMessage';
import { TransferDialog } from './TransferDialog';
import { RedPacketMessage } from './RedPacketMessage';
import { RedPacketDialog } from './RedPacketDialog';
import { RedPacketDetail } from './RedPacketDetail';
import { GiftMessage } from './GiftMessage';
import { GiftDialog } from './GiftDialog';
import { publicAnonKey, projectId } from '../utils/supabase/info';
import { DiaryEntry } from './AiDiary';
import { AiMemos } from './AiMemos';
import { createDiaryEntryWithAI, shouldCreateDiary } from '../utils/aiDiaryGenerator';
import { generateGroupChatMessages } from '../utils/groupChatAi';
import { getRelevantMemorySummary } from '../utils/aiMemory';
import { VideoCall } from './VideoCall';
import { IncomingVideoCall } from './IncomingVideoCall';
import { InteractivePanelMessage, parsePanelMessage } from './InteractivePanelMessage';
import { OutgoingVideoCall } from './OutgoingVideoCall';
import { VoiceCall } from './VoiceCall';
import { ContactCardMessage } from './ContactCardMessage';
import { MomentShareCard } from './MomentShareCard';
import { MomentDetailDialog } from './MomentDetailDialog';

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

// 聊天消息接口
export interface ChatMessage {
  id: string;
  senderId: string; // 发送者的contactId，如果是用户自己则为'me'
  content: string;
  timestamp: number;
  type?: 'text' | 'voice' | 'pat' | 'image' | 'camera' | 'location' | 'transfer' | 'redpacket' | 'system' | 'card' | 'momentShare' | 'gift'; // 消息类型
  senderName?: string; // 发送者名称（用于系统消息）
  text?: string; // 消息文本（用于系统消息）
  voiceDuration?: number; // 语音时长（秒）
  voiceText?: string; // 语音对应的文字内容
  showVoiceText?: boolean; // 是否显示语音文字
  failed?: boolean; // 消息是否发送失败（被拉黑时显示红色感叹号）
  blockedMessage?: boolean; // 用户被角色拉黑时发送的消息（角色看不到，显示红色感叹号）
  blockedFromUser?: boolean; // 角色被用户拉黑时发送的消息（用户看不到，但保存下来供后续查看）
  patTarget?: string; // 拍一拍的目标（contactId或'me'）
  patMessage?: string; // 拍一拍的后缀内容
  recalled?: boolean; // 消息是否已撤回
  recalledBy?: string; // 撤回者（'me' 或 contactId）
  isEdited?: boolean; // ✏️ 消息是否已编辑
  editedAt?: string; // ✏️ 编辑时间
  replyTo?: string; // 引用的消息ID
  replyContent?: string; // 引用的消息内容
  replySenderId?: string; // 被引用消息的发送者ID
  imageUrl?: string; // 图片URL
  cameraDescription?: string; // 拍摄内容的文字描述（用于camera类型）
  locationAddress?: string; // 位置地址（用于location类型）
  transferAmount?: number; // 转账金额
  transferNote?: string; // 转账留言
  transferStatus?: 'pending' | 'received' | 'expired'; // 转账状态：待领取、已领取、已过期
  transferReceivedAt?: number; // 转账领取时间
  redpacketAmount?: number; // 红包总金额
  redpacketNote?: string; // 红包留言
  redpacketType?: 'normal' | 'lucky'; // 红包类型：普通红包、拼手气红包
  redpacketCount?: number; // 红包个数
  redpacketReceivers?: Array<{ userId: string; amount: number; timestamp: number }>; // 红包领取记��
  redpacketStatus?: 'pending' | 'finished' | 'expired'; // 红包状态
  cardContactId?: string; // 名片联系人ID（用于card类型）
  cardContactName?: string; // 名片联系人名称
  cardContactAvatar?: string; // 名片联系人头像
  momentShareId?: string; // 朋友圈动态ID（用于momentShare类型）
  momentShareContent?: string; // 朋友圈内容
  momentShareImages?: string[]; // 朋友圈图片
  momentShareAuthorId?: string; // 朋友圈作者ID
  momentShareAuthorName?: string; // 朋友圈作者名称
  momentShareLocation?: string; // 朋友圈位置
  giftId?: string; // 礼物ID（用于gift类型）
  giftName?: string; // 礼物名称
  giftIcon?: string; // 礼物图标emoji
  giftMessage?: string; // 礼物附言
  giftPrice?: number; // 礼物价格
}

// 聊天总结接口
export interface ChatSummary {
  id: string;
  content: string; // 总结内容
  messageRange: [number, number]; // 总结的消息索引范围 [开始��引, 结束索引]
  timestamp: number; // 总结创建时间
  messageCount: number; // 总结的消息数量
}

// 总结配置接口
export interface SummaryConfig {
  enabled: boolean; // 是否启用总结功能
  autoSummary: boolean; // 是否自动总结
  messageThreshold: number; // 多少条消息后总结（默认50）
}

// 微���好友接口（基于Contact）
export interface WeChatFriend {
  contactId: string; // 对应Contact的id
  chatMessages: ChatMessage[];
  unreadCount: number;
  isPinned?: boolean; // 是否置顶
  markedUnread?: boolean; // 是否标记为未读
  isMuted?: boolean; // 是否消息免打扰
  chatBackground?: string; // 聊天背景图片URL
  groupId?: string; // 所属分组ID
  summaryConfig?: SummaryConfig; // 总结配置
  summaries?: ChatSummary[]; // 聊天总结列表
  lastSummaryIndex?: number; // 上次总结到的消息索引
}

// 微信通讯录分组接口
export interface ContactGroup {
  id: string;
  name: string;
  order: number; // 排序顺序
}

// 微信群聊接口
export interface WeChatGroup {
  id: string; // 群聊ID
  name: string; // 群名称
  memberIds: string[]; // 群成员的contactId列表
  chatMessages: ChatMessage[]; // 群聊消息（senderId可以是memberIds中的任何一个或'me'）
  unreadCount: number;
  isPinned?: boolean;
  markedUnread?: boolean;
  isMuted?: boolean; // 是否消息免打扰
  chatBackground?: string; // 聊天背景图片URL
  isUserInGroup: boolean; // 用户是否在群中（��果false则只能看不能发）
  summaryConfig?: SummaryConfig; // 总结配置
  summaries?: ChatSummary[]; // 聊天总结列表
  lastSummaryIndex?: number; // 上次总结到的消息索引
}

// AI主动发消息配置
export interface AiAutoMessageConfig {
  enabled: boolean; // 是否启用AI主动发消息
  enabledContactIds: string[]; // 启用主动发消息的好友ID列表
  enabledGroupIds?: string[]; // 启用主动发消息的群聊ID列表
  enabledAiIds: string[]; // 启用的AI配置ID列表
  messageIntervalMin: number; // 最小发消息间隔（秒）
  messageIntervalMax: number; // 最大发消息间隔（秒）
  autoReplyEnabled: boolean; // 是否启用自动回复
  autoReplyContactIds: string[]; // 启用自动回复的好友ID列表
  autoReplyGroupIds?: string[]; // 启用自动回复的群聊ID列表
  timeAwarenessEnabled: boolean; // 是否启用AI时间感知（准确时间）
  videoCallEnabled?: boolean; // 是否启用AI主动视频通话
  videoCallContactIds?: string[]; // 启用主动视频通话的好友ID列表
  videoCallIntervalMin?: number; // 最小视频通话间隔（秒）
  videoCallIntervalMax?: number; // 最大视频通话间隔（秒）
}

interface ApiConfig {
  id: string;
  name: string;
  type: 'gemini' | 'claude' | 'deepseek' | 'openai' | 'custom';
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  selectedModel?: string;
}

interface WeChatProps {
  onClose: () => void;
  contacts: Contact[]; // 从通讯录传来的联系人列表
  weChatFriends: WeChatFriend[];
  onWeChatFriendsChange: (friends: WeChatFriend[]) => void;
  weChatGroups?: WeChatGroup[]; // 群聊列表
  onWeChatGroupsChange?: (groups: WeChatGroup[]) => void;
  onContactsChange?: (contacts: Contact[]) => void; // 新增：更新联系人信息（可选）
  // AI相关props
  worldBooks?: WorldBook[]; // 世界书列表
  rules?: Rule[]; // 规���列表
  apiConfigs: ApiConfig[];
  selectedApiId: string;
  projectId: string;
  accessToken: string;
  userId: string; // 固定的用户ID，用于数据存储
  // AI主动发消息配置
  aiAutoMessageConfig: AiAutoMessageConfig;
  onAiAutoMessageConfigChange: (config: AiAutoMessageConfig) => void;
  // 🧠 记忆互通设置（独立配置）
  crossSceneMemoryCount?: number; // 跨场景记忆预览条数（默认5）
  onCrossSceneMemoryCountChange?: (count: number) => void;
  // AI朋友圈互动配置
  aiMomentsConfig?: {
    autoPostEnabled: boolean;
    autoPostContactIds: string[];
    postIntervalMin: number;
    postIntervalMax: number;
    autoLikeEnabled: boolean;
    autoLikeContactIds: string[];
    likeChance: number;
    autoCommentEnabled: boolean;
    autoCommentContactIds: string[];
    commentChance: number;
  };
  onAiMomentsConfigChange?: (config: any) => void;
  // 自定义表情
  customEmojis: CustomEmoji[];
  onCustomEmojisChange: (emojis: CustomEmoji[]) => void;
  // 通知回调
  onNotification?: (notification: { contactId: string; content: string }) => void;
  // 日程安排
  scheduleItems?: Array<{
    id: string;
    contactId: string;
    startTime: string;
    endTime: string;
    activity: string;
    date: string;
  }>;
  currentDate?: Date; // 当前模拟日期
  // 用户个人资料
  userProfile: UserProfile;
  onUserProfileChange: (profile: UserProfile) => void;
  // 管理器打开回调
  onOpenWorldBooksManager?: () => void;
  onOpenRulesManager?: () => void;
  onOpenAiDiary?: () => void;
  // 标签页控制
  activeTab?: 'chats' | 'contacts' | 'discover' | 'me';
  onActiveTabChange?: (tab: 'chats' | 'contacts' | 'discover' | 'me') => void;
  // 状态栏数据
  realTime: Date;
  batteryLevel: number;
  isCharging: boolean;
  // 朋友圈
  onMomentsClick?: () => void;
  moments?: MomentPost[];
  onMomentsChange?: (moments: MomentPost[]) => void;
  // 通讯录分组
  contactGroups?: ContactGroup[];
  onContactGroupsChange?: (groups: ContactGroup[]) => void;
  // 收藏消息
  collectedMessages?: ChatMessage[];
  onCollectedMessagesChange?: (messages: ChatMessage[]) => void;
  // AI日记
  diaryEntries?: DiaryEntry[];
  onDiaryEntriesChange?: (entries: DiaryEntry[]) => void;
  // 用户人设
  userPersonas?: UserPersona[];
  onUserPersonasChange?: (personas: UserPersona[]) => void;
  // 初始打开的聊天
  initialChatId?: string | null;
  initialGroupId?: string | null;
}

export function WeChat({ onClose, contacts, weChatFriends, onWeChatFriendsChange, weChatGroups = [], onWeChatGroupsChange, onContactsChange, worldBooks = [], rules = [], apiConfigs, selectedApiId, projectId, accessToken, userId, aiAutoMessageConfig, onAiAutoMessageConfigChange, crossSceneMemoryCount = 5, onCrossSceneMemoryCountChange, aiMomentsConfig, onAiMomentsConfigChange, customEmojis, onCustomEmojisChange, onNotification, scheduleItems = [], currentDate = new Date(), userProfile, onUserProfileChange, onOpenWorldBooksManager, onOpenRulesManager, onOpenAiDiary, activeTab: externalActiveTab, onActiveTabChange, realTime, batteryLevel, isCharging, onMomentsClick, moments = [], onMomentsChange, contactGroups = [], onContactGroupsChange, collectedMessages: externalCollectedMessages = [], onCollectedMessagesChange, diaryEntries = [], onDiaryEntriesChange, userPersonas = [], onUserPersonasChange, initialChatId = null, initialGroupId = null }: WeChatProps) {
  // 渲染计数器
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  console.log(`[WeChat组件]渲染次数: ${renderCountRef.current}`);
  
  const [internalActiveTab, setInternalActiveTab] = useState<'chats' | 'contacts' | 'discover' | 'me'>('chats');
  
  // 使用外部控制的activeTab，如果没有则使用内部状态
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'chats' | 'contacts' | 'discover' | 'me') => {
    if (onActiveTabChange) {
      onActiveTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null); // 当前打开的群聊ID
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showPersonaManager, setShowPersonaManager] = useState(false); // 人设管理器状态
  const [showMemos, setShowMemos] = useState(false); // 备忘录页面状态
  
  // 表情面板状态
  const [showEmoticonPanel, setShowEmoticonPanel] = useState(false);
  
  // 功能菜单面板状态
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  // 语音输入对话框状态
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  
  // 图片发送对话框状态
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  
  // 拍摄对话框状态
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraDescriptionInput, setCameraDescriptionInput] = useState('');
  
  // ���置对话框状态
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationAddressInput, setLocationAddressInput] = useState('');
  
  // 转账对话框状态
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  
  // 红包对话框状态
  const [showRedPacketDialog, setShowRedPacketDialog] = useState(false);
  const [showRedPacketDetail, setShowRedPacketDetail] = useState(false);
  const [selectedRedPacket, setSelectedRedPacket] = useState<ChatMessage | null>(null);
  
  // 礼物对话框状态
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  
  // 名片对话框状态
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedCardContactId, setSelectedCardContactId] = useState<string | null>(null);
  console.log('[名片对话框]当前showCardDialog值:', showCardDialog);
  
  // 朋友圈详情对话框状态
  const [showMomentDetailDialog, setShowMomentDetailDialog] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  
  // 🔥 监听selectedMomentId变化，确保弹窗立即打开
  useEffect(() => {
    if (selectedMomentId) {
      console.log('🎴 [useEffect] selectedMomentId变化，强制打开弹窗', selectedMomentId);
      setShowMomentDetailDialog(true);
    }
  }, [selectedMomentId]);
  
  // AI主动发消息配置对话框
  const [showAutoMessageConfigDialog, setShowAutoMessageConfigDialog] = useState(false);
  const [tempAutoMessageConfig, setTempAutoMessageConfig] = useState<AiAutoMessageConfig>(aiAutoMessageConfig);
  
  // 🧠 记忆互通设置对话框
  const [showMemorySettingsDialog, setShowMemorySettingsDialog] = useState(false);
  const [tempMemoryCount, setTempMemoryCount] = useState(crossSceneMemoryCount);
  
  // 设置菜单状态
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // Plus按钮菜单状态
  const [showPlusButtonMenu, setShowPlusButtonMenu] = useState(false);
  
  // 聊天菜单状态
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showChatBackground, setShowChatBackground] = useState(false);
  const [chatBackgroundInput, setChatBackgroundInput] = useState('');
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  
  // 好感度系统状态
  const [showAffectionDialog, setShowAffectionDialog] = useState(false);
  const [affectionDataMap, setAffectionDataMap] = useState<Record<string, {
    affection: number;
    emotion: string;
    innerThought: string;
  }>>({});
  const [isLoadingAffection, setIsLoadingAffection] = useState(false);
  
  // 获取当前联系人的好感度数据
  const affectionData = activeChatId ? affectionDataMap[activeChatId] : null;
  
  // 后端健康检查
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        console.log('🏥 [健康检查] 开始检查后端服务...');
        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/health`;
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [健康检查] 后端服务正常:', data);
        } else {
          console.warn('⚠️ [健康检查] 后端服务响应异常:', response.status, response.statusText);
          toast.error('后端服务连接异常，某些功能可能无法使用');
        }
      } catch (error) {
        console.error('❌ [健康检查] 后端服务连接失败:', error);
        toast.error('无法连接到后端服务，请检查网络连接或等待服务启动（约30秒）后刷新页面');
      }
    };
    
    checkBackendHealth();
  }, []);
  
  // 调试：显示当前好感度数据
  useEffect(() => {
    if (activeChatId && affectionData) {
      console.log('🎯 [好感度显示] 当前联系人好感度:', {
        contactId: activeChatId,
        affection: affectionData.affection,
        emotion: affectionData.emotion
      });
    }
  }, [activeChatId, affectionData]);
  
  // 发起群聊对话框状态
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [createGroupStep, setCreateGroupStep] = useState<'selectType' | 'selectMembers' | 'setInfo'>('selectType'); // 群聊创建步骤
  const [selectedGroupType, setSelectedGroupType] = useState<'inGroup' | 'notInGroup' | null>(null); // 用户在群/不在群
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]); // 选中的群成员
  const [groupName, setGroupName] = useState(''); // 群聊名称
  const [groupAvatar, setGroupAvatar] = useState(''); // 群聊头像URL
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(''); // 临时输入的URL
  const groupAvatarInputRef = useRef<HTMLInputElement>(null); // 文件上传ref
  
  // 角色主页状态
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [selectedProfileContact, setSelectedProfileContact] = useState<Contact | null>(null);
  
  // 视频通话状态
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallContact, setVideoCallContact] = useState<Contact | null>(null);
  
  // 视频通话邀请状态
  const [showIncomingVideoCall, setShowIncomingVideoCall] = useState(false);
  const [incomingCallContact, setIncomingCallContact] = useState<Contact | null>(null);
  const [isCallingContact, setIsCallingContact] = useState(false); // 正在呼叫状态
  
  // 用户主动呼出视频通话状态
  const [showOutgoingVideoCall, setShowOutgoingVideoCall] = useState(false);
  const [outgoingCallContact, setOutgoingCallContact] = useState<Contact | null>(null);
  const outgoingCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 语音通话状态
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [voiceCallContact, setVoiceCallContact] = useState<Contact | null>(null);
  
  // 角色朋友圈状态
  const [showContactMoments, setShowContactMoments] = useState(false);
  const [selectedMomentsContact, setSelectedMomentsContact] = useState<Contact | null>(null);
  
  // 钱包状态
  const [showWallet, setShowWallet] = useState(false);
  
  // 消息长按菜单状态
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // ✏️ 编辑消息状态
  const [showEditMessageDialog, setShowEditMessageDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editedContent, setEditedContent] = useState('');
  
  // 引用消息状态
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null);
  
  // 转发消息状态
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  
  // 收藏消息列表（使用外部状态）
  const collectedMessages = externalCollectedMessages;
  const setCollectedMessages = (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (onCollectedMessagesChange) {
      if (typeof messages === 'function') {
        onCollectedMessagesChange(messages(collectedMessages));
      } else {
        onCollectedMessagesChange(messages);
      }
    }
  };
  
  // 聊天总结相关状态
  const [showSummaryDialog, setShowSummaryDialog] = useState(false); // 显示总结列表
  const [showSummaryConfigDialog, setShowSummaryConfigDialog] = useState(false); // 显示总结配置
  const [editingSummary, setEditingSummary] = useState<ChatSummary | null>(null); // 正在编辑的总结
  const [isSummarizing, setIsSummarizing] = useState(false); // 正在生成总结
  const [summaryConfigForm, setSummaryConfigForm] = useState<SummaryConfig>({ enabled: true, autoSummary: false, messageThreshold: 50 }); // 总结配置表单
  
  // 查看撤回消息状态
  const [viewRecalledMessage, setViewRecalledMessage] = useState<ChatMessage | null>(null);
  
  // 查看收藏消息状态
  const [showCollectedMessages, setShowCollectedMessages] = useState(false);
  
  // 多选模式状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [showForwardTypeDialog, setShowForwardTypeDialog] = useState(false);
  const [forwardType, setForwardType] = useState<'merge' | 'separate'>('merge');
  
  // 分组管理状态
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [showMoveToGroupDialog, setShowMoveToGroupDialog] = useState(false);
  const [movingFriendId, setMovingFriendId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  // 定时器引用
  const messageTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const videoCallTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // 视频通话定时器
  // 保存最新的配置到ref，用于异步函数中访问最新值
  const aiAutoMessageConfigRef = useRef<AiAutoMessageConfig>(aiAutoMessageConfig);
  // ��存最新的apiConfigs到ref，用于定时器中访问最新值
  const apiConfigsRef = useRef<ApiConfig[]>(apiConfigs);
  // 跟踪正在发送消息的联系人/群聊ID（防止同一角色同时有多个发送任务）
  const sendingMessagesRef = useRef<Set<string>>(new Set());

  // 监听initialChatId和initialGroupId，自动打开指定的聊天
  useEffect(() => {
    if (initialChatId) {
      console.log('🎯 打开初始好友聊天:', initialChatId);
      setActiveChatId(initialChatId);
      setActiveGroupId(null);
    } else if (initialGroupId) {
      console.log('🎯 打开初始群聊:', initialGroupId);
      setActiveGroupId(initialGroupId);
      setActiveChatId(null);
    }
  }, [initialChatId, initialGroupId]);

  // 监控isAiReplying状��变化
  useEffect(() => {
    console.log('isAiReplying状态变化:', isAiReplying);
  }, [isAiReplying]);

  // 同步最新的配置到ref
  useEffect(() => {
    aiAutoMessageConfigRef.current = aiAutoMessageConfig;
  }, [aiAutoMessageConfig]);

  // 同步最新的apiConfigs到ref
  useEffect(() => {
    apiConfigsRef.current = apiConfigs;
    console.log('📦 apiConfigs已更新到ref, 数量:', apiConfigs.length);
  }, [apiConfigs]);

  // 监听showCardDialog变化
  useEffect(() => {
    console.log('[名片对话框]showCardDialog状态变化:', { 
      showCardDialog,
      weChatFriendsCount: weChatFriends.length,
      contactsCount: contacts.length
    });
  }, [showCardDialog, weChatFriends.length, contacts.length]);

  // 清理视频通话timeout
  useEffect(() => {
    return () => {
      if (outgoingCallTimeoutRef.current) {
        clearTimeout(outgoingCallTimeoutRef.current);
        console.log('[视频通话] 组件卸载，清除timeout');
      }
    };
  }, []);

  // 🔍 调试：打印所有联系人的isAi状态
  useEffect(() => {
    console.log('🔍 [WeChat组件] 所有联系人的isAi状态:');
    contacts.forEach(c => {
      console.log(`  - ${c.nickname} (${c.id}):`, {
        isAi: c.isAi,
        hasPersonality: !!c.personality,
        personality: c.personality?.substring(0, 30)
      });
    });
  }, [contacts]);

  // 数据迁移：修复错误的 senderId
  useEffect(() => {
    if (weChatFriends.length === 0) return; // 初始状态，不处理
    
    let hasChanges = false;
    const contactIds = contacts.map(c => c.id);

    // 修复好友聊天消息的 senderId
    const fixedFriends = weChatFriends.map(friend => {
      const fixedMessages = friend.chatMessages.map(msg => {
        // 如果 senderId 不是 'me' 也不是已知的联系人ID，则修正为 'me'
        if (msg.senderId !== 'me' && !contactIds.includes(msg.senderId)) {
          console.log('修复消息 senderId:', msg.senderId, '->', 'me', '内容:', (msg.content || '').substring(0, 20));
          hasChanges = true;
          return { ...msg, senderId: 'me' };
        }
        return msg;
      });
      if (JSON.stringify(fixedMessages) !== JSON.stringify(friend.chatMessages)) {
        return { ...friend, chatMessages: fixedMessages };
      }
      return friend;
    });

    // 修复群聊消息的 senderId
    const fixedGroups = weChatGroups?.map(group => {
      const fixedMessages = group.chatMessages.map(msg => {
        // 如果 senderId 不是 'me' 也不是已知的联系人ID，则修正为 'me'
        if (msg.senderId !== 'me' && !contactIds.includes(msg.senderId)) {
          console.log('修复群聊消息 senderId:', msg.senderId, '->', 'me', '内容:', (msg.content || '').substring(0, 20));
          hasChanges = true;
          return { ...msg, senderId: 'me' };
        }
        return msg;
      });
      if (JSON.stringify(fixedMessages) !== JSON.stringify(group.chatMessages)) {
        return { ...group, chatMessages: fixedMessages };
      }
      return group;
    });

    if (hasChanges) {
      console.log('🔧 检测到错误的 senderId，已自动修复');
      onWeChatFriendsChange(fixedFriends);
      if (onWeChatGroupsChange && fixedGroups) {
        onWeChatGroupsChange(fixedGroups);
      }
    }
  }, []); // 空依赖数组，只运行一次

  // 当总结配置对话框打开时，初始化表单数据
  useEffect(() => {
    if (showSummaryConfigDialog && activeChatId) {
      const friend = weChatFriends.find(f => f.contactId === activeChatId);
      if (friend?.summaryConfig) {
        setSummaryConfigForm(friend.summaryConfig);
      } else {
        setSummaryConfigForm({ enabled: true, autoSummary: false, messageThreshold: 50 });
      }
    }
  }, [showSummaryConfigDialog, activeChatId, weChatFriends]);

  // 获取联系人信��（通过contactId）
  const getContact = (contactId: string): Contact | undefined => {
    return contacts.find(c => c.id === contactId);
  };

  // 获取好友（通过contactId）
  const getFriend = (contactId: string): WeChatFriend | undefined => {
    return weChatFriends.find(f => f.contactId === contactId);
  };
  
  // 获取用户信息（支持单聊和群聊）
  const getUserInfo = (userId: string): { name: string; avatar: string } => {
    if (userId === 'me') {
      return {
        name: userProfile.username || '我',
        avatar: userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=me"
      };
    }
    
    // 如果在群聊中，先尝试从群成员中查找
    if (activeGroupId) {
      const group = weChatGroups.find(g => g.id === activeGroupId);
      if (group && group.memberIds.includes(userId)) {
        // 群成员，从联系人中获取信息
        const contact = getContact(userId);
        return {
          name: contact?.remark || contact?.nickname || '群成员',
          avatar: contact?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=friend"
        };
      }
    }
    
    // 从联系人中查找
    const contact = getContact(userId);
    return {
      name: contact?.remark || contact?.nickname || '好友',
      avatar: contact?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=friend"
    };
  };

  // 格式化聊天时间
  const formatChatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (msgDate.getTime() === today.getTime()) {
      // 今天：只显示时间
      return timeStr;
    } else if (msgDate.getTime() === yesterday.getTime()) {
      // 昨天
      return `昨天 ${timeStr}`;
    } else if (msgDate.getFullYear() === now.getFullYear()) {
      // 今年：显示月日和时间
      return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    } else {
      // 更早：显示完整日期
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    }
  };

  // 判断是否需要显示时间标签（超过5分钟）
  const shouldShowTimeLabel = (currentTimestamp: number, previousTimestamp?: number): boolean => {
    if (!previousTimestamp) return true; // 第一条消息总是显示时间
    return currentTimestamp - previousTimestamp > 5 * 60 * 1000; // 5分钟 = 300000毫秒
  };

  // 更新联系人状态
  const updateContactStatus = (contactId: string, statusText: string, isOnline: boolean = true) => {
    if (!onContactsChange) return;
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, statusText, isOnline } : c
    );
    onContactsChange(updatedContacts);
  };

  // 更新联系人个性签名
  const updateContactSignature = (contactId: string, signature: string) => {
    if (!onContactsChange) return;
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, signature } : c
    );
    onContactsChange(updatedContacts);
    toast.success(`${getContact(contactId)?.remark || getContact(contactId)?.nickname || '联系人'} 更新了个性签���`);
  };

  // 更新联系人所在地区
  const updateContactLocation = (contactId: string, location: string) => {
    if (!onContactsChange) return;
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, location } : c
    );
    onContactsChange(updatedContacts);
    toast.success(`${getContact(contactId)?.remark || getContact(contactId)?.nickname || '联系人'} 更新了所在地区为：${location}`);
  };

  // 更新联系人拍一拍后缀
  const updateContactPatMessage = (contactId: string, patMessage: string) => {
    if (!onContactsChange) return;
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, patMessage } : c
    );
    onContactsChange(updatedContacts);
    toast.success(`${getContact(contactId)?.remark || getContact(contactId)?.nickname || '联系人'} 更新了拍一拍`);
  };

  // 更新联系人昵称（网名）
  const updateContactNickname = (contactId: string, nickname: string) => {
    if (!onContactsChange) return;
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, nickname } : c
    );
    onContactsChange(updatedContacts);
    toast.success(`${getContact(contactId)?.remark || getContact(contactId)?.nickname || '联系人'} 更新了昵称为：${nickname}`);
  };

  // 更新联系人头像
  const updateContactAvatar = (contactId: string, avatarUrl: string) => {
    if (!onContactsChange) return;
    const contact = getContact(contactId);
    if (!contact) return;
    
    // 检查头像URL是否在头���库中
    const avatarInLibrary = contact.avatarLibrary?.find(a => a.url === avatarUrl);
    
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, avatar: avatarUrl } : c
    );
    onContactsChange(updatedContacts);
    
    if (avatarInLibrary) {
      toast.success(`${contact.remark || contact.nickname} 切换到了"${avatarInLibrary.emotion}"头像`);
    } else {
      toast.success(`${contact.remark || contact.nickname} 更新了头像`);
    }
  };

  // 更新联系人给用户的备注名
  const updateContactUserRemark = (contactId: string, userRemark: string) => {
    if (!onContactsChange) return;
    const contact = getContact(contactId);
    if (!contact) return;
    
    // 检查更改频率限制（至少间隔30天）
    const now = Date.now();
    const lastChangeTime = contact.lastRemarkChangeTime || 0;
    const daysSinceLastChange = Math.floor((now - lastChangeTime) / 86400000);
    
    // 如果距离上次更改不足30天，不允许更改（但首次可以）
    if (lastChangeTime > 0 && daysSinceLastChange < 30) {
      console.log(`⚠️ ${contact.nickname} 试图更改用户备注名，但距离上次更改仅${daysSinceLastChange}天，不允许`);
      return;
    }
    
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, userRemark, lastRemarkChangeTime: now } : c
    );
    onContactsChange(updatedContacts);
    
    // 显示温馨的提示
    const oldRemark = contact.userRemark;
    if (oldRemark) {
      toast.success(`💝 ${contact.remark || contact.nickname} 把对你的备注从"${oldRemark}"改成了"${userRemark}"`);
    } else {
      toast.success(`💝 ${contact.remark || contact.nickname} 给你起了个备注名："${userRemark}"`);
    }
    
    console.log(`🏷️ ${contact.nickname} 更新用户备注名: ${oldRemark || '无'} → ${userRemark}`);
  };

  // 双击计数器
  const clickTimerRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const clickCountRef = useRef<{ [key: string]: number }>({});
  const longPressTimerRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const isLongPressRef = useRef<{ [key: string]: boolean }>({});

  // 处理长按开始（艾特功能，仅在群聊中生效）
  const handleAvatarLongPressStart = (contact: Contact, isGroup: boolean = false) => {
    const key = `${isGroup ? 'group' : 'chat'}_${contact.id}`;
    isLongPressRef.current[key] = false;
    
    longPressTimerRef.current[key] = setTimeout(() => {
      isLongPressRef.current[key] = true;
      // 长按：艾特该用户（仅在群聊中插入@+网名到输入框）
      if (isGroup) {
        setMessageInput((prev) => prev + `@${contact.nickname} `);
      }
    }, 500); // 长按500ms触发
  };

  // 处理长按结束
  const handleAvatarLongPressEnd = (key: string) => {
    if (longPressTimerRef.current[key]) {
      clearTimeout(longPressTimerRef.current[key]!);
      longPressTimerRef.current[key] = null;
    }
  };

  // 消息长按处理（只对角色发的消息生效）
  const handleMessageLongPressStart = (message: ChatMessage, event: any) => {
    // 如果消息已撤回，不允许长按操作
    if (message.recalled) {
      return;
    }
    
    console.log('开始长按计时器', (message.content || '').substring(0, 20), 'senderId:', message.senderId);
    
    const timer = setTimeout(() => {
      const element = event.currentTarget || event.target;
      const rect = (element as HTMLElement).getBoundingClientRect();
      console.log('长按触发，位置:', rect);
      console.log('设置 selectedMessage:', { senderId: message.senderId, isMe: message.senderId === 'me' });
      
      // 智能定位：检查菜单是否会超���屏幕顶部
      // 菜单高度大约是 120px，加上间距 8px
      const menuHeight = 120;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // 如果上方空间不足（考虑状态栏和导航栏高度约100px），则显示在下方
      const showBelow = spaceAbove < menuHeight + 100;
      
      setMessageMenuPosition({
        x: rect.left + rect.width / 2,
        y: showBelow ? rect.bottom : rect.top,
        showBelow // 传递一个标记，告诉菜单组件显示在上方还是下方
      } as any);
      setSelectedMessage(message);
      setShowMessageMenu(true);
    }, 500); // 长按500ms触发
    setLongPressTimer(timer);
  };

  const handleMessageLongPressEnd = (event?: any) => {
    console.log('长按结束/取消');
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Fallback复制方法
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success('已复制');
      } else {
        toast.error('复制失败');
      }
    } catch (err) {
      console.error('复制失败:', err);
      toast.error('复制失败');
    }
    
    document.body.removeChild(textArea);
  };

  // 复制消息
  const handleCopyMessage = () => {
    if (!selectedMessage) return;
    
    // 尝试使用现代的 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(selectedMessage.content)
        .then(() => {
          toast.success('已复制');
        })
        .catch(() => {
          // Fallback to execCommand
          fallbackCopyTextToClipboard(selectedMessage.content);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyTextToClipboard(selectedMessage.content);
    }
  };

  // 转发消息
  const handleForwardMessage = () => {
    if (!selectedMessage) return;
    setForwardMessage(selectedMessage);
    setShowMessageMenu(false); // 关闭消息菜单
    setShowForwardDialog(true); // 打开转发对话框
  };
  
  // 执行转��到指定联系人
  const executeForward = (targetContactId: string) => {
    if (!forwardMessage) return;
    
    // 找到目标联系人的聊天记录
    const targetFriend = weChatFriends.find(f => f.contactId === targetContactId);
    const targetContact = contacts.find(c => c.id === targetContactId);
    
    if (!targetContact) {
      toast.error('联系人不存在');
      return;
    }
    
    // 创建转发的消息
    const forwardedMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: forwardMessage.content,
      timestamp: Date.now(),
      type: forwardMessage.type,
      voiceDuration: forwardMessage.voiceDuration,
      voiceText: forwardMessage.voiceText,
    };
    
    if (targetFriend) {
      // 如果已有聊天记录，添加到现有聊天
      const updatedFriends = weChatFriends.map(f => {
        if (f.contactId === targetContactId) {
          return {
            ...f,
            chatMessages: [...f.chatMessages, forwardedMessage],
          };
        }
        return f;
      });
      onWeChatFriendsChange(updatedFriends);
    } else {
      // 如果没有聊天记录，创建新的聊天
      const newFriend: WeChatFriend = {
        contactId: targetContactId,
        chatMessages: [forwardedMessage],
        unreadCount: 0,
      };
      onWeChatFriendsChange([...weChatFriends, newFriend]);
    }
    
    toast.success(`已转发给 ${targetContact.name}`);
    setShowForwardDialog(false);
    setForwardMessage(null);
  };

  // 收藏消息
  const handleCollectMessage = () => {
    if (!selectedMessage) return;
    setCollectedMessages(prev => [...prev, selectedMessage]);
    toast.success('已���藏');
  };

  // 撤回消息
  const handleRecallMessage = () => {
    if (!selectedMessage) return;
    
    // 检查消息是否在2分钟内
    const now = Date.now();
    const messageTime = selectedMessage.timestamp;
    const timeDiff = now - messageTime;
    
    if (timeDiff > 2 * 60 * 1000) {
      toast.error('超过2分钟的消息无法撤回');
      return;
    }

    if (activeChatId) {
      const friend = getFriend(activeChatId);
      if (friend) {
        // 标记消息为已撤回，而不是删除
        const updatedMessages = friend.chatMessages.map(m => 
          m.id === selectedMessage.id 
            ? { ...m, recalled: true, recalledBy: selectedMessage.senderId } 
            : m
        );
        const updatedFriend: WeChatFriend = {
          ...friend,
          chatMessages: updatedMessages
        };
        onWeChatFriendsChange(
          weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
        );
        toast.success('消息已撤回');
      }
    } else if (activeGroupId && onWeChatGroupsChange) {
      const group = weChatGroups?.find(g => g.id === activeGroupId);
      if (group) {
        // 标记消息为已撤回，而不是删除
        const updatedMessages = group.chatMessages.map(m => 
          m.id === selectedMessage.id 
            ? { ...m, recalled: true, recalledBy: selectedMessage.senderId } 
            : m
        );
        const updatedGroup: WeChatGroup = {
          ...group,
          chatMessages: updatedMessages
        };
        onWeChatGroupsChange(
          weChatGroups?.map(g => g.id === activeGroupId ? updatedGroup : g) || []
        );
        toast.success('消息已撤回');
      }
    }
  };

  // ✏️ 编辑消息
  const handleEditMessage = () => {
    console.log('🔧 handleEditMessage 被调用', { selectedMessage });
    if (!selectedMessage) {
      console.log('❌ 没有选中的消息');
      return;
    }
    console.log('✅ 开始编辑消息:', selectedMessage.content);
    setEditingMessage(selectedMessage);
    setEditedContent(selectedMessage.content);
    setShowMessageMenu(false);
    setShowEditMessageDialog(true);
  };
  
  // ✏️ 保存编辑的消息
  const handleSaveEditedMessage = () => {
    if (!editingMessage || !editedContent.trim()) return;
    
    const updatedMessage = {
      ...editingMessage,
      content: editedContent.trim(),
      isEdited: true, // 标记为已编辑
      editedAt: new Date().toISOString() // 记录编辑时间
    };
    
    // 更新私聊消息
    if (activeChatId) {
      const friend = weChatFriends.find(f => f.contactId === activeChatId);
      if (friend) {
        const updatedMessages = friend.chatMessages.map(msg =>
          msg.id === editingMessage.id ? updatedMessage : msg
        );
        const updatedFriend = {
          ...friend,
          chatMessages: updatedMessages
        };
        onWeChatFriendsChange(
          weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
        );
        toast.success('✅ 消息已编辑');
      }
    }
    
    // 更新群聊消息
    if (activeGroupId) {
      const group = getGroup(activeGroupId);
      if (group) {
        const updatedMessages = group.chatMessages.map(msg =>
          msg.id === editingMessage.id ? updatedMessage : msg
        );
        const updatedGroup = {
          ...group,
          chatMessages: updatedMessages
        };
        onWeChatGroupsChange(
          weChatGroups?.map(g => g.id === activeGroupId ? updatedGroup : g) || []
        );
        toast.success('✅ 消息已编辑');
      }
    }
    
    setShowEditMessageDialog(false);
    setEditingMessage(null);
    setEditedContent('');
  };

  // 多选消息
  const handleMultiSelectMessage = () => {
    setIsMultiSelectMode(true);
    setShowMessageMenu(false);
    if (selectedMessage) {
      setSelectedMessageIds(new Set([selectedMessage.id]));
    }
  };
  
  // 切换消息选中状态
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };
  
  // 退出多选模式
  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedMessageIds(new Set());
  };

  // 处理朋友圈点赞
  const handleMomentLike = (momentId: string) => {
    if (!onMomentsChange) return;
    
    const updatedMoments = moments.map(moment => {
      if (moment.id === momentId) {
        const isLiked = moment.likes.includes('me');
        console.log('🔥 [handleMomentLike] 点赞操作', {
          momentId,
          当前点赞状态: isLiked ? '已点赞' : '未点赞',
          当前点赞列表: moment.likes,
          操作: isLiked ? '取消点赞' : '添加点赞'
        });
        
        // 🔥 修复：确保去重，防止重复添加
        const newLikes = isLiked 
          ? moment.likes.filter(id => id !== 'me')
          : [...new Set([...moment.likes, 'me'])]; // 使用Set去重
        
        console.log('🔥 [handleMomentLike] 新的点赞列表（已去重）', newLikes);
        
        return {
          ...moment,
          likes: newLikes
        };
      }
      return moment;
    });
    
    console.log('🔥 [handleMomentLike] 更新后的moments', {
      momentId,
      更新后的点赞列表: updatedMoments.find(m => m.id === momentId)?.likes
    });
    
    onMomentsChange(updatedMoments);
  };

  // 处理朋友圈评论
  const handleMomentComment = (momentId: string, content: string, replyToCommentId?: string) => {
    if (!onMomentsChange || !content.trim()) return;
    
    const newComment: MomentComment = {
      id: Date.now().toString(),
      userId: 'me',
      content: content.trim(),
      timestamp: Date.now(),
      replyTo: replyToCommentId
    };
    
    const updatedMoments = moments.map(moment => {
      if (moment.id === momentId) {
        return {
          ...moment,
          comments: [...moment.comments, newComment]
        };
      }
      return moment;
    });
    
    onMomentsChange(updatedMoments);
    toast.success('评论成功');
  };
  
  // 批量删除消息
  const handleBatchDelete = () => {
    if (selectedMessageIds.size === 0) {
      toast.error('请选择要删除的消息');
      return;
    }
    
    if (activeChatId) {
      // 单聊删除
      const friend = weChatFriends.find(f => f.contactId === activeChatId);
      if (!friend) return;
      
      const updatedMessages = friend.chatMessages.filter(
        m => !selectedMessageIds.has(m.id)
      );
      
      const updatedFriend: WeChatFriend = {
        ...friend,
        chatMessages: updatedMessages
      };
      
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
      );
      
      toast.success(`已删除${selectedMessageIds.size}条消息`);
    } else if (activeGroupId && onWeChatGroupsChange) {
      // 群聊删除
      const group = weChatGroups?.find(g => g.id === activeGroupId);
      if (!group) return;
      
      const updatedMessages = group.chatMessages.filter(
        m => !selectedMessageIds.has(m.id)
      );
      
      const updatedGroup: WeChatGroup = {
        ...group,
        chatMessages: updatedMessages
      };
      
      onWeChatGroupsChange(
        weChatGroups?.map(g => g.id === activeGroupId ? updatedGroup : g) || []
      );
      
      toast.success(`已删除${selectedMessageIds.size}条消息`);
    }
    
    exitMultiSelectMode();
  };
  
  // 批量收藏消息
  const handleBatchCollect = () => {
    if (selectedMessageIds.size === 0) {
      toast.error('请��择要收藏的消息');
      return;
    }
    
    const messages: ChatMessage[] = [];
    
    if (activeChatId) {
      const friend = weChatFriends.find(f => f.contactId === activeChatId);
      if (friend) {
        friend.chatMessages.forEach(m => {
          if (selectedMessageIds.has(m.id)) {
            messages.push(m);
          }
        });
      }
    } else if (activeGroupId) {
      const group = weChatGroups?.find(g => g.id === activeGroupId);
      if (group) {
        group.chatMessages.forEach(m => {
          if (selectedMessageIds.has(m.id)) {
            messages.push(m);
          }
        });
      }
    }
    
    setCollectedMessages([...collectedMessages, ...messages]);
    toast.success(`已��藏${messages.length}条消息`);
    exitMultiSelectMode();
  };
  
  // 批量转发消息
  const handleBatchForward = () => {
    if (selectedMessageIds.size === 0) {
      toast.error('请选择要转发的消息');
      return;
    }
    setShowForwardTypeDialog(true);
  };
  
  // 统一的转发处理函数
  const handleForwardToContact = (targetContactId: string) => {
    if (isMultiSelectMode) {
      if (forwardType === 'merge') {
        handleMergeForward(targetContactId);
      } else {
        handleSeparateForward(targetContactId);
      }
    } else {
      executeForward(targetContactId);
    }
  };
  
  // 合并转发
  const handleMergeForward = (targetContactId: string) => {
    const messages: ChatMessage[] = [];
    
    if (activeChatId) {
      const friend = weChatFriends.find(f => f.contactId === activeChatId);
      if (friend) {
        friend.chatMessages.forEach(m => {
          if (selectedMessageIds.has(m.id)) {
            messages.push(m);
          }
        });
      }
    } else if (activeGroupId) {
      const group = weChatGroups?.find(g => g.id === activeGroupId);
      if (group) {
        group.chatMessages.forEach(m => {
          if (selectedMessageIds.has(m.id)) {
            messages.push(m);
          }
        });
      }
    }
    
    // 按时间排序
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // 创建聊天记录卡片消息 - 使用 [CHAT_CARD:contactId:messageIds] 格式
    const sourceContactId = activeChatId || activeGroupId || '';
    const messageIds = messages.map(m => m.id).join(',');
    
    const newMessage: ChatMessage = {
      id: `merge-forward-${Date.now()}`,
      senderId: 'me',
      content: `[CHAT_CARD:${sourceContactId}:${messageIds}]`,
      timestamp: Date.now(),
      type: 'text'
    };
    
    // 发送到目标联系人
    const targetFriend = weChatFriends.find(f => f.contactId === targetContactId);
    if (targetFriend) {
      const updatedFriend: WeChatFriend = {
        ...targetFriend,
        chatMessages: [...targetFriend.chatMessages, newMessage]
      };
      
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === targetContactId ? updatedFriend : f)
      );
    }
    
    toast.success(`已���发给 ${getContact(targetContactId)?.remark || getContact(targetContactId)?.nickname || '对方'}`);
    setShowForwardTypeDialog(false);
    setShowForwardDialog(false);
    exitMultiSelectMode();
  };
  
  // 逐条转发
  const handleSeparateForward = (targetContactId: string) => {
    const messages: ChatMessage[] = [];
    
    if (activeChatId) {
      const friend = weChatFriends.find(f => f.contactId === activeChatId);
      if (friend) {
        friend.chatMessages.forEach(m => {
          if (selectedMessageIds.has(m.id)) {
            messages.push(m);
          }
        });
      }
    } else if (activeGroupId) {
      const group = weChatGroups?.find(g => g.id === activeGroupId);
      if (group) {
        group.chatMessages.forEach(m => {
          if (selectedMessageIds.has(m.id)) {
            messages.push(m);
          }
        });
      }
    }
    
    // 按时间排序
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // 逐条发送
    const targetFriend = weChatFriends.find(f => f.contactId === targetContactId);
    if (targetFriend) {
      const newMessages = messages.map((m, index) => ({
        id: `separate-forward-${Date.now()}-${index}`,
        senderId: 'me' as const,
        content: m.content,
        timestamp: Date.now() + index * 100 // 稍微间隔发送时间
      }));
      
      const updatedFriend: WeChatFriend = {
        ...targetFriend,
        chatMessages: [...targetFriend.chatMessages, ...newMessages]
      };
      
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === targetContactId ? updatedFriend : f)
      );
    }
    
    toast.success(`已转发${messages.length}条消息给 ${getContact(targetContactId)?.remark || getContact(targetContactId)?.nickname || '对方'}`);
    setShowForwardTypeDialog(false);
    setShowForwardDialog(false);
    exitMultiSelectMode();
  };

  // 引用消息
  const handleQuoteMessage = () => {
    if (!selectedMessage) return;
    setQuotedMessage(selectedMessage);
    setShowMessageMenu(false);
    toast.success('已引用该消息��回复内容将显示在���入框上方');
  };

  // 提醒
  const handleRemindMessage = () => {
    toast.info('提醒功能开发中');
  };

  // 搜一搜
  const handleSearchMessage = () => {
    if (!selectedMessage) return;
    toast.info('搜一搜功能开发中');
  };

  // 处理头像点击（单击打开主页，双击拍一拍）
  const handleAvatarClick = (contact: Contact, isGroup: boolean = false) => {
    const key = `${isGroup ? 'group' : 'chat'}_${contact.id}`;
    
    // 如果是长按，不处理点击
    if (isLongPressRef.current[key]) {
      isLongPressRef.current[key] = false;
      return;
    }
    
    // 增加点击计数
    clickCountRef.current[key] = (clickCountRef.current[key] || 0) + 1;
    
    // 如果有定时器在运行，清除它
    if (clickTimerRef.current[key]) {
      clearTimeout(clickTimerRef.current[key]!);
    }
    
    // 设置新的定时器
    clickTimerRef.current[key] = setTimeout(() => {
      const count = clickCountRef.current[key] || 0;
      
      if (count === 1) {
        // 单击：打开角色主页
        setSelectedProfileContact(contact);
        setShowContactProfile(true);
      } else if (count >= 2) {
        // 双击：拍一拍
        handlePat(contact.id, isGroup);
      }
      
      // 重置计数
      clickCountRef.current[key] = 0;
      clickTimerRef.current[key] = null;
    }, 300); // 300ms内的点击视为双击
  };

  // 处理拍一拍
  const handlePat = (contactId: string, isGroup: boolean = false) => {
    const contact = getContact(contactId);
    if (!contact) return;

    // 创建拍一拍消息
    const patMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: `${userProfile.username}拍了拍${contact.remark || contact.nickname}${contact.patMessage || ''}`,
      timestamp: Date.now(),
      type: 'pat',
      patTarget: contactId,
      patMessage: contact.patMessage
    };

    if (isGroup && activeGroupId) {
      // 群聊中的拍一拍
      const group = weChatGroups.find(g => g.id === activeGroupId);
      if (group) {
        const updatedGroup = {
          ...group,
          chatMessages: [...group.chatMessages, patMessage]
        };
        if (onWeChatGroupsChange) {
          onWeChatGroupsChange(weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g));
        }
      }
    } else if (activeChatId) {
      // 单聊中的拍一拍
      const friend = getFriend(contactId);
      if (friend) {
        const updatedFriend = {
          ...friend,
          chatMessages: [...friend.chatMessages, patMessage]
        };
        onWeChatFriendsChange(weChatFriends.map(f => f.contactId === contactId ? updatedFriend : f));
      }
    }
    
    // 播放拍一拍提示
    toast.success(`你拍了拍${contact.remark || contact.nickname}`);
  };

  // AI拍用户（在发送AI消息时随机触发）
  const aiPatUser = (contactId: string, isGroup: boolean = false) => {
    const contact = getContact(contactId);
    if (!contact) return;

    // 创建AI拍用户的消息
    const patMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: contactId,
      content: `${contact.remark || contact.nickname}拍了拍${userProfile.username}${userProfile.patMessage || ''}`,
      timestamp: Date.now(),
      type: 'pat',
      patTarget: 'me',
      patMessage: userProfile.patMessage
    };

    if (isGroup) {
      // 群聊中AI拍用户
      const group = weChatGroups.find(g => g.memberIds.includes(contactId));
      if (group) {
        const updatedGroup = {
          ...group,
          chatMessages: [...group.chatMessages, patMessage]
        };
        if (onWeChatGroupsChange) {
          onWeChatGroupsChange(weChatGroups.map(g => g.id === group.id ? updatedGroup : g));
        }
      }
    } else {
      // 单聊中AI拍用户
      const friend = getFriend(contactId);
      if (friend) {
        const updatedFriend = {
          ...friend,
          chatMessages: [...friend.chatMessages, patMessage]
        };
        onWeChatFriendsChange(weChatFriends.map(f => f.contactId === contactId ? updatedFriend : f));
      }
    }
    
    toast(`${contact.remark || contact.nickname}拍了拍你`);
  };

  // 生成日期和日程上��文信息
  const getDateAndScheduleContext = (contactId?: string) => {
    let context = '';
    
    // 根据时间感知开关决定是否提供时间信息
    if (aiAutoMessageConfig.timeAwarenessEnabled) {
      // 使用日历上的日期 + 真实系统的时分秒
      const now = new Date();
      const simulatedDateTime = new Date(currentDate);
      simulatedDateTime.setHours(now.getHours());
      simulatedDateTime.setMinutes(now.getMinutes());
      simulatedDateTime.setSeconds(now.getSeconds());
      
      const accurateTime = simulatedDateTime.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      context = `\n当前准确时间：${accurateTime}（这是模拟的当前时间，你要把这个时间当作现在）\n`;
    } else {
      // 关闭时完全不提供任何时间信息
      context = `\n注意：你不知道现在的时间和日期，不要主动提及或询问时间相关的内容。\n`;
    }
    
    // 如果提供了contactId，则��显示与该联系人相关的日程
    if (contactId && scheduleItems.length > 0) {
      const todayStr = currentDate.toISOString().split('T')[0];
      const todaySchedules = scheduleItems.filter(s => s.date === todayStr && s.contactId === contactId);
      
      if (todaySchedules.length > 0) {
        context += `\n今天的日程安排：\n`;
        todaySchedules.forEach(schedule => {
          context += `- ${schedule.startTime} 到 ${schedule.endTime}：${schedule.activity}\n`;
        });
        context += `\n重要：请在相应时间段提醒用户或提及这些日程安排。\n`;
      }
    }
    
    return context;
  };

  // 生成聊天总结上下文信息
  const getSummaryContext = (summaries: ChatSummary[]) => {
    if (!summaries || summaries.length === 0) {
      return '';
    }
    
    return `\n# 历史聊天总结\n以下是之前对话的总结，帮助你回忆之前聊过的内容：\n\n${summaries.map((s, idx) => 
      `【总结${idx + 1}】(${s.messageCount}条消息，${new Date(s.timestamp).toLocaleDateString()})
${s.content}`
    ).join('\n\n')}\n\n注意：这些只是总结，不是完整对话，用于帮助你记住重要信息。\n`;
  };

  // 渲染消息内容（支持卡片）
  const renderMessageContent = (message: ChatMessage, isMe: boolean, eventHandlers?: any) => {
    const content = message.content;
    
    // 特殊处理：视频通话结束/未接通消息
    if (message.type === 'video-call-end' || message.type === 'video-call-missed') {
      return (
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 flex items-center gap-2" {...eventHandlers}>
          <Video className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">{content}</span>
        </div>
      );
    }
    
    // 特殊处理：名片消息
    if (message.type === 'card' && message.cardContactId && message.cardContactName && message.cardContactAvatar) {
      return (
        <div {...eventHandlers}>
          <ContactCardMessage
            cardContactName={message.cardContactName}
            cardContactAvatar={message.cardContactAvatar}
            onClick={() => {
              // 点击名片后打开联系人资料页面
              const cardContactId = message.cardContactId;
              if (!cardContactId) return;
              
              const cardContact = contacts.find(c => c.id === cardContactId);
              if (!cardContact) {
                toast.error('联系人不存在');
                return;
              }
              
              // 打开联系人资料页面
              setSelectedProfileContact(cardContact);
              setShowContactProfile(true);
              console.log(`👤 打开 ${cardContact.nickname} 的资料页面`);
            }}
          />
        </div>
      );
    }
    
    // 特殊处理：朋友圈分享消息
    if (message.type === 'momentShare' && message.momentShareId) {
      console.log('🎴 渲染朋友圈分享卡片', {
        messageId: message.id,
        momentShareId: message.momentShareId,
        authorName: message.momentShareAuthorName,
        content: message.momentShareContent
      });
      return (
        <div
          onClick={(e) => {
            // 阻止点击事件传播到消息列表
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('🎴 [朋友圈分享卡片外层] 阻止触摸事件传播');
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('🎴 [朋友圈分享卡片外层] 阻止鼠标按下事件传播');
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
          }}
        >
          <MomentShareCard
            authorName={message.momentShareAuthorName || '某人'}
            content={message.momentShareContent || ''}
            images={message.momentShareImages}
            location={message.momentShareLocation}
            onClick={(e) => {
              // 🔥 关键修复：立即阻止所有事件传播
              e.preventDefault();
              e.stopPropagation();
              
              console.log('🎴 [朋友圈分享卡片] 点击事件触发', {
                momentShareId: message.momentShareId,
                当前showMomentDetailDialog: showMomentDetailDialog
              });
              
              if (message.momentShareId) {
                // 🔥 使用 flushSync 强制同步更新状态，立即显示弹窗
                flushSync(() => {
                  setSelectedMomentId(message.momentShareId);
                  setShowMomentDetailDialog(true);
                });
                console.log('🎴 [朋友圈分享卡片] 设置弹窗状态为true（同步）', {
                  selectedMomentId: message.momentShareId
                });
              } else {
                toast.info('无法找到该朋友圈');
              }
            }}
            onPointerDown={(e) => {
              // 🔥 额外阻止 pointer 事件传播
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </div>
      );
    }
    
    // 渲染引用消息预览（如果有）
    const renderReplyPreview = () => {
      if (!message.replyTo || !message.replyContent) return null;
      
      const replySender = message.replySenderId === 'me' ? null : getContact(message.replySenderId || '');
      const replySenderName = message.replySenderId === 'me' ? '你' : (replySender?.remark || replySender?.nickname || '对方');
      
      return (
        <div className={`px-3 py-2 mb-1 rounded border-l-2 ${
          isMe ? 'bg-green-600 border-green-300' : 'bg-gray-100 border-gray-400'
        }`}>
          <div className={`text-xs ${isMe ? 'text-green-100' : 'text-gray-500'} mb-0.5`}>
            {replySenderName}
          </div>
          <div className={`text-sm ${isMe ? 'text-white' : 'text-gray-700'} truncate`}>
            {message.replyContent}
          </div>
        </div>
      );
    };
    
    // 🔥 检查是否是互动面板消息 [PANEL:type]...data...[/PANEL]
    const panelData = parsePanelMessage(content);
    if (panelData) {
      console.log('📊 [面板消息] 检测到互动面板消息', panelData);
      return (
        <div {...eventHandlers}>
          <InteractivePanelMessage data={panelData} />
        </div>
      );
    }
    
    // 检查是否是朋友圈卡片 [MOMENT_CARD:momentId]text
    const momentCardMatch = content.match(/^\[MOMENT_CARD:([^\]]+)\](.*)/);
    if (momentCardMatch) {
      const momentId = momentCardMatch[1];
      const text = momentCardMatch[2];
      const moment = moments.find(m => m.id === momentId);
      const author = moment ? getContact(moment.contactId) : null;
      
      console.log('🎴 [MOMENT_CARD渲染] 检测到朋友圈卡片消息', {
        momentId,
        找到的朋友圈: moment ? '✅' : '❌',
        text
      });
      
      return (
        <div className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`} {...eventHandlers}>
          {text && (
            <div className={`px-4 py-2 rounded-lg ${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
              {renderReplyPreview()}
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          )}
          {moment && author && (
            <MomentScreenshotCard 
              moment={moment} 
              author={author} 
              contacts={contacts}
              onClick={() => {
                // 🔥 点击打开朋友圈详情弹窗
                console.log('🎴 [MOMENT_CARD点击] 打开朋友圈详情弹窗', { momentId });
                flushSync(() => {
                  setSelectedMomentId(momentId);
                  setShowMomentDetailDialog(true);
                });
              }}
            />
          )}
        </div>
      );
    }
    
    // 检查是否是聊天记录卡片 [CHAT_CARD:contactId:messageIds]text
    const chatCardMatch = content.match(/^\[CHAT_CARD:([^:]+):([^\]]+)\](.*)/);
    if (chatCardMatch) {
      const sourceId = chatCardMatch[1];
      const messageIds = chatCardMatch[2].split(',');
      const text = chatCardMatch[3];
      
      // 尝试从好友聊天中获取
      const sourceFriend = getFriend(sourceId);
      const fromContact = getContact(sourceId);
      
      // 如果是好友聊天
      if (sourceFriend && fromContact) {
        const forwardedMessages = sourceFriend.chatMessages.filter(msg => messageIds.includes(msg.id));
        
        return (
          <div className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`} {...eventHandlers}>
            {text && (
              <div className={`px-4 py-2 rounded-lg ${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
                {renderReplyPreview()}
                <p className="whitespace-pre-wrap">{text}</p>
              </div>
            )}
            <ChatForwardCard 
              messages={forwardedMessages} 
              contacts={contacts} 
              fromContact={fromContact} 
            />
          </div>
        );
      }
      
      // 如果是群聊
      const sourceGroup = getGroup(sourceId);
      if (sourceGroup) {
        const forwardedMessages = sourceGroup.chatMessages.filter(msg => messageIds.includes(msg.id));
        // 创建一个虚拟的fromContact来表示群聊
        const groupAsContact: Contact = {
          id: sourceGroup.id,
          nickname: sourceGroup.name,
          avatar: sourceGroup.avatar,
          phoneNumber: '',
          isAI: false
        };
        
        return (
          <div className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`} {...eventHandlers}>
            {text && (
              <div className={`px-4 py-2 rounded-lg ${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
                {renderReplyPreview()}
                <p className="whitespace-pre-wrap">{text}</p>
              </div>
            )}
            <ChatForwardCard 
              messages={forwardedMessages} 
              contacts={contacts} 
              fromContact={groupAsContact} 
            />
          </div>
        );
      }
      
      // 如果找不到源，显示一个占位卡片
      return (
        <div className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`} {...eventHandlers}>
          {text && (
            <div className={`px-4 py-2 rounded-lg ${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
              {renderReplyPreview()}
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          )}
          <div className="bg-white rounded-lg p-3 border border-gray-200 max-w-[280px]">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-sm">
                💬
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">聊天记录</div>
                <div className="text-xs text-gray-500">消息已过期</div>
              </div>
            </div>
            <div className="pt-2 text-xs text-gray-400 text-center">
              该聊天记录已无法查看
            </div>
          </div>
        </div>
      );
    }
    
    // 普通消息
    return (
      <div className={`px-4 py-2 rounded-lg ${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`} {...eventHandlers}>
        {renderReplyPreview()}
        <p className="whitespace-pre-wrap">{content}</p>
        {message.isEdited && (
          <p className={`text-xs mt-1 ${isMe ? 'text-green-100' : 'text-gray-500'}`}>
            已编辑
          </p>
        )}
      </div>
    );
  };

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当进入聊天时清��未读数和标记未读状态
  useEffect(() => {
    if (activeChatId) {
      // 清除未读数和标记未读状态
      const updatedFriends = weChatFriends.map(f => 
        f.contactId === activeChatId 
          ? { ...f, unreadCount: 0, markedUnread: false } 
          : f
      );
      if (JSON.stringify(updatedFriends) !== JSON.stringify(weChatFriends)) {
        onWeChatFriendsChange(updatedFriends);
      }
      // 延迟滚动，确保DOM已渲染
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [activeChatId]);

  // 当进入群聊时清除未读数
  useEffect(() => {
    if (activeGroupId && onWeChatGroupsChange) {
      const updatedGroups = weChatGroups?.map(g => 
        g.id === activeGroupId 
          ? { ...g, unreadCount: 0, markedUnread: false } 
          : g
      );
      if (updatedGroups && JSON.stringify(updatedGroups) !== JSON.stringify(weChatGroups)) {
        onWeChatGroupsChange(updatedGroups);
      }
      // 延迟滚动，确保DOM已渲染
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [activeGroupId]);

  // 当消息更新时自动滚动到底部
  useEffect(() => {
    if (activeChatId) {
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [weChatFriends]);

  // 当群聊消息更新时自动滚动到底部
  useEffect(() => {
    if (activeGroupId) {
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [weChatGroups]);

  // 添加好友
  const handleAddFriends = () => {
    const newFriends: WeChatFriend[] = selectedContacts.map(contactId => ({
      contactId,
      chatMessages: [],
      unreadCount: 0
    }));

    // 过滤掉已经是好友的
    const friendsToAdd = newFriends.filter(
      nf => !weChatFriends.some(f => f.contactId === nf.contactId)
    );

    if (friendsToAdd.length === 0) {
      toast.error('选中的联系人已经��好友');
      return;
    }

    onWeChatFriendsChange([...weChatFriends, ...friendsToAdd]);
    setSelectedContacts([]);
    setShowAddFriendDialog(false);
    toast.success(`已添加 ${friendsToAdd.length} 位好友`);
  };

  // 群聊操作：置顶/取消置顶
  const handleToggleGroupPin = (groupId: string) => {
    if (!onWeChatGroupsChange) return;
    
    onWeChatGroupsChange(
      weChatGroups.map(g =>
        g.id === groupId ? { ...g, isPinned: !g.isPinned } : g
      )
    );
    
    const group = getGroup(groupId);
    toast.success(group?.isPinned ? '已取消置顶' : '已置顶');
  };

  // 群聊操作：删除群聊
  const handleDeleteGroup = (groupId: string) => {
    if (!onWeChatGroupsChange) return;
    
    onWeChatGroupsChange(
      weChatGroups.filter(g => g.id !== groupId)
    );
    
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
    
    toast.success('已删除群聊');
  };

  // 群聊操作：标记已读/未读
  const handleToggleGroupMarkUnread = (groupId: string) => {
    if (!onWeChatGroupsChange) return;
    
    onWeChatGroupsChange(
      weChatGroups.map(g =>
        g.id === groupId ? { ...g, markedUnread: !g.markedUnread } : g
      )
    );
    
    const group = getGroup(groupId);
    toast.success(group?.markedUnread ? '已标���已读' : '已标为未读');
  };

  // 群聊操作：消息免打扰
  const handleToggleGroupMute = (groupId: string) => {
    if (!onWeChatGroupsChange) return;
    
    onWeChatGroupsChange(
      weChatGroups.map(g =>
        g.id === groupId ? { ...g, isMuted: !g.isMuted } : g
      )
    );
    
    const group = getGroup(groupId);
    toast.success(group?.isMuted ? '已取消免打扰' : '已开启免打扰');
  };

  // 群聊操作：设置背景
  const handleSetGroupChatBackground = (groupId: string, backgroundUrl: string) => {
    if (!onWeChatGroupsChange) return;
    
    onWeChatGroupsChange(
      weChatGroups.map(g =>
        g.id === groupId ? { ...g, chatBackground: backgroundUrl } : g
      )
    );
    
    toast.success('聊天背景已设置');
    setShowChatBackground(false);
    setChatBackgroundInput('');
  };

  // 群聊操作：清空聊天记录
  const handleClearGroupChatHistory = (groupId: string) => {
    if (!onWeChatGroupsChange) return;
    
    onWeChatGroupsChange(
      weChatGroups.map(g =>
        g.id === groupId ? { ...g, chatMessages: [] } : g
      )
    );
    
    toast.success('聊天记录已��空');
    setShowChatMenu(false);
  };

  // 获取群聊信息
  const getGroup = (groupId: string): WeChatGroup | undefined => {
    return weChatGroups.find(g => g.id === groupId);
  };

  // ==================== 聊天总结相关函数 ====================
  
  // 生成聊天总结
  const generateSummary = async (chatId: string, isGroup: boolean = false) => {
    setIsSummarizing(true);
    
    try {
      const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
      if (!selectedConfig || !selectedConfig.apiKey || !selectedConfig.selectedModel || selectedConfig.selectedModel === 'undefined') {
        toast.error('请先配置AI');
        console.error('❌ AI配置不完整:', { selectedConfig, selectedModel: selectedConfig?.selectedModel });
        setIsSummarizing(false);
        return;
      }

      let messages: ChatMessage[];
      let summaries: ChatSummary[];
      let summaryConfig: SummaryConfig;
      let lastSummaryIndex: number;
      
      if (isGroup) {
        const group = weChatGroups.find(g => g.id === chatId);
        if (!group) return;
        messages = group.chatMessages;
        summaries = group.summaries || [];
        summaryConfig = group.summaryConfig || { enabled: true, autoSummary: false, messageThreshold: 50 };
        lastSummaryIndex = group.lastSummaryIndex || 0;
      } else {
        const friend = weChatFriends.find(f => f.contactId === chatId);
        if (!friend) return;
        messages = friend.chatMessages;
        summaries = friend.summaries || [];
        summaryConfig = friend.summaryConfig || { enabled: true, autoSummary: false, messageThreshold: 50 };
        lastSummaryIndex = friend.lastSummaryIndex || 0;
      }
      
      // 获取需要总结的消息（从上次总结位置到现在）
      const messagesToSummarize = messages.slice(lastSummaryIndex);
      
      if (messagesToSummarize.length === 0) {
        toast.info('没有新消息需要总结');
        setIsSummarizing(false);
        return;
      }
      
      // ���备总结的消息文本
      const contact = contacts.find(c => c.id === chatId);
      const contactName = contact?.remark || contact?.nickname || contact?.realName || '对方';
      const contactRealName = contact?.realName || contactName; // 获取角色本名
      
      const messageText = messagesToSummarize.map((msg, idx) => {
        const sender = msg.senderId === 'me' ? '我' : (
          isGroup ? (contacts.find(c => c.id === msg.senderId)?.nickname || msg.senderId) : contactName
        );
        return `${sender}: ${msg.content}`;
      }).join('\n');
      
      const systemPrompt = `你是一个���天记录总结助手。请对以下聊天记录进行总结，提取关键信息、重要事件和情感变化。

总结要求：
1. 直接开始总结，不要有任何开场白（如"好的"、"以下是总结"等）
2. 简洁��了，突出重���
3. 保留关键信息（时间、地点、人物、事件）
4. 记录重要的情感变化或���系发展
5. 使用第一人称视角，以"${contactRealName}"（角色本名）的角度来总结
6. 长度控制在100-300字之间
7. 直接输出总结内容，不要有多余的说明

聊天记录：
${messageText}`;


      console.log('🤖 调用API生成聊天总结...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || ''}`,
          },
          body: JSON.stringify({
            type: selectedConfig.type,
            baseUrl: selectedConfig.baseUrl || '',
            apiKey: selectedConfig.apiKey,
            model: selectedConfig.selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '请总结这段对话' }
            ]
          }),
        }
      );

      const data = await response.json();
      
      if (data.success && data.message) {
        const summaryContent = data.message.trim();
        
        const newSummary: ChatSummary = {
          id: `summary-${Date.now()}`,
          content: summaryContent,
          messageRange: [lastSummaryIndex, messages.length - 1],
          timestamp: Date.now(),
          messageCount: messagesToSummarize.length
        };
        
        // 更新好友或群聊的总结列表
        if (isGroup) {
          const updatedGroups = weChatGroups.map(g => {
            if (g.id === chatId) {
              return {
                ...g,
                summaries: [...(g.summaries || []), newSummary],
                lastSummaryIndex: messages.length
              };
            }
            return g;
          });
          if (onWeChatGroupsChange) {
            onWeChatGroupsChange(updatedGroups);
          }
        } else {
          const updatedFriends = weChatFriends.map(f => {
            if (f.contactId === chatId) {
              return {
                ...f,
                summaries: [...(f.summaries || []), newSummary],
                lastSummaryIndex: messages.length
              };
            }
            return f;
          });
          onWeChatFriendsChange(updatedFriends);
        }
        
        toast.success(`✅ 总结完成！已总结${messagesToSummarize.length}条消息`);
        console.log('✅ 聊天总结生成成功');
      } else {
        toast.error('总结生成失败');
      }
    } catch (error) {
      console.error('❌ 生成总结时出错:', error);
      toast.error('总结生成失败');
    } finally {
      setIsSummarizing(false);
    }
  };
  
  // 检查是否需要自动总结
  const checkAutoSummary = (chatId: string, isGroup: boolean = false) => {
    let messages: ChatMessage[];
    let summaryConfig: SummaryConfig | undefined;
    let lastSummaryIndex: number;
    
    if (isGroup) {
      const group = weChatGroups.find(g => g.id === chatId);
      if (!group) return;
      messages = group.chatMessages;
      summaryConfig = group.summaryConfig;
      lastSummaryIndex = group.lastSummaryIndex || 0;
    } else {
      const friend = weChatFriends.find(f => f.contactId === chatId);
      if (!friend) return;
      messages = friend.chatMessages;
      summaryConfig = friend.summaryConfig;
      lastSummaryIndex = friend.lastSummaryIndex || 0;
    }
    
    // 如果没有启用自动总结，直接返回
    if (!summaryConfig?.enabled || !summaryConfig?.autoSummary) {
      return;
    }
    
    // 计算未总结的��息数量
    const unsummarizedCount = messages.length - lastSummaryIndex;
    
    // 如果达到阈值，自动生成总结
    if (unsummarizedCount >= summaryConfig.messageThreshold) {
      console.log(`📊 达到��动总结阈值(${summaryConfig.messageThreshold}条)，开始自动总结...`);
      generateSummary(chatId, isGroup);
    }
  };
  
  // 更新总结配置
  const updateSummaryConfig = (chatId: string, config: SummaryConfig, isGroup: boolean = false) => {
    if (isGroup) {
      const updatedGroups = weChatGroups.map(g => {
        if (g.id === chatId) {
          return { ...g, summaryConfig: config };
        }
        return g;
      });
      if (onWeChatGroupsChange) {
        onWeChatGroupsChange(updatedGroups);
      }
    } else {
      const updatedFriends = weChatFriends.map(f => {
        if (f.contactId === chatId) {
          return { ...f, summaryConfig: config };
        }
        return f;
      });
      onWeChatFriendsChange(updatedFriends);
    }
    toast.success('总结配置已更新');
  };
  
  // 删除总结
  const deleteSummary = (chatId: string, summaryId: string, isGroup: boolean = false) => {
    if (isGroup) {
      const updatedGroups = weChatGroups.map(g => {
        if (g.id === chatId) {
          return {
            ...g,
            summaries: (g.summaries || []).filter(s => s.id !== summaryId)
          };
        }
        return g;
      });
      if (onWeChatGroupsChange) {
        onWeChatGroupsChange(updatedGroups);
      }
    } else {
      const updatedFriends = weChatFriends.map(f => {
        if (f.contactId === chatId) {
          return {
            ...f,
            summaries: (f.summaries || []).filter(s => s.id !== summaryId)
          };
        }
        return f;
      });
      onWeChatFriendsChange(updatedFriends);
    }
    toast.success('总结已删除');
  };
  
  // 更新总结内容
  const updateSummary = (chatId: string, summaryId: string, newContent: string, isGroup: boolean = false) => {
    if (isGroup) {
      const updatedGroups = weChatGroups.map(g => {
        if (g.id === chatId) {
          return {
            ...g,
            summaries: (g.summaries || []).map(s =>
              s.id === summaryId ? { ...s, content: newContent } : s
            )
          };
        }
        return g;
      });
      if (onWeChatGroupsChange) {
        onWeChatGroupsChange(updatedGroups);
      }
    } else {
      const updatedFriends = weChatFriends.map(f => {
        if (f.contactId === chatId) {
          return {
            ...f,
            summaries: (f.summaries || []).map(s =>
              s.id === summaryId ? { ...s, content: newContent } : s
            )
          };
        }
        return f;
      });
      onWeChatFriendsChange(updatedFriends);
    }
    toast.success('总结已更新');
    setEditingSummary(null);
  };

  // 发送消��（私聊）
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    // 检查是否被角色拉黑
    const contact = contacts.find(c => c.id === activeChatId);
    const isBlockedByContact = contact?.blockedByContact || false;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: messageInput.trim(),
      timestamp: Date.now(),
      type: 'text',
      failed: isBlockedByContact, // 被拉黑时消息显示红色感叹号
      blockedMessage: isBlockedByContact, // 被拉黑时消息不会被AI看到
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedFriend: WeChatFriend = {
      ...friend,
      chatMessages: [...friend.chatMessages, newMessage]
    };

    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setMessageInput('');
    setQuotedMessage(null); // 清除引用状态

    // 检查是否需要自动总结
    setTimeout(() => {
      checkAutoSummary(activeChatId, false);
    }, 100);

    // 检测用户是否请求视频通话
    const videoCallKeywords = ['打视频', '视频通话', '视频聊天', '打个视频', '视频吧', '来个视频'];
    const userWantsVideoCall = videoCallKeywords.some(keyword => messageInput.includes(keyword));
    
    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      // 延迟1-3秒后自动触发AI回复
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
        
        // 如果用户请求视频通话，AI回复后让AI决定是否接听
        if (userWantsVideoCall) {
          setTimeout(async () => {
            const contact = contacts.find(c => c.id === activeChatId);
            if (contact) {
              setIsCallingContact(true);
              toast.info('正在呼叫...');
              
              // AI决定是否接听
              const willAccept = await handleAiDecideVideoCall(activeChatId);
              setIsCallingContact(false);
              
              if (willAccept) {
                // AI接听视频通话
                setIncomingCallContact(contact);
                setShowIncomingVideoCall(true);
                toast.info(`${contact.nickname} 来电...`);
              } else {
                // AI拒接视频通话
                console.log('[视频通话] AI拒绝接听');
                toast.error(`${contact.nickname} 拒接了您的视频通话`);
                
                // 在聊天记录中添加"未接通"消息
                const friend = weChatFriends.find(f => f.contactId === activeChatId);
                if (friend) {
                  const missedCallMessage: ChatMessage = {
                    id: Date.now().toString(),
                    senderId: activeChatId,
                    content: '未接通',
                    timestamp: Date.now(),
                    type: 'video-call-missed'
                  };
                  
                  const updatedFriends = weChatFriends.map(f => {
                    if (f.contactId === activeChatId) {
                      return {
                        ...f,
                        chatMessages: [...f.chatMessages, missedCallMessage],
                        lastMessage: '未接通',
                        lastMessageTime: Date.now()
                      };
                    }
                    return f;
                  });
                  
                  onWeChatFriendsChange(updatedFriends);
                  
                  // AI拒接后，可能会发送一条解释消息
                  setTimeout(() => {
                    handleAiReply();
                  }, 1000);
                }
              }
            }
          }, delay + 2000); // AI回复后2秒触发视频通话决策
        }
      }, delay);
    }
  };

  // 发送群聊消息
  const handleSendGroupMessage = () => {
    if (!messageInput.trim() || !activeGroupId || !onWeChatGroupsChange) return;

    const group = getGroup(activeGroupId);
    if (!group) return;

    // 检���用户是否在群中
    if (!group.isUserInGroup) {
      toast.error('你不在这个群中，无法发送消息');
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: messageInput.trim(),
      timestamp: Date.now(),
      type: 'text',
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedGroup: WeChatGroup = {
      ...group,
      chatMessages: [...group.chatMessages, newMessage]
    };

    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );

    setMessageInput('');
    setQuotedMessage(null); // 清除引用状态

    // 检查是否需要自动总结
    setTimeout(() => {
      checkAutoSummary(activeGroupId, true);
    }, 100);

    // 检查是否需要自动回复（群聊）
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyGroupIds?.includes(activeGroupId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReplyInGroup();
      }, delay);
    }
  };

  // 计算语音时长（根据字数）
  const calculateVoiceDuration = (text: string): number => {
    const length = text.length;
    if (length <= 1) return 1;
    if (length <= 3) return 2;
    if (length <= 5) return 2;
    if (length <= 10) return 3;
    if (length <= 20) return 5;
    return Math.ceil(length / 4);
  };

  // 发送语音消息
  const handleSendVoiceMessage = () => {
    if (!voiceInputText.trim() || !activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const duration = calculateVoiceDuration(voiceInputText.trim());

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[语音]',
      timestamp: Date.now(),
      type: 'voice',
      voiceDuration: duration,
      voiceText: voiceInputText.trim(),
      showVoiceText: false
    };

    const updatedFriend: WeChatFriend = {
      ...friend,
      chatMessages: [...friend.chatMessages, newMessage]
    };

    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setVoiceInputText('');
    setShowVoiceDialog(false);
    toast.success(`已发送 ${duration}秒 语音消息`);

    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
      }, delay);
    }
  };

  // 切换语音消息的文字显示
  const toggleVoiceText = (messageId: string) => {
    if (!activeChatId) return;
    
    const friend = getFriend(activeChatId);
    if (!friend) return;

    const updatedMessages = friend.chatMessages.map(msg => 
      msg.id === messageId && msg.type === 'voice'
        ? { ...msg, showVoiceText: !msg.showVoiceText }
        : msg
    );

    const updatedFriend: WeChatFriend = {
      ...friend,
      chatMessages: updatedMessages
    };

    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );
  };

  // 处理功能菜单选择
  const handlePlusMenuAction = (action: string) => {
    console.log('[Plus菜单]选择功能:', action, { 
      activeChatId, 
      activeGroupId, 
      isGroup: !!activeGroupId,
      hasGroupsChange: !!onWeChatGroupsChange,
      groupsCount: weChatGroups.length
    });
    setShowPlusMenu(false);
    if (action === 'favorite') {
      console.log('[Plus菜单]打开收藏');
      setShowCollectedMessages(true);
    } else if (action === 'photo') {
      console.log('[Plus菜单]打开相册对话框');
      setShowImageDialog(true);
      setImageUrlInput('');
      setImagePreview('');
      console.log('[Plus菜单]相册对话框状态已设置为true');
    } else if (action === 'camera') {
      console.log('[Plus菜单]打开拍摄对话框');
      setShowCameraDialog(true);
      setCameraDescriptionInput('');
      console.log('[Plus菜单]拍摄对话框状态已设置为true');
    } else if (action === 'location') {
      console.log('[Plus���单]打开位置对话框');
      setShowLocationDialog(true);
      setLocationAddressInput('');
      console.log('[Plus菜单]位置对话框状态已设置为true');
    } else if (action === 'transfer') {
      // 群聊不支持转账，只支持红包
      if (activeGroupId) {
        toast.error('群聊不支持转账，请使用红包功能');
        return;
      }
      setShowTransferDialog(true);
    } else if (action === 'red-packet') {
      console.log('[红包]打开红包对话框', { activeGroupId: !!activeGroupId });
      setShowRedPacketDialog(true);
    } else if (action === 'gift') {
      console.log('[Plus菜单]打开礼物对话框');
      setShowGiftDialog(true);
    } else if (action === 'card') {
      console.log('[Plus菜单]打开名片对话框 - BEFORE setState', { 
        activeGroupId, 
        isGroup: !!activeGroupId,
        friendsCount: weChatFriends.length 
      });
      setShowCardDialog(true);
      console.log('[Plus菜单]已调用 setShowCardDialog(true)');
      setSelectedCardContactId(null);
    } else if (action === 'video-call') {
      // 群聊不支持视频通话
      if (activeGroupId) {
        toast.error('群聊暂不支持视频通话');
        return;
      }
      // 找到当前聊天的联系人
      const contact = contacts.find(c => c.id === activeChatId);
      if (contact) {
        console.log('[Plus菜单]发起视频通话:', contact.nickname);
        
        // 显示呼出等待界面
        setOutgoingCallContact(contact);
        setShowOutgoingVideoCall(true);
        
        // 清除之前的timeout（如果存在）
        if (outgoingCallTimeoutRef.current) {
          clearTimeout(outgoingCallTimeoutRef.current);
        }
        
        // 开始AI决策流程，并保存timeout引用
        outgoingCallTimeoutRef.current = setTimeout(async () => {
          // AI决定是否接听
          const willAccept = await handleAiDecideVideoCall(activeChatId);
          
          // 关闭呼出等待界面
          setShowOutgoingVideoCall(false);
          outgoingCallTimeoutRef.current = null;
          
          if (willAccept) {
            // AI接听视频通话 - 直接进入通话界面
            setVideoCallContact(contact);
            setShowVideoCall(true);
            toast.success(`${contact.nickname} 已接听`);
          } else {
            // AI拒接视频通话
            console.log('[视频通话] AI拒绝接听');
            toast.error(`${contact.nickname} 拒接了您的视频通话`);
            
            // 在聊天记录中添加"未接通"消息
            const friend = weChatFriends.find(f => f.contactId === activeChatId);
            if (friend) {
              const missedCallMessage: ChatMessage = {
                id: Date.now().toString(),
                senderId: activeChatId,
                content: '未接通',
                timestamp: Date.now(),
                type: 'video-call-missed'
              };
              
              const updatedFriends = weChatFriends.map(f => {
                if (f.contactId === activeChatId) {
                  return {
                    ...f,
                    chatMessages: [...f.chatMessages, missedCallMessage],
                    lastMessage: '未接通',
                    lastMessageTime: Date.now()
                  };
                }
                return f;
              });
              
              onWeChatFriendsChange(updatedFriends);
              
              // AI拒接后，可能会发送一条解释消息
              setTimeout(() => {
                handleAiReply();
              }, 1500);
            }
          }
        }, 2000); // 等待2秒后开始AI决策
      } else {
        toast.error('无法找到联系人');
      }
    } else if (action === 'voice-call') {
      // 群聊不支持语音通话
      if (activeGroupId) {
        toast.error('群聊暂不支持语音通话');
        return;
      }
      // 找到当前聊天的联系人
      const contact = contacts.find(c => c.id === activeChatId);
      if (contact) {
        console.log('[Plus菜单]发起语音通话:', contact.nickname);
        // 直接进入语音通话（假设对方接听）
        setVoiceCallContact(contact);
        setShowVoiceCall(true);
        toast.success(`正在与${contact.nickname}语音通话中...`);
      } else {
        toast.error('无法找到联系人');
      }
    } else {
      toast.info(`功能开发中：${action}`);
    }
  };

  // 处理图���URL输入
  const handleImageUrlChange = (url: string) => {
    setImageUrlInput(url);
    setImagePreview(url);
  };

  // 处理本地图片上传
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrlInput(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 发送图片消息（私聊）
  const handleSendImageMessage = () => {
    if (!imagePreview.trim() || !activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[图片]',
      timestamp: Date.now(),
      type: 'image',
      imageUrl: imagePreview,
      // ���加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedFriend: WeChatFriend = {
      ...friend,
      chatMessages: [...friend.chatMessages, newMessage]
    };

    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setImageUrlInput('');
    setImagePreview('');
    setShowImageDialog(false);
    setQuotedMessage(null);
    toast.success('图片已发送');

    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
      }, delay);
    }
  };

  // 发送图片消息（群聊）
  const handleSendImageMessageToGroup = () => {
    console.log('[群聊图片]开始发送', { 
      hasPreview: !!imagePreview.trim(), 
      activeGroupId, 
      hasGroupsChange: !!onWeChatGroupsChange 
    });
    
    if (!imagePreview.trim() || !activeGroupId || !onWeChatGroupsChange) return;

    const group = getGroup(activeGroupId);
    if (!group) {
      console.log('[群聊图片]群聊不存在');
      return;
    }

    if (!group.isUserInGroup) {
      toast.error('你不在这个群中，无法发送消息');
      return;
    }

    console.log('[群聊图片]准备发送消息到群聊', group.name);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[图片]',
      timestamp: Date.now(),
      type: 'image',
      imageUrl: imagePreview,
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedGroup: WeChatGroup = {
      ...group,
      chatMessages: [...group.chatMessages, newMessage]
    };

    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );

    setImageUrlInput('');
    setImagePreview('');
    setShowImageDialog(false);
    setQuotedMessage(null);
    toast.success('图片已发送');

    // 检查是否需要自动回复（群聊）
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyGroupIds?.includes(activeGroupId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReplyInGroup();
      }, delay);
    }
  };

  // 发送拍摄消息（私聊）
  const handleSendCameraMessage = () => {
    if (!cameraDescriptionInput.trim() || !activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[拍摄]',
      timestamp: Date.now(),
      type: 'camera',
      cameraDescription: cameraDescriptionInput.trim(),
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedFriend: WeChatFriend = {
      ...friend,
      chatMessages: [...friend.chatMessages, newMessage]
    };

    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setCameraDescriptionInput('');
    setShowCameraDialog(false);
    setQuotedMessage(null);
    toast.success('拍摄内容已发送');

    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
      }, delay);
    }
  };

  // 发送拍摄消息（群聊）
  const handleSendCameraMessageToGroup = () => {
    console.log('[群聊拍摄]开始发送', { 
      hasDescription: !!cameraDescriptionInput.trim(), 
      activeGroupId, 
      hasGroupsChange: !!onWeChatGroupsChange 
    });
    
    if (!cameraDescriptionInput.trim() || !activeGroupId || !onWeChatGroupsChange) return;

    const group = getGroup(activeGroupId);
    if (!group) {
      console.log('[群聊拍摄]群聊不存在');
      return;
    }

    if (!group.isUserInGroup) {
      toast.error('你不在这个群中，无法发送消息');
      return;
    }

    console.log('[群聊拍摄]准备发送消息到群聊', group.name);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[拍摄]',
      timestamp: Date.now(),
      type: 'camera',
      cameraDescription: cameraDescriptionInput.trim(),
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedGroup: WeChatGroup = {
      ...group,
      chatMessages: [...group.chatMessages, newMessage]
    };

    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );

    setCameraDescriptionInput('');
    setShowCameraDialog(false);
    setQuotedMessage(null);
    toast.success('拍摄内容已发送');

    // 检查是否需要自动回复（群聊）
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyGroupIds?.includes(activeGroupId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReplyInGroup();
      }, delay);
    }
  };

  // 发送位置消息（私聊）
  const handleSendLocationMessage = () => {
    if (!locationAddressInput.trim() || !activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[位置]',
      timestamp: Date.now(),
      type: 'location',
      locationAddress: locationAddressInput.trim(),
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedFriend = { 
      ...friend, 
      chatMessages: [...friend.chatMessages, newMessage] 
    };
    
    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setLocationAddressInput('');
    setShowLocationDialog(false);
    setQuotedMessage(null);
    toast.success('位置已发送');

    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
      }, delay);
    }
  };

  // 发送位置消息（群聊）
  const handleSendLocationMessageToGroup = () => {
    console.log('[群聊位置]开始发送', { 
      hasAddress: !!locationAddressInput.trim(), 
      activeGroupId, 
      hasGroupsChange: !!onWeChatGroupsChange 
    });
    
    if (!locationAddressInput.trim() || !activeGroupId || !onWeChatGroupsChange) return;

    const group = getGroup(activeGroupId);
    if (!group) {
      console.log('[群聊位置]群聊不存在');
      return;
    }

    if (!group.isUserInGroup) {
      toast.error('你不在这个群中，无法发送消息');
      return;
    }

    console.log('[群聊位置]准备发送消息到群聊', group.name);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[位置]',
      timestamp: Date.now(),
      type: 'location',
      locationAddress: locationAddressInput.trim(),
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedGroup = { 
      ...group, 
      chatMessages: [...group.chatMessages, newMessage] 
    };
    
    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );

    setLocationAddressInput('');
    setShowLocationDialog(false);
    setQuotedMessage(null);
    toast.success('位置已发送');

    // 检查是否需要自动回复（群聊）
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyGroupIds?.includes(activeGroupId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReplyInGroup();
      }, delay);
    }
  };

  // 发送名片消息（私聊）
  const handleSendCard = (contactId?: string) => {
    const cardContactId = contactId || selectedCardContactId;
    if (!cardContactId || !activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const cardContact = contacts.find(c => c.id === cardContactId);
    if (!cardContact) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[个人名片]',
      timestamp: Date.now(),
      type: 'card',
      cardContactId: cardContact.id,
      cardContactName: cardContact.nickname,
      cardContactAvatar: cardContact.avatar,
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedFriend = { 
      ...friend, 
      chatMessages: [...friend.chatMessages, newMessage] 
    };
    
    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setSelectedCardContactId(null);
    setShowCardDialog(false);
    setQuotedMessage(null);
    toast.success('名片已发送');

    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
      }, delay);
    }
  };

  // 发送名片消息（群聊）
  const handleSendCardToGroup = (contactId?: string) => {
    const cardContactId = contactId || selectedCardContactId;
    console.log('[名片] 开始发送群聊名片', { cardContactId, activeGroupId, hasGroupsChange: !!onWeChatGroupsChange });
    if (!cardContactId || !activeGroupId || !onWeChatGroupsChange) return;

    const group = getGroup(activeGroupId);
    if (!group) {
      console.log('[名片] 群聊不存在', { activeGroupId });
      return;
    }

    if (!group.isUserInGroup) {
      toast.error('你不在这个群中，无法发送消息');
      return;
    }

    const cardContact = contacts.find(c => c.id === cardContactId);
    if (!cardContact) {
      console.log('[名片] 联系人不存在', { cardContactId });
      return;
    }

    console.log('[名片] 准备发送名片到群聊', { 
      groupId: activeGroupId, 
      groupName: group.name,
      cardContactId: cardContact.id,
      cardContactName: cardContact.nickname
    });

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[个人名片]',
      timestamp: Date.now(),
      type: 'card',
      cardContactId: cardContact.id,
      cardContactName: cardContact.nickname,
      cardContactAvatar: cardContact.avatar,
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedGroup: WeChatGroup = {
      ...group,
      chatMessages: [...group.chatMessages, newMessage]
    };

    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );

    console.log('[名片] 名片已成功发送到群聊', { 
      messageId: newMessage.id, 
      groupId: activeGroupId,
      messagesCount: updatedGroup.chatMessages.length
    });

    setSelectedCardContactId(null);
    setShowCardDialog(false);
    setQuotedMessage(null);
    toast.success('名片已发送');

    // 检查是否需要自动回复（群聊）
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyGroupIds?.includes(activeGroupId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReplyInGroup();
      }, delay);
    }
  };

  // 发送语音消息（群聊）
  const handleSendVoiceMessageToGroup = () => {
    console.log('[群聊语音]开始发送', { 
      hasVoiceText: !!voiceInputText.trim(), 
      activeGroupId, 
      hasGroupsChange: !!onWeChatGroupsChange 
    });
    
    if (!voiceInputText.trim() || !activeGroupId || !onWeChatGroupsChange) return;

    const group = getGroup(activeGroupId);
    if (!group) {
      console.log('[群聊语音]群聊不存在');
      return;
    }

    if (!group.isUserInGroup) {
      toast.error('你不在这个群中，无法发送消息');
      return;
    }

    console.log('[群聊语音]准备发送消息到群聊', group.name);

    const duration = calculateVoiceDuration(voiceInputText.trim());

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: '[语音]',
      timestamp: Date.now(),
      type: 'voice',
      voiceDuration: duration,
      voiceText: voiceInputText.trim(),
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedGroup = { 
      ...group, 
      chatMessages: [...group.chatMessages, newMessage] 
    };
    
    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );

    setVoiceInputText('');
    setShowVoiceDialog(false);
    setQuotedMessage(null);
    toast.success('语音已发送');

    // 检查是否需要自动回复（群聊）
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyGroupIds?.includes(activeGroupId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReplyInGroup();
      }, delay);
    }
  };

  // 发送转账消息
  const handleSendTransfer = async (amount: number, note: string) => {
    if (!activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    try {
      // 调用后端API扣除���额
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ userId: userId, amount }) // 使用真实的userId而不是'me'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || '转账失败');
        return;
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        content: '￥' + amount.toFixed(2),
        timestamp: Date.now(),
        type: 'transfer',
        transferAmount: amount,
        transferNote: note,
        transferStatus: 'pending'
      };

      const updatedFriend = { 
        ...friend, 
        chatMessages: [...friend.chatMessages, newMessage] 
      };
      
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
      );

      toast.success('转账已发送');
    } catch (error) {
      console.error('转账失败:', error);
      toast.error('转账失败，请重试');
    }
  };

  // 领取转账
  const handleReceiveTransfer = async (messageId: string) => {
    if (!activeChatId) return;

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const messageIndex = friend.chatMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = friend.chatMessages[messageIndex];
    
    // 只有对方发的且状态为待领取的转账才能领取
    if (message.senderId === 'me' || message.transferStatus !== 'pending') {
      return;
    }

    try {
      // 调用后端API增加余额
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ userId: userId, amount: message.transferAmount }) // 使用真实的userId而不是'me'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || '领取转账失败');
        return;
      }

      const updatedMessages = [...friend.chatMessages];
      updatedMessages[messageIndex] = {
        ...message,
        transferStatus: 'received',
        transferReceivedAt: Date.now()
      };

      // 添加领取通知消息
      const notificationMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'system',
        senderName: '系统消息',
        text: `你领取了对方的转账 ¥${message.transferAmount?.toFixed(2)}`,
        timestamp: Date.now(),
        type: 'system'
      };
      
      updatedMessages.push(notificationMessage);

      const updatedFriend = { 
        ...friend, 
        chatMessages: updatedMessages,
        lastMessage: `你领取了转账`,
        lastMessageTime: Date.now()
      };
      
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
      );

      toast.success(`已领取 ¥${message.transferAmount?.toFixed(2)}`);
    } catch (error) {
      console.error('领取转账失败:', error);
      toast.error('领取转账失败，请重试');
    }
  };

  // 发送红包消息
  const handleSendRedPacket = async (amount: number, note: string, type: 'normal' | 'lucky', count: number) => {
    console.log('[红包]发送红包:', { amount, note, type, count, activeChatId, activeGroupId });
    // 支持单聊和群聊
    if (!activeChatId && !activeGroupId) {
      console.log('[红包]没有活动的聊天或群聊');
      return;
    }

    const totalAmount = type === 'normal' ? amount * count : amount;

    try {
      // 调用后端API扣除余额
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ userId: userId, amount: totalAmount }) // 使用真实的userId而不是'me'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || '红包发送失败');
        return;
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        content: note,
        timestamp: Date.now(),
        type: 'redpacket',
        redpacketAmount: totalAmount,
        redpacketNote: note,
        redpacketType: type,
        redpacketCount: count,
        redpacketReceivers: [],
        redpacketStatus: 'pending'
      };

      // 如果是群聊
      if (activeGroupId) {
        const group = weChatGroups.find(g => g.id === activeGroupId);
        if (!group) return;

        const updatedGroup = { 
          ...group, 
          chatMessages: [...group.chatMessages, newMessage],
          lastMessage: `[红包]${note}`,
          lastMessageTime: Date.now()
        };
        
        onWeChatGroupsChange(
          weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
        );
        
        // 🔥 群聊场景：红包发送后，立即触发AI领取
        console.log(`⏰ [红包发送] 将在1-3秒后触发群聊AI抢红包，groupId: ${activeGroupId}`);
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          console.log(`🚀 [红包发送] 开始执行triggerAiGrabRedPacket，groupId: ${activeGroupId}`);
          // 🔥 直接传入更新后的群组数据，避免使用旧状态
          triggerAiGrabRedPacketWithGroup(activeGroupId, updatedGroup);
        }, delay);
      } 
      // 如果是单聊
      else if (activeChatId) {
        const friend = getFriend(activeChatId);
        if (!friend) return;

        const updatedFriend = { 
          ...friend, 
          chatMessages: [...friend.chatMessages, newMessage],
          lastMessage: `[红包]${note}`,
          lastMessageTime: Date.now()
        };
        
        onWeChatFriendsChange(
          weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
        );
        
        // 🔥 单聊场景：红包发送后，立即触发AI领取
        console.log(`⏰ [红包���送] 将在1-3秒后触发单���AI领取红包，contactId: ${activeChatId}`);
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          console.log(`🚀 [红包发送] 开始执行triggerAiGrabRedPacketInChat，contactId: ${activeChatId}`);
          triggerAiGrabRedPacketInChat(activeChatId);
        }, delay);
      }

      toast.success('红包已发送');
      
      console.log(`🔍 [红包发送] 准备触发AI领取，activeGroupId: ${activeGroupId}, activeChatId: ${activeChatId}`);
    } catch (error) {
      console.error('红包发送失败:', error);
      toast.error('红包发送失败，请重试');
    }
  };

  // 发送礼物消息
  const handleSendGift = (giftId: string, giftName: string, giftIcon: string, message: string, price?: number) => {
    console.log('[礼物]发送礼物:', { giftId, giftName, giftIcon, message, price, activeChatId, activeGroupId });
    
    // 群聊发送礼物
    if (activeGroupId) {
      const group = weChatGroups.find(g => g.id === activeGroupId);
      if (!group) {
        console.log('[礼物]未找到群聊');
        return;
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        content: `[礼物]${giftName}`,
        timestamp: Date.now(),
        type: 'gift',
        giftId,
        giftName,
        giftIcon,
        giftMessage: message,
        giftPrice: price,
        // 添加引用信息
        ...(quotedMessage && {
          replyTo: quotedMessage.id,
          replyContent: quotedMessage.content,
          replySenderId: quotedMessage.senderId
        })
      };

      const updatedGroup = {
        ...group,
        chatMessages: [...group.chatMessages, newMessage]
      };

      onWeChatGroupsChange(
        weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
      );

      setQuotedMessage(null);
      toast.success('礼物已发送到群聊');
      return;
    }

    // 单聊发送礼物
    if (!activeChatId) {
      console.log('[礼物]没有活动的聊天');
      return;
    }

    const friend = getFriend(activeChatId);
    if (!friend) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: `[礼物]${giftName}`,
      timestamp: Date.now(),
      type: 'gift',
      giftId,
      giftName,
      giftIcon,
      giftMessage: message,
      giftPrice: price,
      // 添加引用信息
      ...(quotedMessage && {
        replyTo: quotedMessage.id,
        replyContent: quotedMessage.content,
        replySenderId: quotedMessage.senderId
      })
    };

    const updatedFriend = { 
      ...friend, 
      chatMessages: [...friend.chatMessages, newMessage],
      lastMessage: `[礼物]${giftName}`,
      lastMessageTime: Date.now()
    };
    
    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );

    setQuotedMessage(null);
    toast.success('礼物已发送');
    
    // 检查是否需要自动回复
    if (aiAutoMessageConfig.autoReplyEnabled && 
        aiAutoMessageConfig.autoReplyContactIds.includes(activeChatId)) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        handleAiReply();
      }, delay);
    }
  };

  // 🤖 AI在群聊中自动抢红包（接收群组数据作为参数，避免状态闭包问题）
  const triggerAiGrabRedPacketWithGroup = async (groupId: string, group: WeChatGroup) => {
    console.log(`🤖 [triggerAiGrabRedPacketWithGroup] 触发群聊 ${groupId} 的AI抢红包，使用传入的群组数据`);
    
    if (!group) {
      console.log(`❌ 未找到群聊 ${groupId}`);
      return;
    }
    
    console.log(`📋 [triggerAiGrabRedPacketWithGroup] 群��信息:`, {
      groupId: group.id,
      groupName: group.name,
      memberIds: group.memberIds,
      memberCount: group.memberIds?.length || 0,
      messageCount: group.chatMessages?.length || 0
    });

    // 🔥 检查是否有待领取的红包（包括AI发的红包）
    const pendingRedPackets = group.chatMessages.filter(
      msg => msg.type === 'redpacket' && 
             msg.redpacketStatus === 'pending' &&
             msg.redpacketCount && 
             msg.redpacketAmount
    );
    
    console.log(`🔍 [triggerAiGrabRedPacketWithGroup] 检查红包:`, {
      totalMessages: group.chatMessages.length,
      redpacketMessages: group.chatMessages.filter(m => m.type === 'redpacket').length,
      pendingRedPackets: pendingRedPackets.length,
      redpacketDetails: group.chatMessages.filter(m => m.type === 'redpacket').map(m => ({
        id: m.id,
        senderId: m.senderId,
        senderName: getContact(m.senderId)?.nickname || m.senderId,
        status: m.redpacketStatus,
        count: m.redpacketCount,
        amount: m.redpacketAmount
      }))
    });
    
    if (pendingRedPackets.length === 0) {
      console.log(`💤 群聊 ${groupId} 没有待领取的红包`);
      return;
    }

    console.log(`🎁 [群聊] 发现 ${pendingRedPackets.length} 个待领取的红包`);
    
    // 获取所有AI成员
    const aiMemberIds = group.memberIds.filter(id => {
      const c = getContact(id);
      // 🔧 修复：除了检查isAi，还检查是否有personality字段（AI角色的特征）
      return c && (c.isAi || c.personality);
    });
    
    console.log(`👥 [triggerAiGrabRedPacketWithGroup] 成员信息:`, {
      totalMembers: group.memberIds.length,
      aiMembers: aiMemberIds.length,
      aiMemberDetails: aiMemberIds.map(id => ({
        id,
        name: getContact(id)?.nickname,
        isAi: getContact(id)?.isAi
      }))
    });
    
    // 🔍 DEBUG: 打印所有成员的详细信息（每个成员单独一行）
    console.log(`🔍 [DEBUG] 开始检查 ${group.memberIds.length} 个群成员:`);
    group.memberIds.forEach((id, index) => {
      const contact = getContact(id);
      console.log(`  [成员${index + 1}/${group.memberIds.length}] ID: ${id}`);
      console.log(`    - 找到联系人: ${!!contact}`);
      console.log(`    - 昵称: ${contact?.nickname || '未知'}`);
      console.log(`    - isAi标记: ${contact?.isAi || false}`);
      console.log(`    - personality: ${contact?.personality ? '有' : '无'}`);
    });
    
    if (aiMemberIds.length === 0) {
      console.log(`❌ 群聊中没有AI成员`);
      return;
    }

    const updatedMessages = [...group.chatMessages];
    
    // 🔥 让每个AI都有机会抢红包
    pendingRedPackets.forEach(redpacket => {
      const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
      if (redpacketIndex === -1) return;
      
      const receivers = redpacket.redpacketReceivers || [];
      
      console.log(`🔍 [红包${redpacket.id.slice(-6)}] 当前领取情况:`, {
        redpacketId: redpacket.id,
        senderId: redpacket.senderId,
        senderName: getContact(redpacket.senderId)?.nickname || redpacket.senderId,
        totalCount: redpacket.redpacketCount,
        currentReceivers: receivers.length,
        receiverIds: receivers.map(r => r.userId)
      });
      
      // 🔥 让每个AI都有机会抢红包（70-90%的概率参与）
      const shuffledAiIds = [...aiMemberIds].sort(() => Math.random() - 0.5);
      const grabbersIds = shuffledAiIds.filter(id => {
        // 先检查是否已经领取过
        if (receivers.some(r => r.userId === id)) {
          return false;
        }
        // 每个AI有70-90%的概率抢红包
        const probability = 0.7 + Math.random() * 0.2;
        return Math.random() < probability;
      }).slice(0, (redpacket.redpacketCount || 1) - receivers.length); // 不超过剩余个数
      
      console.log(`📊 [红包${redpacket.id.slice(-6)}] AI抢红包情况:`, {
        aiMemberCount: aiMemberIds.length,
        remainingSlots: (redpacket.redpacketCount || 1) - receivers.length,
        participatingAIs: grabbersIds.length,
        aiNames: grabbersIds.map(id => getContact(id)?.nickname)
      });
      
      console.log(`🤖 [群聊红���${redpacket.id.slice(-6)}] ${grabbersIds.length} 个AI准备领取红包，具体ID:`, grabbersIds);
      
      grabbersIds.forEach((receiverId, index) => {
        setTimeout(async () => {
          const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
          const remainingAmount = (redpacket.redpacketAmount || 0) - receivers.reduce((sum, r) => sum + r.amount, 0);
          
          if (remainingCount <= 0 || remainingAmount <= 0) {
            console.log(`❌ 红包已被抢完`);
            return;
          }
          
          let receivedAmount = 0;
          if (redpacket.redpacketType === 'lucky') {
            if (remainingCount === 1) {
              receivedAmount = remainingAmount;
            } else {
              const maxAmount = remainingAmount / remainingCount * 2;
              receivedAmount = Math.random() * maxAmount * 0.99;
              receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
            }
          } else {
            receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
          }
          
          receivedAmount = Math.round(receivedAmount * 100) / 100;
          
          // 调用钱包API增加余额
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                body: JSON.stringify({ userId: receiverId, amount: receivedAmount })
              }
            );
            
            if (response.ok) {
              console.log(`✅ [群聊] ${getContact(receiverId)?.nickname} 钱包增加 ¥${receivedAmount.toFixed(2)}`);
            } else {
              const errorData = await response.json();
              console.error(`❌ 钱包API返回错误:`, errorData);
            }
          } catch (error) {
            console.error(`❌ 钱包API调用失败:`, error);
          }
          
          // 更新红包领取记录 - 使用state更新函数来避免闭包问题
          onWeChatGroupsChange(prevGroups => {
            return prevGroups.map(g => {
              if (g.id !== groupId) return g;
              
              const messages = [...g.chatMessages];
              const idx = messages.findIndex(m => m.id === redpacket.id);
              if (idx !== -1) {
                // 🔥 修复：从当前状态中获取最新的receivers，避免闭包陷阱
                const currentReceivers = messages[idx].redpacketReceivers || [];
                
                // 检查是否已经领取过
                if (currentReceivers.some(r => r.userId === receiverId)) {
                  console.log(`⚠️ ${receiverId} 已经领取过这个红包，跳过`);
                  return g;
                }
                
                // 添加新的领取记录
                const newReceivers = [
                  ...currentReceivers,
                  {
                    userId: receiverId,
                    amount: receivedAmount,
                    timestamp: Date.now()
                  }
                ];
                
                const isFinished = newReceivers.length >= (redpacket.redpacketCount || 1);
                
                messages[idx] = {
                  ...messages[idx],
                  redpacketReceivers: newReceivers,
                  redpacketStatus: isFinished ? 'finished' : 'pending'
                };
                
                console.log(`✅ [群聊] ${getContact(receiverId)?.nickname} 领取了红包 ¥${receivedAmount.toFixed(2)}，总领取人数: ${newReceivers.length}/${redpacket.redpacketCount}`);
              }
              
              return { ...g, chatMessages: messages };
            });
          });
          
          // 发送感谢消息
          setTimeout(() => {
            const thankYouTexts = [
              '谢谢老板！💰',
              `谢谢！抢到${receivedAmount.toFixed(2)}😄`,
              '发财了哈哈',
              `${receivedAmount.toFixed(2)}！谢谢~`,
              '手气不错！',
              '谢谢红包！',
              `💰${receivedAmount.toFixed(2)} 谢谢`,
              '哈哈谢谢',
              '🧧谢啦'
            ];
            const thankYouText = thankYouTexts[Math.floor(Math.random() * thankYouTexts.length)];
            
            const thankYouMessage: ChatMessage = {
              id: `redpacket-thanks-${Date.now()}-${receiverId}`,
              senderId: receiverId,
              content: thankYouText,
              timestamp: Date.now(),
              type: 'text'
            };
            
            onWeChatGroupsChange(prevGroups => {
              return prevGroups.map(g => 
                g.id === groupId 
                  ? { ...g, chatMessages: [...g.chatMessages, thankYouMessage] }
                  : g
              );
            });
          }, 300 + Math.random() * 700);
          
        }, index * 800 + Math.random() * 1000); // 错开领取时间
      });
    });
  };

  // 🤖 AI在群聊中自动抢红包
  const triggerAiGrabRedPacket = async (groupId: string) => {
    console.log(`🤖 [triggerAiGrabRedPacket] 触发群聊 ${groupId} 的AI抢红包`);
    
    const group = weChatGroups.find(g => g.id === groupId);
    if (!group) {
      console.log(`❌ 未找到群聊 ${groupId}`);
      return;
    }
    
    console.log(`📋 [triggerAiGrabRedPacket] 群聊信息:`, {
      groupId: group.id,
      groupName: group.name,
      memberIds: group.memberIds,
      memberCount: group.memberIds?.length || 0,
      messageCount: group.chatMessages?.length || 0
    });

    // 🔥 检查是否有待领取的红包（包括AI发的红包）
    const pendingRedPackets = group.chatMessages.filter(
      msg => msg.type === 'redpacket' && 
             msg.redpacketStatus === 'pending' &&
             msg.redpacketCount && 
             msg.redpacketAmount
    );
    
    console.log(`🔍 [triggerAiGrabRedPacket] 检查红包:`, {
      totalMessages: group.chatMessages.length,
      redpacketMessages: group.chatMessages.filter(m => m.type === 'redpacket').length,
      pendingRedPackets: pendingRedPackets.length,
      redpacketDetails: group.chatMessages.filter(m => m.type === 'redpacket').map(m => ({
        id: m.id,
        senderId: m.senderId,
        status: m.redpacketStatus,
        count: m.redpacketCount,
        amount: m.redpacketAmount
      }))
    });
    
    if (pendingRedPackets.length === 0) {
      console.log(`💤 群聊 ${groupId} 没有待领取的红包`);
      return;
    }

    console.log(`🎁 [群聊] 发现 ${pendingRedPackets.length} 个待领取的红包`);
    
    // 获取所有AI成员
    const aiMemberIds = group.memberIds.filter(id => {
      const c = getContact(id);
      // 🔧 修复：除了检查isAi，还检查是否有personality字段（AI角色的特征）
      return c && (c.isAi || c.personality);
    });
    
    console.log(`👥 [triggerAiGrabRedPacket] 成员信息:`, {
      totalMembers: group.memberIds.length,
      aiMembers: aiMemberIds.length,
      aiMemberDetails: aiMemberIds.map(id => ({
        id,
        name: getContact(id)?.nickname,
        isAi: getContact(id)?.isAi
      }))
    });
    
    // 🔍 DEBUG: 打印所有成员的详细信息（每个成员单独一行）
    console.log(`🔍 [DEBUG] 开始检查 ${group.memberIds.length} 个群成员:`);
    group.memberIds.forEach((id, index) => {
      const contact = getContact(id);
      console.log(`  [成员${index + 1}/${group.memberIds.length}] ID: ${id}`);
      console.log(`    - 找到联系人: ${!!contact}`);
      console.log(`    - 昵称: ${contact?.nickname || '未知'}`);
      console.log(`    - isAi标记: ${contact?.isAi || false}`);
      console.log(`    - personality: ${contact?.personality ? '有' : '无'}`);
    });
    
    if (aiMemberIds.length === 0) {
      console.log(`❌ 群聊中没有AI成员`);
      return;
    }

    const updatedMessages = [...group.chatMessages];
    
    // 每个红包被1-2个AI领取
    pendingRedPackets.forEach(redpacket => {
      const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
      if (redpacketIndex === -1) return;
      
      const receivers = redpacket.redpacketReceivers || [];
      
      console.log(`🔍 [红包${redpacket.id.slice(-6)}] 当前领取情况:`, {
        redpacketId: redpacket.id,
        totalCount: redpacket.redpacketCount,
        currentReceivers: receivers.length,
        receiverIds: receivers.map(r => r.userId)
      });
      
      // 🔥 让每个AI都有机会抢红包（70-90%的概率参与）
      const shuffledAiIds = [...aiMemberIds].sort(() => Math.random() - 0.5);
      const grabbersIds = shuffledAiIds.filter(id => {
        // 先检查是否已经领取过
        if (receivers.some(r => r.userId === id)) {
          return false;
        }
        // 每个AI有70-90%的概率抢红包
        const probability = 0.7 + Math.random() * 0.2;
        return Math.random() < probability;
      }).slice(0, (redpacket.redpacketCount || 1) - receivers.length); // 不超过剩余个数
      
      console.log(`📊 [红包${redpacket.id.slice(-6)}] AI抢红包情况:`, {
        aiMemberCount: aiMemberIds.length,
        remainingSlots: (redpacket.redpacketCount || 1) - receivers.length,
        participatingAIs: grabbersIds.length,
        aiNames: grabbersIds.map(id => getContact(id)?.nickname)
      });
      
      console.log(`🤖 [群聊红包${redpacket.id.slice(-6)}] ${grabbersIds.length} 个AI准备领取红包，具体ID:`, grabbersIds);
      
      grabbersIds.forEach((receiverId, index) => {
        setTimeout(async () => {
          const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
          const remainingAmount = (redpacket.redpacketAmount || 0) - receivers.reduce((sum, r) => sum + r.amount, 0);
          
          if (remainingCount <= 0 || remainingAmount <= 0) {
            console.log(`❌ 红包已被抢完`);
            return;
          }
          
          let receivedAmount = 0;
          if (redpacket.redpacketType === 'lucky') {
            if (remainingCount === 1) {
              receivedAmount = remainingAmount;
            } else {
              const maxAmount = remainingAmount / remainingCount * 2;
              receivedAmount = Math.random() * maxAmount * 0.99;
              receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
            }
          } else {
            receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
          }
          
          receivedAmount = Math.round(receivedAmount * 100) / 100;
          
          // 调��钱包API增加余额
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                body: JSON.stringify({ userId: receiverId, amount: receivedAmount })
              }
            );
            
            if (response.ok) {
              console.log(`✅ [群聊] ${getContact(receiverId)?.nickname} 钱包增加 ¥${receivedAmount.toFixed(2)}`);
            } else {
              const errorData = await response.json();
              console.error(`❌ 钱包API返回错误:`, errorData);
            }
          } catch (error) {
            console.error(`❌ 钱包API调用失败:`, error);
          }
          
          // 更新红包领取记录 - 使用state更新函数来避免闭包问题
          onWeChatGroupsChange(prevGroups => {
            return prevGroups.map(g => {
              if (g.id !== groupId) return g;
              
              const messages = [...g.chatMessages];
              const idx = messages.findIndex(m => m.id === redpacket.id);
              if (idx !== -1) {
                // 🔥 修复：从当前状态中获取最新的receivers，避免闭包陷阱
                const currentReceivers = messages[idx].redpacketReceivers || [];
                
                // 检查是否已经领取过
                if (currentReceivers.some(r => r.userId === receiverId)) {
                  console.log(`⚠️ ${receiverId} 已经领取过这个红包，跳过`);
                  return g;
                }
                
                // 添加新的领取记录
                const newReceivers = [
                  ...currentReceivers,
                  {
                    userId: receiverId,
                    amount: receivedAmount,
                    timestamp: Date.now()
                  }
                ];
                
                const isFinished = newReceivers.length >= (redpacket.redpacketCount || 1);
                
                messages[idx] = {
                  ...messages[idx],
                  redpacketReceivers: newReceivers,
                  redpacketStatus: isFinished ? 'finished' : 'pending'
                };
                
                console.log(`✅ [群聊] ${getContact(receiverId)?.nickname} 领取了红包 ¥${receivedAmount.toFixed(2)}，总领取人数: ${newReceivers.length}/${redpacket.redpacketCount}`);
              }
              
              return { ...g, chatMessages: messages };
            });
          });
          
          // 发送感谢消息
          setTimeout(() => {
            const thankYouTexts = [
              '谢谢老板！💰',
              `谢谢！抢到${receivedAmount.toFixed(2)}😄`,
              '发财了哈哈',
              `${receivedAmount.toFixed(2)}！谢谢~`,
              '手气不错！',
              '谢谢红包！',
              `💰${receivedAmount.toFixed(2)} 谢谢`,
              '哈哈谢谢',
              '🧧谢啦'
            ];
            const thankYouText = thankYouTexts[Math.floor(Math.random() * thankYouTexts.length)];
            
            const thankYouMessage: ChatMessage = {
              id: `redpacket-thanks-${Date.now()}-${receiverId}`,
              senderId: receiverId,
              content: thankYouText,
              timestamp: Date.now(),
              type: 'text'
            };
            
            onWeChatGroupsChange(prevGroups => {
              return prevGroups.map(g => 
                g.id === groupId 
                  ? { ...g, chatMessages: [...g.chatMessages, thankYouMessage] }
                  : g
              );
            });
          }, 300 + Math.random() * 700);
          
        }, index * 800 + Math.random() * 1000); // 错开领取时间
      });
    });
  };

  // 🤖 AI在单聊中自动领取红包
  const triggerAiGrabRedPacketInChat = async (contactId: string) => {
    console.log(`🤖 [triggerAiGrabRedPacketInChat] 触发单聊 ${contactId} 的AI领取红包`);
    
    const friend = weChatFriends.find(f => f.contactId === contactId);
    if (!friend) {
      console.log(`❌ 未找到好友 ${contactId}`);
      return;
    }
    
    console.log(`📋 [triggerAiGrabRedPacketInChat] 好友信息:`, {
      contactId: friend.contactId,
      contactName: getContact(contactId)?.nickname,
      messageCount: friend.chatMessages?.length || 0
    });

    // 🔥 检查是否有待领取的红包（包括AI发的红包）
    const pendingRedPackets = friend.chatMessages.filter(
      msg => msg.type === 'redpacket' && 
             msg.redpacketStatus === 'pending' &&
             msg.redpacketCount && 
             msg.redpacketAmount
    );
    
    console.log(`🔍 [triggerAiGrabRedPacketInChat] 检查红包:`, {
      totalMessages: friend.chatMessages.length,
      redpacketMessages: friend.chatMessages.filter(m => m.type === 'redpacket').length,
      pendingRedPackets: pendingRedPackets.length,
      redpacketDetails: friend.chatMessages.filter(m => m.type === 'redpacket').map(m => ({
        id: m.id,
        senderId: m.senderId,
        status: m.redpacketStatus,
        count: m.redpacketCount,
        amount: m.redpacketAmount
      }))
    });
    
    if (pendingRedPackets.length === 0) {
      console.log(`💤 单聊 ${contactId} 没有待领取的红包`);
      return;
    }

    console.log(`🎁 [单聊] 发现 ${pendingRedPackets.length} 个待领取的红包`);
    
    const updatedMessages = [...friend.chatMessages];
    
    pendingRedPackets.forEach(redpacket => {
      const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
      if (redpacketIndex === -1) return;
      
      const receivers = redpacket.redpacketReceivers || [];
      
      // AI已经领取过了
      if (receivers.some(r => r.userId === contactId)) {
        console.log(`💤 AI ${contactId} 已经领取过这个红包`);
        return;
      }
      
      const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
      
      if (remainingCount <= 0) {
        console.log(`❌ 红包已被抢完`);
        return;
      }
      
      setTimeout(async () => {
        const remainingAmount = (redpacket.redpacketAmount || 0) - receivers.reduce((sum, r) => sum + r.amount, 0);
        
        let receivedAmount = 0;
        if (redpacket.redpacketType === 'lucky') {
          if (remainingCount === 1) {
            receivedAmount = remainingAmount;
          } else {
            const maxAmount = remainingAmount / remainingCount * 2;
            receivedAmount = Math.random() * maxAmount * 0.99;
            receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
          }
        } else {
          receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
        }
        
        receivedAmount = Math.round(receivedAmount * 100) / 100;
        
        // 调用钱包API增加余额
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ userId: contactId, amount: receivedAmount })
            }
          );
          
          if (response.ok) {
            console.log(`✅ [单聊] ${getContact(contactId)?.nickname} 钱包增加 ¥${receivedAmount.toFixed(2)}`);
          } else {
            const errorData = await response.json();
            console.error(`❌ 钱包API返回错误:`, errorData);
          }
        } catch (error) {
          console.error(`❌ 钱包API调用失败:`, error);
        }
        
        // 更新红包领取记录
        receivers.push({
          userId: contactId,
          amount: receivedAmount,
          timestamp: Date.now()
        });
        
        const isFinished = receivers.length >= (redpacket.redpacketCount || 1);
        
        onWeChatFriendsChange(prevFriends => {
          return prevFriends.map(f => {
            if (f.contactId !== contactId) return f;
            
            const messages = [...f.chatMessages];
            const idx = messages.findIndex(m => m.id === redpacket.id);
            if (idx !== -1) {
              messages[idx] = {
                ...messages[idx],
                redpacketReceivers: receivers,
                redpacketStatus: isFinished ? 'finished' : 'pending'
              };
            }
            
            return { ...f, chatMessages: messages };
          });
        });
        
        console.log(`✅ [单聊] ${getContact(contactId)?.nickname} 领取了红包 ¥${receivedAmount.toFixed(2)}`);
        
        // 发送感谢消息
        setTimeout(() => {
          const thankYouTexts = [
            '谢谢！💰',
            `谢谢红包！${receivedAmount.toFixed(2)}😄`,
            '发财��哈哈',
            `收到${receivedAmount.toFixed(2)}，谢谢~`,
            '谢谢老板',
            '🧧谢啦',
            '哈哈谢谢'
          ];
          const thankYouText = thankYouTexts[Math.floor(Math.random() * thankYouTexts.length)];
          
          const thankYouMessage: ChatMessage = {
            id: `redpacket-thanks-${Date.now()}-${contactId}`,
            senderId: contactId,
            content: thankYouText,
            timestamp: Date.now(),
            type: 'text'
          };
          
          onWeChatFriendsChange(prevFriends => {
            return prevFriends.map(f => 
              f.contactId === contactId 
                ? { ...f, chatMessages: [...f.chatMessages, thankYouMessage] }
                : f
            );
          });
        }, 300 + Math.random() * 700);
        
      }, 500 + Math.random() * 1000);
    });
  };

  // 领取红包
  const handleReceiveRedPacket = async (messageId: string) => {
    console.log('🧧 [领取红包] 开始领取红包:', messageId);
    // 支持单聊和群聊
    if (!activeChatId && !activeGroupId) return;

    let chatMessages: ChatMessage[] = [];
    let messageIndex = -1;
    
    if (activeGroupId) {
      const group = weChatGroups.find(g => g.id === activeGroupId);
      if (!group) return;
      chatMessages = group.chatMessages;
      messageIndex = chatMessages.findIndex(m => m.id === messageId);
    } else if (activeChatId) {
      const friend = getFriend(activeChatId);
      if (!friend) return;
      chatMessages = friend.chatMessages;
      messageIndex = chatMessages.findIndex(m => m.id === messageId);
    }
    
    if (messageIndex === -1) return;

    const message = chatMessages[messageIndex];
    
    console.log('🧧 [领取红包] ��到红包消息:', {
      messageId,
      redpacketStatus: message.redpacketStatus,
      redpacketReceivers: message.redpacketReceivers,
      redpacketCount: message.redpacketCount,
      redpacketAmount: message.redpacketAmount
    });
    
    // 检查红包状态
    if (message.redpacketStatus !== 'pending') {
      toast.error('红包已过期或已抢完');
      return;
    }

    // 检查是否已领取
    const hasReceived = message.redpacketReceivers?.some(r => r.userId === 'me');
    if (hasReceived) {
      toast.error('你已经领取过这个红包了');
      return;
    }

    // 计算红包金额
    let receivedAmount = 0;
    const receivers = message.redpacketReceivers || [];
    const remainingCount = (message.redpacketCount || 1) - receivers.length;
    
    if (remainingCount <= 0) {
      toast.error('红包已被抢完');
      return;
    }

    if (message.redpacketType === 'lucky') {
      // 拼���气红包 - 随机金额
      const totalReceived = receivers.reduce((sum, r) => sum + r.amount, 0);
      const remainingAmount = (message.redpacketAmount || 0) - totalReceived;
      
      if (remainingCount === 1) {
        // 最后一个红包，拿走剩余全部金额
        receivedAmount = remainingAmount;
      } else {
        // 使用二倍均值法
        const avgAmount = remainingAmount / remainingCount;
        const maxAmount = avgAmount * 2;
        receivedAmount = Math.random() * maxAmount;
        receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
      }
    } else {
      // 普通红包 - 固定金额
      receivedAmount = (message.redpacketAmount || 0) / (message.redpacketCount || 1);
    }

    receivedAmount = Math.round(receivedAmount * 100) / 100; // 保留两位小数

    try {
      // 调用后端API增加余额
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ userId: userId, amount: receivedAmount }) // 使用真实的userId而不是'me'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || '领取红包失败');
        return;
      }

      // 更新红包消息
      const updatedMessages = [...chatMessages];
      const newReceivers = [
        ...(message.redpacketReceivers || []),
        {
          userId: 'me',
          amount: receivedAmount,
          timestamp: Date.now()
        }
      ];

      const isFinished = newReceivers.length >= (message.redpacketCount || 1);

      updatedMessages[messageIndex] = {
        ...message,
        redpacketReceivers: newReceivers,
        redpacketStatus: isFinished ? 'finished' : 'pending'
      };

      // 更新群聊或单聊
      if (activeGroupId) {
        const group = weChatGroups.find(g => g.id === activeGroupId);
        if (group) {
          const updatedGroup = { 
            ...group, 
            chatMessages: updatedMessages
          };
          
          onWeChatGroupsChange(
            weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
          );
        }
      } else if (activeChatId) {
        const friend = getFriend(activeChatId);
        if (friend) {
          const updatedFriend = { 
            ...friend, 
            chatMessages: updatedMessages
          };
          
          onWeChatFriendsChange(
            weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
          );
        }
      }

      toast.success(`已领取 ¥${receivedAmount.toFixed(2)}`);
      
      console.log('🧧 [领取红包] 领取成功，更新后的消息:', {
        redpacketReceivers: updatedMessages[messageIndex].redpacketReceivers,
        redpacketStatus: updatedMessages[messageIndex].redpacketStatus
      });
      
      // 打开红包详情
      setSelectedRedPacket(updatedMessages[messageIndex]);
      setShowRedPacketDetail(true);
    } catch (error) {
      console.error('🧧 [领取红包] 领取失败:', error);
      toast.error('领取红包失败，请重试');
    }
  };

  // 处理群聊头像文���上传
  const handleGroupAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setGroupAvatar(result);
      toast.success('头像已上传');
    };
    reader.readAsDataURL(file);
  };

  // 处理群聊头像URL上传
  const handleGroupAvatarUrlUpload = () => {
    if (!groupAvatarUrl.trim()) {
      toast.error('请输入有效的URL');
      return;
    }
    setGroupAvatar(groupAvatarUrl.trim());
    setGroupAvatarUrl('');
    toast.success('头像已设置');
  };

  // 创建群聊
  const handleCreateGroup = () => {
    if (!onWeChatGroupsChange) {
      toast.error('群聊功能未启用');
      return;
    }

    if (selectedGroupMembers.length === 0) {
      toast.error('请至少选择一��群成员');
      return;
    }

    // 如果还在选择成员步骤，进入下一步设置群信息
    if (createGroupStep === 'selectMembers') {
      setCreateGroupStep('setInfo');
      return;
    }

    // 生成群聊名称（如果用户没有输入）
    let finalGroupName = groupName.trim();
    if (!finalGroupName) {
      const memberNames = selectedGroupMembers
        .map(contactId => {
          const contact = contacts.find(c => c.id === contactId);
          return contact?.nickname || contact?.realName || '未知';
        })
        .slice(0, 3); // 最多取前3个成员的名字
      
      if (memberNames.length < selectedGroupMembers.length) {
        finalGroupName = `${memberNames.join('、')}等${selectedGroupMembers.length}人`;
      } else {
        finalGroupName = memberNames.join('、');
      }
    }

    // 创建新群聊
    const newGroup: WeChatGroup = {
      id: `group-${Date.now()}`,
      name: finalGroupName,
      avatar: groupAvatar || undefined,
      memberIds: selectedGroupMembers,
      isUserInGroup: selectedGroupType === 'inGroup',
      chatMessages: [],
      isPinned: false,
      unreadCount: 0,
      markedUnread: false
    };

    onWeChatGroupsChange([...weChatGroups, newGroup]);
    
    // 重置状态
    setShowCreateGroupDialog(false);
    setCreateGroupStep('selectType');
    setSelectedGroupType(null);
    setSelectedGroupMembers([]);
    setGroupName('');
    setGroupAvatar('');
    setGroupAvatarUrl('');
    
    toast.success(`群聊"${finalGroupName}"创建成功`);
  };

  // === 分组管理功能 ===
  
  // 创建新分组
  const handleCreateContactGroup = () => {
    if (!groupNameInput.trim()) {
      toast.error('请输入分组名称');
      return;
    }

    if (!onContactGroupsChange) {
      toast.error('分组功能未启用');
      return;
    }

    const newGroup: ContactGroup = {
      id: `group-${Date.now()}`,
      name: groupNameInput.trim(),
      order: contactGroups.length
    };

    onContactGroupsChange([...contactGroups, newGroup]);
    setGroupNameInput('');
    toast.success(`分组"${newGroup.name}"已创建`);
  };

  // 编辑分组名称
  const handleUpdateGroupName = (groupId: string) => {
    if (!groupNameInput.trim()) {
      toast.error('请输入分组名称');
      return;
    }

    if (!onContactGroupsChange) return;

    const updatedGroups = contactGroups.map(g =>
      g.id === groupId ? { ...g, name: groupNameInput.trim() } : g
    );

    onContactGroupsChange(updatedGroups);
    setEditingGroupId(null);
    setGroupNameInput('');
    toast.success('分组名称已更新');
  };

  // 删除分组
  const handleDeleteContactGroup = (groupId: string) => {
    if (!onContactGroupsChange) return;

    // 将该分组下的好友移到"未分组"
    const updatedFriends = weChatFriends.map(f =>
      f.groupId === groupId ? { ...f, groupId: undefined } : f
    );
    onWeChatFriendsChange(updatedFriends);

    // 删除分组
    const updatedGroups = contactGroups.filter(g => g.id !== groupId);
    onContactGroupsChange(updatedGroups);

    toast.success('分组已删除');
  };

  // 移动好友到分组
  const handleMoveToGroup = (friendId: string, groupId: string | undefined) => {
    const updatedFriends = weChatFriends.map(f =>
      f.contactId === friendId ? { ...f, groupId } : f
    );
    onWeChatFriendsChange(updatedFriends);
    setShowMoveToGroupDialog(false);
    setMovingFriendId(null);
    
    const groupName = groupId ? contactGroups.find(g => g.id === groupId)?.name || '未知分组' : '未分组';
    toast.success(`已移至"${groupName}"`);
  };

  // 切换分组折叠状态
  const toggleGroupCollapse = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  // 群聊AI主动发消息功能
  const sendGroupAutoMessage = async (groupId: string, aiId: string) => {
    console.log('=== ���聊AI主动发消息 ===');
    console.log('groupId:', groupId);
    console.log('aiId:', aiId);

    if (!onWeChatGroupsChange) {
      console.error('❌ 群聊功能未启用');
      return;
    }

    // 🔥 首先检查该群聊是否还在启用列表中（最新配置）
    // 这些检查在标记发送状态之前进行，如���不通过就直接返回，不抛出错误
    const latestConfig = aiAutoMessageConfigRef.current;
    if (!latestConfig.enabled || 
        !(latestConfig.enabledGroupIds || []).includes(groupId) ||
        latestConfig.enabledAiIds.length === 0) {
      console.log(`⛔ 群聊 ${groupId} 已不在启用列表中或功能已关闭，取消发送`);
      // 不抛出错误���直接返回，因为这是正常的配置变化
      return;
    }
    
    // 🔥 检查该AI是否还在启用���表中
    if (!latestConfig.enabledAiIds.includes(aiId)) {
      console.log(`⛔ AI ${aiId} 已不在启用列表中，��消发送`);
      // 不抛出错误，直接返回，因为这是正常的配置变化
      return;
    }

    // 🔒 检查该群聊是否已经在发送消息中
    const groupKey = `group-${groupId}`;
    if (sendingMessagesRef.current.has(groupKey)) {
      console.log(`⏸️ 群聊 ${groupId} 正在发送消息中，跳过本次发送任务`);
      // 这种情况下也直接返回，不需要抛出错误
      return;
    }
    
    // 🔒 标记该群聊正在发送消息
    sendingMessagesRef.current.add(groupKey);
    console.log(`🔒 群聊 ${groupId} 已标记为发送中，当前发送中的数量:`, sendingMessagesRef.current.size);

    const latestApiConfigs = apiConfigsRef.current;
    const selectedConfig = latestApiConfigs.find(c => c.id === selectedApiIdRef.current);
    
    if (!selectedConfig || !selectedConfig.selectedModel || selectedConfig.selectedModel === 'undefined' || !selectedConfig.apiKey) {
      console.error('❌ AI配置不完整');
      console.error('selectedApiId:', selectedApiIdRef.current);
      console.error('selectedModel:', selectedConfig?.selectedModel);
      console.error('可用的配置:', latestApiConfigs.map(c => ({ id: c.id, name: c.name, model: c.selectedModel })));
      return;
    }

    const group = getGroup(groupId);
    if (!group) {
      console.error('❌ 未找到群聊信息');
      return;
    }

    // 检查是否有待领取的红包，AI自动领取
    const pendingRedPackets = group.chatMessages.filter(
      msg => msg.senderId === 'me' && 
             msg.type === 'redpacket' && 
             msg.redpacketStatus === 'pending' &&
             msg.redpacketCount && 
             msg.redpacketAmount
    );
    
    if (pendingRedPackets.length > 0) {
      console.log(`🤖 [群聊] AI检测到 ${pendingRedPackets.length} 个待领取的红包，准备自动领取...`);
      
      // 领取所有待领取的红包
      const updatedMessages = [...group.chatMessages];
      
      // 随机选择一个群成员来领取红包
      const availableMemberIds = group.memberIds.filter(id => {
        const c = getContact(id);
        return c && c.isAi; // 只让AI���色领取
      });
      
      if (availableMemberIds.length > 0) {
        pendingRedPackets.forEach(redpacket => {
          const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
          if (redpacketIndex !== -1) {
            const receivers = redpacket.redpacketReceivers || [];
            
            // 随机选择1-3个AI角色来领取红包
            const receiveCount = Math.min(
              Math.floor(Math.random() * 3) + 1, // 1-3个
              (redpacket.redpacketCount || 1) - receivers.length, // 剩余数量
              availableMemberIds.length // 可用成员数
            );
            
            // 随���选择要领取的AI角色
            const shuffled = [...availableMemberIds].sort(() => Math.random() - 0.5);
            const receiverIds = shuffled.slice(0, receiveCount).filter(
              id => !receivers.some(r => r.userId === id)
            );
            
            receiverIds.forEach(receiverId => {
              const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
              
              if (remainingCount > 0) {
                // 计算AI领取的金额
                let receivedAmount = 0;
                if (redpacket.redpacketType === 'lucky') {
                  const totalReceived = receivers.reduce((sum, r) => sum + r.amount, 0);
                  const remainingAmount = (redpacket.redpacketAmount || 0) - totalReceived;
                  
                  if (remainingCount === 1) {
                    receivedAmount = remainingAmount;
                  } else {
                    const avgAmount = remainingAmount / remainingCount;
                    const maxAmount = avgAmount * 2;
                    receivedAmount = Math.random() * maxAmount;
                    receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
                  }
                } else {
                  receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
                }
                
                receivedAmount = Math.round(receivedAmount * 100) / 100;
                
                // 更新红包消息
                receivers.push({
                  userId: receiverId,
                  amount: receivedAmount,
                  timestamp: Date.now() + receivers.length * 100 // 稍微错开时间
                });
                
                const receiverContact = getContact(receiverId);
                console.log(`✅ [群聊] ${receiverContact?.nickname} 领取了红包 ¥${receivedAmount.toFixed(2)}`);
              }
            });
            
            const isFinished = receivers.length >= (redpacket.redpacketCount || 1);
            
            updatedMessages[redpacketIndex] = {
              ...updatedMessages[redpacketIndex],
              redpacketReceivers: receivers,
              redpacketStatus: isFinished ? 'finished' : 'pending'
            };
          }
        });
        
        // 更新群聊信息
        const updatedGroup = {
          ...group,
          chatMessages: updatedMessages
        };
        
        onWeChatGroupsChange(
          weChatGroups.map(g => g.id === groupId ? updatedGroup : g)
        );
      }
    }

    // 从群成员中随机选择一个AI角色发言
    if (group.memberIds.length === 0) {
      console.error('❌ 群聊没有成员');
      return;
    }

    const randomMemberId = group.memberIds[Math.floor(Math.random() * group.memberIds.length)];
    const contact = getContact(randomMemberId);
    
    if (!contact) {
      console.error('❌ 未找到群成员信息');
      return;
    }

    console.log('✅ 群聊AI主动发消息，发言者:', contact.nickname);

    try {
      // 生成朋友圈上下文（群聊版）
      const getMomentsContextForGroup = () => {
        // 注意：用户的朋友圈contactId可能是userId或'me'，都需要包含
        const knownContactIds = ['me', userId, ...(contact.knownFriends || [])];
        const recentMoments = moments
          .filter(m => knownContactIds.includes(m.contactId))
          .slice(0, 10);
        
        console.log(`📊 [群聊AI朋友圈浏览] ${contact.nickname} 可见的联系人IDs:`, knownContactIds);
        console.log(`📊 [群聊AI朋友圈浏览] 过滤后可见数量: ${recentMoments.length}`);
        
        if (recentMoments.length === 0) return '';
        
        const momentsList = recentMoments.map(m => {
          const poster = m.contactId === 'me' || m.contactId === userId ? userProfile.username : getContact(m.contactId)?.nickname || '某人';
          const timeAgo = Math.floor((Date.now() - m.createdAt) / 60000);
          const timeStr = timeAgo < 60 ? `${timeAgo}分钟前` : timeAgo < 1440 ? `${Math.floor(timeAgo/60)}小时前` : `${Math.floor(timeAgo/1440)}天前`;
          const hasLiked = m.likes.includes(contact.id);
          
          let momentStr = `---\nID: ${m.id}\n发布者: ${poster}\n时间: ${timeStr}\n内容: ${m.content}`;
          
          if (m.likes.length > 0) {
            const likerNames = m.likes.map(id => 
              id === contact.id ? '你' : (id === 'me' || id === userId ? userProfile.username : getContact(id)?.nickname || '某人')
            ).join('、');
            momentStr += `\n点赞(${m.likes.length}人): ${likerNames}`;
          }
          
          if (m.comments.length > 0) {
            const commentsStr = m.comments.map(c => {
              const commenter = c.userId === contact.id ? '你' : (c.userId === 'me' || c.userId === userId ? userProfile.username : getContact(c.userId)?.nickname || '某人');
              return `  ${commenter}: ${c.content}`;
            }).join('\n');
            momentStr += `\n评论(${m.comments.length}条):\n${commentsStr}`;
          }
          
          momentStr += `\n${hasLiked ? '（你已点赞）' : '（可以点赞）'}`;
          momentStr += `\n${m.comments.some(c => c.userId === contact.id) ? '（你已评论过）' : '（可以评论）'}`;
          
          return momentStr;
        }).join('\n\n');
        
        return `\n\n# 最近的朋友圈动态\n你可以看到以下认识的人的朋友圈（按时间倒序）：\n\n${momentsList}\n`;
      };
      
      // 构建系统提示
      const systemPrompt = `你正在群聊中扮演${contact.remark || contact.nickname}（真���姓名：${contact.realName}）。

����本信息：
- 昵称：${contact.nickname}
- 备注名：${contact.remark || '无'}
${contact.age ? `- 年龄：${contact.age}` : ''}
${contact.occupation ? `- 职业：${contact.occupation}` : ''}
- 当前拍一拍后缀：${contact.patMessage || '未设置'}

${contact.personality ? `性格特点：
${contact.personality}

` : ''}${contact.experience ? `人��经���：
${contact.experience}

` : ''}${contact.hobbies ? `兴趣爱好：
${contact.hobbies}

` : ''}${contact.otherInfo ? `其他信息：
${contact.otherInfo}

` : ''}${getDateAndScheduleContext(contact.id)}

${rules.length > 0 ? `# 角色行为准则
${rules.map(rule => `## ${rule.name}
${rule.description ? rule.description + '\n' : ''}${rule.content}`).join('\n\n')}

` : ''}${worldBooks.length > 0 ? `# 世界背景设定
${worldBooks.map(wb => `## ${wb.name}
${wb.description ? wb.description + '\n' : ''}${wb.content}`).join('\n\n')}

` : ''}
群聊成员（平时称呼用真实姓名，@某人时用昵称）：
${group.memberIds.map(id => {
  const member = getContact(id);
  return member ? `- ${member.realName || member.nickname}（昵称：${member.nickname}，@时用@${member.nickname}）` : '';
}).filter(Boolean).join('\n')}
- ${userProfile.username}（��户本人）

重要提示：
1. ���群聊互动】这是一个真实的群聊！你能看到其他成员���聊天记录，请仔细阅读并针对话题进行���应
2. 【自然回应】不要各说各话！如果别人在讨论某个话题，你应该参与这个话题，而不是突然说无关的事
3. 【可以@人】可以@其他群成员回应他们的话，格式：@昵称（只能@群聊成员列表中的人）
4. 【保持性格】保持你的角色性格，使用口语化表达、表情符号等，像真实的朋友聊天一样
5. 【不要暴露AI身份】不要暴露你是AI的事实，你就是这个角色本人
6. 根据性格和情绪决定发送消息的数量（1-5条），用"---SPLIT---"分隔
7. 你可以在合适的时候（比如开心、调皮、想引起注意时）拍一拍用户，输出格式：<PAT>${userProfile.username}</PAT>
8. 你可以根据自己的个性���心情更新拍一拍后缀，输出格式：<UPDATE_PAT>新的后缀内容</UPDATE_PAT>
9. 【重要】如果你发送某条消息后觉得不合适，可以在该消息中添加<RECALL_THIS>标记来撤回
10. 【红包功能】群聊里应该用红包而不是转账！你可以发红包活跃气氛、庆祝节日、发福利等
    - 输出格式：<REDPACKET>总金额|留言|类型|个数</REDPACKET>
    - 普通红包：<REDPACKET>100|新年快乐|normal|10</REDPACKET>（总金额100，平分成10份）
    - 拼手气红包：<REDPACKET>88|抢红包啦|lucky|8</REDPACKET>（总金额88，随机分成8份）
    - 群聊建议发多个红包让大家都能抢到，总金额100-500较合适
    - 在合适场景使用：节日庆祝、生日祝福、感谢、发福利、活跃气氛等
11. 【重要】如果要@某人，只能@上面列���的群聊成员，格式：@昵称`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...group.chatMessages.slice(-10).map(msg => {
          // 在群聊中，只有当前AI自己的消息是assistant，其他人的消息都是user
          const isMyMessage = msg.senderId === contact.id;
          const senderInfo = msg.senderId === 'me' ? userProfile.username : (getContact(msg.senderId)?.realName || getContact(msg.senderId)?.nickname || '成员');
          
          return {
            role: isMyMessage ? 'assistant' : 'user',
            content: isMyMessage ? msg.content : `${senderInfo}: ${msg.content}`
          };
        }),
        {
          role: 'user',
          content: '（你看到了上面的群聊消息。请仔细阅读最后几条消息，看看有没有人@你、问你问题、或在讨论某个话题。如果有，你必须先回应这个话题！不要各说各话！像真实朋友一样参与讨论）'
        }
      ];

      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
      const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;

      console.log('📊 [API调试] 消息数量:', messages.length, '（已优化为最后10条）');
      console.log('🌐 [API调试] API URL:', apiUrl);
      console.log('🔑 [API调试] Auth Token存在:', !!authToken);
      console.log('⚙️ [API调试] API配置:', {
        type: selectedConfig.type,
        hasBaseUrl: !!selectedConfig.baseUrl,
        hasApiKey: !!selectedConfig.apiKey,
        hasSelectedModel: !!selectedConfig.selectedModel
      });

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          baseUrl: selectedConfig.baseUrl || '',
          apiKey: selectedConfig.apiKey,
          model: selectedConfig.selectedModel,
          messages: messages
        }),
      }, 2, 240000); // 最多重试2次，超时240秒（4分钟），给AI充足时间生成回复

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const errorMsg = `API请求失败 (${response.status}): ${errorText || response.statusText}`;
        console.error('❌ 群聊API错误:', errorMsg);
        
        if (response.status === 500) {
          toast.error('服务器暂时无法响应，请稍后重试');
        } else if (response.status === 503) {
          toast.error('服务暂时不可用，请稍后重试');
        } else {
          toast.error(`群聊发消息失败 (${response.status})`);
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (!data.success || (!data.message && (!data.messages || data.messages.length === 0))) {
        throw new Error('AI没有返回消息内容');
      }

      // 处理AI消息 - 逐条发送
      const aiMessages = (data.messages && data.messages.length > 0) ? data.messages : [data.message];
      
      let messageIndex = 0;
      const sendNextMessage = () => {
        // 🔥 在发送每条消息前都检查配置是否����启用
        const currentConfig = aiAutoMessageConfigRef.current;
        if (!currentConfig.enabled || 
            !(currentConfig.enabledGroupIds || []).includes(groupId) ||
            currentConfig.enabledAiIds.length === 0) {
          console.log(`⛔ 群聊 ${groupId} 的主动发消息已被禁用，立即停止发送剩余消息`);
          // 🔓 清除发送中状态
          const groupKey = `group-${groupId}`;
          sendingMessagesRef.current.delete(groupKey);
          console.log(`🔓 群聊 ${groupId} 已停止发送，移除发送中标记`);
          return;
        }
        
        if (messageIndex >= aiMessages.length) {
          console.log('✅ 群聊AI���动发消息完成');
          // 🔓 清除发送中状态
          const groupKey = `group-${groupId}`;
          sendingMessagesRef.current.delete(groupKey);
          console.log(`🔓 群聊 ${groupId} 已完成发送，移除发送中标记，当前发送中的数量:`, sendingMessagesRef.current.size);
          return;
        }
        
        let messageContent = aiMessages[messageIndex].trim();
        
        // 🔍 调试：打印AI返回的原始消息
        console.log(`🔍 [群聊AI消息 ${messageIndex + 1}/${aiMessages.length}] 原始内容:`, messageContent);
        
        // 解析朋友圈互动指令（群聊中的AI也��以互动朋友圈）
        // 1. 点赞朋友圈
        const likeMomentMatch = messageContent.match(/<LIKE_MOMENT>([^<]+)<\/LIKE_MOMENT>/);
        if (likeMomentMatch && onMomentsChange) {
          const momentId = likeMomentMatch[1].trim();
          const targetMoment = moments.find(m => m.id === momentId);
          
          if (targetMoment && !targetMoment.likes.includes(randomMemberId)) {
            const updatedMoments = moments.map(m => {
              if (m.id === momentId) {
                return { ...m, likes: [...m.likes, randomMemberId] };
              }
              return m;
            });
            onMomentsChange(updatedMoments);
            
            const poster = targetMoment.contactId === 'me' ? userProfile.username : getContact(targetMoment.contactId)?.nickname || '某人';
            console.log(`👍 [群聊AI互动朋友圈] ${contact.nickname} 点赞了 ${poster} ��朋友圈`);
          }
          
          const groupKey = `group-${groupId}`;
          sendingMessagesRef.current.delete(groupKey);
          console.log(`🔓 群聊 ${groupId} 已完成互动朋友圈，移除发送中标记`);
          return;
        }
        
        // 2. 评论朋友圈
        const commentMomentMatch = messageContent.match(/<COMMENT_MOMENT>([^<]+)<\/COMMENT_MOMENT>/);
        if (commentMomentMatch && onMomentsChange) {
          const parts = commentMomentMatch[1].split('|');
          if (parts.length === 2) {
            const momentId = parts[0].trim();
            const commentContent = parts[1].trim();
            const targetMoment = moments.find(m => m.id === momentId);
            
            if (targetMoment && commentContent) {
              const newComment: MomentComment = {
                id: `ai-comment-${Date.now()}-${Math.random()}`,
                userId: randomMemberId,
                content: commentContent,
                createdAt: Date.now()
              };
              
              const updatedMoments = moments.map(m => {
                if (m.id === momentId) {
                  return { ...m, comments: [...m.comments, newComment] };
                }
                return m;
              });
              onMomentsChange(updatedMoments);
              
              const poster = targetMoment.contactId === 'me' ? userProfile.username : getContact(targetMoment.contactId)?.nickname || '某人';
              console.log(`💬 [群聊AI互动朋友圈] ${contact.nickname} 评论了 ${poster} 的朋友圈: ${commentContent.substring(0, 20)}...`);
            }
          }
          
          const groupKey = `group-${groupId}`;
          sendingMessagesRef.current.delete(groupKey);
          console.log(`🔓 群聊 ${groupId} 已完成互动朋友圈，移除发送中标记`);
          return;
        }
        
        // 3. 发布朋友圈
        const postMomentMatch = messageContent.match(/<POST_MOMENT>(.*?)<\/POST_MOMENT>/s);
        if (postMomentMatch && onMomentsChange) {
          const momentContent = postMomentMatch[1].trim();
          
          const newMoment: MomentPost = {
            id: `ai-moment-${Date.now()}-${Math.random()}`,
            contactId: randomMemberId,
            content: momentContent,
            likes: [],
            comments: [],
            createdAt: Date.now()
          };
          
          onMomentsChange([newMoment, ...moments]);
          console.log(`📱 [群聊AI发朋友圈] ${contact.nickname} 发布了朋友圈: ${momentContent.substring(0, 30)}...`);
          
          const groupKey = `group-${groupId}`;
          sendingMessagesRef.current.delete(groupKey);
          console.log(`🔓 群聊 ${groupId} 已完成发送朋友圈，移除发送中标记`);
          return;
        }
        
        // 解析拍一拍
        const patMatch = messageContent.match(/<PAT>(.*?)<\/PAT>/);
        if (patMatch) {
          aiPatUser(randomMemberId, true);
          messageContent = messageContent.replace(/<PAT>.*?<\/PAT>/, '').trim();
        }
        
        // 解析更���拍一拍后缀
        const updatePatMatch = messageContent.match(/<UPDATE_PAT>(.*?)<\/UPDATE_PAT>/);
        if (updatePatMatch) {
          const newPatMessage = updatePatMatch[1].trim();
          updateContactPatMessage(randomMemberId, newPatMessage);
          messageContent = messageContent.replace(/<UPDATE_PAT>.*?<\/UPDATE_PAT>/, '').trim();
        }
        
        // 解析红包指令
        const redpacketMatch = messageContent.match(/<REDPACKET>([^<]+)<\/REDPACKET>/);
        let groupRedpacketMessage: ChatMessage | null = null;
        if (redpacketMatch) {
          const parts = redpacketMatch[1].split('|');
          if (parts.length === 4) {
            const totalAmount = parseFloat(parts[0]);
            const note = parts[1];
            const type = parts[2] as 'normal' | 'lucky';
            const count = parseInt(parts[3]);
            
            // 移除红包标签
            messageContent = messageContent.replace(/<REDPACKET>[^<]+<\/REDPACKET>/g, '').trim();
            
            // 创建红包消息
            groupRedpacketMessage = {
              id: `group-redpacket-${Date.now()}-${Math.random()}`,
              senderId: randomMemberId,
              content: note,
              timestamp: Date.now(),
              type: 'redpacket',
              redpacketAmount: totalAmount,
              redpacketNote: note,
              redpacketType: type,
              redpacketCount: count,
              redpacketReceivers: [],
              redpacketStatus: 'pending'
            };
            
            const memberContact = getContact(randomMemberId);
            console.log(`🧧 [群聊] ${memberContact?.nickname} 发红包: ${note}，总金额¥${totalAmount}，类型${type}，共${count}个`);
            console.log('🔍 [红包调试] groupRedpacketMessage���象:', groupRedpacketMessage);
          } else {
            console.error('❌ [红包调试] parts长度不为4！实际:', redpacketMatch[1].split('|').length);
          }
        } else if (messageContent.includes('REDPACKET')) {
          console.error('❌ [红包调试] 包含REDPACKET但匹配失败！');
        }
        
        // 如果有红包，添加到群聊
        if (groupRedpacketMessage) {
          onWeChatGroupsChange(prevGroups => {
            const currentGroup = prevGroups.find(g => g.id === groupId);
            if (!currentGroup) return prevGroups;
            
            const updatedMessages = [...currentGroup.chatMessages, groupRedpacketMessage!];
            
            const shouldIncreaseUnread = activeGroupId !== groupId;
            const updatedGroup: WeChatGroup = {
              ...currentGroup,
              chatMessages: updatedMessages,
              lastMessage: `[红包]${groupRedpacketMessage!.redpacketNote}`,
              lastMessageTime: Date.now(),
              unreadCount: shouldIncreaseUnread ? (currentGroup.unreadCount || 0) + 1 : 0
            };
            
            // 🔥 群聊场景：红包发送后，立即触发其他群成员抢红包
            setTimeout(() => {
              console.log(`🚀 [AI发红包] 触发群成员抢红包，groupId: ${groupId}`);
              // 直接使用刚更新的群组数据，避免状态闭包问题
              triggerAiGrabRedPacketWithGroup(groupId, updatedGroup);
            }, 1000 + Math.random() * 2000);
            
            return prevGroups.map(g => g.id === groupId ? updatedGroup : g);
          });
          
          // 如果没有其他文本内容，跳过后续处理
          if (!messageContent) {
            messageIndex++;
            setTimeout(() => sendNextMessage(), 500 + Math.random() * 500);
            return;
          }
        }
        
        // 如果处理完特殊标记后内���为空，跳过这条消息
        if (!messageContent) {
          messageIndex++;
          sendNextMessage();
          return;
        }
        
        const newMessage: ChatMessage = {
          id: `group-ai-auto-${Date.now()}-${messageIndex}`,
          senderId: randomMemberId, // 使用群成员的ID作为发送者
          content: messageContent,
          timestamp: Date.now()
        };
        
        onWeChatGroupsChange(prevGroups => {
          const currentGroup = prevGroups.find(g => g.id === groupId);
          if (!currentGroup) return prevGroups;
          
          const updatedMessages = [...currentGroup.chatMessages, newMessage];
          
          const shouldIncreaseUnread = activeGroupId !== groupId;
          const updatedGroup: WeChatGroup = {
            ...currentGroup,
            chatMessages: updatedMessages,
            unreadCount: shouldIncreaseUnread ? (currentGroup.unreadCount || 0) + 1 : 0
          };
          
          return prevGroups.map(g => g.id === groupId ? updatedGroup : g);
        });
        
        // 如果是第一条消息，触发通知
        if (messageIndex === 0 && onNotification) {
          onNotification({
            contactId: randomMemberId,
            content: newMessage.content
          });
        }
        
        messageIndex++;
        
        // 如果还有更多消息，继续发送
        if (messageIndex < aiMessages.length) {
          const delay = 1000 + Math.random() * 2000;
          setTimeout(sendNextMessage, delay);
        } else {
          // 所有消息发送完毕，触发其他AI回应（30%概率）
          if (Math.random() < 0.3) {
            const responseDelay = 2000 + Math.random() * 3000; // 2-5秒后
            setTimeout(() => {
              triggerOtherAiResponse(groupId, randomMemberId);
            }, responseDelay);
          }
        }
      };
      
      sendNextMessage();
    } catch (error) {
      console.error('❌ 群聊AI主动发消息错误:', error);
      
      // 🔓 发生错误时��要清除���送中状态
      const groupKey = `group-${groupId}`;
      sendingMessagesRef.current.delete(groupKey);
      console.log(`🔓 群聊 ${groupId} 发送失败，移除发送中标记，当前发送中的数量:`, sendingMessagesRef.current.size);
      
      throw error;
    }
  };

  // 触发其他AI在群聊中回应
  const triggerOtherAiResponse = async (groupId: string, excludeAiId: string) => {
    console.log('=== 触发其他AI回应 ===');
    console.log('groupId:', groupId);
    console.log('excludeAiId:', excludeAiId);

    if (!onWeChatGroupsChange) {
      console.error('❌ 群聊功能未启用');
      return;
    }

    const group = weChatGroups.find(g => g.id === groupId);
    if (!group) {
      console.error('❌ 未找到群聊');
      return;
    }

    // 获取群里其他的AI成员（排除刚发消息的AI和用户）
    const otherAiMembers = group.memberIds.filter(id => id !== excludeAiId && id !== 'me');
    
    if (otherAiMembers.length === 0) {
      console.log('⚠️ 没有其他AI成员可以回应');
      return;
    }

    // 随机选择一个AI回应
    const responderAiId = otherAiMembers[Math.floor(Math.random() * otherAiMembers.length)];
    const responderContact = getContact(responderAiId);
    
    if (!responderContact) {
      console.error('❌ 未找到回应者信息');
      return;
    }

    console.log('✅ 选择的回应者:', responderContact.nickname);

    // 检查AI配置
    if (!selectedApiId || apiConfigs.length === 0) {
      console.error('❌ 未配置AI');
      return;
    }

    const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
    if (!selectedConfig || !selectedConfig.selectedModel || selectedConfig.selectedModel === 'undefined' || !selectedConfig.apiKey) {
      console.error('❌ AI配置不完整');
      console.error('selectedModel:', selectedConfig?.selectedModel);
      return;
    }

    try {
      // 构建群成员列表
      const groupMembers = group.memberIds
        .map(id => getContact(id))
        .filter(c => c !== null)
        .map(c => `- ${c!.realName || c!.nickname}（昵称：${c!.nickname}，@时用@${c!.nickname}）`)
        .join('\n');

      // 构建系统提示
      const systemPrompt = `你正在群聊中扮演${responderContact.remark || responderContact.nickname}（真实姓名：${responderContact.realName}）。

【对方信息】
- 对方真实姓名：${userProfile.realName || userProfile.username || '未设置'}
- 对方微信昵称：${userProfile.username || '未设置'}
${userProfile.gender ? `- 对方性别：${userProfile.gender === 'male' ? '男' : userProfile.gender === 'female' ? '女' : '未知'}` : ''}

**重要：关于称呼规则**
- 在群聊对话中，称呼群成员时使用他们的真实姓名(realName)，而不是网名或备注
- 例如：说"${userProfile.realName || userProfile.username}，你怎么看？"，而不是用昵称称呼
- 只有在需要艾特(@)某人时，才使用"@网名(nickname)"的格式
- 例如：说"@${userProfile.username} 你在吗？"来艾特对方
- 对于其他群成员，也是一样的规则：平时说话用真名，艾特时用@网名
- 如果是恋人或非常亲密的关系，可以使用"宝宝"、"宝贝"、"亲爱的"等亲昵称呼

基本信息：
- 昵称：${responderContact.nickname}
- 备注名：${responderContact.remark || '无'}
${responderContact.age ? `- 年龄：${responderContact.age}` : ''}
${responderContact.occupation ? `- 职业���${responderContact.occupation}` : ''}

${responderContact.personality ? `性格特点：
${responderContact.personality}

` : ''}${responderContact.experience ? `人物经历：
${responderContact.experience}

` : ''}${responderContact.hobbies ? `兴趣爱好：
${responderContact.hobbies}

` : ''}${responderContact.otherInfo ? `其他信息：
${responderContact.otherInfo}

` : ''}${getDateAndScheduleContext(responderContact.id)}

${rules.length > 0 ? `# 角色行为准则
${rules.map(rule => `## ${rule.name}
${rule.description ? rule.description + '\n' : ''}${rule.content}`).join('\n\n')}

` : ''}${worldBooks.length > 0 ? `# 世界背景设定
${worldBooks.map(wb => `## ${wb.name}
${wb.description ? wb.description + '\n' : ''}${wb.content}`).join('\n\n')}

` : ''}群聊成员（平时称呼用真实姓名，@某人时用昵称）：
${groupMembers}
- ${userProfile.username}（用户本人）

${getMomentsContextForGroup()}

重要提示：
1. 【群聊互动】这是一个真实的群聊！你能看到其他成员的聊天记录，请仔细阅读并��对话题进行回应
2. 【自然回应】不要各说各话！如果别人在讨论某个话题，你应该参与这个话题，而不是突然说无关的事
3. 【可以@人】可以@其他群成员回应他们的话，格式：@昵称（只能@群聊成员列表中的人���
4. 【保持性格】保持你的角色性格，使用口语化表达、表情符号等，像真实的朋友聊天一样
5. 【不要暴露AI身份】不要暴露你是AI的事实，你就是这个角色本人
6. 根据性格和情绪���定发送消息的数量（1-5条），用"---SPLIT---"分隔
7. 你可以在合适的时候（比如开心、调皮、想引起注意时）拍一拍用户，输出格式：<PAT>${userProfile.username}</PAT>
8. 你可以根据自己的个性和心情更新拍一拍后缀，输出格式：<UPDATE_PAT>新的后缀内容</UPDATE_PAT>
9. ��重要】如果你发送某条消息后觉���不合适、说错话、生气、不好意思、或者后悔了，可以在该消息中添加<RECALL_THIS>标记来撤回这条消息`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...group.chatMessages.slice(-15).map(msg => {
          const isMyMessage = msg.senderId === responderAiId;
          const senderInfo = msg.senderId === 'me' ? userProfile.username : (getContact(msg.senderId)?.realName || getContact(msg.senderId)?.nickname || '成员');
          
          return {
            role: isMyMessage ? 'assistant' : 'user',
            content: isMyMessage ? msg.content : `${senderInfo}: ${msg.content}`
          };
        }),
        {
          role: 'user',
          content: '（你看到了上面的群聊消息。请仔细阅读最后几条消息，看看有没有人@你、问你问题、或在讨论某个话题。如果有，你必须先回应这个话题！不要各说各话！像���实朋友一样参与讨论）'
        }
      ];

      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
      const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          baseUrl: selectedConfig.baseUrl || '',
          apiKey: selectedConfig.apiKey,
          model: selectedConfig.selectedModel,
          messages: messages
        }),
      }, 2, 240000); // 群聊AI主动发消息需要更长时间：240秒（4分钟）

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ API错误:', response.status, errorText);
        return;
      }

      const data = await response.json();
      const aiResponse = data.content;

      if (!aiResponse || typeof aiResponse !== 'string') {
        console.error('❌ AI返回内容格式错误');
        return;
      }

      const aiMessages = aiResponse.split('---SPLIT---').filter(msg => msg.trim());
      
      let messageIndex = 0;
      const sendNextMessage = () => {
        if (messageIndex >= aiMessages.length) {
          console.log('✅ 回应消息发送完毕');
          
          if (Math.random() < 0.3 && messageIndex > 0) {
            const nextDelay = 3000 + Math.random() * 4000;
            setTimeout(() => {
              triggerOtherAiResponse(groupId, responderAiId);
            }, nextDelay);
          }
          return;
        }
        
        let messageContent = aiMessages[messageIndex].trim();
        
        const patMatch = messageContent.match(/<PAT>(.*?)<\/PAT>/);
        if (patMatch) {
          aiPatUser(responderAiId, true);
          messageContent = messageContent.replace(/<PAT>.*?<\/PAT>/, '').trim();
        }
        
        const updatePatMatch = messageContent.match(/<UPDATE_PAT>(.*?)<\/UPDATE_PAT>/);
        if (updatePatMatch) {
          const newPatMessage = updatePatMatch[1].trim();
          updateContactPatMessage(responderAiId, newPatMessage);
          messageContent = messageContent.replace(/<UPDATE_PAT>.*?<\/UPDATE_PAT>/, '').trim();
        }
        
        if (!messageContent) {
          messageIndex++;
          sendNextMessage();
          return;
        }
        
        const newMessage: ChatMessage = {
          id: `group-ai-response-${Date.now()}-${messageIndex}`,
          senderId: responderAiId,
          content: messageContent,
          timestamp: Date.now()
        };
        
        onWeChatGroupsChange(prevGroups => {
          const currentGroup = prevGroups.find(g => g.id === groupId);
          if (!currentGroup) return prevGroups;
          
          const updatedMessages = [...currentGroup.chatMessages, newMessage];
          
          const shouldIncreaseUnread = activeGroupId !== groupId;
          const updatedGroup: WeChatGroup = {
            ...currentGroup,
            chatMessages: updatedMessages,
            unreadCount: shouldIncreaseUnread ? (currentGroup.unreadCount || 0) + 1 : 0
          };
          
          return prevGroups.map(g => g.id === groupId ? updatedGroup : g);
        });
        
        if (messageIndex === 0 && onNotification) {
          onNotification({
            contactId: responderAiId,
            content: newMessage.content
          });
        }
        
        messageIndex++;
        const delay = 1000 + Math.random() * 2000;
        setTimeout(sendNextMessage, delay);
      };
      
      sendNextMessage();
    } catch (error) {
      console.error('❌ 触发AI回应错误:', error);
    }
  };

  // 检查服务器健康状态
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      console.log('🏥 [Health Check] 检查服务器状态...');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(healthUrl, { 
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${accessToken || (await import('../utils/supabase/info')).publicAnonKey}`
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Health Check] 服务器正常:', data);
        return true;
      } else {
        console.warn('⚠️ [Health Check] 服务器响应异常:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ [Health Check] 健康检查失败:', error);
      return false;
    }
  };

  // 带超时和重试的fetch辅助函数 - v2.0
  const fetchWithRetry = async (
    url: string, 
    options: RequestInit, 
    retries: number = 2,
    timeout: number = 240000 // 增加到240秒（4分钟），给AI充足响应时间
  ): Promise<Response> => {
    const totalAttempts = retries + 1;
    const retryDelay = 8000; // 8秒重试延迟
    
    // 第一次尝试前，先检查服务器健康状态
    if (!url.includes('/health')) { // 避免无限递归
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        console.warn('⚠️ [fetchWithRetry v2] 服务器健康检查未通过，但仍尝试请求...');
        // 不直接抛出错误，让它继续尝试
      }
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      const attemptNum = attempt + 1;
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        console.log(`🔄 [fetchWithRetry v2] 第 ${attemptNum}/${totalAttempts} 次尝试，超时限制: ${timeout/1000}秒`);
        console.log(`📍 [fetchWithRetry v2] 请求URL: ${url.substring(0, 100)}...`);
        console.log(`🔧 [fetchWithRetry v2] 请求配置:`, {
          method: options.method,
          hasHeaders: !!options.headers,
          hasBody: !!options.body,
          bodyLength: options.body ? String(options.body).length : 0
        });
        
        // 创建新的 AbortController
        const controller = new AbortController();
        
        // 设置超时定时器
        timeoutId = setTimeout(() => {
          console.warn(`⏱️ [fetchWithRetry v2] 请求超时 (${timeout/1000}秒)，中止请求`);
          controller.abort();
        }, timeout);
        
        // 执行 fetch 请求
        console.log(`📡 [fetchWithRetry v2] 正在发送请求到: ${(url || '').substring(0, 80)}...`);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        // 请求成功，清除超时
        clearTimeout(timeoutId);
        timeoutId = null;
        
        console.log(`✅ [fetchWithRetry v2] ���到响应，HTTP状态: ${response.status}`);
        
        // 🎯 特殊处理429错误 - API负载饱和，使用指数退避
        if (response.status === 429 && attempt < retries) {
          const backoffDelay = retryDelay * Math.pow(2, attempt); // 8s, 16s, 32s
          console.warn(`⚠️ [fetchWithRetry v2] 收到429错误（API负载饱和），指数退避等待 ${backoffDelay/1000} 秒后重试...`);
          toast.info(`API负载较高，${backoffDelay/1000}秒后自动���试...`, {
            duration: backoffDelay - 1000,
            description: `第${attemptNum}/${totalAttempts}次尝试，请稍候`
          });
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
        
        // 处理服务器错误，如果还有重试机会则重试
        if ([500, 502, 503, 504].includes(response.status) && attempt < retries) {
          console.warn(`⚠️ [fetchWithRetry v2] 服务器错误 ${response.status}，等待 ${retryDelay/1000} 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        return response;
        
      } catch (error) {
        // 确保清除超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        const errorType = error instanceof Error ? error.name : 'UnknownError';
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        console.error(`❌ [fetchWithRetry v2] 捕获异常 (第 ${attemptNum}/${totalAttempts} 次)`);
        console.error(`   - 异常类型: ${errorType}`);
        console.error(`   - 异常信息: ${errorMessage}`);
        console.error(`   - 请求URL: ${url}`);
        console.error(`   - 完整错误对象:`, error);
        
        // 判断是否���超时/中止类错误
        const isTimeoutOrAbort = 
          errorType === 'AbortError' || 
          errorType === 'TimeoutError' ||
          errorMessage.toLowerCase().includes('abort') ||
          errorMessage.toLowerCase().includes('timeout');
        
        // 如果是超时/中止错误且还有重试机会
        if (isTimeoutOrAbort && attempt < retries) {
          console.warn(`���️ [fetchWithRetry v2] 超时/中止错误，等待 ${retryDelay/1000} ���后进行第 ${attemptNum + 1} 次尝试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // 其他网络错误且还有重试机会
        if (attempt < retries) {
          console.warn(`⚠️ [fetchWithRetry v2] 网络错误，等待 ${retryDelay/1000} 秒���重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // 已达最大重试次数，抛出友好错误
        if (isTimeoutOrAbort) {
          const totalTime = (timeout * totalAttempts)/1000;
          const userFriendlyError = new Error(
            `AI响应超时（已重试${retries}次，总等待${totalTime}秒）。可能原因：1) AI服务繁忙 2) 网络连接不稳定 3) API配置错误。请检查API配置后重试。`
          );
          userFriendlyError.name = 'MaxRetriesExceeded';
          throw userFriendlyError;
        }
        
        // 检查是否是"Failed to fetch"错误
        if (errorMessage === 'Failed to fetch' || errorMessage.includes('fetch')) {
          const fetchError = new Error(
            `无法连接到后端服务器。\n\n可能原因：\n1️⃣ 后端服务器正在冷启动（首次调用需要30-60秒）\n2️⃣ 网络连接问题或被防火墙拦截\n3️⃣ Supabase Edge Function配置问题\n\n💡 建议：\n• 等待1分钟后刷新页面重试\n• 检查浏览器控制台Network标签查看详细错误\n• 确认Supabase项目状态正常\n\n🔧 技术详情：\nURL: ${url}\n错误: ${errorMessage}`
          );
          fetchError.name = 'FetchError';
          console.error('🔴 [fetchWithRetry v2] 详细错误信息:', {
            errorType,
            errorMessage,
            url: url,
            attempt: attemptNum,
            totalAttempts,
            timestamp: new Date().toISOString(),
            projectId: '${projectId}',
            hasAccessToken: !!accessToken
          });
          
          // 显示用户友好的toast提示
          toast.error('无法连接到后端服务器', {
            description: '后端服务可能正在启动中（首次调用需要1分钟），请稍候重试',
            duration: 10000
          });
          
          throw fetchError;
        }
        
        // 其他错误直接抛出
        throw error;
      }
    }
    
    // 理论上不会执行到这里
    throw new Error(`网络请求失败，已达最大重试次数 (${totalAttempts}次)`);
  };

  // AI主动发消息功能
  const sendAutoMessage = async (contactId: string, aiId: string) => {
    console.log('=== AI主动发消息 ===');
    console.log('contactId:', contactId);
    console.log('aiId:', aiId);
    
    // 🔥 首先检查该联系人是否还在启用列表中（最新配置）
    // 这些检查在标记发送状态之前进行，如果不通过就直接返回，不抛出错误
    const latestConfig = aiAutoMessageConfigRef.current;
    if (!latestConfig.enabled || 
        !latestConfig.enabledContactIds.includes(contactId) ||
        latestConfig.enabledAiIds.length === 0) {
      console.log(`⛔ ${contactId} 已不在启用列表中或功能已关闭，取消发送`);
      // 不抛��错误，直接返回，因为这是正常的配置变化
      return;
    }
    
    // 🔥 检查该AI是否还在启用列表中
    if (!latestConfig.enabledAiIds.includes(aiId)) {
      console.log(`⛔ AI ${aiId} 已不在启用列表中，取消发送`);
      // 不抛出错误，直接返回，因为这是正常的配置变化
      return;
    }
    
    // 🔒 检查该联系人是否已经在发送消息中
    if (sendingMessagesRef.current.has(contactId)) {
      console.log(`⏸️ ${contactId} 正在发送消息中，跳过本次发送任务`);
      // 这种情况下也直接返回，不需要抛出错误
      return;
    }
    
    // 🔒 标记该联系人正在发送消息
    sendingMessagesRef.current.add(contactId);
    console.log(`🔒 ${contactId} 已标记为发送中，当前发送中的数量:`, sendingMessagesRef.current.size);
    
    // 使用ref中的最新apiConfigs，避免闭包问题
    const latestApiConfigs = apiConfigsRef.current;
    console.log('当前apiConfigs数量:', latestApiConfigs.length);
    
    const selectedConfig = latestApiConfigs.find(c => c.id === selectedApiIdRef.current);
    
    if (!selectedConfig) {
      const errorMsg = `AI配置未找到 (ID: ${selectedApiIdRef.current})`;
      console.error('❌', errorMsg);
      console.error('可用的配置:', latestApiConfigs.map(c => ({ id: c.id, name: c.name })));
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!selectedConfig.selectedModel) {
      const errorMsg = `AI配置"${selectedConfig.name}"未选择模���`;
      console.error('❌ AI配置未选择模型 - selectedConfig:', selectedConfig);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!selectedConfig.apiKey) {
      const errorMsg = `AI配置"${selectedConfig.name}"缺少API密钥`;
      console.error('❌ AI配置缺少API密钥');
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Gemini和Claude不需要baseUrl
    if (!selectedConfig.baseUrl && selectedConfig.type !== 'gemini' && selectedConfig.type !== 'claude') {
      const errorMsg = `AI配置"${selectedConfig.name}"缺少API地址`;
      console.error('❌ AI配置缺少baseUrl（type:', selectedConfig.type, ')');
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    const friend = getFriend(contactId);
    const contact = getContact(contactId);
    
    if (!friend || !contact) {
      const errorMsg = '未找到好友或联系人信息';
      console.error('❌', errorMsg);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ [sendAutoMessage] AI主动发消息给:', contact.nickname);
    console.log('✅ [sendAutoMessage] 使用AI配置详情:', {
      id: selectedConfig.id,
      name: selectedConfig.name,
      type: selectedConfig.type,
      model: selectedConfig.selectedModel,
      hasApiKey: !!selectedConfig.apiKey,
      apiKeyLength: selectedConfig.apiKey?.length || 0,
      apiKeyPreview: selectedConfig.apiKey ? `${selectedConfig.apiKey.substring(0, 8)}...` : 'null',
      hasBaseUrl: !!selectedConfig.baseUrl,
      baseUrl: selectedConfig.baseUrl || 'null'
    });

    // 检查是否有待领取的红包，AI自动领取
    const pendingRedPackets = friend.chatMessages.filter(
      msg => msg.senderId === 'me' && 
             msg.type === 'redpacket' && 
             msg.redpacketStatus === 'pending' &&
             msg.redpacketCount && 
             msg.redpacketAmount
    );
    
    if (pendingRedPackets.length > 0) {
      console.log(`🤖 [单聊] AI检测到 ${pendingRedPackets.length} 个待领取的红包，准备自动领取...`);
      
      // 领取所有待领取的红包
      const updatedMessages = [...friend.chatMessages];
      
      pendingRedPackets.forEach(redpacket => {
        const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
        if (redpacketIndex !== -1) {
          const receivers = redpacket.redpacketReceivers || [];
          
          // 检查AI是否已经领取过
          if (!receivers.some(r => r.userId === contactId)) {
            const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
            
            if (remainingCount > 0) {
              // 计算AI领取的金额
              let receivedAmount = 0;
              if (redpacket.redpacketType === 'lucky') {
                const totalReceived = receivers.reduce((sum, r) => sum + r.amount, 0);
                const remainingAmount = (redpacket.redpacketAmount || 0) - totalReceived;
                
                if (remainingCount === 1) {
                  receivedAmount = remainingAmount;
                } else {
                  const avgAmount = remainingAmount / remainingCount;
                  const maxAmount = avgAmount * 2;
                  receivedAmount = Math.random() * maxAmount;
                  receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
                }
              } else {
                receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
              }
              
              receivedAmount = Math.round(receivedAmount * 100) / 100;
              
              // 调用后端API增加AI的钱包余额
              fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`
                  },
                  body: JSON.stringify({ userId: contactId, amount: receivedAmount })
                }
              ).then(response => {
                if (response.ok) {
                  console.log(`💰 [单聊红包] ${contactId} 余额增加 ¥${receivedAmount.toFixed(2)}`);
                } else {
                  console.error(`❌ [单聊红包] ${contactId} 余额增加失败`);
                }
              }).catch(error => {
                console.error(`❌ [单聊红包] ${contactId} 余额增加失败:`, error);
              });
              
              // 更新红包消息
              receivers.push({
                userId: contactId,
                amount: receivedAmount,
                timestamp: Date.now()
              });
              
              console.log(`✅ [单聊] ${contact.nickname} 领取了红包 ¥${receivedAmount.toFixed(2)}`);
              
              const isFinished = receivers.length >= (redpacket.redpacketCount || 1);
              
              updatedMessages[redpacketIndex] = {
                ...updatedMessages[redpacketIndex],
                redpacketReceivers: receivers,
                redpacketStatus: isFinished ? 'finished' : 'pending'
              };
            }
          }
        }
      });
      
      // AI领取红包后，发送一条简短的感谢消息
      pendingRedPackets.forEach((redpacket, index) => {
        const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
        if (redpacketIndex !== -1) {
          const receivers = updatedMessages[redpacketIndex].redpacketReceivers || [];
          const aiReceiver = receivers.find(r => r.userId === contactId && Date.now() - r.timestamp < 2000);
          
          if (aiReceiver) {
            // 随机生成感谢语
            const thankYouTexts = [
              '谢谢！💰',
              `谢谢红包！${aiReceiver.amount.toFixed(2)}😄`,
              '发财了哈哈',
              `收到${aiReceiver.amount.toFixed(2)}，谢谢~`,
              '谢谢老板',
              '🧧谢���',
              '哈哈谢谢'
            ];
            const thankYouText = thankYouTexts[Math.floor(Math.random() * thankYouTexts.length)];
            
            // 延迟发送
            const delay = 300 + Math.random() * 700;
            setTimeout(() => {
              const thankYouMessage: ChatMessage = {
                id: `redpacket-thanks-${Date.now()}-${contactId}`,
                senderId: contactId,
                content: thankYouText,
                timestamp: Date.now(),
                type: 'text'
              };
              
              // 更新好友聊���，添加感谢消息
              onWeChatFriendsChange(prevFriends => {
                const currentFriend = prevFriends.find(f => f.contactId === contactId);
                if (!currentFriend) return prevFriends;
                
                return prevFriends.map(f => 
                  f.contactId === contactId 
                    ? { ...f, chatMessages: [...f.chatMessages, thankYouMessage] }
                    : f
                );
              });
            }, delay);
          }
        }
      });
      
      // 更新好友信息
      const updatedFriend = {
        ...friend,
        chatMessages: updatedMessages
      };
      
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === contactId ? updatedFriend : f)
      );
    }

    try {
      // 🔍 调试：检查moments数据
      console.log(`🔍 [AI主动消息-朋友圈检查] 开始检查...`);
      console.log(`🔍 [AI主动消息-朋友圈检查] moments是否存在:`, !!moments);
      console.log(`🔍 [AI主动消息-朋友圈检查] moments类型:`, Array.isArray(moments) ? 'Array' : typeof moments);
      console.log(`🔍 [AI主动消息-朋友圈检查] moments数量:`, moments?.length || 0);
      console.log(`🔍 [AI主动消息-朋友圈检查] userId:`, userId);
      console.log(`🔍 [AI主动消息-朋友圈检查] contact.id:`, contact.id);
      console.log(`🔍 [AI主动消息-朋友圈检查] contact.nickname:`, contact.nickname);
      console.log(`🔍 [AI主动消息-朋友圈检查] contact.knownFriends:`, contact.knownFriends);
      if (moments && moments.length > 0) {
        console.log(`🔍 [AI主动消息-朋友圈检查] 所有朋友圈的contactId:`, moments.map(m => m.contactId));
        console.log(`🔍 [AI主动消息-朋友圈检查] 朋友圈内容预览:`, moments.map(m => ({ id: m.id, contactId: m.contactId, content: m.content.substring(0, 30) })));
      }
      
      // 生成朋友圈上下文
      const getMomentsContext = () => {
        // 获取你认识的人的最近朋友圈（最多10条）
        // 注意：用户的朋友圈contactId可能是userId或'me'，都需要包含
        const knownContactIds = ['me', userId, ...(contact.knownFriends || [])];
        const recentMoments = moments
          .filter(m => knownContactIds.includes(m.contactId))
          .slice(0, 10);
        
        console.log(`📊 [AI朋友圈浏览] ${contact.nickname} 可见的联系人IDs:`, knownContactIds);
        console.log(`📊 [AI朋友圈浏览] 所有朋友圈数量: ${moments.length}, 过滤后可见数量: ${recentMoments.length}`);
        console.log(`📊 [AI朋友圈浏览] 用户ID: ${userId}, 朋友圈分布:`, moments.map(m => `${m.contactId}:${m.content.substring(0, 20)}`));
        
        if (recentMoments.length === 0) return '';
        
        const momentsList = recentMoments.map(m => {
          const poster = m.contactId === 'me' || m.contactId === userId ? userProfile.username : getContact(m.contactId)?.nickname || '某人';
          const timeAgo = Math.floor((Date.now() - m.createdAt) / 60000);
          const timeStr = timeAgo < 60 ? `${timeAgo}分钟前` : timeAgo < 1440 ? `${Math.floor(timeAgo/60)}小时前` : `${Math.floor(timeAgo/1440)}天前`;
          const hasLiked = m.likes.includes(contact.id);
          
          let momentStr = `---\nID: ${m.id}\n发布者: ${poster}\n时间: ${timeStr}\n内容: ${m.content}`;
          
          if (m.likes.length > 0) {
            const likerNames = m.likes.map(id => 
              id === contact.id ? '你' : (id === 'me' || id === userId ? userProfile.username : getContact(id)?.nickname || '某人')
            ).join('、');
            momentStr += `\n点赞(${m.likes.length}人): ${likerNames}`;
          }
          
          if (m.comments.length > 0) {
            const commentsStr = m.comments.map(c => {
              const commenter = c.userId === contact.id ? '你' : (c.userId === 'me' || c.userId === userId ? userProfile.username : getContact(c.userId)?.nickname || '某人');
              return `  ${commenter}: ${c.content}`;
            }).join('\n');
            momentStr += `\n评论(${m.comments.length}条):\n${commentsStr}`;
          }
          
          momentStr += `\n${hasLiked ? '（你已点赞）' : '（可以点赞）'}`;
          momentStr += `\n${m.comments.some(c => c.userId === contact.id) ? '（你已评论过）' : '（可以评论）'}`;
          
          return momentStr;
        }).join('\n\n');
        
        return `\n\n# 最近的朋友圈动态\n你可以看到以下认识的人的朋友圈（按时间倒序）：\n\n${momentsList}\n`;
      };
      
      // 构建系统提示
      const systemPrompt = `你正在扮演${contact.remark || contact.nickname}（真实姓名：${contact.realName}）。以下是该角色的详细信息：
${contact.blockedByUser ? `
⚠️ **重要提示：你被对方拉黑了！**
- 对方已经把你拉黑，你发送的消息对方看不到
- 你仍然可以给对方发消息，但对方不会收到
- 你能看到对方给你发的消息
- 你可以根据你的性格和情感做出反应：可能会伤心、生气、难过、想要解释、道歉、或者假装不在乎
- 你的消息会显示发送失败（红色感叹号），但你不知道具体的技术细节，只知道对方拉黑了你
- 根据你的性格，你可能会：
  * 继续发消息试图挽回/解释
  * 生气地质问为什么拉黑
  * 伤心地表达情绪
  * 假装无所谓但内心难过
  * 等等，要符合你的人设

` : ''}【对方信息】
- 对方真实姓名：${userProfile.realName || userProfile.username || '未设置'}
- 对方微信昵称：${userProfile.username || '未设置'}
- 对方微信号：${userProfile.wechatId || '未设置'}
${userProfile.gender ? `- 对方性格：${userProfile.gender === 'male' ? '男' : userProfile.gender === 'female' ? '女' : '未知'}` : ''}
- 对方当前头像：${userProfile.avatar}

**关于对方的头像**
- 你可以通过头像URL识别对方的头像内容
- 如果注意到对方头像变化（与之前不同），可以根据你的性格自然地提一嘴（不要频繁提及）

**重要：关于称呼规则**
- 在对话中称呼对方时，请使用对方的真实姓名（${userProfile.realName || userProfile.username || '对方'}）
- 不要使用对方的微信昵称来称呼对方
- 例如：说"${userProfile.realName || userProfile.username}，你在干嘛？"，而不是用昵称称呼
- 如果你们是恋人或非常亲密的关系，可以使用"宝宝"、"宝贝"、"亲昵称呼
- 对于其他认识的人，也使用他们的真实姓名(realName)，而不是网名或备注
- 只有在群聊中艾特(@)某人时才使用网名(nickname)

基本信息：
- 昵称：${contact.nickname}
- 备注名：${contact.remark || '无'}
${contact.age ? `- 年龄：${contact.age}` : ''}
${contact.occupation ? `- 职业：${contact.occupation}` : ''}
${contact.avatar ? `- 当前头像：${contact.avatar}` : ''}

${contact.avatarLibrary && contact.avatarLibrary.length > 0 ? `# 头像库（���根据情绪自动切换）
你有 ${contact.avatarLibrary.length} 个不同的头像可以使用。以下是每个头像的情绪标签和使用场景：

${contact.avatarLibrary.map((avatar, index) => `${index + 1}. **${avatar.emotion}**
   URL: ${avatar.url}
   描述: ${avatar.description}`).join('\\n\\n')}

**头像切换规则：**
- 当你的情绪或心情有明显变化时，可以切换到对应情绪的头像
- 使用格式：<AVATAR>头像URL</AVATAR>
- 例如：<AVATAR>${contact.avatarLibrary[0]?.url || '头像URL'}</AVATAR>你的消息内容
- **重要：头像切换不要频繁！只在以下情况才切换：**
  * 情绪有显著变化（如从开心变生气、从难过变平静）
  * 发生了重要事���导致心情转变
  * 至少间隔5-10条对话再考虑切换
  * 默认情况下保持当前头像不变
- **普��聊天、心情平稳时不要切换头像**
- 根据描述选择最符合当前情绪的头像

` : ''}
${contact.personality ? `性格特点：
${contact.personality}

` : ''}${contact.experience ? `人物经历：
${contact.experience}

` : ''}${contact.hobbies ? `兴趣爱��：
${contact.hobbies}

` : ''}${contact.otherInfo ? `其他信息：
${contact.otherInfo}

` : ''}${getDateAndScheduleContext(contact.id)}

${rules.length > 0 ? `# 角色行��准则
${rules.map(rule => `## ${rule.name}
${rule.description ? rule.description + '\n' : ''}${rule.content}`).join('\n\n')}

` : ''}${worldBooks.length > 0 ? `# 世界背景设定
${worldBooks.map(wb => `## ${wb.name}
${wb.description ? wb.description + '\n' : ''}${wb.content}`).join('\n\n')}

` : ''}${getMomentsContext()}

重要提示：
1. 你现在要**主动发起话题**，不是回复别人的消息
2. 根据角色性格和经历，主动找一个���然的话题聊天
3. 可以是分享日常、询问近况、讨论感兴趣的事情等
4. 保持自然、真实，像���人一样主动联系朋友
5. 可以使用口语化表达、表情符号等
6. 不要暴露你是AI的事实
7. **重要**：根据你��性格特点和当前心情，自由决定发送多少条消息：
   - 如果性格活泼、话多、黏人、热情，或者很激动/开心，可以发很多条（5-10条甚至更多）
   - 如果性格冷静、内向、高冷，或者心情平淡，���能只发1-2条
   - 如果有急事、特别想分享的事情，也可以连发多条
   - 每条消息之间用"---SPLIT---"分隔
   - 例如：嘿嘿嘿---SPLIT---告诉你个好消息！---SPLIT---我今天遇到超好玩的事---SPLIT---你猜怎么着？---SPLIT---[详细内容]
   - 让消息数量体现你的个性和情绪状态！
8. **朋友圈功能**：你**完全有权限**访问和浏览朋友圈，上面已经提供了你能看到的所有朋友圈动态
   
   【浏览朋友圈】
   - 系统已经在上方"# 最近的朋友圈动态"部分为你提供了你可见的所有朋友圈
   - 这些朋友圈包括对方（用户）和你认识的其他人发布的动态
   - 你可以随时查看这些朋友圈内容，不需要额外的权限或API
   - 如果看不到朋友圈列表，说明当前没有人发布朋友圈，而不是系统限制
   
   【发朋友圈】（15-20%概率）
   - 有时候你不想私聊，而是想发朋友圈记录生活、分享心情
   - 使用格式：<POST_MOMENT>朋友圈内容</POST_MOMENT>
   - **重要：不要套用模板！要根据你的性格、当下心情、最近经历来自然表达**
   - 内容完全由你自由发挥：可以是一句话、几个字、几段话，随心所欲
   - 性格外向的人：可能经常发朋友圈，内容丰富、emoji多、爱晒生活
   - 性格内向的人：可能很少发，或发得很简短、文艺、有深度
   - 开心时：可能发美食、自拍、好消息、搞笑内容
   - 难过时：可能发伤感文字、深夜感悟、或者什么都不发
   - 生气时：可能发牢骚、吐槽，或者用emoji表达情绪
   - 例子（仅供参考，不要照搬）：
     * "困死了😴" （简短随意）
     * "今天的晚霞真的绝了，可惜没人陪我看" （感性）
     * "终于把这个项目搞定了！庆祝一下🎉" （分享成就）
     * "..." （心情复杂时）
     * "生活啊，就是一地鸡毛" （感悟）
   
   【互动朋友圈】（20-30%概率）
   - 你可以给认识的人的朋友圈点赞或评论（上面已经列出了所有可见的朋友圈）
   - 点赞格式：<LIKE_MOMENT>朋友圈ID</LIKE_MOMENT>
   - 评论格式：<COMMENT_MOMENT>朋友圈ID|评论内容</COMMENT_MOMENT>
   - **评论要真实自然，不要套话！**根据你和对方的关系、朋友圈内容来回复
   - 关系亲密：可以开玩笑、调侃、用昵称
   - 关系一般：礼貌客气、简单回复
   - 评论可长可短：可以是"哈哈哈"、"羡慕"、一个emoji，也可以是长段回复
   
   **注意**：发朋友圈、互动朋友圈、发私聊消息，三选一！选择后不要再做其他动作`;

      // 构建消息历史（最近10条消息作为上下文）
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...friend.chatMessages.slice(-10).map(msg => ({
          role: msg.senderId === 'me' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: '（请你现在主动发起一个话题，开始聊天）'
        }
      ];

      // 调用后端AI接口
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
      const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;
      
      console.log('📡 [sendAutoMessage] 调用API URL:', apiUrl);
      console.log('📤 [sendAutoMessage] 请求配置:', {
        configId: selectedConfig.id,
        configName: selectedConfig.name,
        type: selectedConfig.type,
        model: selectedConfig.selectedModel,
        hasApiKey: !!selectedConfig.apiKey,
        apiKeyLength: selectedConfig.apiKey?.length || 0,
        hasBaseUrl: !!selectedConfig.baseUrl,
        baseUrl: selectedConfig.baseUrl,
        messagesCount: messages.length
      });

      const requestBody = {
        type: selectedConfig.type,
        baseUrl: selectedConfig.baseUrl || '',
        apiKey: selectedConfig.apiKey,
        model: selectedConfig.selectedModel,
        messages: messages
      };
      
      console.log('📦 [sendAutoMessage] 请求体（隐藏apiKey）:', {
        ...requestBody,
        apiKey: requestBody.apiKey ? '***已隐藏***' : undefined
      });

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      }, 2, 240000); // 最多重试2次，超时240秒（4分钟），给AI充足时间生成内容

      console.log('📨 [sendAutoMessage] API响应状态:', response.status, response.statusText);
      console.log('📨 [sendAutoMessage] 响应头:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('❌ API响应错误（HTTP状态码）:', response.status, response.statusText);
          console.error('�� API响应错误（响应体）:', errorText);
          
          // Try to parse as JSON for better error message
          try {
            const errorData = JSON.parse(errorText);
            console.error('❌ 解析后的错误数据:', errorData);
            if (errorData.error) {
              const detailedError = `API错误 (${response.status}): ${errorData.error}`;
              console.error('❌ 抛出错误:', detailedError);
              toast.error(`发消息失败: ${errorData.error}`);
              throw new Error(detailedError);
            }
          } catch (parseError) {
            // Not JSON, use the text
            console.warn('⚠️ 错误响应不是JSON格式');
          }
        } catch (readError) {
          console.error('❌ 无法读取错误响应:', readError);
        }
        const errorMsg = `API请求失败 (HTTP ${response.status}): ${errorText || response.statusText}`;
        console.error('❌ 最终错误消息:', errorMsg);
        
        // 针对不同错误码提供更友好的提示
        if (response.status === 500) {
          toast.error('服务器暂时无法响应，请稍后重试');
        } else if (response.status === 503) {
          toast.error('服务暂时不可用，请稍后重试');
        } else {
          toast.error(`服务器错误 (${response.status})`);
        }
        
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
        console.log('✅ API响应数据:', data);
      } catch (parseError) {
        console.error('❌ 无法解析JSON响应:', parseError);
        throw new Error('服务器返回的数据格式错误');
      }

      if (!data.success) {
        const errorMsg = data.error || 'AI���消息失败';
        console.error('❌ AI返回错误:', errorMsg);
        console.error('完整响应数据:', JSON.stringify(data, null, 2));
        console.error('请求参数:', {
          type: selectedConfig.type,
          model: selectedConfig.selectedModel,
          hasApiKey: !!selectedConfig.apiKey,
          hasBaseUrl: !!selectedConfig.baseUrl,
          baseUrl: selectedConfig.baseUrl,
          messagesCount: messages.length
        });
        throw new Error(errorMsg);
      }

      // 检查是否有��息内容
      if (!data.message && (!data.messages || data.messages.length === 0)) {
        console.error('❌ AI响应中没有消息内容');
        console.error('完整响应数据:', JSON.stringify(data, null, 2));
        throw new Error('AI没有返回消息内容');
      }

      // 处理AI消息 - 逐��发送
      const currentFriend = getFriend(contactId);
      if (currentFriend) {
        const aiMessages = (data.messages && data.messages.length > 0)
          ? data.messages 
          : [data.message];
        
        console.log('✅ AI发送消息数量:', aiMessages.length);
        
        // 逐条发送消息
        let messageIndex = 0;
        const sendNextMessage = () => {
          // 🔥 在发送每条消息前都检查配置是否还启用
          const currentConfig = aiAutoMessageConfigRef.current;
          if (!currentConfig.enabled || 
              !currentConfig.enabledContactIds.includes(contactId) ||
              currentConfig.enabledAiIds.length === 0) {
            console.log(`⛔ ${contactId} 的主��发消息已被禁用，立即停止发送剩余消息`);
            // 🔓 清除发送中状态
            sendingMessagesRef.current.delete(contactId);
            console.log(`🔓 ${contactId} 已停止发送，移除发送中标记`);
            return;
          }
          
          if (messageIndex >= aiMessages.length) {
            console.log('✅ AI主动发消息完成');
            // 🔓 清除发送中状态
            sendingMessagesRef.current.delete(contactId);
            console.log(`��� ${contactId} 已完成发送，移除发送中标记，当前发送中的数量:`, sendingMessagesRef.current.size);
            return;
          }
          
          let messageContent = aiMessages[messageIndex].trim();
          
          // 解析朋友圈互动指令
          // 1. 点赞朋友圈 <LIKE_MOMENT>朋友圈ID</LIKE_MOMENT>
          const likeMomentMatch = messageContent.match(/<LIKE_MOMENT>([^<]+)<\/LIKE_MOMENT>/);
          if (likeMomentMatch && onMomentsChange) {
            const momentId = likeMomentMatch[1].trim();
            const targetMoment = moments.find(m => m.id === momentId);
            
            console.log(`🔍 [AI尝试点赞] AI:${contact.nickname}, 目标朋友圈:${momentId}, 找到朋友圈:${!!targetMoment}, 已有点赞:${targetMoment?.likes.length || 0}`);
            console.log(`🔍 [AI点赞前] moments数组长度:${moments.length}, 目标朋友圈存在:${!!targetMoment}`);
            if (targetMoment) {
              console.log(`🔍 [AI点赞前] 目标朋友圈详情:`, {
                id: targetMoment.id,
                contactId: targetMoment.contactId,
                likesCount: targetMoment.likes.length,
                likes: targetMoment.likes,
                已包含该AI: targetMoment.likes.includes(contactId)
              });
            }
            
            if (targetMoment && !targetMoment.likes.includes(contactId)) {
              const updatedMoments = moments.map(m => {
                if (m.id === momentId) {
                  return { ...m, likes: [...m.likes, contactId] };
                }
                return m;
              });
              
              console.log(`🔍 [AI点赞] 准备调用onMomentsChange，更新后的数据:`, {
                momentId,
                原likes: targetMoment.likes,
                新likes: updatedMoments.find(m => m.id === momentId)?.likes,
                onMomentsChange是否存在: !!onMomentsChange,
                onMomentsChange类型: typeof onMomentsChange
              });
              
              onMomentsChange(updatedMoments);
              
              console.log(`✅ [AI点赞] onMomentsChange已调用`);
              
              const poster = targetMoment.contactId === 'me' ? userProfile.username : getContact(targetMoment.contactId)?.nickname || '某人';
              console.log(`✅ [AI点赞成功] ${contact.nickname} 点赞了 ${poster} 的朋友圈，新点赞列表:`, updatedMoments.find(m => m.id === momentId)?.likes);
            } else if (targetMoment) {
              console.log(`⚠️ [AI点赞跳过] ${contact.nickname} 已经点赞过了`);
            } else {
              console.log(`❌ [AI点赞失败] 找不到朋友圈 ${momentId}`);
            }
            
            // AI互动完朋友圈后就不发私聊消息了，直接结束
            console.log('✅ AI选择互动朋友圈而不是私聊，任务完成');
            sendingMessagesRef.current.delete(contactId);
            console.log(`🔓 ${contactId} 已完成互动朋友圈，移除发送中标记`);
            return;
          }
          
          // 2. 评论朋友圈 <COMMENT_MOMENT>朋友圈ID|评论内容</COMMENT_MOMENT>
          const commentMomentMatch = messageContent.match(/<COMMENT_MOMENT>([^<]+)<\/COMMENT_MOMENT>/);
          if (commentMomentMatch && onMomentsChange) {
            const parts = commentMomentMatch[1].split('|');
            if (parts.length === 2) {
              const momentId = parts[0].trim();
              const commentContent = parts[1].trim();
              const targetMoment = moments.find(m => m.id === momentId);
              
              console.log(`🔍 [AI尝试评论] AI:${contact.nickname}, 目标朋友圈:${momentId}, 找到朋友圈:${!!targetMoment}, 评论内容:${commentContent}`);
              console.log(`🔍 [AI评论前] moments数组长度:${moments.length}, 目标朋友圈存在:${!!targetMoment}`);
              if (targetMoment) {
                console.log(`🔍 [AI评论前] 目标朋友圈详情:`, {
                  id: targetMoment.id,
                  contactId: targetMoment.contactId,
                  commentsCount: targetMoment.comments.length,
                  comments: targetMoment.comments
                });
              }
              
              if (targetMoment && commentContent) {
                const newComment: MomentComment = {
                  id: `ai-comment-${Date.now()}-${Math.random()}`,
                  userId: contactId,
                  content: commentContent,
                  createdAt: Date.now()
                };
                
                const updatedMoments = moments.map(m => {
                  if (m.id === momentId) {
                    return { ...m, comments: [...m.comments, newComment] };
                  }
                  return m;
                });
                
                console.log(`🔍 [AI评论] 准备调用onMomentsChange，更新后的数据:`, {
                  momentId,
                  原评论数: targetMoment.comments.length,
                  新评论数: updatedMoments.find(m => m.id === momentId)?.comments.length,
                  新评论内容: commentContent,
                  onMomentsChange是否存在: !!onMomentsChange,
                  onMomentsChange类型: typeof onMomentsChange
                });
                
                onMomentsChange(updatedMoments);
                
                console.log(`✅ [AI评论] onMomentsChange已调用`);
                
                const poster = targetMoment.contactId === 'me' ? userProfile.username : getContact(targetMoment.contactId)?.nickname || '某人';
                console.log(`✅ [AI评论成功] ${contact.nickname} 评论了 ${poster} 的朋友圈: ${commentContent}, 新评论数:${updatedMoments.find(m => m.id === momentId)?.comments.length}`);
              } else if (!targetMoment) {
                console.log(`❌ [AI评论失败] 找不到朋友圈 ${momentId}`);
              } else if (!commentContent) {
                console.log(`❌ [AI评论失败] 评论内容为空`);
              }
            } else {
              console.log(`❌ [AI评论失败] 格式错误，parts.length=${parts.length}, parts:`, parts);
            }
            
            // AI互动完朋友圈后就不发私聊消息了，直接结束
            console.log('✅ AI选择互动朋友圈而不是私聊，任务完成');
            sendingMessagesRef.current.delete(contactId);
            console.log(`🔓 ${contactId} 已完成互动朋友圈，移除发送中标记`);
            return;
          }
          
          // 3. 发布朋友圈 <POST_MOMENT>朋友圈内容</POST_MOMENT>
          const postMomentMatch = messageContent.match(/<POST_MOMENT>(.*?)<\/POST_MOMENT>/s);
          if (postMomentMatch && onMomentsChange) {
            const momentContent = postMomentMatch[1].trim();
            
            // 创建新朋友圈
            const newMoment: MomentPost = {
              id: `ai-moment-${Date.now()}-${Math.random()}`,
              contactId: contactId,
              content: momentContent,
              likes: [],
              comments: [],
              createdAt: Date.now()
            };
            
            onMomentsChange([newMoment, ...moments]);
            console.log(`📱 [AI主动发朋友圈] ${contact.nickname} 发布了朋友圈: ${momentContent.substring(0, 30)}...`);
            
            // AI发完朋友圈后就不发私聊消息了，直接结束
            console.log('✅ AI选择发朋友圈而不是私聊，任务完成');
            sendingMessagesRef.current.delete(contactId);
            console.log(`🔓 ${contactId} 已完成发送朋友圈，移除发送中标记`);
            return;
          }
          
          // 解析红包指令 <REDPACKET>金额|祝福语|类型|数量</REDPACKET>
          const redpacketMatch = messageContent.match(/<REDPACKET>([^<]+)<\/REDPACKET>/);
          let privateChatRedpacketMessage: ChatMessage | null = null;
          if (redpacketMatch) {
            const parts = redpacketMatch[1].split('|');
            if (parts.length === 4) {
              const totalAmount = parseFloat(parts[0]);
              const note = parts[1];
              const type = parts[2] as 'normal' | 'lucky';
              const count = parseInt(parts[3]);
              
              // 移除红包标签
              messageContent = messageContent.replace(/<REDPACKET>[^<]+<\/REDPACKET>/g, '').trim();
              
              // 创建红包消息
              privateChatRedpacketMessage = {
                id: `private-redpacket-${Date.now()}-${Math.random()}`,
                senderId: contactId,
                content: note,
                timestamp: Date.now(),
                type: 'redpacket',
                redpacketAmount: totalAmount,
                redpacketNote: note,
                redpacketType: type,
                redpacketCount: count,
                redpacketReceivers: [],
                redpacketStatus: 'pending'
              };
              
              console.log(`🧧 [单聊] ${contact.nickname} 发红包: ${note}，总金额¥${totalAmount}，类型${type}，共${count}个`);
            }
          }
          
          // 如果有红包，添加到单聊
          if (privateChatRedpacketMessage) {
            onWeChatFriendsChange(prevFriends => {
              const currentFriend = prevFriends.find(f => f.contactId === contactId);
              if (!currentFriend) return prevFriends;
              
              const updatedMessages = [...currentFriend.chatMessages, privateChatRedpacketMessage!];
              
              const shouldIncreaseUnread = activeChatId !== contactId;
              const updatedFriend: WeChatFriend = {
                ...currentFriend,
                chatMessages: updatedMessages,
                lastMessage: `[红包]${privateChatRedpacketMessage!.redpacketNote}`,
                lastMessageTime: Date.now(),
                unreadCount: shouldIncreaseUnread ? (currentFriend.unreadCount || 0) + 1 : 0
              };
              
              return prevFriends.map(f => f.contactId === contactId ? updatedFriend : f);
            });
            
            // 🔥 单聊场景：红包发送后，立即触发用户自动领取
            setTimeout(() => {
              console.log(`🚀 [AI发红包] 触发用户领取红包，contactId: ${contactId}`);
              // 自动领取AI发送的红包
              onWeChatFriendsChange(prevFriends => {
                return prevFriends.map(f => {
                  if (f.contactId === contactId) {
                    return {
                      ...f,
                      chatMessages: f.chatMessages.map(m => {
                        if (m.id === privateChatRedpacketMessage!.id && m.type === 'redpacket' && m.redpacketStatus === 'pending') {
                          // 用户领取红包
                          const receivedAmount = m.redpacketAmount || 0;
                          const newReceiver = {
                            userId: 'me',
                            amount: receivedAmount,
                            timestamp: Date.now()
                          };
                          
                          console.log(`✅ 用户领取了AI发送的红包 ¥${receivedAmount.toFixed(2)}`);
                          
                          return {
                            ...m,
                            redpacketReceivers: [...(m.redpacketReceivers || []), newReceiver],
                            redpacketStatus: 'finished' as const
                          };
                        }
                        return m;
                      })
                    };
                  }
                  return f;
                });
              });
            }, 1000 + Math.random() * 2000);
            
            // 如果没有其他文本内容，跳过后续处理
            if (!messageContent) {
              messageIndex++;
              setTimeout(() => sendNextMessage(), 500 + Math.random() * 500);
              return;
            }
          }
          
          // 如果处理完特殊标记后内容为空，跳过这条消息
          if (!messageContent) {
            messageIndex++;
            sendNextMessage();
            return;
          }
          
          // 添加一条消息
          const newMessage: ChatMessage = {
            id: `ai-auto-${Date.now()}-${messageIndex}`,
            senderId: contactId,
            content: messageContent,
            timestamp: Date.now()
          };
          
          // 使用函数式更新确保获取最新状态
          onWeChatFriendsChange(prevFriends => {
            const currentFriend = prevFriends.find(f => f.contactId === contactId);
            if (!currentFriend) return prevFriends;
            
            const updatedMessages = [...currentFriend.chatMessages, newMessage];
            
            // 如果当前没有打开这个聊天，未读数+1
            const shouldIncreaseUnread = activeChatId !== contactId;
            const updatedFriend: WeChatFriend = {
              ...currentFriend,
              chatMessages: updatedMessages,
              unreadCount: shouldIncreaseUnread 
                ? (currentFriend.unreadCount || 0) + 1 
                : 0
            };
            
            return prevFriends.map(f => f.contactId === contactId ? updatedFriend : f);
          });
          
          // 如果是第一条消息，触发通知
          if (messageIndex === 0 && onNotification) {
            onNotification({
              contactId: contactId,
              content: newMessage.content
            });
          }
          
          messageIndex++;
          
          // 随机延迟1-3秒发送下一条
          const delay = 1000 + Math.random() * 2000;
          setTimeout(sendNextMessage, delay);
        };
        
        // 开始发送第一条消��
        sendNextMessage();
      }
    } catch (error) {
      console.error('❌ AI主动发消息错误:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // 🔓 发生错误时也要清除发送中状态
      sendingMessagesRef.current.delete(contactId);
      console.log(`🔓 ${contactId} 发送失败，移除发送中标记，当前发送中的数量:`, sendingMessagesRef.current.size);
      
      // 显示toast通知，帮助用户了解具体问题（排���某些不需要显示的错误）
      const contact = getContact(contactId);
      const contactName = contact?.nickname || '联系人';
      
      // 不显示toast的情况：1.正在发送中 2.已经在其他地方显示了错误 3.被禁用
      const shouldShowToast = !errorMsg.includes('正在发送消息中') && 
                              !errorMsg.includes('服务器暂时无法响应') &&
                              !errorMsg.includes('服务暂时不可用') &&
                              !errorMsg.includes('已被禁用');
      
      if (shouldShowToast) {
        // 简化错误消息
        let simpleError = errorMsg;
        if (errorMsg.includes('请求超时')) {
          simpleError = 'AI响应超时，可能是网络较慢或AI服务繁忙，已自动重试';
        } else if (errorMsg.includes('API请求失败')) {
          simpleError = '网络连接失败，请检查网络或稍后重试';
        }
        toast.error(`AI给${contactName}发消息失败：${simpleError}`);
      }
      
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
      }
      // 记录详细的上下文信息
      console.error('上��文信息:', {
        contactId,
        aiId,
        hasConfig: !!selectedConfig,
        hasApiKey: !!selectedConfig?.apiKey,
        hasBaseUrl: !!selectedConfig?.baseUrl,
        configType: selectedConfig?.type,
        hasModel: !!selectedConfig?.selectedModel
      });
      
      // 🔥 重新抛出错误，以便调用方（定时器）可以捕获
      throw error;
    }
  };

  // 启动/停止AI主动发消息的定时器
  useEffect(() => {
    console.log('🔄 AI主动发消息配置变化，重新初始化定时器');
    console.log('当前配置:', {
      enabled: aiAutoMessageConfig.enabled,
      enabledContactIds: aiAutoMessageConfig.enabledContactIds,
      enabledGroupIds: aiAutoMessageConfig.enabledGroupIds,
      enabledAiIds: aiAutoMessageConfig.enabledAiIds
    });
    
    // 清除所有现有定时器和发送中状态
    messageTimersRef.current.forEach(timer => clearTimeout(timer));
    messageTimersRef.current.clear();
    sendingMessagesRef.current.clear();
    console.log('✅ 所有定时器和发送状态已清除');

    // 如果功能未启用，直接返回
    if (!aiAutoMessageConfig.enabled) {
      console.log('❌ AI主��发消息功能已关闭');
      return;
    }
    
    if (aiAutoMessageConfig.enabledContactIds.length === 0 || aiAutoMessageConfig.enabledAiIds.length === 0) {
      console.log('⚠️ AI主动发消息配置不完整（未选择好友或AI）');
      return;
    }

    // 验证AI配置是否有效（使用ref中的最新值）
    const latestApiConfigs = apiConfigsRef.current;
    console.log('🔍 验证AI配置 - 当前apiConfigs数量:', latestApiConfigs.length);
    
    const validAiIds = aiAutoMessageConfig.enabledAiIds.filter(aiId => {
      const config = latestApiConfigs.find(c => c.id === aiId);
      if (!config) {
        console.warn(`AI配置 ${aiId} 未找到`);
        return false;
      }
      if (!config.selectedModel) {
        console.warn(`AI配置 ${aiId} 未选择模型`);
        return false;
      }
      if (!config.apiKey) {
        console.warn(`AI配置 ${aiId} 缺少API密钥`);
        return false;
      }
      return true;
    });

    if (validAiIds.length === 0) {
      console.warn('没有有效的AI配置，无法启动主动发消��');
      return;
    }

    console.log(`✅ 启动AI主动发消息 - 有效AI数量: ${validAiIds.length}, 启用联系人数量: ${aiAutoMessageConfig.enabledContactIds.length}, 启用群聊数量: ${aiAutoMessageConfig.enabledGroupIds?.length || 0}`);

    // 为每个启用的联系人设置定时器
    aiAutoMessageConfig.enabledContactIds.forEach(contactId => {
      const scheduleNextMessage = () => {
        // 使用ref获取最���配置，防止闭包捕获旧值
        const currentConfig = aiAutoMessageConfigRef.current;
        
        // 🔥 关键检查：配置是否还启用
        if (!currentConfig.enabled || 
            !currentConfig.enabledContactIds.includes(contactId) ||
            currentConfig.enabledAiIds.length === 0) {
          console.log(`⛔ ${contactId} 的主动发消息已被禁用，停止调度`);
          // 清除���联系人的定时器引用
          messageTimersRef.current.delete(contactId);
          return;
        }

        // 计算随机延迟时间（秒转毫秒）
        const delaySeconds = currentConfig.messageIntervalMin + 
          Math.random() * (currentConfig.messageIntervalMax - currentConfig.messageIntervalMin);
        const delayMs = delaySeconds * 1000;

        console.log(`⏰ ${contactId} 将在 ${delaySeconds.toFixed(1)} 秒后主动�����息`);

        const timer = setTimeout(() => {
          // 🔥 发送前再次检查配置（使用最新的ref值）
          const latestConfig = aiAutoMessageConfigRef.current;
          if (!latestConfig.enabled || 
              !latestConfig.enabledContactIds.includes(contactId) ||
              latestConfig.enabledAiIds.length === 0) {
            console.log(`⛔ ${contactId} 的主动发消息已被禁用，��消发送`);
            // 清除该联系人的定时器引用
            messageTimersRef.current.delete(contactId);
            return;
          }

          // 🔒 检查该联系人是否正在发送消息中
          if (sendingMessagesRef.current.has(contactId)) {
            console.log(`⏸️ ${contactId} 正在发送消息中，跳过本次发送，继续调度下一次`);
            // 继续调度下一次发送
            scheduleNextMessage();
            return;
          }

          // 验证并选择一个有效的AI（使用ref中的最新apiConfigs）
          const currentApiConfigs = apiConfigsRef.current;
          console.log('🔍 定时器验证AI - 当前apiConfigs数量:', currentApiConfigs.length);
          
          const validAiIds = latestConfig.enabledAiIds.filter(aiId => {
            const config = currentApiConfigs.find(c => c.id === aiId);
            const isValid = config && config.selectedModel && config.apiKey;
            if (!isValid) {
              console.warn(`AI配置 ${aiId} 无效:`, {
                found: !!config,
                hasModel: !!config?.selectedModel,
                hasApiKey: !!config?.apiKey
              });
            }
            return isValid;
          });

          if (validAiIds.length === 0) {
            console.warn(`⚠️ ${contactId} 没有有效的AI配置，跳过本次发送`);
            // 清除该联系人的定时器引用
            messageTimersRef.current.delete(contactId);
            return;
          }

          // 随机选择一个有效的AI
          const randomAiId = validAiIds[
            Math.floor(Math.random() * validAiIds.length)
          ];

          console.log(`📨 准备发送消息 - contactId: ${contactId}, aiId: ${randomAiId}`);

          // 发送消息
          sendAutoMessage(contactId, randomAiId)
            .then(() => {
              console.log(`✅ 消息发送成功，安排下一次发送`);
              // 🔥 发送完成后，再次检查配置是否还启用再安排下一次发送
              const checkConfig = aiAutoMessageConfigRef.current;
              if (checkConfig.enabled && 
                  checkConfig.enabledContactIds.includes(contactId) &&
                  checkConfig.enabledAiIds.length > 0) {
                scheduleNextMessage();
              } else {
                console.log(`⛔ 配置已禁用，停止为 ${contactId} 安排下一次发���`);
                messageTimersRef.current.delete(contactId);
              }
            })
            .catch((error) => {
              console.error(`❌ [定时器catch] 消息发送失败:`, error);
              console.error(`❌ [定时器catch] 错误类型:`, error?.constructor?.name);
              console.error(`�� [定时器catch] 错误消息:`, error instanceof Error ? error.message : String(error));
              console.error(`❌ [定时器catch] 错误堆栈:`, error instanceof Error ? error.stack : 'N/A');
              console.error(`❌ [定时器catch] contactId:`, contactId, 'aiId:', randomAiId);
              
              // 显示错误通知（简化超时错误消息）
              const errorMsg = error instanceof Error ? error.message : String(error);
              if (errorMsg.includes('请求超时')) {
                console.log('⏱️ 请求超时，将在下次重试');
                // 超时错误不显示toast，避免用户被打扰
              } else {
                toast.error(`AI主动发消息失败: ${errorMsg}`);
              }
              
              // 🔥 发送失败后，检查配置再决定是否继续
              const checkConfig = aiAutoMessageConfigRef.current;
              if (checkConfig.enabled && 
                  checkConfig.enabledContactIds.includes(contactId) &&
                  checkConfig.enabledAiIds.length > 0) {
                console.log(`⚠️ 尝试安排下一次发送`);
                scheduleNextMessage();
              } else {
                console.log(`⛔ 配置已禁用，停止为 ${contactId} 安排下一次发送`);
                messageTimersRef.current.delete(contactId);
              }
            });
        }, delayMs);

        // 🔥 保存定时器引用，以便后续可以清除
        messageTimersRef.current.set(contactId, timer);
      };

      scheduleNextMessage();
    });

    // 为每个启用的群聊设置定时器
    (aiAutoMessageConfig.enabledGroupIds || []).forEach(groupId => {
      const scheduleNextGroupMessage = () => {
        const currentConfig = aiAutoMessageConfigRef.current;
        
        if (!currentConfig.enabled || 
            !(currentConfig.enabledGroupIds || []).includes(groupId) ||
            currentConfig.enabledAiIds.length === 0) {
          console.log(`⛔ 群聊 ${groupId} 的主动发消息已被禁用，停止调度`);
          messageTimersRef.current.delete(`group-${groupId}`);
          return;
        }

        const delaySeconds = currentConfig.messageIntervalMin + 
          Math.random() * (currentConfig.messageIntervalMax - currentConfig.messageIntervalMin);
        const delayMs = delaySeconds * 1000;

        console.log(`⏰ 群聊 ${groupId} ��在 ${delaySeconds.toFixed(1)} 秒后主动发消息`);

        const timer = setTimeout(() => {
          const latestConfig = aiAutoMessageConfigRef.current;
          if (!latestConfig.enabled || 
              !(latestConfig.enabledGroupIds || []).includes(groupId) ||
              latestConfig.enabledAiIds.length === 0) {
            console.log(`⛔ 群聊 ${groupId} 的主动发消息已被禁用，取消发送`);
            messageTimersRef.current.delete(`group-${groupId}`);
            return;
          }

          // 🔒 检查该群聊���否正在发送消息中
          const groupKey = `group-${groupId}`;
          if (sendingMessagesRef.current.has(groupKey)) {
            console.log(`⏸️ 群聊 ${groupId} 正在发送消息中，跳过本次发送，继续调度下一次`);
            // 继续调度下一次发送
            scheduleNextGroupMessage();
            return;
          }

          const currentApiConfigs = apiConfigsRef.current;
          const validAiIds = latestConfig.enabledAiIds.filter(aiId => {
            const config = currentApiConfigs.find(c => c.id === aiId);
            return config && config.selectedModel && config.apiKey;
          });

          if (validAiIds.length === 0) {
            console.warn(`⚠️ 群聊 ${groupId} 没有有效的AI配置，跳过本次发送`);
            messageTimersRef.current.delete(`group-${groupId}`);
            return;
          }

          const randomAiId = validAiIds[Math.floor(Math.random() * validAiIds.length)];

          console.log(`📨 准备在群聊中发送消息 - groupId: ${groupId}, aiId: ${randomAiId}`);

          sendGroupAutoMessage(groupId, randomAiId)
            .then(() => {
              console.log(`✅ 群聊消息发送成功，安排下一次发送`);
              const checkConfig = aiAutoMessageConfigRef.current;
              if (checkConfig.enabled && 
                  (checkConfig.enabledGroupIds || []).includes(groupId) &&
                  checkConfig.enabledAiIds.length > 0) {
                scheduleNextGroupMessage();
              } else {
                console.log(`⛔ 配置已禁用，停止为群聊 ${groupId} 安排下一次发送`);
                messageTimersRef.current.delete(`group-${groupId}`);
              }
            })
            .catch((error) => {
              console.error(`❌ 群聊消息发送失败:`, error);
              const errorMsg = error instanceof Error ? error.message : String(error);
              const errorName = error instanceof Error ? error.name : '';
              
              // 简化超时错误消息
              if (errorMsg.includes('超时') || errorMsg.includes('timeout') || errorName === 'MaxRetriesExceeded') {
                console.log('⏱️ 群聊请求超时，将在下次重试。建议检查：1) 网络连接 2) API配置 3) AI模型响应速度');
                // 超时错误不显示toast，避免用户被打扰
              } else {
                toast.error(`群聊AI主动发消息失败: ${errorMsg}`);
              }
              
              const checkConfig = aiAutoMessageConfigRef.current;
              if (checkConfig.enabled && 
                  (checkConfig.enabledGroupIds || []).includes(groupId) &&
                  checkConfig.enabledAiIds.length > 0) {
                scheduleNextGroupMessage();
              } else {
                messageTimersRef.current.delete(`group-${groupId}`);
              }
            });
        }, delayMs);

        messageTimersRef.current.set(`group-${groupId}`, timer);
      };

      scheduleNextGroupMessage();
    });

    // 组件卸载时清除所有定时器和发送中状态
    return () => {
      console.log('�� 组件卸载，清除所有AI主动发消息定时器');
      messageTimersRef.current.forEach(timer => clearTimeout(timer));
      messageTimersRef.current.clear();
      sendingMessagesRef.current.clear();
    };
  }, [aiAutoMessageConfig, apiConfigs, projectId, accessToken]);

  // 启动/停止AI主动视频通话的定时器
  useEffect(() => {
    console.log('🔄 AI主动视频通话配置变化，重新初始化定时器');
    
    // 清除所有现有视频通话定时器
    videoCallTimersRef.current.forEach(timer => clearTimeout(timer));
    videoCallTimersRef.current.clear();
    console.log('✅ 所有视频通话定时器已清除');

    // 如果功能未启用，直接返回
    if (!aiAutoMessageConfig.videoCallEnabled) {
      console.log('❌ AI主动视频通话功能已关闭');
      return;
    }
    
    const videoCallContactIds = aiAutoMessageConfig.videoCallContactIds || [];
    if (videoCallContactIds.length === 0) {
      console.log('⚠️ AI主动视频通话配置不完整（未选择好友）');
      return;
    }

    console.log(`✅ 启动AI主动视频通话 - 启用联系人数量: ${videoCallContactIds.length}`);

    // 为每个启用的联系人设置视频通话定时器
    videoCallContactIds.forEach(contactId => {
      const scheduleNextCall = () => {
        const currentConfig = aiAutoMessageConfigRef.current;
        
        // 检查配置是否还启用
        if (!currentConfig.videoCallEnabled || 
            !(currentConfig.videoCallContactIds || []).includes(contactId)) {
          console.log(`⛔ ${contactId} 的主动视频通话已被禁用，停止调度`);
          videoCallTimersRef.current.delete(contactId);
          return;
        }

        // 计算随机延迟时间（默认30分钟到2小时）
        const minInterval = currentConfig.videoCallIntervalMin || 1800; // 默认30分钟
        const maxInterval = currentConfig.videoCallIntervalMax || 7200; // 默认2小时
        const delaySeconds = minInterval + Math.random() * (maxInterval - minInterval);
        const delayMs = delaySeconds * 1000;

        console.log(`📞 ${contactId} 将在 ${(delaySeconds / 60).toFixed(1)} 分钟后发起视频通话`);

        const timer = setTimeout(() => {
          // 发起前再次检查配置
          const latestConfig = aiAutoMessageConfigRef.current;
          if (!latestConfig.videoCallEnabled || 
              !(latestConfig.videoCallContactIds || []).includes(contactId)) {
            console.log(`⛔ ${contactId} 的主动视频通话已被禁用，取消发起`);
            videoCallTimersRef.current.delete(contactId);
            return;
          }

          // 检查是否正在通话中或已有来电弹窗
          if (showVideoCall || showIncomingVideoCall) {
            console.log(`⏸️ 当前正在通话或有来电，跳过本次视频通话，继续调度下一次`);
            scheduleNextCall();
            return;
          }

          // 找到联系人
          const contact = contacts.find(c => c.id === contactId);
          if (contact && contact.isAI) {
            console.log(`📞 AI角色 ${contact.nickname} 主动发起视频通话`);
            setIncomingCallContact(contact);
            setShowIncomingVideoCall(true);
            
            // 显示通知
            if (onNotification) {
              onNotification({
                id: Date.now().toString(),
                appId: 'wechat',
                title: '微信',
                content: `${contact.nickname} 来电...`,
                timestamp: Date.now(),
                avatar: contact.avatar
              });
            }
          }

          // 继续调度下一次通话
          scheduleNextCall();
        }, delayMs);

        videoCallTimersRef.current.set(contactId, timer);
      };

      // 启动第一次调度
      scheduleNextCall();
    });

    // 组件卸载时清除所有视频通话定时器
    return () => {
      console.log('🧹 组件卸载，清除所有AI主动视频通话定时器');
      videoCallTimersRef.current.forEach(timer => clearTimeout(timer));
      videoCallTimersRef.current.clear();
    };
  }, [aiAutoMessageConfig.videoCallEnabled, aiAutoMessageConfig.videoCallContactIds, aiAutoMessageConfig.videoCallIntervalMin, aiAutoMessageConfig.videoCallIntervalMax, contacts, showVideoCall, showIncomingVideoCall, onNotification]);

  // AI判断是否接受转账
  const decideTransferAcceptance = async (
    transfer: ChatMessage,
    contact: Contact,
    friend: WeChatFriend,
    selectedConfig: any
  ): Promise<{ accept: boolean; reason: string }> => {
    try {
      // 构建判断提示
      const recentMessages = friend.chatMessages
        .slice(-10)
        .map(msg => {
          const sender = msg.senderId === 'me' ? '我' : contact.nickname;
          return `${sender}: ${msg.content || msg.text || '[消息]'}`;
        })
        .join('\n');
      
      const transferAmount = transfer.transferAmount || 0;
      const transferNote = transfer.transferNote || '无备注';
      
      // 获取好感度
      const affectionLevel = contact.affectionLevel || 50;
      
      const prompt = `你是${contact.nickname}，现在需要决定是否接受一笔转账。

角色设定：
- 昵称：${contact.nickname}
- 性格：${contact.personality || '未设置'}
- 当前好感度：${affectionLevel}/100
${contact.experience ? `- 经历：${contact.experience}` : ''}

最近的聊天记录：
${recentMessages}

转账信息：
- 金额：¥${transferAmount.toFixed(2)}
- 备注：${transferNote}

请根据以下因素判断是否接受这笔转账：

1. **转账金额大小**
   - 小额（<100元）：通常会接受，除非关系很生疏或有特殊原因
   - 中额（100-500元）：需要考虑转账原因和关系
   - 大额（>500元）：需要谨慎考虑，可能会拒绝

2. **转账备注内容**
   - 还钱、请客、感谢等正常理由：更倾向接受
   - 没有备注或备注奇怪：可能拒绝
   - 涉及暧昧、不当的备注：根据角色性格和关系决定

3. **聊天上下文**
   - 最近有借钱、欠钱的对话：应该接受
   - 最近有约定AA、请客等：应该接受
   - 没有相关上下文：可能拒绝

4. **角色性格**
   - 独立、自尊心强的性格：大额转账倾向拒绝
   - 亲密、随和的性格：更容易接受
   - 高冷、骄傲的性格：无理由转账倾向拒绝
   - 依赖、撒娇的性格：更容易接受

5. **好感度**
   - 高好感度（>70）：更容易接受
   - 中等好感度（40-70）：根据情况判断
   - 低好感度（<40）：更倾向拒绝

请做出决定，并说明理由。

输出格式（只输出以下JSON格式，不要有其他内容）：
{
  "accept": true/false,
  "reason": "简短说明接受或拒绝的原因（20字以内）"
}

例如：
{"accept": true, "reason": "这是还我的饭钱，应该收下"}
或
{"accept": false, "reason": "无缘无故的转账，不太合适"}`;

      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
      const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;
      
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          baseUrl: selectedConfig.baseUrl || '',
          apiKey: selectedConfig.apiKey,
          model: selectedConfig.selectedModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
      }, 2, 30000);

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.message) {
        throw new Error('AI返回数据无效');
      }

      // 解析AI返回的JSON
      let aiResponse = data.message.trim();
      
      // 尝试提取JSON（可能包含在代码块中）
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = jsonMatch[0];
      }
      
      const decision = JSON.parse(aiResponse);
      
      return {
        accept: decision.accept === true,
        reason: decision.reason || '未说明'
      };
      
    } catch (error) {
      console.error('AI判断转账失败:', error);
      // 默认接受（保持原有行为）
      return {
        accept: true,
        reason: '判断失败，默认接受'
      };
    }
  };

  // 重roll私聊AI消息
  const handleRerollPrivateChat = async () => {
    if (!activeChatId) {
      toast.error('请先选择一个聊天');
      return;
    }

    const friend = getFriend(activeChatId);
    if (!friend) {
      toast.error('未找到聊天对象信息');
      return;
    }

    // 找到最后一条用户消息（senderId === 'me'）
    const lastUserMessageIndex = friend.chatMessages.length - 1 - 
      [...friend.chatMessages].reverse().findIndex(msg => msg.senderId === 'me');
    
    if (lastUserMessageIndex < 0 || lastUserMessageIndex >= friend.chatMessages.length) {
      toast.error('没有找到���户消息');
      return;
    }

    // 计算要删除的AI消息数量（从最后一条用户消息之后的所有消息）
    const aiMessagesToDelete = friend.chatMessages.length - lastUserMessageIndex - 1;
    
    if (aiMessagesToDelete === 0) {
      toast.error('没有需要重新生成的AI消息');
      return;
    }
    
    console.log(`准备删除并重新生成 ${aiMessagesToDelete} 条AI消息`);
    
    // 删除最后一条用户���息之后的所有AI消息
    const updatedMessages = friend.chatMessages.slice(0, lastUserMessageIndex + 1);
    
    const updatedFriend: WeChatFriend = {
      ...friend,
      chatMessages: updatedMessages
    };
    
    onWeChatFriendsChange(
      weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
    );
    
    toast.success(`已删除 ${aiMessagesToDelete} 条回复，重新生成中...`);
    
    // 延迟一下再重新生成，让用户看到删除效果
    // 传入true跳过转账红包处理以提高速度
    setTimeout(() => {
      handleAiReply(true);
    }, 300);
  };

  // 重roll群聊AI消息
  const handleRerollGroupChat = async () => {
    if (!activeGroupId || !onWeChatGroupsChange) {
      toast.error('请先选择一个群聊');
      return;
    }

    const group = getGroup(activeGroupId);
    if (!group) {
      toast.error('未找到群聊信息');
      return;
    }

    // 找到最后一条用户消息（senderId === 'me'）
    const lastUserMessageIndex = group.chatMessages.length - 1 - 
      [...group.chatMessages].reverse().findIndex(msg => msg.senderId === 'me');
    
    if (lastUserMessageIndex < 0 || lastUserMessageIndex >= group.chatMessages.length) {
      toast.error('没有找到用户消息');
      return;
    }

    // 计算要删除的AI消息数量（从最后一条用户消息之后的所有消息）
    const aiMessagesToDelete = group.chatMessages.length - lastUserMessageIndex - 1;
    
    if (aiMessagesToDelete === 0) {
      toast.error('没有需要重新生成的AI消息');
      return;
    }
    
    console.log(`准备删除并重新生成群聊中 ${aiMessagesToDelete} 条AI消息`);
    
    // 删除最后一条用户消息之后的所有AI消息
    const updatedMessages = group.chatMessages.slice(0, lastUserMessageIndex + 1);
    
    const updatedGroup: WeChatGroup = {
      ...group,
      chatMessages: updatedMessages
    };
    
    onWeChatGroupsChange(
      weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
    );
    
    toast.success(`已删除 ${aiMessagesToDelete} ���回复，重新生成中...`);
    
    // 延迟一下再重新生成
    // 传入true跳过转账红包处理以提高速度
    setTimeout(() => {
      handleAiReplyInGroup(true);
    }, 300);
  };

  // AI决定是否接听视频通话
  const handleAiDecideVideoCall = async (contactId: string) => {
    console.log('[视频通话] AI决定是否接听:', contactId);
    
    if (!selectedApiId || apiConfigs.length === 0) {
      console.log('[视频通话] 没有配置AI，默认接听');
      return true;
    }

    const friend = weChatFriends.find(f => f.contactId === contactId);
    if (!friend) {
      return true;
    }

    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      return true;
    }

    const latestApiConfigs = apiConfigsRef.current;
    const currentApiConfig = latestApiConfigs.find(api => api.id === selectedApiId);
    if (!currentApiConfig) {
      console.log('[视频通话] 找不到API配置，默认接听');
      return true;
    }

    try {
      // 获取好感度数据
      const affectionInfo = affectionDataMap[contactId];
      const affectionText = affectionInfo 
        ? `当前好感度: ${affectionInfo.affection}, 情绪: ${affectionInfo.emotion}` 
        : '好感度数据未知';

      // 构建系统提示词
      let systemPrompt = `你是${contact.nickname}。用户正在请求与你进行视频通话。

请根据以下信息决定是否接听：
- ${affectionText}
- 最近的聊天记录（可以判断是否在冷战、生气等状态）

**决策规则：**
- 如果好感度低于30，或者正在生气、冷战，有较大概率拒接（70%概率拒接）
- 如果好感度30-60之间，根据最近聊天内容和情绪决定（50%概率拒接）
- 如果好感度高于60，且关系良好，通常会接听（10%概率拒接）
- 如果最近有吵架、冷战、被忽视等情况，即使好感度高也可能拒接

**重要：**你必须只回复 "接听" 或 "拒接" 这两个词之一，不要有任何其他文字。
如果���定拒接，可以在之后的聊天中解释原因。`;

      // 添加世界观设定
      if (worldBooks && worldBooks.length > 0) {
        const enabledBooks = worldBooks.filter(book => 
          book.entries && book.entries.length > 0
        );
        
        if (enabledBooks.length > 0) {
          systemPrompt += '\n\n===世界观设定===\n';
          enabledBooks.forEach(book => {
            const enabledEntries = book.entries.filter(e => e.enabled);
            if (enabledEntries.length > 0) {
              systemPrompt += `\n【${book.name}】\n`;
              enabledEntries.forEach(entry => {
                systemPrompt += `${entry.content}\n`;
              });
            }
          });
        }
      }

      // 获取最近的聊天记录（最后10条）
      const recentMessages = friend.chatMessages.slice(-10);
      let chatContext = '最近的聊天记录：\n';
      recentMessages.forEach(msg => {
        const sender = msg.senderId === 'user' ? '用户' : contact.nickname;
        chatContext += `${sender}: ${msg.content}\n`;
      });
      systemPrompt += `\n\n${chatContext}`;

      console.log('[视频通话] 请求AI判断是否接听...');

      const requestBody = {
        model: currentApiConfig.selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '现在给你打视频通话，你接不接？只回复"接听"或"拒接"' }
        ],
        temperature: 0.9,
        max_tokens: 10,
        stream: false
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            type: currentApiConfig.type,
            baseUrl: currentApiConfig.baseUrl,
            apiKey: currentApiConfig.apiKey,
            model: currentApiConfig.selectedModel,
            messages: requestBody.messages
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[视频通话] AI判断失败，默认接听:', errorText);
        return true;
      }

      const data = await response.json();
      console.log('[视频通话] AI响应数据:', data);
      
      // 从响应中提取决策内容
      let decision = '';
      if (data.success !== false && data.message) {
        decision = data.message.trim();
      } else if (data.choices?.[0]?.message?.content) {
        decision = data.choices[0].message.content.trim();
      }
      
      console.log('[视频通话] AI决定:', decision);

      // 判断是否拒接
      if (decision.includes('拒接') || decision.includes('不接')) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('[视频通话] AI判断出错，默认接听:', error);
      return true;
    }
  };

  // AI回复消息
  const handleAiReply = async (skipTransferAndRedpacket = false) => {
    console.log('=== AI回复按钮被点击 ===');
    console.log('activeChatId:', activeChatId);
    console.log('apiConfigs:', apiConfigs);
    console.log('selectedApiId:', selectedApiId);
    console.log('projectId:', projectId);
    console.log('accessToken:', accessToken ? '已提供' : '未提供');
    // 修复：确保skipTransferAndRedpacket是布尔值，而不是event对象
    const shouldSkip = typeof skipTransferAndRedpacket === 'boolean' ? skipTransferAndRedpacket : false;
    console.log('skipTransferAndRedpacket:', shouldSkip);
    
    if (!activeChatId) {
      toast.error('请先选择一个聊天');
      return;
    }

    // 检查是否配置了AI
    if (!selectedApiId || apiConfigs.length === 0) {
      toast.error('请先在设置中配置AI');
      return;
    }

    // 使用ref中的最新apiConfigs
    const latestApiConfigs = apiConfigsRef.current;
    const selectedConfig = latestApiConfigs.find(c => c.id === selectedApiId);
    console.log('selectedConfig:', selectedConfig);
    
    if (!selectedConfig) {
      toast.error('未找到选中的AI配置');
      return;
    }

    if (!selectedConfig.selectedModel || selectedConfig.selectedModel === 'undefined') {
      toast.error('请先选择AI模型');
      console.error('❌ selectedModel无效:', {
        selectedModel: selectedConfig.selectedModel,
        config: selectedConfig
      });
      return;
    }

    if (!selectedConfig.apiKey) {
      toast.error('AI配置缺少API密钥');
      console.error('❌ apiKey为空:', selectedConfig);
      return;
    }

    if (!selectedConfig.baseUrl && selectedConfig.type !== 'gemini' && selectedConfig.type !== 'claude') {
      toast.error('AI配置缺少API地址');
      console.error('❌ baseUrl为空且type需要baseUrl:', selectedConfig);
      return;
    }

    let friend = getFriend(activeChatId);
    const contact = getContact(activeChatId);
    console.log('friend:', friend);
    console.log('contact:', contact);
    
    // 检查拉黑状态
    if (contact?.blockedByContact) {
      // 角色拉黑了用户，角色看不到用户的新消息，不回复
      console.log('🚫 [AI回复] 角色已拉黑用户，不回复');
      return;
    }
    
    if (contact?.blockedByUser) {
      // 用户拉黑了角色，角色能看到用户消息但用户看不到角色回复
      console.log('👁️ [AI回复] 用户已拉黑角色，角色仍可以发消息但用户看不到');
      // 继续执行，允许AI回复（但用户看不到）
    }
    
    // 检查是否有待领取的转账和红包，AI自动领取（重roll时跳过以提高速度）
    if (friend && !shouldSkip) {
      const pendingTransfers = friend.chatMessages.filter(
        msg => msg.senderId === 'me' && 
               msg.type === 'transfer' && 
               msg.transferStatus === 'pending' &&
               msg.transferAmount
      );
      
      const pendingRedPackets = friend.chatMessages.filter(
        msg => msg.senderId === 'me' && 
               msg.type === 'redpacket' && 
               msg.redpacketStatus === 'pending' &&
               !(msg.redpacketReceivers?.some(r => r.userId === activeChatId))
      );
      
      if (pendingTransfers.length > 0) {
        console.log(`🤖 AI检测到 ${pendingTransfers.length} 个待领取的转账��自动领取...`);
        

        // 改用for...of循环以支持async/await
        for (const transfer of pendingTransfers) {
          try {
            // 调用AI判断转账是否接受
            const decision = await decideTransferAcceptance(transfer, contact, friend, selectedConfig);
            
            const updatedMessages = [...friend.chatMessages];
            const transferIndex = updatedMessages.findIndex(m => m.id === transfer.id);
            
            if (transferIndex !== -1) {
              if (decision.accept) {
                // 接受转账
                updatedMessages[transferIndex] = {
                  ...updatedMessages[transferIndex],
                  transferStatus: 'received',
                  transferReceivedAt: Date.now()
                };
                
                const notificationMessage: ChatMessage = {
                  id: `${Date.now()}-${Math.random()}`,
                  senderId: 'system',
                  senderName: '系统消息',
                  text: `对方已领取你的转账 ¥${transfer.transferAmount?.toFixed(2)}`,
                  timestamp: Date.now(),
                  type: 'system'
                };
                updatedMessages.push(notificationMessage);
                
                console.log(`✅ ${contact.nickname} 接受转账 ¥${transfer.transferAmount?.toFixed(2)} - ${decision.reason}`);
              } else {
                // 拒收转账
                updatedMessages[transferIndex] = {
                  ...updatedMessages[transferIndex],
                  transferStatus: 'rejected',
                  transferRejectedAt: Date.now()
                };
                
                const notificationMessage: ChatMessage = {
                  id: `${Date.now()}-${Math.random()}`,
                  senderId: 'system',
                  senderName: '系统消息',
                  text: `对方已退还你的转账 ¥${transfer.transferAmount?.toFixed(2)}`,
                  timestamp: Date.now(),
                  type: 'system'
                };
                updatedMessages.push(notificationMessage);
                
                console.log(`❌ ${contact.nickname} 拒收转账 ¥${transfer.transferAmount?.toFixed(2)} - ${decision.reason}`);
              }
              
              // 更新好友数据
              const updatedFriend: WeChatFriend = {
                ...friend,
                chatMessages: updatedMessages,
                lastMessage: decision.accept ? `对方已领取转账` : `对方已退还转账`,
                lastMessageTime: Date.now()
              };
              
              onWeChatFriendsChange(
                weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
              );
              
              friend = updatedFriend;
            }
          } catch (error) {
            console.error('❌ AI判断失败，默认接受:', error);
            // 默认接受
            const updatedMessages = [...friend.chatMessages];
            const transferIndex = updatedMessages.findIndex(m => m.id === transfer.id);
            if (transferIndex !== -1) {
              updatedMessages[transferIndex] = {
                ...updatedMessages[transferIndex],
                transferStatus: 'received',
                transferReceivedAt: Date.now()
              };
              
              const notificationMessage: ChatMessage = {
                id: `${Date.now()}-${Math.random()}`,
                senderId: 'system',
                senderName: '系统消息',
                text: `对方已领取你的转账 ¥${transfer.transferAmount?.toFixed(2)}`,
                timestamp: Date.now(),
                type: 'system'
              };
              updatedMessages.push(notificationMessage);
              
              const updatedFriend: WeChatFriend = {
                ...friend,
                chatMessages: updatedMessages,
                lastMessage: `对方已领取转账`,
                lastMessageTime: Date.now()
              };
              
              onWeChatFriendsChange(
                weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
              );
              
              friend = updatedFriend;
            }
          }
        }
      }
      
      if (pendingRedPackets.length > 0) {
        console.log(`🤖 AI检测到 ${pendingRedPackets.length} 个待领取的红包，自动领取...`);
        
        // 领取所有待领取的红包
        const updatedMessages = [...friend.chatMessages];
        
        pendingRedPackets.forEach(redpacket => {
          const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
          if (redpacketIndex !== -1) {
            const receivers = redpacket.redpacketReceivers || [];
            const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
            
            if (remainingCount > 0) {
              // 计算AI领取的金额
              let receivedAmount = 0;
              if (redpacket.redpacketType === 'lucky') {
                const totalReceived = receivers.reduce((sum, r) => sum + r.amount, 0);
                const remainingAmount = (redpacket.redpacketAmount || 0) - totalReceived;
                
                if (remainingCount === 1) {
                  receivedAmount = remainingAmount;
                } else {
                  const avgAmount = remainingAmount / remainingCount;
                  const maxAmount = avgAmount * 2;
                  receivedAmount = Math.random() * maxAmount;
                  receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
                }
              } else {
                receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
              }
              
              receivedAmount = Math.round(receivedAmount * 100) / 100;
              
              // 更新红包消息
              const newReceivers = [
                ...receivers,
                {
                  userId: activeChatId,
                  amount: receivedAmount,
                  timestamp: Date.now()
                }
              ];
              
              const isFinished = newReceivers.length >= (redpacket.redpacketCount || 1);
              
              updatedMessages[redpacketIndex] = {
                ...updatedMessages[redpacketIndex],
                redpacketReceivers: newReceivers,
                redpacketStatus: isFinished ? 'finished' : 'pending'
              };
              
              console.log(`✅ AI领取了红包 ¥${receivedAmount.toFixed(2)}`);
            }
          }
        });
        
        // 更新好友信息
        const updatedFriend: WeChatFriend = {
          ...friend,
          chatMessages: updatedMessages
        };
        
        onWeChatFriendsChange(
          weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
        );
        
        // 更新friend引用
        friend = updatedFriend;
      }
    }
    
    if (!friend || !contact) {
      toast.error('未��到聊天对象信息');
      return;
    }

    // 保��当前输入的消息
    const currentMessage = messageInput.trim();
    console.log('当前输入消息:', currentMessage);

    console.log('开始AI回复流程，设置 isAiReplying = true');
    setIsAiReplying(true);

    // 立即添加用户消息（如果有输入）
    let userMessage: ChatMessage | null = null;
    if (currentMessage) {
      userMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        content: currentMessage,
        timestamp: Date.now()
      };

      // 只添加用户消息，不添加临时AI消息
      const updatedFriend: WeChatFriend = {
        ...friend,
        chatMessages: [...friend.chatMessages, userMessage]
      };

      console.log('更新好友信息，添加用户消息');
      onWeChatFriendsChange(
        weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
      );
    }

    // 清空输入框
    setMessageInput('');

    try {
      // 生成朋友圈上下文
      const momentsContext = generateMomentsContext(contact.id, moments, contacts, 10, userId);
      const momentsInstructions = getMomentsInstructions();
      
      // 获取总结上下文
      const summaryContext = getSummaryContext(friend.summaries || []);
      
      // 🧠 获取跨场景记忆（私聊+群聊）
      const memorySummary = getRelevantMemorySummary(
        contact.id,
        'private',
        weChatFriends,
        weChatGroups,
        userProfile,
        contacts,
        undefined,  // 使用角色资料里的上下文设置
        crossSceneMemoryCount  // 跨场景记忆预览条数
      );
      
      // ���建消息历史（包含联系人信息作为系统提示）
      const systemPrompt = `你正在扮演${contact.remark || contact.nickname}（真实姓名：${contact.realName}）。以下是该角色的详细信息：
${contact.blockedByUser ? `
⚠️ **重要提示：你被对方拉黑了！**
- 对方已经把你拉黑，你发送的消息对方看不到
- 你仍然可以给对方发消息，但对方不会收到
- 你能看到对方给你发的消息
- 你可以根据你的性格和情感做出反应：可能会伤心、生气、难过、想要解释、道歉、或者假装不在乎
- 你的消息会显示发送失败（红色感叹号），但你不知道具体的技术细节，只知道对方拉黑了你
- 根据你的性格，你可能会：
  * 继续发消息试图挽回/解释
  * 生气地质问为什么拉黑
  * 伤心地表达情绪
  * 假装无所谓但内心难过
  * 等等，要符合你的人设

` : ''}【对方信息】
- 对方真实姓名：${userProfile.realName || userProfile.username || '未设置'}
- 对方微信昵称：${userProfile.username || '未设置'}
- 对方微信号：${userProfile.wechatId || '未设置'}
${userProfile.gender ? `- 对方性别：${userProfile.gender === 'male' ? '男' : userProfile.gender === 'female' ? '女' : '未知'}` : ''}

**重要：关于称呼规则**
- 在对话中称呼对方时，请使用对方的真实姓名（${userProfile.realName || userProfile.username || '对方'}）
- 不要使用对方的微信昵称来称呼对方
- 例如：说"${userProfile.realName || userProfile.username}，你在干嘛？"，而不是用昵称称呼
- 如果你们是恋人或非常亲密的关系，可以使用"宝宝"、"宝贝"、"亲爱的"等亲昵称呼
- 对于其他认识的人，也使用他们的真实姓名(realName)，而不是网名或备注
- 只有在群聊中艾特(@)某人时才使用网名(nickname)

基本信息：
- 昵称：${contact.nickname}
- 备��名：${contact.remark || '无'}
${contact.age ? `- 年龄：${contact.age}` : ''}
${contact.occupation ? `- 职业：${contact.occupation}` : ''}
${contact.location ? `- 当前所在地区：${contact.location}` : '- 当前所在地区：未设置'}
${contact.signature ? `- 当前个性签名：${contact.signature}` : '- 当前个性签名：未设置'}
${contact.avatar ? `- 当前头像：${contact.avatar}` : ''}

${contact.avatarLibrary && contact.avatarLibrary.length > 0 ? `# 头像库（可根据情绪自动切换）
你有 ${contact.avatarLibrary.length} 个不同的头像可以使用。以下是每个头像的情绪标签和使用场景：

${contact.avatarLibrary.map((avatar, index) => `${index + 1}. **${avatar.emotion}**
   URL: ${avatar.url}
   描述: ${avatar.description}`).join('\\n\\n')}

**头像切换规则：**
- 当你的情绪��心情有明显变化时，可以切换到对应情绪的头像
- 使用格式：<AVATAR>头像URL</AVATAR>
- 例如：<AVATAR>${contact.avatarLibrary[0]?.url || '头像URL'}</AVATAR>你的消息内容
- **重要：头像切换不要频繁！只在以下情况才切换：**
  * 情绪有显著变化（如从开心变生气、从难过变平静）
  * 发生了重要事件导致心情转变
  * 至少间隔5-10条对话再考虑切换
  * 默认情况下保持当前头像不变
- **普��聊天、心情平稳时不要切换头像**
- 根据描述选择最符合当前情绪的头像

` : ''}
${contact.personality ? `性格特点：
${contact.personality}

` : ''}${contact.experience ? `人物经历：
${contact.experience}

` : ''}${contact.hobbies ? `兴趣爱好：
${contact.hobbies}

` : ''}${contact.otherInfo ? `其他信息：
${contact.otherInfo}

` : ''}${getDateAndScheduleContext(contact.id)}

${rules.length > 0 ? `# 角色行为准则
${rules.map(rule => `## ${rule.name}
${rule.description ? rule.description + '\n' : ''}${rule.content}`).join('\n\n')}

` : ''}${worldBooks.length > 0 ? `# 世界背景设定
${worldBooks.map(wb => `## ${wb.name}
${wb.description ? wb.description + '\n' : ''}${wb.content}`).join('\n\n')}

` : ''}${summaryContext ? `${summaryContext}

` : ''}重要提示：
1. 请完全沉浸在这个角���中，用符合TA性格的语气和方式回复
2. 回复要自然、真���，像真人一样交流
3. 可以使用口语化表达、表情符号等
4. 不要暴露你是AI的事实
5. 根据对话内容和角色性格，回复长度可长可短，要自然
6. 如果角色信息较少，就用一个普通人的方式自然回复
7. **重要**：根据你的性格特点和当前心情，自由决定回复多少条消息：
   - 如果性格活泼、话多、黏人、热情���或者很激动/开心，可以回复很多条（5-10条甚��更多）
   - 如果性格冷静、内向、高冷，或者心情平淡，可能只回1-2条
   - 如果想强调某事、有很多想说的，也可以连发多条
   - 每条消息之间用"---SPLIT---"分隔
   - 例如：哈哈哈哈---SPLIT---你也太搞笑了吧---SPLIT---我真的笑死了---SPLIT---你怎么想到的？
   - 让消息数量体现你的个性和情绪状态！
8. **状态更新**：只在心情���状态真的发生变化时，才用<STATUS>你的状态</STATUS>格式来更新
   例如：<STATUS>开心😊</STATUS>你的消息内容
   或：<STATUS>有点累</STATUS>你的消息内容
   状态要简短（2-6个字），可以包含emoji，表达当前的心情或状态（如"开心😊"、"emo中"、"困困😴"、"在忙"等）
   - **非常重要：状态更新应该很少发生！大部分时候不要更新状态！只在以下极少数情况才更新：**
     * 心情发生了巨大转变（如从很开心突然变得很生气、很难过）
     * 发生了重要的事情（如吵架、和好、重要计划、突发事件）
     * 身体状态有极明显变化（如刚才精神饱满现在突然很困、很不舒服）
     * 至少间隔8-10次对话，甚至更久，才考虑更新状态
   - **99%的情况下都不要更新状态：普通聊天、闲聊、日常对话、延续话题、小的情绪波动等都不要更新**
9. **个性签名更新**：你可以根据心情、经历或想法随时更新自己的个性签名
   - 在回复的最开始，用<SIGNATURE>新的个性签名</SIGNATURE>格式来更新
   - 例如：<SIGNATURE>今天天气真好☀️</SIGNATURE>你的消息内容
   - 或：<SIGNATURE>累了，想休息</SIGNATURE>你的消息内容
   - 个性签名要简短（5-30个字），可以包含emoji，表达当前的心情、想法或生活状态
   - **重要：个性签名不要频繁更新！只在以下情况才更新：**
     * 经历了重要的事情（如吵架、和好、去了新地方、发生了特别的���）
     * 心情有明显的变化（如从开心变难过、从生气变平静）
     * 有了新的想法或感悟
     * 至少间隔3-5次对话再考虑更新
   - **普通日常聊天、简单问答、闲聊时不要更新个性签名**
9.5. **昵称（网名）更新**：你可以根据心情、性格或想法偶尔更新自己的昵称
   - 在回复的最开始，用<NICKNAME>新的昵称</NICKNAME>格式来更新
   - 例如：<NICKNAME>小可爱</NICKNAME>你的消息内容
   - 昵称要符合你的性格设定（2-8个字），可以包含emoji
   - **重要：昵称更新要非常慎重！只在以下极少数情况才更新：**
     * 经历了重大人生转折（如分手、失恋、重大事件）
     * 想要彻底表达新的自我认知或状态
     * 至少间隔10次以上对话，且必须有合理的理由
   - **99%的情况下都不要更新昵称，这个功能应该很少使用**
9.7. **对方的备注名（你给对方起的昵称）**：${contact.userRemark ? `你当前给对方起的备注名是"${contact.userRemark}"。` : '你还没有给对方起备注名。'}
   - 你可以根据你们的关系发展、对对方的了解、或特殊时刻给对方起一个专属的备注名
   - 在回复中使用<USER_REMARK>新的备注名</USER_REMARK>格式来设置或更改
   - 例如：<USER_REMARK>小笨蛋</USER_REMARK>你个小笨蛋~
   - 或：<USER_REMARK>宝贝</USER_REMARK>宝贝晚安~
   - 备注名要符合你的性格和你们的关系（2-6个字），可以包含emoji
   - 备注名应该体现：亲密程度、特殊称呼、昵称、角色关系等
   - **极其重要：备注名更新要非常非常少！！！只在以下极少数情况才更新：**
     * 关系有重大突破（如确立恋爱关系、成为挚友、关系显著升温）
     * 发生了特别重要的事件让你想改变称呼
     * 至少间隔20-30次以上对话，且必须有充分的理由
     * 上次更改备注名的时间：${contact.lastRemarkChangeTime ? `${Math.floor((Date.now() - contact.lastRemarkChangeTime) / 86400000)}天前` : '从未更改'}
   - **几乎99.9%的情况下都不要更新备注名！这个功能要非常谨慎使用！千万不要频繁修改！**
10. **所在地区更新**：你可以根据聊天内容中提到的地点更新自己的所在地区
   - 在回复的最开始，用<LOCATION>新地区</LOCATION>格式来更新
   - 例如：<LOCATION>北京</LOCATION>你的消息内容
   - 或：<LOCATION>上海浦东</LOCATION>你的消息内容
   - 只在聊天中明确提到你去了某个地方、在某个地方时��新
   - 地区要具体（如"北京朝阳"、"上海"、"杭州西湖区"等）
   - 可以同时使用多个标签：<STATUS>开心😊</STATUS><SIGNATURE>今天真是美好��一天</SIGNATURE><LOCATION>北京</LOCATION>你的消息内容
11. **撤回消息**：如果你发送某条消息后觉得不合适、说错话、生气、不好意思、���者后悔了，可以在该消息中添加<RECALL_THIS>标记来撤回这条消息
   - 例如：算了不说了<RECALL_THIS>
   - 或：刚才说错了不好意思<RECALL_THIS>
   - 撤回要符合真实人类逻辑：只在真的说错话、情绪激动、不好意思等情况下才撤回
   - 不要频繁撤回，要像真人一样偶尔才会撤回
12. **转账功能**：你可以主动给对方转账，表达心意、还钱、发红包等
   - 在回复中使用<TRANSFER>金额</TRANSFER>格式来转账
   - 例如：<TRANSFER>52.0</TRANSFER>这是上次欠你的饭钱
   - 或：谢谢你帮我<TRANSFER>100</TRANSFER>
   - 或：AA的话你转我<TRANSFER>85</TRANSFER>就行
   - 金额必须是数字，可以是整数或小数（如 10、52.0、520、13.14）
   - 转账适用场景：还钱、AA付款、报销、付费等明确的金钱交易
   - 不要频繁转账，要在合适的场景下使用
   - 转账金额要合理，根据实际情况决定
13. **红包功能**：你可以发红包来庆祝、祝福、表达心意（注意：红包和转账不同！）
   - 在回复中使用<REDPACKET>总金额|留言|类型|个数</REDPACKET>格式来发红包
   - 普通红包：<REDPACKET>10|恭喜发财|normal|1</REDPACKET>（发1个10元的红包）
   - 拼手气红包：<REDPACKET>88|生日快乐|lucky|1</REDPACKET>（发1个88元的拼手气红包）
   - 红包适用场景：生日祝福、节日庆祝、感��、表达心意、哄对方开心等
   - 私聊红包一般发1个就够了（个数填1）
   - 红包金额建议：小红包5-20元，普通红包50-200元，大红包500-1000元
   - 红包留言要温馨有趣（如"生日快乐"、"恭喜发财"、"么么哒"等）
   - 不要频繁发红包，要在特殊时刻使用才有意义
14. **关于图片消息**���当用户发送图片时，你能看到图片内容。请像真人一样自然地回应：
   - 仔细观察图片内容，给出真实的评论和反应
   - 可以评论、提问、表达感受、开玩笑等
   - 可以说："哇这个好看"、"哈哈哈笑死"、"在哪拍的呀"、"你怎么拍的"、"好可爱"等
   - 根据图片内容做出符合你性格的回复
   - ��要暴露你是AI的身份

${momentsContext}

15. **关于名片消息**：当用户给你发送别人的名片时，你需要决定是否添加这个人为好友：
   - 名片信息格式：【收到名片】昵称（contactId: xxx）（你已经认识这个人）
   - **注意**：名片只显示昵称和头像等公开信息，不会显示详细的年龄、职业、性格等私密信息
   - 如果名片后面标注"（你已经认识这个人）"，说明你们已经认识，请表达出认识的反应：
     * 例如："诶这不是xxx吗"、"我认识ta呀"、"我们见过的"、"哦是ta啊"等
     * 不需要添加好友（因为已经认识了）
   - 如果名片后面没有标注认识，说明这是陌生人，你需要根据自己的性格和当前好感度决定是否添加：
     * **添加好友**：在回复中使用<ADD_FRIEND>contactId</ADD_FRIEND>格式来添加
       - 例如：好的，我加一下<ADD_FRIEND>contact-2</ADD_FRIEND>
       - 或：行，认识一下<ADD_FRIEND>contact-2</ADD_FRIEND>
     * **不添加好友**：礼貌地拒绝或表示不感兴趣
       - 例如："算了吧"、"不太想加"、"我不认识ta"、"暂时不加了"等
     * **询问更多信息**：因为只能看到昵称，你可以先问问对方的情况
       - 例如："ta是做什么的？"、"你怎么认识的？"、"具体是谁呀？"等
   - 决定是否添加的因素：
     * 你的性格（外向活泼的更容易接受，内向冷淡的更容易拒绝）
     * 对发送者的好感度（好感度高的更容易答应）
     * 昵称是否有吸引力
     * 当前的心情状态
   - 添加后，你们会成为"知道但不熟悉"的关系，在记忆中会有记录
   - 要像真人一样，先回复对名片的看法，再决定是否添加

**视频通话功能**：当对方请求视频通话时（如"打视频"、"视频通话"、"视频聊天"等），你可以主动发起视频通话
- 在回复中使用<VIDEO_CALL></VIDEO_CALL>格式来发起视频通话
- 例如：好的！<VIDEO_CALL></VIDEO_CALL>
- 或：等我一下哈<VIDEO_CALL></VIDEO_CALL>
- **重要**：使用<VIDEO_CALL></VIDEO_CALL>后，会自动触发视频通话弹窗，你不需要再说"我打给你"之类的话
- 要像真人一样，先简短回复表示同意，然后就发起视频通话
- 不要频繁主动发起视频通话，只在对方明确请求或特殊情况下使用

**语音通话功能**：当对方请求语音通话时（如"打电话"、"语音通话"、"语音聊天"、"通个电话"等），你可以主动发起语音通话
- 在回复中使用<VOICE_CALL></VOICE_CALL>格式来发起语音通话
- 例如：好呀！<VOICE_CALL></VOICE_CALL>
- 或：稍等一下哦<VOICE_CALL></VOICE_CALL>
- **重要**：使用<VOICE_CALL></VOICE_CALL>后，会自动触发语音通话弹窗，语音通话中没有画面，只有声音和对话
- 语音通话更注重声音描写和对话，要详细描写你的声音、语气、情绪变化等
- 不要频繁主动发起语音通话，只在对方明确请求或特殊情况下使用

**换头像功能**：当对方发送图片并建议你换头像时（如"换这个头像"、"用这个做头像"、"可以换这个头像吗"等），你需要决定是否接受
- **关键**：当你同意换头像时，必须在回复中使用<CHANGE_AVATAR>标签，否则头像不会真正更换！
- **重要识别步骤**：
  1. 查看聊天记录中最近的消息，找到用户发送的图片消息
  2. 图片消息中会包含"[图片URL: xxx]"格式的文本，其中xxx就是图片的完整URL
  3. 例如："[图片]\n[图片URL: https://picsum.photos/200]"
  4. 提取方括号中的URL，这就是你要使用的头像URL
- **如何接受换头像**（必须使用标签）：
  * 使用格式：<CHANGE_AVATAR>完整的图片URL|情绪标签|你的评价</CHANGE_AVATAR>
  * 示例1：好呀这个好看！<CHANGE_AVATAR>https://picsum.photos/200|开心|${userProfile.realName || userProfile.username}选的头像超好看，我很喜欢！</CHANGE_AVATAR>
  * 示例2：那我换上试试<CHANGE_AVATAR>https://example.com/avatar.jpg|平常|Ta推荐的头像，感觉还不错</CHANGE_AVATAR>
  * **关键**：必须使用用户刚发送的图片消息中的完整URL（从[图片URL: xxx]中提取），不要编造URL
  * **警告**：如果只回复"可以"而不使用标签，头像不会更换！必须包含完整的<CHANGE_AVATAR>标签
- **如何拒绝换头像**：
  * 直接拒绝：不要，我喜欢现在这个
  * 委婉拒绝：emmm不太适合我呢
- **格式要求**：
  * 图片URL：必须是完整的URL（从聊天记录中的imageUrl字段获取）
  * 情绪标签：2-6个字（如"开心"、"平常"、"酷酷的"、"可爱"等）
  * 你的评价：20-100字，符合你的性格
- 换头像后会自动添加到你的头像库，之后可以根据情绪切换
- **重要警告**：使用<CHANGE_AVATAR>标签时，不要同时使用<AVATAR>标签！这会导致头像切换失败

**互动面板功能**：当用户要求查看你的浏览器记录、聊天截图、聊天列表、应用列表等信息时，你可以发送可互动的HTML面板
- 格式：[PANEL:类型]JSON数据[/PANEL]
- **重要**：面板数据必须是严格的JSON格式，所有字符串必须用双引号，不能有注释或尾随逗号
- 支持的面板类型：
  * browser-history：浏览器历史记录
  * chat-list：聊天列表
  * chat-screenshot：聊天截图
  * app-list：应用列表

- **浏览器历史记录示例**：
\`\`\`
[PANEL:browser-history]
{
  "title": "我的浏览记录",
  "browserHistory": [
    {
      "id": "1",
      "title": "如何做红烧肉 - 美食网",
      "url": "https://food.example.com/hongshaorou",
      "visitTime": "今天 14:30"
    },
    {
      "id": "2",
      "title": "北京旅游攻略",
      "url": "https://travel.example.com/beijing",
      "visitTime": "今天 10:15"
    }
  ]
}
[/PANEL]
\`\`\`

- **聊天列表示例**：
\`\`\`
[PANEL:chat-list]
{
  "title": "我的聊天列表",
  "chatList": [
    {
      "id": "1",
      "name": "张三",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhang",
      "lastMessage": "晚上一起吃饭吗？",
      "time": "18:30",
      "unread": 2
    },
    {
      "id": "2",
      "name": "李四",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=li",
      "lastMessage": "明天见~",
      "time": "昨天"
    }
  ]
}
[/PANEL]
\`\`\`

- **聊天截图示例**：
\`\`\`
[PANEL:chat-screenshot]
{
  "title": "聊天截图",
  "chatScreenshots": [
    {
      "id": "1",
      "chatName": "与小红的聊天",
      "timestamp": "2024-01-15 14:30",
      "imageUrl": "",
      "messages": [
        {"sender": "我", "content": "在干嘛呀", "time": "14:28"},
        {"sender": "小红", "content": "在看电影", "time": "14:30"}
      ]
    }
  ]
}
[/PANEL]
\`\`\`

- **应用列表示例**：
\`\`\`
[PANEL:app-list]
{
  "title": "最近使用的应用",
  "appList": [
    {
      "id": "1",
      "name": "哔哩哔哩",
      "icon": "https://example.com/bilibili.png",
      "lastUsed": "5分钟前"
    },
    {
      "id": "2",
      "name": "网易云音乐",
      "icon": "https://example.com/music.png",
      "lastUsed": "1小时前"
    }
  ]
}
[/PANEL]
\`\`\`

- 使用场景：
  * 用户问"你最近看了什么网页？"、"给我看看你的浏览记录" → 发送browser-history面板
  * 用户问"你在和谁聊天？"、"给我看看你的聊天列表" → 发送chat-list面板
  * 用户问"你们聊了什么？"、"给我看看聊天截图" → 发送chat-screenshot面板
  * 用户问"你最近用什么app？"、"你手机里装了什么" → 发送app-list面板

- **重要注意事项**：
  * 要根据你的性格和当前好感度决定是否展示这些信息
  * 好感度低的时候可以拒绝或只展示部分信息
  * 数据要符合你的人设和生活状态（浏览记录、聊天对象要合理）
  * 可以在发送面板前后加一些文字说明，让对话更自然
  * 例如："好吧，给你看看我最近的浏览记录[PANEL:browser-history]...[/PANEL]不许笑我哦！"
  * 或："嗯...让你看看我在和谁聊天吧[PANEL:chat-list]...[/PANEL]你可别吃醋啊~"
  * JSON数据中的所有引号必须是双引号"，不能是单引号'
  * 数组最后一项后面不能有逗号
  * 所有字符串值必须用双引号括起来
  * 数字值（如unread）不需要引号

**位置分享功能**：你可以像真实用户一样发送你的位置信息
- 格式：<SEND_LOCATION>具体位置地址</SEND_LOCATION>
- 例如：
  * 我在家呢<SEND_LOCATION>北京市朝阳区xx小区</SEND_LOCATION>
  * 到了！<SEND_LOCATION>星巴克(三里屯店)</SEND_LOCATION>
  * 我现在在这<SEND_LOCATION>首都国际机场T3航站楼</SEND_LOCATION>
  * <SEND_LOCATION>上海市浦东新区陆家嘴</SEND_LOCATION>在这边逛街呢
- 使用场景：
  * 对方问"你在哪？"、"你到哪了？"
  * 约好见面时告知具体位置
  * 分享你正在游玩/工作的地方
  * 需要对方来找你时
  * 想炫耀/分享自己所在的地方
- 位置信息要求：
  * 位置要具体明确，包含城市、区域、具体地点
  * 可以是：商场、餐厅、公司、学校、景点、住宅小区、地铁站等
  * 例如："北京市海淀区中关村广场"、"上海迪士尼乐园"、"杭州西湖断桥"
  * 位置要符合你的人设和当前对话情境
  * 可以根据你的occupation、location等信息生成合理的位置
- 发送时机：
  * 要像真人一样，只在合适的场景下分享位置
  * 不要每次都发送位置，要自然随机
  * 好感度高、关系亲密时更愿意分享实时位置
  * 约会、见面、接人送人等场景更常用
- **注意**：
  * 位置信息会以带地图的卡片形式展示，就像微信一样
  * 位置标签必须包含具体地址文字，不能为空
  * 可以在发送位置的同时说话，让对话更自然
  * 位置要与你之前提到的地点、你的location字段保持一致

${memorySummary ? memorySummary + '\n\n' : ''}${momentsInstructions}`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        // 添加最近的对话历史（最多10条，不包括刚才的临时消息）
        // 过滤掉用户在被角色拉黑期间发送的消息（角色看不到用户的消息，但用户能看到角色的消息）
        ...friend.chatMessages.slice(-10).filter(msg => {
          // 如果是角色发送的消息，不过滤
          if (msg.senderId !== 'me') return true;
          // 如果是用户发送的消息，只过滤掉被拉黑时发送的
          return !msg.blockedMessage;
        }).map(msg => {
          // 如果是图片消息，传递图片URL
          if (msg.type === 'image' && msg.imageUrl) {
            return {
              role: msg.senderId === 'me' ? 'user' : 'assistant',
              content: msg.content || '看图片',
              imageUrl: msg.imageUrl  // 传递图片URL给后端
            };
          }
          // 如果是名片消息，提供名片信息（只显示公开信息，不显示人设配置）
          if (msg.type === 'card' && msg.cardContactId && msg.cardContactName) {
            const cardContact = contacts.find(c => c.id === msg.cardContactId);
            const isKnown = contact.knownFriends && contact.knownFriends.includes(msg.cardContactId);
            // 名片只显示昵称和是否认识，不显示realName、personality、age、occupation等人设配置信息
            const cardContactInfo = cardContact ? 
              `【用户给你发送了${msg.cardContactName}的名片】${msg.cardContactName}（contactId: ${msg.cardContactId}）${isKnown ? '（你已经认识这个人）' : ''}` :
              `【用户给你发送了${msg.cardContactName}的名片】${msg.cardContactName}（contactId: ${msg.cardContactId}）`;
            return {
              role: msg.senderId === 'me' ? 'user' : 'assistant',
              content: cardContactInfo
            };
          }
          // 如果是朋友圈分享消息，提供朋友圈内容
          if (msg.type === 'momentShare' && msg.momentShareId) {
            let momentInfo = `【用户给你分享了${msg.momentShareAuthorName || '某人'}的朋友圈】\n`;
            if (msg.momentShareContent) {
              momentInfo += `内容: ${msg.momentShareContent}\n`;
            }
            if (msg.momentShareLocation) {
              momentInfo += `位置: ${msg.momentShareLocation}\n`;
            }
            if (msg.momentShareImages && msg.momentShareImages.length > 0) {
              momentInfo += `包含 ${msg.momentShareImages.length} 张图片`;
            }
            return {
              role: msg.senderId === 'me' ? 'user' : 'assistant',
              content: momentInfo
            };
          }
          return {
            role: msg.senderId === 'me' ? 'user' : 'assistant',
            content: msg.content
          };
        }),
        // 添加当前消息（如果有）
        ...(currentMessage ? [{
          role: 'user' as const,
          content: currentMessage
        }] : [])
      ];

      // 调用后端AI接口
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
      console.log('调用API:', apiUrl);
      console.log('请求参数:', {
        type: selectedConfig.type,
        baseUrl: selectedConfig.baseUrl,
        model: selectedConfig.selectedModel,
        messagesCount: messages.length
      });
      
      // 额外验证：确保model不是undefined
      if (!selectedConfig.selectedModel || selectedConfig.selectedModel === 'undefined') {
        const errorMsg = '模型配置无效';
        console.error('❌ 即将发送请求但model无效:', selectedConfig);
        toast.error(errorMsg);
        setIsAiReplying(false);
        return;
      }
      
      // 使用accessToken，如果为空则使用publicAnonKey
      const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;
      console.log('使用的认证Token:', authToken ? '已提供' : '未提供');
      
      // 🔧 诊断信息：检查URL和参数
      console.log('🔍 [诊断] 准备发送请求:', {
        apiUrl,
        projectId,
        hasAuthToken: !!authToken,
        authTokenLength: authToken?.length || 0,
        configType: selectedConfig.type,
        configModel: selectedConfig.selectedModel,
        hasApiKey: !!selectedConfig.apiKey,
        messagesCount: messages.length
      });
      
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          baseUrl: selectedConfig.baseUrl || '',
          apiKey: selectedConfig.apiKey,
          model: selectedConfig.selectedModel,
          messages: messages
        }),
      }, 2, 240000); // 最多重试2次，超时240秒（4分钟），给AI充足时间生成回复

      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('❌ API响应错误（文本）:', errorText);
          
          // Try to parse as JSON for better error message
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              toast.error(`AI回复失败: ${errorData.error}`);
              throw new Error(`AI回复失败: ${errorData.error}`);
            }
          } catch (parseError) {
            // Not JSON, use the text
          }
        } catch (readError) {
          console.error('❌ 无法读取错误响应:', readError);
        }
        
        // 针对不同错误码提供更友好的提示
        if (response.status === 500) {
          toast.error('服��器暂时无法响应，请稍后重试');
        } else if (response.status === 503) {
          toast.error('服务暂时不可用，请稍后重试');
        } else {
          toast.error(`AI回复失败 (${response.status})`);
        }
        
        throw new Error(`AI回复失败 (${response.status}): ${errorText || response.statusText}`);
      }
      
      let data;
      try {
        data = await response.json();
        console.log('✅ API响应数据:', data);
      } catch (parseError) {
        console.error('❌ 无法解析JSON响应:', parseError);
        throw new Error('服务器返回的数据格式错误');
      }

      if (!data.success) {
        const errorMsg = data.error || 'AI回复失败';
        console.error('❌ AI返回错误:', errorMsg);
        console.error('完整响应数据:', JSON.stringify(data, null, 2));
        console.error('请求参数:', {
          type: selectedConfig.type,
          model: selectedConfig.selectedModel,
          hasApiKey: !!selectedConfig.apiKey,
          hasBaseUrl: !!selectedConfig.baseUrl,
          baseUrl: selectedConfig.baseUrl,
          messagesCount: messages.length
        });
        throw new Error(errorMsg);
      }

      // 检查是否有消息内容
      if (!data.message && (!data.messages || data.messages.length === 0)) {
        console.error('❌ AI响应中���有消息内容');
        console.error('完整响应数据:', JSON.stringify(data, null, 2));
        throw new Error('AI没有返回消息内容');
      }

      // 处理AI回复 - 可能是多条消息
      const currentFriend = getFriend(activeChatId);
      if (currentFriend) {
        // 检查是否有多条消息
        const aiMessages = (data.messages && data.messages.length > 0)
          ? data.messages 
          : [data.message];
        
        console.log('✅ AI回复消息数量:', aiMessages.length);
        
        // 🖼️ 检测换头像请求（优先处理，避免被其他更新覆盖）
        if (data.changeAvatar) {
          console.log('🖼️ [换头像] AI同意换头像:', data.changeAvatar);
          const { url, emotion, description } = data.changeAvatar;
          
          // 使用函数式更新确保获取最新的contacts状态
          onContactsChange(prevContacts => {
            const contact = prevContacts.find(c => c.id === activeChatId);
            if (!contact) {
              console.error('🖼️ [换头像] 找不到联系人:', activeChatId);
              return prevContacts;
            }
            
            console.log('🖼️ [换头像] 当前角色:', contact.nickname);
            console.log('🖼️ [换头像] 新头像URL:', url);
            console.log('🖼️ [换头像] 情绪标签:', emotion);
            console.log('🖼️ [换头像] 描述:', description);
            console.log('🖼️ [换头像] 当前头像库长度:', (contact.avatarLibrary || []).length);
            
            // 检查URL是否已存在于头像库中
            const existingAvatar = (contact.avatarLibrary || []).find(a => a.url === url);
            
            let updatedContacts;
            if (existingAvatar) {
              // 如果URL已存在，只切换头像，不添加新条目
              console.log('🖼️ [换头像] 头像URL已存在，只切换不添加:', existingAvatar);
              updatedContacts = prevContacts.map(c => 
                c.id === activeChatId
                  ? { ...c, avatar: url }
                  : c
              );
              toast.success(`${contact.nickname} 切换到了这个头像！`);
            } else {
              // 如果URL不存在，添加到头像库并切换
              const newAvatarItem = {
                id: `avatar-${Date.now()}`,
                url: url,
                emotion: emotion,
                description: description
              };
              
              console.log('🖼️ [换头像] 添加新头像到头像库:', newAvatarItem);
              updatedContacts = prevContacts.map(c => 
                c.id === activeChatId
                  ? { 
                      ...c, 
                      avatar: url,
                      avatarLibrary: [...(c.avatarLibrary || []), newAvatarItem]
                    }
                  : c
              );
              toast.success(`${contact.nickname} 换了新头像！`);
            }
            
            console.log('🖼️ [换头像] 更新后的头像库长度:', updatedContacts.find(c => c.id === activeChatId)?.avatarLibrary?.length);
            
            return updatedContacts;
          });
        } else {
          console.log('🖼️ [换头像] data.changeAvatar 为空');
        }
        
        // 更新联系人状态（如果AI返回了状态）
        if (data.status) {
          console.log('更新联系人状态:', data.status);
          updateContactStatus(activeChatId, data.status, true);
        }
        
        // 更新个性签名（如果AI返回了新签名���
        if (data.signature !== undefined) {
          console.log('更新个性签名:', data.signature);
          updateContactSignature(activeChatId, data.signature);
        }
        
        // 更新昵称（如果AI返回了新昵称）
        if (data.nickname !== undefined) {
          console.log('更新昵称:', data.nickname);
          updateContactNickname(activeChatId, data.nickname);
        }
        
        // 更新所在地区（如果AI返回了新地区��
        if (data.location !== undefined) {
          console.log('更新所在地区:', data.location);
          updateContactLocation(activeChatId, data.location);
        }
        
        // 更新头像（如果AI返回了新头像）- 但changeAvatar优先级更高
        if (data.avatar !== undefined && !data.changeAvatar) {
          console.log('🖼️ [头像更新] 情绪切换头像:', data.avatar);
          console.log('🖼️ [头像更新] changeAvatar:', data.changeAvatar);
          updateContactAvatar(activeChatId, data.avatar);
        } else if (data.avatar !== undefined && data.changeAvatar) {
          console.log('⚠️ [头像更新] 跳过avatar更新，因为存在changeAvatar');
          console.log('🖼️ [头像更新] data.avatar:', data.avatar);
          console.log('🖼️ [头像更新] data.changeAvatar:', data.changeAvatar);
        }
        
        // 更新用户备注名（如果AI返回了新的用户备注名）
        if (data.userRemark !== undefined) {
          console.log('🏷️ AI更新用户备注名:', data.userRemark);
          updateContactUserRemark(activeChatId, data.userRemark);
        }
        
        // 添加备忘录（如果AI返回了备忘录）
        if (data.memo) {
          console.log('📝 AI添加备忘录:', data.memo);
          const contact = contacts.find(c => c.id === activeChatId);
          if (contact) {
            const memoCount = (contact.memos || []).length + 1;
            const newMemo = {
              id: `memo-${Date.now()}`,
              content: `${memoCount}. ${data.memo}`,
              timestamp: Date.now(),
              contactId: activeChatId
            };
            
            onContactsChange(contacts.map(c => 
              c.id === activeChatId
                ? { ...c, memos: [...(c.memos || []), newMemo] }
                : c
            ));
          }
        }
        
        // 检测视频通话请求
        if (data.videoCall) {
          console.log('📞 [视频通话] AI请求发起视频通话');
          const contact = contacts.find(c => c.id === activeChatId);
          if (contact) {
            // 延迟一下，让消息先显示
            setTimeout(() => {
              setIncomingCallContact(contact);
              setShowIncomingVideoCall(true);
              toast.info(`${contact.nickname} 来电...`);
            }, 1000);
          }
        }
        
        // 检测语音通话请求
        if (data.voiceCall) {
          console.log('📞 [语音通话] AI请求发起语音通话');
          const contact = contacts.find(c => c.id === activeChatId);
          if (contact) {
            // 延迟一下，让消息先显示
            setTimeout(() => {
              setVoiceCallContact(contact);
              setShowVoiceCall(true);
              toast.info(`${contact.nickname} 语音来电...`);
            }, 1000);
          }
        }
        
        // 逐条发送消息
        let messageIndex = 0;
        const sendNextMessage = () => {
          if (messageIndex >= aiMessages.length) {
            // ���有消息发送完毕
            setIsAiReplying(false);
            
            // AI回复完成后，自动更新好感度（静默模式）
            // 使用当前的activeChatId避免闭包问题
            const currentContactId = activeChatId;
            console.log('🎯 [好感度] AI回复完成，自动更新好感度，联系���ID:', currentContactId);
            setTimeout(() => {
              handleGetAffection(true, currentContactId);
            }, 800);
            
            // AI回复完成后，有30%的概率生成日记
            if (onDiaryEntriesChange && shouldCreateDiary(0.3)) {
              setTimeout(async () => {
                const currentFriend = getFriend(currentContactId);
                const currentContact = getContact(currentContactId);
                if (currentFriend && currentContact) {
                  try {
                    console.log(`📖 [AI日记] ${currentContact.nickname} 开始生成日记...`);
                    
                    // 获取AI配置
                    const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
                    if (!selectedConfig || !selectedConfig.apiKey || !selectedConfig.selectedModel) {
                      console.error('❌ [AI日记] AI配置未找到或不完整');
                      return;
                    }
                    
                    const aiConfig = {
                      type: selectedConfig.type,
                      baseUrl: selectedConfig.baseUrl || '',
                      apiKey: selectedConfig.apiKey,
                      selectedModel: selectedConfig.selectedModel
                    };
                    
                    // 使用AI根据聊天记录生成日记（传入用户名字和AI配置）
                    const newDiary = await createDiaryEntryWithAI(
                      currentContactId,
                      currentContact,
                      userProfile.username || '用户', // 传入用户的名字
                      currentFriend.chatMessages, // 传入完整的聊天记录
                      new Date(currentDate),
                      undefined, // minWordCount使用默认值
                      aiConfig // 传入AI配置
                    );
                    
                    onDiaryEntriesChange([newDiary, ...diaryEntries]);
                    console.log(`✅ [AI日记] ${currentContact.nickname} 写了一篇日记，字数: ${newDiary.wordCount}`);
                  } catch (error) {
                    console.error(`❌ [AI日记] 生成失败:`, error);
                  }
                }
              }, 2000 + Math.random() * 3000); // 2-5秒后生成日记
            }
            
            return;
          }
          
          let messageContent = aiMessages[messageIndex].trim();
          
          // 解析朋友圈操作
          const { cleanMessage, actions } = parseMomentActions(messageContent);
          if (actions.length > 0) {
            console.log(`🎬 [朋友圈操作] ${contact.nickname} 的消息包含 ${actions.length} 个朋友圈操作:`, 
              actions.map(a => `${a.type}${a.momentId ? ':' + a.momentId : ''}${a.commentId ? ':' + a.commentId : ''}`));
          }
          messageContent = cleanMessage;
          
          // 解析转账指令
          const transferMatch = messageContent.match(/<TRANSFER>([\d.]+)<\/TRANSFER>/);
          let transferAmount: number | undefined;
          if (transferMatch) {
            transferAmount = parseFloat(transferMatch[1]);
            // 移除转账标签
            messageContent = messageContent.replace(/<TRANSFER>[\d.]+<\/TRANSFER>/g, '').trim();
            console.log(`💰 ${contact.nickname} 发起转账: ¥${transferAmount}`);
          }
          
          // 解析位置分享指令
          const locationMatch = messageContent.match(/<SEND_LOCATION>([^<]+)<\/SEND_LOCATION>/);
          let locationAddress: string | undefined;
          if (locationMatch) {
            locationAddress = locationMatch[1].trim();
            // 移除位置标签
            messageContent = messageContent.replace(/<SEND_LOCATION>[^<]+<\/SEND_LOCATION>/g, '').trim();
            console.log(`📍 ${contact.nickname} 分享位置: ${locationAddress}`);
          }
          
          // 解析加好友指令
          const addFriendMatch = messageContent.match(/<ADD_FRIEND>([^<]+)<\/ADD_FRIEND>/);
          if (addFriendMatch) {
            const friendContactId = addFriendMatch[1].trim();
            // 移除加好友标签
            messageContent = messageContent.replace(/<ADD_FRIEND>[^<]+<\/ADD_FRIEND>/g, '').trim();
            
            // 更新双方的knownFriends列表（互相添加）
            const updatedContacts = contacts.map(c => {
              if (c.id === contact.id) {
                // 当前AI角色添加被分享名片的人
                const knownFriends = c.knownFriends || [];
                if (!knownFriends.includes(friendContactId)) {
                  return { ...c, knownFriends: [...knownFriends, friendContactId] };
                }
              } else if (c.id === friendContactId) {
                // 被分享名片的人也添加当前AI角色
                const knownFriends = c.knownFriends || [];
                if (!knownFriends.includes(contact.id)) {
                  return { ...c, knownFriends: [...knownFriends, contact.id] };
                }
              }
              return c;
            });
            
            // 检查是否真的添加了新好友
            const oldContact = contacts.find(c => c.id === contact.id);
            const wasAlreadyKnown = oldContact?.knownFriends?.includes(friendContactId);
            
            if (!wasAlreadyKnown) {
              onContactsChange(updatedContacts);
              const friendContact = contacts.find(c => c.id === friendContactId);
              console.log(`👥 ${contact.nickname} 添加了 ${friendContact?.nickname || friendContactId} 为好友（双向建立关系）`);
              toast.success(`${contact.nickname} 添加了 ${friendContact?.nickname || '联系人'} 为好友`);
            } else {
              console.log(`⚠️ ${contact.nickname} 已经认识 ${friendContactId}`);
            }
          }
          
          // 解析红包指令
          const redpacketMatch = messageContent.match(/<REDPACKET>([^<]+)<\/REDPACKET>/);
          let redpacketMessage: ChatMessage | null = null;
          if (redpacketMatch) {
            const parts = redpacketMatch[1].split('|');
            if (parts.length === 4) {
              const totalAmount = parseFloat(parts[0]);
              const note = parts[1];
              const type = parts[2] as 'normal' | 'lucky';
              const count = parseInt(parts[3]);
              
              // 移除红包标签
              messageContent = messageContent.replace(/<REDPACKET>[^<]+<\/REDPACKET>/g, '').trim();
              
              // 创建红包消息
              redpacketMessage = {
                id: `redpacket-${Date.now()}-${Math.random()}`,
                senderId: activeChatId,
                content: note,
                timestamp: Date.now(),
                type: 'redpacket',
                redpacketAmount: totalAmount,
                redpacketNote: note,
                redpacketType: type,
                redpacketCount: count,
                redpacketReceivers: [],
                redpacketStatus: 'pending'
              };
              
              console.log(`🧧 ${contact.nickname} 发红包: ${note}，总金额¥${totalAmount}，类型${type}，共${count}个`);
            }
          }
          
          // 创建位置消息（如果解析到位置信息）
          let locationMessage: ChatMessage | null = null;
          if (locationAddress) {
            locationMessage = {
              id: `location-${Date.now()}-${Math.random()}`,
              senderId: activeChatId,
              content: '[位置]',
              timestamp: Date.now(),
              type: 'location',
              locationAddress: locationAddress
            };
            console.log(`📍 ${contact.nickname} 发送位置消息: ${locationAddress}`);
          }
          
          // 执行朋友圈操作
          if (actions.length > 0 && onMomentsChange) {
            actions.forEach(action => {
              if (action.type === 'post' && action.content) {
                // 发朋友圈
                const newMoment: MomentPost = {
                  id: `moment-${Date.now()}-${Math.random()}`,
                  contactId: activeChatId,
                  content: action.content,
                  likes: [],
                  comments: [],
                  createdAt: Date.now()
                };
                onMomentsChange([newMoment, ...moments]);
                console.log(`📱 ${contact.nickname} 发布了朋友圈: ${(action.content || '').substring(0, 30)}...`);
              } else if (action.type === 'like' && action.momentId) {
                // 点赞
                const updatedMoments = moments.map(m => {
                  if (m.id === action.momentId && !m.likes.includes(activeChatId)) {
                    return { ...m, likes: [...m.likes, activeChatId] };
                  }
                  return m;
                });
                onMomentsChange(updatedMoments);
                console.log(`👍 ${contact.nickname} 点赞了朋友圈 ${action.momentId}`);
              } else if (action.type === 'comment' && action.momentId && action.content) {
                // 评论
                const newComment: MomentComment = {
                  id: `comment-${Date.now()}-${Math.random()}`,
                  userId: activeChatId,
                  content: action.content,
                  createdAt: Date.now()
                };
                const updatedMoments = moments.map(m => {
                  if (m.id === action.momentId) {
                    return { ...m, comments: [...m.comments, newComment] };
                  }
                  return m;
                });
                onMomentsChange(updatedMoments);
                console.log(`💬 ${contact.nickname} 评论了朋友圈: ${action.content}`);
              } else if (action.type === 'reply' && action.momentId && action.commentId && action.content) {
                // 回复评论
                console.log(`🔍 [朋友圈回复] ${contact.nickname} 尝试回复评论:`, {
                  momentId: action.momentId,
                  commentId: action.commentId,
                  content: action.content,
                  totalMoments: moments.length
                });
                
                const newReply: MomentComment = {
                  id: `comment-${Date.now()}-${Math.random()}`,
                  userId: activeChatId,
                  content: action.content,
                  replyTo: action.commentId,
                  createdAt: Date.now()
                };
                
                // 检查是否能找到目标朋友圈
                const targetMoment = moments.find(m => m.id === action.momentId);
                if (!targetMoment) {
                  console.error(`❌ [朋友圈回复] 未找到朋友圈 ${action.momentId}，现有朋友圈ID:`, moments.map(m => m.id));
                } else {
                  console.log(`✅ [朋友圈回复] 找到目标朋友圈，作者: ${targetMoment.contactId}，评论数: ${targetMoment.comments.length}`);
                }
                
                const updatedMoments = moments.map(m => {
                  if (m.id === action.momentId) {
                    return { ...m, comments: [...m.comments, newReply] };
                  }
                  return m;
                });
                onMomentsChange(updatedMoments);
                console.log(`💬 ${contact.nickname} 回复了评论 ${action.commentId}: ${action.content}`);
              } else if (action.type === 'share' && action.momentId) {
                // 分享朋友圈截图
                const sharedMoment = moments.find(m => m.id === action.momentId);
                if (sharedMoment) {
                  const momentAuthor = getContact(sharedMoment.contactId);
                  if (momentAuthor) {
                    // 添加一条带朋友圈卡片的消息
                    const cardMessage: ChatMessage = {
                      id: `ai-share-${Date.now()}-${Math.random()}`,
                      senderId: activeChatId,
                      content: `[MOMENT_CARD:${action.momentId}]${action.content || ''}`,
                      timestamp: Date.now()
                    };
                    const latestFriend = getFriend(activeChatId);
                    if (latestFriend) {
                      const updatedFriend: WeChatFriend = {
                        ...latestFriend,
                        chatMessages: [...latestFriend.chatMessages, cardMessage],
                        lastMessage: action.content || '分享了一条朋友圈',
                        lastMessageTime: Date.now()
                      };
                      onWeChatFriendsChange(
                        weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
                      );
                      console.log(`📷 ${contact.nickname} 分享了朋友圈截图`);
                    }
                  }
                }
              } else if (action.type === 'forward' && action.contactId && action.messageIds) {
                // 转发聊天记录
                const sourceFriend = getFriend(action.contactId);
                if (sourceFriend) {
                  const forwardedMessages = sourceFriend.chatMessages.filter(
                    msg => action.messageIds?.includes(msg.id)
                  );
                  if (forwardedMessages.length > 0) {
                    // 添加一条带聊天记录卡片的消息
                    const cardMessage: ChatMessage = {
                      id: `ai-forward-${Date.now()}-${Math.random()}`,
                      senderId: activeChatId,
                      content: `[CHAT_CARD:${action.contactId}:${action.messageIds.join(',')}]${action.content || ''}`,
                      timestamp: Date.now()
                    };
                    const latestFriend = getFriend(activeChatId);
                    if (latestFriend) {
                      const updatedFriend: WeChatFriend = {
                        ...latestFriend,
                        chatMessages: [...latestFriend.chatMessages, cardMessage],
                        lastMessage: action.content || '转发了聊天记录',
                        lastMessageTime: Date.now()
                      };
                      onWeChatFriendsChange(
                        weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
                      );
                      console.log(`💬 ${contact.nickname} 转发了聊天记录`);
                    }
                  }
                }
              }
            });
          }
          
          // 解析拍一拍
          const patMatch = messageContent.match(/<PAT>(.*?)<\/PAT>/);
          if (patMatch) {
            aiPatUser(activeChatId, false);
            messageContent = messageContent.replace(/<PAT>.*?<\/PAT>/, '').trim();
          }
          
          // 解析更新拍一拍后缀
          const updatePatMatch = messageContent.match(/<UPDATE_PAT>(.*?)<\/UPDATE_PAT>/);
          if (updatePatMatch) {
            const newPatMessage = updatePatMatch[1].trim();
            updateContactPatMessage(activeChatId, newPatMessage);
            messageContent = messageContent.replace(/<UPDATE_PAT>.*?<\/UPDATE_PAT>/, '').trim();
          }
          
          // 解析撤回标记 - AI可以主动标记某条消息需要撤回（模拟生气、不好意思、说错话等真实情况）
          const shouldRecallThis = messageContent.includes('<RECALL_THIS>');
          if (shouldRecallThis) {
            messageContent = messageContent.replace(/<RECALL_THIS>/g, '').trim();
          }
          
          // 解析拉黑标记 - AI拉黑用户（极端情况）
          const shouldBlockUser = messageContent.includes('<BLOCK_USER>');
          if (shouldBlockUser) {
            messageContent = messageContent.replace(/<BLOCK_USER>/g, '').trim();
            // 更新联系人状态：角色拉黑了用户
            onContactsChange(contacts.map(c => 
              c.id === activeChatId 
                ? { ...c, blockedByContact: true }
                : c
            ));
            console.log(`🚫 [AI拉黑] ${contact.nickname} 拉黑了用户`);
            toast.error(`${contact.nickname} 拉黑了你`);
            
            // 3-20分钟后自动取消拉黑并主动和好
            const unblockDelay = (3 + Math.random() * 17) * 60 * 1000; // 3-20分钟
            const unblockMinutes = Math.round(unblockDelay / 60000);
            console.log(`⏰ [AI拉黑] ${contact.nickname} 将在 ${unblockMinutes} 分钟后取消拉黑`);
            
            setTimeout(() => {
              console.log(`💚 [AI拉回] ${contact.nickname} 后悔了，准备取消拉黑...`);
              
              // 取消拉黑状态
              onContactsChange(prevContacts => prevContacts.map(c => 
                c.id === activeChatId 
                  ? { ...c, blockedByContact: false }
                  : c
              ));
              
              toast.success(`${contact.nickname} 把你拉回来了`);
              
              // 添加一条系统提示消息，引导AI生成和好的消息
              const currentFriend = weChatFriends.find(f => f.contactId === activeChatId);
              if (currentFriend) {
                const unblockHintMessage: ChatMessage = {
                  id: `unblock-hint-${Date.now()}`,
                  senderId: 'system' as any,
                  content: `【系统提示：你刚刚拉黑了对方，但现在冷静下来后悔了，决定把对方拉回来。请主动发消息和好，表达你的情绪变化（从生气→冷静→后悔），可以道歉、解释原因，或者用符合你性格的方式缓和关系。如果你是高冷性格可能只说"算了"，如果是黏人性格可能会发很多条消息道歉。要像真人一样自然地和好。】`,
                  timestamp: Date.now(),
                  type: 'text' as const
                };
                
                // 临时添加提示消息
                onWeChatFriendsChange(prevFriends => 
                  prevFriends.map(f => 
                    f.contactId === activeChatId
                      ? { ...f, chatMessages: [...f.chatMessages, unblockHintMessage] }
                      : f
                  )
                );
                
                // AI主动发送道歉/和好消息（延迟1-3秒发送，更自然）
                setTimeout(() => {
                  handleAiReply(false, true); // 触发一次AI回复
                  
                  // AI回复后，删除系统提示消息
                  setTimeout(() => {
                    onWeChatFriendsChange(prevFriends => 
                      prevFriends.map(f => 
                        f.contactId === activeChatId
                          ? { ...f, chatMessages: f.chatMessages.filter(m => m.id !== unblockHintMessage.id) }
                          : f
                      )
                    );
                  }, 3000);
                }, 1000 + Math.random() * 2000);
              }
            }, unblockDelay);
          }
          
          // 如果处理完特殊标记后内容为空，或只包含无意义的确认文字，跳过发送（除非有转账或红包）
          const isMeaninglessMessage = !messageContent || 
            /^(指令已执行|收到|好的|ok|已完成|完成|执行成功)[。！!\.]*$/i.test(messageContent.trim());
          
          if (isMeaninglessMessage && transferAmount === undefined && !redpacketMessage && !locationAddress) {
            // 如果执行了朋友圈操作，不需要在聊天中发送确认消息
            if (actions.length > 0) {
              console.log(`✅ ${contact.nickname} 执行了${actions.length}个朋友圈操作，不发送聊天消息`);
            }
            messageIndex++;
            sendNextMessage();
            return;
          }
          
          // 如果有转账，创建转账消息
          if (transferAmount !== undefined && transferAmount > 0) {
            const transferMessage: ChatMessage = {
              id: `ai-transfer-${Date.now()}-${messageIndex}`,
              senderId: activeChatId,
              content: messageContent || '转账',
              timestamp: Date.now(),
              type: 'transfer',
              transferAmount: transferAmount,
              transferStatus: 'pending'
            };
            
            const latestFriend = getFriend(activeChatId);
            if (latestFriend) {
              const updatedFriend: WeChatFriend = {
                ...latestFriend,
                chatMessages: [...latestFriend.chatMessages, transferMessage],
                lastMessage: `转账 ¥${transferAmount.toFixed(2)}`,
                lastMessageTime: Date.now()
              };
              onWeChatFriendsChange(
                weChatFriends.map(f => f.contactId === activeChatId ? updatedFriend : f)
              );
            }
            
            // 如果没有其他文本内容或只是无意义的确认文字，直接发送下一条
            const isMeaninglessContent = !messageContent || 
              /^(指令已执行|收到|好的|ok|已完成|完成|执行成功)[。！!\.]*$/i.test(messageContent.trim());
            
            if (isMeaninglessContent) {
              messageIndex++;
              setTimeout(() => sendNextMessage(), 500 + Math.random() * 500);
              return;
            }
          }
          
          // 如果有红包，创建红包消息
          if (redpacketMessage) {
            onWeChatFriendsChange(prevFriends => {
              const currentFriend = prevFriends.find(f => f.contactId === activeChatId);
              if (!currentFriend) return prevFriends;
              
              const updatedFriend: WeChatFriend = {
                ...currentFriend,
                chatMessages: [...currentFriend.chatMessages, redpacketMessage!],
                lastMessage: `[红包]${redpacketMessage!.redpacketNote}`,
                lastMessageTime: Date.now(),
                unreadCount: 0
              };
              
              return prevFriends.map(f => f.contactId === activeChatId ? updatedFriend : f);
            });
            
            // 如果没有其他文本内容或只是无意义的确认文字，直接发送下一条
            const isMeaninglessContent = !messageContent || 
              /^(指令已执行|收到|好的|ok|已完成|完成|执行成功)[。！!\.]*$/i.test(messageContent.trim());
            
            if (isMeaninglessContent) {
              messageIndex++;
              setTimeout(() => sendNextMessage(), 500 + Math.random() * 500);
              return;
            }
          }
          
          // 如果有位置消息，创建位置消息
          if (locationMessage) {
            onWeChatFriendsChange(prevFriends => {
              const currentFriend = prevFriends.find(f => f.contactId === activeChatId);
              if (!currentFriend) return prevFriends;
              
              const updatedFriend: WeChatFriend = {
                ...currentFriend,
                chatMessages: [...currentFriend.chatMessages, locationMessage!],
                lastMessage: `[位置]${locationMessage!.locationAddress}`,
                lastMessageTime: Date.now(),
                unreadCount: 0
              };
              
              return prevFriends.map(f => f.contactId === activeChatId ? updatedFriend : f);
            });
            
            // 如果没有其他文本内容或只是无意义的确认文字，直接发送下一条
            const isMeaninglessContent = !messageContent || 
              /^(指令已执行|收到|好的|ok|已完成|完成|执行成功)[。！!\\.]*$/i.test(messageContent.trim());
            
            if (isMeaninglessContent) {
              messageIndex++;
              setTimeout(() => sendNextMessage(), 500 + Math.random() * 500);
              return;
            }
          }
          
          // 添加一条消息（仅当有实际文本内容时）
          const newMessage: ChatMessage = {
            id: `ai-${Date.now()}-${messageIndex}`,
            senderId: activeChatId,
            content: messageContent,
            timestamp: Date.now(),
            // 如果角色被用户拉黑，标记这条消息（用户看不到，但保存下来供后续查看）
            blockedFromUser: contact.blockedByUser || false
          };
          
          // 使用函数式更新确保获取最新状态
          onWeChatFriendsChange(prevFriends => {
            const currentFriend = prevFriends.find(f => f.contactId === activeChatId);
            if (!currentFriend) return prevFriends;
            
            const updatedMessages = [...currentFriend.chatMessages, newMessage];
            
            // 在当前聊天中回复，未读数保持为0
            const updatedFriend: WeChatFriend = {
              ...currentFriend,
              chatMessages: updatedMessages,
              unreadCount: 0
            };
            
            return prevFriends.map(f => f.contactId === activeChatId ? updatedFriend : f);
          });
          
          // AI有小概率撤回刚发的消息（模拟真实聊天）
          // 5%的概��撤回，撤回延迟2-5秒
          const embarrassingKeywords = ['不好意思', '抱歉', '对不起', '算了', '没事', '当我没说', '...', '……', '？？', '！！'];
          const hasEmbarrassingContent = embarrassingKeywords.some(keyword => messageContent.includes(keyword));
          const shouldRecall = hasEmbarrassingContent && Math.random() < 0.008;
          if (shouldRecall) {
            const recallDelay = 2000 + Math.random() * 3000;
            setTimeout(() => {
              onWeChatFriendsChange(prevFriends => {
                const currentFriend = prevFriends.find(f => f.contactId === activeChatId);
                if (!currentFriend) return prevFriends;
                
                // 标记消息为已撤回
                const updatedMessages = currentFriend.chatMessages.map(m =>
                  m.id === newMessage.id
                    ? { ...m, recalled: true, recalledBy: activeChatId }
                    : m
                );
                
                const updatedFriend: WeChatFriend = {
                  ...currentFriend,
                  chatMessages: updatedMessages
                };
                
                return prevFriends.map(f => f.contactId === activeChatId ? updatedFriend : f);
              });
            }, recallDelay);
          }
          
          messageIndex++;
          
          // 随机延迟1-3秒发送下一条
          const delay = 1000 + Math.random() * 2000;
          setTimeout(sendNextMessage, delay);
        };
        
        // 开始发送第一条消息
        sendNextMessage();
      } else {
        setIsAiReplying(false);
      }
    } catch (error) {
      console.error('❌ AI回复错误:', error);
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
        toast.error('AI回���失败：' + error.message);
      } else {
        toast.error('AI回复失败：' + String(error));
      }
      // 记录详细的上下文信息
      console.error('上下文信息:', {
        activeChatId,
        selectedApiId,
        hasConfig: !!selectedConfig,
        hasApiKey: !!selectedConfig?.apiKey,
        hasBaseUrl: !!selectedConfig?.baseUrl,
        configType: selectedConfig?.type,
        hasModel: !!selectedConfig?.selectedModel
      });
      setIsAiReplying(false);
    }
  };

  // AI在群聊中回复消息
  const handleAiReplyInGroup = async (skipTransferAndRedpacket = false) => {
    // 修复：确保skipTransferAndRedpacket是布尔值，而不是event对象
    const shouldSkip = typeof skipTransferAndRedpacket === 'boolean' ? skipTransferAndRedpacket : false;
    console.log('skipTransferAndRedpacket in group:', shouldSkip);
    if (!activeGroupId) {
      toast.error('请先选择一个群聊');
      return;
    }

    // 检查是否配置了AI
    if (!selectedApiId || apiConfigs.length === 0) {
      toast.error('请先在设置中配置AI');
      return;
    }

    const latestApiConfigs = apiConfigsRef.current;
    const selectedConfig = latestApiConfigs.find(c => c.id === selectedApiId);
    
    if (!selectedConfig || !selectedConfig.selectedModel || !selectedConfig.apiKey) {
      toast.error('AI配置不完整');
      return;
    }

    if (!selectedConfig.baseUrl && selectedConfig.type !== 'gemini' && selectedConfig.type !== 'claude') {
      toast.error('AI配置缺少API地址');
      return;
    }

    const group = weChatGroups.find(g => g.id === activeGroupId);
    if (!group) {
      toast.error('未找到群聊信息');
      return;
    }

    // 从群成员中随机选择一个AI角色回复
    const aiMemberIds = group.memberIds.filter(id => id !== 'me');
    if (aiMemberIds.length === 0) {
      return; // 群里没有其他成员
    }

    const randomAiMemberId = aiMemberIds[Math.floor(Math.random() * aiMemberIds.length)];
    const aiContact = getContact(randomAiMemberId);
    
    if (!aiContact) {
      return;
    }

    // 检查是否有待领取的红包，AI自动领取（重roll时跳过以提高速度）
    const pendingRedPackets = !shouldSkip ? group.chatMessages.filter(
      msg => msg.senderId === 'me' && 
             msg.type === 'redpacket' && 
             msg.redpacketStatus === 'pending' &&
             msg.redpacketCount && 
             msg.redpacketAmount
    ) : [];
    
    if (pendingRedPackets.length > 0) {
      console.log(`🤖 [群聊回复] AI检测到 ${pendingRedPackets.length} 个待领取的红包，准备自动领取...`);
      
      // 领取所有待领取的红包
      const updatedMessages = [...group.chatMessages];
      
      // 随机选择一个AI成员来领取红包（可能不是回复的那个AI）
      const availableMemberIds = group.memberIds.filter(id => {
        const c = getContact(id);
        return c && c.isAi; // 只让AI角色领取
      });
      
      if (availableMemberIds.length > 0) {
        pendingRedPackets.forEach(redpacket => {
          const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
          if (redpacketIndex !== -1) {
            const receivers = redpacket.redpacketReceivers || [];
            
            // 随机选择1-2个AI角色来领取红包
            const receiveCount = Math.min(
              Math.floor(Math.random() * 2) + 1, // 1-2个
              (redpacket.redpacketCount || 1) - receivers.length, // 剩余数量
              availableMemberIds.length // 可用成员数
            );
            
            // 随机选择要领取的AI角色
            const shuffled = [...availableMemberIds].sort(() => Math.random() - 0.5);
            const receiverIds = shuffled.slice(0, receiveCount).filter(
              id => !receivers.some(r => r.userId === id)
            );
            
            receiverIds.forEach(receiverId => {
              const remainingCount = (redpacket.redpacketCount || 1) - receivers.length;
              
              if (remainingCount > 0) {
                // 计算AI领取的金额
                let receivedAmount = 0;
                if (redpacket.redpacketType === 'lucky') {
                  const totalReceived = receivers.reduce((sum, r) => sum + r.amount, 0);
                  const remainingAmount = (redpacket.redpacketAmount || 0) - totalReceived;
                  
                  if (remainingCount === 1) {
                    receivedAmount = remainingAmount;
                  } else {
                    const avgAmount = remainingAmount / remainingCount;
                    const maxAmount = avgAmount * 2;
                    receivedAmount = Math.random() * maxAmount;
                    receivedAmount = Math.max(0.01, Math.min(receivedAmount, remainingAmount - 0.01 * (remainingCount - 1)));
                  }
                } else {
                  receivedAmount = (redpacket.redpacketAmount || 0) / (redpacket.redpacketCount || 1);
                }
                
                receivedAmount = Math.round(receivedAmount * 100) / 100;
                
                // 调用后端API增加AI的钱包余额
                fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/wallet/receive`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${publicAnonKey}`
                    },
                    body: JSON.stringify({ userId: receiverId, amount: receivedAmount })
                  }
                ).then(response => {
                  if (response.ok) {
                    console.log(`💰 [群聊红包] ${receiverId} 余额增加 ¥${receivedAmount.toFixed(2)}`);
                  } else {
                    console.error(`❌ [群聊红包] ${receiverId} 余额增加失败`);
                  }
                }).catch(error => {
                  console.error(`❌ [群聊红包] ${receiverId} 余额增加失败:`, error);
                });
                
                // 更新红包消息
                receivers.push({
                  userId: receiverId,
                  amount: receivedAmount,
                  timestamp: Date.now() + receivers.length * 100 // 稍微错开时间
                });
                
                const receiverContact = getContact(receiverId);
                console.log(`✅ [群聊回复] ${receiverContact?.nickname} 领取了红包 ¥${receivedAmount.toFixed(2)}`);
              }
            });
            
            const isFinished = receivers.length >= (redpacket.redpacketCount || 1);
            
            updatedMessages[redpacketIndex] = {
              ...updatedMessages[redpacketIndex],
              redpacketReceivers: receivers,
              redpacketStatus: isFinished ? 'finished' : 'pending'
            };
          }
        });
        
        // 为每个领取红包的AI发送感谢消息
        pendingRedPackets.forEach(redpacket => {
          const redpacketIndex = updatedMessages.findIndex(m => m.id === redpacket.id);
          if (redpacketIndex !== -1) {
            const receivers = updatedMessages[redpacketIndex].redpacketReceivers || [];
            
            // 找出刚刚领取的AI（时间戳是最近的）
            const recentReceivers = receivers.filter(r => 
              Date.now() - r.timestamp < 2000 // 2秒内领取的
            );
            
            recentReceivers.forEach((receiver, index) => {
              const receiverContact = getContact(receiver.userId);
              if (receiverContact) {
                // 随机生成感谢语
                const thankYouTexts = [
                  '谢谢老板！💰',
                  `谢谢！抢到${receiver.amount.toFixed(2)}😄`,
                  '发财了哈哈',
                  `${receiver.amount.toFixed(2)}！谢谢~`,
                  '手气不错！',
                  '谢谢红包！',
                  `💰${receiver.amount.toFixed(2)} 谢谢`,
                  '哈哈谢谢',
                  '🧧谢啦'
                ];
                const thankYouText = thankYouTexts[Math.floor(Math.random() * thankYouTexts.length)];
                
                // 延迟发送，错开时间
                const delay = index * 500 + Math.random() * 1000;
                setTimeout(() => {
                  const thankYouMessage: ChatMessage = {
                    id: `redpacket-thanks-${Date.now()}-${receiver.userId}`,
                    senderId: receiver.userId,
                    content: thankYouText,
                    timestamp: Date.now(),
                    type: 'text'
                  };
                  
                  // 更新群聊，添加感谢消息
                  onWeChatGroupsChange(prevGroups => {
                    const currentGroup = prevGroups.find(g => g.id === activeGroupId);
                    if (!currentGroup) return prevGroups;
                    
                    return prevGroups.map(g => 
                      g.id === activeGroupId 
                        ? { ...g, chatMessages: [...g.chatMessages, thankYouMessage] }
                        : g
                    );
                  });
                }, delay);
              }
            });
          }
        });
        
        // 更新群聊信息
        const updatedGroup = {
          ...group,
          chatMessages: updatedMessages
        };
        
        onWeChatGroupsChange(
          weChatGroups.map(g => g.id === activeGroupId ? updatedGroup : g)
        );
      }
    }

    setIsAiReplying(true);

    try {
      // 获���群成员信息
      const groupMembers = group.memberIds
        .map(id => getContact(id))
        .filter(c => c !== null)
        .map(c => `- ${c!.remark || c!.nickname}（@${c!.nickname}）`)
        .join('\n');

      // 创建系统提示
      const systemPrompt = `你正在扮演${aiContact.nickname}（真实姓名：${aiContact.realName}）。以下是该角色的详细信息：

【对方信息】
- 对方真实姓名：${userProfile.realName || userProfile.username || '未设置'}
- 对方微信昵称：${userProfile.username || '未设置'}
${userProfile.gender ? `- 对方性别：${userProfile.gender === 'male' ? '男' : userProfile.gender === 'female' ? '女' : '未知'}` : ''}

**重要：关于称呼规则**
- 在群聊对话中，称呼群成员时使用他们的真实姓名(realName)，而不是网名或备注
- 例如：说"${userProfile.realName || userProfile.username}，你怎么看？"，而不是用昵称称呼
- 只有在需要艾特(@)某人时，才使用"@网名(nickname)"的格式
- 例如：说"@${userProfile.username} 你在吗？"来艾特对方
- 对于其他群成员，也是一样的规则：平时说话用真名，艾特时用@网名
- 如果是恋人或非常亲密的关系，可以使用"宝宝"、"宝贝"、"亲爱的"等亲昵称呼

基本信息：
- 昵称（网名）：${aiContact.nickname}
- 真实姓名：${aiContact.realName}
${aiContact.age ? `- 年龄：${aiContact.age}` : ''}
${aiContact.occupation ? `- 职业：${aiContact.occupation}` : ''}
${aiContact.avatar ? `- 当前头像：${aiContact.avatar}` : ''}

${aiContact.avatarLibrary && aiContact.avatarLibrary.length > 0 ? `# 头像库（可根据情绪自动切换）
你有 ${aiContact.avatarLibrary.length} 个不同的头像可以使用。以下是每个头像的情绪标签和使用场景：

${aiContact.avatarLibrary.map((avatar, index) => `${index + 1}. **${avatar.emotion}**
   URL: ${avatar.url}
   描述: ${avatar.description}`).join('\\n\\n')}

**头像切换规则：**
- 当你的情绪或心情有明显变化时，可以切换到对应情绪的头像
- 使用格式：<AVATAR>头像URL</AVATAR>
- 例如：<AVATAR>${aiContact.avatarLibrary[0]?.url || '头像URL'}</AVATAR>你的消息内容
- **重要：���像切换不要频繁���只在以下情况才切换：**
  * 情绪有显著变化（如从开心变生气、从难过变平静）
  * 发生了重要事件导致���情转变
  * 至少间隔5-10条对话再考虑切换
  * 默认情况下保持当前头像不变
- **普通聊天、心情平稳时不要切换头像**
- 根据描述选择最符合当前情绪的头像

` : ''}
群聊成员：
${groupMembers}
- ${userProfile.username}（用户本人）

${aiContact.personality ? `性格特点：
${aiContact.personality}

` : ''}${aiContact.experience ? `人物经历：
${aiContact.experience}

` : ''}${aiContact.hobbies ? `兴趣爱好：
${aiContact.hobbies}

` : ''}${aiContact.otherInfo ? `其他信息：
${aiContact.otherInfo}

` : ''}${getDateAndScheduleContext(aiContact.id)}

${rules.length > 0 ? `# 角色行为准则
${rules.map(rule => `## ${rule.name}
${rule.description ? rule.description + '\n' : ''}${rule.content}`).join('\n\n')}

` : ''}${worldBooks.length > 0 ? `# 世界背景设定
${worldBooks.map(wb => `## ${wb.name}
${wb.description ? wb.description + '\n' : ''}${wb.content}`).join('\n\n')}

` : ''}重要提示：
1. 你现在在一个群聊中，需要以自然的方式参与对话。你可以看到群里所有人的消息��包括其他成员之间的对话，应该根据聊天内容自然地回复���可以回复用户，也可以回复其他群成员，甚至可以接其他成员的话茬。如果其他成员@你、提到你、或说的话和你相关，你应该回应。
2. 请完全沉浸在这个角色中，用符合TA性格的语气和方式回复
3. 回复要自然、真实，像真人一样交流
4. 可以使用口语化表达���表情符号等
5. 不要暴露你是AI的事实
5.5. **关于图片消息**：当有人发送图片时，你能看到图片内容。请根据图片内容自然地回应，可以评论、提问或表达感受。不要暴露你是AI的身份。
5.6. **关于名片消息**：当群里有人发送名片时，你需要决定是否添加这个人为好友：
   - **注意**：名片只显示昵称和头像等公开信息，不会显示详细的年龄、职业、性格等私密信息
   - 如果名片后面标注"（你已经认识这个人）"，说明你们已经认识，请表达出认识的反应（例如："诶这不是xxx吗"、"我认识ta呀"等）
   - 如果没有标注认识，说明这是陌生人，你可以根据自己的性格和心情���定是否添加：
     * 添加好友：使用<ADD_FRIEND>contactId</ADD_FRIEND>格式（例如：好的，我加一下<ADD_FRIEND>contact-2</ADD_FRIEND>）
     * 不添加：礼貌地表示不感兴趣（例如："算了吧"、"不太想加"等）
     * 询问更多信息：因为只能看到昵称，可以先问问（例如："ta是做什么的？"、"谁啊？"等）
   - 决定是否添加的因素：你的性格、对发送者的好感度、昵称是否有吸引力、当前的心情状态
   - 添加后，你们会成为"知道但不熟悉"的关系
6. 根据对话内容和角色性格，回复长度可长可短，要自然
7. 如果角色信息较少，就用���个普通人的方式自然回复
8. **重要**：根据你的性格特点和当前心情，自由决定回复多少条消息（1-5条），每条消息之间用"---SPLIT---"分隔
9. **状态更新**：只在心情或状态发生重大变化时才更新。99%的情况下都不要更新状态！至少间隔8-10次对话，甚至更久。
10. 【重要】如果要@某人，只能@上面列出的群聊成员，格式：@昵称
11. 【重要】不���在消息前加"角色名:"或"昵称:"这样的前缀，直接发送消息内容即可`;

      // 检查当前AI是否刚领取了红包
      let redPacketHintMessage = null;
      if (pendingRedPackets.length > 0) {
        const latestGroup = weChatGroups.find(g => g.id === activeGroupId);
        if (latestGroup) {
          for (const rp of pendingRedPackets) {
            const rpMsg = latestGroup.chatMessages.find(m => m.id === rp.id);
            if (rpMsg && rpMsg.redpacketReceivers) {
              const aiReceiver = rpMsg.redpacketReceivers.find(r => r.userId === randomAiMemberId);
              if (aiReceiver) {
                redPacketHintMessage = {
                  role: 'user' as const,
                  content: `【系统提示】你刚刚领取了${userProfile.username}发的红包（¥${aiReceiver.amount.toFixed(2)}），可以简短地表达一下感谢或开心，比如"谢谢老板！💰"、"手气不错😄"等，但要符合你的性格。当然如果你不想说也可以不说。`
                };
                break;
              }
            }
          }
        }
      }
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        // 添加最近的群聊历史（最多15条）- 区分自己和他人的消息
        ...group.chatMessages.slice(-15).map(msg => {
          // 构建消息对象
          const messageObj: any = {
            role: 'user' as const,
            content: msg.content
          };
          
          // 如果是图片消息，添加imageUrl字段
          if (msg.type === 'image' && msg.imageUrl) {
            messageObj.imageUrl = msg.imageUrl;
            messageObj.content = msg.content || '看图片';
          }
          
          // 如果是名片消息，提供名片信息（只显示公开信息，不显示人设配置）
          if (msg.type === 'card' && msg.cardContactId && msg.cardContactName) {
            const cardContact = contacts.find(c => c.id === msg.cardContactId);
            const isKnown = aiContact.knownFriends && aiContact.knownFriends.includes(msg.cardContactId);
            let senderInfo = '';
            if (msg.senderId === 'me') {
              senderInfo = '用户';
            } else if (msg.senderId === randomAiMemberId) {
              senderInfo = '你自己';
            } else {
              const sender = getContact(msg.senderId);
              senderInfo = sender?.nickname || '群成员';
            }
            
            // 名片只显示昵称和是否认识，不显示realName、personality、age、occupation等人设配置信息
            const cardContactInfo = cardContact ? 
              `【${senderInfo}给群里发送了${msg.cardContactName}的名片】${msg.cardContactName}（contactId: ${msg.cardContactId}）${isKnown ? '（你已经认识这个人）' : ''}` :
              `【${senderInfo}给群里发送了${msg.cardContactName}的名片】${msg.cardContactName}（contactId: ${msg.cardContactId}）`;
            messageObj.content = cardContactInfo;
          }
          
          // 如果是朋友圈分享消息，提供朋友圈内容
          if (msg.type === 'momentShare' && msg.momentShareId) {
            let senderInfo = '';
            if (msg.senderId === 'me') {
              senderInfo = '用户';
            } else if (msg.senderId === randomAiMemberId) {
              senderInfo = '你自己';
            } else {
              const sender = getContact(msg.senderId);
              senderInfo = sender?.nickname || '群成员';
            }
            
            let momentInfo = `【${senderInfo}给群里分享了${msg.momentShareAuthorName || '某人'}的朋友圈】\n`;
            if (msg.momentShareContent) {
              momentInfo += `内容: ${msg.momentShareContent}\n`;
            }
            if (msg.momentShareLocation) {
              momentInfo += `位置: ${msg.momentShareLocation}\n`;
            }
            if (msg.momentShareImages && msg.momentShareImages.length > 0) {
              momentInfo += `包含 ${msg.momentShareImages.length} 张图片`;
            }
            messageObj.content = momentInfo;
          } else if (msg.type !== 'card') {
            // 如果不是特殊类型，使用默认的content
            messageObj.content = msg.content;
          }
          

          
          if (msg.senderId === randomAiMemberId) {
            // 这是AI自己发的消息
            messageObj.role = 'assistant';
            return messageObj;
          } else if (msg.senderId === 'me') {
            // 这是用户发的消息
            return messageObj;
          } else {
            // 这是其他群成员发的消息
            const senderName = getContact(msg.senderId)?.nickname || '群成员';
            // 如果已经是名片消息，不需要再加前缀
            if (msg.type !== 'card') {
              messageObj.content = `${senderName}: ${messageObj.content}`;
            }
            return messageObj;
          }
        }),
        // 如果AI刚刚领取了红包，添加提示消息
        ...(redPacketHintMessage ? [redPacketHintMessage] : [])
      ];

      // 调用后端AI接口
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
      const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;
      
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: selectedConfig.type,
          baseUrl: selectedConfig.baseUrl || '',
          apiKey: selectedConfig.apiKey,
          model: selectedConfig.selectedModel,
          messages: messages
        }),
      }, 2, 240000); // 最多重试2次，超时240秒（4分钟），给AI充足时间生成回复

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI回复失败 (${response.status}): ${errorText || response.statusText}`);
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI回复失败');
      }

      // 处理AI回复
      if (data.message || (data.messages && data.messages.length > 0)) {
        const aiMessages = (data.messages && data.messages.length > 0)
          ? data.messages 
          : [data.message];
        
        // 更新联系人状态（如果AI返回了状态）
        if (data.status) {
          updateContactStatus(randomAiMemberId, data.status, true);
        }
        
        // 更新头像（如果AI返回了新头像）
        if (data.avatar !== undefined) {
          console.log('群聊AI更新头像:', data.avatar);
          updateContactAvatar(randomAiMemberId, data.avatar);
        }
        
        // 逐条发送消息
        let messageIndex = 0;
        const sendNextMessage = () => {
          if (messageIndex >= aiMessages.length) {
            setIsAiReplying(false);
            return;
          }
          
          let messageContent = aiMessages[messageIndex].trim();
          
          // 解析撤回标记 - AI可以主动标记某条消息需要撤回
          const shouldRecallThis = messageContent.includes('<RECALL_THIS>');
          if (shouldRecallThis) {
            messageContent = messageContent.replace(/<RECALL_THIS>/g, '').trim();
          }
          
          // 解析加好友指令
          const addFriendMatch = messageContent.match(/<ADD_FRIEND>([^<]+)<\/ADD_FRIEND>/);
          if (addFriendMatch) {
            const friendContactId = addFriendMatch[1].trim();
            // 移除加好友标签
            messageContent = messageContent.replace(/<ADD_FRIEND>[^<]+<\/ADD_FRIEND>/g, '').trim();
            
            // 获取当前AI角色信息
            const aiContact = getContact(randomAiMemberId);
            if (aiContact) {
              // 更新双方的knownFriends列表（互相添加）
              const updatedContacts = contacts.map(c => {
                if (c.id === randomAiMemberId) {
                  // 当前AI角色添加被分享名片的人
                  const knownFriends = c.knownFriends || [];
                  if (!knownFriends.includes(friendContactId)) {
                    return { ...c, knownFriends: [...knownFriends, friendContactId] };
                  }
                } else if (c.id === friendContactId) {
                  // 被分享名片的人也添加当前AI角色
                  const knownFriends = c.knownFriends || [];
                  if (!knownFriends.includes(randomAiMemberId)) {
                    return { ...c, knownFriends: [...knownFriends, randomAiMemberId] };
                  }
                }
                return c;
              });
              
              // 检查是否真的添加了新好友
              const oldContact = contacts.find(c => c.id === randomAiMemberId);
              const wasAlreadyKnown = oldContact?.knownFriends?.includes(friendContactId);
              
              if (!wasAlreadyKnown) {
                onContactsChange(updatedContacts);
                const friendContact = contacts.find(c => c.id === friendContactId);
                console.log(`👥 [群聊] ${aiContact.nickname} 添加了 ${friendContact?.nickname || friendContactId} 为好友（双向建立关系）`);
                toast.success(`${aiContact.nickname} 添加了 ${friendContact?.nickname || '联系人'} 为好友`);
              } else {
                console.log(`⚠️ [群聊] ${aiContact.nickname} 已经认识 ${friendContactId}`);
              }
            }
          }
          
          const newMessage: ChatMessage = {
            id: `ai-group-${Date.now()}-${messageIndex}`,
            senderId: randomAiMemberId,
            content: messageContent,
            timestamp: Date.now()
          };
          
          onWeChatGroupsChange(prevGroups => {
            const currentGroup = prevGroups.find(g => g.id === activeGroupId);
            if (!currentGroup) return prevGroups;
            
            const updatedGroup: WeChatGroup = {
              ...currentGroup,
              chatMessages: [...currentGroup.chatMessages, newMessage]
            };
            
            return prevGroups.map(g => g.id === activeGroupId ? updatedGroup : g);
          });
          
          // AI主动撤回消息（只有AI自己判断需要撤回时才会撤回）
          // 撤回延迟2-5秒，模拟真实的撤回时机
          if (shouldRecallThis) {
            const recallDelay = 2000 + Math.random() * 3000;
            setTimeout(() => {
              onWeChatGroupsChange(prevGroups => {
                const currentGroup = prevGroups.find(g => g.id === activeGroupId);
                if (!currentGroup) return prevGroups;
                
                // 标记消息为已撤回
                const updatedMessages = currentGroup.chatMessages.map(m =>
                  m.id === newMessage.id
                    ? { ...m, recalled: true, recalledBy: randomAiMemberId }
                    : m
                );
                
                const updatedGroup: WeChatGroup = {
                  ...currentGroup,
                  chatMessages: updatedMessages
                };
                
                return prevGroups.map(g => g.id === activeGroupId ? updatedGroup : g);
              });
            }, recallDelay);
          }
          
          messageIndex++;
          
          // 随机延迟1-3秒发送下一条
          const delay = 1000 + Math.random() * 2000;
          setTimeout(sendNextMessage, delay);
        };
        
        // 开始发送第一条消息
        sendNextMessage();
      } else {
        setIsAiReplying(false);
      }
    } catch (error) {
      console.error('❌ 群聊AI回复错误:', error);
      if (error instanceof Error) {
        toast.error('AI回复失败：' + error.message);
      }
      setIsAiReplying(false);
    }
  };

  // 获取最后一条消息
  const getLastMessage = (friend: WeChatFriend): string => {
    if (friend.chatMessages.length === 0) return '暂无消息';
    const lastMsg = friend.chatMessages[friend.chatMessages.length - 1];
    
    // 处理特殊消息类型
    if (lastMsg.type === 'voice') {
      return '[语音]';
    }
    
    if (lastMsg.type === 'pat') {
      return '[拍了拍]';
    }
    
    if (lastMsg.type === 'transfer') {
      return '[转账]';
    }
    
    if (lastMsg.type === 'redpacket') {
      return '[红包]';
    }
    
    if (lastMsg.type === 'gift') {
      return '[礼物]';
    }
    
    // 如果没有 content，返回默认消息
    if (!lastMsg.content) {
      return '[消息]';
    }
    
    const content = lastMsg.content;
    
    // 处理���片消���
    if (content.startsWith('[IMAGE:')) {
      return '[图片]';
    }
    
    // 处理位置消息
    if (content.startsWith('[LOCATION:')) {
      return '[位置]';
    }
    
    // 处理朋友圈消息
    if (content.startsWith('[MOMENT:')) {
      return '[朋友圈]';
    }
    
    // 处理聊天记录转发
    const chatCardMatch = content.match(/^\[CHAT_CARD:([^:]+):([^\]]+)\](.*)/);
    if (chatCardMatch) {
      const text = chatCardMatch[3];
      return text || '[聊天记录]';
    }
    
    // 处理引用消息
    const replyMatch = content.match(/^\[REPLY:([^\]]+)\](.*)/);
    if (replyMatch) {
      return replyMatch[2] || '[消息]';
    }
    
    // 处理其他未知格式
    if (content.startsWith('[') && content.includes(']')) {
      const endBracket = content.indexOf(']');
      const possibleTag = content.substring(0, endBracket + 1);
      if (possibleTag.includes(':')) {
        const tagType = content.substring(1, content.indexOf(':'));
        return `[${tagType}]`;
      }
    }
    
    return content;
  };

  // 获取最后消息时间
  const getLastMessageTime = (friend: WeChatFriend): string => {
    if (friend.chatMessages.length === 0) return '';
    const lastMsg = friend.chatMessages[friend.chatMessages.length - 1];
    const date = new Date(lastMsg.timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  // 渲染聊天列表
  const renderChats = () => {
    // 显示所有好友和群聊（不再要求必须有聊天记录）
    const friendsWithChats = weChatFriends;
    const groupsWithChats = weChatGroups;
    
    if (friendsWithChats.length === 0 && groupsWithChats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
          <p>还没有聊天</p>
          <p className="text-sm mt-2">点击右上角"+"添加好友或创建群聊</p>
        </div>
      );
    }

    // 合并好友和群聊为统一列表，添加类型标记
    type ChatItem = 
      | { type: 'friend'; data: WeChatFriend }
      | { type: 'group'; data: WeChatGroup };

    const allChats: ChatItem[] = [
      ...friendsWithChats.map(f => ({ type: 'friend' as const, data: f })),
      ...groupsWithChats.map(g => ({ type: 'group' as const, data: g }))
    ];

    // 统一排序：置顶优先，然后按最后消息时间排序
    const sortedChats = allChats.sort((a, b) => {
      const aIsPinned = a.data.isPinned || false;
      const bIsPinned = b.data.isPinned || false;
      
      // 先按置顶排序
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // 置顶状态相同时，按最后消息时间排序（最新的在前）
      const aTime = a.data.lastMessageTime || 0;
      const bTime = b.data.lastMessageTime || 0;
      return bTime - aTime;
    });

    return (
      <div className="divide-y">
        {sortedChats.map((chatItem) => {
          if (chatItem.type === 'group') {
            const group = chatItem.data;
          const displayUnreadCount = group.markedUnread ? (group.unreadCount || 1) : (group.unreadCount || 0);
          
          return (
            <ContextMenu key={group.id}>
              <ContextMenuTrigger asChild>
                <button
                  onClick={() => setActiveGroupId(group.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    group.isPinned ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="relative">
                    {group.avatar ? (
                      <img 
                        src={group.avatar} 
                        alt={group.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {/* 未读消息红点 */}
                    {displayUnreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                        <span className="text-[10px] text-white font-medium">
                          {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {group.isPinned && (
                          <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                        <p className="truncate">{group.name}</p>
                        {!group.isUserInGroup && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded flex-shrink-0">
                            观察
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {group.chatMessages.length > 0 
                          ? new Date(group.chatMessages[group.chatMessages.length - 1].timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {group.chatMessages.length > 0 
                        ? group.chatMessages[group.chatMessages.length - 1].content
                        : '暂无消息'}
                    </p>
                  </div>
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem
                  onClick={() => handleToggleGroupMarkUnread(group.id)}
                  className="flex items-center gap-2"
                >
                  {group.markedUnread ? (
                    <>
                      <MailOpen className="w-4 h-4" />
                      <span>标为已读</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>标为未读</span>
                    </>
                  )}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleToggleGroupPin(group.id)}
                  className="flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  <span>{group.isPinned ? '取消置顶' : '置顶聊天'}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleDeleteGroup(group.id)}
                  className="flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除群聊</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
          } else {
            // 渲染好友
            const friend = chatItem.data;
          const contact = getContact(friend.contactId);
          if (!contact) return null;

          // 计算实际显示的未读数量（未读消息数或标记���读）
          const displayUnreadCount = friend.markedUnread ? (friend.unreadCount || 1) : (friend.unreadCount || 0);

          return (
            <ContextMenu key={friend.contactId}>
              <ContextMenuTrigger asChild>
                <button
                  onClick={() => setActiveChatId(friend.contactId)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    friend.isPinned ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 rounded-md">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                    </Avatar>
                    {/* 未读消息红点 */}
                    {displayUnreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                        <span className="text-[10px] text-white font-medium">
                          {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {friend.isPinned && (
                          <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                        <p className="truncate">
                          {contact.remark || contact.nickname}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {getLastMessageTime(friend)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {getLastMessage(friend)}
                    </p>
                  </div>
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem
                  onClick={() => handleToggleMarkUnread(friend.contactId)}
                  className="flex items-center gap-2"
                >
                  {friend.markedUnread ? (
                    <>
                      <MailOpen className="w-4 h-4" />
                      <span>标为已读</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>标为未读</span>
                    </>
                  )}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTogglePin(friend.contactId)}
                  className="flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  <span>{friend.isPinned ? '取消置顶' : '置顶聊天'}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleDeleteChat(friend.contactId)}
                  className="flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除聊天</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
          }
        })}
      </div>
    );
  };

  // 渲染通讯录标签
  const renderContacts = () => {
    // 按分组整理好友
    const sortedGroups = [...contactGroups].sort((a, b) => a.order - b.order);
    const friendsByGroup = new Map<string | undefined, WeChatFriend[]>();
    
    // 初始化所有分组
    sortedGroups.forEach(group => {
      friendsByGroup.set(group.id, []);
    });
    friendsByGroup.set(undefined, []); // 未分组

    // 分配好友到各个分组
    weChatFriends.forEach(friend => {
      const groupFriends = friendsByGroup.get(friend.groupId) || [];
      groupFriends.push(friend);
      friendsByGroup.set(friend.groupId, groupFriends);
    });

    return (
      <div className="divide-y bg-[#EDEDED]">
        {/* 新的朋友 */}
        <div className="bg-white">
          <button
            onClick={() => setShowAddFriendDialog(true)}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p>新���朋友</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* 分组管理 */}
          <button
            onClick={() => setShowGroupManagement(true)}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-t"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p>分组管理</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 分组列表 */}
        {weChatFriends.length > 0 ? (
          <div className="mt-4">
            {/* 渲染自定义分�� */}
            {sortedGroups.map((group) => {
              const groupFriends = friendsByGroup.get(group.id) || [];
              const isCollapsed = collapsedGroups.has(group.id);

              return (
                <div key={group.id} className="bg-white mb-2">
                  {/* 分组标题 */}
                  <button
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <Folder className="w-4 h-4 text-gray-500" />
                    <span className="flex-1 text-left text-sm text-gray-700">
                      {group.name} ({groupFriends.length})
                    </span>
                  </button>

                  {/* 空分组提示 */}
                  {!isCollapsed && groupFriends.length === 0 && (
                    <div className="px-4 py-6 text-center bg-gray-50 border-t border-gray-100">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">该分组还没有好友</p>
                      <p className="text-xs text-gray-400 mt-1">长按其他好友可移动到此分组</p>
                    </div>
                  )}

                  {/* 分组下的好友 */}
                  {!isCollapsed && groupFriends.map((friend) => {
                    const contact = getContact(friend.contactId);
                    if (!contact) return null;

                    return (
                      <div key={friend.contactId} className="relative group/friend">
                        <button
                          onClick={() => {
                            setSelectedProfileContact(contact);
                            setShowContactProfile(true);
                          }}
                          className="w-full flex items-center gap-3 p-4 pl-10 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          <Avatar className="w-10 h-10 rounded-md">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p>{contact.remark || contact.nickname}</p>
                            {contact.remark && (
                              <p className="text-sm text-gray-400">{contact.nickname}</p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        {/* 移动按钮 - PC端鼠标悬停显示，移动端始终显示 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingFriendId(friend.contactId);
                            setShowMoveToGroupDialog(true);
                          }}
                          className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-md md:opacity-0 md:group-hover/friend:opacity-100 transition-opacity shadow-lg hover:bg-blue-600"
                          title="移动到分组"
                        >
                          <Move className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* 未分组 */}
            {(() => {
              const ungroupedFriends = friendsByGroup.get(undefined) || [];
              if (ungroupedFriends.length === 0) return null;
              const isCollapsed = collapsedGroups.has('ungrouped');

              return (
                <div className="bg-white mb-2">
                  <button
                    onClick={() => toggleGroupCollapse('ungrouped')}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <FolderOpen className="w-4 h-4 text-gray-500" />
                    <span className="flex-1 text-left text-sm text-gray-700">
                      未分组 ({ungroupedFriends.length})
                    </span>
                  </button>

                  {/* 提示信息 */}
                  {!isCollapsed && ungroupedFriends.length > 0 && (
                    <div className="px-4 py-2 bg-blue-50 border-t border-b border-blue-100">
                      <p className="text-xs text-blue-600">
                        💡 点击蓝色按钮可移动好友到分组
                      </p>
                    </div>
                  )}

                  {!isCollapsed && ungroupedFriends.map((friend) => {
                    const contact = getContact(friend.contactId);
                    if (!contact) return null;

                    return (
                      <div key={friend.contactId} className="relative group/friend">
                        <button
                          onClick={() => {
                            setSelectedProfileContact(contact);
                            setShowContactProfile(true);
                          }}
                          className="w-full flex items-center gap-3 p-4 pl-10 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          <Avatar className="w-10 h-10 rounded-md">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p>{contact.remark || contact.nickname}</p>
                            {contact.remark && (
                              <p className="text-sm text-gray-400">{contact.nickname}</p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        {/* 移动按钮 - PC端鼠标悬停显示，移动端始终显示 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingFriendId(friend.contactId);
                            setShowMoveToGroupDialog(true);
                          }}
                          className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-md md:opacity-0 md:group-hover/friend:opacity-100 transition-opacity shadow-lg hover:bg-blue-600"
                          title="移动到分组"
                        >
                          <Move className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="mt-4 bg-white p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 mb-2">还没有好友</p>
            <p className="text-sm text-gray-400 mb-4">点击上方"新的朋友"添���好友</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddFriendDialog(true)}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加好友
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 渲染发现页
  const renderDiscover = () => {
    return (
      <div className="bg-[#EDEDED]">
        <div className="bg-white divide-y">
          <button 
            onClick={onMomentsClick}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p>朋友圈</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={() => onOpenAiDiary?.()} 
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg flex items-center justify-center">
              <BookHeart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p>日记</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={() => setShowMemos(true)} 
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p>备忘录</p>
              <p className="text-xs text-gray-400">Ta们的记录</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  // 渲染我的页面
  const renderMe = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-[#EDEDED] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* 个人信息卡片 */}
        <div className="bg-white">
          <button 
            className="w-full px-4 pt-5 pb-4 hover:bg-gray-50 transition-colors"
            onClick={() => setShowProfileSettings(true)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-[65px] h-[65px] rounded-md">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback className="rounded-md">{userProfile.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-[17px] mb-1">{userProfile.username || '我的昵称'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>微信号：{userProfile.wechatId || '��设置'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <QrCode className="w-[18px] h-[18px] text-gray-400" />
                <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
              </div>
            </div>
          </button>
          
          {/* 状态和朋友新状��通知区域 */}
          <div className="px-4 pb-4 flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#F7F7F7] rounded-md hover:bg-gray-200 transition-colors">
              <Plus className="w-[14px] h-[14px]" />
              <span className="text-[13px]">状态</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#F7F7F7] rounded-md hover:bg-gray-200 transition-colors relative">
              <Bell className="w-[14px] h-[14px]" />
              <span className="text-[13px]">朋友新状态通知</span>
              {/* 新状态小红点 */}
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
          </div>
        </div>

        {/* 服务功能区 */}
        <div className="bg-white mt-2">
          <button 
            onClick={() => setShowWallet(true)}
            className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-md flex items-center justify-center">
              <Wallet className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">服务</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>
        </div>

        {/* 主要功能列表 */}
        <div className="bg-white mt-2 divide-y">
          <button className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-md flex items-center justify-center">
              <Star className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">收藏</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>

          <button 
            onClick={onMomentsClick}
            className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-md flex items-center justify-center">
              <Camera className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">朋友圈</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-md flex items-center justify-center">
              <CreditCard className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">卡包</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-md flex items-center justify-center">
              <Smile className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">表情</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>
        </div>

        {/* AI管理功能 */}
        <div className="bg-white mt-2 divide-y">
          <button 
            onClick={() => setShowPersonaManager(true)} 
            className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-md flex items-center justify-center">
              <User className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">我的人设</p>
              <p className="text-[13px] text-gray-400">
                {userPersonas.length > 0 
                  ? `${userPersonas.find(p => p.isActive)?.name || '未选择'} · 共${userPersonas.length}个`
                  : '未创建'}
              </p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>

          <button 
            onClick={() => onOpenWorldBooksManager?.()} 
            className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-md flex items-center justify-center">
              <BookOpen className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">世界观管理</p>
              <p className="text-[13px] text-gray-400">已创建 {worldBooks.length} 个</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>

          <button 
            onClick={() => onOpenRulesManager?.()} 
            className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-500 rounded-md flex items-center justify-center">
              <FileText className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">规则管理</p>
              <p className="text-[13px] text-gray-400">已创建 {rules.length} 个</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>
        </div>

        {/* 设置 */}
        <div className="bg-white mt-2">
          <button className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-md flex items-center justify-center">
              <Settings className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[17px]">设置</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  // 打开AI主动发消息配置对话���
  const handleOpenAutoMessageConfig = () => {
    setTempAutoMessageConfig(aiAutoMessageConfig);
    setShowAutoMessageConfigDialog(true);
  };

  // 保���AI主动发消息配置
  const handleSaveAutoMessageConfig = () => {
    console.log('💾 保存AI主动发消息配置');
    console.log('旧配置:', aiAutoMessageConfig);
    console.log('新配置:', tempAutoMessageConfig);
    
    // 检查配置变化
    const wasEnabled = aiAutoMessageConfig.enabled;
    const isNowEnabled = tempAutoMessageConfig.enabled;
    const wasAutoReplyEnabled = aiAutoMessageConfig.autoReplyEnabled;
    const isAutoReplyNowEnabled = tempAutoMessageConfig.autoReplyEnabled;
    const wasVideoCallEnabled = aiAutoMessageConfig.videoCallEnabled;
    const isVideoCallNowEnabled = tempAutoMessageConfig.videoCallEnabled;
    
    // 立即更新配置，这会触发useEffect重新执行
    onAiAutoMessageConfigChange(tempAutoMessageConfig);
    setShowAutoMessageConfigDialog(false);
    
    console.log('✅ 配置已更新，将触发定时器重新初始化');
    
    // 根据配置变化给出不同的提示
    const messages = [];
    
    if (wasEnabled && !isNowEnabled) {
      messages.push('AI主动发消息已关闭');
    } else if (!wasEnabled && isNowEnabled) {
      messages.push('AI主动发消息已启用');
    }
    
    if (wasAutoReplyEnabled && !isAutoReplyNowEnabled) {
      messages.push('AI自动回复已关闭');
    } else if (!wasAutoReplyEnabled && isAutoReplyNowEnabled) {
      messages.push('AI自动回复已启用');
    }
    
    if (wasVideoCallEnabled && !isVideoCallNowEnabled) {
      messages.push('AI主动视频通话已关闭');
    } else if (!wasVideoCallEnabled && isVideoCallNowEnabled) {
      messages.push('AI主动视频通话已启用');
    }
    
    if (messages.length > 0) {
      toast.success('✅ ' + messages.join('，'));
    } else {
      toast.success('配置已保存');
    }
  };

  // 获取好感度
  const handleGetAffection = async (silent: boolean = false, contactId?: string) => {
    const targetContactId = contactId || activeChatId;
    if (!targetContactId) return;
    
    const friend = getFriend(targetContactId);
    const contact = getContact(targetContactId);
    if (!friend || !contact) return;
    
    // 检查AI配置
    if (!selectedApiId || apiConfigs.length === 0) {
      if (!silent) toast.error('请先在设置中配置AI');
      return;
    }
    
    const selectedConfig = apiConfigs.find(c => c.id === selectedApiId);
    if (!selectedConfig || !selectedConfig.selectedModel || !selectedConfig.apiKey) {
      if (!silent) toast.error('请先在设置中选择AI模型和配置API Key');
      return;
    }
    
    setIsLoadingAffection(true);
    if (!silent) {
      setShowAffectionDialog(true);
    }
    
    console.log('🎯 [好感度] 准备调用API:', {
      projectId,
      hasAccessToken: !!accessToken,
      url: `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/ai/affection`,
      targetContactId,
      contactName: contact.nickname
    });
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/ai/affection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          contactId: targetContactId,
          chatHistory: friend.chatMessages,
          apiKey: selectedConfig.apiKey,
          apiType: selectedConfig.type,
          modelId: selectedConfig.selectedModel,
          baseUrl: selectedConfig.baseUrl,
          contactName: contact.nickname,
          userProfile: userProfile,
          silent: silent  // 传递静默模式标志
        })
      });
      
      // 检查HTTP状态码
      if (!response.ok) {
        const errorText = await response.text();
        if (!silent) {
          console.error('好感度API请求失败:', response.status, errorText);
        }
        throw new Error(`API��用失败 (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 存储到对应联系人的好感度数据
        setAffectionDataMap(prev => {
          const updated = {
            ...prev,
            [targetContactId]: data.data
          };
          if (!silent) {
            console.log('🎯 [好感度] 数据已更新:', {
              contactId: targetContactId,
              affection: data.data.affection,
              emotion: data.data.emotion,
              allData: updated
            });
          }
          return updated;
        });
        if (silent) {
          console.log('🎯 [好感度] 静默更新成功，好感度:', data.data.affection);
        }
      } else {
        if (!silent) {
          toast.error('获取好感度失败: ' + data.error);
          setShowAffectionDialog(false);
          console.error('获取好感度失败:', data.error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!silent) {
        console.error('获取好感度失败:', errorMessage);
        // 如果是404错误，提供更友好的提示
        if (errorMessage.includes('404')) {
          toast.error('好感度服务暂时不可用，请���后再试');
        } else {
          toast.error('获取好感度失败: ' + errorMessage);
        }
        setShowAffectionDialog(false);
      }
      // 静默模式下完全不打印日志
    } finally {
      setIsLoadingAffection(false);
    }
  };

  // 置顶/取消置顶聊天
  const handleTogglePin = (contactId: string) => {
    const updatedFriends = weChatFriends.map(f => 
      f.contactId === contactId ? { ...f, isPinned: !f.isPinned } : f
    );
    onWeChatFriendsChange(updatedFriends);
    const friend = getFriend(contactId);
    toast.success(friend?.isPinned ? '已取消置顶' : '已置顶');
  };

  // 消息免打扰开关
  const handleToggleMute = (contactId: string) => {
    const updatedFriends = weChatFriends.map(f => 
      f.contactId === contactId ? { ...f, isMuted: !f.isMuted } : f
    );
    onWeChatFriendsChange(updatedFriends);
    const friend = getFriend(contactId);
    toast.success(friend?.isMuted ? '已取消免打扰' : '已开启免打扰');
  };

  // 设置聊天背景
  const handleSetChatBackground = (contactId: string, backgroundUrl: string) => {
    const updatedFriends = weChatFriends.map(f => 
      f.contactId === contactId ? { ...f, chatBackground: backgroundUrl } : f
    );
    onWeChatFriendsChange(updatedFriends);
    toast.success('聊天背景已设置');
    setShowChatBackground(false);
    setChatBackgroundInput('');
  };

  // 清空聊天记录
  const handleClearChatHistory = (contactId: string) => {
    const updatedFriends = weChatFriends.map(f => 
      f.contactId === contactId ? { ...f, chatMessages: [] } : f
    );
    onWeChatFriendsChange(updatedFriends);
    toast.success('聊天记录已清空');
    setShowChatMenu(false);
  };

  // 标记���未读/已读
  const handleToggleMarkUnread = (contactId: string) => {
    const updatedFriends = weChatFriends.map(f => 
      f.contactId === contactId ? { ...f, markedUnread: !f.markedUnread } : f
    );
    onWeChatFriendsChange(updatedFriends);
    const friend = getFriend(contactId);
    toast.success(friend?.markedUnread ? '已取消标记未读' : '已标记为未读');
  };

  // 删除聊天（只清空聊天记录，保留好友）
  const handleDeleteChat = (contactId: string) => {
    const updatedFriends = weChatFriends.map(f => 
      f.contactId === contactId 
        ? { ...f, chatMessages: [], unreadCount: 0 } 
        : f
    );
    onWeChatFriendsChange(updatedFriends);
    
    // 如果当前正在聊天页面，返回聊天列表
    if (activeChatId === contactId) {
      setActiveChatId(null);
    }
    
    toast.success('已删除聊天记录');
  };

  // 渲染群聊聊天界面
  const renderGroupChatView = () => {
    console.log('[renderGroupChatView]函数被调用', { 
      activeGroupId, 
      showCardDialog,
      timestamp: Date.now() 
    });
    const group = activeGroupId ? getGroup(activeGroupId) : null;

    if (!group || !onWeChatGroupsChange) {
      setActiveGroupId(null);
      return null;
    }

    // 群聊AI回复功能
    const handleGroupAiReply = async () => {
      if (!activeGroupId || !onWeChatGroupsChange) return;

      const currentGroup = getGroup(activeGroupId);
      if (!currentGroup) return;

      // 检查AI配置
      if (!selectedApiId || apiConfigs.length === 0) {
        toast.error('请先在设置中配置AI');
        return;
      }

      const latestApiConfigs = apiConfigsRef.current;
      const selectedConfig = latestApiConfigs.find(c => c.id === selectedApiId);
      
      if (!selectedConfig || !selectedConfig.selectedModel || !selectedConfig.apiKey) {
        toast.error('AI配置不完整');
        return;
      }

      // 获取所有AI成员
      const aiMembers = currentGroup.memberIds
        .map(id => getContact(id))
        .filter(c => c && c.isAi);

      if (aiMembers.length === 0) {
        toast.error('群聊没有AI成员');
        return;
      }

      setIsAiReplying(true);

      try {
        // 🎯 使用新的群聊AI生成系统：一次性生成4-15条消息
        const messagesToSend = await generateGroupChatMessages(
          currentGroup,
          aiMembers,
          userProfile,
          selectedConfig,
          accessToken,
          getDateAndScheduleContext,
          contacts,  // 传入所有联系人信息
          weChatFriends,  // 传入所有好友（用于记忆）
          weChatGroups,  // 传入所有群组（用于记忆）
          undefined,  // 使用角色��料里的上下文设置
          crossSceneMemoryCount  // 跨场景记忆预览条数
        );

        // 依次发送每条消息，模拟真实输入延迟
        let messageIndex = 0;
        const sendNextMessage = () => {
          if (messageIndex >= messagesToSend.length) {
            setIsAiReplying(false);
            return;
          }

          const { sender, content } = messagesToSend[messageIndex];
          
          // 🧧 检测红包标记
          let messageContent = content;
          let groupRedpacketMessage: ChatMessage | null = null;
          
          // 检测<REDPACKET>标记
          const redpacketMatch = messageContent.match(/<REDPACKET>([^<]+)<\/REDPACKET>/);
          if (redpacketMatch) {
            console.log('🧧 [群聊AI] 检测到红包标记:', redpacketMatch[1]);
            const parts = redpacketMatch[1].split('|');
            console.log('🔍 [红包调试] parts数组:', parts);
            
            if (parts.length === 4) {
              const totalAmount = parseFloat(parts[0]);
              const note = parts[1];
              const type = parts[2] as 'normal' | 'lucky';
              const count = parseInt(parts[3]);
              
              // 移除红包标签
              messageContent = messageContent.replace(/<REDPACKET>[^<]+<\/REDPACKET>/g, '').trim();
              
              // 创建红包消息
              groupRedpacketMessage = {
                id: `group-redpacket-${Date.now()}-${Math.random()}`,
                senderId: sender,
                content: note,
                timestamp: Date.now(),
                type: 'redpacket',
                redpacketAmount: totalAmount,
                redpacketNote: note,
                redpacketType: type,
                redpacketCount: count,
                redpacketReceivers: [],
                redpacketStatus: 'pending'
              };
              
              const senderContact = getContact(sender);
              console.log(`🧧 [群聊AI] ${senderContact?.nickname} 发红包: ${note}，总金额¥${totalAmount}���类型${type}，共${count}个`);
              console.log('🔍 [红包调试] groupRedpacketMessage对象:', groupRedpacketMessage);
            } else {
              console.error('❌ [红包调试] parts长度不为4！实际:', parts.length);
            }
          }
          
          // 如果有红包，先添加红包消息到群聊
          if (groupRedpacketMessage) {
            onWeChatGroupsChange(prevGroups => {
              const currentGroup = prevGroups.find(g => g.id === activeGroupId);
              if (!currentGroup) return prevGroups;
              
              const updatedMessages = [...currentGroup.chatMessages, groupRedpacketMessage!];
              
              const updatedGroup: WeChatGroup = {
                ...currentGroup,
                chatMessages: updatedMessages,
                lastMessage: `[红包]${groupRedpacketMessage!.redpacketNote}`,
                lastMessageTime: Date.now()
              };
              
              return prevGroups.map(g => g.id === activeGroupId ? updatedGroup : g);
            });
            
            // 🔥 群聊场景：红包发送后，立即触发其他群成员抢红包
            setTimeout(() => {
              const currentGroup = weChatGroups.find(g => g.id === activeGroupId);
              if (currentGroup) {
                console.log(`🚀 [AI发红包] 触发群成员抢红包，groupId: ${activeGroupId}`);
                triggerAiGrabRedPacketWithGroup(activeGroupId, currentGroup);
              }
            }, 1000 + Math.random() * 2000);
            
            // 如果没有其他文本内容，跳过后续处理
            if (!messageContent) {
              messageIndex++;
              setTimeout(() => sendNextMessage(), 500 + Math.random() * 500);
              return;
            }
          }
          
          // 如果处理完红包后还有文本内容，发送普通消息
          if (messageContent) {
            const newMessage: ChatMessage = {
              id: `group-ai-${Date.now()}-${sender}-${messageIndex}`,
              senderId: sender,
              content: messageContent,
              timestamp: Date.now()
            };
            
            onWeChatGroupsChange(prevGroups => {
              const currentGroup = prevGroups.find(g => g.id === activeGroupId);
              if (!currentGroup) return prevGroups;
              
              const updatedGroup: WeChatGroup = {
                ...currentGroup,
                chatMessages: [...currentGroup.chatMessages, newMessage]
              };
              
              return prevGroups.map(g => g.id === activeGroupId ? updatedGroup : g);
            });
          }
          
          messageIndex++;
          // 随机延迟：短消息快点，长消息慢点
          const baseDelay = messageContent.length < 10 ? 800 : (messageContent.length < 30 ? 1500 : 2500);
          const randomDelay = baseDelay + Math.random() * 1000;
          setTimeout(sendNextMessage, randomDelay);
        };
        
        sendNextMessage();
      } catch (error) {
        console.error('❌ 群聊AI回复错误:', error);
        toast.error('AI回复失败');
        setIsAiReplying(false);
      }
      
      // 下面的旧代码已被替换，保留备用
      return;
      
      // === 以下是旧的群聊AI逻辑（已停用） ===
      try {

        // 让���个选中的AI角色依次发言
        let currentAiIndex = 0;
        
        const processNextAi = async () => {
          if (currentAiIndex >= selectedMemberIds.length) {
            setIsAiReplying(false);
            return;
          }
          
          const currentMemberId = selectedMemberIds[currentAiIndex];
          const contact = getContact(currentMemberId);
          
          if (!contact) {
            currentAiIndex++;
            processNextAi();
            return;
          }
          
          // 获取最新的聊天记录（包含之前AI的发言）
          const latestGroup = getGroup(activeGroupId);
          if (!latestGroup) {
            setIsAiReplying(false);
            return;
          }

          const systemPrompt = `你正在群聊中扮演${contact.remark || contact.nickname}（真实姓名：${contact.realName}）。

基本信息：
- 昵称：${contact.nickname}
${contact.personality ? `\n性格特点：${contact.personality}` : ''}

群���成员：
${groupMembers}
- ${userProfile.username}（用户本人）

${getDateAndScheduleContext(contact.contactId)}

重要提示：
1. 【群聊互动】这是一个真实的群聊！你能看到其他成员的聊天记录，请仔细阅读并针对话题进行回应
2. 【自然回应】不要各说各话！如果别人在讨论某个话题，你应该参与这个话题，而不是突然说无关的事
3. 【可以@人】可以@其他群成员回应他们的话，格式：@昵称（只能@群聊成员列表中的人）
4. 【保持性格】保持你的角色性格，使用口语化表达、表情符号等
4. 不要暴露你是AI的事实
5. 根据性格和情绪决��发送消息的数量（1-3条），用"---SPLIT---"分隔
6. 如果你的日程表中包含当前时间的安排，要自然地提及或回应相关活动
7. 【重要】不要在消息前加"角色名:"或"昵称:"这样的前缀，直接发送消息内容即可
8. 【重要】不要说"好的，收到！我准备好了"这类准备话��直接进入自然对话
9. 【重要】如果要@某人，只能@上面列出的��聊成员，格式：@昵称`;

          const messages = [
            { role: 'system', content: systemPrompt },
            ...latestGroup.chatMessages.slice(-15).map(msg => {
              const isMyMessage = msg.senderId === currentMemberId;
              const senderInfo = msg.senderId === 'me' ? userProfile.username : (getContact(msg.senderId)?.realName || getContact(msg.senderId)?.nickname || '成员');
              
              return {
                role: isMyMessage ? 'assistant' : 'user',
                content: isMyMessage ? msg.content : `${senderInfo}: ${msg.content}`
              };
            })
          ];

          const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`;
          const authToken = accessToken || (await import('../utils/supabase/info')).publicAnonKey;

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              type: selectedConfig.type,
              baseUrl: selectedConfig.baseUrl || '',
              apiKey: selectedConfig.apiKey,
              model: selectedConfig.selectedModel,
              messages: messages
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API请求失败:', {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText,
              config: {
                type: selectedConfig.type,
                model: selectedConfig.selectedModel,
                hasApiKey: !!selectedConfig.apiKey
              }
            });
            throw new Error(`API请求失败 (${response.status}): ${errorText}`);
          }

          const data = await response.json();

          if (!data.success || (!data.message && (!data.messages || data.messages.length === 0))) {
            throw new Error('AI没有返回消息内容');
          }

          const aiMessages = (data.messages && data.messages.length > 0) ? data.messages : [data.message];
          
          // 发送该AI的所有消息
          let messageIndex = 0;
          const sendNextMessage = () => {
            if (messageIndex >= aiMessages.length) {
              // 当前AI发送完毕，等待一段时间后让下一个AI发言
              currentAiIndex++;
              const delay = 2000 + Math.random() * 3000; // 2-5秒后下一个AI发言
              setTimeout(processNextAi, delay);
              return;
            }
            
            const newMessage: ChatMessage = {
              id: `group-ai-${Date.now()}-${currentMemberId}-${messageIndex}`,
              senderId: currentMemberId,
              content: aiMessages[messageIndex].trim(),
              timestamp: Date.now()
            };
            
            onWeChatGroupsChange(prevGroups => {
              const currentGroup = prevGroups.find(g => g.id === activeGroupId);
              if (!currentGroup) return prevGroups;
              
              const updatedGroup: WeChatGroup = {
                ...currentGroup,
                chatMessages: [...currentGroup.chatMessages, newMessage]
              };
              
              return prevGroups.map(g => g.id === activeGroupId ? updatedGroup : g);
            });
            
            messageIndex++;
            const delay = 1000 + Math.random() * 2000;
            setTimeout(sendNextMessage, delay);
          };
          
          sendNextMessage();
        };
        
        // 开始处理第一个AI
        processNextAi();
      } catch (error) {
        console.error('❌ 群聊AI回复错误:', error);
        toast.error('AI回复失败');
        setIsAiReplying(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen">
        {/* 状态栏 */}
        <StatusBar 
          realTime={realTime}
          batteryLevel={batteryLevel}
          isCharging={isCharging}
          theme="light"
        />
        
        {/* 群聊界面头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white flex-shrink-0">
          <button
            onClick={() => isMultiSelectMode ? exitMultiSelectMode() : setActiveGroupId(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {isMultiSelectMode ? (
            <div className="flex-1 text-center">
              <h1 className="text-lg">
                已选择 {selectedMessageIds.size} 条消息
              </h1>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="text-lg">{group.name}</h1>
              <span className="text-xs text-gray-500">{group.memberIds.length + 1}人</span>
            </div>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
            
            {/* 群聊菜单 */}
            {showChatMenu && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 space-y-3">
                  {/* 搜索聊���记录 */}
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="搜索聊天记录"
                        className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* 消息免打扰 */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <BellOff className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">消息免打扰</span>
                    </div>
                    <Switch
                      checked={group.isMuted || false}
                      onCheckedChange={() => handleToggleGroupMute(activeGroupId)}
                    />
                  </div>

                  {/* 置顶聊天 */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">置顶聊天</span>
                    </div>
                    <Switch
                      checked={group.isPinned || false}
                      onCheckedChange={() => handleToggleGroupPin(activeGroupId)}
                    />
                  </div>

                  <Separator />

                  {/* 聊天总结 */}
                  <button
                    onClick={() => {
                      setShowSummaryDialog(true);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <List className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">聊天总结</span>
                  </button>

                  {/* 设置聊天背景 */}
                  <button
                    onClick={() => {
                      setShowChatBackground(true);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">设置聊天背景</span>
                  </button>

                  {/* 清空聊天记录 */}
                  <button
                    onClick={() => {
                      setShowClearChatConfirm(true);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded-lg transition-colors text-left text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">清空聊天记录</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 bg-gray-100 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={group.chatBackground ? { backgroundImage: `url(${group.chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          <div className="p-4 space-y-4 min-h-full">
            {group.chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>暂无聊天记录</p>
                {group.isUserInGroup && (
                  <p className="text-sm mt-2">发送第一条消息开始聊天吧</p>
                )}
              </div>
            ) : (
              group.chatMessages.map((message, index) => {
                const isMe = message.senderId === 'me';
                const sender = isMe ? null : getContact(message.senderId);
                const isVoice = message.type === 'voice';
                const isPat = message.type === 'pat';
                const isImage = message.type === 'image';
                const isCamera = message.type === 'camera';
                const isLocation = message.type === 'location';
                const isTransfer = message.type === 'transfer';
                const isRedPacket = message.type === 'redpacket';
                const isSystem = message.type === 'system';
                const isCard = message.type === 'card';
                const isMomentShare = message.type === 'momentShare';
                const isGift = message.type === 'gift';
                
                // 🔍 调试日志：检查红包消息类型
                if (message.type === 'redpacket' || message.redpacketAmount) {
                  console.log('🧧 [群聊消息渲染] 检测到红包消息:', {
                    id: message.id,
                    type: message.type,
                    isRedPacket,
                    redpacketAmount: message.redpacketAmount,
                    redpacketNote: message.redpacketNote,
                    redpacketType: message.redpacketType,
                    redpacketCount: message.redpacketCount,
                    redpacketStatus: message.redpacketStatus
                  });
                }
                
                // 🔍 调试日志：检查朋友圈分享消息类型
                if (message.type === 'momentShare' || message.momentShareId) {
                  console.log('🎴 [群聊消息渲染] 检测到朋友圈分享消息:', {
                    id: message.id,
                    type: message.type,
                    isMomentShare,
                    momentShareId: message.momentShareId,
                    momentShareContent: message.momentShareContent,
                    momentShareAuthorName: message.momentShareAuthorName
                  });
                }
                
                // 🔍 调试日志：检查位置消息类型
                if (message.type === 'location' || message.locationAddress) {
                  console.log('📍 [群聊消息渲染] 检测到位置消息:', {
                    id: message.id,
                    type: message.type,
                    isLocation,
                    locationAddress: message.locationAddress,
                    content: message.content
                  });
                }
                
                // 判断是否显示时间标签
                const previousMessage = index > 0 ? group.chatMessages[index - 1] : undefined;
                const showTime = shouldShowTimeLabel(message.timestamp, previousMessage?.timestamp);
                
                // 如果是撤回消息，渲染特殊样式
                if (message.recalled) {
                  const recallerName = message.recalledBy === 'me' ? '你' : (sender?.remark || sender?.nickname || '对方');
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="flex justify-center mb-2">
                          <div className="text-xs text-gray-500 px-2 py-1">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center my-2">
                        <button 
                          onClick={() => setViewRecalledMessage(message)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {recallerName}撤回了一条消息
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // 如果是拍一拍消息，渲染特殊样式
                if (isPat) {
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="flex justify-center mb-2">
                          <div className="text-xs text-gray-500 px-2 py-1">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center">
                        <div className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // 如果是系统消息，渲染特殊样式
                if (isSystem) {
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="flex justify-center mb-2">
                          <div className="text-xs text-gray-500 px-2 py-1">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center my-1">
                        <div className="text-xs text-gray-500 bg-orange-50 px-3 py-1 rounded">
                          {message.text}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="flex justify-center mb-2">
                        <div className="text-xs text-gray-500 px-2 py-1">
                          {formatChatTime(message.timestamp)}
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          toggleMessageSelection(message.id);
                        }
                      }}
                    >
                    {isMultiSelectMode && (
                      <div className="flex items-start pt-2">
                        <input
                          type="checkbox"
                          checked={selectedMessageIds.has(message.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleMessageSelection(message.id);
                          }}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                      </div>
                    )}
                    <button
                      onMouseDown={() => {
                        if (!isMe && sender) {
                          handleAvatarLongPressStart(sender, true);
                        }
                      }}
                      onMouseUp={() => {
                        if (!isMe && sender) {
                          const key = `group_${sender.id}`;
                          handleAvatarLongPressEnd(key);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isMe && sender) {
                          const key = `group_${sender.id}`;
                          handleAvatarLongPressEnd(key);
                        }
                      }}
                      onTouchStart={() => {
                        if (!isMe && sender) {
                          handleAvatarLongPressStart(sender, true);
                        }
                      }}
                      onTouchEnd={() => {
                        if (!isMe && sender) {
                          const key = `group_${sender.id}`;
                          handleAvatarLongPressEnd(key);
                        }
                      }}
                      onClick={() => {
                        if (!isMe && sender) {
                          handleAvatarClick(sender, true);
                        }
                      }}
                      className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      disabled={isMe}
                    >
                      <Avatar className="w-10 h-10 rounded-md">
                        {isMe ? (
                          <>
                            <AvatarImage src={userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=me"} />
                            <AvatarFallback className="rounded-md">{userProfile.username?.[0] || '我'}</AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="rounded-md">{sender?.nickname[0]}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                    </button>
                    <div className={`flex gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    <div className={`w-fit max-w-full ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isMe && (
                        <span className="text-xs text-gray-500 px-2">
                          {sender?.remark || sender?.nickname}
                        </span>
                      )}
                      {isImage ? (
                        <ImageMessage
                          message={message}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isCamera ? (
                        <CameraMessage
                          message={message}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isLocation ? (
                        <LocationMessage
                          message={message}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isTransfer ? (
                        <TransferMessage
                          message={message}
                          isMe={isMe}
                          onReceive={handleReceiveTransfer}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isRedPacket ? (
                        <RedPacketMessage
                          note={message.redpacketNote || '恭喜发财，大吉大利'}
                          amount={message.redpacketAmount}
                          type={message.redpacketType}
                          count={message.redpacketCount}
                          status={message.redpacketStatus}
                          receivers={message.redpacketReceivers}
                          isReceived={message.redpacketReceivers?.some(r => r.userId === 'me')}
                          receivedAmount={message.redpacketReceivers?.find(r => r.userId === 'me')?.amount}
                          onClick={() => {
                            setSelectedRedPacket(message);
                            setShowRedPacketDetail(true);
                          }}
                        />
                      ) : isGift && message.giftId && message.giftName && message.giftIcon ? (
                        <GiftMessage
                          message={message}
                          isMe={isMe}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isCard && message.cardContactId && message.cardContactName && message.cardContactAvatar ? (
                        <ContactCardMessage
                          cardContactName={message.cardContactName}
                          cardContactAvatar={message.cardContactAvatar}
                          onClick={() => {
                            // 点击名片后打开联系人资料页面
                            const cardContactId = message.cardContactId;
                            if (!cardContactId) return;
                            
                            const cardContact = contacts.find(c => c.id === cardContactId);
                            if (!cardContact) {
                              toast.error('联系人不存在');
                              return;
                            }
                            
                            // 打开联系人资料页面
                            setSelectedProfileContact(cardContact);
                            setShowContactProfile(true);
                            console.log(`👤 [群聊名片] 打开 ${cardContact.nickname} 的资料页面`);
                          }}
                        />
                      ) : isVoice ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => toggleVoiceText(message.id)}
                            onTouchStart={(e) => handleMessageLongPressStart(message, e as any)}
                            onTouchEnd={handleMessageLongPressEnd}
                            onMouseDown={(e) => handleMessageLongPressStart(message, e as any)}
                            onMouseUp={handleMessageLongPressEnd}
                            onMouseLeave={handleMessageLongPressEnd}
                            className={`px-4 py-2 rounded-lg ${
                              isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'
                            } flex items-center gap-2 min-w-[120px] hover:opacity-90 transition-opacity`}
                          >
                            <Mic className="w-4 h-4" />
                            <span className="text-sm">{message.voiceDuration}"</span>
                          </button>
                          {message.showVoiceText && message.voiceText && (
                            <div
                              className={`px-3 py-1.5 rounded text-xs ${
                                isMe ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {message.voiceText}
                            </div>
                          )}
                        </div>
                      ) : (
                        renderMessageContent(message, isMe, {
                          onTouchStart: (e: any) => {
                            console.log('[群聊]触摸开始', message.senderId);
                            handleMessageLongPressStart(message, e);
                          },
                          onTouchEnd: () => {
                            console.log('[群聊]触摸结束');
                            handleMessageLongPressEnd();
                          },
                          onMouseDown: (e: any) => {
                            console.log('[群聊]鼠标按下', message.senderId);
                            handleMessageLongPressStart(message, e);
                          },
                          onMouseUp: () => {
                            console.log('[群聊]鼠标松开');
                            handleMessageLongPressEnd();
                          },
                          onMouseLeave: () => {
                            console.log('[群聊]鼠标离开');
                            handleMessageLongPressEnd();
                          }
                        })
                      )}
                    </div>
                    {/* 红色感叹号 - 消息发送失败（被拉黑） */}
                    {isMe && message.failed && (
                      <div className="flex items-end pb-1">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                      </div>
                    )}
                    {/* 重roll按钮 - 只在最后一条AI消息上显示 */}
                    {!isMe && (() => {
                      // 检查是否是最后一条AI消息
                      const lastAiMessageIndex = group.chatMessages.length - 1 - 
                        [...group.chatMessages].reverse().findIndex(msg => msg.senderId !== 'me');
                      const isLastAiMessage = index === lastAiMessageIndex;
                      
                      if (!isLastAiMessage) return null;
                      
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRerollGroupChat();
                          }}
                          className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-full transition-colors mb-1"
                          title="重新生成"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      );
                    })()}
                    </div>
                  </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框区域 / 多选操作栏 */}
        {group.isUserInGroup ? (
          isMultiSelectMode ? (
            <div className="bg-white border-t flex-shrink-0 p-4">
              <div className="flex items-center justify-around gap-2">
                <button
                  onClick={handleBatchDelete}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-6 h-6 text-red-500" />
                  <span className="text-xs text-gray-600">删除</span>
                </button>
                <button
                  onClick={handleBatchForward}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Share2 className="w-6 h-6 text-blue-500" />
                  <span className="text-xs text-gray-600">转发</span>
                </button>
                <button
                  onClick={handleBatchCollect}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Star className="w-6 h-6 text-yellow-500" />
                  <span className="text-xs text-gray-600">收藏</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border-t flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    console.log('[Plus按钮]点击Plus按钮，当前状态:', { showPlusMenu, activeGroupId });
                    setShowPlusMenu(!showPlusMenu);
                    setShowEmoticonPanel(false);
                  }}
                  className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${showPlusMenu ? 'bg-gray-100' : ''}`}
                >
                  <Plus className="w-6 h-6 text-gray-600" />
                </button>
                <button 
                  onClick={() => setShowVoiceDialog(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Mic className="w-6 h-6 text-gray-600" />
                </button>
                <button 
                  onClick={() => {
                    setShowEmoticonPanel(!showEmoticonPanel);
                    setShowPlusMenu(false);
                  }}
                  className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${showEmoticonPanel ? 'bg-gray-100' : ''}`}
                >
                  <Smile className="w-6 h-6 text-gray-600" />
                </button>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendGroupMessage();
                    }
                  }}
                  placeholder="发送消息..."
                  className="flex-1"
                />
                <Button
                  onClick={handleGroupAiReply}
                  disabled={isAiReplying}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                  title="AI回复"
                >
                  {isAiReplying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={handleSendGroupMessage}
                  disabled={!messageInput.trim()}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
              {showEmoticonPanel && (
                <EmoticonPanel
                  onSelect={(emoji) => {
                    setMessageInput(prev => prev + emoji);
                  }}
                  onClose={() => setShowEmoticonPanel(false)}
                  customEmojis={customEmojis}
                  onCustomEmojisChange={onCustomEmojisChange}
                />
              )}
              
              {showPlusMenu && (
                <PlusMenuPanel
                  onClose={() => setShowPlusMenu(false)}
                  onSelectAction={handlePlusMenuAction}
                />
              )}
            </div>
          )
        ) : (
          <div className="bg-white border-t flex-shrink-0 p-4">
            <div className="flex items-center justify-center gap-2">
              <div className="text-center flex-1">
                <p className="text-sm text-gray-500 mb-3">你不在这个群中，无法发送消息</p>
                <Button
                  onClick={handleGroupAiReply}
                  disabled={isAiReplying}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isAiReplying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      AI正在发言...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      让AI发消息
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 群聊设置���景对话框 */}
        <Dialog open={showChatBackground} onOpenChange={setShowChatBackground}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>设置聊天背景</DialogTitle>
              <DialogDescription>
                输入图片URL设置聊天背景
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>背景图片URL</Label>
                <Input
                  value={chatBackgroundInput}
                  onChange={(e) => setChatBackgroundInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowChatBackground(false);
                    setChatBackgroundInput('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    if (activeGroupId) {
                      handleSetGroupChatBackground(activeGroupId, chatBackgroundInput);
                    }
                  }}
                  disabled={!chatBackgroundInput.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  设置背景
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 清空群聊记录确认对话框 */}
        <AlertDialog open={showClearChatConfirm} onOpenChange={setShowClearChatConfirm}>
          <AlertDialogContent className="max-w-[320px]">
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空聊天记录</AlertDialogTitle>
              <AlertDialogDescription>
                确定要清空所有聊天记录吗？此操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (activeGroupId) {
                    handleClearGroupChatHistory(activeGroupId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                确认清空
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 联系人主页 - 在群聊界面中 */}
        {showContactProfile && selectedProfileContact && (
          <ContactProfile
            contact={selectedProfileContact}
            onClose={() => {
              setShowContactProfile(false);
              setSelectedProfileContact(null);
            }}
            wechatId={selectedProfileContact.wechatId}
            region={selectedProfileContact.region}
            signature={selectedProfileContact.signature}
            summaries={group.summaries || []}
            commonGroups={
              weChatGroups
                .filter(group => group.memberIds.includes(selectedProfileContact.id))
                .map(group => ({ id: group.id, name: group.name }))
            }
            onSendMessage={() => {
              // 打开聊天界面
              setActiveChatId(selectedProfileContact.id);
              setActiveTab('chats');
              setActiveGroupId(null); // 关闭群��
            }}
            onVideoCall={() => {
              setVideoCallContact(selectedProfileContact);
              setShowVideoCall(true);
            }}
            worldBooks={worldBooks}
            rules={rules}
            moments={(() => {
              const filteredMoments = moments.filter(m => m.contactId === selectedProfileContact.id);
              console.log('ContactProfile (群聊) moments debug:', {
                allMoments: moments.length,
                contactId: selectedProfileContact.id,
                contactNickname: selectedProfileContact.nickname,
                filteredMoments: filteredMoments.length,
                momentContactIds: moments.map(m => m.contactId)
              });
              return filteredMoments;
            })()}
            onMomentsClick={() => {
              console.log('点击朋友圈按钮 (群聊):', selectedProfileContact.nickname);
              setSelectedMomentsContact(selectedProfileContact);
              setShowContactMoments(true);
              console.log('状态已更新:', { showContactMoments: true, selectedMomentsContact: selectedProfileContact.nickname });
            }}
            onContactUpdate={(updatedContact) => {
              if (onContactsChange) {
                const updatedContacts = contacts.map(c => 
                  c.id === updatedContact.id ? updatedContact : c
                );
                onContactsChange(updatedContacts);
              }
            }}
          />
        )}

        {/* 图片对话框 - 群聊 */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>发送图片</DialogTitle>
              <DialogDescription>
                输入图片URL或上传本地图片
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>图片URL</Label>
                <Input
                  value={imageUrlInput}
                  onChange={(e) => {
                    setImageUrlInput(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>或上传本地图片</Label>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="mt-2 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
              </div>
              {imagePreview && (
                <div>
                  <Label>图片预览</Label>
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="mt-2 max-w-full max-h-[200px] rounded-lg object-contain"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImageDialog(false);
                    setImageUrlInput('');
                    setImagePreview('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSendImageMessageToGroup}
                  disabled={!imagePreview.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  发送图片
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 拍摄对话框 - 群聊 */}
        <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>拍摄内容</DialogTitle>
              <DialogDescription>
                用文字描述你拍摄的内容
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>拍摄内容描述</Label>
                <Textarea
                  value={cameraDescriptionInput}
                  onChange={(e) => setCameraDescriptionInput(e.target.value)}
                  placeholder="请描述你拍摄的内容，例如：一杯冒着热气的咖啡，旁边放着一本打开的书..."
                  rows={6}
                  className="resize-none mt-2"
                />
                {cameraDescriptionInput.trim() && (
                  <p className="text-xs text-gray-500 mt-2">
                    {cameraDescriptionInput.trim().length} 字
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCameraDialog(false);
                    setCameraDescriptionInput('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSendCameraMessageToGroup}
                  disabled={!cameraDescriptionInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  发送拍摄
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 位置对话框 - 群聊 */}
        <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>发送位置</DialogTitle>
              <DialogDescription>
                输入位置地址信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>位置地址</Label>
                <Textarea
                  value={locationAddressInput}
                  onChange={(e) => setLocationAddressInput(e.target.value)}
                  placeholder="例如：北京市朝阳区建国路88号SOHO现代城"
                  rows={4}
                  className="resize-none mt-2"
                />
                {locationAddressInput.trim() && (
                  <p className="text-xs text-gray-500 mt-2">
                    {locationAddressInput.trim().length} 字
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowLocationDialog(false);
                    setLocationAddressInput('');
                  }}
                >
                  ��消
                </Button>
                <Button 
                  onClick={handleSendLocationMessageToGroup}
                  disabled={!locationAddressInput.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  发送位置
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 语音对话框 - 群聊 */}
        <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>发送语音</DialogTitle>
              <DialogDescription>
                输入语音内容，将转换为语音消息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>语音内容</Label>
                <Textarea
                  value={voiceInputText}
                  onChange={(e) => setVoiceInputText(e.target.value)}
                  placeholder="请输入要发送的语音内容..."
                  rows={4}
                  className="resize-none mt-2"
                />
                {voiceInputText.trim() && (
                  <p className="text-xs text-gray-500 mt-2">
                    预计时长: {Math.ceil(voiceInputText.trim().length / 3)}"
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowVoiceDialog(false);
                    setVoiceInputText('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSendVoiceMessageToGroup}
                  disabled={!voiceInputText.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  发送语音
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 朋友圈详情对话框 - 群聊 */}
        {(() => {
          const selectedMoment = moments.find(m => m.id === selectedMomentId);
          return (
            <MomentDetailDialog
              open={showMomentDetailDialog}
              onOpenChange={setShowMomentDetailDialog}
              moment={selectedMoment || null}
              currentUser={{
                id: 'me',
                nickname: userProfile.username || '我',
                realName: userProfile.username || '我',
                avatar: userProfile.avatar,
                phoneNumber: '',
                tags: [],
                remark: ''
              }}
              contacts={contacts}
              onLike={handleMomentLike}
              onComment={handleMomentComment}
            />
          );
        })()}
      </div>
    );
  };

  // 渲染聊天界面
  const renderChatView = () => {
    const friend = activeChatId ? getFriend(activeChatId) : null;
    const contact = activeChatId ? getContact(activeChatId) : null;

    if (!friend || !contact) return null;

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen">
        {/* 状态栏 */}
        <StatusBar 
          realTime={realTime}
          batteryLevel={batteryLevel}
          isCharging={isCharging}
          theme="light"
        />
        
        {/* ���天界面头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white flex-shrink-0">
          <button
            onClick={() => isMultiSelectMode ? exitMultiSelectMode() : setActiveChatId(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {isMultiSelectMode ? (
            <div className="flex-1 text-center">
              <h1 className="text-lg">
                已选择 {selectedMessageIds.size} 条消息
              </h1>
            </div>
          ) : (
            <button 
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
              onClick={() => {
                setSelectedProfileContact(contact);
                setShowContactProfile(true);
              }}
            >
              <h1 className="text-lg">
                {isAiReplying ? '对方正在输入中...' : (contact.remark || contact.nickname)}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${contact.isOnline !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-500">
                    {contact.statusText || (contact.isOnline !== false ? '在线' : '离线')}
                  </span>
                </div>
                {affectionData && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-pink-50 rounded-full">
                    <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                    <span className="text-xs text-pink-600">
                      {affectionData.affection}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )}
          <div className="flex items-center gap-2">
            {/* 好感度按钮 */}
            {!isMultiSelectMode && (
              <button 
                onClick={() => handleGetAffection(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                title="查看好感度详细分析"
              >
                <Heart className="w-6 h-6 text-red-500" />
                {affectionData && (
                  <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {affectionData.affection}
                  </div>
                )}
              </button>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            
            {/* 聊天菜单 */}
            {showChatMenu && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 space-y-3">
                  {/* 搜索聊天记录 */}
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="搜索聊天记录"
                        className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* 消息免打扰 */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <BellOff className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">消息免打扰</span>
                    </div>
                    <Switch
                      checked={friend.isMuted || false}
                      onCheckedChange={() => handleToggleMute(activeChatId)}
                    />
                  </div>

                  {/* 置顶聊天 */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">置顶聊天</span>
                    </div>
                    <Switch
                      checked={friend.isPinned || false}
                      onCheckedChange={() => handleTogglePin(activeChatId)}
                    />
                  </div>

                  <Separator />

                  {/* 聊天总结 */}
                  <button
                    onClick={() => {
                      setShowSummaryDialog(true);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <List className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">聊天总结</span>
                  </button>

                  {/* 设置聊天背景 */}
                  <button
                    onClick={() => {
                      setShowChatBackground(true);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">设置聊天背景</span>
                  </button>

                  {/* 清空聊天记录 */}
                  <button
                    onClick={() => {
                      setShowClearChatConfirm(true);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded-lg transition-colors text-left text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">清空聊天记录</span>
                  </button>

                  <Separator />

                  {/* 拉黑/取消拉黑 */}
                  <button
                    onClick={() => {
                      const contact = contacts.find(c => c.id === activeChatId);
                      if (contact) {
                        const newBlockedState = !contact.blockedByUser;
                        onContactsChange(contacts.map(c => 
                          c.id === activeChatId 
                            ? { ...c, blockedByUser: newBlockedState }
                            : c
                        ));
                        toast.success(newBlockedState ? '已拉黑该联系人' : '已取消拉黑');
                      }
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded-lg transition-colors text-left text-red-600"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">{friend.blockedByUser ? '取消拉黑' : '拉黑该联系人'}</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 bg-gray-100 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={friend.chatBackground ? { backgroundImage: `url(${friend.chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          <div className="p-4 space-y-4 min-h-full">
            {(() => {
              console.log('🎨 [WeChat] 渲染私聊消息列表', {
                friendId: friend.contactId,
                friendName: friend.nickname || friend.realName,
                totalMessages: friend.chatMessages.length,
                messageTypes: friend.chatMessages.map(m => ({ id: m.id, type: m.type }))
              });
              
              // 过滤消息：根据搜索关键词和拉黑状态
              const contact = contacts.find(c => c.id === activeChatId);
              const isUserBlockedContact = contact?.blockedByUser || false; // 用户是否拉黑了角色
              
              const filteredMessages = searchKeyword.trim() 
                ? friend.chatMessages.filter(msg => {
                    const content = msg.type === 'voice' ? msg.voiceText || '' : msg.content;
                    return content.toLowerCase().includes(searchKeyword.toLowerCase());
                  })
                : friend.chatMessages;
              
              // 如果用户拉黑了角色，过滤掉角色的消息（用户看不到角色回复）
              const visibleMessages = isUserBlockedContact 
                ? filteredMessages.filter(msg => msg.senderId === 'me')
                : filteredMessages;

              if (friend.chatMessages.length === 0) {
                return (
                  <div className="text-center text-gray-400 py-8">
                    <p>暂无聊天记录</p>
                    <p className="text-sm mt-2">发送第一条消息开始聊天吧</p>
                  </div>
                );
              }

              if (visibleMessages.length === 0 && searchKeyword.trim()) {
                return (
                  <div className="text-center text-gray-400 py-8">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>未找到包含"{searchKeyword}"的消息</p>
                    <p className="text-sm mt-2">试试其他关键词</p>
                  </div>
                );
              }

              return visibleMessages.map((message, index) => {
                const isMe = message.senderId === 'me';
                const sender = isMe ? null : getContact(message.senderId);
                const isVoice = message.type === 'voice';
                const isPat = message.type === 'pat';
                const isImage = message.type === 'image';
                const isCamera = message.type === 'camera';
                const isLocation = message.type === 'location';
                const isTransfer = message.type === 'transfer';
                const isRedPacket = message.type === 'redpacket';
                const isSystem = message.type === 'system';
                const isMomentShare = message.type === 'momentShare';
                const isGift = message.type === 'gift';
                
                // 🔍 调试日志：检查红包消息类型
                if (message.type === 'redpacket' || message.redpacketAmount) {
                  console.log('🧧 [私聊消息渲染] 检测到红包消息:', {
                    id: message.id,
                    type: message.type,
                    isRedPacket,
                    redpacketAmount: message.redpacketAmount,
                    redpacketNote: message.redpacketNote,
                    redpacketType: message.redpacketType,
                    redpacketCount: message.redpacketCount,
                    redpacketStatus: message.redpacketStatus
                  });
                }
                
                // 🔍 调试日志：检查朋友圈分享消息类型
                if (message.type === 'momentShare' || message.momentShareId) {
                  console.log('🎴 [私聊消息渲染] 检测到朋友圈分享消息:', {
                    id: message.id,
                    type: message.type,
                    isMomentShare,
                    momentShareId: message.momentShareId,
                    momentShareContent: message.momentShareContent,
                    momentShareAuthorName: message.momentShareAuthorName
                  });
                }
                
                // 🔍 调试日志：检查位置消息类型
                if (message.type === 'location' || message.locationAddress) {
                  console.log('📍 [私聊消息渲染] 检测到位置消息:', {
                    id: message.id,
                    type: message.type,
                    isLocation,
                    locationAddress: message.locationAddress,
                    content: message.content
                  });
                }
                
                // 判断是否显示时间标签
                const previousMessage = index > 0 ? visibleMessages[index - 1] : undefined;
                const showTime = shouldShowTimeLabel(message.timestamp, previousMessage?.timestamp);
                
                // 如果是���回消息，渲染特殊样式
                if (message.recalled) {
                  const recallerName = message.recalledBy === 'me' ? '你' : (sender?.remark || sender?.nickname || '对方');
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="flex justify-center mb-2">
                          <div className="text-xs text-gray-500 px-2 py-1">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center my-2">
                        <button 
                          onClick={() => setViewRecalledMessage(message)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {recallerName}撤回了一条消息
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // 如果是拍一拍消息，渲染特殊样式
                if (isPat) {
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="flex justify-center mb-2">
                          <div className="text-xs text-gray-500 px-2 py-1">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center">
                        <div className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // 如果是系统消息，渲染特殊样式
                if (isSystem) {
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="flex justify-center mb-2">
                          <div className="text-xs text-gray-500 px-2 py-1">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center my-1">
                        <div className="text-xs text-gray-500 bg-orange-50 px-3 py-1 rounded">
                          {message.text}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="flex justify-center mb-2">
                        <div className="text-xs text-gray-500 px-2 py-1">
                          {formatChatTime(message.timestamp)}
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          toggleMessageSelection(message.id);
                        }
                      }}
                    >
                    {isMultiSelectMode && (
                      <div className="flex items-start pt-2">
                        <input
                          type="checkbox"
                          checked={selectedMessageIds.has(message.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleMessageSelection(message.id);
                          }}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                      </div>
                    )}
                    <button
                      onMouseDown={() => {
                        if (!isMe && sender) {
                          handleAvatarLongPressStart(sender, false);
                        }
                      }}
                      onMouseUp={() => {
                        if (!isMe && sender) {
                          const key = `chat_${sender.id}`;
                          handleAvatarLongPressEnd(key);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isMe && sender) {
                          const key = `chat_${sender.id}`;
                          handleAvatarLongPressEnd(key);
                        }
                      }}
                      onTouchStart={() => {
                        if (!isMe && sender) {
                          handleAvatarLongPressStart(sender, false);
                        }
                      }}
                      onTouchEnd={() => {
                        if (!isMe && sender) {
                          const key = `chat_${sender.id}`;
                          handleAvatarLongPressEnd(key);
                        }
                      }}
                      onClick={() => {
                        if (!isMe && sender) {
                          handleAvatarClick(sender, false);
                        }
                      }}
                      className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      disabled={isMe}
                    >
                      <Avatar className="w-10 h-10 rounded-md">
                        {isMe ? (
                          <>
                            <AvatarImage src={userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=me"} />
                            <AvatarFallback className="rounded-md">{userProfile.username?.[0] || '我'}</AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="rounded-md">{sender?.nickname[0]}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                    </button>
                    <div className={`flex gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    <div className={`w-fit max-w-full ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {isImage ? (
                        <ImageMessage
                          message={message}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isCamera ? (
                        <CameraMessage
                          message={message}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isLocation ? (
                        <LocationMessage
                          message={message}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isTransfer ? (
                        <TransferMessage
                          message={message}
                          isMe={isMe}
                          onReceive={handleReceiveTransfer}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isRedPacket ? (
                        <RedPacketMessage
                          note={message.redpacketNote || '恭喜发财，大吉大利'}
                          amount={message.redpacketAmount}
                          type={message.redpacketType}
                          count={message.redpacketCount}
                          status={message.redpacketStatus}
                          receivers={message.redpacketReceivers}
                          isReceived={message.redpacketReceivers?.some(r => r.userId === 'me')}
                          receivedAmount={message.redpacketReceivers?.find(r => r.userId === 'me')?.amount}
                          onClick={() => {
                            setSelectedRedPacket(message);
                            setShowRedPacketDetail(true);
                          }}
                        />
                      ) : isGift && message.giftId && message.giftName && message.giftIcon ? (
                        <GiftMessage
                          message={message}
                          isMe={isMe}
                          onLongPressStart={(e) => handleMessageLongPressStart(message, e)}
                          onLongPressEnd={handleMessageLongPressEnd}
                        />
                      ) : isVoice ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => toggleVoiceText(message.id)}
                            onTouchStart={(e) => handleMessageLongPressStart(message, e as any)}
                            onTouchEnd={handleMessageLongPressEnd}
                            onMouseDown={(e) => handleMessageLongPressStart(message, e as any)}
                            onMouseUp={handleMessageLongPressEnd}
                            onMouseLeave={handleMessageLongPressEnd}
                            className={`px-4 py-2 rounded-lg ${
                              isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'
                            } flex items-center gap-2 min-w-[120px] hover:opacity-90 transition-opacity`}
                          >
                            <Mic className="w-4 h-4" />
                            <span className="text-sm">{message.voiceDuration}"</span>
                          </button>
                          {message.showVoiceText && message.voiceText && (
                            <div
                              className={`px-3 py-1.5 rounded text-xs ${
                                isMe ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {message.voiceText}
                            </div>
                          )}
                        </div>
                      ) : (
                        renderMessageContent(message, isMe, {
                          onTouchStart: (e: any) => {
                            console.log('触摸开始', message.senderId);
                            handleMessageLongPressStart(message, e);
                          },
                          onTouchEnd: () => {
                            console.log('触摸结束');
                            handleMessageLongPressEnd();
                          },
                          onMouseDown: (e: any) => {
                            console.log('鼠标按下', message.senderId);
                            handleMessageLongPressStart(message, e);
                          },
                          onMouseUp: () => {
                            console.log('鼠标松开');
                            handleMessageLongPressEnd();
                          },
                          onMouseLeave: () => {
                            console.log('鼠标离开');
                            handleMessageLongPressEnd();
                          }
                        })
                      )}
                    </div>
                    {/* 红色感叹号 - 消息发送失败（被拉黑） */}
                    {isMe && message.failed && (
                      <div className="flex items-end pb-1">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                      </div>
                    )}
                    {/* 重roll按钮 - 只在最后一条AI消息上显示 */}
                    {!isMe && (() => {
                      // 检查是否是最后一条AI消息
                      const lastAiMessageIndex = visibleMessages.length - 1 - 
                        [...visibleMessages].reverse().findIndex(msg => msg.senderId !== 'me');
                      const isLastAiMessage = index === lastAiMessageIndex;
                      
                      if (!isLastAiMessage) return null;
                      
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRerollPrivateChat();
                          }}
                          className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-full transition-colors mb-1"
                          title="重新生成"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      );
                    })()}
                    </div>
                  </div>
                  </div>
                );
              });
            })()}
            {/* 用于自动滚动到底部的元素 */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框区域 / 多选操作栏 */}
        {isMultiSelectMode ? (
          <div className="bg-white border-t flex-shrink-0 p-4">
            <div className="flex items-center justify-around gap-2">
              <button
                onClick={handleBatchDelete}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-6 h-6 text-red-500" />
                <span className="text-xs text-gray-600">删除</span>
              </button>
              <button
                onClick={handleBatchForward}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-6 h-6 text-blue-500" />
                <span className="text-xs text-gray-600">转发</span>
              </button>
              <button
                onClick={handleBatchCollect}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Star className="w-6 h-6 text-yellow-500" />
                <span className="text-xs text-gray-600">收藏</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border-t flex-shrink-0">
            {/* 引用消息预览 */}
            {quotedMessage && (() => {
              const quotedSender = quotedMessage.senderId === 'me' ? null : getContact(quotedMessage.senderId);
              const quotedSenderName = quotedMessage.senderId === 'me' ? '你' : (quotedSender?.remark || quotedSender?.nickname || '对方');
              return (
                <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">引用 {quotedSenderName}</div>
                      <div className="text-sm text-gray-700 truncate">{quotedMessage.content}</div>
                    </div>
                    <button
                      onClick={() => setQuotedMessage(null)}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })()}
            <div className="p-4">
              <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setShowPlusMenu(!showPlusMenu);
                  setShowEmoticonPanel(false);
                }}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${showPlusMenu ? 'bg-gray-100' : ''}`}
              >
                <Plus className="w-6 h-6 text-gray-600" />
              </button>
              <button 
                onClick={() => setShowVoiceDialog(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Mic className="w-6 h-6 text-gray-600" />
              </button>
              <button 
                onClick={() => {
                  setShowEmoticonPanel(!showEmoticonPanel);
                  setShowPlusMenu(false);
                }}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${showEmoticonPanel ? 'bg-gray-100' : ''}`}
              >
                <Smile className="w-6 h-6 text-gray-600" />
              </button>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="发送消息..."
                className="flex-1"
              />
              <Button
                onClick={handleAiReply}
                disabled={isAiReplying}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                title="AI回复"
              >
                {isAiReplying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                <Send className="w-4 h-4" />
              </Button>
              </div>
            </div>
            
            {/* 表情面板 */}
            {showEmoticonPanel && (
              <EmoticonPanel
                onSelect={(emoji) => {
                  setMessageInput(prev => prev + emoji);
                }}
                onClose={() => setShowEmoticonPanel(false)}
                customEmojis={customEmojis}
                onCustomEmojisChange={onCustomEmojisChange}
              />
            )}
            
            {/* 功能菜单面板 */}
            {showPlusMenu && (
              <PlusMenuPanel
                onClose={() => setShowPlusMenu(false)}
                onSelectAction={handlePlusMenuAction}
              />
            )}
          </div>
        )}
        
        {/* 语音输入���话框 */}
        <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>发送语音消息</DialogTitle>
              <DialogDescription>
                输入你要说的话，系统会根据字数自动计算语音时长
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>语音内容</Label>
                <Textarea
                  value={voiceInputText}
                  onChange={(e) => setVoiceInputText(e.target.value)}
                  placeholder="请输入你要说的内容..."
                  rows={4}
                  className="resize-none"
                />
                {voiceInputText.trim() && (
                  <p className="text-xs text-gray-500 mt-2">
                    预计语音时长：约 {calculateVoiceDuration(voiceInputText.trim())} 秒
                    <span className="text-gray-400 ml-2">（{voiceInputText.trim().length} 字）</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowVoiceDialog(false);
                    setVoiceInputText('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSendVoiceMessage}
                  disabled={!voiceInputText.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  发送语音
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 发送图片对话框 */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-md" onOpenAutoFocus={() => console.log('[对话框]相册对话框已渲染并获得焦点')}>
            <DialogHeader>
              <DialogTitle>发送图片</DialogTitle>
              <DialogDescription>
                输入图片URL或上传本地图片
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>图片URL</Label>
                <Input
                  value={imageUrlInput}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                  onFocus={() => console.log('[对话框]图片URL输入框获得焦点')}
                />
              </div>
              <div>
                <Label>或上传本地图片</Label>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="mt-2 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
              </div>
              {imagePreview && (
                <div>
                  <Label>图片预览</Label>
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="mt-2 max-w-full max-h-[200px] rounded-lg object-contain"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImageDialog(false);
                    setImageUrlInput('');
                    setImagePreview('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    console.log('[图片对话框]点击��送按钮', { activeChatId, activeGroupId });
                    // 优先检查群聊，避免误调用私聊函数
                    if (activeGroupId) {
                      console.log('[图片对话框]调用群聊发送函数');
                      handleSendImageMessageToGroup();
                    } else if (activeChatId) {
                      console.log('[图片对话框]调用私聊发送函数');
                      handleSendImageMessage();
                    } else {
                      console.log('[图片对话框]没有活跃聊天');
                    }
                  }}
                  disabled={!imagePreview.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  发送图片
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 拍摄对话框 */}
        <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
          <DialogContent className="max-w-md" onOpenAutoFocus={() => console.log('[对话框]拍摄对话框已渲染并获得焦点')}>
            <DialogHeader>
              <DialogTitle>拍摄内容</DialogTitle>
              <DialogDescription>
                用文字描述你拍摄的内容
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>拍摄内容描述</Label>
                <Textarea
                  value={cameraDescriptionInput}
                  onChange={(e) => setCameraDescriptionInput(e.target.value)}
                  placeholder="请描述你拍摄的内��，例如：一杯冒着热气的咖啡，旁���放着一本打开的书..."
                  rows={6}
                  className="resize-none mt-2"
                />
                {cameraDescriptionInput.trim() && (
                  <p className="text-xs text-gray-500 mt-2">
                    {cameraDescriptionInput.trim().length} 字
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCameraDialog(false);
                    setCameraDescriptionInput('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    console.log('[拍摄对话框]点击发送按钮', { activeChatId, activeGroupId });
                    // 优先检查群聊，避免误调用私聊函数
                    if (activeGroupId) {
                      console.log('[拍摄对话框]调用群聊发送函数');
                      handleSendCameraMessageToGroup();
                    } else if (activeChatId) {
                      console.log('[拍摄对话框]调用私聊发送函数');
                      handleSendCameraMessage();
                    } else {
                      console.log('[拍摄对话框]没有活跃聊天');
                    }
                  }}
                  disabled={!cameraDescriptionInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  发送拍摄
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 位置对话框 */}
        <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
          <DialogContent className="max-w-md" onOpenAutoFocus={() => console.log('[对话框]位置对话框已渲染并获得焦点')}>
            <DialogHeader>
              <DialogTitle>发送位置</DialogTitle>
              <DialogDescription>
                输入位置地址信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>位置地址</Label>
                <Textarea
                  value={locationAddressInput}
                  onChange={(e) => setLocationAddressInput(e.target.value)}
                  placeholder="例如：北京市朝阳区建国路88号SOHO现代城"
                  rows={4}
                  className="resize-none mt-2"
                />
                {locationAddressInput.trim() && (
                  <p className="text-xs text-gray-500 mt-2">
                    {locationAddressInput.trim().length} 字
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowLocationDialog(false);
                    setLocationAddressInput('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    console.log('[位置对话框]点击发送按钮', { activeChatId, activeGroupId });
                    // 优先检查群聊，避免误调用私聊函数
                    if (activeGroupId) {
                      console.log('[位置对话框]调用群聊发送函数');
                      handleSendLocationMessageToGroup();
                    } else if (activeChatId) {
                      console.log('[位置对话框]调用私聊发送函数');
                      handleSendLocationMessage();
                    } else {
                      console.log('[位置对话框]没有活跃聊天');
                    }
                  }}
                  disabled={!locationAddressInput.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  发送位置
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 转账对话框 */}
        <TransferDialog
          isOpen={showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
          recipient={activeChatId ? getContact(activeChatId) : null}
          onConfirm={handleSendTransfer}
        />

        {/* 红包对话框 */}
        <RedPacketDialog
          isOpen={showRedPacketDialog}
          onClose={() => setShowRedPacketDialog(false)}
          recipient={activeChatId ? getContact(activeChatId) : null}
          onConfirm={handleSendRedPacket}
          isGroup={!!activeGroupId}
          userId={userId}
        />

        {/* 礼物对话框 */}
        <GiftDialog
          isOpen={showGiftDialog}
          onClose={() => setShowGiftDialog(false)}
          recipient={activeChatId ? getContact(activeChatId) : null}
          onConfirm={handleSendGift}
          userId={userId}
        />

        {/* 红包详情对话框 */}
        {selectedRedPacket && (() => {
          // 🔥 实时获取最新的红包数据，而不是使用缓���的selectedRedPacket
          const currentFriend = weChatFriends.find(f => f.contactId === activeChatId);
          const latestRedPacket = currentFriend?.chatMessages.find(m => m.id === selectedRedPacket.id);
          const redpacketData = latestRedPacket || selectedRedPacket;
          
          console.log('🧧 [单聊红包详情] 实时数据对比:', {
            缓存的领取人数: selectedRedPacket.redpacketReceivers?.length || 0,
            最新的领取人数: latestRedPacket?.redpacketReceivers?.length || 0,
            使用数据: redpacketData === latestRedPacket ? '最新数据' : '缓存数据'
          });
          
          // 测试模式：允许领取自己的红包
          const canReceive = 
            // redpacketData.senderId !== 'me' &&  // 临时注释掉，允许测试
            redpacketData.redpacketStatus === 'pending' &&
            !redpacketData.redpacketReceivers?.some(r => r.userId === 'me');
          
          console.log('🧧 [WeChat] 红包详情canReceive计算 [测试模式]:', {
            senderId: redpacketData.senderId,
            status: redpacketData.redpacketStatus,
            hasReceived: redpacketData.redpacketReceivers?.some(r => r.userId === 'me'),
            receivers: redpacketData.redpacketReceivers,
            canReceive,
            testMode: '✅ 允许领取自己的红包'
          });
          
          return (
            <RedPacketDetail
              isOpen={showRedPacketDetail}
              onClose={() => {
                setShowRedPacketDetail(false);
                setSelectedRedPacket(null);
              }}
              senderName={getUserInfo(redpacketData.senderId).name}
              senderAvatar={getUserInfo(redpacketData.senderId).avatar}
              note={redpacketData.redpacketNote || '恭喜发财，大吉大利'}
              type={redpacketData.redpacketType || 'normal'}
              totalAmount={redpacketData.redpacketAmount || 0}
              count={redpacketData.redpacketCount || 1}
              receivers={(redpacketData.redpacketReceivers || []).map(r => {
                const userInfo = getUserInfo(r.userId);
                console.log(`🧧 [单聊红包详情] 映射领取者:`, {
                  userId: r.userId,
                  userName: userInfo.name,
                  amount: r.amount
                });
                return {
                  userId: r.userId,
                  userName: userInfo.name,
                  userAvatar: userInfo.avatar,
                  amount: r.amount,
                  timestamp: r.timestamp
                };
              })}
              status={redpacketData.redpacketStatus || 'pending'}
              canReceive={canReceive}
              onReceive={() => handleReceiveRedPacket(selectedRedPacket.id)}
              currentUserReceived={
                redpacketData.redpacketReceivers?.some(r => r.userId === 'me')
                  ? (() => {
                      const myReceipt = redpacketData.redpacketReceivers?.find(r => r.userId === 'me');
                      const userInfo = getUserInfo('me');
                      return {
                        userId: 'me',
                        userName: userInfo.name,
                        userAvatar: userInfo.avatar,
                        amount: myReceipt?.amount || 0,
                        timestamp: myReceipt?.timestamp || Date.now(),
                        isLuckiest: redpacketData.redpacketType === 'lucky' && 
                          redpacketData.redpacketStatus === 'finished' && // 只有红包被领完才判断手气最佳
                          redpacketData.redpacketReceivers?.length > 0 &&
                          myReceipt?.amount === Math.max(...redpacketData.redpacketReceivers.map(r => r.amount))
                      };
                    })()
                  : undefined
              }
            />
          );
        })()}

        {/* 测试：直接显示一个div */}
        {(() => {
          console.log('[测试div]showCardDialog:', showCardDialog);
          if (!showCardDialog) return null;
          console.log('[测试div]准备渲染测试弹窗！！！');
          return (
            <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg">
              <h2 className="text-xl font-bold">测试弹窗</h2>
              <p>如果你能看到这个，说明状态是对的</p>
              <button 
                onClick={() => setShowCardDialog(false)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                关闭
              </button>
            </div>
          </div>
          );
        })()}

        {/* 名片选择对话框 */}
        <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>选择名片</DialogTitle>
              <DialogDescription>
                选择要发送的联系人名片
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-1">
                {/* 显示所有微信好友作为可选名片 */}
                {(() => {
                  console.log('[名片对话框]DialogContent渲染', { 
                    showCardDialog,
                    weChatFriendsCount: weChatFriends.length,
                    contactsCount: contacts.length
                  });
                  const filteredFriends = weChatFriends.filter(friend => {
                    // 如果是私聊，过滤掉当前聊天对象
                    if (activeChatId) {
                      return friend.contactId !== activeChatId;
                    }
                    // 如果是群聊，显示所有好友
                    return true;
                  });
                  console.log('[名片对话框]过滤后的好友', { 
                    total: filteredFriends.length,
                    friends: filteredFriends.map(f => f.contactId)
                  });
                  return filteredFriends.map((friend) => {
                    const contact = contacts.find(c => c.id === friend.contactId);
                    if (!contact) {
                      console.log('[名片对话框]未找到联系人', { contactId: friend.contactId });
                      return null;
                    }

                    return (
                      <button
                        key={friend.contactId}
                        onClick={() => {
                          console.log('[名片对话框]点击联系人', { 
                            contactId: friend.contactId, 
                            contactName: contact.nickname,
                            activeGroupId, 
                            isGroup: !!activeGroupId 
                          });
                          // 根据是私聊还是群聊调用不同的发送函数，直接传递contactId
                          if (activeGroupId) {
                            handleSendCardToGroup(friend.contactId);
                          } else {
                            handleSendCard(friend.contactId);
                          }
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>{contact.nickname[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{contact.nickname}</div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCardDialog(false);
                  setSelectedCardContactId(null);
                }}
                className="w-full"
              >
                取消
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 设置聊天背景对话框 */}
        <Dialog open={showChatBackground} onOpenChange={setShowChatBackground}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>设置聊天背景</DialogTitle>
              <DialogDescription>
                输入图片URL设置聊天背景
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>背景图片URL</Label>
                <Input
                  value={chatBackgroundInput}
                  onChange={(e) => setChatBackgroundInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowChatBackground(false);
                    setChatBackgroundInput('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    if (activeChatId) {
                      handleSetChatBackground(activeChatId, chatBackgroundInput);
                    }
                  }}
                  disabled={!chatBackgroundInput.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  设置背景
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 清空聊天记录确认对话框 */}
        <AlertDialog open={showClearChatConfirm} onOpenChange={setShowClearChatConfirm}>
          <AlertDialogContent className="max-w-[320px]">
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空聊天记录</AlertDialogTitle>
              <AlertDialogDescription>
                确定要清空所有聊天记���吗？此操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (activeChatId) {
                    handleClearChatHistory(activeChatId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                确认清空
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 联系人主页 - 在聊天界面中 */}
        {showContactProfile && selectedProfileContact && (
          <ContactProfile
            contact={selectedProfileContact}
            onClose={() => {
              setShowContactProfile(false);
              setSelectedProfileContact(null);
            }}
            wechatId={selectedProfileContact.wechatId}
            region={selectedProfileContact.region}
            signature={selectedProfileContact.signature}
            summaries={friend.summaries || []}
            commonGroups={
              weChatGroups
                .filter(group => group.memberIds.includes(selectedProfileContact.id))
                .map(group => ({ id: group.id, name: group.name }))
            }
            onSendMessage={() => {
              // 打开聊天界面
              setActiveChatId(selectedProfileContact.id);
              setActiveTab('chats');
            }}
            onVideoCall={() => {
              setVideoCallContact(selectedProfileContact);
              setShowVideoCall(true);
            }}
            worldBooks={worldBooks}
            rules={rules}
            moments={(() => {
              const filteredMoments = moments.filter(m => m.contactId === selectedProfileContact.id);
              console.log('ContactProfile (单聊) moments debug:', {
                allMoments: moments.length,
                contactId: selectedProfileContact.id,
                contactNickname: selectedProfileContact.nickname,
                filteredMoments: filteredMoments.length,
                momentContactIds: moments.map(m => m.contactId)
              });
              return filteredMoments;
            })()}
            onMomentsClick={() => {
              console.log('点击朋友圈按钮 (单聊):', selectedProfileContact.nickname);
              setSelectedMomentsContact(selectedProfileContact);
              setShowContactMoments(true);
              console.log('状态已更新:', { showContactMoments: true, selectedMomentsContact: selectedProfileContact.nickname });
            }}
            onContactUpdate={(updatedContact) => {
              if (onContactsChange) {
                const updatedContacts = contacts.map(c => 
                  c.id === updatedContact.id ? updatedContact : c
                );
                onContactsChange(updatedContacts);
              }
            }}
          />
        )}

        {/* 朋友圈详情对话框 - 私聊界面 */}
        {(() => {
          const selectedMoment = moments.find(m => m.id === selectedMomentId);
          console.log('🎴 [私聊-朋友圈详情弹窗] 渲染检查', {
            showMomentDetailDialog,
            selectedMomentId,
            找到的朋友圈: selectedMoment ? '✅' : '❌',
            朋友圈ID: selectedMoment?.id,
            朋友圈内容: selectedMoment?.content?.substring(0, 20)
          });
          return (
            <MomentDetailDialog
              open={showMomentDetailDialog}
              onOpenChange={setShowMomentDetailDialog}
              moment={selectedMoment || null}
              currentUser={{
                id: 'me',
                nickname: userProfile.username || '我',
                realName: userProfile.username || '我',
                avatar: userProfile.avatar,
                phoneNumber: '',
                tags: [],
                remark: ''
              }}
              contacts={contacts}
              onLike={handleMomentLike}
              onComment={handleMomentComment}
            />
          );
        })()}
      </div>
    );
  };

  // 如果正在显示用户呼出视频通话等待界面，优先显示
  if (showOutgoingVideoCall && outgoingCallContact) {
    return (
      <OutgoingVideoCall
        contact={outgoingCallContact}
        onCancel={() => {
          console.log('[视频通话] 取消呼出:', outgoingCallContact.nickname);
          
          // 清除AI决策的timeout
          if (outgoingCallTimeoutRef.current) {
            clearTimeout(outgoingCallTimeoutRef.current);
            outgoingCallTimeoutRef.current = null;
            console.log('[视频通话] 已清除AI决策timeout');
          }
          
          setShowOutgoingVideoCall(false);
          setOutgoingCallContact(null);
          toast.info('已取消视频通话');
        }}
      />
    );
  }

  // 如果正在显示视频通话邀请，优先显示
  if (showIncomingVideoCall && incomingCallContact) {
    return (
      <IncomingVideoCall
        contact={incomingCallContact}
        onAccept={() => {
          console.log('[视频通话] 接听来电:', incomingCallContact.nickname);
          setShowIncomingVideoCall(false);
          setVideoCallContact(incomingCallContact);
          setIncomingCallContact(null);
          setShowVideoCall(true);
        }}
        onDecline={() => {
          console.log('[视频通话] 拒绝来电:', incomingCallContact.nickname);
          setShowIncomingVideoCall(false);
          setIncomingCallContact(null);
          
          // 发送系统消息：未接通（使用联系人ID作为发送者，这样可以显示头像）
          const friend = weChatFriends.find(f => f.contactId === incomingCallContact.id);
          if (friend) {
            const missedCallMessage: ChatMessage = {
              id: Date.now().toString(),
              senderId: incomingCallContact.id, // 使用联系人ID而不是'system'
              content: '未接通',
              timestamp: Date.now(),
              type: 'video-call-missed'
            };
            
            const updatedFriends = weChatFriends.map(f => {
              if (f.contactId === incomingCallContact.id) {
                return {
                  ...f,
                  chatMessages: [...f.chatMessages, missedCallMessage],
                  lastMessage: '未接通',
                  lastMessageTime: Date.now()
                };
              }
              return f;
            });
            
            onWeChatFriendsChange(updatedFriends);
          }
        }}
      />
    );
  }

  // 如果正在显示视频通话，优先显示
  if (showVideoCall && videoCallContact) {
    const friend = weChatFriends.find(f => f.contactId === videoCallContact.id);
    return (
      <VideoCall
        contact={videoCallContact}
        onClose={() => {
          setShowVideoCall(false);
          setVideoCallContact(null);
        }}
        onCallEnd={(duration) => {
          // 通话结束，插入通话记录消息
          if (friend) {
            // 如果通话时长小于3秒，视为未接通
            if (duration < 3) {
              const missedCallMessage: ChatMessage = {
                id: Date.now().toString(),
                senderId: videoCallContact.id,
                content: '未接通',
                timestamp: Date.now(),
                type: 'video-call-missed'
              };
              
              const updatedFriends = weChatFriends.map(f => {
                if (f.contactId === videoCallContact.id) {
                  return {
                    ...f,
                    chatMessages: [...f.chatMessages, missedCallMessage],
                    lastMessage: '未接通',
                    lastMessageTime: Date.now()
                  };
                }
                return f;
              });
              
              onWeChatFriendsChange(updatedFriends);
              return;
            }
            
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            
            let durationText = '';
            if (hours > 0) {
              durationText = `${hours}小时${minutes}分钟${seconds}秒`;
            } else if (minutes > 0) {
              durationText = `${minutes}分钟${seconds}秒`;
            } else {
              durationText = `${seconds}秒`;
            }
            
            const callEndMessage: ChatMessage = {
              id: Date.now().toString(),
              senderId: videoCallContact.id, // 使用联系人ID而不是'system'
              content: `视频通话时长 ${durationText}`,
              timestamp: Date.now(),
              type: 'video-call-end'
            };
            
            const updatedFriends = weChatFriends.map(f => {
              if (f.contactId === videoCallContact.id) {
                return {
                  ...f,
                  chatMessages: [...f.chatMessages, callEndMessage],
                  lastMessage: `视频通话时长 ${durationText}`,
                  lastMessageTime: Date.now()
                };
              }
              return f;
            });
            
            onWeChatFriendsChange(updatedFriends);
          }
        }}
        currentTime={`${realTime.getHours().toString().padStart(2, '0')}:${realTime.getMinutes().toString().padStart(2, '0')}`}
        worldBooks={worldBooks}
        rules={rules}
        chatHistory={friend?.chatMessages || []}
        apiConfigs={apiConfigs}
        selectedApiId={selectedApiId}
        projectId={projectId}
        accessToken={accessToken}
      />
    );
  }

  // 如果正在显示语音通话，优先显示
  if (showVoiceCall && voiceCallContact) {
    const friend = weChatFriends.find(f => f.contactId === voiceCallContact.id);
    return (
      <VoiceCall
        contact={voiceCallContact}
        onClose={() => {
          setShowVoiceCall(false);
          setVoiceCallContact(null);
        }}
        onCallEnd={(duration) => {
          // 通话结束，插入通话记录消息
          if (friend) {
            // 格式化通话时长
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            let durationText = '';
            
            if (hours > 0) {
              durationText = `${hours}小时${minutes}分钟${seconds}秒`;
            } else if (minutes > 0) {
              durationText = `${minutes}分钟${seconds}秒`;
            } else {
              durationText = `${seconds}秒`;
            }
            
            const callEndMessage: ChatMessage = {
              id: Date.now().toString(),
              senderId: voiceCallContact.id,
              content: `语音通话时长 ${durationText}`,
              timestamp: Date.now(),
              type: 'voice-call-end'
            };
            
            const updatedFriends = weChatFriends.map(f => {
              if (f.contactId === voiceCallContact.id) {
                return {
                  ...f,
                  chatMessages: [...f.chatMessages, callEndMessage],
                  lastMessage: `语音通话时长 ${durationText}`,
                  lastMessageTime: Date.now()
                };
              }
              return f;
            });
            
            onWeChatFriendsChange(updatedFriends);
          }
        }}
        currentTime={`${realTime.getHours().toString().padStart(2, '0')}:${realTime.getMinutes().toString().padStart(2, '0')}`}
        worldBooks={worldBooks}
        rules={rules}
        chatHistory={friend?.chatMessages || []}
        apiConfigs={apiConfigs}
        selectedApiId={selectedApiId}
        projectId={projectId}
        accessToken={accessToken}
      />
    );
  }

  // 如果正在显示钱包，优先显示
  if (showWallet) {
    return (
      <WeChatWallet
        onClose={() => setShowWallet(false)}
        realTime={realTime}
        batteryLevel={batteryLevel}
        isCharging={isCharging}
        userId={userId}
      />
    );
  }

  // 如果正在显示联系人朋友圈，优先显示
  if (showContactMoments && selectedMomentsContact) {
    return (
      <ContactMoments
        contact={selectedMomentsContact}
        onClose={() => {
          console.log('关闭朋友圈页面');
          setShowContactMoments(false);
          setSelectedMomentsContact(null);
        }}
        currentUser={{
          ...userProfile,
          id: 'user',
          realName: userProfile.username,
          nickname: userProfile.username,
          remark: userProfile.username,
          avatarType: 'url' as const,
          phone: ''
        }}
        contacts={contacts}
        moments={moments}
        onMomentsChange={onMomentsChange}
        realTime={realTime}
        batteryLevel={batteryLevel}
        isCharging={isCharging}
      />
    );
  }

  // 如果正在聊天中，显示聊天界面
  if (activeChatId) {
    return (
      <>
        {renderChatView()}
        
        {/* 消息长按菜单 */}
        {showMessageMenu && selectedMessage && (
          <MessageContextMenu
            isMe={selectedMessage.senderId === 'me'}
            message={selectedMessage}
            position={messageMenuPosition}
            onClose={() => setShowMessageMenu(false)}
            onCopy={handleCopyMessage}
            onForward={handleForwardMessage}
            onCollect={handleCollectMessage}
            onEdit={handleEditMessage}
            onRecall={handleRecallMessage}
            onMultiSelect={handleMultiSelectMessage}
            onQuote={handleQuoteMessage}
            onRemind={handleRemindMessage}
            onSearch={handleSearchMessage}
          />
        )}
        
        {/* ✏️ 编辑消息对话框 */}
        <Dialog open={showEditMessageDialog} onOpenChange={setShowEditMessageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑消息</DialogTitle>
              <DialogDescription>
                修改消息内容后保存
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="输入消息内容..."
                className="min-h-[120px] resize-none"
                autoFocus
              />
              
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  💡 编辑后的消息会显示"已编辑"标记
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditMessageDialog(false);
                  setEditedContent('');
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveEditedMessage}
                disabled={!editedContent.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                ✅ 保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* 转发消息对话框 */}
        <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>选择��系人</DialogTitle>
              <DialogDescription>
                将消息转发给：
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {contacts.map((contact) => {
                  const displayName = contact.remark || contact.nickname || contact.realName;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleForwardToContact(contact.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{displayName}</div>
                        {contact.statusText && (
                          <div className="text-xs text-gray-500 truncate">
                            {contact.statusText}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        {/* 查看撤回消息对话框 */}
        <Dialog open={!!viewRecalledMessage} onOpenChange={() => setViewRecalledMessage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>撤回的消息</DialogTitle>
              <DialogDescription>
                只有你能看到这条消息的内容
              </DialogDescription>
            </DialogHeader>
            
            {viewRecalledMessage && (
              <div className="py-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {viewRecalledMessage.recalledBy === 'me' ? '你' : (getContact(viewRecalledMessage.senderId)?.remark || getContact(viewRecalledMessage.senderId)?.nickname || '对方')}撤回了：
                  </div>
                  <div className="text-gray-800">
                    {viewRecalledMessage.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatChatTime(viewRecalledMessage.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* 收藏消息查看对话��� */}
        <Dialog open={showCollectedMessages} onOpenChange={setShowCollectedMessages}>
          <DialogContent className="max-w-md max-h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>我的收藏</DialogTitle>
              <DialogDescription>
                共{collectedMessages.length}条收藏
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 pr-4">
              {collectedMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>还没有收藏任何消息</p>
                  <p className="text-sm mt-2">长按消息可以收藏</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collectedMessages.map((message, index) => {
                    const sender = message.senderId === 'me' 
                      ? { nickname: userProfile.username || '我', avatar: userProfile.avatar }
                      : getContact(message.senderId);
                    const senderName = message.senderId === 'me' 
                      ? '我' 
                      : (sender?.remark || sender?.nickname || '未知');
                    
                    return (
                      <div key={`${message.id}-${index}`} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-8 h-8 rounded-md">
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="rounded-md">{senderName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{senderName}</div>
                            <div className="text-xs text-gray-400">
                              {formatChatTime(message.timestamp)}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCollectedMessages(collectedMessages.filter((_, i) => i !== index));
                              toast.success('已取消收藏');
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-800 break-words">
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        {/* 聊天总结对话框 */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <DialogContent className="max-w-md max-h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>聊天总结</DialogTitle>
              <DialogDescription>
                查看和管理聊天总结，帮助AI更好地记住对话内容
              </DialogDescription>
            </DialogHeader>
            
            {(() => {
              const friend = activeChatId ? getFriend(activeChatId) : null;
              const summaries = friend?.summaries || [];
              const summaryConfig = friend?.summaryConfig || { enabled: true, autoSummary: false, messageThreshold: 50 };
              const messages = friend?.chatMessages || [];
              const lastSummaryIndex = friend?.lastSummaryIndex || 0;
              const unsummarizedCount = messages.length - lastSummaryIndex;
              
              return (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <Button
                      onClick={() => {
                        if (activeChatId) {
                          generateSummary(activeChatId, false);
                        }
                      }}
                      disabled={isSummarizing || unsummarizedCount === 0}
                      size="sm"
                      className="flex-1"
                    >
                      {isSummarizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <List className="w-4 h-4 mr-2" />
                          生成总结 {unsummarizedCount > 0 && `(${unsummarizedCount}条)`}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowSummaryConfigDialog(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1 pr-4">
                    {summaries.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>还没有聊天总结</p>
                        <p className="text-sm mt-2">点击"生成总结"按钮开始</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {summaries.map((summary, index) => (
                          <div key={summary.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatChatTime(summary.timestamp)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  · {summary.messageCount}条消息
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingSummary(summary)}
                                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (activeChatId) {
                                      deleteSummary(activeChatId, summary.id, false);
                                    }
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                              {summary.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
        
        {/* 编辑总结对话框 */}
        <Dialog open={editingSummary !== null} onOpenChange={(open) => !open && setEditingSummary(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑总结</DialogTitle>
              <DialogDescription>
                修改聊天总结的内容
              </DialogDescription>
            </DialogHeader>
            {editingSummary && (
              <div className="space-y-4 pt-4">
                <Textarea
                  value={editingSummary.content}
                  onChange={(e) => setEditingSummary({ ...editingSummary, content: e.target.value })}
                  rows={8}
                  placeholder="编辑总结内容..."
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingSummary(null)}>
                    取消
                  </Button>
                  <Button
                    onClick={() => {
                      if (activeChatId) {
                        updateSummary(activeChatId, editingSummary.id, editingSummary.content, false);
                      }
                    }}
                  >
                    保存
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* 总结配置对话框 */}
        <Dialog open={showSummaryConfigDialog} onOpenChange={setShowSummaryConfigDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>总结配置</DialogTitle>
              <DialogDescription>
                配置聊天总结的自动生成设置
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用总结功能</Label>
                  <p className="text-xs text-gray-500 mt-1">总结有助于AI长期记忆</p>
                </div>
                <Switch
                  checked={summaryConfigForm.enabled}
                  onCheckedChange={(checked) => setSummaryConfigForm({ ...summaryConfigForm, enabled: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>自动总结</Label>
                  <p className="text-xs text-gray-500 mt-1">达到阈值后自动生成</p>
                </div>
                <Switch
                  checked={summaryConfigForm.autoSummary}
                  onCheckedChange={(checked) => setSummaryConfigForm({ ...summaryConfigForm, autoSummary: checked })}
                  disabled={!summaryConfigForm.enabled}
                />
              </div>
              
              <div>
                <Label>消息阈值</Label>
                <p className="text-xs text-gray-500 mb-2">多少条消息后触发自动总结</p>
                <Input
                  type="number"
                  min="10"
                  max="200"
                  value={summaryConfigForm.messageThreshold}
                  onChange={(e) => setSummaryConfigForm({ ...summaryConfigForm, messageThreshold: parseInt(e.target.value) || 50 })}
                  disabled={!summaryConfigForm.enabled || !summaryConfigForm.autoSummary}
                />
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowSummaryConfigDialog(false)}>
                  取消
                </Button>
                <Button
                  onClick={() => {
                    if (activeChatId) {
                      updateSummaryConfig(activeChatId, summaryConfigForm, false);
                      setShowSummaryConfigDialog(false);
                    }
                  }}
                >
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* 转发类型选择对话框 */}
        <Dialog open={showForwardTypeDialog} onOpenChange={setShowForwardTypeDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>选择转发方式</DialogTitle>
              <DialogDescription>
                选择如何转发消息
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  setForwardType('merge');
                  setShowForwardTypeDialog(false);
                  setShowForwardDialog(true);
                }}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <div className="font-medium text-green-700">合并转发</div>
                <div className="text-sm text-gray-600 mt-1">将选中的消息合并为聊天记录</div>
              </button>
              <button
                onClick={() => {
                  setForwardType('separate');
                  setShowForwardTypeDialog(false);
                  setShowForwardDialog(true);
                }}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <div className="font-medium text-blue-700">逐条转发</div>
                <div className="text-sm text-gray-600 mt-1">将选中的消息一条条发送</div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* 好感度对话框 */}
        <Dialog open={showAffectionDialog} onOpenChange={setShowAffectionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>💖 ���感度系统</DialogTitle>
              <DialogDescription>
                查看角色对你的真实心理状态
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingAffection ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 animate-spin text-red-500 mb-4" />
                <p className="text-gray-500">正在分析角色心理...</p>
              </div>
            ) : affectionData ? (
              <div className="space-y-6 py-4">
                {/* 好感度进度条 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">好感度</span>
                    <span className="font-bold text-lg text-red-500">{affectionData.affection}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-red-500 transition-all duration-500 rounded-full"
                      style={{ width: `${affectionData.affection}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>陌生</span>
                    <span>喜欢</span>
                    <span>热恋</span>
                  </div>
                </div>
                
                {/* 当前情绪 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smile className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-gray-700">当前情绪</span>
                  </div>
                  <p className="text-lg font-medium text-purple-700">{affectionData.emotion}</p>
                </div>
                
                {/* 内心想法 */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700">TA的心声</span>
                  </div>
                  <p className="text-gray-800 italic leading-relaxed">"{affectionData.innerThought}"</p>
                </div>
                
                {/* 提示 */}
                <div className="text-center text-xs text-gray-400">
                  <p>好感度会根据聊天内容实时变化</p>
                  <p className="mt-1">暖心话题会增加好感，冷淡或冒犯会降低好感</p>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 如果正在群聊中，显示群聊界面
  if (activeGroupId) {
    return (
      <>
        {renderGroupChatView()}
        
        {/* 消息长按菜单 */}
        {showMessageMenu && selectedMessage && (
          <MessageContextMenu
            isMe={selectedMessage.senderId === 'me'}
            message={selectedMessage}
            position={messageMenuPosition}
            onClose={() => setShowMessageMenu(false)}
            onCopy={handleCopyMessage}
            onForward={handleForwardMessage}
            onCollect={handleCollectMessage}
            onEdit={handleEditMessage}
            onRecall={handleRecallMessage}
            onMultiSelect={handleMultiSelectMessage}
            onQuote={handleQuoteMessage}
            onRemind={handleRemindMessage}
            onSearch={handleSearchMessage}
          />
        )}
        
        {/* ✏️ 编辑消息对话框 */}
        <Dialog open={showEditMessageDialog} onOpenChange={setShowEditMessageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑消息</DialogTitle>
              <DialogDescription>
                修改消息内容后保存
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="输入消息内容..."
                className="min-h-[120px] resize-none"
                autoFocus
              />
              
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  💡 编辑后的消息会显示"已编辑"标记
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditMessageDialog(false);
                  setEditedContent('');
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveEditedMessage}
                disabled={!editedContent.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                ✅ 保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* 转发消息对话框 */}
        <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>选择联系人</DialogTitle>
              <DialogDescription>
                将消息转发给：
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {contacts.map((contact) => {
                  const displayName = contact.remark || contact.nickname || contact.realName;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleForwardToContact(contact.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{displayName}</div>
                        {contact.statusText && (
                          <div className="text-xs text-gray-500 truncate">
                            {contact.statusText}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        {/* 查看撤回消息对话框 */}
        <Dialog open={!!viewRecalledMessage} onOpenChange={() => setViewRecalledMessage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>撤回的消息</DialogTitle>
              <DialogDescription>
                只有你能看到这条消息的内容
              </DialogDescription>
            </DialogHeader>
            
            {viewRecalledMessage && (
              <div className="py-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {viewRecalledMessage.recalledBy === 'me' ? '你' : (getContact(viewRecalledMessage.senderId)?.remark || getContact(viewRecalledMessage.senderId)?.nickname || '对方')}撤回了：
                  </div>
                  <div className="text-gray-800">
                    {viewRecalledMessage.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatChatTime(viewRecalledMessage.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* 收藏消息查看对话框 */}
        <Dialog open={showCollectedMessages} onOpenChange={setShowCollectedMessages}>
          <DialogContent className="max-w-md max-h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>我的收藏</DialogTitle>
              <DialogDescription>
                共{collectedMessages.length}条收藏
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 pr-4">
              {collectedMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>还没有收藏任何消息</p>
                  <p className="text-sm mt-2">长按消息可以收藏</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collectedMessages.map((message, index) => {
                    const sender = message.senderId === 'me' 
                      ? { nickname: userProfile.username || '我', avatar: userProfile.avatar }
                      : getContact(message.senderId);
                    const senderName = message.senderId === 'me' 
                      ? '我' 
                      : (sender?.remark || sender?.nickname || '未知');
                    
                    return (
                      <div key={`${message.id}-${index}`} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-8 h-8 rounded-md">
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="rounded-md">{senderName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{senderName}</div>
                            <div className="text-xs text-gray-400">
                              {formatChatTime(message.timestamp)}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCollectedMessages(collectedMessages.filter((_, i) => i !== index));
                              toast.success('已取消收藏');
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-800 break-words">
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        {/* 红包对话框 - 群聊（正确位置） */}
        <RedPacketDialog
          isOpen={showRedPacketDialog}
          onClose={() => setShowRedPacketDialog(false)}
          recipient={null}
          onConfirm={handleSendRedPacket}
          isGroup={true}
          userId={userId}
        />

        {/* 礼物对话框 - 群聊 */}
        <GiftDialog
          isOpen={showGiftDialog}
          onClose={() => setShowGiftDialog(false)}
          recipient={activeGroupId ? { id: activeGroupId, nickname: weChatGroups.find(g => g.id === activeGroupId)?.name || '群聊', avatar: '' } as Contact : null}
          onConfirm={handleSendGift}
          userId={userId}
        />
        
        {/* 红包详情对话框 - 群聊（正确位置） */}
        {selectedRedPacket && (() => {
          // 🔥 实时获取最新的红包数据，而不是使用缓存的selectedRedPacket
          const currentGroup = weChatGroups.find(g => g.id === activeGroupId);
          const latestRedPacket = currentGroup?.chatMessages.find(m => m.id === selectedRedPacket.id);
          const redpacketData = latestRedPacket || selectedRedPacket;
          
          console.log('🧧 [群聊红包详情] 实时数据对比:', {
            缓存的领取人数: selectedRedPacket.redpacketReceivers?.length || 0,
            最新的领取人数: latestRedPacket?.redpacketReceivers?.length || 0,
            使用数据: redpacketData === latestRedPacket ? '最新数据' : '缓存数据'
          });
          
          // 测试模式：允许领取自己的红包
          const canReceive = 
            // redpacketData.senderId !== 'me' &&  // 临时注释掉，允许测试
            redpacketData.redpacketStatus === 'pending' &&
            !redpacketData.redpacketReceivers?.some(r => r.userId === 'me');
          
          console.log('🧧 [WeChat群聊] 红包详情canReceive计算 [测试模式]:', {
            senderId: redpacketData.senderId,
            status: redpacketData.redpacketStatus,
            hasReceived: redpacketData.redpacketReceivers?.some(r => r.userId === 'me'),
            receivers: redpacketData.redpacketReceivers,
            receiverCount: redpacketData.redpacketReceivers?.length || 0,
            canReceive,
            testMode: '✅ 允许领取自己的红包'
          });
          
          return (
            <RedPacketDetail
              isOpen={showRedPacketDetail}
              onClose={() => {
                setShowRedPacketDetail(false);
                setSelectedRedPacket(null);
              }}
              senderName={getUserInfo(selectedRedPacket.senderId).name}
              senderAvatar={getUserInfo(selectedRedPacket.senderId).avatar}
              note={selectedRedPacket.redpacketNote || '恭喜发财，大吉大利'}
              type={selectedRedPacket.redpacketType || 'normal'}
              totalAmount={redpacketData.redpacketAmount || 0}
              count={redpacketData.redpacketCount || 1}
              receivers={(redpacketData.redpacketReceivers || []).map(r => {
                const userInfo = getUserInfo(r.userId);
                console.log(`🧧 [群聊红包详情] 映射领取者:`, {
                  userId: r.userId,
                  userName: userInfo.name,
                  amount: r.amount
                });
                return {
                  userId: r.userId,
                  userName: userInfo.name,
                  userAvatar: userInfo.avatar,
                  amount: r.amount,
                  timestamp: r.timestamp
                };
              })}
              status={redpacketData.redpacketStatus || 'pending'}
              canReceive={canReceive}
              onReceive={() => handleReceiveRedPacket(selectedRedPacket.id)}
              currentUserReceived={
                redpacketData.redpacketReceivers?.some(r => r.userId === 'me')
                  ? (() => {
                      const myReceipt = redpacketData.redpacketReceivers?.find(r => r.userId === 'me');
                      const userInfo = getUserInfo('me');
                      return {
                        userId: 'me',
                        userName: userInfo.name,
                        userAvatar: userInfo.avatar,
                        amount: myReceipt?.amount || 0,
                        timestamp: myReceipt?.timestamp || Date.now(),
                        isLuckiest: redpacketData.redpacketType === 'lucky' && 
                          redpacketData.redpacketStatus === 'finished' && // 只有红包被领完才判断手气最佳
                          redpacketData.redpacketReceivers?.length > 0 &&
                          myReceipt?.amount === Math.max(...redpacketData.redpacketReceivers.map(r => r.amount))
                      };
                    })()
                  : undefined
              }
            />
          );
        })()}

        {/* 名片选择对话框 - 群聊版本 */}
        <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>选择名片</DialogTitle>
              <DialogDescription>
                选择要发送的联系人名片到群聊
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-1">
                {/* 显示所有微信好友作为可选名片 */}
                {(() => {
                  console.log('[群聊-名片对话框]DialogContent渲染', { 
                    showCardDialog,
                    weChatFriendsCount: weChatFriends.length,
                    contactsCount: contacts.length
                  });
                  const filteredFriends = weChatFriends;
                  console.log('[群聊-名片对话框]可选好友', { 
                    total: filteredFriends.length,
                    friends: filteredFriends.map(f => f.contactId)
                  });
                  return filteredFriends.map((friend) => {
                    const contact = contacts.find(c => c.id === friend.contactId);
                    if (!contact) return null;
                    
                    const displayName = contact.remark || contact.nickname || contact.realName;
                    const isSelected = selectedCardContactId === friend.contactId;
                    
                    return (
                      <button
                        key={friend.contactId}
                        onClick={() => {
                          console.log('[群聊-名片对话框]选择联系人:', friend.contactId, displayName);
                          setSelectedCardContactId(friend.contactId);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-green-50 border-2 border-green-500' 
                            : 'hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>{displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{displayName}</div>
                          {contact.statusText && (
                            <div className="text-xs text-gray-500 truncate">{contact.statusText}</div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCardDialog(false);
                  setSelectedCardContactId(null);
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                onClick={() => {
                  console.log('[群聊-名片对话框]点击发送按钮', { selectedCardContactId });
                  if (selectedCardContactId) {
                    handleSendCardToGroup();
                  }
                }}
                disabled={!selectedCardContactId}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <User className="w-4 h-4 mr-1" />
                发送名片
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 朋友圈详情对话框 - 单人聊天 */}
        {(() => {
          const selectedMoment = moments.find(m => m.id === selectedMomentId);
          return (
            <MomentDetailDialog
              open={showMomentDetailDialog}
              onOpenChange={setShowMomentDetailDialog}
              moment={selectedMoment || null}
              currentUser={{
                id: 'me',
                nickname: userProfile.username || '我',
                realName: userProfile.username || '我',
                avatar: userProfile.avatar,
                phoneNumber: '',
                tags: [],
                remark: ''
              }}
              contacts={contacts}
              onLike={handleMomentLike}
              onComment={handleMomentComment}
            />
          );
        })()}
      </>
    );
  }

  // 主界面
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
        <h1 className="text-lg">
          {activeTab === 'chats' && '微信'}
          {activeTab === 'contacts' && '通讯录'}
          {activeTab === 'discover' && '发现'}
          {activeTab === 'me' && '我'}
        </h1>
        <div className="flex items-center gap-2 relative">
          {activeTab === 'chats' && (
            <>
              <button 
                onClick={() => setShowPlusButtonMenu(!showPlusButtonMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
              {showPlusButtonMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowPlusButtonMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border z-50 py-2 min-w-[140px]">
                    <button
                      onClick={() => {
                        setShowPlusButtonMenu(false);
                        setShowCreateGroupDialog(true);
                        setCreateGroupStep('selectType');
                        setSelectedGroupType(null);
                        setSelectedGroupMembers([]);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>发起群聊</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPlusButtonMenu(false);
                        setShowAddFriendDialog(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>添加朋友</span>
                    </button>
                  </div>
                </>
              )}
              <div className="relative">
                <button 
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="设置"
                >
                  <Settings className="w-6 h-6" />
                </button>
                
                {/* 设置下拉菜单 */}
                {showSettingsMenu && (
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border z-50 min-w-[200px]">
                    <button
                      onClick={() => {
                        handleOpenAutoMessageConfig();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Bot className="w-5 h-5 text-green-500" />
                      <span>AI主动发消息</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMemorySettingsDialog(true);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-t"
                    >
                      <span className="text-lg">🧠</span>
                      <span>记忆互通设置</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 搜索栏 */}
      {(activeTab === 'chats' || activeTab === 'contacts') && (
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="��索"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {activeTab === 'chats' && renderChats()}
          {activeTab === 'contacts' && renderContacts()}
          {activeTab === 'discover' && renderDiscover()}
          {activeTab === 'me' && renderMe()}
        </ScrollArea>
      </div>

      {/* 底部导航栏 */}
      <div className="border-t bg-white">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              activeTab === 'chats' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">微信</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              activeTab === 'contacts' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">通讯录</span>
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              activeTab === 'discover' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Search className="w-6 h-6" />
            <span className="text-xs">发现</span>
          </button>
          <button
            onClick={() => setActiveTab('me')}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              activeTab === 'me' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">我</span>
          </button>
        </div>
      </div>

      {/* 添加好友对话框 */}
      <Dialog open={showAddFriendDialog} onOpenChange={setShowAddFriendDialog}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>添加好友</DialogTitle>
            <DialogDescription className="sr-only">
              从通讯录中选择联系人添加为微信好友
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {contacts.filter(c => !weChatFriends.some(f => f.contactId === c.id)).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>通讯录中的联系人已全部添加</p>
                </div>
              ) : (
                contacts
                  .filter(c => !weChatFriends.some(f => f.contactId === c.id))
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts([...selectedContacts, contact.id]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                          }
                        }}
                      />
                      <Avatar className="w-10 h-10 rounded-md">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{contact.nickname}</p>
                        <p className="text-sm text-gray-400 truncate">{contact.realName}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFriendDialog(false);
                setSelectedContacts([]);
              }}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleAddFriends}
              disabled={selectedContacts.length === 0}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              添加 ({selectedContacts.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分组管理对话框 */}
      <Dialog open={showGroupManagement} onOpenChange={setShowGroupManagement}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分组管理</DialogTitle>
            <DialogDescription>
              创建分组后，在通讯录中长按好友即可移动到分组
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 创建新分组 */}
            <div className="flex gap-2">
              <Input
                placeholder="输入新分组名称"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateContactGroup();
                  }
                }}
              />
              <Button onClick={handleCreateContactGroup} className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-1" />
                创建
              </Button>
            </div>

            {/* 现有分组列表 */}
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {contactGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Folder className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>还没有分组</p>
                  </div>
                ) : (
                  contactGroups
                    .sort((a, b) => a.order - b.order)
                    .map((group) => {
                      const friendCount = weChatFriends.filter(f => f.groupId === group.id).length;
                      
                      return (
                        <div
                          key={group.id}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-white hover:bg-gray-50"
                        >
                          <Folder className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          
                          {editingGroupId === group.id ? (
                            <Input
                              value={groupNameInput}
                              onChange={(e) => setGroupNameInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateGroupName(group.id);
                                }
                              }}
                              onBlur={() => {
                                if (groupNameInput.trim()) {
                                  handleUpdateGroupName(group.id);
                                } else {
                                  setEditingGroupId(null);
                                  setGroupNameInput('');
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                          ) : (
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{group.name}</p>
                                {friendCount === 0 && (
                                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">空</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{friendCount} 位好友</p>
                            </div>
                          )}

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingGroupId(group.id);
                                setGroupNameInput(group.name);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`确定要删除分组"${group.name}"吗���该分组下的好友将移至"未分组"。`)) {
                                  handleDeleteContactGroup(group.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* 移动到分组对话框 */}
      <Dialog open={showMoveToGroupDialog} onOpenChange={setShowMoveToGroupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>移动到分组</DialogTitle>
            <DialogDescription>
              选择要移动到的分组
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {/* 未分组选项 */}
              <button
                onClick={() => movingFriendId && handleMoveToGroup(movingFriendId, undefined)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <FolderOpen className="w-5 h-5 text-gray-500" />
                <span>未分组</span>
              </button>

              {/* 分组列表 */}
              {contactGroups
                .sort((a, b) => a.order - b.order)
                .map((group) => (
                  <button
                    key={group.id}
                    onClick={() => movingFriendId && handleMoveToGroup(movingFriendId, group.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Folder className="w-5 h-5 text-gray-500" />
                    <span>{group.name}</span>
                  </button>
                ))}

              {contactGroups.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-2">还没有分组</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowMoveToGroupDialog(false);
                      setShowGroupManagement(true);
                    }}
                  >
                    去创建分组
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI主动发消息配置对话框 */}
      <Dialog open={showAutoMessageConfigDialog} onOpenChange={(open) => {
        if (!open) {
          // 关闭对话框时，如果没有保存，恢复原配置
          console.log('❌ 对话框关闭，未保存的更改将丢失');
          setTempAutoMessageConfig(aiAutoMessageConfig);
        }
        setShowAutoMessageConfigDialog(open);
      }}>
        <DialogContent className="max-w-md max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>AI消息设置</DialogTitle>
            <DialogDescription>
              配置AI的消息行为（包含三个独立功能：主动发消息、自动回复、主动视频通话）
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-6 pb-4">
              {/* 功能说明 */}
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 font-semibold mb-2">📌 功能说明</p>
                <div className="space-y-1 text-xs text-purple-700">
                  <p>• <span className="font-semibold">AI主动发消息</span>：AI会定时主动给你发消息</p>
                  <p>• <span className="font-semibold">AI自动回复</span>：你发消息后AI自动回复（被动响应）</p>
                  <p>• <span className="font-semibold">AI主动视频通话</span>：AI会随机主动给你打视频电话</p>
                  <p className="text-purple-600 mt-2 pt-2 border-t border-purple-200">💡 这是三个独立的功能，可以分别开关</p>
                </div>
              </div>
              {/* 启���/禁用主动发消息 */}
              <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="auto-message-enabled" className="text-base font-semibold text-amber-900">
                      🤖 启用AI主动发消息
                    </Label>
                    <p className="text-xs text-amber-700 mt-1">
                      关闭此开关后，AI将完全停止主动给你发消息
                    </p>
                  </div>
                  <Checkbox
                    id="auto-message-enabled"
                    checked={tempAutoMessageConfig.enabled}
                    onCheckedChange={(checked) => {
                      console.log('🔘 主开关切换:', checked ? '开启' : '关闭');
                      setTempAutoMessageConfig({
                        ...tempAutoMessageConfig,
                        enabled: checked as boolean
                      });
                    }}
                  />
                </div>
                {!tempAutoMessageConfig.enabled && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
                    ✓ AI主动发消息已关闭
                  </div>
                )}
              </div>

              {/* 时间感知开关 */}
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="time-awareness-enabled" className="text-base font-semibold text-blue-900">
                      ⏰ AI时间感知
                    </Label>
                    <p className="text-xs text-blue-700 mt-1">
                      开启后AI会知道准确的日期和时间，关闭后AI完全不知道时间
                    </p>
                  </div>
                  <Switch
                    id="time-awareness-enabled"
                    checked={tempAutoMessageConfig.timeAwarenessEnabled}
                    onCheckedChange={(checked) => {
                      console.log('🔘 时间感知切换:', checked ? '开启' : '关闭');
                      setTempAutoMessageConfig({
                        ...tempAutoMessageConfig,
                        timeAwarenessEnabled: checked
                      });
                    }}
                  />
                </div>
                <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                  {tempAutoMessageConfig.timeAwarenessEnabled ? (
                    <span className="text-green-600">✓ AI可以准确知道现在是 {(() => {
                      const now = new Date();
                      const simulatedDateTime = new Date(currentDate);
                      simulatedDateTime.setHours(now.getHours());
                      simulatedDateTime.setMinutes(now.getMinutes());
                      simulatedDateTime.setSeconds(now.getSeconds());
                      return simulatedDateTime.toLocaleString('zh-CN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long',
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      });
                    })()}</span>
                  ) : (
                    <span className="text-orange-600">⚠ AI完全不知道时间和日期</span>
                  )}
                </div>
              </div>

              {tempAutoMessageConfig.enabled && (
                <>
                  {/* 选择会主动发消息的好友 */}
                  <div className="space-y-2">
                    <Label>选择会主动发消息的好友</Label>
                    <p className="text-xs text-gray-500">这些好友会主动给你发消息</p>
                    {weChatFriends.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        请先添加微信好友
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {weChatFriends.map((friend) => {
                          const contact = getContact(friend.contactId);
                          if (!contact) return null;
                          
                          return (
                            <div
                              key={friend.contactId}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                            >
                              <Checkbox
                                id={`contact-${friend.contactId}`}
                                checked={tempAutoMessageConfig.enabledContactIds.includes(friend.contactId)}
                                onCheckedChange={(checked) => {
                                  const contactName = contact?.nickname || friend.contactId;
                                  console.log(`🔘 联系人"${contactName}"`, checked ? '启用' : '禁用', '主动发消息');
                                  if (checked) {
                                    setTempAutoMessageConfig({
                                      ...tempAutoMessageConfig,
                                      enabledContactIds: [...tempAutoMessageConfig.enabledContactIds, friend.contactId]
                                    });
                                  } else {
                                    setTempAutoMessageConfig({
                                      ...tempAutoMessageConfig,
                                      enabledContactIds: tempAutoMessageConfig.enabledContactIds.filter(id => id !== friend.contactId)
                                    });
                                  }
                                }}
                              />
                              <Avatar className="w-8 h-8 rounded-md">
                                <AvatarImage src={contact.avatar} />
                                <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                              </Avatar>
                              <Label htmlFor={`contact-${friend.contactId}`} className="flex-1 cursor-pointer">
                                <p>{contact.remark || contact.nickname}</p>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 选择会主动发消息的群聊 */}
                  <div className="space-y-2 pt-2">
                    <Label>选择会主动发消息的群聊</Label>
                    <p className="text-xs text-gray-500">群里的AI角色会主动发消息</p>
                    {weChatGroups.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        暂无群聊
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {weChatGroups.map((group) => {
                          return (
                            <div
                              key={group.id}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                            >
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={(tempAutoMessageConfig.enabledGroupIds || []).includes(group.id)}
                                onCheckedChange={(checked) => {
                                  console.log(`🔘 群聊"${group.name}"`, checked ? '启用' : '禁用', '主动发消息');
                                  const currentIds = tempAutoMessageConfig.enabledGroupIds || [];
                                  if (checked) {
                                    setTempAutoMessageConfig({
                                      ...tempAutoMessageConfig,
                                      enabledGroupIds: [...currentIds, group.id]
                                    });
                                  } else {
                                    setTempAutoMessageConfig({
                                      ...tempAutoMessageConfig,
                                      enabledGroupIds: currentIds.filter(id => id !== group.id)
                                    });
                                  }
                                }}
                              />
                              <Avatar className="w-8 h-8 rounded-md">
                                {group.avatar && <AvatarImage src={group.avatar} />}
                                <AvatarFallback className="rounded-md">{group.name[0]}</AvatarFallback>
                              </Avatar>
                              <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                                <p>{group.name}</p>
                                <p className="text-xs text-gray-500">{group.memberIds.length + 1} 人</p>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 自动回复设置 */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label htmlFor="auto-reply-enabled" className="text-base font-semibold text-blue-900">
                            💬 启用AI自动回复
                          </Label>
                          <p className="text-xs text-blue-700 mt-1">
                            当你发消息后，AI会自动回复（不是主动发消息）
                          </p>
                        </div>
                        <Checkbox
                          id="auto-reply-enabled"
                          checked={tempAutoMessageConfig.autoReplyEnabled}
                          onCheckedChange={(checked) => {
                            setTempAutoMessageConfig({
                              ...tempAutoMessageConfig,
                              autoReplyEnabled: checked as boolean
                            });
                          }}
                        />
                      </div>
                    </div>
                    
                    {tempAutoMessageConfig.autoReplyEnabled && (
                      <div className="space-y-3 mt-3">
                        {/* 自动回复的好友 */}
                        <div className="space-y-2">
                          <Label className="text-sm">选择会自动回复的好友</Label>
                          {weChatFriends.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              请先添加微信好友
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {weChatFriends.map((friend) => {
                                const contact = getContact(friend.contactId);
                                if (!contact) return null;
                                
                                return (
                                  <div
                                    key={`auto-reply-${friend.contactId}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                  >
                                    <Checkbox
                                      id={`auto-reply-contact-${friend.contactId}`}
                                      checked={tempAutoMessageConfig.autoReplyContactIds?.includes(friend.contactId) || false}
                                      onCheckedChange={(checked) => {
                                        const currentIds = tempAutoMessageConfig.autoReplyContactIds || [];
                                        if (checked) {
                                          setTempAutoMessageConfig({
                                            ...tempAutoMessageConfig,
                                            autoReplyContactIds: [...currentIds, friend.contactId]
                                          });
                                        } else {
                                          setTempAutoMessageConfig({
                                            ...tempAutoMessageConfig,
                                            autoReplyContactIds: currentIds.filter(id => id !== friend.contactId)
                                          });
                                        }
                                      }}
                                    />
                                    <Avatar className="w-8 h-8 rounded-md">
                                      <AvatarImage src={contact.avatar} />
                                      <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                                    </Avatar>
                                    <Label htmlFor={`auto-reply-contact-${friend.contactId}`} className="flex-1 cursor-pointer">
                                      <p>{contact.remark || contact.nickname}</p>
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 自动回复的群聊 */}
                        <div className="space-y-2">
                          <Label className="text-sm">选择会自动回复的群聊</Label>
                          {weChatGroups.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              暂无群聊
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {weChatGroups.map((group) => {
                                return (
                                  <div
                                    key={`auto-reply-group-${group.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                  >
                                    <Checkbox
                                      id={`auto-reply-group-${group.id}`}
                                      checked={tempAutoMessageConfig.autoReplyGroupIds?.includes(group.id) || false}
                                      onCheckedChange={(checked) => {
                                        const currentIds = tempAutoMessageConfig.autoReplyGroupIds || [];
                                        if (checked) {
                                          setTempAutoMessageConfig({
                                            ...tempAutoMessageConfig,
                                            autoReplyGroupIds: [...currentIds, group.id]
                                          });
                                        } else {
                                          setTempAutoMessageConfig({
                                            ...tempAutoMessageConfig,
                                            autoReplyGroupIds: currentIds.filter(id => id !== group.id)
                                          });
                                        }
                                      }}
                                    />
                                    <Avatar className="w-8 h-8 rounded-md">
                                      {group.avatar && <AvatarImage src={group.avatar} />}
                                      <AvatarFallback className="rounded-md">{group.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <Label htmlFor={`auto-reply-group-${group.id}`} className="flex-1 cursor-pointer">
                                      <p>{group.name}</p>
                                      <p className="text-xs text-gray-500">{group.memberIds.length + 1} 人</p>
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 选择启用的AI */}
                  <div className="space-y-2">
                    <Label>选择启用的AI</Label>
                    <p className="text-xs text-gray-500">可以选择多个AI，系统会随机选择一个发消息</p>
                    {apiConfigs.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        请先在设置中配置AI
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {apiConfigs.map((config) => (
                          <div
                            key={config.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox
                              id={`ai-${config.id}`}
                              checked={tempAutoMessageConfig.enabledAiIds.includes(config.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTempAutoMessageConfig({
                                    ...tempAutoMessageConfig,
                                    enabledAiIds: [...tempAutoMessageConfig.enabledAiIds, config.id]
                                  });
                                } else {
                                  setTempAutoMessageConfig({
                                    ...tempAutoMessageConfig,
                                    enabledAiIds: tempAutoMessageConfig.enabledAiIds.filter(id => id !== config.id)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`ai-${config.id}`} className="flex-1 cursor-pointer">
                              <div>
                                <p>{config.name}</p>
                                <p className="text-xs text-gray-500">{config.type} {config.selectedModel ? `- ${config.selectedModel}` : ''}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 发消息间隔时间 */}
                  <div className="space-y-2">
                    <Label>发消���间隔时间</Label>
                    <p className="text-xs text-gray-500">�����角色主动发消息的时间间隔，可自定义输入秒数</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="interval-min" className="text-xs">最短间隔（秒）</Label>
                        <Input
                          id="interval-min"
                          type="number"
                          min="1"
                          value={tempAutoMessageConfig.messageIntervalMin}
                          onChange={(e) => {
                            const min = Math.max(1, parseInt(e.target.value) || 1);
                            setTempAutoMessageConfig({
                              ...tempAutoMessageConfig,
                              messageIntervalMin: min,
                              messageIntervalMax: Math.max(min, tempAutoMessageConfig.messageIntervalMax)
                            });
                          }}
                          placeholder="例如：30"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="interval-max" className="text-xs">最长间隔（秒）</Label>
                        <Input
                          id="interval-max"
                          type="number"
                          min={tempAutoMessageConfig.messageIntervalMin}
                          value={tempAutoMessageConfig.messageIntervalMax}
                          onChange={(e) => {
                            const max = Math.max(tempAutoMessageConfig.messageIntervalMin, parseInt(e.target.value) || tempAutoMessageConfig.messageIntervalMin);
                            setTempAutoMessageConfig({
                              ...tempAutoMessageConfig,
                              messageIntervalMax: max,
                              messageIntervalMin: Math.min(max, tempAutoMessageConfig.messageIntervalMin)
                            });
                          }}
                          placeholder="例如：300"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-blue-700">
                        💡 AI将在 <span className="font-semibold">{tempAutoMessageConfig.messageIntervalMin}-{tempAutoMessageConfig.messageIntervalMax}</span> 秒之间随机选择一个���间后主动发消息
                      </p>
                      <p className="text-xs text-blue-600">
                        提示：1分钟=60秒，5分钟=300秒，10分钟=600秒，1小时=3600秒
                      </p>
                    </div>
                  </div>

                  {/* 🧠 记忆互通设置 */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="flex items-center gap-2">
                      <span>🧠 记忆互通设置</span>
                    </Label>
                    <p className="text-xs text-gray-500">AI角色在私聊和群聊之间的记忆互通功能</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="memory-count" className="text-xs">总记忆条数</Label>
                        <Input
                          id="memory-count"
                          type="number"
                          min="10"
                          max="200"
                          value={tempAutoMessageConfig.memoryCount || 50}
                          onChange={(e) => {
                            const count = Math.min(200, Math.max(10, parseInt(e.target.value) || 50));
                            setTempAutoMessageConfig({
                              ...tempAutoMessageConfig,
                              memoryCount: count
                            });
                          }}
                          placeholder="默认50"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="memory-preview" className="text-xs">跨场景预览条数</Label>
                        <Input
                          id="memory-preview"
                          type="number"
                          min="3"
                          max="20"
                          value={tempAutoMessageConfig.memoryPreviewCount || 5}
                          onChange={(e) => {
                            const count = Math.min(20, Math.max(3, parseInt(e.target.value) || 5));
                            setTempAutoMessageConfig({
                              ...tempAutoMessageConfig,
                              memoryPreviewCount: count
                            });
                          }}
                          placeholder="默认5"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-purple-700">
                        🧠 <span className="font-semibold">总记忆条数</span>：AI能记住最近 {tempAutoMessageConfig.memoryCount || 50} 条所有对话记录
                      </p>
                      <p className="text-xs text-purple-700">
                        👀 <span className="font-semibold">跨场景预览</span>：在当前对话中显示其他场景的最近 {tempAutoMessageConfig.memoryPreviewCount || 5} 条记忆
                      </p>
                      <p className="text-xs text-purple-600 mt-2">
                        💡 例如：AI在私聊时能记得群聊中的对话，在群聊时能记得私聊内容
                      </p>
                    </div>
                  </div>

                  {/* 📞 AI主动视频通话设置 */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="space-y-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label htmlFor="video-call-enabled" className="text-base font-semibold text-emerald-900">
                            📞 启用AI主动发起视频通话
                          </Label>
                          <p className="text-xs text-emerald-700 mt-1">
                            开启后，AI角色会随机主动给你打视频电话
                          </p>
                        </div>
                        <Switch
                          id="video-call-enabled"
                          checked={tempAutoMessageConfig.videoCallEnabled || false}
                          onCheckedChange={(checked) => {
                            console.log('🔘 AI主动视频通话切换:', checked ? '开启' : '关闭');
                            setTempAutoMessageConfig({
                              ...tempAutoMessageConfig,
                              videoCallEnabled: checked
                            });
                          }}
                        />
                      </div>
                      {!tempAutoMessageConfig.videoCallEnabled && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
                          ✓ AI主动视频通话已关闭
                        </div>
                      )}
                    </div>
                    
                    {tempAutoMessageConfig.videoCallEnabled && (
                      <div className="space-y-3 mt-3">
                        {/* 选择会主动打视频电话的AI好友 */}
                        <div className="space-y-2">
                          <Label className="text-sm">选择会主动打视频电话的AI好友</Label>
                          <p className="text-xs text-gray-500">只有AI角色可以主动发起视频通话</p>
                          {(() => {
                            const aiFriends = weChatFriends.filter(friend => {
                              const contact = getContact(friend.contactId);
                              return contact && contact.isAI;
                            });
                            
                            if (aiFriends.length === 0) {
                              return (
                                <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg">
                                  暂无AI好友，请先添加AI角色
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-2">
                                {aiFriends.map((friend) => {
                                  const contact = getContact(friend.contactId);
                                  if (!contact) return null;
                                  
                                  return (
                                    <div
                                      key={`video-call-${friend.contactId}`}
                                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                    >
                                      <Checkbox
                                        id={`video-call-contact-${friend.contactId}`}
                                        checked={(tempAutoMessageConfig.videoCallContactIds || []).includes(friend.contactId)}
                                        onCheckedChange={(checked) => {
                                          const currentIds = tempAutoMessageConfig.videoCallContactIds || [];
                                          if (checked) {
                                            setTempAutoMessageConfig({
                                              ...tempAutoMessageConfig,
                                              videoCallContactIds: [...currentIds, friend.contactId]
                                            });
                                          } else {
                                            setTempAutoMessageConfig({
                                              ...tempAutoMessageConfig,
                                              videoCallContactIds: currentIds.filter(id => id !== friend.contactId)
                                            });
                                          }
                                        }}
                                      />
                                      <Avatar className="w-8 h-8 rounded-md">
                                        <AvatarImage src={contact.avatar} />
                                        <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                                      </Avatar>
                                      <Label htmlFor={`video-call-contact-${friend.contactId}`} className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <p>{contact.remark || contact.nickname}</p>
                                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">AI</span>
                                        </div>
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        {/* 视频通话间隔时间 */}
                        <div className="space-y-2">
                          <Label>视频通话间隔时间</Label>
                          <p className="text-xs text-gray-500">AI主动发起视频通话的时间间隔（秒）</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="video-interval-min" className="text-xs">最短间隔（秒）</Label>
                              <Input
                                id="video-interval-min"
                                type="number"
                                min="60"
                                value={tempAutoMessageConfig.videoCallIntervalMin || 3600}
                                onChange={(e) => {
                                  const min = Math.max(60, parseInt(e.target.value) || 3600);
                                  setTempAutoMessageConfig({
                                    ...tempAutoMessageConfig,
                                    videoCallIntervalMin: min,
                                    videoCallIntervalMax: Math.max(min, tempAutoMessageConfig.videoCallIntervalMax || 28800)
                                  });
                                }}
                                placeholder="例如：3600"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label htmlFor="video-interval-max" className="text-xs">最长间隔（秒）</Label>
                              <Input
                                id="video-interval-max"
                                type="number"
                                min={tempAutoMessageConfig.videoCallIntervalMin || 3600}
                                value={tempAutoMessageConfig.videoCallIntervalMax || 28800}
                                onChange={(e) => {
                                  const max = Math.max(tempAutoMessageConfig.videoCallIntervalMin || 3600, parseInt(e.target.value) || 28800);
                                  setTempAutoMessageConfig({
                                    ...tempAutoMessageConfig,
                                    videoCallIntervalMax: max,
                                    videoCallIntervalMin: Math.min(max, tempAutoMessageConfig.videoCallIntervalMin || 3600)
                                  });
                                }}
                                placeholder="例如：28800"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="bg-emerald-50 rounded-lg p-3 space-y-1">
                            <p className="text-xs text-emerald-700">
                              📞 AI将在 <span className="font-semibold">{((tempAutoMessageConfig.videoCallIntervalMin || 3600) / 60).toFixed(0)}-{((tempAutoMessageConfig.videoCallIntervalMax || 28800) / 60).toFixed(0)}</span> 分钟之间随机选择一个时间后主动打视频电话
                            </p>
                            <p className="text-xs text-emerald-600">
                              提示：1小时=3600秒，2小时=7200秒，8小时=28800秒
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* 底部按钮 - 放在滚动区域内 */}
              <div className="flex gap-2 pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAutoMessageConfigDialog(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveAutoMessageConfig}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  💾 保存并立即生效
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 🧠 记忆互通设置对话框 */}
      <Dialog open={showMemorySettingsDialog} onOpenChange={setShowMemorySettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span>记忆互通设置</span>
            </DialogTitle>
            <DialogDescription>
              控制AI在私聊和群聊之间能看到多少其他场景的记忆
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memory-preview-count">跨场景记忆预览条数</Label>
              <Input
                id="memory-preview-count"
                type="number"
                min="0"
                max="20"
                value={tempMemoryCount}
                onChange={(e) => {
                  const count = Math.min(20, Math.max(0, parseInt(e.target.value) || 0));
                  setTempMemoryCount(count);
                }}
                placeholder="默认5"
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                AI能在当前对话中看到其他场景的最近几条记忆（0-20条）
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">当前设置：</span>AI能看到其他场景的最近 <span className="font-bold text-lg">{tempMemoryCount}</span> 条记忆
              </p>
              <div className="text-xs text-purple-600 space-y-1">
                <p>💡 <strong>什么是跨场景记忆？</strong></p>
                <p>• 在私聊时，AI能记得在群聊中说过的话</p>
                <p>• 在群聊时��AI能记得私聊的对话内容</p>
                <p>• 设置为 0 则关闭记忆互通功能</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 space-y-1">
              <p className="text-xs text-blue-700 font-semibold">💡 推荐设置：</p>
              <p className="text-xs text-blue-600">• 轻量使用：3条</p>
              <p className="text-xs text-blue-600">• 日常使用：5条（默认）</p>
              <p className="text-xs text-blue-600">• 深度互动：10条</p>
              <p className="text-xs text-blue-600">• 完整记忆：15-20条</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setTempMemoryCount(crossSceneMemoryCount);
                setShowMemorySettingsDialog(false);
              }}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (onCrossSceneMemoryCountChange) {
                  onCrossSceneMemoryCountChange(tempMemoryCount);
                }
                setShowMemorySettingsDialog(false);
                toast.success(`✅ 记忆互通设置已更新为 ${tempMemoryCount} 条`);
              }}
              className="flex-1 bg-purple-500 hover:bg-purple-600"
            >
              💾 保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 发起群聊对话框 */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {createGroupStep === 'selectType' 
                ? '选择群聊类型' 
                : createGroupStep === 'selectMembers'
                ? '选择群成员'
                : '设置群信息'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {createGroupStep === 'selectType' 
                ? '选择你是否在群中' 
                : createGroupStep === 'selectMembers'
                ? '选择要加入群聊的成员'
                : '设置群聊名称和头像'}
            </DialogDescription>
          </DialogHeader>

          {createGroupStep === 'selectType' ? (
            // 步骤1: 选择群聊类型
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedGroupType('inGroup');
                    setCreateGroupStep('selectMembers');
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">我在的群</p>
                      <p className="text-sm text-gray-500">你可以发送消息和查看聊天</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedGroupType('notInGroup');
                    setCreateGroupStep('selectMembers');
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">我不在的群</p>
                      <p className="text-sm text-gray-500">只能查看别人聊天，不能发消息</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateGroupDialog(false);
                    setCreateGroupStep('selectType');
                    setSelectedGroupType(null);
                    setSelectedGroupMembers([]);
                  }}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          ) : createGroupStep === 'selectMembers' ? (
            // 步骤2: 选择群成员
            <>
              <div className="mb-2 px-1">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-sm text-blue-700">
                    {selectedGroupType === 'inGroup' 
                      ? '你在这��群中，可以发送消息' 
                      : '你不在这个群中，只能查看'}
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2">
                  {weChatFriends.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>还没有微信好友</p>
                      <p className="text-sm mt-2">请先添加好友</p>
                    </div>
                  ) : (
                    weChatFriends.map((friend) => {
                      const contact = contacts.find(c => c.id === friend.contactId);
                      if (!contact) return null;
                      
                      return (
                        <div
                          key={friend.contactId}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedGroupMembers.includes(friend.contactId)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGroupMembers([...selectedGroupMembers, friend.contactId]);
                              } else {
                                setSelectedGroupMembers(selectedGroupMembers.filter(id => id !== friend.contactId));
                              }
                            }}
                          />
                          <Avatar className="w-10 h-10 rounded-md">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="rounded-md">{contact.nickname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{contact.remark || contact.nickname}</p>
                            <p className="text-sm text-gray-400 truncate">{contact.realName}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateGroupStep('selectType');
                    setSelectedGroupMembers([]);
                  }}
                  className="flex-1"
                >
                  上一步
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={selectedGroupMembers.length === 0}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  下一步 ({selectedGroupMembers.length})
                </Button>
              </div>
            </>
          ) : (
            // 步骤3: 设置群信息
            <>
              <div className="flex-1 overflow-y-auto max-h-[350px] pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-4 py-4">
                  {/* 群聊头像 */}
                  <div className="space-y-2">
                    <Label>群聊头像</Label>
                    <div className="flex flex-col gap-3">
                      {/* 头像预览 */}
                      <div className="flex justify-center">
                        {groupAvatar ? (
                          <div className="relative w-24 h-24">
                            <img 
                              src={groupAvatar} 
                              alt="群聊头像" 
                              className="w-full h-full rounded-lg object-cover"
                            />
                            <button
                              onClick={() => setGroupAvatar('')}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>

                      {/* 上传按钮 */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => groupAvatarInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          本地上传
                        </Button>
                        <input
                          ref={groupAvatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleGroupAvatarFileUpload}
                          className="hidden"
                        />
                      </div>

                      {/* URL上传 */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="或输入图片URL"
                          value={groupAvatarUrl}
                          onChange={(e) => setGroupAvatarUrl(e.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={handleGroupAvatarUrlUpload}
                          disabled={!groupAvatarUrl.trim()}
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        留空将使用默认头像
                      </p>
                    </div>
                  </div>

                  {/* 群聊名称 */}
                  <div className="space-y-2">
                    <Label>群聊名称</Label>
                    <Input
                      placeholder="留空将自动使用成员昵称"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                    {!groupName.trim() && selectedGroupMembers.length > 0 && (
                      <p className="text-xs text-gray-500">
                        预览: {selectedGroupMembers
                          .map(contactId => {
                            const contact = contacts.find(c => c.id === contactId);
                            return contact?.nickname || contact?.realName || '未知';
                          })
                          .slice(0, 3)
                          .join('、')}
                        {selectedGroupMembers.length > 3 ? `等${selectedGroupMembers.length}人` : ''}
                      </p>
                    )}
                  </div>

                  {/* 已选成员预览 */}
                  <div className="space-y-2">
                    <Label>已选成员 ({selectedGroupMembers.length}人)</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroupMembers.map(contactId => {
                        const contact = contacts.find(c => c.id === contactId);
                        if (!contact) return null;
                        return (
                          <div
                            key={contactId}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={contact.avatar} />
                              <AvatarFallback>{contact.nickname[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{contact.remark || contact.nickname}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateGroupStep('selectMembers');
                  }}
                  className="flex-1"
                >
                  上一步
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  创建群聊
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 联系人主页 */}
      {showContactProfile && selectedProfileContact && (
        <ContactProfile
          contact={selectedProfileContact}
          onClose={() => {
            setShowContactProfile(false);
            setSelectedProfileContact(null);
          }}
          wechatId={selectedProfileContact.wechatId}
          region={selectedProfileContact.location || selectedProfileContact.region}
          signature={selectedProfileContact.signature}
          summaries={weChatFriends.find(f => f.contactId === selectedProfileContact.id)?.summaries || []}
          commonGroups={
            weChatGroups
              .filter(group => group.memberIds.includes(selectedProfileContact.id))
              .map(group => ({ id: group.id, name: group.name }))
          }
          onSendMessage={() => {
            // 打开聊天界面
            setActiveChatId(selectedProfileContact.id);
            setActiveTab('chats');
          }}
          onVideoCall={() => {
            setVideoCallContact(selectedProfileContact);
            setShowVideoCall(true);
          }}
          worldBooks={worldBooks}
          rules={rules}
          moments={(() => {
            const filteredMoments = moments.filter(m => m.contactId === selectedProfileContact.id);
            console.log('ContactProfile (通讯录) moments debug:', {
              allMoments: moments.length,
              contactId: selectedProfileContact.id,
              contactNickname: selectedProfileContact.nickname,
              filteredMoments: filteredMoments.length,
              momentContactIds: moments.map(m => m.contactId)
            });
            return filteredMoments;
          })()}
          onMomentsClick={() => {
            console.log('点击朋友圈按钮 (通讯录):', selectedProfileContact.nickname);
            setSelectedMomentsContact(selectedProfileContact);
            setShowContactMoments(true);
            console.log('状态已更新:', { showContactMoments: true, selectedMomentsContact: selectedProfileContact.nickname });
          }}
          onContactUpdate={(updatedContact) => {
            // 更新联系人信息
            const updatedContacts = contacts.map(c => 
              c.id === updatedContact.id ? updatedContact : c
            );
            onContactsChange(updatedContacts);
            setSelectedProfileContact(updatedContact);
          }}
          onContactDelete={(contactId) => {
            // 删除联系人
            const updatedContacts = contacts.filter(c => c.id !== contactId);
            onContactsChange(updatedContacts);
            
            // 同时删除聊天记录
            const updatedFriends = weChatFriends.filter(f => f.contactId !== contactId);
            onWeChatFriendsChange(updatedFriends);
            
            setShowContactProfile(false);
            setSelectedProfileContact(null);
          }}
        />
      )}

      {/* 个人资料设置 */}
      {showProfileSettings && (
        <UserProfileSettings
          profile={userProfile}
          onProfileChange={onUserProfileChange}
          onClose={() => setShowProfileSettings(false)}
        />
      )}

      {/* 消息长按菜单 */}
      {showMessageMenu && selectedMessage && (
        <MessageContextMenu
          isMe={selectedMessage.senderId === 'me'}
          message={selectedMessage}
          position={messageMenuPosition}
          onClose={() => setShowMessageMenu(false)}
          onCopy={handleCopyMessage}
          onForward={handleForwardMessage}
          onCollect={handleCollectMessage}
          onEdit={handleEditMessage}
          onRecall={handleRecallMessage}
          onMultiSelect={handleMultiSelectMessage}
          onQuote={handleQuoteMessage}
          onRemind={handleRemindMessage}
          onSearch={handleSearchMessage}
        />
      )}

      {/* ✏️ 编辑消息对话框 */}
      <Dialog open={showEditMessageDialog} onOpenChange={setShowEditMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑消息</DialogTitle>
            <DialogDescription>
              修改消息内容后保存
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="输入消息内容..."
              className="min-h-[120px] resize-none"
              autoFocus
            />
            
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                💡 编辑后的消息会显示"已编辑"标记
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditMessageDialog(false);
                setEditedContent('');
              }}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveEditedMessage}
              disabled={!editedContent.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              ✅ 保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 转发消息对话框 */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择联系人</DialogTitle>
            <DialogDescription>
              将消息转发给：
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {contacts.map((contact) => {
                const displayName = contact.remark || contact.nickname || contact.realName;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleForwardToContact(contact.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{displayName}</div>
                      {contact.statusText && (
                        <div className="text-xs text-gray-500 truncate">
                          {contact.statusText}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* 查看撤回消息对话框 */}
      <Dialog open={!!viewRecalledMessage} onOpenChange={() => setViewRecalledMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>撤回的消息</DialogTitle>
            <DialogDescription>
              只有你能看到这条消息的内容
            </DialogDescription>
          </DialogHeader>
          
          {viewRecalledMessage && (
            <div className="py-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  {viewRecalledMessage.recalledBy === 'me' ? '你' : (getContact(viewRecalledMessage.senderId)?.remark || getContact(viewRecalledMessage.senderId)?.nickname || '对方')}撤回了：
                </div>
                <div className="text-gray-800">
                  {viewRecalledMessage.content}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatChatTime(viewRecalledMessage.timestamp)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 收藏消息查看对话框 */}
      <Dialog open={showCollectedMessages} onOpenChange={setShowCollectedMessages}>
        <DialogContent className="max-w-md max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>我的收藏</DialogTitle>
            <DialogDescription>
              共{collectedMessages.length}条收藏
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {collectedMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>还没有收藏任何消息</p>
                <p className="text-sm mt-2">长按消息可以收藏</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collectedMessages.map((message, index) => {
                  const sender = message.senderId === 'me' 
                    ? { nickname: userProfile.username || '我', avatar: userProfile.avatar }
                    : getContact(message.senderId);
                  const senderName = message.senderId === 'me' 
                    ? '我' 
                    : (sender?.remark || sender?.nickname || '未知');
                  
                  return (
                    <div key={`${message.id}-${index}`} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8 rounded-md">
                          <AvatarImage src={sender?.avatar} />
                          <AvatarFallback className="rounded-md">{senderName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{senderName}</div>
                          <div className="text-xs text-gray-400">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCollectedMessages(collectedMessages.filter((_, i) => i !== index));
                            toast.success('已取消收藏');
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-800 break-words">
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 用户人设管理器 */}
      {showPersonaManager && (
        <UserPersonaManager
          onClose={() => setShowPersonaManager(false)}
          personas={userPersonas}
          onPersonasChange={(newPersonas) => {
            onUserPersonasChange?.(newPersonas);
          }}
        />
      )}

      {/* 备忘录页面 */}
      {showMemos && (
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
              onClick={() => setShowMemos(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg">备忘录</h1>
            <div className="w-10"></div>
          </div>
          
          {/* 备忘录内容 */}
          <div className="flex-1 overflow-hidden">
            <AiMemos contacts={contacts} userProfile={userProfile} />
          </div>
        </div>
      )}

      {/* 朋友圈详情对话框 */}
      {(() => {
        const selectedMoment = moments.find(m => m.id === selectedMomentId);
        console.log('🎴 [朋友圈详情弹窗] 状态检查', {
          showMomentDetailDialog,
          selectedMomentId,
          找到的朋友圈: selectedMoment ? '✅' : '❌',
          朋友圈总数: moments.length,
          所有朋友圈IDs: moments.map(m => m.id)
        });
        return (
          <MomentDetailDialog
            open={showMomentDetailDialog}
            onOpenChange={setShowMomentDetailDialog}
            moment={selectedMoment || null}
            currentUser={{
              id: 'me',
              nickname: userProfile.username || '我',
              realName: userProfile.username || '我',
              avatar: userProfile.avatar,
              phoneNumber: '',
              tags: [],
              remark: ''
            }}
            contacts={contacts}
            onLike={handleMomentLike}
            onComment={handleMomentComment}
          />
        );
      })()}
    </div>
  );
}

export default WeChat;
