// TP钱包服务模块
import { getUSDTContractConfig, getUSDTContractByChainId } from '../config/contracts.js';

class TPWalletH5Service {
  constructor() {
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    this.provider = null;
    this.isH5 = typeof window !== 'undefined';
  }

  // 验证地址是否有效（支持多种网络）
  isValidAddress(address) {
    if (!address || typeof address !== 'string') {
      console.log('地址验证失败：地址为空或不是字符串', address);
      return false;
    }
    
    const trimmedAddress = address.trim();
    console.log('验证地址:', trimmedAddress, '长度:', trimmedAddress.length);
    
    // TRON地址：34个字符的base58字符串，以T开头
    if (trimmedAddress.length === 34 && trimmedAddress.startsWith('T')) {
      console.log('验证为TRON地址');
      return true;
    }
    
    // TRON hex地址：42个字符，以41开头
    if (trimmedAddress.length === 42 && trimmedAddress.startsWith('41')) {
      console.log('验证为TRON hex地址');
      return true;
    }
    
    // BSC/ETH地址：42个字符，以0x开头
    if (trimmedAddress.length === 42 && trimmedAddress.startsWith('0x')) {
      console.log('验证为ETH/BSC地址');
      return true;
    }
    
    console.log('地址验证失败：不匹配任何已知格式');
    return false;
  }

  // 提取有效的地址字符
  extractAddress(addressInput) {
    console.log('开始提取地址，输入:', addressInput, '类型:', typeof addressInput);
    
    if (!addressInput) {
      console.log('地址输入为空');
      return null;
    }
    
    // 如果是字符串，验证后返回
    if (typeof addressInput === 'string') {
      const trimmed = addressInput.trim();
      console.log('字符串地址，trim后:', trimmed);
      // 检查是否是有效的地址
      if (this.isValidAddress(trimmed)) {
        console.log('字符串地址验证通过');
        return trimmed;
      }
      console.log('字符串地址验证失败');
      return null;
    }
    
    // 如果是对象，尝试提取地址
    if (typeof addressInput === 'object') {
      // 尝试从tronWeb地址对象中提取
      if (addressInput.base58 && typeof addressInput.base58 === 'string') {
        const addr = addressInput.base58.trim();
        if (this.isValidAddress(addr)) {
          return addr;
        }
      }
      if (addressInput.hex && typeof addressInput.hex === 'string') {
        const addr = addressInput.hex.trim();
        if (this.isValidAddress(addr)) {
          return addr;
        }
      }
      
      // 检查是否是Vue的reactive对象
      if (addressInput.value && typeof addressInput.value === 'string') {
        const addr = addressInput.value.trim();
        if (this.isValidAddress(addr)) {
          return addr;
        }
      }
      
      // 如果有toString方法且不是默认的Object toString
      if (addressInput.toString && typeof addressInput.toString === 'function') {
        try {
          const str = addressInput.toString();
          if (str && str !== '[object Object]' && str.length > 10) {
            const addr = str.trim();
            if (this.isValidAddress(addr)) {
              return addr;
            }
          }
        } catch (e) {
          console.warn('toString方法调用失败:', e);
        }
      }
      
      // 尝试直接从对象属性中查找可能的地址
      const possibleAddressKeys = ['address', 'addr', 'account', 'publicKey'];
      for (const key of possibleAddressKeys) {
        if (addressInput[key] && typeof addressInput[key] === 'string') {
          const addr = addressInput[key].trim();
          if (this.isValidAddress(addr)) {
            return addr;
          }
        }
      }
    }
    
    console.warn('无法从输入中提取有效地址:', addressInput);
    return null;
  }

