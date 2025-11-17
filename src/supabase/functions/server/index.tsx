import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ [Server] Missing required environment variables!');
  console.error('❌ [Server] SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('❌ [Server] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  // 不要抛出错误，允许服务器启动但会在使用时报错
}

console.log('🚀 [Server] Starting Hono server...');
console.log('🔧 [Server] Environment check:');
console.log('  - SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ SET' : '❌ MISSING');
console.log('  - SUPABASE_ANON_KEY:', Deno.env.get('SUPABASE_ANON_KEY') ? '✅ SET' : '❌ MISSING');

// 带重试机制的fetch函数，用于处理429错误
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // 如果是429错误，且还有重试次数，则等待后重试
      if (response.status === 429 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt); // 指数退避
        console.log(`⏳ [Retry] Got 429 error, attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delay}ms before retry...`);
        
        // 尝试解析错误详情
        const errorText = await response.text();
        console.log(`⚠️ [Retry] 429 error details:`, errorText.substring(0, 200));
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // 返回响应（无论成功或其他错误）
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // 如果是网络错误且还有重试次数，等待后重试
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⏳ [Retry] Network error on attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delay}ms before retry...`);
        console.error(`❌ [Retry] Error details:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // 用尽所有重试次数，抛出错误
      throw error;
    }
  }
  
  // 如果循环结束还没有返回，说明所有重试都失败了
  throw lastError || new Error('All retry attempts failed');
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: false,
  }),
);

// 显式处理OPTIONS预检请求
app.options('*', (c) => {
  console.log('🔧 [CORS] Handling OPTIONS request:', c.req.url);
  return c.text('', 204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
  });
});

