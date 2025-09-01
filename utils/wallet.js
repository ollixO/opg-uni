// TP钱包服务模块 - 基于uni-app原生插件
class TPWalletService {
  constructor() {
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    this.plugin = null;
  }

  // 检测TP钱包插件是否可用
  async detectTPWallet() {
    try {
      // 使用uni-app插件API检测TP钱包
      const result = await this.callPlugin('detectWallet');
      return result && result.available;
    } catch (error) {
      console.error('检测TP钱包失败:', error);
      return false;
    }
  }

  // 连接TP钱包
  async connectWallet() {
    try {
      // 调用TP钱包插件进行连接
      const result = await this.callPlugin('connectWallet');
      
      if (result && result.success) {
        this.isConnected = true;
        this.account = result.account;
        this.chainId = result.chainId;
        
        return {
          success: true,
          account: this.account,
          chainId: this.chainId
        };
      } else {
        throw new Error(result?.error || '连接失败');
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 断开钱包连接
  disconnectWallet() {
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    
    // 调用插件断开连接
    this.callPlugin('disconnectWallet').catch(console.error);
  }

  // 获取账户余额
  async getBalance(address = null) {
    try {
      if (!this.isConnected) {
        throw new Error('钱包未连接');
      }

      const targetAddress = address || this.account;
      const result = await this.callPlugin('getBalance', { address: targetAddress });
      
      if (result && result.success) {
        return {
          success: true,
          balance: result.balance,
          address: targetAddress
        };
      } else {
        throw new Error(result?.error || '获取余额失败');
      }
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
      if (!this.isConnected) {
        throw new Error('钱包未连接');
      }

      const result = await this.callPlugin('sendTransaction', {
        toAddress,
        amount,
        fromAddress: this.account
      });

      if (result && result.success) {
        return {
          success: true,
          txId: result.txId,
          result: result
        };
      } else {
        throw new Error(result?.error || '发送交易失败');
      }
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
      if (!this.isConnected) {
        throw new Error('钱包未连接');
      }

      const targetAddress = address || this.account;
      const result = await this.callPlugin('getTransactionHistory', {
        address: targetAddress,
        limit
      });

      if (result && result.success) {
        return {
          success: true,
          transactions: result.transactions || []
        };
      } else {
        throw new Error(result?.error || '获取交易历史失败');
      }
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
      if (!this.isConnected) {
        throw new Error('钱包未连接');
      }

      const result = await this.callPlugin('signMessage', { message });
      
      if (result && result.success) {
        return {
          success: true,
          signature: result.signature,
          message: message
        };
      } else {
        throw new Error(result?.error || '签名消息失败');
      }
    } catch (error) {
      console.error('签名消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取网络状态
  getNetworkInfo() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId
    };
  }

  // 调用TP钱包插件的统一方法
  async callPlugin(method, params = {}) {
    return new Promise((resolve, reject) => {
      // 使用uni-app的插件调用方式
      uni.requireNativePlugin('TPWallet').callMethod({
        method,
        params,
        success: (res) => {
          resolve(res);
        },
        fail: (err) => {
          reject(new Error(err.message || '插件调用失败'));
        }
      });
    });
  }

  // 降级方案：模拟钱包功能（用于开发测试）
  async mockWalletConnection() {
    console.warn('使用模拟钱包模式，仅用于开发测试');
    
    // 模拟连接成功
    this.isConnected = true;
    this.account = 'T' + '1'.repeat(33); // 模拟TRON地址
    this.chainId = 1; // 主网
    
    return {
      success: true,
      account: this.account,
      chainId: this.chainId
    };
  }

  // 模拟Optimism网络连接
  async mockOptimismConnection() {
    console.warn('使用模拟Optimism网络模式，仅用于开发测试');
    
    this.isConnected = true;
    this.account = '0x' + '1'.repeat(40); // 模拟以太坊地址格式
    this.chainId = 10; // Optimism网络
    
    return {
      success: true,
      account: this.account,
      chainId: this.chainId
    };
  }

  // 模拟获取余额
  async mockGetBalance() {
    if (!this.isConnected) return { success: false, error: '钱包未连接' };
    
    // 返回模拟余额
    const mockBalance = Math.random() * 1000;
    return {
      success: true,
      balance: mockBalance.toFixed(6),
      address: this.account
    };
  }

  // 模拟发送交易
  async mockSendTransaction(toAddress, amount) {
    if (!this.isConnected) return { success: false, error: '钱包未连接' };
    
    // 模拟交易成功
    const mockTxId = 'tx_' + Math.random().toString(36).substr(2, 9);
    return {
      success: true,
      txId: mockTxId,
      result: { txid: mockTxId }
    };
  }
}

// 创建全局实例
const walletService = new TPWalletService();

export default walletService; 