// 钱包管理器 - 根据环境自动选择实现
import walletService from './wallet.js';
import walletH5Service from './wallet-h5.js';

class WalletManager {
  constructor() {
    this.currentService = null;
    this.serviceType = null;
    this.init();
  }

  // 初始化钱包服务
  init() {
    // 检测运行环境
    if (this.isH5Environment()) {
      // H5环境，使用Web3方式
      this.currentService = walletH5Service;
      this.serviceType = 'H5';
      console.log('使用H5钱包服务');
    } else {
      // App环境，使用原生插件方式
      this.currentService = walletService;
      this.serviceType = 'Native';
      console.log('使用原生插件钱包服务');
    }
  }

  // 检测是否为H5环境
  isH5Environment() {
    // #ifdef H5
    return true;
    // #endif
    
    // #ifndef H5
    return false;
    // #endif
  }

  // 获取当前服务类型
  getServiceType() {
    return this.serviceType;
  }

  // 检测TP钱包是否可用
  async detectTPWallet() {
    try {
      return await this.currentService.detectTPWallet();
    } catch (error) {
      console.error('检测钱包失败:', error);
      return false;
    }
  }

  // 连接TP钱包
  async connectWallet() {
    try {
      const result = await this.currentService.connectWallet();
      
      // 如果原生插件连接失败，尝试降级到模拟模式
      if (!result.success && this.serviceType === 'Native') {
        console.warn('原生插件连接失败，尝试模拟模式');
        return await this.currentService.mockWalletConnection();
      }
      
      // 传递详细的错误信息
      if (!result.success) {
        console.warn(`钱包连接失败: ${result.error}`, result);
      }
      
      return result;
    } catch (error) {
      console.error('连接钱包失败:', error);
      
      // 提供更友好的错误信息
      let errorMessage = '连接钱包时发生未知错误';
      let suggestions = '请检查网络连接和钱包应用状态';
      
      if (error.message.includes('用户拒绝')) {
        errorMessage = '用户拒绝连接钱包';
        suggestions = '请在TP钱包弹窗中点击"允许"或"连接"';
      } else if (error.message.includes('未检测到')) {
        errorMessage = '未检测到TP钱包';
        suggestions = '请确保已安装TP钱包应用并刷新页面';
      } else if (error.message.includes('连接被拒绝')) {
        errorMessage = '连接被拒绝';
        suggestions = '请检查TP钱包权限设置';
      }
      
      return {
        success: false,
        error: errorMessage,
        suggestions: suggestions,
        code: 'CONNECTION_ERROR'
      };
    }
  }

  // 断开钱包连接
  disconnectWallet() {
    this.currentService.disconnectWallet();
  }

