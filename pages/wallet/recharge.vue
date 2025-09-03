<template>
<view class="recharge-page">
<!-- 顶部导航栏 -->
<NavBar title="充值" />
<!-- 钱包连接状态提示 -->
<view v-if="!walletConnected" class="connection-notice">
<text class="notice-text">钱包未连接</text>
<button class="connect-btn" @click="goToConnect">连接钱包</button>
</view>
<!-- 主要内容区域 -->
<view class="main-content">
<!-- 输入提示 -->
<view class="input-section">
<text class="input-label">请填写数量</text>
<view class="amount-input">
<text class="currency-symbol">$</text>
<input 
class="amount-field" 
type="number" 
v-model="rechargeAmount" 
placeholder="0.00"
@input="onAmountInput"
/>
</view>
<view class="input-line"></view>
</view>
<!-- 当前余额 -->
<view class="balance-info">
<text class="balance-text">当前余额: {{ formatBalance(currentBalance) }} USDT</text>
<view class="refresh-btn" @click="refreshBalance" :class="{ refreshing: refreshing }">
<text class="refresh-text">{{ refreshing ? '刷新中...' : '刷新' }}</text>
</view>
</view>
<!-- 最低金额提示 -->
<view class="min-amount-notice">
<text class="notice-text">*最低10 USDT</text>
</view>
<!-- 预设金额按钮 -->
<view class="preset-amounts">
<view 
class="preset-btn" 
v-for="amount in presetAmounts" 
:key="amount"
:class="{ active: rechargeAmount == amount }"
@click="selectPresetAmount(amount)"
>
<text class="preset-text">{{ amount }} USDT</text>
</view>
</view>
<!-- 充值按钮 -->
<view class="recharge-section">
<image 
class="recharge-btn" 
src="@/static/chongzhi.png" 
@click="handleRecharge" 
:class="{ disabled: !canRecharge }"
></image>
</view>
</view>
</view>
</template>

<script>
import NavBar from "@/components/NavBar.vue";
import walletManager from "@/utils/wallet-manager.js";
import { getRechargeContractConfig, getCurrentNetwork, getUSDTContractConfig } from "@/config/contracts.js";

