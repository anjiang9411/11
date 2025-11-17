import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ServerConnectionTestProps {
  projectId: string;
  publicAnonKey: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoTest?: boolean; // 是否在打开时自动测试
}

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'testing';
  message: string;
  details?: any;
}

export function ServerConnectionTest({ 
  projectId, 
  publicAnonKey, 
  open = false, 
  onOpenChange,
  autoTest = true 
}: ServerConnectionTestProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (open && autoTest && testResults.length === 0) {
      runTests();
    }
  }, [open, autoTest]);

  const runTests = async () => {
    setIsTesting(true);
    const results: TestResult[] = [];

    // 测试1: 基础连接测试（根路径）
    results.push({ step: '1. 测试根路径连接', status: 'testing', message: '正在测试...' });
    setTestResults([...results]);

    try {
      const rootUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b`;
      console.log('🧪 [Server Test] Testing root URL:', rootUrl);
      
      const rootResponse = await fetch(rootUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (rootResponse.ok) {
        const rootData = await rootResponse.json();
        results[0] = { 
          step: '1. 测试根路径连接', 
          status: 'success', 
          message: `✅ 连接成功！服务器响应: ${rootData.message || rootData.status}`,
          details: rootData
        };
        console.log('✅ [Server Test] Root URL test passed:', rootData);
      } else {
        results[0] = { 
          step: '1. 测试根路径连接', 
          status: 'error', 
          message: `❌ HTTP ${rootResponse.status}: ${rootResponse.statusText}`,
          details: { status: rootResponse.status, statusText: rootResponse.statusText }
        };
        console.error('❌ [Server Test] Root URL test failed:', rootResponse.status);
      }
    } catch (error: any) {
      results[0] = { 
        step: '1. 测试根路径连接', 
        status: 'error', 
        message: `❌ 连接失败: ${error.message}`,
        details: error
      };
      console.error('❌ [Server Test] Root URL test error:', error);
    }
    setTestResults([...results]);

    // 测试2: 健康检查端点
    results.push({ step: '2. 测试健康检查端点', status: 'testing', message: '正在测试...' });
    setTestResults([...results]);

    try {
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/health`;
      console.log('🧪 [Server Test] Testing health URL:', healthUrl);
      
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const envStatus = healthData.environment || {};
        const allEnvOk = envStatus.hasSupabaseUrl && envStatus.hasSupabaseServiceKey && envStatus.hasAnonKey;
        
        results[1] = { 
          step: '2. 测试健康检查端点', 
          status: allEnvOk ? 'success' : 'error', 
          message: allEnvOk 
            ? `✅ 健康检查通过！环境变量配置正常` 
            : `⚠️ 健康检查通过，但环境变量可能有问题`,
          details: healthData
        };
        console.log('✅ [Server Test] Health check passed:', healthData);
      } else {
        results[1] = { 
          step: '2. 测试健康检查端点', 
          status: 'error', 
          message: `❌ HTTP ${healthResponse.status}: ${healthResponse.statusText}`,
          details: { status: healthResponse.status, statusText: healthResponse.statusText }
        };
        console.error('❌ [Server Test] Health check failed:', healthResponse.status);
      }
    } catch (error: any) {
      results[1] = { 
        step: '2. 测试健康检查端点', 
        status: 'error', 
        message: `❌ 连接失败: ${error.message}`,
        details: error
      };
      console.error('❌ [Server Test] Health check error:', error);
    }
    setTestResults([...results]);

    // 测试3: CORS预检
    results.push({ step: '3. 测试CORS预检请求', status: 'testing', message: '正在测试...' });
    setTestResults([...results]);

    try {
      const corsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/health`;
      console.log('🧪 [Server Test] Testing CORS with OPTIONS:', corsUrl);
      
      const corsResponse = await fetch(corsUrl, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      results[2] = { 
        step: '3. 测试CORS预检请求', 
        status: corsResponse.ok || corsResponse.status === 204 ? 'success' : 'error', 
        message: corsResponse.ok || corsResponse.status === 204 
          ? `✅ CORS配置正常` 
          : `⚠️ CORS可能有问题 (${corsResponse.status})`,
        details: {
          status: corsResponse.status,
          headers: Object.fromEntries(corsResponse.headers.entries())
        }
      };
      console.log('✅ [Server Test] CORS test completed:', corsResponse.status);
    } catch (error: any) {
      results[2] = { 
        step: '3. 测试CORS预检请求', 
        status: 'error', 
        message: `❌ CORS测试失败: ${error.message}`,
        details: error
      };
      console.error('❌ [Server Test] CORS test error:', error);
    }
    setTestResults([...results]);

    // 测试4: 回声测试（POST请求）
    results.push({ step: '4. 测试POST请求（回声测试）', status: 'testing', message: '正在测试...' });
    setTestResults([...results]);

    try {
      const echoUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/test/echo`;
      console.log('🧪 [Server Test] Testing echo URL:', echoUrl);
      
      const testData = { test: 'hello', timestamp: new Date().toISOString() };
      const echoResponse = await fetch(echoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(testData)
      });

      if (echoResponse.ok) {
        const echoData = await echoResponse.json();
        results[3] = { 
          step: '4. 测试POST请求（回声测试）', 
          status: 'success', 
          message: `✅ POST请求正常，服务器能正确处理数据`,
          details: echoData
        };
        console.log('✅ [Server Test] Echo test passed:', echoData);
      } else {
        results[3] = { 
          step: '4. 测试POST请求（回声测试）', 
          status: 'error', 
          message: `❌ POST请求失败 (${echoResponse.status})`,
          details: { status: echoResponse.status }
        };
        console.error('❌ [Server Test] Echo test failed:', echoResponse.status);
      }
    } catch (error: any) {
      results[3] = { 
        step: '4. 测试POST请求（回声测试）', 
        status: 'error', 
        message: `❌ POST请求失败: ${error.message}`,
        details: error
      };
      console.error('❌ [Server Test] Echo test error:', error);
    }
    setTestResults([...results]);

    // 测试5: 尝试访问API配置端点
    results.push({ step: '5. 测试API配置端点', status: 'testing', message: '正在测试...' });
    setTestResults([...results]);

    try {
      const configUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae7aa30b/api/configs`;
      console.log('🧪 [Server Test] Testing API config URL:', configUrl);
      
      const configResponse = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      // 401是预期的（未登录），200或其他表示端点可访问
      if (configResponse.status === 401) {
        results[4] = { 
          step: '5. 测试API配置端点', 
          status: 'success', 
          message: `✅ API配置端点可访问（401未授权是正常的，说明端点工作正常）`,
          details: { status: 401, note: '401是预期的响应' }
        };
        console.log('✅ [Server Test] API config endpoint accessible (401 expected)');
      } else if (configResponse.ok) {
        const configData = await configResponse.json();
        results[4] = { 
          step: '5. 测试API配置端点', 
          status: 'success', 
          message: `✅ API配置端点正常响应`,
          details: configData
        };
        console.log('✅ [Server Test] API config endpoint ok:', configData);
      } else {
        results[4] = { 
          step: '5. 测试API配置端点', 
          status: 'error', 
          message: `⚠️ API配置端点返回 ${configResponse.status}`,
          details: { status: configResponse.status }
        };
        console.error('⚠️ [Server Test] API config endpoint status:', configResponse.status);
      }
    } catch (error: any) {
      results[4] = { 
        step: '5. 测试API配置端点', 
        status: 'error', 
        message: `❌ 连接失败: ${error.message}`,
        details: error
      };
      console.error('❌ [Server Test] API config endpoint error:', error);
    }
    setTestResults([...results]);

    setIsTesting(false);

    // 分析结果并给出建议
    const allSuccess = results.every(r => r.status === 'success');
    if (allSuccess) {
      toast.success('🎉 所有测试通过！后端服务器工作正常');
    } else {
      const failedTests = results.filter(r => r.status === 'error');
      toast.error(`❌ ${failedTests.length}项测试失败，请查看详情`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDiagnosticAdvice = () => {
    if (testResults.length === 0) return null;

    const hasErrors = testResults.some(r => r.status === 'error');
    if (!hasErrors) {
      return (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            <strong>✅ 后端服务器工作正常！</strong>
            <p className="mt-1 text-sm">所有连接测试通过，您可以正常使用AI功能。</p>
          </AlertDescription>
        </Alert>
      );
    }

    // 分析错误类型
    const firstError = testResults.find(r => r.status === 'error');
    let advice = '';

    if (firstError?.message.includes('Failed to fetch') || firstError?.message.includes('NetworkError')) {
      advice = `
**网络连接问题：**

可能的原因：
1. 后端服务器正在启动中（Supabase Edge Function冷启动需要10-30秒）
2. 网络连接不稳定
3. Supabase项目未正确部署

**解决方法：**
- 等待30秒后点击"重新测试"
- 检查网络连接
- 确认Supabase项目ID正确：\`${projectId}\`
- 刷新页面重试
      `;
    } else if (firstError?.message.includes('401') || firstError?.message.includes('403')) {
      advice = `
**权限问题：**

部分测试返回401/403错误，但这可能是正常的（需要登录才能访问某些端点）。

**如果功能无法使用：**
- 请先登录账号
- 检查API Key是否正确配置
      `;
    } else if (firstError?.message.includes('CORS')) {
      advice = `
**CORS跨域问题：**

服务器的CORS配置可能有问题。

**解决方法：**
- 联系开发者检查后端CORS配置
- 刷新页面重试
      `;
    } else {
      advice = `
**后端服务器问题：**

服务器响应异常（HTTP ${firstError?.details?.status || '错误'}）。

**可能的原因：**
- 后端代码有错误
- 环境变量未正确配置
- Supabase服务异常

**解决方法：**
- 查看浏览器控制台的详细错误信息
- 等待几分钟后重试
- 联系技术支持
      `;
    }

    return (
      <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-300">
          <div className="whitespace-pre-line text-sm">{advice}</div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            后端服务器连接诊断
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 测试结果 */}
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.step}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          查看详细信息
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 诊断建议 */}
          {testResults.length > 0 && (
            <div>
              {getDiagnosticAdvice()}
            </div>
          )}

          {/* 配置信息 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-300">📋 配置信息</h3>
            <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1 font-mono">
              <p>• Project ID: {projectId}</p>
              <p>• 服务器URL: https://{projectId}.supabase.co/functions/v1/make-server-ae7aa30b</p>
              <p>• Anon Key: {publicAnonKey.substring(0, 20)}...</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button 
              onClick={runTests}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重新测试
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                console.log('=== 服务器诊断详细日志 ===');
                console.log('Project ID:', projectId);
                console.log('Public Anon Key:', publicAnonKey);
                console.log('测试结果:', testResults);
                toast.success('详细日志已输出到浏览器控制台');
              }}
            >
              导出日志到控制台
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}