  // 获取账户余额
  async getBalance(address = null) {
    try {
      const result = await this.currentService.getBalance(address);
      
      // 如果原生插件获取余额失败，尝试模拟模式
      if (!result.success && this.serviceType === 'Native') {
        console.warn('原生插件获取余额失败，尝试模拟模式');
        return await this.currentService.mockGetBalance();
      }
      
      return result;
    } catch (error) {
      console.error('获取余额失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 发送TRX交易
  async sendTransaction(toAddress, amount) {
    try {
      const result = await this.currentService.sendTransaction(toAddress, amount);
      
      // 如果原生插件发送交易失败，尝试模拟模式
      return result;
    } catch (error) {
      console.error('发送交易失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取交易历史
  async getTransactionHistory(address = null, limit = 20) {
    try {
      return await this.currentService.getTransactionHistory(address, limit);
    } catch (error) {
      console.error('获取交易历史失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 签名消息
  async signMessage(message) {
    try {
      return await this.currentService.signMessage(message);
    } catch (error) {
      console.error('签名消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取网络状态
  async getNetworkInfo() {
    try {
      if (!this.currentService) {
        console.warn('钱包服务未初始化');
        return { isConnected: false, account: null, chainId: null };
      }
      
      const networkInfo = this.currentService.getNetworkInfo();
      console.log('钱包管理器获取网络信息:', networkInfo);
      
      // 如果服务显示已连接，进行连接验证
      if (networkInfo.isConnected && networkInfo.account) {
        console.log('钱包显示已连接，进行连接验证...');
        
        // 如果服务支持连接验证，调用验证方法
        if (this.currentService.validateConnection && typeof this.currentService.validateConnection === 'function') {
          try {
            const isValid = await this.currentService.validateConnection();
            if (!isValid) {
              console.log('连接验证失败，返回未连接状态');
              return { isConnected: false, account: null, chainId: null };
            }
          } catch (error) {
            console.warn('连接验证出错:', error);
          }
        }
        
        console.log('钱包连接验证成功，账户:', networkInfo.account);
      }
      
      return networkInfo;
    } catch (error) {
      console.error('获取网络信息失败:', error);
      return { isConnected: false, account: null, chainId: null };
    }
  }

  // 获取钱包连接状态
  get isConnected() {
    return this.currentService.isConnected;
  }

  // 获取账户信息
  get account() {
    return this.currentService.account;
  }

  // 获取网络ID
  get chainId() {
    return this.currentService.chainId;
  }

  // 切换服务类型（用于测试）
  switchService(type) {
    if (type === 'H5') {
      this.currentService = walletH5Service;
      this.serviceType = 'H5';
    } else if (type === 'Native') {
      this.currentService = walletService;
      this.serviceType = 'Native';
    }
    console.log(`切换到${type}钱包服务`);
  }

  // 获取服务状态信息
  getServiceInfo() {
    return {
      serviceType: this.serviceType,
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      environment: this.isH5Environment() ? 'H5' : 'App'
    };
  }

  // 获取支持的网络列表
  getSupportedNetworks() {
    return [
      { name: 'TRON主网', chainId: 1, symbol: 'TRX' },
      { name: 'Optimism网络', chainId: 10, symbol: 'ETH' },
      { name: 'BSC主网', chainId: 56, symbol: 'BNB' },
      { name: 'ETH主网', chainId: 1, symbol: 'ETH' }
    ];
  }

  // 测试余额查询（用于调试）
  async testBalanceQuery(address = null) {
    try {
      if (this.currentService && this.currentService.testBalanceQuery) {
        return await this.currentService.testBalanceQuery(address);
      } else {
        return { success: false, error: '当前服务不支持测试余额查询' };
      }
    } catch (error) {
      console.error('测试余额查询失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 检查钱包连接状态
  checkConnectionStatus() {
    try {
      if (!this.currentService) {
        return { isConnected: false, error: '钱包服务未初始化' };
      }

      const networkInfo = this.currentService.getNetworkInfo();
      const isConnected = this.currentService.isConnected;
      const account = this.currentService.account;
      const chainId = this.currentService.chainId;

      return {
        isConnected,
        account,
        chainId,
        networkInfo,
        serviceType: this.serviceType,
        environment: this.isH5Environment() ? 'H5' : 'App'
      };
    } catch (error) {
      console.error('检查连接状态失败:', error);
      return { isConnected: false, error: error.message };
    }
  }

  // 尝试恢复钱包连接
  async attemptReconnect() {
    try {
      console.log('钱包管理器尝试重连...');
      
      // 检查当前服务状态
      const status = this.checkConnectionStatus();
      if (status.isConnected) {
        console.log('钱包仍然连接，无需重连');
        return { success: true, message: '钱包已连接' };
      }

      // 尝试重新连接
      if (this.currentService && this.currentService.connectWallet) {
        console.log('调用钱包服务重连方法...');
        const result = await this.currentService.connectWallet();
        return result;
      } else {
        return { success: false, error: '当前服务不支持重连' };
      }
    } catch (error) {
      console.error('钱包重连失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 保存钱包状态
  saveWalletState() {
    try {
      const state = {
        isConnected: this.isConnected,
        account: this.account,
        chainId: this.chainId,
        serviceType: this.serviceType,
        timestamp: Date.now()
      };
      
      // 在H5环境中使用localStorage
      if (this.isH5Environment() && typeof window !== 'undefined') {
        localStorage.setItem('wallet_state', JSON.stringify(state));
      }
      
      return { success: true, state };
    } catch (error) {
      console.error('保存钱包状态失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 恢复钱包状态
  restoreWalletState() {
    try {
      if (this.isH5Environment() && typeof window !== 'undefined') {
        const savedState = localStorage.getItem('wallet_state');
        if (savedState) {
          const state = JSON.parse(savedState);
          
          // 检查状态是否过期（超过5分钟）
          const now = Date.now();
          const timeDiff = now - state.timestamp;
          if (timeDiff > 5 * 60 * 1000) {
            console.log('钱包状态已过期，清除');
            localStorage.removeItem('wallet_state');
            return { success: false, error: '状态已过期' };
          }
          
          return { success: true, state };
        }
      }
      
      return { success: false, error: '没有保存的状态' };
    } catch (error) {
      console.error('恢复钱包状态失败:', error);
      return { success: false, error: error.message };
    }
  }
}

// 创建全局实例
const walletManager = new WalletManager();

export default walletManager; 