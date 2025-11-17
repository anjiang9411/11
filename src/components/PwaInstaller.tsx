import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 延迟显示安装提示，让用户先体验应用
      setTimeout(() => {
        const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
        if (!hasShownPrompt) {
          setShowInstallPrompt(true);
        }
      }, 10000); // 10秒后显示
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 监听应用安装成功
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      console.log('PWA 已成功安装！');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 注册 Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker 注册成功:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker 注册失败:', error);
        });
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // 显示安装提示
    await deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('用户接受安装');
    } else {
      console.log('用户拒绝安装');
    }

    // 清除 deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">
                  安装到主屏幕
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  像真正的 APP 一样使用，更快速、更方便！
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallClick}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                  >
                    立即安装
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>离线使用</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>快速启动</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>全屏体验</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
