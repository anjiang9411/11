import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { warmupServerSilently } from '../utils/serverWarmup';
import { projectId as importedProjectId, publicAnonKey as importedPublicAnonKey } from '../utils/supabase/info';

interface ServerStatusBannerProps {
  projectId: string;
  publicAnonKey: string;
  onOpenDiagnostic?: () => void;
}

export function ServerStatusBanner({ 
  projectId, 
  publicAnonKey, 
  onOpenDiagnostic 
}: ServerStatusBannerProps) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'warning' | 'error' | 'hidden'>('checking');
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    console.log('🏥 [Banner] 检查服务器状态...');
    setStatus('checking');
    
    try {
      const result = await warmupServerSilently();
      console.log('🏥 [Banner] warmupServerSilently 返回结果:', result);
      
      if (!result) {
        console.error('❌ [Banner] warmupServerSilently 返回了 undefined!');
        setStatus('error');
        setMessage('服务器预热函数返回异常，请刷新页面重试');
        return;
      }
      
      if (result.success) {
        if (result.duration && result.duration > 10000) {
          setStatus('warning');
          setMessage(`服务器从冷启动中恢复（耗时${Math.round(result.duration / 1000)}秒）`);
        } else {
          setStatus('ok');
          setMessage('后端服务器运行正常');
          // 3秒后自动隐藏成功消息
          setTimeout(() => {
            if (!dismissed) setStatus('hidden');
          }, 3000);
        }
      } else {
        setStatus('error');
        if (result.error?.includes('超时') || result.error?.includes('Failed to fetch')) {
          setMessage('无法连接到后端服务器，请检查网络连接或等待30秒后重试');
        } else if (result.error?.includes('404')) {
          setMessage('后端服务未部署，请联系管理员');
        } else {
          setMessage(`服务器连接失败: ${result.error || '未知错误'}`);
        }
      }
    } catch (error) {
      console.error('❌ [Banner] checkServerStatus 异常:', error);
      setStatus('error');
      setMessage(`检查服务器状态时发生错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRetry = () => {
    setDismissed(false);
    checkServerStatus();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setStatus('hidden');
  };

  if (status === 'hidden' || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
      <Alert 
        className={`
          max-w-md mx-auto shadow-lg
          ${status === 'checking' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
          ${status === 'ok' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
          ${status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : ''}
          ${status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
        `}
      >
        <div className="flex items-start gap-2">
          {status === 'checking' && (
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
          )}
          {status === 'ok' && (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          )}
          {status === 'warning' && (
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          )}
          {status === 'error' && (
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          )}
          
          <AlertDescription className="flex-1">
            <div className={`
              text-sm
              ${status === 'checking' ? 'text-blue-800 dark:text-blue-300' : ''}
              ${status === 'ok' ? 'text-green-800 dark:text-green-300' : ''}
              ${status === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : ''}
              ${status === 'error' ? 'text-red-800 dark:text-red-300' : ''}
            `}>
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  {status === 'checking' && '正在检查...'}
                  {status === 'ok' && '✅ 就绪'}
                  {status === 'warning' && '⚠️ 启动中'}
                  {status === 'error' && '❌ 连接失败'}
                </span>
                {message && <span className="text-xs opacity-70">· {message}</span>}
              </div>
              
              {status === 'error' && (
                <div className="mt-1 text-xs opacity-70">
                  等待30秒后重试或使用诊断工具
                </div>
              )}
            </div>
          </AlertDescription>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {(status === 'error' || status === 'warning') && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="text-xs h-7 px-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重试
                </Button>
                
                {onOpenDiagnostic && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpenDiagnostic}
                    className="text-xs h-7 px-2"
                  >
                    诊断
                  </Button>
                )}
              </>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}