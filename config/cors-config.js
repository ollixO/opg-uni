// 跨域配置解决方案
export const corsConfig = {
  // 开发环境跨域代理配置
  development: {
    // 如果使用HBuilderX开发，可以在manifest.json中配置跨域
    // 或者使用代理服务器
    proxy: {
      '/api': {
        target: 'https://opg.easyenjoy.world',
        changeOrigin: true,
        secure: true
      }
    }
  },
  
  // 生产环境配置
  production: {
    // 生产环境需要服务器端配置CORS
    corsHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  }
};

// 跨域解决方案说明
export const corsSolutions = {
  // 方案1: 服务器端配置CORS（推荐）
  serverSide: {
    description: '在服务器端配置CORS头',
    example: `
      // Node.js Express示例
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    `
  },
  
  // 方案2: 使用代理服务器
  proxy: {
    description: '使用代理服务器转发请求',
    example: `
      // 在manifest.json中配置
      "h5": {
        "devServer": {
          "proxy": {
            "/api": {
              "target": "https://opg.easyenjoy.world",
              "changeOrigin": true,
              "secure": true
            }
          }
        }
      }
    `
  },
  
  // 方案3: 使用JSONP（仅限GET请求）
  jsonp: {
    description: '使用JSONP方式请求（仅限GET请求）',
    example: `
      // 在ajax工具中添加JSONP方法
      jsonp(url, callback) {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          const callbackName = 'jsonp_callback_' + Date.now();
          window[callbackName] = (data) => {
            resolve(data);
            document.head.removeChild(script);
            delete window[callbackName];
          };
          script.src = url + '?callback=' + callbackName;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    `
  }
};

// 检查当前环境
export function getCurrentEnvironment() {
  // #ifdef H5
  return 'development';
  // #endif
  
  // #ifdef APP-PLUS
  return 'production';
  // #endif
  
  // #ifdef MP
  return 'production';
  // #endif
  
  return 'development';
}

// 获取跨域配置
export function getCorsConfig() {
  const env = getCurrentEnvironment();
  return corsConfig[env];
}