// 添加请求日志中间件，用于调试
app.use('*', async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  console.log(`📨 [Request] ${method} ${path}`);
  
  try {
    await next();
    const duration = Date.now() - start;
    console.log(`✅ [Response] ${method} ${path} - ${c.res.status} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`❌ [Error] ${method} ${path} - ${err} (${duration}ms)`);
    throw err;
  }
});

// Helper function to get user from access token
async function getUserFromToken(authHeader: string | null) {
  if (!authHeader) {
    console.warn('⚠️ [Auth] No authorization header provided');
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // 检查是否是公共匿名密钥（不需要验证用户）
  const publicAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (token === publicAnonKey) {
    console.log('🔓 [Auth] Using public anon key - allowing anonymous access');
    // 返回一个匿名用户对象
    return { id: 'anonymous', email: 'anonymous@local' };
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [Auth] Missing Supabase environment variables');
    return null;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('❌ [Auth] Error getting user from token:', error.message);
      return null;
    }
    console.log('✅ [Auth] User authenticated:', user?.id);
    return user;
  } catch (error) {
    console.error('❌ [Auth] Exception getting user from token:', error);
    return null;
  }
}

// Root health check
app.get("/", (c) => {
  console.log('🏥 [Root] Root path accessed');
  return c.json({ status: "server running", message: "Make Server AE7AA30B", version: "1.0" });
});

// Alternative root path with prefix
app.get("/make-server-ae7aa30b", (c) => {
  console.log('🏥 [Root] Root path with prefix accessed');
  return c.json({ status: "server running", message: "Make Server AE7AA30B", version: "1.0" });
});

// Health check endpoint
app.get("/make-server-ae7aa30b/health", (c) => {
  console.log('🏥 [Health] Health check requested');
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY')
    }
  });
});

// Simple echo test endpoint for debugging
app.post("/make-server-ae7aa30b/test/echo", async (c) => {
  console.log('🔊 [Test Echo] Test request received');
  try {
    const body = await c.req.json();
    console.log('🔊 [Test Echo] Request body:', body);
    return c.json({ 
      success: true, 
      echo: body,
      message: "Echo test successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Test Echo] Error:', error);
    return c.json({ 
      success: false, 
      error: String(error),
      message: "Echo test failed"
    }, 500);
  }
});

// User signup
app.post("/make-server-ae7aa30b/auth/signup", async (c) => {
  try {
    const { email, password, username } = await c.req.json();
    
    if (!email || !password || !username) {
      return c.json({ success: false, error: "缺少必填字段" }, 400);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ success: false, error: "服务器配置错误：缺少必需的环境变量" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      // Check if the error is due to user already existing
      if (error.message?.includes('already been registered') || error.code === 'email_exists') {
        return c.json({ success: false, error: 'email_exists' }, 422);
      }
      return c.json({ success: false, error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Error in signup:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save user data (profile, apps, theme)
app.post("/make-server-ae7aa30b/user/data", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }

    const userData = await c.req.json();
    const key = `user_data:${user.id}`;
    
    // 计算数据大小
    const dataSize = JSON.stringify(userData).length;
    console.log(`💾 Saving user data for ${user.id} (${(dataSize / 1024).toFixed(2)} KB)`);
    
    // 如果数据太大，提供警告但仍然保存
    if (dataSize > 1024 * 1024) {
      console.warn(`⚠️ Large data size: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    await kv.set(key, userData);
    console.log('✅ User data saved successfully');
    
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving user data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get user data
app.get("/make-server-ae7aa30b/user/data", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }

    const key = `user_data:${user.id}`;
    const userData = await kv.get(key);
    
    console.log('📥 Loading user data for:', user.id, userData ? 'found' : 'not found');
    
    return c.json({ success: true, data: userData || null });
  } catch (error) {
    console.error("Error loading user data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all API configs for the logged-in user
app.get("/make-server-ae7aa30b/api/configs", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }
    
    console.log('📥 Loading API configs for user:', user.id);
    
    // Load user-specific API configs
    const values = await kv.getByPrefix(`user:${user.id}:api_config:`);
    console.log('📦 Raw values from KV:', JSON.stringify(values, null, 2));
    console.log('📊 Number of configs for user:', values?.length || 0);
    
    // Transform to the format expected by frontend: array of {key, value} objects
    const configs = values.map((value) => ({
      key: `user:${user.id}:api_config:${value.id}`,
      value: value
    }));
    
    console.log('📦 Transformed configs:', JSON.stringify(configs, null, 2));
    
    if (configs && configs.length > 0) {
      configs.forEach((config, index) => {
        console.log(`Config ${index + 1}:`, {
          key: config.key,
          hasValue: !!config.value,
          valueType: typeof config.value,
          id: config.value?.id,
          name: config.value?.name,
          selectedModel: config.value?.selectedModel
        });
      });
    }
    
    return c.json({ success: true, configs });
  } catch (error) {
    console.error("❌ Error fetching API configs:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save API config for the logged-in user
app.post("/make-server-ae7aa30b/api/configs", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }
    
    const config = await c.req.json();
    console.log('📝 [POST /api/configs] Received config to save for user:', user.id);
    console.log('📝 [POST /api/configs] Config data:', JSON.stringify(config, null, 2));
    
    if (!config.id || !config.name || !config.type) {
      console.error('❌ [POST /api/configs] Missing required fields:', { 
        id: config.id, 
        name: config.name, 
        type: config.type 
      });
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    
    const key = `user:${user.id}:api_config:${config.id}`;
    console.log('💾 [POST /api/configs] Storing with key:', key);
    console.log('💾 [POST /api/configs] Config data:', {
      id: config.id,
      name: config.name,
      type: config.type,
      selectedModel: config.selectedModel,
      hasApiKey: !!config.apiKey
    });
    
    await kv.set(key, config);
    console.log('✅ [POST /api/configs] kv.set() completed');
    
    // Verify the save immediately
    const saved = await kv.get(key);
    console.log('✅ [POST /api/configs] Verification read from DB:', saved ? 'SUCCESS' : 'FAILED');
    if (saved) {
      console.log('✅ [POST /api/configs] Verified config:', {
        id: saved.id,
        name: saved.name,
        type: saved.type,
        selectedModel: saved.selectedModel
      });
    } else {
      console.error('❌ [POST /api/configs] WARNING: Could not verify saved config!');
    }
    
    // Also check all configs for this user
    const allConfigs = await kv.getByPrefix(`user:${user.id}:api_config:`);
    console.log('📊 [POST /api/configs] Total configs for user after save:', allConfigs?.length || 0);
    
    return c.json({ success: true, config });
  } catch (error) {
    console.error("❌ [POST /api/configs] Error saving API config:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete API config for the logged-in user
app.delete("/make-server-ae7aa30b/api/configs/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }
    
    const id = c.req.param("id");
    await kv.del(`user:${user.id}:api_config:${id}`);
    console.log('✅ Deleted API config:', id, 'for user:', user.id);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting API config:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Fetch models from API provider
app.post("/make-server-ae7aa30b/api/models/list", async (c) => {
  try {
    const { type, baseUrl, apiKey } = await c.req.json();
    
    if (!type || !apiKey) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    let models = [];

    switch (type) {
      case "gemini": {
        // Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetchWithRetry(url, { method: 'GET' });
        if (!response.ok) {
          const statusMsg = response.status === 429 
            ? '当前Gemini API负载已饱和，请稍后再试'
            : `Gemini API error: ${response.statusText}`;
          throw new Error(statusMsg);
        }
        const data = await response.json();
        models = data.models?.map((model: any) => ({
          id: model.name,
          name: model.displayName || model.name,
          description: model.description || "",
        })) || [];
        break;
      }

      case "claude": {
        // Claude doesn't have a public models API, return known models
        models = [
          { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Most intelligent model" },
          { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest model" },
          { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Powerful model for complex tasks" },
          { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "Balance of intelligence and speed" },
          { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fast and compact model" },
        ];
        break;
      }

      case "deepseek":
      case "openai":
      case "custom": {
        // OpenAI compatible API
        let apiUrl = baseUrl || "https://api.openai.com/v1";
        if (type === "deepseek" && !baseUrl) {
          apiUrl = "https://api.deepseek.com/v1";
        }
        const cleanBaseUrl = apiUrl.replace(/\/$/, "");
        const url = `${cleanBaseUrl}/models`;
        
        console.log('🌐 [Models] Fetching models from:', url.replace(apiKey, '***'));
        
        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [Models] API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        models = data.data?.map((model: any) => ({
          id: model.id,
          name: model.id,
          description: model.owned_by || "",
        })) || [];
        
        console.log('✅ [Models] Found', models.length, 'models');
        break;
      }

      default:
        return c.json({ success: false, error: "Unknown API type" }, 400);
    }

    return c.json({ success: true, models });
  } catch (error) {
    console.error("Error fetching models:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all worldbook entries for the logged-in user
app.get("/make-server-ae7aa30b/worldbook/entries", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }
    
    console.log('📥 Loading worldbook entries for user:', user.id);
    
    const values = await kv.getByPrefix(`user:${user.id}:worldbook:`);
    console.log('📊 Number of worldbook entries for user:', values?.length || 0);
    
    const entries = values.map((value) => ({
      key: `user:${user.id}:worldbook:${value.id}`,
      value: value
    }));
    
    return c.json({ success: true, entries });
  } catch (error) {
    console.error("❌ Error fetching worldbook entries:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save worldbook entry for the logged-in user
app.post("/make-server-ae7aa30b/worldbook/entries", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }
    
    const entry = await c.req.json();
    console.log('📝 Saving worldbook entry for user:', user.id);
    
    if (!entry.id || !entry.title || !entry.type) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    
    const key = `user:${user.id}:worldbook:${entry.id}`;
    await kv.set(key, entry);
    console.log('✅ Saved worldbook entry:', entry.id);
    
    return c.json({ success: true, entry });
  } catch (error) {
    console.error("❌ Error saving worldbook entry:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete worldbook entry for the logged-in user
app.delete("/make-server-ae7aa30b/worldbook/entries/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }
    
    const id = c.req.param("id");
    await kv.del(`user:${user.id}:worldbook:${id}`);
    console.log('✅ Deleted worldbook entry:', id, 'for user:', user.id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting worldbook entry:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Chat endpoint - send message to AI
app.post("/make-server-ae7aa30b/api/chat", async (c) => {
  console.log('🌟 [Chat] ========== 收到聊天请求 ==========');
  console.log('🌟 [Chat] 请求来源:', c.req.header('origin') || 'unknown');
  console.log('🌟 [Chat] 请求方法:', c.req.method);
  console.log('🌟 [Chat] 请求路径:', c.req.url);
  console.log('🌟 [Chat] 请求headers:', {
    'content-type': c.req.header('content-type'),
    'authorization': c.req.header('authorization') ? '已提供' : '未提供',
    'user-agent': c.req.header('user-agent')
  });
  
  let type, baseUrl, apiKey, model, messages; // Declare variables in outer scope
  
  try {
    console.log('🔵 [Chat] Parsing request body...');
    const reqBody = await c.req.json();
    console.log('🔵 [Chat] Request body keys:', Object.keys(reqBody));
    
    type = reqBody.type;
    baseUrl = reqBody.baseUrl || '';  // 确保baseUrl始终是字符串
    apiKey = reqBody.apiKey;
    model = reqBody.model;
    messages = reqBody.messages;
    
    console.log('📨 [Chat] Received request:', {
      type,
      model,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasBaseUrl: !!baseUrl,
      baseUrl: baseUrl,
      messagesCount: messages?.length,
      messagesValid: Array.isArray(messages)
    });
    
    if (!type || !apiKey || !model || !messages) {
      console.error('❌ [Chat] Missing required fields:', {
        hasType: !!type,
        type: type || 'undefined',
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        hasModel: !!model,
        model: model || 'undefined',
        hasMessages: !!messages,
        messagesType: typeof messages
      });
      return c.json({ success: false, error: "缺少必需字段：type, apiKey, model 或 messages" }, 400);
    }

    let responseMessage = "";

    switch (type) {
      case "gemini": {
        // 检查是否有自定义baseUrl
        // 如果有，说明这是一个OpenAI兼容的Gemini代理
        if (baseUrl && baseUrl.trim() !== '') {
          console.log('🔄 [Gemini] 检测到自定义baseUrl，将使用OpenAI兼容格式:', baseUrl);
          
          // 使用OpenAI兼容的API格式
          const cleanBaseUrl = baseUrl.replace(/\/$/, "");
          
          // 尝试多个可能的endpoint路径
          const possiblePaths = [
            "/chat/completions",
            "/v1/chat/completions",
            "",
            "/api/chat/completions",
            "/",
          ];
          
          let lastError = null;
          
          for (const path of possiblePaths) {
            let url: string;
            if (path === "/" || path === "") {
              url = cleanBaseUrl;
            } else {
              const urlObj = new URL(cleanBaseUrl);
              const basePath = urlObj.pathname;
              
              if (basePath !== "/" && path.startsWith(basePath)) {
                url = `${cleanBaseUrl}${path.substring(basePath.length)}`;
              } else if (basePath.endsWith("/v1") && path.startsWith("/v1/")) {
                url = `${cleanBaseUrl}${path.substring(3)}`;
              } else {
                url = `${cleanBaseUrl}${path}`;
              }
            }
            
            try {
              console.log(`🌐 [Gemini Custom] Trying: ${url.replace(apiKey, '***')}`);
              
              const requestBody = {
                model: model,
                messages: messages,
              };
              
              const response = await fetchWithRetry(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody),
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                
                // 尝试解析错误信息
                let userFriendlyMsg = '';
                try {
                  const errorJson = JSON.parse(errorText);
                  if (errorJson.error && typeof errorJson.error === 'string') {
                    if (errorJson.error.includes('API Key not found') || errorJson.error.includes('API key')) {
                      userFriendlyMsg = 'API密钥未找到或无效，请检查API配置中的密钥是否正确';
                    } else if (errorJson.error.includes('completionTokens=0')) {
                      userFriendlyMsg = 'API返回了空响应（completionTokens=0），可能是API服务暂时不可用，请稍后重试或更换API配置';
                    }
                  }
                } catch (e) {
                  // 忽略JSON解析错误
                }
                
                // 🚫 500错误（服务器内部错误）可能意味着API服务有问题
                if (response.status === 500) {
                  console.log(`⚠️ [Gemini Custom] Got 500 error - API服务可能暂时不可用`);
                  if (!userFriendlyMsg) {
                    userFriendlyMsg = '外部API服务返回500错误，可能暂时不可用。建议：1) 稍后重试 2) 检查API密钥是否正确 3) 更换其他API配置';
                  }
                  throw new Error(`API 500错误: ${userFriendlyMsg}${errorText ? '\n详情: ' + errorText.substring(0, 200) : ''}`);
                }
                
                // 🚫 429错误（限流）不应该继续尝试其他路径
                if (response.status === 429) {
                  console.log(`⚠️ [Gemini Custom] Got 429 error - this is NOT a path issue`);
                  throw new Error(`API 429 - 当前API负载已饱和，请稍后再试。这通常是临时性的限流，等待几分钟后重试。${errorText ? '\n详情: ' + errorText.substring(0, 200) : ''}`);
                }
                
                lastError = { status: response.status, statusText: response.statusText, error: errorText, userFriendlyMsg, url };
                console.error(`❌ [Gemini Custom] Path ${path} failed with status ${response.status}:`, {
                  status: response.status,
                  statusText: response.statusText,
                  error: errorText.substring(0, 200),
                  userFriendlyMsg,
                  url
                });
                continue;
              }
              
              const data = await response.json();
              const aiResponse = data.choices?.[0]?.message?.content || "";
              
              if (!aiResponse || aiResponse.trim() === '') {
                console.warn('⚠️ [Gemini Custom] API返回了空响应');
                lastError = { status: 200, statusText: "Empty Response", error: "AI返回了空响应", url };
                continue;
              }
              
              responseMessage = aiResponse;
              console.log(`✅ [Gemini Custom] Successfully got response using path: ${path}`);
              break;
              
            } catch (error) {
              lastError = { status: 0, statusText: "Fetch Error", error: String(error), url };
              console.error(`❌ [Gemini Custom] Path ${path} threw error:`, error);
              continue;
            }
          }
          
          // 如果所有路径都失败了
          if (!responseMessage) {
            console.error('❌ [Gemini Custom] All paths failed. Last error:', lastError);
            throw new Error(`Gemini自定义API调用失败: ${JSON.stringify(lastError)}`);
          }
          
          break;
        } else {
          // 使用Google官方Gemini API
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          // Gemini需要特殊处理system消息
          const systemMessage = messages.find((msg: any) => msg.role === "system");
          const otherMessages = messages.filter((msg: any) => msg.role !== "system");
          
          const requestBody: any = {
            contents: otherMessages.map((msg: any) => {
              const parts: any[] = [];
              
              // 如果有图片URL，添加图片
              if (msg.imageUrl) {
                // Gemini支持通过URL直接引用图片
                parts.push({
                  fileData: {
                    mimeType: "image/jpeg",  // 假设是JPEG，Gemini会自动检测
                    fileUri: msg.imageUrl
                  }
                });
              }
              
              // 添加文本内容
              parts.push({ text: msg.content || "请看这张图片" });
              
              return {
                role: msg.role === "assistant" ? "model" : "user",
                parts: parts
              };
            })
          };
          
          // 如果有system消息，作为systemInstruction传递
          if (systemMessage) {
            requestBody.systemInstruction = {
              parts: [{ text: systemMessage.content }]
            };
          }
          
          console.log('Gemini API request with vision:', { url: url.replace(apiKey, '***'), model, hasSystemInstruction: !!systemMessage });
          
          const response = await fetchWithRetry(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            const statusMsg = response.status === 429 
              ? '当前Gemini API负载已饱和，请稍后再试。这通常是临时性的限流，等待几分钟后重试。'
              : `Gemini API error: ${response.status}`;
            throw new Error(`${statusMsg} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Gemini API response:', { hasCandidates: !!data.candidates, candidatesLength: data.candidates?.length });
          
          const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!geminiResponse || geminiResponse.trim() === '') {
            console.warn('⚠️ [Gemini] API返回了空响应');
            console.warn('⚠️ [Gemini] 完整响应:', JSON.stringify(data).substring(0, 500));
            throw new Error('Gemini AI返回了空响应，请检查对话历史和API配置');
          }
          
          responseMessage = geminiResponse;
          break;
        }
      }

      case "claude": {
        // Claude API
        const systemMessage = messages.find((msg: any) => msg.role === "system");
        const claudeMessages = messages.filter((msg: any) => msg.role !== "system").map((msg: any) => {
          // 如果消息包含图片URL，使用Claude的多模态格式
          if (msg.imageUrl) {
            return {
              role: msg.role,
              content: [
                {
                  type: "image",
                  source: {
                    type: "url",
                    url: msg.imageUrl
                  }
                },
                {
                  type: "text",
                  text: msg.content || "请看这张图片"
                }
              ]
            };
          }
          // 普通文本消息
          return {
            role: msg.role,
            content: msg.content
          };
        });
        
        const requestBody: any = {
          model: model,
          max_tokens: 4096,
          messages: claudeMessages
        };
        
        // 如果有system消息，单独传递
        if (systemMessage) {
          requestBody.system = systemMessage.content;
        }
        
        console.log('Claude API request with vision:', JSON.stringify(requestBody, null, 2).substring(0, 500));
        
        const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Claude API错误 (${response.status}):`, errorText);
          const statusMsg = response.status === 429 
            ? '当前Claude API负载已饱和，请稍后再试。这通常是临时性的限流，等待几分钟后重试。'
            : `Claude API调用失败 (${response.status})`;
          throw new Error(`${statusMsg}: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        const claudeResponse = data.content?.[0]?.text || "";
        
        if (!claudeResponse || claudeResponse.trim() === '') {
          console.warn('⚠️ [Claude] API返回了空响应');
          console.warn('⚠️ [Claude] 完整响应:', JSON.stringify(data).substring(0, 500));
          throw new Error('Claude AI返回了空响应，请检查对话历史和API配置');
        }
        
        responseMessage = claudeResponse;
        break;
      }

      case "deepseek":
      case "openai":
      case "custom": {
        // OpenAI compatible API
        let apiUrl = baseUrl || 'https://api.openai.com/v1';
        if (type === 'deepseek' && !baseUrl) {
          apiUrl = 'https://api.deepseek.com/v1';
        }
        const cleanBaseUrl = apiUrl.replace(/\/$/, "");
        
        // For custom APIs, try multiple possible endpoint paths
        // 按常见程度排序，最常见的放在前面
        const possiblePaths = type === "custom" 
          ? [
              "/chat/completions",  // 最常见：如果baseUrl已包含/v1
              "/v1/chat/completions",  // 标准OpenAI路径
              "",  // 直接使用baseUrl本身（如果baseUrl就是完整端点）
              "/api/chat/completions",
              "/models/chat/completions",  // 去掉/v1前缀，让智能去重处理
              "/",  // 有些代理直接在根路径
              "/completions",
              "/v1/completions",
              "/api/v1/chat/completions",
              "/openai/v1/chat/completions",
              "/openai/deployments/chat/completions",  // Azure风格
              "/generate",  // 有些使用generate端点
              "/api/generate",
              "/engines/chat/completions",  // 去掉/v1前缀
              "/messages",  // 去掉/v1前缀，Claude风格
            ]
          : ["/v1/chat/completions"];
        
        let lastError = null;
        let successfulResponse = null;
        const attemptedPaths: string[] = [];
        
        console.log(`🔍 [Chat] Will try ${possiblePaths.length} possible endpoint paths for ${type} API`);
        console.log(`🔍 [Chat] Base URL: ${cleanBaseUrl}`);
        
        // Try each possible endpoint path
        for (const path of possiblePaths) {
          // 智能合并URL，避免路径重复
          // 例如：baseUrl="https://api.com/v1", path="/v1/chat/completions"
          // 应该得到 "https://api.com/v1/chat/completions" 而不是重复的 "/v1/v1/..."
          let url: string;
          
          if (path === "/" || path === "") {
            // 空路径或根路径：直接使用baseUrl
            url = cleanBaseUrl;
          } else {
            // 提取baseUrl的路径部分和path，检查是否有重叠
            const urlObj = new URL(cleanBaseUrl);
            const basePath = urlObj.pathname; // 例如 "/gemini/v1" 或 "/v1"
            
            // 智能去重逻辑：处理各种路径重复情况
            if (basePath !== "/") {
              // 1. 完全匹配：basePath="/v1", path="/v1/chat/completions"
              if (path.startsWith(basePath)) {
                url = `${cleanBaseUrl}${path.substring(basePath.length)}`;
              }
              // 2. 部分匹配：basePath以/v1结尾，path以/v1开头
              // 例如：basePath="/gemini/v1", path="/v1/models/chat/completions"
              else if (basePath.endsWith("/v1") && path.startsWith("/v1/")) {
                // 去掉path中的/v1前缀
                url = `${cleanBaseUrl}${path.substring(3)}`;  // 去掉"/v1"
              }
              // 3. 无重叠：直接拼接
              else {
                url = `${cleanBaseUrl}${path}`;
              }
            } else {
              url = `${cleanBaseUrl}${path}`;
            }
          }
          
          attemptedPaths.push(path);
          
          // 添加URL去重调试信息
          const urlObj = new URL(cleanBaseUrl);
          const basePath = urlObj.pathname;
          if (basePath !== "/" && path && path !== "/" && path !== "") {
            console.log(`🔧 [URL构建] basePath="${basePath}", path="${path}" -> finalURL="${url}"`);
          }
          
          try {
            console.log(`🌐 [Chat] Attempting path ${attemptedPaths.length}/${possiblePaths.length}: ${path}`);
            console.log('🌐 [Chat] Full URL:', url.replace(apiKey, '***'));
            
            // 处理图片消息 - OpenAI Vision格式
            const processedMessages = messages.map((msg: any) => {
              if (msg.imageUrl) {
                // 在文本中明确包含图片URL，让AI知道图片的URL（用于换头像等功能）
                const textContent = msg.content || "请看这张图片";
                const textWithUrl = `${textContent}\n[图片URL: ${msg.imageUrl}]`;
                
                return {
                  role: msg.role,
                  content: [
                    {
                      type: "image_url",
                      image_url: {
                        url: msg.imageUrl
                      }
                    },
                    {
                      type: "text",
                      text: textWithUrl
                    }
                  ]
                };
              }
              return msg;
            });
            
            const requestBody = {
              model: model,
              messages: processedMessages,
            };
            
            console.log('📤 [Chat] Request details:', {
              url: url.replace(apiKey, '***'),
              model: model,
              messageCount: processedMessages.length,
              hasImages: processedMessages.some((m: any) => m.imageUrl || (Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')))
            });
            
            const response = await fetchWithRetry(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify(requestBody),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              
              // 解析错误信息并提供友好提示
              let errorDetail = '';
              let userFriendlyMsg = '';
              try {
                const errorJson = JSON.parse(errorText);
                errorDetail = JSON.stringify(errorJson);
                
                // 检测常见的API错误并给出友好提示
                if (errorJson.detail && typeof errorJson.detail === 'string') {
                  if (errorJson.detail.includes('当前无可用凭证') || errorJson.detail.includes('no available credentials')) {
                    userFriendlyMsg = '⚠️ API服务器提示：当前无可用凭证。建议：1) 检查API密钥是否正确 2) 确认账户是否有余额 3) 尝试更换其他API服务器';
                  } else if (errorJson.detail.includes('倍率或价格未配置') || errorJson.detail.includes('ratio or price not set')) {
                    userFriendlyMsg = '⚠️ API服务器提示：模型配置错误。建议：1) 检查模型名称是否正确（删除特殊前缀如"流式抗截断/"） 2) 联系API服务商配置该模型';
                  }
                } else if (errorJson.error && errorJson.error.message) {
                  if (errorJson.error.message.includes('Invalid URL')) {
                    userFriendlyMsg = '⚠️ API端点路径错误。系统正在尝试其他可能的端点...';
                  }
                  errorDetail = errorJson.error.message;
                }
              } catch (e) {
                errorDetail = errorText.substring(0, 300);
              }
              
              console.error(`❌ [Chat] Path ${path} failed with status ${response.status}:`, {
                status: response.status,
                statusText: response.statusText,
                error: errorDetail.substring(0, 300),
                userFriendlyMsg,
                url: url.replace(apiKey, '***')
              });
              
              // 🚫 429错误（限流）或503错误（服务不可用）不应该触发路径重试
              // 因为这些是服务端临时问题，而不是路径错误
              if (response.status === 429 || response.status === 503) {
                console.log(`⚠️ [Chat] Got ${response.status} error - this is NOT a path issue, stopping path attempts`);
                const statusMsg = response.status === 429 
                  ? '当前API负载已饱和，请稍后再试。这通常是临时性的限流，等待几分钟后重试。'
                  : 'API服务暂时不可用，请稍后再试。';
                throw new Error(`API ${response.status} - ${statusMsg}${errorDetail ? '\\n详情: ' + errorDetail : ''}`);
              }
              
              // For custom APIs, continue trying next path on other 4xx/5xx errors
              if (type === "custom" && path !== possiblePaths[possiblePaths.length - 1]) {
                // 保存有用的错误信息
                if (userFriendlyMsg) {
                  lastError = new Error(userFriendlyMsg);
                } else {
                  lastError = new Error(`${response.status} - ${errorDetail}`);
                }
                console.log(`⚠️ [Chat] Continuing to next path...`);
                continue;
              }
              
              // For non-custom APIs or last path, throw the error with friendly message
              const finalMsg = userFriendlyMsg || errorDetail;
              throw new Error(`API error: ${response.status} - ${finalMsg}`);
            }
            
            const data = await response.json();
            successfulResponse = data.choices?.[0]?.message?.content || "";
            
            // 检查是否收到空响应
            if (!data.choices || data.choices.length === 0) {
              console.warn('⚠️ [Chat] API返回成功但没有choices数组');
              console.warn('⚠️ [Chat] 完整响应:', JSON.stringify(data).substring(0, 500));
              
              // 尝试检测其他可能的响应格式
              if (data.response) {
                // 某些API直接返回 { response: "..." }
                successfulResponse = data.response;
                console.log('✅ [Chat] 检测到备用格式: response字段');
              } else if (data.text) {
                // 某些API返回 { text: "..." }
                successfulResponse = data.text;
                console.log('✅ [Chat] 检测到备用格式: text字段');
              } else if (data.content) {
                // 某些API返回 { content: "..." }
                successfulResponse = data.content;
                console.log('✅ [Chat] 检测到备用格式: content字段');
              } else if (data.message) {
                // 某些API返回 { message: "..." }
                successfulResponse = typeof data.message === 'string' ? data.message : data.message.content;
                console.log('✅ [Chat] 检测到备用格式: message字段');
              } else if (data.output) {
                // 某些API返回 { output: "..." }
                successfulResponse = data.output;
                console.log('✅ [Chat] 检测到备用格式: output字段');
              } else if (type === "custom" && path !== possiblePaths[possiblePaths.length - 1]) {
                // 如果是自定义API且不是最后一个路径，继续尝试
                console.log('⚠️ [Chat] 无法识别响应格式，尝试下一个路径');
                lastError = new Error('API返回的数据格式错误：缺少choices数组');
                continue;
              } else {
                throw new Error('API返回的数据格式错误：缺少choices数组');
              }
            } else if (!data.choices[0]?.message) {
              console.warn('⚠️ [Chat] API返回的choice中没有message');
              console.warn('⚠️ [Chat] Choice内容:', JSON.stringify(data.choices[0]).substring(0, 500));
              throw new Error('API返回的数据格式错误：choices[0]中缺少message');
            } else if (!data.choices[0]?.message?.content || data.choices[0]?.message?.content.trim() === '') {
              console.warn('⚠️ [Chat] API返回的message.content为空');
              console.warn('⚠️ [Chat] Message对象:', JSON.stringify(data.choices[0].message));
              console.warn('⚠️ [Chat] 可能的原因: 1) ���息历史格式错误 2) API配置问题 3) 模型无法理解请求');
              throw new Error('AI返回了空响应，请检查对话历史和API配置');
            }
            
            // 确保我们有有效的响应
            if (!successfulResponse || successfulResponse.trim() === '') {
              console.warn('⚠️ [Chat] 处理后的响应仍为空');
              if (type === "custom" && path !== possiblePaths[possiblePaths.length - 1]) {
                lastError = new Error('处理后的响���为空');
                continue;
              }
              throw new Error('AI返回了空响应');
            }
            
            console.log(`✅ [Chat] SUCCESS! Path ${path} worked!`);
            console.log(`✅ [Chat] Response preview: ${successfulResponse.substring(0, 100)}...`);
            break; // Success, exit the loop
            
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ [Chat] Path ${path} threw error:`, errMsg.substring(0, 200));
            lastError = err;
            
            // If it's a custom API and not the last path, continue trying
            if (type === "custom" && path !== possiblePaths[possiblePaths.length - 1]) {
              console.log(`⚠️ [Chat] Continuing to next path...`);
              continue;
            }
            
            // Otherwise, throw the error
            throw err;
          }
        }
        
        // If we tried all paths and none worked for custom API
        if (type === "custom" && !successfulResponse && lastError) {
          const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
          console.error('❌ [Chat] All endpoint paths failed for custom API!');
          console.error('❌ [Chat] Base URL:', cleanBaseUrl);
          console.error('❌ [Chat] Attempted paths:', attemptedPaths.join(', '));
          console.error('❌ [Chat] Last error:', errorMsg);
          
          // 提取更有用的错误信息
          let userTip = '';
          if (errorMsg.includes('当前无可用凭证') || errorMsg.includes('no available credentials')) {
            userTip = '\n\n💡 提示：API服务器返回"无可用凭证"。这通常意味着：\n  • API密钥无效或已过期\n  • 账户余额不足\n  • API服务器当前没有可用的后端凭证\n\n建议：检查API密钥是否正确，或尝试使用其他API服务商。';
          } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
            userTip = '\n\n💡 提示：所有尝试的端点都返回404（未找到）。这可能意味着：\n  • Base URL配置错误\n    - 如果Base URL包含了完整的API端点（如 .../v1/chat/completions），请只保留服务器根地址部分\n    - 正确示例：https://api.example.com 或 https://api.example.com/v1\n    - 错误示例：https://api.example.com/v1/chat/completions（不要包含具体端点）\n  • 该API服务使用了非标准的端点路径（我们已尝试15+种常见路径）\n  • API服务器可能暂时不可用\n\n建议：\n  1. 检查并简化Base URL（去掉路径部分，只保留域名）\n  2. 查看API服务商的文档确认正确的Base URL格式\n  3. 如果是临时部署服务（如Render），确保服务已启动并可访问';
          } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            userTip = '\n\n💡 提示：认证失败。请检查API密钥是否正确。';
          } else if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
            userTip = '\n\n💡 提示：API服务器错误。这通常是服务器端的问题，稍后再试或联系服务商。';
          }
          
          // Provide a helpful error message to the user
          throw new Error(
            `❌ 无法连接到自定义API\n\n` +
            `已尝试 ${attemptedPaths.length} 个端点路径:\n` +
            attemptedPaths.slice(0, 3).map(p => `  • ${p}`).join('\n') +
            (attemptedPaths.length > 3 ? `\n  • ... 等${attemptedPaths.length - 3}个路径` : '') +
            `\n\n最后的错误: ${errorMsg.substring(0, 200)}${userTip}`
          );
        }
        
        if (!successfulResponse) {
          throw new Error('API调用成功但没有返回内容');
        }
        
        responseMessage = successfulResponse;
        break;
      }

      default:
        return c.json({ success: false, error: "Unknown API type" }, 400);
    }

    // 提取状态信息和消息内容
    // 格式: <STATUS>状态文字</STATUS>消息内容
    let statusText = "";
    let signatureText = "";
    let locationText = "";
    let cleanMessage = responseMessage;
    
    const statusMatch = responseMessage.match(/<STATUS>(.*?)<\/STATUS>/);
    if (statusMatch) {
      statusText = statusMatch[1].trim();
      cleanMessage = responseMessage.replace(/<STATUS>.*?<\/STATUS>/, '').trim();
    }
    
    // 提取个性签名信息
    // 格式: <SIGNATURE>新的个性签名</SIGNATURE>
    const signatureMatch = cleanMessage.match(/<SIGNATURE>(.*?)<\/SIGNATURE>/);
    if (signatureMatch) {
      signatureText = signatureMatch[1].trim();
      cleanMessage = cleanMessage.replace(/<SIGNATURE>.*?<\/SIGNATURE>/, '').trim();
    }
    
    // 提取所在地区信息
    // 格式: <LOCATION>新地区</LOCATION>
    const locationMatch = cleanMessage.match(/<LOCATION>(.*?)<\/LOCATION>/);
    if (locationMatch) {
      locationText = locationMatch[1].trim();
      cleanMessage = cleanMessage.replace(/<LOCATION>.*?<\/LOCATION>/, '').trim();
    }
    
    // 提取昵称信息
    // 格式: <NICKNAME>新的昵称</NICKNAME>
    let nicknameText = "";
    const nicknameMatch = cleanMessage.match(/<NICKNAME>(.*?)<\/NICKNAME>/);
    if (nicknameMatch) {
      nicknameText = nicknameMatch[1].trim();
      cleanMessage = cleanMessage.replace(/<NICKNAME>.*?<\/NICKNAME>/, '').trim();
    }
    
    // 提取头像信息
    // 格式: <AVATAR>头像URL</AVATAR>
    let avatarUrl = "";
    const avatarMatch = cleanMessage.match(/<AVATAR>(.*?)<\/AVATAR>/);
    if (avatarMatch) {
      avatarUrl = avatarMatch[1].trim();
      cleanMessage = cleanMessage.replace(/<AVATAR>.*?<\/AVATAR>/, '').trim();
    }
    
    // 提取用户备注名信息
    // 格式: <USER_REMARK>新的备注名</USER_REMARK>
    let userRemarkText = "";
    const userRemarkMatch = cleanMessage.match(/<USER_REMARK>(.*?)<\/USER_REMARK>/);
    if (userRemarkMatch) {
      userRemarkText = userRemarkMatch[1].trim();
      cleanMessage = cleanMessage.replace(/<USER_REMARK>.*?<\/USER_REMARK>/, '').trim();
    }
    
    // 提取备忘录信息
    // 格式: <MEMO>备忘内容</MEMO>
    let memoText = "";
    const memoMatch = cleanMessage.match(/<MEMO>(.*?)<\/MEMO>/);
    if (memoMatch) {
      memoText = memoMatch[1].trim();
      cleanMessage = cleanMessage.replace(/<MEMO>.*?<\/MEMO>/, '').trim();
      console.log('📝 [Chat] AI添加备忘录:', memoText);
    }
    
    // 检测视频通话请求
    let videoCallRequested = false;
    try {
      const videoCallMatch = cleanMessage.match(/<VIDEO_CALL>(.*?)<\/VIDEO_CALL>/);
      if (videoCallMatch) {
        videoCallRequested = true;
        cleanMessage = cleanMessage.replace(/<VIDEO_CALL>.*?<\/VIDEO_CALL>/, '').trim();
        console.log('📞 [Chat] AI请求发起视频通话');
      }
    } catch (e) {
      console.warn('⚠️ [Chat] 视频通话检测失败:', e);
    }
    
    // 检测语音通话请求
    let voiceCallRequested = false;
    try {
      const voiceCallMatch = cleanMessage.match(/<VOICE_CALL>(.*?)<\/VOICE_CALL>/);
      if (voiceCallMatch) {
        voiceCallRequested = true;
        cleanMessage = cleanMessage.replace(/<VOICE_CALL>.*?<\/VOICE_CALL>/, '').trim();
        console.log('📞 [Chat] AI请求发起语音通话');
      }
    } catch (e) {
      console.warn('⚠️ [Chat] 语音通话检测失败:', e);
    }
    
    // 检测换头像请求
    let changeAvatarData = null;
    try {
      const changeAvatarMatch = cleanMessage.match(/<CHANGE_AVATAR>(.*?)<\/CHANGE_AVATAR>/);
      if (changeAvatarMatch) {
        const parts = changeAvatarMatch[1].split('|');
        if (parts.length >= 3) {
          changeAvatarData = {
            url: parts[0].trim(),
            emotion: parts[1].trim(),
            description: parts[2].trim()
          };
          cleanMessage = cleanMessage.replace(/<CHANGE_AVATAR>.*?<\/CHANGE_AVATAR>/, '').trim();
          console.log('🖼️ [Chat] AI同意换头像:', changeAvatarData);
        } else {
          console.warn('⚠️ [Chat] CHANGE_AVATAR标签格式错误，需要3个部分，但只有', parts.length);
        }
      } else {
        console.log('🖼️ [Chat] 未找到CHANGE_AVATAR标签，cleanMessage:', cleanMessage.substring(0, 200));
      }
    } catch (e) {
      console.warn('⚠️ [Chat] 换头像检测失败:', e);
    }
    
    // 分割回复成多条消息
    // 支持两种分隔符：
    // 1. "---SPLIT---" (标准格式)
    // 2. 单独一行的 "---" (简化格式，更自然)
    const splitMessages = cleanMessage
      .split(/---SPLIT---|(?:\r?\n|\r)---(?:\r?\n|\r)/)
      .map((msg: string) => {
        // 去除首尾空白
        let cleaned = msg.trim();
        // 将连续3个以上的换行符替换为2个换行符
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        // 去除每行首尾的空格（但保留行间的换行）
        cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
        return cleaned;
      })
      .filter((msg: string) => msg.length > 0);
    
    console.log('📨 [Chat] AI response split into', splitMessages.length, 'messages');
    if (statusText) {
      console.log('💭 [Chat] AI status:', statusText);
    }
    if (signatureText) {
      console.log('✍️ [Chat] AI signature:', signatureText);
    }
    if (locationText) {
      console.log('📍 [Chat] AI location:', locationText);
    }
    if (nicknameText) {
      console.log('📝 [Chat] AI nickname:', nicknameText);
    }
    if (avatarUrl) {
      console.log('🖼️ [Chat] AI avatar:', avatarUrl);
    }
    if (userRemarkText) {
      console.log('🏷️ [Chat] AI user remark:', userRemarkText);
    }
    if (memoText) {
      console.log('📝 [Chat] AI memo:', memoText);
    }
    if (changeAvatarData) {
      console.log('🖼️ [Chat] AI change avatar:', changeAvatarData);
    }
    
    return c.json({ 
      success: true, 
      message: cleanMessage,
      messages: splitMessages.length > 1 ? splitMessages : undefined,
      status: statusText || undefined,
      signature: signatureText || undefined,
      location: locationText || undefined,
      nickname: nicknameText || undefined,
      // 如果有changeAvatar，则不返回avatar字段（避免冲突）
      avatar: changeAvatarData ? undefined : (avatarUrl || undefined),
      userRemark: userRemarkText || undefined,
      memo: memoText || undefined,
      videoCall: videoCallRequested || undefined,
      voiceCall: voiceCallRequested || undefined,
      changeAvatar: changeAvatarData || undefined
    });
  } catch (error) {
    console.error("❌ [Chat] Error in chat endpoint:", error);
    
    // 提取更详细的错误信息
    let errorMessage = String(error);
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("❌ [Chat] Error message:", error.message);
      console.error("❌ [Chat] Error stack:", error.stack);
      console.error("❌ [Chat] Error name:", error.name);
    }
    
    // 记录请求参数以便调试
    console.error("❌ [Chat] Request details when error occurred:", {
      type: type || 'undefined',
      model: model || 'undefined',
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasBaseUrl: !!baseUrl,
      baseUrl: baseUrl || 'undefined',
      messagesCount: messages?.length || 0,
      messagesValid: Array.isArray(messages)
    });
    
    console.error("❌ [Chat] Returning error response to client");
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Helper function to check if a song can be played
async function canPlaySong(songId: string, apiServers: string[]): Promise<boolean> {
  // 快速检查 - 只尝试第一个服务器的标准音质
  const apiServer = apiServers[0];
  
  try {
    const timestamp = Date.now();
    const urlApi = `${apiServer}/song/url/v1?id=${songId}&level=standard&timestamp=${timestamp}`;
    
    const response = await fetch(urlApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(2000) // 2秒超时，快速验证
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    if (data.code !== 200) {
      return false;
    }
    
    const songData = data.data?.[0];
    
    if (!songData) {
      return false;
    }
    
    // 检查是否有播放URL（主要检查）
    if (!songData.url || songData.url.trim() === '') {
      return false;
    }
    
    // 简单检查VIP状态（次要检查）
    const fee = songData.fee || 0;
    if (songData.freeTrialInfo) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    // 超时或其他错误，返回false
    return false;
  }
}

// Helper function to verify songs in batches
async function verifyPlayableSongs(songs: any[], apiServers: string[], targetCount = 15): Promise<any[]> {
  const playableSongs: any[] = [];
  const batchSize = 8; // 每批验证8首
  const maxSongsToCheck = 40; // 最多验证40首
  
  const songsToCheck = songs.slice(0, maxSongsToCheck);
  
  for (let i = 0; i < songsToCheck.length; i += batchSize) {
    const batch = songsToCheck.slice(i, i + batchSize);
    
    // 并发验证这一批
    const checks = await Promise.all(
      batch.map(async (song) => {
        const canPlay = await canPlaySong(song.id.toString(), apiServers);
        return { song, canPlay };
      })
    );
    
    // 收集可播放的歌曲
    const playableInBatch = checks.filter(c => c.canPlay).map(c => c.song);
    playableSongs.push(...playableInBatch);
    
    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Found ${playableInBatch.length} playable songs (Total: ${playableSongs.length})`);
    
    // 如果已经找到足够的可播放歌曲，提前返回
    if (playableSongs.length >= targetCount) {
      console.log(`✅ Found enough playable songs (${playableSongs.length}), stopping verification`);
      break;
    }
  }
  
  return playableSongs;
}

// Music search endpoint - search songs from Netease Cloud Music
app.get("/make-server-ae7aa30b/music/search", async (c) => {
  try {
    const keyword = c.req.query("keyword");
    const type = c.req.query("type") || "1"; // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单
    const limit = c.req.query("limit") || "30";
    
    console.log('🔍 [Music Search] Received request - Keyword:', keyword, 'Type:', type, 'Limit:', limit);
    
    if (!keyword) {
      console.error('❌ [Music Search] Missing keyword');
      return c.json({ success: false, error: "Missing search keyword" }, 400);
    }

    // 使用网易云音乐开源API项目，带重试机制
    const apiServers = [
      'https://netease-cloud-music-api-alpha-seven.vercel.app',
      'https://netease-music-api-phi.vercel.app',
      'https://music-api-puce.vercel.app',
      'https://netease-cloud-music-api-three-silk.vercel.app'
    ];
    
    let lastError = null;
    
    // 尝试每个API服务器
    for (const apiServer of apiServers) {
      try {
        const searchUrl = `${apiServer}/search?keywords=${encodeURIComponent(keyword)}&type=${type}&limit=${limit}`;
        console.log('📡 [Music Search] Trying:', searchUrl);
        
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000) // 10秒超时
        });
        
        console.log('📡 [Music Search] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 [Music Search] Response code:', data.code);
        
        // 检查API返回的数据格式
        if (data.code !== 200) {
          throw new Error(`API code ${data.code}: ${data.msg || 'Unknown error'}`);
        }
        
        // 新API格式的数据解析
        let result;
        if (type === '1') {
          // 单曲搜索 - 只过滤明确的VIP歌曲
          const allSongs = data.result?.songs || [];
          console.log('✅ [Music Search] Found songs:', allSongs.length);
          
          // 过滤掉明确的VIP歌曲
          // fee: 0 = 免费, 1 = VIP, 4 = 购买专辑, 8 = 低品质免费
          const freeSongs = allSongs.filter((song: any) => {
            const fee = song.fee || song.privilege?.fee || 0;
            // 只过滤fee=1的VIP歌曲，保留其他所有歌曲（包括fee=0,4,8等）
            const isVip = (fee === 1);
            
            if (isVip) {
              console.log('🚫 Filtered VIP song:', song.name, 'fee:', fee);
            }
            return !isVip;
          });
          
          console.log('✅ [Music Search] Non-VIP songs:', freeSongs.length);
          if (freeSongs.length > 0) {
            console.log('First song:', freeSongs[0].name, 'by', freeSongs[0].artists?.[0]?.name, 'fee:', freeSongs[0].fee);
          }
          
          // 验证歌曲是否能播放，只返回可播放的歌曲
          console.log('🔍 [Music Search] Verifying playability of songs...');
          const playableSongs = await verifyPlayableSongs(freeSongs, apiServers, 15);
          
          console.log('✅ [Music Search] Final result: ', playableSongs.length, 'playable songs out of', freeSongs.length, 'non-VIP songs');
          if (playableSongs.length > 0) {
            console.log('First playable song:', playableSongs[0].name, 'by', playableSongs[0].artists?.[0]?.name);
          }
          
          // 返回可播放的歌曲
          result = { songs: playableSongs };
        } else if (type === '100') {
          // 歌手搜索 - 返回该歌手的热门歌曲
          const artists = data.result?.artists || [];
          console.log('✅ [Music Search] Found artists:', artists.length);
          
          if (artists.length === 0) {
            result = { songs: [] };
          } else {
            // 获取第一个歌手的ID
            const artistId = artists[0].id;
            const artistName = artists[0].name;
            console.log('🎤 [Music Search] Getting songs for artist:', artistName, 'ID:', artistId);
            
            try {
              // 获取该歌手的热门歌曲（Top 50）
              const artistSongsUrl = `${apiServer}/artist/songs?id=${artistId}&limit=50`;
              console.log('📡 [Music Search] Fetching artist songs from:', artistSongsUrl);
              
              const artistResponse = await fetch(artistSongsUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: AbortSignal.timeout(10000)
              });
              
              if (artistResponse.ok) {
                const artistData = await artistResponse.json();
                if (artistData.code === 200) {
                  const allSongs = artistData.songs || [];
                  console.log('✅ [Music Search] Found artist songs:', allSongs.length);
                  
                  // 只过滤明确的VIP歌曲（fee=1）
                  const freeSongs = allSongs.filter((song: any) => {
                    const fee = song.fee || song.privilege?.fee || 0;
                    const isVip = (fee === 1);
                    
                    if (isVip) {
                      console.log('🚫 Filtered VIP song:', song.name, 'fee:', fee);
                    }
                    return !isVip;
                  });
                  
                  console.log('✅ [Music Search] Non-VIP artist songs:', freeSongs.length);
                  if (freeSongs.length > 0) {
                    console.log('First artist song:', freeSongs[0].name, 'fee:', freeSongs[0].fee);
                  }
                  
                  // 验证歌曲是否能播放，只返回可播放的歌曲
                  console.log('🔍 [Music Search] Verifying playability of artist songs...');
                  const playableSongs = await verifyPlayableSongs(freeSongs, apiServers, 15);
                  
                  console.log('✅ [Music Search] Final result: ', playableSongs.length, 'playable artist songs out of', freeSongs.length, 'non-VIP songs');
                  if (playableSongs.length > 0) {
                    console.log('First playable artist song:', playableSongs[0].name);
                  }
                  
                  result = { songs: playableSongs };
                } else {
                  console.warn('⚠️ [Music Search] Artist songs API returned code:', artistData.code);
                  result = { songs: [] };
                }
              } else {
                console.warn('⚠️ [Music Search] Artist songs request failed:', artistResponse.status);
                result = { songs: [] };
              }
            } catch (artistErr) {
              console.warn('⚠️ [Music Search] Failed to fetch artist songs:', artistErr);
              result = { songs: [] };
            }
          }
        } else {
          result = data.result || {};
        }
        
        console.log('✅ [Music Search] Success with:', apiServer);
        return c.json({ success: true, data: result });
        
      } catch (err) {
        console.warn(`⚠️ [Music Search] Failed with ${apiServer}:`, err);
        lastError = err;
        continue; // 尝试下一个服务器
      }
    }
    
    // 所有服务器都失败了
    console.error("❌ [Music Search] All API servers failed");
    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    return c.json({ success: false, error: `All music API servers unavailable: ${errorMessage}` }, 503);
    
  } catch (error) {
    console.error("❌ [Music Search] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Get song URL endpoint
app.get("/make-server-ae7aa30b/music/url/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    console.log('🔗 [Music URL] Received request for song ID:', id);
    
    if (!id) {
      console.error('❌ [Music URL] Missing song ID');
      return c.json({ success: false, error: "Missing song ID" }, 400);
    }

    // 使用网易云音乐开源API项目获取播放地址，带重试机制
    // 只使用最可靠的几个服务器，减少等待时间
    const apiServers = [
      'https://netease-cloud-music-api-alpha-seven.vercel.app',
      'https://netease-music-api-phi.vercel.app',
      'https://music-api-puce.vercel.app',
      'https://cloudmusic-api.vercel.app',
      'https://ncm-api.vercel.app'
    ];
    
    let lastError = null;
    let vipDetected = false;
    let unavailableDetected = false; // 区分VIP和版权/地区限制
    
    // 优先使用标准音质，更快获取结果
    const qualities = ['standard', 'higher'];
    
    // 首先尝试使用 /song/url/v1 接口（新版本）
    for (const apiServer of apiServers) {
      for (const level of qualities) {
        try {
          // 添加timestamp参数，有助于绕过缓存和获取最新链接
          const timestamp = Date.now();
          const urlApi = `${apiServer}/song/url/v1?id=${id}&level=${level}&timestamp=${timestamp}`;
          console.log('📡 [Music URL] Trying v1:', urlApi);
          
          const response = await fetch(urlApi, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(6000) // 6秒超时，更快失败重试
          });
          
          console.log('📡 [Music URL] Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📦 [Music URL] Response code:', data.code, 'level:', level);
          console.log('📦 [Music URL] Full response:', JSON.stringify(data, null, 2));
          
          if (data.code !== 200) {
            throw new Error(`API code ${data.code}: ${data.msg || 'Unknown error'}`);
          }
          
          const songData = data.data?.[0];
          
          console.log('🎵 [Music URL] Parsed songData:', JSON.stringify(songData, null, 2));
          console.log('🎵 [Music URL] Data structure:', {
            hasData: !!songData,
            dataType: typeof songData,
            hasUrl: !!songData?.url,
            urlValue: songData?.url,
            fee: songData?.fee,
            freeTrialInfo: songData?.freeTrialInfo,
            code: songData?.code,
            br: songData?.br,
            size: songData?.size
          });
          
          // 检查是否有数据返回
          if (!songData) {
            console.error('❌ [Music URL] No songData in response');
            throw new Error('No song data');
          }
          
          // 检查VIP状态（在检查URL之前）
          const fee = songData.fee || 0;
          
          if (songData.freeTrialInfo) {
            console.warn('🚫 [Music URL] Free trial only (VIP song)');
            vipDetected = true;
            throw new Error('VIP song with trial only');
          }
          
          if (fee !== 0 && fee !== 8) {
            console.warn('🚫 [Music URL] VIP song detected, fee:', fee);
            vipDetected = true;
            throw new Error('VIP song');
          }
          
          // 检查URL（放在VIP检查之后）
          if (!songData.url || songData.url.trim() === '') {
            console.error('❌ [Music URL] URL is null/empty - may be unavailable due to region or copyright');
            // 即使fee显示免费，但没有URL就视为不可用（版权/地区限制）
            unavailableDetected = true;
            throw new Error('No playback URL available (copyright/region restricted)');
          }
          
          console.log('✅ [Music URL] Success with:', apiServer, 'level:', level, 'fee:', fee);
          return c.json({ success: true, data: songData });
          
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`⚠️ [Music URL] v1 failed with ${apiServer} (${level}):`, errMsg);
          lastError = err;
          if (errMsg.includes('VIP') || errMsg.includes('trial')) {
            vipDetected = true;
            break; // VIP歌曲不需要继续尝试
          }
          if (errMsg.includes('copyright') || errMsg.includes('region')) {
            unavailableDetected = true;
            // 版权/地区限制可能在某些服务器上有，继续尝试
          }
          continue;
        }
      }
    }
    
    // 如果v1接口全部失败，尝试使用旧版 /song/url 接口作为后备
    if (!vipDetected) {
      console.log('⚠️ [Music URL] v1 interfaces all failed, trying legacy /song/url');
      // 只尝试前3个最可靠的服务器，节省时间
      const legacyServers = apiServers.slice(0, 3);
      for (const apiServer of legacyServers) {
        try {
          const timestamp = Date.now();
          const urlApi = `${apiServer}/song/url?id=${id}&br=128000&timestamp=${timestamp}`;
          console.log('📡 [Music URL] Trying legacy:', urlApi);
          
          const response = await fetch(urlApi, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(6000)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📦 [Music URL] Legacy response:', JSON.stringify(data, null, 2));
          
          if (data.code !== 200) {
            throw new Error(`API code ${data.code}`);
          }
          
          const songData = data.data?.[0];
          console.log('🎵 [Music URL] Legacy songData:', JSON.stringify(songData, null, 2));
          
          if (!songData) {
            console.error('❌ [Music URL] Legacy no songData');
            throw new Error('No song data');
          }
          
          // Check VIP status in legacy response first
          const fee = songData.fee || 0;
          if (songData.freeTrialInfo || (fee !== 0 && fee !== 8)) {
            console.warn('🚫 [Music URL] VIP detected in legacy response');
            vipDetected = true;
            throw new Error('VIP song');
          }
          
          // Then check URL
          if (!songData.url || songData.url.trim() === '') {
            console.error('❌ [Music URL] Legacy no valid URL - not VIP but unavailable');
            unavailableDetected = true;
            throw new Error('No playback URL available (copyright/region restricted)');
          }
          
          console.log('✅ [Music URL] Legacy API success:', apiServer);
          return c.json({ success: true, data: songData });
          
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`⚠️ [Music URL] Legacy failed with ${apiServer}:`, errMsg);
          lastError = err;
          if (errMsg.includes('VIP') || errMsg.includes('trial')) {
            vipDetected = true;
            break; // VIP歌曲不需要继续尝试
          }
          if (errMsg.includes('copyright') || errMsg.includes('region')) {
            unavailableDetected = true;
            // 继续尝试其他服务器
          }
          continue;
        }
      }
    }
    
    // 所有服务器都失败了
    console.error("❌ [Music URL] All API servers failed for song:", id);
    console.error("❌ [Music URL] Last error:", lastError);
    console.error("❌ [Music URL] VIP detected:", vipDetected);
    console.error("❌ [Music URL] Unavailable detected:", unavailableDetected);
    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    
    // 根据错误类��返回更友好的提示
    let userMessage = '该歌曲暂无播放链接';
    let isVip = false;
    let isUnavailable = false;
    
    if (vipDetected || errorMessage.includes('VIP') || errorMessage.includes('trial')) {
      userMessage = '该歌曲为VIP歌曲，无法播放';
      isVip = true;
    } else if (unavailableDetected || errorMessage.includes('region') || errorMessage.includes('copyright')) {
      userMessage = '该歌曲版权或地区限制暂无播放链接';
      isUnavailable = true;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
      userMessage = '音乐服务器响应超时，请稍后重试';
    } else {
      userMessage = '该歌曲暂无可用的播放链接';
      isUnavailable = true;
    }
    
    return c.json({
      success: false, 
      error: userMessage,
      isVip: isVip, // 明确标记是否为VIP
      isUnavailable: isUnavailable, // 明确标记是否因版权/地区限制不可用
      details: errorMessage // 添加详细错误信息用于调试
    }, 503);
    
  } catch (error) {
    console.error("❌ [Music URL] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Wallet API - Get balance
app.post("/make-server-ae7aa30b/wallet/balance", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ success: false, error: "缺少用户ID" }, 400);
    }

    const key = `wallet_balance:${userId}`;
    const balance = await kv.get(key);
    
    console.log(`💰 [钱包] 查询余额: 用户${userId}, 余额${balance || 0}`);
    return c.json({ success: true, balance: balance || 0 });
  } catch (error) {
    console.error("获取余额失败:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Wallet API - Recharge
app.post("/make-server-ae7aa30b/wallet/recharge", async (c) => {
  try {
    const { userId, amount } = await c.req.json();
    
    if (!userId || !amount || amount <= 0) {
      return c.json({ success: false, error: "无效的参数" }, 400);
    }

    if (amount > 50000) {
      return c.json({ success: false, error: "单次充值金额不能超过50000元" }, 400);
    }

    const key = `wallet_balance:${userId}`;
    const currentBalance = await kv.get(key) || 0;
    const newBalance = currentBalance + amount;
    
    console.log(`💰 [钱包] 充值前: 用户${userId}, 当前余额${currentBalance}, 充值金额${amount}`);
    await kv.set(key, newBalance);
    console.log(`✅ [钱包] 充值成功: 用户${userId}, 新余额${newBalance}`);
    
    // 验证是否成功写入
    const verifyBalance = await kv.get(key);
    console.log(`🔍 [钱包] 充值后验证: 用户${userId}, 读取到的余额${verifyBalance}`);
    
    return c.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("❌ [钱包] 充值失败:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Wallet API - Transfer (发送转账，扣除余额)
app.post("/make-server-ae7aa30b/wallet/transfer", async (c) => {
  try {
    const { userId, amount } = await c.req.json();
    
    if (!userId || !amount || amount <= 0) {
      return c.json({ success: false, error: "无效的参数" }, 400);
    }

    const key = `wallet_balance:${userId}`;
    const currentBalance = await kv.get(key) || 0;
    
    console.log(`💰 [钱包] 转账/红包扣款: 用户${userId}, 当前余额${currentBalance}, 需要扣款${amount}`);
    
    if (currentBalance < amount) {
      console.log(`❌ [钱包] 余额不足: 用户${userId}, 余额${currentBalance} < 需要${amount}`);
      return c.json({ success: false, error: "余额不足" }, 400);
    }
    
    const newBalance = currentBalance - amount;
    await kv.set(key, newBalance);
    
    console.log(`✅ [钱包] 扣款成功: 用户${userId}, 扣除${amount}, 新余额${newBalance}`);
    return c.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("❌ [钱包] 转账失败:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Wallet API - Receive Transfer (领取转账，增加余额)
app.post("/make-server-ae7aa30b/wallet/receive", async (c) => {
  try {
    const { userId, amount } = await c.req.json();
    
    if (!userId || !amount || amount <= 0) {
      return c.json({ success: false, error: "无效的参数" }, 400);
    }

    const key = `wallet_balance:${userId}`;
    const currentBalance = await kv.get(key) || 0;
    const newBalance = currentBalance + amount;
    
    await kv.set(key, newBalance);
    
    console.log(`✅ 领取转账成功: 用户${userId}, 领取${amount}, 新余额${newBalance}`);
    return c.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("领取转账失败:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 获取角色好感度和心理状态
app.post("/make-server-ae7aa30b/ai/affection", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return c.json({ success: false, error: "未授权" }, 401);
    }

    const requestBody = await c.req.json();
    
    const { 
      contactId, 
      chatHistory, 
      apiKey, 
      apiType, 
      modelId, 
      baseUrl,
      contactName,
      userProfile,
      silent = false  // 接收静默模式标志
    } = requestBody;
    
    // 只在非静默模式下打印详细日志
    if (!silent) {
      console.log('💖 [Affection] === 开始处理好感度请求 ===');
      console.log('💖 [Affection] Auth header exists:', !!authHeader);
      console.log('💖 [Affection] User authenticated:', !!user, user?.id);
      console.log('💖 [Affection] Request body keys:', Object.keys(requestBody));
      console.log('💖 [Affection] Request details:', {
        contactId,
        contactName,
        apiType,
        modelId,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        hasBaseUrl: !!baseUrl,
        baseUrl: baseUrl || 'none',
        chatHistoryLength: chatHistory?.length || 0,
        hasUserProfile: !!userProfile
      });
    }
    
    if (!contactId || !apiKey || !apiType) {
      if (!silent) {
        console.error('❌ [Affection] 缺少必填字段:', { 
          hasContactId: !!contactId,
          hasApiKey: !!apiKey, 
          hasApiType: !!apiType 
        });
      }
      return c.json({ success: false, error: "缺少必填字段" }, 400);
    }

    if (!silent) {
      console.log('💖 [Affection] 获取角色好感度:', contactName, 'API类型:', apiType);
    }

    // 构建系统提示词
    const systemPrompt = `你是一个情感分析系统，需要分析虚拟角色"${contactName}"对用户的好感度和当前心理状态。

用户信息：
- 昵称：${userProfile?.nickname || '用户'}
- 性别：${userProfile?.gender || '未知'}
- 个性签名：${userProfile?.signature || '无'}

根据最近的聊天记录，分析这个角色：
1. **好感度**（0-100）：对用户的喜爱程度
2. **情绪**：当前的主要情绪（如：开心、难过、生气、害羞、兴奋、平静等）
3. **心声**：角色内心对用户的真实想法（50字以内，要符合角色性格，口语化、情绪化）

请返回JSON格式：
{
  "affection": 数字(0-100),
  "emotion": "情绪描述",
  "innerThought": "内心想法"
}

注意：
- 好感度会随着聊天内容变化（暖心话题+5到10，冷淡或冒犯-5到10）
- 情绪要生动具体，不要泛泛而谈
- 心声要真实反映角色性格，可以有小心思、小情绪`;

    // 准备聊天历史
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加最近的聊天记录（最多20条）
    if (chatHistory && chatHistory.length > 0) {
      const recentChats = chatHistory.slice(-20);
      const chatSummary = recentChats.map((msg: any) => {
        const sender = msg.senderId === 'me' ? '用户' : contactName;
        return `${sender}: ${msg.content}`;
      }).join('\n');
      
      messages.push({
        role: 'user',
        content: `最近的聊天记录：\n${chatSummary}\n\n请分析${contactName}对用户的好感度和心理状态。`
      });
    } else {
      messages.push({
        role: 'user',
        content: `还没有聊天记录，请给出${contactName}对用户的初始好感度（60左右）和初始情绪状态。`
      });
    }

    // 调用不同的AI API
    let responseText = '';
    
    switch (apiType) {
      case 'openai':
      case 'deepseek':
      case 'custom': {
        let apiUrl = baseUrl || 'https://api.openai.com/v1';
        if (apiType === 'deepseek' && !baseUrl) {
          apiUrl = 'https://api.deepseek.com/v1';
        }
        
        // 对于custom API，尝试多个可能的endpoint路径
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
            ]
          : ['/v1/chat/completions'];
        
        const cleanBaseUrl = apiUrl.replace(/\/$/, '');
        let lastError = null;
        let success = false;
        
        if (!silent) {
          console.log(`🔍 [Affection] API类型: ${apiType}`);
          console.log(`🔍 [Affection] 原始baseUrl: ${baseUrl || '(使用默认)'}`);
          console.log(`🔍 [Affection] 清理后baseUrl: ${cleanBaseUrl}`);
          console.log(`🔍 [Affection] 将尝试 ${possiblePaths.length} 个可能的路径`);
        }
        
        for (const path of possiblePaths) {
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
            if (!silent) {
              console.log(`🌐 [Affection] 尝试路径: ${fullUrl}`);
            }
            
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
                    userFriendlyMsg = '⚠️ API服务器提示：模型配置错误。建议：1) 检查模型名称是否正确（删除特殊前缀） 2) 联系API服务商配置该模型';
                  }
                }
                errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
              } catch (e) {
                errorDetail = errorText.substring(0, 200);
              }
              
              if (!silent) {
                console.error(`❌ [Affection] 路径 ${path} 失败 (${response.status}):`, {
                  error: errorDetail.substring(0, 200),
                  userFriendlyMsg
                });
              }
              
              // 对于custom API，继续尝试下一个路径
              if (apiType === 'custom' && path !== possiblePaths[possiblePaths.length - 1]) {
                if (!silent) {
                  console.log(`⚠️ [Affection] 继续尝试下一个路径...`);
                }
                const errorMsg = userFriendlyMsg || errorDetail;
                lastError = new Error(`API调用失败 (${response.status}): ${errorMsg}`);
                continue;
              }
              
              const finalMsg = userFriendlyMsg || errorDetail;
              throw new Error(`API调用失败 (${response.status}): ${finalMsg}`);
            }

            const data = await response.json();
            responseText = data.choices?.[0]?.message?.content || '';
            
            // 检测备用响应格式
            if (!responseText || responseText.trim() === '') {
              if (data.response) {
                responseText = data.response;
                if (!silent) console.log('✅ [Affection] 检测到备用格式: response字段');
              } else if (data.text) {
                responseText = data.text;
                if (!silent) console.log('✅ [Affection] 检测到备用格式: text字段');
              } else if (data.content) {
                responseText = data.content;
                if (!silent) console.log('✅ [Affection] 检测到备用格式: content字段');
              } else if (data.message) {
                responseText = typeof data.message === 'string' ? data.message : data.message.content;
                if (!silent) console.log('✅ [Affection] 检测到备用格式: message字段');
              } else if (data.output) {
                responseText = data.output;
                if (!silent) console.log('✅ [Affection] 检测到备用格式: output字段');
              } else if (apiType === 'custom' && path !== possiblePaths[possiblePaths.length - 1]) {
                if (!silent) console.log('⚠️ [Affection] 无法识别响应格式，尝试下一个路径');
                lastError = new Error('API返回的数据格式错误');
                continue;
              }
            }
            
            if (!silent) {
              console.log(`✅ [Affection] 成功！使用路径: ${path}`);
              console.log(`✅ [Affection] 响应预览: ${responseText.substring(0, 100)}...`);
            }
            success = true;
            break;
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            if (!silent) {
              console.error(`❌ [Affection] 路径 ${path} 错误:`, errMsg.substring(0, 200));
            }
            lastError = err;
            
            // 对于custom API，继续尝试下一个路径
            if (apiType === 'custom' && path !== possiblePaths[possiblePaths.length - 1]) {
              if (!silent) {
                console.log(`⚠️ [Affection] 继续尝试下一个路径...`);
              }
              continue;
            }
            
            throw err;
          }
        }
        
        if (!success && lastError) {
          throw lastError;
        }
        
        break;
      }

      case 'claude': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: modelId || 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.filter(m => m.role !== 'system')
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (!silent) {
            console.error(`❌ Claude API错误 (${response.status}):`, errorText);
          }
          throw new Error(`Claude API调用失败 (${response.status}): ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        responseText = data.content[0]?.text || '';
        break;
      }

      case 'gemini': {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-pro'}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map(m => ({
                role: m.role === 'system' ? 'user' : m.role,
                parts: [{ text: m.content }]
              })),
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (!silent) {
            console.error(`❌ Gemini API错误 (${response.status}):`, errorText);
          }
          throw new Error(`Gemini API调用失败 (${response.status}): ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        responseText = data.candidates[0]?.content?.parts[0]?.text || '';
        break;
      }

      default:
        throw new Error(`不支持的API类型: ${apiType}`);
    }

    // 解析响应
    // 清理可能的markdown代码块格式
    let cleanedText = responseText.trim();
    
    // 移除markdown代码块标记（```json 或 ``` 开头和结尾）
    if (cleanedText.startsWith('```')) {
      // 找到第一个换行符，去掉```json或```这一行
      const firstNewline = cleanedText.indexOf('\n');
      if (firstNewline !== -1) {
        cleanedText = cleanedText.substring(firstNewline + 1);
      }
      // 去掉结尾的```
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();
    }
    
    if (!silent) {
      console.log('🧹 清理后的响应文本:', cleanedText.substring(0, 200));
    }
    
    const result = JSON.parse(cleanedText);
    
    if (!silent) {
      console.log('💖 好感度分析结果:', result);
    }

    return c.json({ 
      success: true, 
      data: {
        affection: result.affection || 60,
        emotion: result.emotion || '平静',
        innerThought: result.innerThought || '...'
      }
    });

  } catch (error) {
    // 安全地访问 silent 变量，避免 ReferenceError
    try {
      if (!silent) {
        console.error("获取好感度失败:", error);
      }
    } catch {
      // silent 未定义，默认打印日志
      console.error("获取好感度失败:", error);
    }
    return c.json({ success: false, error: String(error) }, 500);
  }
});

console.log('✅ [Server] All routes registered successfully');
console.log('🎯 [Server] Server is ready to handle requests');

// 添加全局错误处理器
globalThis.addEventListener('error', (event) => {
  console.error('🔴 [Global Error Handler] Uncaught error:', event.error);
  console.error('🔴 [Global Error Handler] Error message:', event.message);
  console.error('🔴 [Global Error Handler] Error stack:', event.error?.stack);
});

globalThis.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 [Global Promise Rejection] Unhandled promise rejection:', event.reason);
  console.error('🔴 [Global Promise Rejection] Promise:', event.promise);
});

console.log('🚀 [Server] Starting Deno.serve...');

try {
  Deno.serve(app.fetch);
  console.log('✅ [Server] Deno.serve started successfully');
} catch (error) {
  console.error('❌ [Server] Failed to start Deno.serve:', error);
  throw error;
}