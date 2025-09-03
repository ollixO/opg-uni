<template>
  <view class="wallet-connect">
    <!-- v-if="!isConnected" -->
    <view  class="connect-section">
      <button class="connect-btn" @click="connectWallet" :disabled="connecting">
        {{ connecting ? '连接中...' : '连接TP钱包' }}
      </button>
      <text class="connect-tip">请确保已安装TP钱包应用</text>
      
      <!-- 钱包检测状态 -->
      <view class="wallet-status">
        <text class="status-label">钱包状态:</text>
        <text class="status-value" :class="walletStatusClass">{{ walletStatusText }}</text>
        <button v-if="!walletDetected" class="refresh-btn" @click="refreshDetection" :disabled="detecting">
          {{ detecting ? '检测中...' : '刷新检测' }}
        </button>
      </view>
      
      <!-- 详细检测信息 -->
      <view v-if="detectionDetails" class="detection-details">
        <text class="details-title">检测详情:</text>
        <view class="detail-item" v-for="(detail, index) in detectionDetails" :key="index">
          <text class="detail-label">{{ detail.label }}:</text>
          <text class="detail-value" :class="detail.status">{{ detail.value }}</text>
        </view>
        
        <!-- 调试信息 -->
        <view class="debug-info">
          <text class="debug-title">调试信息:</text>
          <text class="debug-text">用户代理: {{ userAgent }}</text>
          <text class="debug-text">屏幕尺寸: {{ screenSize }}</text>
          <text class="debug-text">钱包对象: {{ walletObjects }}</text>
        </view>
      </view>
      
      <!-- 错误提示区域 -->
      <view v-if="errorInfo" class="error-section">
        <text class="error-title">连接失败</text>
        <text class="error-message">{{ errorInfo.error }}</text>
        <text v-if="errorInfo.suggestions" class="error-suggestions">{{ errorInfo.suggestions }}</text>
        <button class="retry-btn" @click="retryConnection" :disabled="connecting">
          重试连接
        </button>
        <button class="help-btn" @click="showHelp">获取帮助</button>
      </view>
    </view>
    
    <!-- <view v-else class="wallet-info">
      <view class="account-info">
        <text class="label">账户地址:</text>
        <text class="address">{{ formatAddress(account) }}</text>
      </view>
      <view class="balance-info">
        <text class="label">余额:</text>
        <text class="balance">{{ balance }} TRX</text>
      </view>
      <view class="network-info">
        <text class="label">网络:</text>
        <text class="network">{{ getNetworkName(chainId) }}</text>
      </view>
      <button class="disconnect-btn" @click="disconnectWallet">断开连接</button>
    </view> -->
  </view>
</template>

<script>
import walletManager from '@/utils/wallet-manager.js';

