// Ǯ�������� - ֧����̫��
import walletService from '@/utils/wallet.js';
import walletH5Service from '@/utils/wallet-h5.js';

class WalletManager {
  constructor() {
    this.currentService = null;
    this.serviceType = null;
    this.init();
  }

  // ��ʼ��Ǯ������
  init() {
    // ���ݻ���ѡ�����
    if (this.isEthereumEnvironment()) {
      // ��̫������ʹ����̫��Ǯ��
      this.currentService = walletH5Service; // ʹ�����е�H5���񣬵��޸�Ϊ֧����̫��
      this.serviceType = 'Ethereum';
      console.log('ʹ����̫��Ǯ������');
    } else if (this.isH5Environment()) {
      // H5����ʹ��Web3��ʽ
      this.currentService = walletH5Service;
      this.serviceType = 'H5';
      console.log('ʹ��H5Ǯ������');
    } else {
      // App����ʹ��ԭ�����÷�ʽ
      this.currentService = walletService;
      this.serviceType = 'Native';
      console.log('ʹ��ԭ��Ǯ������');
    }
  }

  // ����Ƿ�Ϊ��̫������
  isEthereumEnvironment() {
    // ����Ƿ�װ����̫��Ǯ��
    return typeof window !== 'undefined' && window.ethereum;
  }

  // ����Ƿ�ΪH5����
  isH5Environment() {
    // #ifdef H5
    return true;
    // #endif
    
    // #ifndef H5
    return false;
    // #endif
  }

  // ��ȡ��ǰ��������
  getServiceType() {
    return this.serviceType;
  }

  // ���TPǮ���Ƿ����
  async detectTPWallet() {
    try {
      return await this.currentService.detectTPWallet();
    } catch (error) {
      console.error('���Ǯ��ʧ��:', error);
      return false;
    }
  }

  // ����Ǯ��
  async connectWallet() {
    try {
      const result = await this.currentService.connectWallet();
      
      // ��¼��ϸ�Ĵ�����Ϣ
      if (!result.success) {
        console.warn('Ǯ������ʧ��:', result);
      }
      
      return result;
    } catch (error) {
      console.error('����Ǯ��ʧ��:', error);
      
      // �ṩ�ѺõĴ�����Ϣ
      let errorMessage = '����Ǯ��ʱ����δ֪����';
      let suggestions = '�����������Ӻ�Ǯ��Ӧ��״̬';
      
      if (error.message.includes('�û��ܾ�')) {
        errorMessage = '�û��ܾ�������Ǯ��';
        suggestions = '����Ǯ���е��"����"��"ȷ��"';
      } else if (error.message.includes('δ��⵽')) {
        errorMessage = 'δ��⵽Ǯ��';
        suggestions = '��ȷ���Ѱ�װǮ��Ӧ�ò�ˢ��ҳ��';
      }
      
      return {
        success: false,
        error: errorMessage,
        suggestions: suggestions,
        code: 'CONNECTION_ERROR'
      };
    }
  }

