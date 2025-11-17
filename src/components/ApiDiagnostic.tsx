import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ApiConfig {
  id: string;
  name: string;
  type: 'gemini' | 'claude' | 'deepseek' | 'openai' | 'custom';
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  selectedModel?: string;
}

interface ApiDiagnosticProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig?: ApiConfig;
  projectId: string;
  accessToken?: string;
  publicAnonKey: string;
}

interface RecommendedServer {
  name: string;
  baseUrl: string;
  type: 'gemini' | 'claude' | 'deepseek' | 'openai' | 'custom';
  note: string;
  getKeyUrl?: string;
}

export function ApiDiagnostic({ open, onOpenChange, currentConfig, projectId, accessToken, publicAnonKey }: ApiDiagnosticProps) {
  const [testStatus, setTestStatus] = useState<{
    isTesting: boolean;
    result: string;
    success: boolean;
  }>({ isTesting: false, result: '', success: false });

  const recommendedServers: RecommendedServer[] = [
    {
      name: '🔵 官方 OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      type: 'openai',
      note: '需要官方API Key，稳定性最高，支持GPT-4o等最新模型',
      getKeyUrl: 'https://platform.openai.com/api-keys'
    },
    {
      name: '🟣 官方 Claude (Anthropic)',
      baseUrl: 'https://api.anthropic.com',
      type: 'claude',
      note: '需要官方API Key，Claude 3.5 Sonnet表现优异，支持视觉理解',
      getKeyUrl: 'https://console.anthropic.com/settings/keys'
    },
    {
      name: '🟢 官方 Gemini (Google)',
      baseUrl: 'https://generativelanguage.googleapis.com',
      type: 'gemini',
      note: '需要Google API Key，免费额度较大，支持长上下文',
      getKeyUrl: 'https://makersuite.google.com/app/apikey'
    },
    {
      name: '🔴 DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      type: 'deepseek',
      note: '国产大模型，价格实惠，API稳定',
      getKeyUrl: 'https://platform.deepseek.com/api_keys'
    },
    {
      name: '🌐 OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      type: 'custom',
      note: '聚合多个模型（GPT-4、Claude、Gemini等），按需付费',
      getKeyUrl: 'https://openrouter.ai/keys'
    },
    {
      name: '🤖 Together AI',
      baseUrl: 'https://api.together.xyz/v1',
      type: 'custom',
      note: '开源模型托管平台，支持Llama、Mixtral等',
      getKeyUrl: 'https://api.together.xyz/settings/api-keys'
    },
    {
      name: '⚡ Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      type: 'custom',
      note: '超快推理速度，免费额度，支持Llama 3等开源模型',
      getKeyUrl: 'https://console.groq.com/keys'
    }
  ];

  const testApiConnection = async () => {
    if (!currentConfig) {
      toast.error('请先选择一个API配置');
      return;
    }

    if (!currentConfig.apiKey) {
      toast.error('API配置缺少API Key');
      return;
    }

    if (!currentConfig.selectedModel) {
      toast.error('请先选择一个模型');
      return;
    }

    setTestStatus({ isTesting: true, result: '🔄 正在测试API连接...', success: false });
    
    try {
      console.log('🧪 [API Test] 开始测试API连接:', currentConfig.name);
      
      // 发送一个简单的测试消息
      const testMessages = [
        { role: 'system', content: '你是一个AI助手' },
        { role: 'user', content: '请简短回复"测试成功"即可' }
      ];
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            type: currentConfig.type,
            baseUrl: currentConfig.baseUrl || '',
            apiKey: currentConfig.apiKey,
            model: currentConfig.selectedModel,
            messages: testMessages
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.message) {
        const result = `✅ 连接成功！

📋 配置信息:
• 名称: ${currentConfig.name}
• 类型: ${currentConfig.type}
• 模型: ${currentConfig.selectedModel}
• Base URL: ${currentConfig.baseUrl || '默认'}

💬 AI回复:
${data.message}

🎉 这个API配置工作正常，可以放心使用！`;
        
        setTestStatus({ 
          isTesting: false, 
          result, 
          success: true 
        });
        toast.success('API连接测试成功！');
      } else {
        const errorMsg = data.error || '未知错误';
        let friendlyError = errorMsg;
        
        // 解析常见错误并给出友好提示
        if (errorMsg.includes('当前无可用凭证') || errorMsg.includes('no available credentials')) {
          friendlyError = '⚠️ 这是公益API站的问题，不是你的配置问题！\n\n该API服务器提示"当前无可用凭证"，说明：\n1. 服务器的API Key池已用完\n2. 服务器暂时不可用\n\n建议：\n• 尝试其他公益API站\n• 或使用官方API（见下方推荐列表）';
        } else if (errorMsg.includes('倍率或价格未配置') || errorMsg.includes('ratio or price not set')) {
          friendlyError = '⚠️ API服务器配置问题\n\n该服务器没有正确配置你选择的模型。\n\n建议：\n1. 尝试选择其他模型\n2. 删除模型名称中的特殊前缀（如"流式抗截断/"）\n3. 联系API服务商';
        } else if (errorMsg.includes('Invalid URL') || errorMsg.includes('端点')) {
          friendlyError = '⚠️ API端点路径问题\n\n服务器的API路径可能不标准。\n\n建议：\n1. 检查Base URL是否正确\n2. 尝试在设置中手动测试不同的端点路径';
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid API Key')) {
          friendlyError = '❌ API Key无效\n\n可能的原因：\n1. API Key输入错误\n2. API Key已过期\n3. API Key没有相应权限\n\n解决方法：\n• 重新复制粘贴API Key\n• 检查API Key是否已激活\n• 前往服务商网站重新生成';
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          friendlyError = '⚠️ 请求频率超限\n\n你的请求太频繁了。\n\n解决方法：\n• 等待几分钟后重试\n• 升级API套餐\n• 使用其他API服务';
        } else if (errorMsg.includes('insufficient') || errorMsg.includes('余额') || errorMsg.includes('balance')) {
          friendlyError = '💰 账户余额不足\n\n你的API账户可能没有余额了。\n\n解决方法：\n• 前往服务商网站充值\n• 检查免费额度是否用完\n• 更换其他API服务';
        }
        
        const result = `❌ 连接失败

📋 配置信息:
• 名称: ${currentConfig.name}
• 类型: ${currentConfig.type}
• 模型: ${currentConfig.selectedModel}
• Base URL: ${currentConfig.baseUrl || '默认'}

🔴 错误详情:
${friendlyError}

原始错误: ${errorMsg}`;
        
        setTestStatus({ 
          isTesting: false, 
          result, 
          success: false 
        });
        toast.error('API测试失败，请查看详情');
      }
    } catch (error: any) {
      console.error('🧪 [API Test] 测试失败:', error);
      
      let friendlyError = error.message || String(error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        friendlyError = '❌ 网络连接失败\n\n可能的原因：\n1. 你的网络连接有问题\n2. API服务器无法访问\n3. 需要VPN访问（如OpenAI官方API）\n\n解决方法：\n• 检查网络连接\n• 尝试使用VPN\n• 更换其他API服务';
      }
      
      const result = `❌ 测试异常

错误: ${friendlyError}

这通常是网络问题或服务器无法访问。`;
      
      setTestStatus({ 
        isTesting: false, 
        result, 
        success: false 
      });
      toast.error(`测试失败: ${error.message || '网络错误'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            API 诊断与推荐服务器
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前配置测试 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">当前API配置测试</h3>
            {currentConfig ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <p><span className="text-gray-500">名称:</span> {currentConfig.name}</p>
                  <p><span className="text-gray-500">类型:</span> {currentConfig.type}</p>
                  <p><span className="text-gray-500">模型:</span> {currentConfig.selectedModel || '未选择'}</p>
                  <p><span className="text-gray-500">Base URL:</span> {currentConfig.baseUrl || '默认'}</p>
                </div>
                
                <Button 
                  onClick={testApiConnection}
                  disabled={testStatus.isTesting || !currentConfig.selectedModel}
                  className="w-full"
                >
                  {testStatus.isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '🔍 测试连接'
                  )}
                </Button>

                {testStatus.result && (
                  <div className={`p-3 rounded-md text-sm whitespace-pre-line ${
                    testStatus.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    {testStatus.result}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">请先在设置中添加并选择一个API配置</p>
            )}
          </div>

          {/* 推荐的API服务器 */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              推荐的API服务器
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              以下是稳定可靠的API服务器。公益API站经常不稳定，建议使用官方API以获得最佳体验：
            </p>
            
            <div className="space-y-3">
              {recommendedServers.map((server, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{server.name}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-1">{server.baseUrl}</p>
                    </div>
                    {server.getKeyUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(server.getKeyUrl, '_blank')}
                        className="ml-2"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        获取API Key
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{server.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-300">💡 使用建议</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li><strong>官方API最稳定：</strong>虽然需要付费，但体验最好，不会出现"无可用凭证"等问题</li>
              <li><strong>Gemini免费额度大：</strong>Google的Gemini API提供较大的免费额度，适合测试</li>
              <li><strong>OpenRouter很方便：</strong>可以一个Key访问多个模型，按需付费</li>
              <li><strong>Groq速度快：</strong>推理速度极快，有免费额度</li>
              <li><strong>公益API不稳定：</strong>免费公益站经常出问题，不建议用于重要用途</li>
            </ul>
          </div>

          {/* 常见问题 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-yellow-900 dark:text-yellow-300">❓ 常见问题</h3>
            <div className="text-sm text-yellow-800 dark:text-yellow-400 space-y-2">
              <div>
                <p className="font-medium">Q: 为什么公益API总是失败？</p>
                <p className="ml-4">A: 公益API站使用共享的API Key池，人多时会出现"无可用凭证"错误。建议使用自己的API Key。</p>
              </div>
              <div>
                <p className="font-medium">Q: 如何获取免费的API Key？</p>
                <p className="ml-4">A: Gemini和Groq提供较大的免费额度，点击上方"获取API Key"按钮注册即可。</p>
              </div>
              <div>
                <p className="font-medium">Q: OpenAI API无法访问怎么办？</p>
                <p className="ml-4">A: OpenAI官方API在某些地区需要VPN访问，或者可以使用OpenRouter等代理服务。</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