  async detectTPWallet() {
    if (!this.isH5) return false;
    try {
      // 检查桌面端TP钱包
      if (window.tronWeb || window.tronLink) return true;
      if (window.tronLink && window.tronLink.ready) return true;
      
      // 检查移动端TokenPocket浏览器
      if (window.ethereum && window.ethereum.isTokenPocket) return true;
      if (window.TronLink && window.TronLink.isTokenPocket) return true;
      
      // 检查移动端TokenPocket的特定标识
      if (window.TronLink && window.TronLink.isTokenPocket === true) return true;
      if (window.tronWeb && window.tronWeb.isTokenPocket === true) return true;
      
      // 检查User-Agent
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('tokenpocket') || userAgent.includes('tp')) return true;
      
      // 检查是否在TokenPocket环境中
      if (window.location.href.includes('tokenpocket') || 
          window.location.href.includes('tp') ||
          document.referrer.includes('tokenpocket') ||
          document.referrer.includes('tp')) return true;
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // 检测网络类型
  detectNetwork(provider) {
    // 检查是否是移动端TokenPocket
    if (provider.isTokenPocket) {
      console.log('检测到移动端TokenPocket，尝试获取网络信息...');
      
      // 移动端TokenPocket可能使用ethereum对象
      if (provider.networkVersion) {
        const networkVersion = provider.networkVersion.toString();
        if (networkVersion === '56') return 'BSC';
        if (networkVersion === '10') return 'OPTIMISM';
        if (networkVersion === '1') return 'ETH'; // 优先识别为ETH
        return UNKNOWN_;
      }
      
      // 检查chainId
      if (provider.chainId) {
        const chainId = provider.chainId.toString();
        if (chainId === '56' || chainId === '0x38') return 'BSC';
        if (chainId === '10' || chainId === '0xA') return 'OPTIMISM';
        if (chainId === '1' || chainId === '0x1') return 'ETH'; // 优先识别为ETH
        return UNKNOWN_;
      }
      
      return 'TOKENPOCKET_MOBILE';
    }
    
    if (provider.networkVersion) {
      return provider.networkVersion;
    }
    
    // 检查是否是BSC网络
    if (provider.chainId) {
      const chainId = provider.chainId.toString();
      if (chainId === '56' || chainId === '0x38') {
        return 'BSC';
      } else if (chainId === '10' || chainId === '0xA') {
        return 'OPTIMISM';
      } else if (chainId === '1' || chainId === '0x1') {
        return 'ETH'; // 优先识别为ETH
      }
    }
    
    // 检查是否是TRON网络
    if (provider.fullNode && provider.fullNode.host && provider.fullNode.host.includes('trx')) {
      return 'TRON';
    }
    
    return 'UNKNOWN';
  }

  async connectWallet() {
    if (!this.isH5) throw new Error('当前环境不支持H5钱包连接');
    
    try {
      let provider = null;
      
      // 优先检查移动端TokenPocket
      if (window.ethereum && window.ethereum.isTokenPocket) {
        provider = window.ethereum;
        console.log('检测到移动端TokenPocket (ethereum)');
      } else if (window.TronLink && window.TronLink.isTokenPocket) {
        provider = window.TronLink;
        console.log('检测到移动端TokenPocket (TronLink)');
      } else if (window.tronLink && window.tronLink.ready) {
        provider = window.tronLink;
        console.log('检测到桌面端TP钱包 (tronLink)');
      } else if (window.tronWeb) {
        provider = window.tronWeb;
        console.log('检测到桌面端TP钱包 (tronWeb)');
      } else {
        throw new Error('未检测到TP钱包');
      }

      console.log('开始连接钱包，provider:', provider);
      
      // 检测网络类型
      const networkType = this.detectNetwork(provider);
      console.log('检测到的网络类型:', networkType);
      
      // 首先尝试激活钱包
      if (provider.enable) {
        try {
          console.log('尝试调用enable方法激活钱包...');
          await provider.enable();
          console.log('enable方法调用成功');
        } catch (error) {
          console.warn('enable方法失败:', error);
        }
      }
      
      // 等待一下让钱包初始化
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let finalAddress = null;
      
      // 方法1：尝试request方法获取账户
      if (provider.request) {
        try {
          console.log('尝试使用request方法...');
          
          // 根据网络类型选择不同的请求方法
          let result;
          if (networkType === 'BSC' || networkType === 'ETH' || networkType === 'TOKENPOCKET_MOBILE') {
            // 移动端TokenPocket通常使用ethereum标准
            result = await provider.request({ method: 'eth_requestAccounts' });
          } else {
            result = await provider.request({ method: 'tron_requestAccounts' });
          }
          
          console.log('request方法返回:', result);
          if (result && Array.isArray(result) && result.length > 0) {
            finalAddress = this.extractAddress(result[0]);
            if (finalAddress) {
              console.log('从request方法获取到地址:', finalAddress);
            }
          }
        } catch (error) {
          console.warn('request方法失败:', error);
        }
      }
      
      // 方法2：尝试getAccounts方法
      if (!finalAddress && provider.getAccounts) {
        try {
          console.log('尝试使用getAccounts方法...');
          const result = await provider.getAccounts();
          console.log('getAccounts方法返回:', result);
          if (result && Array.isArray(result) && result.length > 0) {
            finalAddress = this.extractAddress(result[0]);
            if (finalAddress) {
              console.log('从getAccounts方法获取到地址:', finalAddress);
            }
          }
        } catch (error) {
          console.warn('getAccounts方法失败:', error);
        }
      }
      
      // 方法3：检查defaultAddress
      if (!finalAddress && provider.defaultAddress) {
        console.log('检查defaultAddress:', provider.defaultAddress);
        const defaultAddr = provider.defaultAddress;
        
        // 尝试多种地址格式
        if (defaultAddr.base58 && defaultAddr.base58 !== false && typeof defaultAddr.base58 === 'string') {
          finalAddress = defaultAddr.base58;
          console.log('从defaultAddress.base58获取到地址:', finalAddress);
        } else if (defaultAddr.hex && defaultAddr.hex !== false && typeof defaultAddr.hex === 'string') {
          finalAddress = defaultAddr.hex;
          console.log('从defaultAddress.hex获取到地址:', finalAddress);
        } else if (defaultAddr.toString && typeof defaultAddr.toString === 'function') {
          try {
            const addrStr = defaultAddr.toString();
            // 检查toString返回的是否是有效地址，而不是[object Object]
            if (addrStr && typeof addrStr === 'string' && addrStr.length > 10 && addrStr !== '[object Object]') {
              finalAddress = addrStr;
              console.log('从defaultAddress.toString获取到地址:', finalAddress);
            } else {
              console.log('defaultAddress.toString返回无效值:', addrStr);
            }
          } catch (e) {
            console.warn('defaultAddress.toString调用失败:', e);
          }
        }
      }
      
      // 方法4：检查address属性
      if (!finalAddress && provider.address) {
        console.log('检查address属性:', provider.address);
        const addr = provider.address;
        
        if (typeof addr === 'string' && addr.length > 10) {
          finalAddress = addr;
          console.log('从address字符串获取到地址:', finalAddress);
        } else if (typeof addr === 'object' && addr) {
          if (addr.base58 && addr.base58 !== false) {
            finalAddress = addr.base58;
            console.log('从address.base58获取到地址:', finalAddress);
          } else if (addr.hex && addr.hex !== false) {
            finalAddress = addr.hex;
            console.log('从address.hex获取到地址:', finalAddress);
          } else if (addr.toString && typeof addr.toString === 'function') {
            try {
              const addrStr = addr.toString();
              if (addrStr && typeof addrStr === 'string' && addrStr.length > 10 && addrStr !== '[object Object]') {
                finalAddress = addrStr;
                console.log('从address.toString获取到地址:', finalAddress);
              } else {
                console.log('address.toString返回无效值:', addrStr);
              }
            } catch (e) {
              console.warn('address.toString调用失败:', e);
            }
          }
        }
      }
      
      console.log('最终获取到的地址:', finalAddress);
      
      // 最终验证地址是否有效
      if (finalAddress && this.isValidAddress(finalAddress)) {
        this.account = finalAddress;
        this.isConnected = true;
        this.provider = provider;
        
        // 根据网络类型设置chainId
        if (networkType === 'BSC') {
          this.chainId = 56;
        } else if (networkType === 'OPTIMISM') {
          this.chainId = 10;
        } else if (networkType === 'ETH') {
          this.chainId = 1;
        } else if (networkType === 'TRON') {
          this.chainId = 1;
        } else {
          // 如果网络类型未知，通过地址格式判断
          if (finalAddress && finalAddress.startsWith('0x')) {
            this.chainId = 1; // ETH格式地址，设置为ETH网络
            console.log('通过地址格式判断为ETH网络');
          } else if (finalAddress && finalAddress.startsWith('T')) {
            this.chainId = 1; // TRON格式地址，设置为TRON网络
            console.log('通过地址格式判断为TRON网络');
          } else {
            this.chainId = 1; // 默认
          }
        }
        
        console.log('连接成功，最终地址:', this.account, '网络类型:', networkType, 'chainId:', this.chainId);
        return { success: true, account: this.account, chainId: this.chainId };
      } else {
        // 根据检测到的情况提供更具体的指导
        let errorMsg = '无法获取账户地址';
        let suggestions = '';
        
        if (networkType === 'BSC' || networkType === 'ETH') {
          if (provider.defaultAddress && typeof provider.defaultAddress === 'object' && 
              provider.defaultAddress.base58 === false && provider.defaultAddress.hex === false) {
            errorMsg = 'BSC钱包检测到但账户未激活';
            suggestions = '请在钱包中：\n1. 确保已创建或导入账户\n2. 确保账户已解锁\n3. 在钱包中打开"允许DApp连接"\n4. 重新刷新页面并连接\n5. 检查钱包是否已登录\n6. 确保选择了BSC网络';
          } else if (!finalAddress) {
            errorMsg = 'BSC钱包连接被拒绝或超时';
            suggestions = '请确保：\n1. 钱包已安装并运行\n2. 在弹出的连接请求中点击"允许"\n3. 如未出现弹窗，请刷新页面重试\n4. 检查钱包是否已登录\n5. 确保选择了BSC网络';
          } else {
            errorMsg = '无法识别的BSC账户数据格式';
            suggestions = '请尝试：\n1. 更新钱包到最新版本\n2. 重启钱包应用\n3. 清除浏览器缓存后重试\n4. 检查钱包是否已登录\n5. 确保选择了BSC网络';
          }
        } else {
          if (provider.defaultAddress && typeof provider.defaultAddress === 'object' && 
              provider.defaultAddress.base58 === false && provider.defaultAddress.hex === false) {
            errorMsg = 'TP钱包检测到但账户未激活';
            suggestions = '请在TP钱包中：\n1. 确保已创建或导入账户\n2. 确保账户已解锁\n3. 在钱包中打开"允许DApp连接"\n4. 重新刷新页面并连接\n5. 检查TP钱包是否已登录\n6. 在TP钱包中点击"账户"或"钱包"选项\n7. 选择或创建TRON账户\n8. 确保账户已解锁（输入密码）\n9. 检查是否选择了TRON主网';
          } else if (!finalAddress) {
            errorMsg = 'TP钱包连接被拒绝或超时';
            suggestions = '请确保：\n1. TP钱包已安装并运行\n2. 在弹出的连接请求中点击"允许"\n3. 如未出现弹窗，请刷新页面重试\n4. 检查TP钱包是否已登录\n5. 在TP钱包中确保选择了TRON网络';
          } else {
            errorMsg = '无法识别的TP账户数据格式';
            suggestions = '请尝试：\n1. 更新TP钱包到最新版本\n2. 重启TP钱包应用\n3. 清除浏览器缓存后重试\n4. 检查TP钱包是否已登录\n5. 在TP钱包中重新选择TRON账户';
          }
        }
        
        return { 
          success: false, 
          error: errorMsg,
          suggestions: suggestions,
          code: 'ADDRESS_EXTRACTION_FAILED'
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  disconnectWallet() {
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    this.provider = null;
  }

  getNetworkInfo() {
    // 验证连接状态的有效性
    const isValidConnection = this.isConnected && this.account && this.provider;
    
    // 如果显示已连接但provider无效，尝试修复状态
    if (this.isConnected && !this.provider) {
      console.warn('检测到无效连接状态，重置连接状态');
      this.isConnected = false;
      this.account = null;
      this.chainId = null;
    }
    
    const networkInfo = { 
      isConnected: this.isConnected, 
      account: this.account, 
      chainId: this.chainId 
    };
    
    console.log('H5钱包服务网络信息:', networkInfo, '有效连接:', isValidConnection);
    return networkInfo;
  }

  // 获取当前网络类型
  getCurrentNetworkType() {
    if (this.chainId === 10) return 'OPTIMISM';
    if (this.chainId === 56) return 'BSC';
    if (this.chainId === 1) {
      // 通过地址格式进一步判断ETH还是TRON
      if (this.account && this.account.startsWith('0x')) {
        return 'ETH';
      } else if (this.account && this.account.startsWith('T')) {
        return 'TRON';
      }
      return 'ETH'; // 默认返回ETH
    }
    return 'UNKNOWN';
  }

  // 添加获取余额方法
  async getBalance(address = null) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      let targetAddress = address || this.account;
      
      // 如果地址是对象，尝试提取
      targetAddress = this.extractAddress(targetAddress);
      
      // 验证地址格式
      if (!targetAddress || typeof targetAddress !== 'string' || targetAddress.length < 10) {
        console.warn('地址无效:', targetAddress, '原始输入:', address || this.account);
        return {
          success: false,
          error: '地址无效',
          balance: 0,
          address: targetAddress
        };
      }

      let balance = 0;
      
      try {
        // 获取当前网络类型
        const networkType = this.getCurrentNetworkType();
        console.log('当前网络类型:', networkType, 'chainId:', this.chainId);
        
        if (networkType === 'OPTIMISM' || networkType === 'ETH') {
          // Optimism网络或ETH网络
          if (this.provider.request) {
            try {
              console.log('开始查询ETH余额，地址:', targetAddress);
              const result = await this.provider.request({
                method: 'eth_getBalance',
                params: [targetAddress, 'latest']
              });
              console.log('ETH余额查询原始结果:', result, '类型:', typeof result);
              
              // 更安全的余额解析
              let weiBalance;
              if (typeof result === 'string') {
                if (result.startsWith('0x')) {
                  weiBalance = BigInt(result);
                } else {
                  weiBalance = BigInt('0x' + result);
                }
              } else if (typeof result === 'number') {
                weiBalance = BigInt(result);
              } else {
                weiBalance = BigInt(result.toString());
              }
              
              // 转换为ETH (1 ETH = 10^18 wei)
              balance = Number(weiBalance) / Math.pow(10, 18);
              console.log('ETH余额解析详情:', {
                rawResult: result,
                weiBalance: weiBalance.toString(),
                ethBalance: balance,
                address: targetAddress
              });
            } catch (ethError) {
              console.warn('ETH余额查询失败，尝试其他方法:', ethError);
              // 降级到其他方法
              if (this.provider.eth && this.provider.eth.getBalance) {
                try {
                  balance = await this.provider.eth.getBalance(targetAddress);
                  balance = Number(balance) / Math.pow(10, 18);
                  console.log('降级方法获取ETH余额成功:', balance);
                } catch (fallbackError) {
                  console.warn('降级方法也失败:', fallbackError);
                }
              }
            }
          }
        } else if (networkType === 'BSC') {
          // BSC网络
          if (this.provider.request) {
            try {
              console.log('开始查询BSC余额，地址:', targetAddress);
              const result = await this.provider.request({
                method: 'eth_getBalance',
                params: [targetAddress, 'latest']
              });
              console.log('BSC余额查询原始结果:', result, '类型:', typeof result);
              
              // 更安全的余额解析
              let weiBalance;
              if (typeof result === 'string') {
                if (result.startsWith('0x')) {
                  weiBalance = BigInt(result);
                } else {
                  weiBalance = BigInt('0x' + result);
                }
              } else if (typeof result === 'number') {
                weiBalance = BigInt(result);
              } else {
                weiBalance = BigInt(result.toString());
              }
              
              // 转换为BNB (1 BNB = 10^18 wei)
              balance = Number(weiBalance) / Math.pow(10, 18);
              console.log('BSC余额解析详情:', {
                rawResult: result,
                weiBalance: weiBalance.toString(),
                bnbBalance: balance,
                address: targetAddress
              });
            } catch (bscError) {
              console.warn('BSC余额查询失败:', bscError);
            }
          }
        } else if (networkType === 'TRON') {
          // TRON网络
          if (this.provider.trx && this.provider.trx.getBalance) {
            balance = await this.provider.trx.getBalance(targetAddress);
            balance = balance / 1000000; // 转换为TRX单位
            console.log('TRON余额查询成功:', balance);
          } else if (this.provider.request) {
            const result = await this.provider.request({
              method: 'tron_getBalance',
              params: [targetAddress]
            });
            balance = result / 1000000;
            console.log('TRON余额查询成功:', balance);
          }
        } else {
          console.warn('未知网络类型，尝试通用方法');
          // 尝试通用方法
          if (this.provider.request) {
            try {
              console.log('开始通用余额查询，地址:', targetAddress);
              const result = await this.provider.request({
                method: 'eth_getBalance',
                params: [targetAddress, 'latest']
              });
              console.log('通用余额查询原始结果:', result, '类型:', typeof result);
              
              // 更安全的余额解析
              let weiBalance;
              if (typeof result === 'string') {
                if (result.startsWith('0x')) {
                  weiBalance = BigInt(result);
                } else {
                  weiBalance = BigInt('0x' + result);
                }
              } else if (typeof result === 'number') {
                weiBalance = BigInt(result);
              } else {
                weiBalance = BigInt(result.toString());
              }
              
              balance = Number(weiBalance) / Math.pow(10, 18);
              console.log('通用余额解析详情:', {
                rawResult: result,
                weiBalance: weiBalance.toString(),
                balance: balance,
                address: targetAddress
              });
            } catch (error) {
              console.warn('通用余额查询失败:', error);
            }
          }
        }
      } catch (balanceError) {
        console.warn('获取余额失败:', balanceError);
        balance = 0;
      }
      
      return {
        success: true,
        balance: balance,
        address: targetAddress
      };
    } catch (error) {
      console.error('获取余额失败:', error);
      return {
        success: false,
        error: error.message,
        balance: 0,
        address: address || this.account
      };
    }
  }

  // 发送交易方法
  async sendTransaction(toAddress, amount) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      // 提取目标地址
      const targetAddress = this.extractAddress(toAddress);
      if (!targetAddress) {
        throw new Error('无效的目标地址');
      }

      console.log('准备发送交易:', {
        to: targetAddress,
        amount: amount,
        from: this.account,
        network: this.chainId
      });

      let result;
      
      // 根据网络类型选择不同的发送方法
      if (this.chainId === 56) {
        // BSC网络
        result = await this.sendBSCTransaction(targetAddress, amount);
      } else if (this.chainId === 1) {
        // ETH网络
        result = await this.sendETHTransaction(targetAddress, amount);
      } else if (this.chainId === 10) {
        // Optimism网络（使用ETH方法）
        result = await this.sendETHTransaction(targetAddress, amount);
      } else {
        // 默认使用通用方法
        result = await this.sendGenericTransaction(targetAddress, amount);
      }

      return result;
    } catch (error) {
      console.error('发送交易失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 发送BSC交易
  async sendBSCTransaction(toAddress, amount) {
    try {
      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'eth_sendTransaction',
          params: [{
            to: toAddress,
            value: '0x' + (amount * Math.pow(10, 18)).toString(16),
            from: this.account
          }]
        });
        
        return {
          success: true,
          txHash: result,
          message: 'BSC交易已提交'
        };
      } else {
        throw new Error('当前钱包不支持BSC交易');
      }
    } catch (error) {
      console.error('BSC交易发送失败:', error);
      return {
        success: false,
        error: (error && error.message) ? error.message : 'BSC交易发送失败'
      };
    }
  }

  // 发送ETH交易
  async sendETHTransaction(toAddress, amount) {
    try {
      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'eth_sendTransaction',
          params: [{
            to: toAddress,
            value: '0x' + (amount * Math.pow(10, 18)).toString(16),
            from: this.account
          }]
        });
        
        return {
          success: true,
          txHash: result,
          message: 'ETH交易已提交'
        };
      } else {
        throw new Error('当前钱包不支持ETH交易');
      }
    } catch (error) {
      console.error('ETH交易发送失败:', error);
      return {
        success: false,
        error: (error && error.message) ? error.message : 'ETH交易发送失败'
      };
    }
  }

  // 发送通用交易
  async sendGenericTransaction(toAddress, amount) {
    try {
      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'eth_sendTransaction',
          params: [{
            to: toAddress,
            value: '0x' + (amount * Math.pow(10, 18)).toString(16),
            from: this.account
          }]
        });
        
        return {
          success: true,
          txHash: result,
          message: '交易已提交'
        };
      } else {
        throw new Error('当前钱包不支持交易发送');
      }
    } catch (error) {
      console.error('通用交易发送失败:', error);
      return {
        success: false,
        error: (error && error.message) ? error.message : '交易发送失败'
      };
    }
  }

  // 发送USDT代币转账
  async sendUSDTTransaction(toAddress, amount) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      console.log('开始USDT代币转账:', {
        to: toAddress,
        amount: amount,
        from: this.account,
        chainId: this.chainId
      });

      // 验证目标地址
      const targetAddress = this.extractAddress(toAddress);
      if (!targetAddress) {
        throw new Error('无效的目标地址: ' + toAddress);
      }

      // 根据当前网络获取USDT合约地址和精度
      let usdtContractAddress;
      let decimals;
      
      // 首先尝试从配置文件获取
      try {
        const usdtConfig = getUSDTContractByChainId(this.chainId);
        if (usdtConfig && usdtConfig.address) {
          usdtContractAddress = usdtConfig.address;
          decimals = usdtConfig.decimals;
          console.log('从配置文件获取USDT合约 (chainId:', this.chainId, '):', usdtConfig);
        } else {
          throw new Error('配置文件中未找到USDT合约配置 (chainId: ' + this.chainId + ')');
        }
      } catch (configError) {
        console.warn('从配置文件获取USDT合约失败，使用硬编码配置:', configError);
        
        // 降级到硬编码配置
        if (this.chainId === 1) {
          // 以太坊主网
          usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
          decimals = 6;
        } else if (this.chainId === 56) {
          // BSC网络
          usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955';
          decimals = 18;
        } else if (this.chainId === 5) {
          // 以太坊测试网
          usdtContractAddress = '0x509Ee0d083DdF8AC028f2a56731412edD63223B9';
          decimals = 6;
        } else if (this.chainId === 10) {
          // Optimism网络
          usdtContractAddress = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58';
          decimals = 6;
        } else if (this.chainId === 137) {
          // Polygon网络
          usdtContractAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
          decimals = 6;
        } else if (this.chainId === 42161) {
          // Arbitrum网络
          usdtContractAddress = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
          decimals = 6;
        } else {
          throw new Error('当前网络 (chainId: ' + this.chainId + ') 不支持USDT');
        }
      }

      // 验证金额
      if (!amount || amount <= 0) {
        throw new Error('转账金额必须大于0');
      }

      // 验证USDT合约是否可访问
      console.log('验证USDT合约可访问性...');
      const contractValidation = await this.validateUSDTContract(usdtContractAddress);
      if (!contractValidation.valid) {
        throw new Error('USDT合约不可访问: ' + contractValidation.error);
      }
      console.log('USDT合约验证通过');

      // ERC-20 transfer方法的函数签名
      const transferMethodSignature = '0xa9059cbb';
      
      // 构造transfer方法的参数 (transfer(address to, uint256 amount))
      // 确保地址格式正确（移除0x前缀，补齐到64位）
      const toAddressPadded = targetAddress.slice(2).toLowerCase().padStart(64, '0');
      
      // 计算代币数量（考虑精度）
      const amountWei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
      const amountPadded = amountWei.toString(16).padStart(64, '0');
      
      const data = transferMethodSignature + toAddressPadded + amountPadded;
      
      console.log('USDT转账参数详情:', {
        to: usdtContractAddress,
        data: data,
        from: this.account,
        amount: amount,
        amountWei: amountWei.toString(),
        decimals: decimals,
        toAddressPadded: toAddressPadded,
        amountPadded: amountPadded,
        methodSignature: transferMethodSignature
      });

      if (this.provider.request) {
        // 先尝试估算gas
        let gasEstimate;
        try {
          console.log('开始估算gas...');
          gasEstimate = await this.provider.request({
            method: 'eth_estimateGas',
            params: [{
              to: usdtContractAddress,
              data: data,
              from: this.account
            }]
          });
          console.log('Gas估算成功:', gasEstimate);
        } catch (gasError) {
          console.warn('Gas估算失败，使用默认值:', gasError);
          // 使用默认gas限制
          gasEstimate = '0x' + (100000).toString(16);
        }

        // 发送交易
        const result = await this.provider.request({
          method: 'eth_sendTransaction',
          params: [{
            to: usdtContractAddress,
            data: data,
            from: this.account,
            gas: gasEstimate
          }]
        });
        
        console.log('USDT转账结果:', result);
        
        return {
          success: true,
          txHash: result,
          message: 'USDT转账已提交',
          contractAddress: usdtContractAddress,
          amount: amount,
          decimals: decimals,
          gasEstimate: gasEstimate
        };
      } else {
        throw new Error('当前钱包不支持代币转账');
      }
    } catch (error) {
      console.error('USDT转账失败:', error);
      
      // 提供更详细的错误信息
      let errorMessage = 'USDT转账失败';
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = '余额不足，请检查USDT余额和ETH/BNB余额（用于支付gas费）';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Gas估算失败，请检查网络连接和合约地址';
        } else if (error.message.includes('revert')) {
          errorMessage = '交易被拒绝，可能是合约调用失败或余额不足';
        } else if (error.message.includes('invalid address')) {
          errorMessage = '无效的合约地址或目标地址';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      };
    }
  }

  // 验证USDT合约是否可访问
  async validateUSDTContract(contractAddress) {
    try {
      if (!this.provider || !this.provider.request) {
        return { valid: false, error: 'Provider不可用' };
      }

      // 尝试调用合约的name()方法
      const nameMethodSignature = '0x06fdde03'; // name()
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: nameMethodSignature
        }, 'latest']
      });

      console.log('USDT合约验证结果:', result);
      return { valid: true, result: result };
    } catch (error) {
      console.warn('USDT合约验证失败:', error);
      return { valid: false, error: error.message };
    }
  }

  // 获取USDT余额
  async getUSDTBalance(address = null) {
    try {
      console.log('=== USDT余额查询开始 ===');
      console.log('钱包连接状态:', this.isConnected);
      console.log('Provider状态:', !!this.provider);
      console.log('当前账户:', this.account);
      console.log('当前chainId:', this.chainId);
      console.log('传入地址参数:', address);
      
      if (!this.isConnected || !this.provider) {
        console.error('钱包未连接或provider无效');
        throw new Error('钱包未连接');
      }

      let targetAddress = address || this.account;
      console.log('目标地址(提取前):', targetAddress);
      
      targetAddress = this.extractAddress(targetAddress);
      console.log('目标地址(提取后):', targetAddress);
      
      if (!targetAddress || typeof targetAddress !== 'string' || targetAddress.length < 10) {
        console.warn('地址无效:', targetAddress, '原始输入:', address || this.account);
        return {
          success: false,
          error: '1地址无效',
          balance: 0,
          debug: {
            originalAddress: address || this.account,
            extractedAddress: targetAddress,
            isConnected: this.isConnected,
            hasProvider: !!this.provider,
            chainId: this.chainId
          }
        };
      }

      // 根据当前网络获取USDT合约地址
      let usdtContractAddress;
      let decimals;
      
      console.log('检测网络类型，chainId:', this.chainId);
      
      // 首先尝试从配置文件获取
      try {
        const usdtConfig = getUSDTContractByChainId(this.chainId);
        if (usdtConfig && usdtConfig.address) {
          usdtContractAddress = usdtConfig.address;
          decimals = usdtConfig.decimals;
          console.log('从配置文件获取USDT合约 (chainId:', this.chainId, '):', usdtConfig);
        } else {
          throw new Error('配置文件中未找到USDT合约配置 (chainId: ' + this.chainId + ')');
        }
      } catch (configError) {
        console.warn('从配置文件获取USDT合约失败，使用硬编码配置:', configError);
        
        // 降级到硬编码配置
        if (this.chainId === 1) {
          // 以太坊主网
          usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
          decimals = 6;
          console.log('使用ETH主网USDT合约');
        } else if (this.chainId === 56) {
          // BSC网络
          usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955';
          decimals = 18;
          console.log('使用BSC网络USDT合约');
        } else if (this.chainId === 5) {
          // 以太坊Goerli测试网
          usdtContractAddress = '0x509Ee0d083DdF8AC028f2a56731412edD63223B9';
          decimals = 6;
          console.log('使用ETH Goerli测试网USDT合约');
        } else if (this.chainId === 10) {
          // Optimism网络
          usdtContractAddress = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58';
          decimals = 6;
          console.log('使用Optimism网络USDT合约');
        } else if (this.chainId === 137) {
          // Polygon网络
          usdtContractAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
          decimals = 6;
          console.log('使用Polygon网络USDT合约');
        } else if (this.chainId === 42161) {
          // Arbitrum网络
          usdtContractAddress = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
          decimals = 6;
          console.log('使用Arbitrum网络USDT合约');
        } else {
          // 不支持的网络
          console.error('不支持的网络类型，chainId:', this.chainId);
          return {
            success: false,
            error: '当前网络 (chainId: ' + this.chainId + ') 不支持USDT',
            balance: 0,
            debug: {
              chainId: this.chainId,
              supportedNetworks: [1, 5, 10, 56, 137, 42161],
              currentNetwork: this.getCurrentNetworkType(),
              suggestion: '请切换到支持的网络：ETH主网(1)、BSC(56)、Optimism(10)、Polygon(137)、Arbitrum(42161)'
            }
          };
        }
      }
      
      // ERC-20 balanceOf方法的函数签名
      const balanceOfMethodSignature = '0x70a08231';
      
      // 构造balanceOf方法的参数 (balanceOf(address owner))
      const addressPadded = targetAddress.slice(2).padStart(64, '0');
      const data = balanceOfMethodSignature + addressPadded;
      
      console.log('查询USDT余额参数:', {
        to: usdtContractAddress,
        data: data,
        from: targetAddress,
        chainId: this.chainId,
        decimals: decimals,
        methodSignature: balanceOfMethodSignature
      });

      if (this.provider.request) {
        try {
          const result = await this.provider.request({
            method: 'eth_call',
            params: [{
              to: usdtContractAddress,
              data: data
            }, 'latest']
          });
          
          console.log('USDT余额查询原始结果:', result, '类型:', typeof result);
          
          // 解析结果
          let usdtBalance = 0;
          if (result && result !== '0x' && result !== '0x0') {
            const balanceHex = result.startsWith('0x') ? result : '0x' + result;
            const balanceWei = BigInt(balanceHex);
            usdtBalance = Number(balanceWei) / Math.pow(10, decimals);
            console.log('USDT余额解析成功:', {
              rawResult: result,
              balanceHex: balanceHex,
              balanceWei: balanceWei.toString(),
              decimals: decimals,
              finalBalance: usdtBalance
            });
          } else {
            console.log('USDT余额为0或查询失败，原始结果:', result);
          }
          
          console.log('=== USDT余额查询完成 ===');
          
          return {
            success: true,
            balance: usdtBalance,
            address: targetAddress,
            symbol: 'USDT',
            chainId: this.chainId,
            contractAddress: usdtContractAddress,
            debug: {
              rawResult: result,
              decimals: decimals,
              networkType: this.getCurrentNetworkType()
            }
          };
        } catch (callError) {
          console.error('eth_call调用失败:', callError);
          throw new Error('USDT余额查询调用失败: ' + callError.message);
        }
      } else {
        console.error('Provider不支持request方法');
        throw new Error('当前钱包不支持代币余额查询');
      }
    } catch (error) {
      console.error('=== USDT余额查询异常 ===');
      console.error('错误详情:', error);
      console.error('错误堆栈:', error.stack);
      return {
        success: false,
        error: (error && error.message) ? error.message : '获取USDT余额失败',
        balance: 0,
        debug: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          isConnected: this.isConnected,
          hasProvider: !!this.provider,
          chainId: this.chainId,
          account: this.account,
          networkType: this.getCurrentNetworkType()
        }
      };
    }
  }

  // 签名消息
  async signMessage(message) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'personal_sign',
          params: [message, this.account]
        });
        
        return {
          success: true,
          signature: result
        };
      } else {
        throw new Error('当前钱包不支持消息签名');
      }
    } catch (error) {
      console.error('签名消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 切换网络
  async switchNetwork(chainId) {
    try {
      if (!this.provider) {
        throw new Error('钱包未连接');
      }

      console.log('尝试切换网络到chainId:', chainId);

      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + chainId.toString(16) }]
        });
        
        this.chainId = chainId;
        console.log('网络切换成功，新的chainId:', chainId);
        return {
          success: true,
          chainId: chainId
        };
      } else {
        throw new Error('当前钱包不支持网络切换');
      }
    } catch (error) {
      console.error('切换网络失败:', error);
      
      // 如果是网络未添加的错误，尝试添加网络
      if (error.code === 4902) {
        console.log('网络未添加，尝试添加网络...');
        return await this.addNetwork(chainId);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 添加网络
  async addNetwork(chainId) {
    try {
      const networkConfigs = {
        1: {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          blockExplorerUrls: ['https://etherscan.io']
        },
        56: {
          chainId: '0x38',
          chainName: 'BSC Mainnet',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com']
        },
        10: {
          chainId: '0xA',
          chainName: 'Optimism',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.optimism.io'],
          blockExplorerUrls: ['https://optimistic.etherscan.io']
        },
        137: {
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com']
        },
        42161: {
          chainId: '0xA4B1',
          chainName: 'Arbitrum One',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://arb1.arbitrum.io/rpc'],
          blockExplorerUrls: ['https://arbiscan.io']
        }
      };

      const networkConfig = networkConfigs[chainId];
      if (!networkConfig) {
        throw new Error('不支持的网络配置');
      }

      const result = await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });

      this.chainId = chainId;
      console.log('网络添加成功，chainId:', chainId);
      return {
        success: true,
        chainId: chainId
      };
    } catch (error) {
      console.error('添加网络失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 添加代币到钱包
  async addToken(tokenAddress, tokenSymbol, tokenDecimals, tokenImage) {
    try {
      if (!this.provider) {
        throw new Error('钱包未连接');
      }

      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage
            }
          }
        });
        
        return {
          success: true,
          result: result
        };
      } else {
        throw new Error('当前钱包不支持添加代币');
      }
    } catch (error) {
      console.error('添加代币失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取代币余额
  async getTokenBalance(tokenAddress, accountAddress) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      const targetAddress = accountAddress || this.account;
      
      // ERC-20 balanceOf方法的函数签名
      const balanceOfMethodSignature = '0x70a08231';
      
      // 构造balanceOf方法的参数
      const addressPadded = targetAddress.slice(2).padStart(64, '0');
      const data = balanceOfMethodSignature + addressPadded;
      
      if (this.provider.request) {
        const result = await this.provider.request({
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: data
          }, 'latest']
        });
        
        // 解析结果
        let tokenBalance = 0;
        if (result && result !== '0x') {
          const balanceHex = result.startsWith('0x') ? result : '0x' + result;
          const balanceWei = BigInt(balanceHex);
          tokenBalance = Number(balanceWei) / Math.pow(10, 18); // 假设18位小数
        }
        
        return {
          success: true,
          balance: tokenBalance,
          address: targetAddress,
          tokenAddress: tokenAddress
        };
      } else {
        throw new Error('当前钱包不支持代币余额查询');
      }
    } catch (error) {
      console.error('获取代币余额失败:', error);
      return {
        success: false,
        error: error.message,
        balance: '0'
      };
    }
  }

  // 事件监听器
  onAccountsChanged(callback) {
    if (this.provider && this.provider.on) {
      this.provider.on('accountsChanged', callback);
    }
  }

  onChainChanged(callback) {
    if (this.provider && this.provider.on) {
      this.provider.on('chainChanged', callback);
    }
  }

  onConnect(callback) {
    if (this.provider && this.provider.on) {
      this.provider.on('connect', callback);
    }
  }

  onDisconnect(callback) {
    if (this.provider && this.provider.on) {
      this.provider.on('disconnect', callback);
    }
  }
}

const walletH5Service = new TPWalletH5Service();
export default walletH5Service;