  // ��ȡ�˻����
  async getBalance(address = null) {
    try {
      const result = await this.currentService.getBalance(address);
      
      // �����ȡ���ʧ�ܣ�����ģ��ģʽ
      if (!result.success && this.serviceType === 'Native') {
        console.warn('ԭ�������ȡ���ʧ�ܣ�����ģ��ģʽ');
        return await this.currentService.mockGetBalance();
      }
      
      return result;
    } catch (error) {
      console.error('��ȡ���ʧ��:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ���ͽ���
  async sendTransaction(toAddress, amount) {
    try {
      const result = await this.currentService.sendTransaction(toAddress, amount);
      
      return result;
    } catch (error) {
      console.error('���ͽ���ʧ��:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ��ȡ����״̬
  async getNetworkInfo() {
    try {
      if (!this.currentService) {
        console.warn('Ǯ������δ��ʼ��');
        return { isConnected: false, account: null, chainId: null };
      }
      
      const networkInfo = this.currentService.getNetworkInfo();
      console.log('Ǯ�������ȡ������Ϣ:', networkInfo);
      
      return networkInfo;
    } catch (error) {
      console.error('��ȡ������Ϣʧ��:', error);
      return { isConnected: false, account: null, chainId: null };
    }
  }

  // �л�����
  async switchNetwork(chainId) {
    try {
      return await this.currentService.switchNetwork(chainId);
    } catch (error) {
      console.error('�л�����ʧ��:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ���Ӵ��ҵ�Ǯ��
  async addToken(tokenAddress, tokenSymbol, tokenDecimals, tokenImage) {
    try {
      return await this.currentService.addToken(tokenAddress, tokenSymbol, tokenDecimals, tokenImage);
    } catch (error) {
      console.error('���Ӵ���ʧ��:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ��ȡ�������
  async getTokenBalance(tokenAddress, accountAddress) {
    try {
      return await this.currentService.getTokenBalance(tokenAddress, accountAddress);
    } catch (error) {
      console.error('��ȡ�������ʧ��:', error);
      return {
        success: false,
        error: error.message,
        balance: '0'
      };
    }
  }
  // ��ȡUSDT���
  async getUSDTBalance(address = null) {
    try {
      const result = await this.currentService.getUSDTBalance(address);
      return result;
    } catch (error) {
      console.error('��ȡUSDT���ʧ��:', error);
      return {
        success: false,
        error: (error && error.message) ? error.message : '��ȡUSDT���ʧ��',
        balance: 0
      };
    }
  }


  // ǩ����Ϣ
  async signMessage(message) {
    try {
      return await this.currentService.signMessage(message);
    } catch (error) {
      console.error('ǩ����Ϣʧ��:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // �Ͽ�Ǯ������
  async disconnectWallet() {
    try {
      const result = await this.currentService.disconnectWallet();
      return result;
    } catch (error) {
      console.error('�Ͽ�Ǯ������ʧ��:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ǯ��״̬����
  onAccountsChanged(callback) {
    if (this.currentService && typeof this.currentService.onAccountsChanged === 'function') {
      this.currentService.onAccountsChanged(callback);
    }
  }

  onChainChanged(callback) {
    if (this.currentService && typeof this.currentService.onChainChanged === 'function') {
      this.currentService.onChainChanged(callback);
    }
  }

  onConnect(callback) {
    if (this.currentService && typeof this.currentService.onConnect === 'function') {
      this.currentService.onConnect(callback);
    }
  }

  onDisconnect(callback) {
    if (this.currentService && typeof this.currentService.onDisconnect === 'function') {
      this.currentService.onDisconnect(callback);
    }
  }

  // ���߷���
  formatBalance(balance, decimals = 18) {
    const divisor = Math.pow(10, decimals);
    return (parseFloat(balance) / divisor).toFixed(6);
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...`;
  }

  validateAddress(address) {
    // �����ĵ�ַ��ʽ��֤
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // ��̫����ַ��ʽ��֤
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  // ��ȡ���������������
  getExplorerUrl(txHash, type = 'tx') {
    const baseUrl = 'https://etherscan.io';
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/`;
      case 'address':
        return `${baseUrl}/address/`;
      case 'token':
        return `${baseUrl}/token/`;
      default:
        return baseUrl;
    }
  }

  // ������
  handleError(error) {
    let userMessage = '����ʧ�ܣ�������';
    
    if (error.code === 4001) {
      userMessage = '�û�ȡ���˲���';
    } else if (error.code === -32602) {
      userMessage = '��������';
    } else if (error.code === -32603) {
      userMessage = '�ڲ�����';
    } else if (error.message) {
      if (error.message.includes('insufficient funds')) {
        userMessage = '����';
      } else if (error.message.includes('gas')) {
        userMessage = 'Gas���ô���';
      } else if (error.message.includes('network')) {
        userMessage = '�������Ӵ���';
      }
    }
    
    return {
      success: false,
      error: userMessage,
      originalError: error
    };
  }

  // 发送USDT代币转账
  async sendUSDTTransaction(toAddress, amount) {
    try {
      const result = await this.currentService.sendUSDTTransaction(toAddress, amount);
      
      return result;
    } catch (error) {
      console.error('发送USDT转账失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const walletManager = new WalletManager();
export default walletManager;

