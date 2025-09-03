// Smart contract configuration file
export const CONTRACTS = {
  RECHARGE: {
    MAINNET: {
      address: "0xa2e0ebd19de0919c09f24b94af567732439c0260",
      networkId: 1,
      networkName: "Ethereum Mainnet",
      chainId: 1
    },
    BSC: {
      address: "0x1234567890abcdef1234567890abcdef12345672",
      networkId: 56,
      networkName: "BSC Mainnet",
      chainId: 56
    },
    OPTIMISM: {
      address: "0x1234567890abcdef1234567890abcdef12345673",
      networkId: 10,
      networkName: "Optimism",
      chainId: 10
    },
    POLYGON: {
      address: "0x1234567890abcdef1234567890abcdef12345674",
      networkId: 137,
      networkName: "Polygon Mainnet",
      chainId: 137
    },
    ARBITRUM: {
      address: "0x1234567890abcdef1234567890abcdef12345675",
      networkId: 42161,
      networkName: "Arbitrum One",
      chainId: 42161
    }
  },
  USDT: {
    MAINNET: {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      networkId: 1,
      networkName: "Ethereum Mainnet",
      chainId: 1,
      symbol: "USDT",
      decimals: 6
    },
    BSC: {
      address: "0x55d398326f99059fF775485246999027B3197955",
      networkId: 56,
      networkName: "BSC Mainnet",
      chainId: 56,
      symbol: "USDT",
      decimals: 18
    },
    OPTIMISM: {
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      networkId: 10,
      networkName: "Optimism",
      chainId: 10,
      symbol: "USDT",
      decimals: 6
    },
    POLYGON: {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      networkId: 137,
      networkName: "Polygon Mainnet",
      chainId: 137,
      symbol: "USDT",
      decimals: 6
    },
    ARBITRUM: {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      networkId: 42161,
      networkName: "Arbitrum One",
      chainId: 42161,
      symbol: "USDT",
      decimals: 6
    },
    GOERLI: {
      address: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
      networkId: 5,
      networkName: "Ethereum Goerli Testnet",
      chainId: 5,
      symbol: "USDT",
      decimals: 6
    }
  }
};
// 根据chainId获取网络名称
export function getNetworkByChainId(chainId) {
  const networkMap = {
    1: "MAINNET",
    5: "GOERLI", 
    10: "OPTIMISM",
    56: "BSC",
    137: "POLYGON",
    42161: "ARBITRUM"
  };
  return networkMap[chainId] || "MAINNET";
}

export function getCurrentNetwork() {
  return "MAINNET";
}

export function getRechargeContractConfig(chainId = null) {
  const network = chainId ? getNetworkByChainId(chainId) : getCurrentNetwork();
  return CONTRACTS.RECHARGE[network];
}

export function getUSDTContractConfig(chainId = null) {
  const network = chainId ? getNetworkByChainId(chainId) : getCurrentNetwork();
  return CONTRACTS.USDT[network];
}

// 获取所有支持的USDT网络
export function getSupportedUSDTNetworks() {
  return Object.keys(CONTRACTS.USDT);
}

// 根据chainId获取USDT合约配置
export function getUSDTContractByChainId(chainId) {
  const network = getNetworkByChainId(chainId);
  return CONTRACTS.USDT[network];
}
