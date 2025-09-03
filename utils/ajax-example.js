// Ajax请求使用示例
import ajax from './ajax.js';

// 示例：测试API连接
async function testApiConnection() {
  try {
    console.log('测试API连接...');
    const result = await ajax.get('/api/health');
    console.log('API连接测试结果:', result);
    
    uni.showToast({
      title: 'API连接正常',
      icon: 'success'
    });
    
    return result;
  } catch (error) {
    console.error('API连接测试失败:', error);
    uni.showToast({
      title: 'API连接失败',
      icon: 'none'
    });
    return null;
  }
}

export { testApiConnection };
