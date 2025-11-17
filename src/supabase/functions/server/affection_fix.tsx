// 这是好感度API的修复版本，需要替换到 index.tsx 的第1493-1574行

case 'openai':
case 'deepseek':
case 'custom': {
  let apiUrl = baseUrl || 'https://api.openai.com/v1';
  if (apiType === 'deepseek' && !baseUrl) {
    apiUrl = 'https://api.deepseek.com/v1';
  }
  const cleanBaseUrl = apiUrl.replace(/\/$/, '');
  
  // 对于custom API，尝试多个可能的endpoint路径（与聊天API一致）
  // 按常见程度排序
  const possiblePaths = apiType === 'custom' 
    ? [
        '/chat/completions',  // 最常见：如果baseUrl已包含/v1
        '/v1/chat/completions',
        '/api/chat/completions',
        '/',
        '/completions',
        '/v1/completions',
        '/api/v1/chat/completions',
        '/openai/v1/chat/completions',
        '/generate',
        '/api/generate',
        '/v1/engines/chat/completions',
      ]
    : ['/v1/chat/completions'];
  
  let lastError = null;
  let successfulResponse = null;
  const attemptedPaths: string[] = [];
  
  console.log(`🔍 [Affection] API类型: ${apiType}, 原始baseUrl: ${baseUrl || 'default'}`);
  console.log(`🔍 [Affection] 清理后baseUrl: ${cleanBaseUrl}`);
  console.log(`🔍 [Affection] 将尝试 ${possiblePaths.length} 个可能的路径`);
  
  for (const path of possiblePaths) {
    attemptedPaths.push(path);
    
    try {
      // 智能合并URL，避免路径重复
      let fullUrl: string;
      if (path === '/') {
        fullUrl = cleanBaseUrl;
      } else {
        const urlObj = new URL(cleanBaseUrl);
        const basePath = urlObj.pathname;
        if (basePath !== '/' && path.startsWith(basePath)) {
          fullUrl = `${cleanBaseUrl}${path.substring(basePath.length)}`;
        } else {
          fullUrl = `${cleanBaseUrl}${path}`;
        }
      }
      console.log(`🌐 [Affection] 尝试路径 ${attemptedPaths.length}/${possiblePaths.length}: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId || 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 解析错误信息并提供友好提示
        let errorDetail = '';
        let userFriendlyMsg = '';
        try {
          const errorJson = JSON.parse(errorText);
          
          if (errorJson.detail && typeof errorJson.detail === 'string') {
            if (errorJson.detail.includes('当前无可用凭证') || errorJson.detail.includes('no available credentials')) {
              userFriendlyMsg = '⚠️ API服务器提示：当前无可用凭证。建议：1) 检查API密钥是否正确 2) 确认账户是否有余额 3) 尝试更换其他API服务器';
            } else if (errorJson.detail.includes('倍率或价格未配置') || errorJson.detail.includes('ratio or price not set')) {
              userFriendlyMsg = '⚠️ API服务器提示：模型配置错误。建议：1) 检查模型名称是否正确 2) 联系API服务商配置该模型';
            }
          }
          errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
        } catch (e) {
          errorDetail = errorText.substring(0, 200);
        }
        
        console.error(`❌ [Affection] 路径 ${path} 失败 (${response.status}):`, {
          error: errorDetail.substring(0, 200),
          userFriendlyMsg
        });
        
        // 对于custom API，继续尝试下一个路径
        if (apiType === 'custom' && path !== possiblePaths[possiblePaths.length - 1]) {
          console.log(`⚠️ [Affection] 继续尝试下一个路径...`);
          const errorMsg = userFriendlyMsg || errorDetail;
          lastError = new Error(`API调用失败 (${response.status}): ${errorMsg}`);
          continue;
        }
        
        const finalMsg = userFriendlyMsg || errorDetail;
        throw new Error(`API调用失败 (${response.status}): ${finalMsg}`);
      }

      const data = await response.json();
      successfulResponse = data.choices[0]?.message?.content || '';
      console.log(`✅ [Affection] 成功！路径: ${path}`);
      console.log(`✅ [Affection] 响应预览: ${successfulResponse.substring(0, 100)}...`);
      break;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Affection] 路径 ${path} 错误:`, errMsg.substring(0, 200));
      lastError = err;
      
      // 对于custom API，继续尝试下一个路径
      if (apiType === 'custom' && path !== possiblePaths[possiblePaths.length - 1]) {
        console.log(`⚠️ [Affection] 继续尝试下一个路径...`);
        continue;
      }
      
      throw err;
    }
  }
  
  // 如果所有路径都失败
  if (apiType === 'custom' && !successfulResponse && lastError) {
    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
    console.error('❌ [Affection] 所有endpoint路径都失败！');
    console.error('❌ [Affection] Base URL:', cleanBaseUrl);
    console.error('❌ [Affection] 尝试的路径:', attemptedPaths.join(', '));
    console.error('❌ [Affection] 最后的错误:', errorMsg);
    
    throw new Error(
      `无法连接到自定义API。已尝试以下${attemptedPaths.length}个端点路径但均失败:\n` +
      attemptedPaths.map(p => `  - ${cleanBaseUrl}${p}`).join('\n') +
      `\n\n最后的错误: ${errorMsg}\n\n` +
      `请检查:\n` +
      `1. Base URL是否正确\n` +
      `2. API Key是否有效\n` +
      `3. 该API服务是否在线`
    );
  }
  
  responseText = successfulResponse || '';
  break;
}