export default {
  name: 'WalletConnect',
  data() {
    return {
      isConnected: false,
      account: '',
      balance: 0,
      chainId: null,
      connecting: false,
      errorInfo: null, // 新增错误信息
      walletDetected: false, // 钱包检测状态
      walletStatusText: '检测中...', // 钱包状态文本
      walletStatusClass: 'status-detecting', // 钱包状态样式类
      detectionDetails: null, // 新增检测详情
      detecting: false, // 新增检测中状态
      userAgent: '', // 新增调试信息
      screenSize: '', // 新增调试信息
      walletObjects: '' // 新增调试信息
    };
  },
  mounted() {
    this.checkWalletStatus();
    this.detectWallet();
    this.updateDebugInfo(); // 在mounted时更新调试信息
  },
  methods: {
    		// 检查钱包状态
		async checkWalletStatus() {
			// 如果已经连接，跳过检查
			if (this.isConnected) {
				console.log('WalletConnect: 钱包已连接，跳过状态检查');
				return;
			}
			
			try {
				const networkInfo = await walletManager.getNetworkInfo();
				this.isConnected = networkInfo.isConnected;
				this.account = networkInfo.account;
				this.chainId = networkInfo.chainId;
				
				if (this.isConnected) {
					// 只在首次连接时加载余额
					this.loadBalance();
				}
			} catch (error) {
				console.error('WalletConnect: 检查钱包状态失败:', error);
			}
		},
    
    		// 连接钱包
		async connectWallet() {
			this.connecting = true;
			this.errorInfo = null; // 清除之前的错误信息
			try {
				const result = await walletManager.connectWallet();
				if (result.success) {
					this.isConnected = true;
					this.account = result.account;
					this.chainId = result.chainId;
					this.loadBalance();
					
					// 通知父组件钱包已连接
					this.$emit('wallet-connected', {
						isConnected: true,
						account: this.account,
						chainId: this.chainId
					});
					
					uni.showToast({
						title: '钱包连接成功',
						icon: 'success'
					});
				} else {
					this.errorInfo = {
						error: result.error || '连接失败',
						suggestions: result.suggestions || '请检查TP钱包应用是否已安装'
					};
					uni.showToast({
						title: result.error || '连接失败',
						icon: 'error'
					});
				}
			} catch (error) {
				this.errorInfo = {
					error: '连接异常',
					suggestions: '请检查网络连接或TP钱包应用是否正常'
				};
				uni.showToast({
					title: '连接异常',
					icon: 'error'
				});
			} finally {
				this.connecting = false;
			}
		},
    
    		// 断开钱包
		disconnectWallet() {
			walletManager.disconnectWallet();
			this.isConnected = false;
			this.account = '';
			this.balance = 0;
			this.chainId = null;
			uni.showToast({
				title: '已断开连接',
				icon: 'success'
			});
		},
    
    		// 加载余额
		async loadBalance() {
			if (this.account) {
				try {
					const result = await walletManager.getBalance(this.account);
					if (result && result.success) {
						this.balance = result.balance ? result.balance.toFixed(6) : '0.000000';
						console.log('余额加载成功:', this.balance);
					} else {
						console.warn('余额加载失败:', result ? result.error : '未知错误');
						this.balance = '0.000000';
					}
				} catch (error) {
					console.error('余额加载异常:', error);
					this.balance = '0.000000';
				}
			} else {
				console.warn('账户未设置，无法加载余额');
				this.balance = '0.000000';
			}
		},
    
    // 格式化地址显示
    formatAddress(address) {
      if (!address) return '';
      
      // 确保address是字符串类型
      const addressStr = String(address);
      if (addressStr.length <= 10) return addressStr;
      
      return addressStr.substring(0, 6) + '...' + addressStr.substring(addressStr.length - 4);
    },
    
    // 获取网络名称
    getNetworkName(chainId) {
      switch (chainId) {
        case 1:
          return '主网';
        case 3:
          return '测试网';
        default:
          return '未知网络';
      }
    },

         // 检测钱包
     async detectWallet() {
       try {
         this.detecting = true; // 开始检测
         const detected = await walletManager.detectTPWallet();
         this.walletDetected = detected;
         
         if (detected) {
           this.walletStatusText = '已检测到TP钱包';
           this.walletStatusClass = 'status-detected';
           this.detectionDetails = [
             { label: '钱包类型', value: 'TP钱包', status: 'status-detected' },
             { label: '检测结果', value: '已检测到', status: 'status-detected' },
             { label: '环境类型', value: this.getEnvironmentType(), status: 'status-detected' }
           ];
         } else {
           this.walletStatusText = '未检测到TP钱包';
           this.walletStatusClass = 'status-not-detected';
           this.detectionDetails = [
             { label: '钱包类型', value: 'TP钱包', status: 'status-not-detected' },
             { label: '检测结果', value: '未检测到', status: 'status-not-detected' },
             { label: '环境类型', value: this.getEnvironmentType(), status: 'status-not-detected' },
             { label: '建议', value: '请通过TP钱包的DApp浏览器访问', status: 'status-not-detected' }
           ];
         }
       } catch (error) {
         this.walletStatusText = '检测失败';
         this.walletStatusClass = 'status-error';
         this.detectionDetails = [
           { label: '钱包类型', value: 'TP钱包', status: 'status-error' },
           { label: '检测结果', value: '失败', status: 'status-error' },
           { label: '错误信息', value: error.message, status: 'status-error' }
         ];
       } finally {
         this.detecting = false; // 结束检测
       }
     },

     // 获取环境类型
     getEnvironmentType() {
       const userAgent = navigator.userAgent.toLowerCase();
       
       if (userAgent.includes('tronlink') || userAgent.includes('tpwallet')) {
         return 'TP钱包内置浏览器';
       } else if (userAgent.includes('tokenpocket')) {
         return 'TokenPocket内置浏览器';
       } else if (userAgent.includes('imtoken')) {
         return 'imToken内置浏览器';
       } else if (/android|iphone|ipad|ipod/i.test(userAgent)) {
         return '移动端浏览器';
       } else {
         return '桌面端浏览器';
       }
     },

     // 刷新检测
     refreshDetection() {
       this.detectWallet();
     },

     // 重试连接
     retryConnection() {
       this.connectWallet();
     },

     // 显示帮助
     showHelp() {
       const helpContent = `TP钱包连接指南：

1. 确保已安装TP钱包应用
2. 在TP钱包中创建或导入账户
3. 确保TP钱包已解锁
4. 通过TP钱包的DApp浏览器访问此应用
5. 点击"连接TP钱包"按钮
6. 在弹窗中允许连接权限

如果连接失败，请尝试：
- 通过TP钱包的DApp浏览器访问（推荐）
- 刷新页面重新连接
- 检查网络连接
- 重启TP钱包应用

常见问题：
- 连接被拒绝：请在弹窗中点击"允许"
- 未检测到钱包：请通过TP钱包的DApp浏览器访问
- 连接超时：请检查网络状态

移动端用户：
- 建议使用TP钱包内置的DApp浏览器
- 确保TP钱包应用已更新到最新版本
- 检查TP钱包的DApp权限设置`;

       uni.showModal({
         title: 'TP钱包连接帮助',
         content: helpContent,
         showCancel: false,
         confirmText: '我知道了'
       });
     },

     // 更新调试信息
     updateDebugInfo() {
       this.userAgent = navigator.userAgent;
       this.screenSize = `${window.innerWidth}x${window.innerHeight}`;
       
       // 安全地获取钱包对象信息，避免循环引用
       try {
         const walletInfo = {};
         if (window.tronWeb) {
           walletInfo.tronWeb = {
             ready: window.tronWeb.ready,
             connected: window.tronWeb.connected,
             defaultAddress: window.tronWeb.defaultAddress ? '已设置' : '未设置',
             address: window.tronWeb.address ? '已设置' : '未设置'
           };
         }
         if (window.tronLink) {
           walletInfo.tronLink = {
             ready: window.tronLink.ready,
             connected: window.tronLink.connected
           };
         }
         this.walletObjects = JSON.stringify(walletInfo);
       } catch (error) {
         this.walletObjects = '无法序列化钱包对象信息';
       }
     }
  }
};
</script>

