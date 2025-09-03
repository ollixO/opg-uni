// Ajax请求工具类
class AjaxRequest {
  constructor() {
    // 根据环境设置不同的baseURL
    // #ifdef H5
    this.baseURL = ''; // H5环境使用相对路径，通过代理转发
    // #endif
    
    // #ifndef H5
    this.baseURL = 'https://opg.easyenjoy.world'; // 非H5环境使用完整URL
    // #endif
    
    this.timeout = 10000; // 默认超时时间10秒
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // 设置基础配置
  setConfig(config) {
    if (config.baseURL) this.baseURL = config.baseURL;
    if (config.timeout) this.timeout = config.timeout;
    if (config.headers) this.headers = { ...this.headers, ...config.headers };
  }

  // 请求拦截器
  requestInterceptor(config) {
    // 可以在这里添加token等认证信息
    const token = uni.getStorageSync('token');
    if (token) {
      config.header = config.header || {};
      config.header['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('请求拦截器:', config);
    return config;
  }

  // 响应拦截器
  responseInterceptor(response) {
    console.log('响应拦截器:', response);
    
    // 统一处理响应数据
    if (response.statusCode === 200) {
      return response.data;
    } else if (response.statusCode === 401) {
      // token过期，清除本地存储并跳转到登录页
      uni.removeStorageSync('token');
      uni.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none'
      });
      // 可以在这里添加跳转到登录页的逻辑
      throw new Error('登录已过期');
    } else {
      throw new Error(`请求失败: ${response.statusCode}`);
    }
  }

  // 错误处理
  errorHandler(error) {
    console.error('请求错误:', error);
    
    let errorMessage = '网络请求失败';
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接';
      } else if (error.errMsg.includes('fail')) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else if (error.errMsg.includes('CORS') || error.errMsg.includes('cross-origin')) {
        errorMessage = '跨域请求被阻止，请联系管理员';
      } else {
        errorMessage = error.errMsg;
      }
    }
    
    // 不自动显示toast，让调用方决定是否显示
    console.warn('请求失败:', errorMessage);
    
    return Promise.reject(error);
  }

  // 通用请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      // 处理URL
      const url = options.url.startsWith('http') ? options.url : `${this.baseURL}${options.url}`;
      
      // 构建请求配置
      const config = {
        url: url,
        method: options.method || 'GET',
        data: options.data || {},
        header: { ...this.headers, ...options.header },
        timeout: options.timeout || this.timeout,
        // 添加跨域处理选项
        withCredentials: false, // 不发送cookies
        success: (response) => {
          try {
            const result = this.responseInterceptor(response);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        fail: (error) => {
          this.errorHandler(error);
          reject(error);
        }
      };

      // 应用请求拦截器
      const finalConfig = this.requestInterceptor(config);
      
      console.log('发送请求:', finalConfig);
      
      // 发送请求
      uni.request(finalConfig);
    });
  }

  // GET请求
  get(url, params = {}, options = {}) {
    return this.request({
      url: url,
      method: 'GET',
      data: params,
      ...options
    });
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url: url,
      method: 'POST',
      data: data,
      ...options
    });
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url: url,
      method: 'PUT',
      data: data,
      ...options
    });
  }

  // DELETE请求
  delete(url, params = {}, options = {}) {
    return this.request({
      url: url,
      method: 'DELETE',
      data: params,
      ...options
    });
  }

  // 上传文件
  upload(url, filePath, formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token');
      const header = { ...this.headers };
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      uni.uploadFile({
        url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
        filePath: filePath,
        name: options.name || 'file',
        formData: formData,
        header: header,
        success: (response) => {
          try {
            const data = JSON.parse(response.data);
            resolve(data);
          } catch (error) {
            resolve(response.data);
          }
        },
        fail: (error) => {
          this.errorHandler(error);
          reject(error);
        }
      });
    });
  }

  // 下载文件
  download(url, options = {}) {
    return new Promise((resolve, reject) => {
      uni.downloadFile({
        url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
        success: (response) => {
          if (response.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`下载失败: ${response.statusCode}`));
          }
        },
        fail: (error) => {
          this.errorHandler(error);
          reject(error);
        }
      });
    });
  }
}

// 创建默认实例
const ajax = new AjaxRequest();

// 导出实例和类
export default ajax;
export { AjaxRequest };
