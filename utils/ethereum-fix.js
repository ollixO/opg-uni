// ��ʱ�޸����� - �����̫����ַ����������
const ETHEREUM_FIX = {
  // ��ʱ����̫����Լ��ַ
  TEMP_CONTRACT_ADDRESS: '0x742d35Cc6634C0532925a3b8D39cEEf464F5aE4B', // ����ĺ�Լ��ַ
  
  // �޸�����
  fixAddressFormat: function(address) {
    // �������̫����ַ��ʽ��ֱ�ӷ���
    if (address && address.startsWith('0x') && address.length === 42) {
      return address;
    }
    // ���򷵻���ʱ��ַ
    return this.TEMP_CONTRACT_ADDRESS;
  },
  
  // �޸���������
  getNetworkConfig: function() {
    return {
      chainId: 1, // ��̫������
      networkName: 'Ethereum Mainnet',
      isEthereum: true
    };
  }
};

// �����޸�
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ETHEREUM_FIX;
} else if (typeof window !== 'undefined') {
  window.ETHEREUM_FIX = ETHEREUM_FIX;
}