<style scoped>
.wallet-connect {
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.connect-section {
  text-align: center;
  padding: 40rpx 20rpx;
}

.connect-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.connect-btn:disabled {
  opacity: 0.6;
}

.connect-tip {
  font-size: 24rpx;
  color: #999;
}

.wallet-info {
  padding: 20rpx;
}

.account-info,
.balance-info,
.network-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.account-info:last-child,
.balance-info:last-child,
.network-info:last-child {
  border-bottom: none;
}

.label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.address,
.balance,
.network {
  font-size: 28rpx;
  color: #333;
  font-family: monospace;
}

.balance {
  color: #52c41a;
  font-weight: bold;
}

.disconnect-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
  margin-top: 30rpx;
  width: 100%;
}

/* 新增错误提示样式 */
.error-section {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #fffbe6;
  border: 1rpx solid #ffe58f;
  border-radius: 8rpx;
  text-align: left;
}

.error-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #faad14;
  margin-bottom: 10rpx;
}

.error-message {
  font-size: 28rpx;
  color: #faad14;
  margin-bottom: 10rpx;
}

.error-suggestions {
  font-size: 24rpx;
  color: #faad14;
  margin-bottom: 20rpx;
}



.retry-btn,
.help-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 15rpx 40rpx;
  font-size: 28rpx;
  margin-right: 10rpx;
}

.help-btn {
  background: #1890ff;
}

/* 钱包状态样式 */
.wallet-status {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20rpx 0;
  padding: 15rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8rpx;
}

.status-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 10rpx;
}

.status-value {
  font-size: 24rpx;
  font-weight: bold;
}

.status-detecting {
  color: #1890ff;
}

.status-detected {
  color: #52c41a;
}

.status-not-detected {
  color: #faad14;
}

.status-error {
  color: #ff4d4f;
}

/* 新增检测详情样式 */
.detection-details {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #e6f7ff;
  border: 1rpx solid #91d5ff;
  border-radius: 8rpx;
  text-align: left;
}

.details-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;
  border-bottom: 1rpx dashed #e6f7ff;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 28rpx;
  font-weight: bold;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 15rpx 40rpx;
  font-size: 28rpx;
  margin-left: 10rpx;
}

.refresh-btn:disabled {
  opacity: 0.6;
}

/* 新增调试信息样式 */
.debug-info {
  margin-top: 20rpx;
  padding: 15rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  text-align: left;
}

.debug-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.debug-text {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 5rpx;
}
</style> 