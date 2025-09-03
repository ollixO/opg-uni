module.exports = {
  networks: {
    // 开发网络配置
    development: {
      privateKey: '0xfe3c3d1f7ae6da0bc7a2fe7a311e5dd54a737ed68aab34125f4552a30497ebcf', // 替换为您的私钥
      userFeeLimit: 1000000000,
      feeLimit: 1000000000,
      fullHost: 'https://api.shasta.trongrid.io', // Shasta测试网
      network_id: '*'
    },
    
    // Shasta测试网配置
    shasta: {
      privateKey: '0xfe3c3d1f7ae6da0bc7a2fe7a311e5dd54a737ed68aab34125f4552a30497ebcf', // 替换为您的私钥
      userFeeLimit: 1000000000,
      feeLimit: 1000000000,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '*'
    },
    
    // 主网配置
    mainnet: {
      privateKey: '0xfe3c3d1f7ae6da0bc7a2fe7a311e5dd54a737ed68aab34125f4552a30497ebcf', // 替换为您的私钥
      userFeeLimit: 1000000000,
      feeLimit: 1000000000,
      fullHost: 'https://api.trongrid.io',
      network_id: '*'
    }
  },
  
  compilers: {
    solc: {
      version: '0.8.19',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}; 