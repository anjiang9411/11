import { projectId, publicAnonKey } from './supabase/info';

export interface WarmupResult {
  success: boolean;
  duration?: number;
  error?: string;
}

/**
 * 静默预热服务器，不显示任何UI提示
 * 在应用启动时调用，确保后端服务器已经启动
 */
export const warmupServerSilently = async (): Promise<WarmupResult> => {
  console.log('🔥 [Server Warmup] warmupServerSilently 函数被调用');
  
  try {
    console.log('🔥 [Server Warmup] 开始预热服务器...');
    const startTime = Date.now();
    
    const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/health`;
    console.log('🔥 [Server Warmup] Health URL:', healthUrl);
    
    // 设置较长的超时时间，因为冷启动可能需要30-60秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ [Server Warmup] 预热超时（60秒），但这是正常的，服务器可能仍在启动');
      controller.abort();
    }, 60000); // 60秒超时
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [Server Warmup] 服务器预热成功 (耗时 ${duration}ms)`);
      console.log('📊 [Server Warmup] 服务器状态:', data);
      const result = { success: true, duration };
      console.log('🔥 [Server Warmup] 返回结果:', result);
      return result;
    } else {
      const errorMsg = `服务器响应异常: ${response.status} ${response.statusText}`;
      console.warn(`⚠️ [Server Warmup] ${errorMsg}`);
      const result = { success: false, duration, error: errorMsg };
      console.log('🔥 [Server Warmup] 返回结果:', result);
      return result;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [Server Warmup] 捕获异常:', error);
    
    // 如果是超时错误，返回超时信息
    if (errorMessage.includes('abort')) {
      const errorMsg = '预热超时（60秒），服务器可能仍在启动中';
      console.warn(`⚠️ [Server Warmup] ${errorMsg}`);
      const result = { success: false, error: errorMsg };
      console.log('🔥 [Server Warmup] 返回结果（超时）:', result);
      return result;
    }
    
    console.error('❌ [Server Warmup] 预热失败:', error);
    const result = { success: false, error: errorMessage };
    console.log('🔥 [Server Warmup] 返回结果（失败）:', result);
    return result;
  }
};

/**
 * 带UI提示的服务器预热
 * 用于用户主动触发的操作
 */
export const warmupServerWithToast = async (
  showToast: (message: string, options?: any) => void
): Promise<boolean> => {
  showToast('正在启动后端服务...', {
    description: '首次启动可能需要30-60秒',
    duration: 5000
  });
  
  const result = await warmupServerSilently();
  
  if (result.success) {
    showToast('后端服务已就绪', {
      description: '可以开始使用AI功能了',
      duration: 3000
    });
  } else {
    showToast('后端服务启动异常', {
      description: '请稍后重试，或检查网络连接',
      duration: 5000
    });
  }
  
  return result.success;
};