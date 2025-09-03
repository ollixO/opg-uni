# 跨域问题解决方案

## 问题描述
当前请求 `https://opg.easyenjoy.world/wanlshop/user/register` 时遇到跨域问题。

## 解决方案

### 方案1: 服务器端配置CORS（推荐）
在服务器端添加CORS头，允许跨域请求：

```javascript
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
```

### 方案2: 使用代理服务器（开发环境）
在 `manifest.json` 中配置代理：

```json
{
  "h5": {
    "devServer": {
      "proxy": {
        "/wanlshop": {
          "target": "https://opg.easyenjoy.world",
          "changeOrigin": true,
          "secure": true
        }
      }
    }
  }
}
```

### 方案3: 使用JSONP（仅限GET请求）
如果服务器支持JSONP，可以修改请求方式：

```javascript
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
```

### 方案4: 使用中间代理服务
创建一个中间代理服务，转发请求：

```javascript
// 代理服务器示例
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use('/api', createProxyMiddleware({
  target: 'https://opg.easyenjoy.world',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));
```

## 当前状态
- ✅ 已添加跨域错误检测
- ✅ 已添加详细的错误提示
- ✅ 已添加请求日志
- ✅ 已创建跨域配置文档

## 建议
1. **联系后端开发者**：请求在服务器端配置CORS头
2. **使用代理服务器**：在开发环境使用代理转发请求
3. **检查网络环境**：确保网络连接正常

## 测试方法
1. 点击"测试API连接"按钮
2. 查看控制台日志
3. 根据错误信息选择对应的解决方案
