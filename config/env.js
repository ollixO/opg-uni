// 环境配置文件
export const ENV = {
  // 开发环境
  DEVELOPMENT: {
    name: 'development',
    network: 'TESTNET',
    contracts: {
      RECHARGE: 'TYourTestnetContractAddress123', // 测试网充值合约地址
      TOKEN: 'TYourTokenTestnetAddress123'        // 测试网代币合约地址
    },
    api: {
      baseUrl: 'https://testnet-api.yourproject.com',
      timeout: 10000
    }
  },
  
  // 生产环境
  PRODUCTION: {
    name: 'production',
    network: 'MAINNET',
    contracts: {
      RECHARGE: 'TYourMainnetContractAddress123', // 主网充值合约地址
      TOKEN: 'TYourTokenMainnetAddress123'        // 主网代币合约地址
    },
    api: {
      baseUrl: 'https://api.yourproject.com',
      timeout: 15000
    }
  }
};

// 获取当前环境
export function getCurrentEnv() {
  // 这里可以根据编译时的环境变量来确定
  // #ifdef H5
  if (process.env.NODE_ENV === 'production') {
    return ENV.PRODUCTION;
  }
  // #endif
  
  // 默认使用开发环境
  return ENV.DEVELOPMENT;
}

// 获取当前网络类型
export function getCurrentNetworkType() {
  const env = getCurrentEnv();
  return env.network;
}

// 获取合约地址
export function getContractAddress(contractType) {
  const env = getCurrentEnv();
  return env.contracts[contractType];
}

// 获取API配置
export function getApiConfig() {
  const env = getCurrentEnv();
  return env.api;
}

// 环境信息
export function getEnvInfo() {
  const env = getCurrentEnv();
  return {
    name: env.name,
    network: env.network,
    contracts: env.contracts,
    api: env.api
  };
} 