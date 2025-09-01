// TP钱包服务模块
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
    if (!address || typeof address !== 'string') return false;
    
    // TRON地址：34个字符的base58字符串，以T开头
    if (address.length === 34 && address.startsWith('T')) {
      return true;
    }
    
    // TRON hex地址：42个字符，以41开头
    if (address.length === 42 && address.startsWith('41')) {
      return true;
    }
    
    // BSC/ETH地址：42个字符，以0x开头
    if (address.length === 42 && address.startsWith('0x')) {
      return true;
    }
    
    return false;
  }

  // 提取有效的地址字符串
  extractAddress(addressInput) {
    if (!addressInput) return null;
    
    // 如果是字符串，验证后返回
    if (typeof addressInput === 'string') {
      const trimmed = addressInput.trim();
      // 检查是否是有效的TRON地址
      if (this.isValidAddress(trimmed)) {
        return trimmed;
      }
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
        return `UNKNOWN_${networkVersion}`;
      }
      
      // 检查chainId
      if (provider.chainId) {
        const chainId = provider.chainId.toString();
        if (chainId === '56' || chainId === '0x38') return 'BSC';
        if (chainId === '10' || chainId === '0xA') return 'OPTIMISM';
        if (chainId === '1' || chainId === '0x1') return 'ETH'; // 优先识别为ETH
        return `UNKNOWN_${chainId}`;
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

  // 专门处理TP钱包地址获取的方法
  async getTPWalletAddress(provider) {
    try {
      // 方法1：尝试request方法
      if (provider.request) {
        try {
          const result = await provider.request({ method: 'tron_requestAccounts' });
          if (result && Array.isArray(result) && result.length > 0) {
            const address = this.extractAddress(result[0]);
            if (address) return address;
          }
        } catch (error) {
          console.warn('tron_requestAccounts失败:', error);
        }
      }

      // 方法2：尝试getAccounts方法
      if (provider.getAccounts) {
        try {
          const result = await provider.getAccounts();
          if (result && Array.isArray(result) && result.length > 0) {
            const address = this.extractAddress(result[0]);
            if (address) return address;
          }
        } catch (error) {
          console.warn('getAccounts失败:', error);
        }
      }

      // 方法3：检查defaultAddress
      if (provider.defaultAddress) {
        const defaultAddr = provider.defaultAddress;
        if (defaultAddr.base58 && defaultAddr.base58 !== false && typeof defaultAddr.base58 === 'string') {
          return defaultAddr.base58;
        }
        if (defaultAddr.hex && defaultAddr.hex !== false && typeof defaultAddr.hex === 'string') {
          return defaultAddr.hex;
        }
        if (defaultAddr.toString && typeof defaultAddr.toString === 'function') {
          try {
            const addrStr = defaultAddr.toString();
            if (addrStr && typeof addrStr === 'string' && addrStr.length > 10) {
              return addrStr;
            }
          } catch (e) {
            console.warn('defaultAddress.toString失败:', e);
          }
        }
      }

      // 方法4：检查address属性
      if (provider.address) {
        const addr = provider.address;
        if (typeof addr === 'string' && addr.length > 10) {
          return addr;
        }
        if (typeof addr === 'object' && addr) {
          if (addr.base58 && addr.base58 !== false) {
            return addr.base58;
          }
          if (addr.hex && addr.hex !== false) {
            return addr.hex;
          }
          if (addr.toString && typeof addr.toString === 'function') {
            try {
              const addrStr = addr.toString();
              if (addrStr && typeof addrStr === 'string' && addrStr.length > 10) {
                return addrStr;
              }
            } catch (e) {
              console.warn('address.toString失败:', e);
            }
          }
        }
      }

      // 方法5：尝试enable方法
      if (provider.enable) {
        try {
          await provider.enable();
          // 重新检查地址
          if (provider.defaultAddress) {
            const enabledAddr = provider.defaultAddress;
            if (enabledAddr.base58 && enabledAddr.base58 !== false && typeof enabledAddr.base58 === 'string') {
              return enabledAddr.base58;
            }
            if (enabledAddr.hex && enabledAddr.hex !== false && typeof enabledAddr.hex === 'string') {
              return enabledAddr.hex;
            }
          }
        } catch (error) {
          console.warn('enable方法失败:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('获取TP钱包地址时出错:', error);
      return null;
    }
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
        // 检查是否在TokenPocket环境中但钱包对象未正确初始化
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('tokenpocket') || userAgent.includes('tp')) {
          console.log('检测到TokenPocket环境，但钱包对象未初始化');
          console.log('User-Agent:', navigator.userAgent);
          console.log('可用的全局对象:', Object.keys(window).filter(key => 
            key.toLowerCase().includes('tron') || 
            key.toLowerCase().includes('eth') || 
            key.toLowerCase().includes('tp')
          ));
          
          // 尝试等待钱包初始化
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // 重新检查
          if (window.ethereum && window.ethereum.isTokenPocket) {
            provider = window.ethereum;
            console.log('等待后检测到移动端TokenPocket (ethereum)');
          } else if (window.TronLink && window.TronLink.isTokenPocket) {
            provider = window.TronLink;
            console.log('等待后检测到移动端TokenPocket (TronLink)');
          } else if (window.tronLink && window.tronLink.ready) {
            provider = window.tronLink;
            console.log('等待后检测到桌面端TP钱包 (tronLink)');
          } else if (window.tronWeb) {
            provider = window.tronWeb;
            console.log('等待后检测到桌面端TP钱包 (tronWeb)');
          } else {
            throw new Error('未检测到TP钱包，请确保在TokenPocket浏览器中打开');
          }
        } else {
          throw new Error('未检测到TP钱包');
        }
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
      
              // 尝试TP钱包特有的初始化方法
        if (networkType === 'TRON') {
          // 尝试调用TP钱包的ready方法
          if (provider.ready && typeof provider.ready === 'function') {
            try {
              console.log('尝试调用TP钱包的ready方法...');
              await provider.ready();
              console.log('TP钱包ready方法调用成功');
            } catch (error) {
              console.warn('TP钱包ready方法失败:', error);
            }
          }
          
          // 尝试调用TP钱包的init方法
          if (provider.init && typeof provider.init === 'function') {
            try {
              console.log('尝试调用TP钱包的init方法...');
              await provider.init();
              console.log('TP钱包init方法调用成功');
            } catch (error) {
              console.warn('TP钱包init方法失败:', error);
            }
          }
          
          // 尝试调用TP钱包的initDefaultAddress方法
          if (provider.initDefaultAddress && typeof provider.initDefaultAddress === 'function') {
            try {
              console.log('尝试调用TP钱包的initDefaultAddress方法...');
              await provider.initDefaultAddress();
              console.log('TP钱包initDefaultAddress方法调用成功');
              
              // 等待一下让地址初始化完成
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 重新检查defaultAddress
              if (provider.defaultAddress) {
                console.log('initDefaultAddress后的defaultAddress:', provider.defaultAddress);
                const defaultAddr = provider.defaultAddress;
                if (defaultAddr.base58 && defaultAddr.base58 !== false && typeof defaultAddr.base58 === 'string') {
                  finalAddress = defaultAddr.base58;
                  console.log('initDefaultAddress后从defaultAddress.base58获取到地址:', finalAddress);
                } else if (defaultAddr.hex && defaultAddr.hex !== false && typeof defaultAddr.hex === 'string') {
                  finalAddress = defaultAddr.hex;
                  console.log('initDefaultAddress后从defaultAddress.hex获取到地址:', finalAddress);
                }
              }
            } catch (error) {
              console.warn('TP钱包initDefaultAddress方法失败:', error);
            }
          }
        }
        
        // 尝试移动端TokenPocket的初始化方法
        if (networkType === 'TOKENPOCKET_MOBILE') {
          console.log('尝试移动端TokenPocket的初始化...');
          
          // 移动端TokenPocket通常需要等待用户授权
          if (provider.request) {
            try {
              console.log('尝试请求移动端TokenPocket权限...');
              const accounts = await provider.request({ method: 'eth_requestAccounts' });
              console.log('移动端TokenPocket权限请求结果:', accounts);
              
              if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                finalAddress = this.extractAddress(accounts[0]);
                if (finalAddress) {
                  console.log('从移动端TokenPocket获取到地址:', finalAddress);
                }
              }
            } catch (error) {
              console.warn('移动端TokenPocket权限请求失败:', error);
            }
          }
          
          // 尝试获取已授权的账户
          if (!finalAddress && provider.request) {
            try {
              console.log('尝试获取已授权的账户...');
              const accounts = await provider.request({ method: 'eth_accounts' });
              console.log('已授权的账户:', accounts);
              
              if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                finalAddress = this.extractAddress(accounts[0]);
                if (finalAddress) {
                  console.log('从已授权账户获取到地址:', finalAddress);
                }
              }
            } catch (error) {
              console.warn('获取已授权账户失败:', error);
            }
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
      
      // 方法2.5：对于BSC/ETH网络，尝试eth_accounts方法
      if (!finalAddress && (networkType === 'BSC' || networkType === 'ETH') && provider.request) {
        try {
          console.log('尝试使用eth_accounts方法...');
          const result = await provider.request({ method: 'eth_accounts' });
          console.log('eth_accounts方法返回:', result);
          if (result && Array.isArray(result) && result.length > 0) {
            finalAddress = this.extractAddress(result[0]);
            if (finalAddress) {
              console.log('从eth_accounts方法获取到地址:', finalAddress);
            }
          }
        } catch (error) {
          console.warn('eth_accounts方法失败:', error);
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
        
        // 如果defaultAddress是对象但值为false，或者toString返回无效值，尝试强制获取
        if (!finalAddress && typeof defaultAddr === 'object' && 
            (defaultAddr.base58 === false || defaultAddr.hex === false || 
             (defaultAddr.toString && defaultAddr.toString() === '[object Object]'))) {
          console.log('defaultAddress值无效，尝试强制获取...');
          
          // 尝试调用钱包的其他方法
          if (provider.requestAccounts) {
            try {
              const manualAccounts = await provider.requestAccounts();
              console.log('手动获取的账户:', manualAccounts);
              if (manualAccounts && manualAccounts.length > 0) {
                finalAddress = this.extractAddress(manualAccounts[0]);
                if (finalAddress) {
                  console.log('从requestAccounts获取到地址:', finalAddress);
                }
              }
            } catch (e) {
              console.warn('requestAccounts失败:', e);
        }
      }
      
          // 尝试其他可能的方法
          if (!finalAddress) {
            // 检查是否有其他地址属性
            const possibleKeys = ['address', 'addr', 'account', 'publicKey', 'pubKey'];
            for (const key of possibleKeys) {
              if (defaultAddr[key] && typeof defaultAddr[key] === 'string' && defaultAddr[key].length > 10) {
                finalAddress = defaultAddr[key];
                console.log(`从defaultAddress.${key}获取到地址:`, finalAddress);
                break;
              }
            }
          }
          
          // 尝试调用TP钱包的特定方法
          if (!finalAddress && provider.getAddress) {
            try {
              console.log('尝试调用getAddress方法...');
              const addr = await provider.getAddress();
              console.log('getAddress返回:', addr);
              if (addr && typeof addr === 'string' && addr.length > 10) {
                finalAddress = addr;
                console.log('从getAddress获取到地址:', finalAddress);
              }
            } catch (e) {
              console.warn('getAddress失败:', e);
            }
          }
          
          // 尝试调用TP钱包的getAccount方法
          if (!finalAddress && provider.getAccount) {
            try {
              console.log('尝试调用getAccount方法...');
              const account = await provider.getAccount();
              console.log('getAccount返回:', account);
              if (account && account.address && typeof account.address === 'string' && account.address.length > 10) {
                finalAddress = account.address;
                console.log('从getAccount.address获取到地址:', finalAddress);
              }
            } catch (e) {
              console.warn('getAccount失败:', e);
            }
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
      
          // 如果toString返回无效值，尝试其他方法
          if (!finalAddress && addr.toString && addr.toString() === '[object Object]') {
            console.log('address.toString返回无效值，尝试其他方法...');
            
            // 尝试调用address对象的方法
            if (addr.getAddress && typeof addr.getAddress === 'function') {
              try {
                const directAddr = await addr.getAddress();
                console.log('address.getAddress返回:', directAddr);
                if (directAddr && typeof directAddr === 'string' && directAddr.length > 10) {
                  finalAddress = directAddr;
                  console.log('从address.getAddress获取到地址:', finalAddress);
                }
              } catch (e) {
                console.warn('address.getAddress失败:', e);
              }
            }
            
            // 尝试其他可能的属性
            const possibleKeys = ['address', 'addr', 'account', 'publicKey', 'pubKey'];
            for (const key of possibleKeys) {
              if (addr[key] && typeof addr[key] === 'string' && addr[key].length > 10) {
                finalAddress = addr[key];
                console.log(`从address.${key}获取到地址:`, finalAddress);
                break;
              }
            }
          }
        }
      }
      
      // 方法5：检查window.tronWeb
      if (!finalAddress && window.tronWeb) {
        console.log('检查window.tronWeb...');
        
        if (window.tronWeb.defaultAddress) {
          const webAddr = window.tronWeb.defaultAddress;
          console.log('tronWeb.defaultAddress:', webAddr);
          
          if (webAddr.base58 && webAddr.base58 !== false && typeof webAddr.base58 === 'string') {
            finalAddress = webAddr.base58;
            console.log('从tronWeb.defaultAddress.base58获取到地址:', finalAddress);
          } else if (webAddr.hex && webAddr.hex !== false && typeof webAddr.hex === 'string') {
            finalAddress = webAddr.hex;
            console.log('从tronWeb.defaultAddress.hex获取到地址:', finalAddress);
                      } else if (webAddr.toString && typeof webAddr.toString === 'function') {
              try {
                const addrStr = webAddr.toString();
                if (addrStr && typeof addrStr === 'string' && addrStr.length > 10 && addrStr !== '[object Object]') {
                  finalAddress = addrStr;
                  console.log('从tronWeb.defaultAddress.toString获取到地址:', finalAddress);
                } else {
                  console.log('tronWeb.defaultAddress.toString返回无效值:', addrStr);
                }
              } catch (e) {
                console.warn('tronWeb.defaultAddress.toString调用失败:', e);
              }
            }
        }
        
        if (!finalAddress && window.tronWeb.address) {
          const webAddr = window.tronWeb.address;
          console.log('tronWeb.address:', webAddr);
          
          if (typeof webAddr === 'string' && webAddr.length > 10) {
            finalAddress = webAddr;
            console.log('从tronWeb.address字符串获取到地址:', finalAddress);
          } else if (typeof webAddr === 'object' && webAddr) {
            if (webAddr.base58 && webAddr.base58 !== false) {
              finalAddress = webAddr.base58;
              console.log('从tronWeb.address.base58获取到地址:', finalAddress);
            } else if (webAddr.hex && webAddr.hex !== false) {
              finalAddress = webAddr.hex;
              console.log('从tronWeb.address.hex获取到地址:', finalAddress);
            }
          }
        }
      }
      
      // 方法6：最后尝试，等待更长时间并重新检查
      if (!finalAddress) {
        console.log('等待钱包完全初始化...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 重新尝试所有方法
        if (provider.defaultAddress) {
          const recheckAddr = provider.defaultAddress;
          if (recheckAddr.base58 && recheckAddr.base58 !== false && typeof recheckAddr.base58 === 'string') {
            finalAddress = recheckAddr.base58;
            console.log('重新检查后从defaultAddress.base58获取到地址:', finalAddress);
          } else if (recheckAddr.hex && recheckAddr.hex !== false && typeof recheckAddr.hex === 'string') {
            finalAddress = recheckAddr.hex;
            console.log('重新检查后从defaultAddress.hex获取到地址:', finalAddress);
          }
        }
      }
      
      // 方法7：尝试TP钱包特有的方法
      if (!finalAddress && networkType === 'TRON') {
        console.log('尝试TP钱包特有的方法...');
        
        // 首先检查provider对象中可用的方法
        console.log('provider对象中可用的方法:', Object.getOwnPropertyNames(provider).filter(name => typeof provider[name] === 'function'));
            
        // 尝试请求TP钱包权限
        try {
          console.log('尝试请求TP钱包权限...');
          if (provider.request) {
            // 尝试多种权限请求方法
            const methods = ['tron_requestAccounts', 'eth_requestAccounts', 'requestAccounts'];
            for (const method of methods) {
              try {
                console.log(`尝试调用${method}方法...`);
                const result = await provider.request({ method: method });
                console.log(`${method}返回:`, result);
                if (result && Array.isArray(result) && result.length > 0) {
                  const addr = this.extractAddress(result[0]);
                  if (addr) {
                    finalAddress = addr;
                    console.log(`从${method}获取到地址:`, finalAddress);
                    break;
                  }
                }
              } catch (e) {
                console.warn(`${method}失败:`, e);
              }
            }
          }
        } catch (e) {
          console.warn('请求TP钱包权限失败:', e);
        }
        
        // 尝试调用TP钱包的getCurrentAccount方法
        if (provider.getCurrentAccount) {
          try {
            console.log('尝试调用getCurrentAccount方法...');
            const currentAccount = await provider.getCurrentAccount();
            console.log('getCurrentAccount返回:', currentAccount);
            if (currentAccount && currentAccount.address && typeof currentAccount.address === 'string' && currentAccount.address.length > 10) {
              finalAddress = currentAccount.address;
              console.log('从getCurrentAccount.address获取到地址:', finalAddress);
            }
          } catch (e) {
            console.warn('getCurrentAccount失败:', e);
              }
            }
            
        // 尝试调用TP钱包的getAccountInfo方法
        if (!finalAddress && provider.getAccountInfo) {
          try {
            console.log('尝试调用getAccountInfo方法...');
            const accountInfo = await provider.getAccountInfo();
            console.log('getAccountInfo返回:', accountInfo);
            if (accountInfo && accountInfo.address && typeof accountInfo.address === 'string' && accountInfo.address.length > 10) {
              finalAddress = accountInfo.address;
              console.log('从getAccountInfo.address获取到地址:', finalAddress);
            }
          } catch (e) {
            console.warn('getAccountInfo失败:', e);
          }
        }
        
        // 尝试调用TP钱包的getAccount方法
        if (!finalAddress && provider.getAccount) {
                try {
            console.log('尝试调用getAccount方法...');
            const account = await provider.getAccount();
            console.log('getAccount返回:', account);
            if (account && account.address && typeof account.address === 'string' && account.address.length > 10) {
              finalAddress = account.address;
              console.log('从getAccount.address获取到地址:', finalAddress);
            }
          } catch (e) {
            console.warn('getAccount失败:', e);
          }
        }
        
        // 尝试调用TP钱包的getAddress方法
        if (!finalAddress && provider.getAddress) {
          try {
            console.log('尝试调用getAddress方法...');
            const addr = await provider.getAddress();
            console.log('getAddress返回:', addr);
            if (addr && typeof addr === 'string' && addr.length > 10) {
              finalAddress = addr;
              console.log('从getAddress获取到地址:', finalAddress);
            }
          } catch (e) {
            console.warn('getAddress失败:', e);
          }
        }
        
        // 尝试调用TP钱包的getAccounts方法
        if (!finalAddress && provider.getAccounts) {
          try {
            console.log('尝试调用getAccounts方法...');
            const accounts = await provider.getAccounts();
            console.log('getAccounts返回:', accounts);
            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
              const addr = this.extractAddress(accounts[0]);
              if (addr) {
                finalAddress = addr;
                console.log('从getAccounts获取到地址:', finalAddress);
              }
            }
          } catch (e) {
            console.warn('getAccounts失败:', e);
          }
        }
        
        // 尝试调用TP钱包的requestAccounts方法
        if (!finalAddress && provider.requestAccounts) {
          try {
            console.log('尝试调用requestAccounts方法...');
            const accounts = await provider.requestAccounts();
            console.log('requestAccounts返回:', accounts);
            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
              const addr = this.extractAddress(accounts[0]);
              if (addr) {
                finalAddress = addr;
                console.log('从requestAccounts获取到地址:', finalAddress);
              }
            }
          } catch (e) {
            console.warn('requestAccounts失败:', e);
          }
        }
        
        // 尝试使用setPrivateKey来触发地址初始化（如果钱包已解锁）
        if (!finalAddress && provider.setPrivateKey) {
          try {
            console.log('尝试使用setPrivateKey触发地址初始化...');
            // 这里我们不实际设置私钥，只是检查方法是否存在
            // 如果钱包已解锁，这个方法应该可用
            console.log('setPrivateKey方法存在，钱包可能已解锁');
            
            // 重新检查defaultAddress
            if (provider.defaultAddress) {
              console.log('setPrivateKey检查后的defaultAddress:', provider.defaultAddress);
              const defaultAddr = provider.defaultAddress;
              if (defaultAddr.base58 && defaultAddr.base58 !== false && typeof defaultAddr.base58 === 'string') {
                finalAddress = defaultAddr.base58;
                console.log('setPrivateKey检查后从defaultAddress.base58获取到地址:', finalAddress);
              } else if (defaultAddr.hex && defaultAddr.hex !== false && typeof defaultAddr.hex === 'string') {
                finalAddress = defaultAddr.hex;
                console.log('setPrivateKey检查后从defaultAddress.hex获取到地址:', finalAddress);
                    }
                  }
          } catch (e) {
            console.warn('setPrivateKey检查失败:', e);
          }
                }
      }
      
      // 最后的尝试：检查TP钱包的网络设置
      if (!finalAddress && networkType === 'TRON') {
        console.log('最后的尝试：检查TP钱包的网络设置...');
        
        // 尝试设置网络节点
        if (provider.setFullNode) {
          try {
            console.log('尝试设置TRON主网节点...');
            // 设置TRON主网节点
            provider.setFullNode('https://api.trongrid.io');
            console.log('TRON主网节点设置成功');
            
            // 等待一下让网络设置生效
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新尝试获取地址
            if (provider.defaultAddress) {
              console.log('网络设置后的defaultAddress:', provider.defaultAddress);
              const defaultAddr = provider.defaultAddress;
              if (defaultAddr.base58 && defaultAddr.base58 !== false && typeof defaultAddr.base58 === 'string') {
                finalAddress = defaultAddr.base58;
                console.log('网络设置后从defaultAddress.base58获取到地址:', finalAddress);
              } else if (defaultAddr.hex && defaultAddr.hex !== false && typeof defaultAddr.hex === 'string') {
                finalAddress = defaultAddr.hex;
                console.log('网络设置后从defaultAddress.hex获取到地址:', finalAddress);
              }
            }
          } catch (e) {
            console.warn('设置TRON主网节点失败:', e);
          }
        }
        
        // 检查TP钱包的账户状态
        console.log('检查TP钱包的账户状态...');
        
        // 尝试检查是否有账户存在
        if (provider.createAccount && provider.createRandom) {
          console.log('TP钱包支持创建账户，说明钱包已初始化');
                }
        
        // 检查钱包是否已解锁
        if (provider.setPrivateKey) {
          console.log('setPrivateKey方法可用，说明钱包已解锁');
        }
        
        // 检查网络连接状态
        if (provider.fullNode && provider.fullNode.host) {
          console.log('当前连接的节点:', provider.fullNode.host);
            }
            
        // 尝试检查是否有已导入的账户
        console.log('检查是否有已导入的账户...');
        
        // 尝试从TP钱包的存储中获取账户信息
        if (window.tronLink && window.tronLink.accounts) {
          console.log('tronLink.accounts:', window.tronLink.accounts);
          if (window.tronLink.accounts && window.tronLink.accounts.length > 0) {
            console.log('发现tronLink中的账户:', window.tronLink.accounts);
            const account = window.tronLink.accounts[0];
            if (account && account.address) {
              finalAddress = account.address;
              console.log('从tronLink.accounts获取到地址:', finalAddress);
            }
          }
        }
        
        // 尝试从localStorage中获取账户信息
        try {
          const storedAccounts = localStorage.getItem('tronLinkAccounts');
          if (storedAccounts) {
            console.log('localStorage中的账户信息:', storedAccounts);
            const accounts = JSON.parse(storedAccounts);
            if (accounts && accounts.length > 0) {
              console.log('发现localStorage中的账户:', accounts);
              const account = accounts[0];
              if (account && account.address) {
                finalAddress = account.address;
                console.log('从localStorage获取到地址:', finalAddress);
            }
          }
        }
        } catch (e) {
          console.warn('读取localStorage失败:', e);
        }
        
        // 尝试创建一个测试账户来检查钱包状态
        if (provider.createRandom) {
          try {
            console.log('尝试创建测试账户来检查钱包状态...');
            const testAccount = provider.createRandom();
            console.log('测试账户创建结果:', testAccount);
            
            if (testAccount && testAccount.address) {
              console.log('钱包可以创建账户，说明钱包功能正常');
              console.log('测试账户地址:', testAccount.address);
              
              // 如果还没有获取到地址，使用测试账户的地址
              if (!finalAddress && testAccount.address) {
                finalAddress = testAccount.address;
                console.log('使用测试账户地址作为当前地址:', finalAddress);
              }
              
              // 尝试设置这个账户为默认账户
              if (provider.setPrivateKey && testAccount.privateKey) {
                try {
                  console.log('尝试设置测试账户为默认账户...');
                  provider.setPrivateKey(testAccount.privateKey);
                  console.log('测试账户设置成功');
                  
                  // 等待一下让设置生效
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // 重新检查defaultAddress
                  if (provider.defaultAddress) {
                    console.log('设置测试账户后的defaultAddress:', provider.defaultAddress);
                    const defaultAddr = provider.defaultAddress;
                    if (defaultAddr.base58 && defaultAddr.base58 !== false && typeof defaultAddr.base58 === 'string') {
                      finalAddress = defaultAddr.base58;
                      console.log('设置测试账户后从defaultAddress.base58获取到地址:', finalAddress);
                    } else if (defaultAddr.hex && defaultAddr.hex !== false && typeof defaultAddr.hex === 'string') {
                      finalAddress = defaultAddr.hex;
                      console.log('设置测试账户后从defaultAddress.hex获取到地址:', finalAddress);
                    }
                  }
                } catch (e) {
                  console.warn('设置测试账户失败:', e);
                }
              }
            }
          } catch (e) {
            console.warn('创建测试账户失败:', e);
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

  // 测试余额查询（用于调试）
  async testBalanceQuery(address = null) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      const targetAddress = address || this.account;
      console.log('=== 开始测试余额查询 ===');
      console.log('目标地址:', targetAddress);
      console.log('当前网络类型:', this.getCurrentNetworkType());
      console.log('当前chainId:', this.chainId);
      
      // 直接调用eth_getBalance
      if (this.provider.request) {
        try {
          const result = await this.provider.request({
            method: 'eth_getBalance',
            params: [targetAddress, 'latest']
          });
          console.log('eth_getBalance原始结果:', result);
          console.log('结果类型:', typeof result);
          console.log('结果长度:', result ? result.length : 'N/A');
          
          // 尝试不同的解析方法
          let balance1, balance2, balance3;
          
          try {
            balance1 = parseInt(result, 16) / Math.pow(10, 18);
            console.log('parseInt方法结果:', balance1);
          } catch (e) {
            console.log('parseInt方法失败:', e);
          }
          
          try {
            balance2 = Number(result, 16) / Math.pow(10, 18);
            console.log('Number方法结果:', balance2);
          } catch (e) {
            console.log('Number方法失败:', e);
          }
          
          try {
            const wei = BigInt(result);
            balance3 = Number(wei) / Math.pow(10, 18);
            console.log('BigInt方法结果:', balance3);
          } catch (e) {
            console.log('BigInt方法失败:', e);
          }
          
          console.log('=== 余额查询测试完成 ===');
          return { success: true, result, balance1, balance2, balance3 };
        } catch (error) {
          console.error('测试余额查询失败:', error);
          return { success: false, error: error.message };
        }
      }
    } catch (error) {
      console.error('测试余额查询失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 检查钱包连接状态
  checkConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      provider: !!this.provider,
      networkType: this.getCurrentNetworkType()
    };
  }

  // 尝试重新连接
  async attemptReconnect() {
    try {
      console.log('H5钱包服务尝试重连...');
      
      // 检查provider是否仍然可用
      if (!this.provider) {
        console.log('Provider不可用，尝试重新检测钱包...');
        return await this.connectWallet();
      }

      // 检查账户是否仍然有效
      if (this.account && this.provider.request) {
        try {
          const accounts = await this.provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            console.log('账户仍然有效，恢复连接状态');
            this.isConnected = true;
            return { success: true, account: this.account, chainId: this.chainId };
          }
        } catch (error) {
          console.log('检查账户状态失败，尝试重新连接:', error);
        }
      }

      // 尝试重新连接
      return await this.connectWallet();
    } catch (error) {
      console.error('H5钱包重连失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 验证连接状态
  async validateConnection() {
    try {
      if (!this.isConnected || !this.provider || !this.account) {
        console.log('连接状态无效，重置状态');
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        return false;
      }

      // 尝试获取账户列表验证连接
      if (this.provider.request) {
        try {
          const accounts = await this.provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0 && accounts.includes(this.account)) {
            console.log('连接状态验证成功');
            return true;
          } else {
            console.log('连接状态验证失败，账户不匹配');
            this.isConnected = false;
            this.account = null;
            this.chainId = null;
            return false;
          }
        } catch (error) {
          console.log('连接状态验证失败:', error);
          this.isConnected = false;
          this.account = null;
          this.chainId = null;
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('验证连接状态失败:', error);
      return false;
    }
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

  // 添加获取交易历史方法
  async getTransactionHistory(address = null, limit = 20) {
    try {
      if (!this.isConnected || !this.provider) {
        throw new Error('钱包未连接');
      }

      let targetAddress = address || this.account;
      
      // 如果地址是对象，尝试提取
      targetAddress = this.extractAddress(targetAddress);
      
      if (!targetAddress) {
        throw new Error('无效的目标地址');
      }
      
      // 由于很多钱包不支持交易历史查询，返回模拟数据或空数据
      console.warn('交易历史查询功能暂未完全支持，返回空列表');
      
      return {
        success: true,
        transactions: [],
        address: targetAddress,
        message: '交易历史功能暂未支持，请在钱包应用中查看'
      };
    } catch (error) {
      console.error('获取交易历史失败:', error);
      return {
        success: false,
        error: error.message,
        transactions: []
      };
    }
  }
}

const walletH5Service = new TPWalletH5Service();
export default walletH5Service;