export default {
name: "Recharge",
components: {
NavBar
},
data() {
return {
rechargeAmount: "",
currentBalance: 0,
presetAmounts: [10, 30, 50, 100, 200],
walletConnected: false,
walletAddress: "",
contractConfig: null,
currentNetwork: "MAINNET",
refreshing: false
}
},
computed: {
canRecharge() {
const amount = parseFloat(this.rechargeAmount);
return amount >= 10 && amount > 0 && this.walletConnected;
}
},
onLoad() {
console.log("充值页面加载");
this.initContractConfig();
this.checkWalletStatus();
},
onShow() {
console.log("充值页面显示");
this.checkWalletStatus();
},
methods: {
// 初始化合约配置
initContractConfig() {
try {
this.currentNetwork = getCurrentNetwork();
this.contractConfig = getRechargeContractConfig();
console.log("合约配置初始化", this.contractConfig);
} catch (error) {
console.error("初始化合约配置失败", error);
uni.showToast({
title: "合约配置初始化失败",
icon: "none"
});
}
},

// 检查钱包状态
async checkWalletStatus() {
try {
const networkInfo = await walletManager.getNetworkInfo();
console.log("充值页面检查钱包状态", networkInfo);

if (networkInfo.isConnected && networkInfo.account) {
this.walletConnected = true;
this.walletAddress = networkInfo.account;
// 加载余额
await this.loadCurrentBalance();
} else {
this.walletConnected = false;
this.walletAddress = "";
this.currentBalance = 0;
}
} catch (error) {
console.error("检查钱包状态失败", error);
this.walletConnected = false;
this.walletAddress = "";
this.currentBalance = 0;
}
},

// 加载当前余额
async loadCurrentBalance() {
try {
if (!this.walletConnected) {
this.currentBalance = 0;
return;
}

console.log("开始加载USDT余额...");
const result = await walletManager.getUSDTBalance(this.walletAddress);
console.log("USDT余额查询结果:", result);

if (result.success) {
this.currentBalance = result.balance;
console.log("USDT余额加载成功:", this.currentBalance);
} else {
console.warn("USDT余额加载失败:", result.error);
this.currentBalance = 0;
  
// 如果有调试信息，显示更详细的错误
if (result.debug) {
console.warn("USDT余额查询调试信息:", result.debug);
}
}
} catch (error) {
console.error("加载USDT余额失败:", error);
this.currentBalance = 0;
}
},

// 刷新余额
async refreshBalance() {
if (!this.walletConnected) {
uni.showToast({
title: '请先连接钱包',
icon: 'none'
});
return;
}

this.refreshing = true;
try {
await this.loadCurrentBalance();
uni.showToast({
title: '余额已刷新',
icon: 'success'
});
} catch (error) {
uni.showToast({
title: '刷新失败',
icon: 'none'
});
} finally {
this.refreshing = false;
}
},

// 格式化余额显示
formatBalance(balance) {
if (typeof balance !== 'number' || isNaN(balance)) {
return '0.00';
}
return balance.toFixed(2);
},

// 选择预设金额
selectPresetAmount(amount) {
this.rechargeAmount = amount.toString();
},

// 金额输入处理
onAmountInput(e) {
const value = e.detail.value;
// 限制只能输入数字和小数点
this.rechargeAmount = value.replace(/[^\d.]/g, "");
},

// 处理充值
handleRecharge() {
if (!this.walletConnected) {
uni.showToast({
title: "请先连接钱包",
icon: "none"
});
return;
}

// if (!this.canRecharge) {
// uni.showToast({
// title: "请输入有效金额（最低10 USDT）",
// icon: "none"
// });
// return;
// }

const amount = parseFloat(this.rechargeAmount);
uni.showModal({
title: "确认充值",
content: `确认充值 ${amount} USDT 吗？\n\n注意：\n1. 充值将发送USDT代币到合约地址\n2. 需要ETH/BNB支付gas费\n3. 请确保网络稳定`,
success: (res) => {
if (res.confirm) {
this.processRecharge(amount);
}
}
});
},

// 执行充值（通过智能合约）
async processRecharge(amount) {
uni.showLoading({
title: "充值中..."
});

try {
// 检查钱包服务状态
if (!walletManager.currentService) {
throw new Error("钱包服务未初始化，请重新连接钱包");
}

// 检查钱包连接状态
const networkInfo = await walletManager.getNetworkInfo();
if (!networkInfo.isConnected || !networkInfo.account) {
throw new Error("钱包未连接，请先连接钱包");
}

// 检查合约配置
if (!this.contractConfig) {
throw new Error("充值合约未配置，请联系管理员");
}

console.log("开始充值流程，金额:", amount, "USDT");
console.log("使用合约:", "0xdAC17F958D2ee523a2206206994597C13D831ec7");
console.log("当前网络:", this.currentNetwork);

// 调用智能合约进行充值
const result = await this.callRechargeContract(amount);

if (result.success) {
// 充值成功
uni.hideLoading();
uni.showToast({
title: "充值成功",
icon: "success"
});

// 清空输入框
this.rechargeAmount = "";

// 更新余额
await this.loadCurrentBalance();

// 显示成功信息
setTimeout(() => {
uni.showModal({
title: "USDT充值成功",
content: `成功充值 ${amount} USDT\n\n交易哈希: ${result.txHash}\n\nUSDT合约: ${result.contractAddress}\n\n网络: ${this.contractConfig.networkName}\n\n余额已更新`,
showCancel: false,
success: () => {
// 可以选择返回上一页
// uni.navigateBack();
}
});
}, 1000);

} else {
throw new Error(result.error || "充值失败");
}

} catch (error) {
uni.hideLoading();
uni.showToast({
title: error.message || "充值失败，请重试",
icon: "none"
});
console.error("充值失败:", error);
}
},

// 调用充值合约
async callRechargeContract(amount) {
try {
console.log("调用USDT代币转账开始");

// 获取充值合约配置
const rechargeConfig = getRechargeContractConfig();
const usdtConfig = getUSDTContractConfig();

console.log("充值合约配置:", rechargeConfig);
console.log("USDT合约配置:", usdtConfig);

// 使用配置文件中的充值合约地址
const rechargeContractAddress = rechargeConfig.address;
console.log("使用充值合约地址:", rechargeContractAddress);

// 使用USDT代币转账方法，而不是原生代币转账
const result = await walletManager.sendUSDTTransaction(
rechargeContractAddress, // 从配置文件获取的充值合约地址
amount // USDT金额
);

console.log("USDT代币转账结果:", result);

if (result.success) {
return {
success: true,
txHash: result.txHash,
message: "USDT代币转账成功",
contractAddress: result.contractAddress,
amount: result.amount,
decimals: result.decimals,
rechargeContractAddress: rechargeContractAddress
};
} else {
return {
success: false,
error: result.error || "USDT代币转账失败"
};
}

} catch (error) {
console.error("调用USDT代币转账失败:", error);
return {
success: false,
error: error.message || "USDT代币转账失败"
};
}
},

// 构建合约调用数据
buildContractCallData(amount) {
try {
// 以太坊合约调用数据构建
const methodSignature = "recharge(uint256)";

console.log("构建合约调用数据:", {
method: methodSignature,
amount: amount,
contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
});

return {
method: methodSignature,
amount: amount,
contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

} catch (error) {
console.error("构建合约调用数据失败:", error);
throw new Error("USDT转账数据构建失败");
}
},

// 跳转到连接钱包页面
goToConnect() {
// 直接在当前页面连接钱包
this.connectWallet();
},

// 连接钱包
async connectWallet() {
console.log("开始连接钱包");
try {
uni.showLoading({
title: "连接中..."
});

// 调试：检查钱包管理器状态
console.log("钱包管理器状态", {
currentService: walletManager.currentService,
serviceType: walletManager.serviceType,
isConnected: walletManager.isConnected
});

const result = await walletManager.connectWallet();

uni.hideLoading();

if (result.success) {
uni.showToast({
title: "钱包连接成功",
icon: "success"
});

// 重新检查钱包状态
await this.checkWalletStatus();

// 调试：连接后的状态
console.log("连接后钱包管理器状态", {
currentService: walletManager.currentService,
serviceType: walletManager.serviceType,
isConnected: walletManager.isConnected
});

} else {
uni.showToast({
title: result.error || "连接失败",
icon: "none"
});

// 如果有建议信息，显示更详细的提示
if (result.suggestions) {
setTimeout(() => {
uni.showModal({
title: "连接失败",
content: result.suggestions,
showCancel: false
});
}, 1000);
}
}

} catch (error) {
uni.hideLoading();
console.error("连接钱包失败:", error);
uni.showToast({
title: "连接失败，请重试",
icon: "none"
});
}
}
}
}
</script>

<style scoped>
.recharge-page {
min-height: 100vh;
background-image: url(@/static/back.png);
background-size: cover;
background-position: center;
background-repeat: no-repeat;
padding: 0;
}

.connection-notice {
display: flex;
justify-content: space-between;
align-items: center;
background: rgba(255, 255, 255, 0.1);
padding: 20rpx 30rpx;
margin: 20rpx;
border-radius: 20rpx;
backdrop-filter: blur(10px);
}

.notice-text {
color: #fff;
font-size: 28rpx;
}

.connect-btn {
background: #4CAF50;
color: white;
border: none;
padding: 15rpx 30rpx;
border-radius: 25rpx;
font-size: 26rpx;
}

.main-content {
padding: 40rpx 30rpx;
}

.input-section {
margin-bottom: 40rpx;
}

.input-label {
display: block;
color: #fff;
font-size: 32rpx;
margin-bottom: 20rpx;
font-weight: 500;
}

.amount-input {
display: flex;
align-items: center;
background: rgba(255, 255, 255, 0.1);
border-radius: 20rpx;
padding: 20rpx;
backdrop-filter: blur(10px);
}

.currency-symbol {
color: #fff;
font-size: 36rpx;
font-weight: bold;
margin-right: 15rpx;
}

.amount-field {
flex: 1;
background: transparent;
border: none;
color: #fff;
font-size: 36rpx;
font-weight: 500;
}

.amount-field::placeholder {
color: rgba(255, 255, 255, 0.6);
}

.input-line {
height: 2rpx;
background: linear-gradient(90deg, #4CAF50, #45a049);
margin-top: 10rpx;
border-radius: 1rpx;
}

.balance-info {
display: flex;
justify-content: space-between;
align-items: center;
background: rgba(255, 255, 255, 0.1);
padding: 20rpx 30rpx;
border-radius: 20rpx;
margin-bottom: 30rpx;
backdrop-filter: blur(10px);
}

.balance-text {
color: #fff;
font-size: 28rpx;
font-weight: 500;
}

.refresh-btn {
background: rgba(76, 175, 80, 0.8);
padding: 10rpx 20rpx;
border-radius: 15rpx;
transition: all 0.3s ease;
}

.refresh-btn.refreshing {
background: rgba(76, 175, 80, 0.5);
}

.refresh-text {
color: #fff;
font-size: 24rpx;
}

.min-amount-notice {
margin-bottom: 30rpx;
}

.notice-text {
color: rgba(255, 255, 255, 0.8);
font-size: 24rpx;
}

.preset-amounts {
display: flex;
flex-wrap: wrap;
gap: 20rpx;
margin-bottom: 40rpx;
}

.preset-btn {
background: rgba(255, 255, 255, 0.1);
padding: 20rpx 30rpx;
border-radius: 25rpx;
backdrop-filter: blur(10px);
transition: all 0.3s ease;
flex: 1;
min-width: 120rpx;
text-align: center;
}

.preset-btn.active {
background: rgba(76, 175, 80, 0.8);
transform: scale(1.05);
}

.preset-text {
color: #fff;
font-size: 28rpx;
font-weight: 500;
}

.recharge-section {
display: flex;
justify-content: center;
margin-top: 40rpx;

}
.recharge-section image{
    width: 400rpx;
    height: 150rpx;
}
.recharge-btn {
width: 200rpx;
height: 200rpx;
border-radius: 50%;
transition: all 0.3s ease;
}

.recharge-btn.disabled {
opacity: 0.5;
transform: scale(0.95);
}

.recharge-btn:not(.disabled):active {
transform: scale(0.95);
}
</style>
