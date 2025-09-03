const RechargeContract = artifacts.require("RechargeContract");

module.exports = function(deployer, network, accounts) {
  console.log('开始部署充值合约...');
  console.log('网络:', network);
  console.log('部署账户:', accounts[0]);
  
  // 部署充值合约
  deployer.deploy(RechargeContract, {
    from: accounts[0],
    gas: 5000000, // 设置足够的gas
    gasPrice: 0 // TRON网络不需要设置gasPrice
  }).then((instance) => {
    console.log('✅ 充值合约部署成功!');
    console.log('合约地址:', instance.address);
    console.log('部署账户:', accounts[0]);
    
    // 可以在这里进行一些初始化设置
    // 例如：设置手续费、最小充值金额等
    
    return instance;
  }).catch((error) => {
    console.error('❌ 充值合约部署失败:', error);
    throw error;
  });
}; 