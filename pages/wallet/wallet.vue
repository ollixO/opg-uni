<template>
	<view class="wallet-page">
		<!-- 顶部状态栏 -->
		
		<!-- 头部信息 -->
		<view class="header-section">
			
			<view class="user-info">
				<view class="avatar">
					<text class="avatar-placeholder">👤</text>
				</view>
				<view class="user-details">
					<text class="username">{{ formatAddress(walletAddress) || 'awm21萨法' }}</text>
					<text class="user-id">{{ userLevel || '普通会员' }}</text>
				</view>
				<view class="balance-display" @click="refreshBalance">
					<text class="balance-text">{{ balanceText }}:</text>
					<text class="balance-value">{{ balance }} U</text>
					<text class="add-icon">{{ refreshing ? '⟳' : '+' }}</text>
				</view>
				<view class="action-icons" >
					<image class="icon" src="@/static/right.png" @click="toggleSidebar"></image>
				</view>
			</view>
		</view>
		
		<!-- 连接状态提示 -->
		<view v-if="!walletConnected" class="connection-notice">
			<text class="notice-text">{{ walletDisconnectedText }}</text>
			<button class="connect-btn" @click="goToConnect">{{ connectWalletText }}</button>
		</view>
		
		<!-- 主要内容区域 - 3x3网格卡片 -->
		<view class="main-content">
			<view class="cards-grid">
				<view class="card" v-for="(item, index) in lobbyCards" :key="index" @click="openLobby(item)">
					<view class="card-content">
						<text class="time-duration">{{ item.duration }}</text>
						<text class="lobby-type">{{ item.type }}</text>
						<text class="open-time">{{ item.openTime }}</text>
						<text class="time-per-session">{{ item.timePerSession }}</text>
						<text class="remaining-quota">剩余额度:{{ item.remainingQuota }}</text>
					</view>
					<image class="open-btn" src="@/static/kaifang.png" @click="openLobby(item)"></image>
				</view>
			</view>
		</view>
		

		
		<!-- 侧边栏组件 -->
		<Sidebar 
			:isOpen="sidebarOpen" 
			@menu-click="handleSidebarMenuClick"
			@language-changed="onLanguageChanged"
		/>
		
		<!-- 遮罩层 -->
		<view 
			v-if="sidebarOpen" 
			class="sidebar-overlay" 
			@click="closeSidebar"
		></view>
	</view>
</template>

<script>
	import walletManager from '@/utils/wallet-manager.js';
	import Sidebar from '@/components/Sidebar.vue';
	import i18n from '@/utils/i18n.js';
	import ajax from '@/utils/ajax.js';
	
	export default {
		components: {
			Sidebar
		},
		data() {
			return {
				// 钱包相关数据
				walletConnected: false,
				walletAddress: '',
				balance: 0,
				chainId: null,
				username: 'awm21萨法',
				refreshing: false,
				// 侧边栏状态
				sidebarOpen: false,
				// 国际化文本
				balanceText: '余额',
				walletDisconnectedText: '钱包未连接',
				connectWalletText: '连接钱包',
				
				// 大厅卡片数据
				lobbyCards: [],
				
				// 级别数据
				level_name_list: {},
				userLevel: '' // 用户级别显示
			}
		},
		onLoad() {
			console.log('钱包页面加载，检查连接状态...');
			this.checkWalletStatus();
			// 初始化国际化文本
			this.updateI18nTexts();
			// 监听语言切换事件
			i18n.on('languageChanged', this.onLanguageChanged);
			console.log('wallet页面已添加语言切换监听器');
			// 获取用户级别信息
			this.getUserLevel();
			
		},
		onShow() {
			console.log('钱包页面显示，检查钱包状态...');
			this.checkWalletStatus();
		},
		onUnload() {
			// 移除语言切换事件监听
			i18n.off('languageChanged', this.onLanguageChanged);
		},
		methods: {
			// 语言切换事件处理
			onLanguageChanged(newLanguage) {
				console.log('=== wallet页面收到语言切换事件 ===');
				console.log('事件参数:', newLanguage);
				console.log('当前i18n语言:', i18n.getCurrentLanguage());
				// 更新所有国际化文本
				this.updateI18nTexts();
				console.log('=== wallet页面文本更新完成 ===');
			},
			
			// 获取用户级别信息
			async getUserLevel() {
				try {
					console.log('开始获取用户级别信息...');
					
					const result = await ajax.post('/api/wanlshop/user/getuserlvname', {});
					
					console.log('用户级别查询结果:', result);
					
					if (result && result.code === 1 && result.data) {
						this.level_name_list = result.data;
						console.log('级别信息获取成功:', this.level_name_list);
						
						// 收集所有有值的级别
						const levels = [];
						if (result.data.level_name1 && result.data.level_name1.trim() !== '') {
							levels.push(result.data.level_name1);
						}
						if (result.data.level_name2 && result.data.level_name2.trim() !== '') {
							levels.push(result.data.level_name2);
						}
						if (result.data.level_name3 && result.data.level_name3.trim() !== '') {
							levels.push(result.data.level_name3);
						}
						
						// 如果有级别信息，用逗号连接显示；否则显示默认级别
						this.userLevel = levels.length > 0 ? levels.join('、') : '普通会员';
						
						console.log('当前用户级别:', this.userLevel);
					} else {
						console.log('级别接口返回错误:', result);
						this.userLevel = '普通会员'; // 默认级别
					}
					
				} catch (error) {
					console.error('获取用户级别信息异常:', error);
					this.userLevel = '普通会员'; // 默认级别
				}
			},
			
			// 更新国际化文本
			updateI18nTexts() {
				console.log('wallet页面更新国际化文本，当前语言:', i18n.getCurrentLanguage());
				this.balanceText = i18n.t('current_balance');
				this.walletDisconnectedText = i18n.t('wallet_disconnected');
				this.connectWalletText = i18n.t('connect_wallet');
				
				// 更新大厅卡片数据
				this.lobbyCards = [
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					},
					{
						duration: `3${i18n.t('minutes')}`,
						type: i18n.t('lobby'),
						openTime: i18n.t('open_time'),
						timePerSession: `3${i18n.t('minutes_per_session')}`,
						remainingQuota: 120,
						buttonText: i18n.t('open')
					}
				];
				
				console.log('wallet页面国际化文本更新完成');
			},
			
			// 检查钱包状态
			async checkWalletStatus() {
				try {
					const networkInfo = await walletManager.getNetworkInfo();
					console.log('钱包页面检查状态:', networkInfo);
					
					if (networkInfo.isConnected && networkInfo.account) {
						this.walletConnected = true;
						this.walletAddress = networkInfo.account;
						this.chainId = networkInfo.chainId;
						// 加载余额
						await this.loadBalance();
					} else {
						this.walletConnected = false;
						this.walletAddress = '';
						this.chainId = null;
						this.balance = 0;
					}
				} catch (error) {
					console.error('检查钱包状态失败:', error);
					this.walletConnected = false;
					this.walletAddress = '';
					this.balance = 0;
				}
			},
			
			// 加载余额
			async loadBalance() {
				try {
					const result = await walletManager.getUSDTBalance(this.walletAddress);
					if (result.success) {
						this.balance = result.balance;
						console.log('余额加载成功:', this.balance);
					} else {
						console.warn('余额加载失败:', result.error);
						this.balance = 0;
					}
				} catch (error) {
					console.error('加载余额失败:', error);
					this.balance = 0;
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
					await this.loadBalance();
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
			
			// 格式化地址显示
			formatAddress(address) {
				if (!address) return '';
				if (address.length <= 10) return address;
				return address.substring(0, 6) + '...' + address.substring(address.length - 4);
			},
			
			// 获取货币符号
			getCurrencySymbol() {
				if (this.chainId === 1) return 'TRX';
				if (this.chainId === 10) return 'ETH';
				if (this.chainId === 56) return 'BNB';
				return 'TOKEN';
			},
			
			// 复制地址
			copyAddress() {
				if (this.walletAddress) {
					uni.setClipboardData({
						data: this.walletAddress,
						success: () => {
							uni.showToast({
								title: '地址已复制',
								icon: 'success'
							});
						}
					});
				} else {
					uni.showToast({
						title: '无地址可复制',
						icon: 'none'
					});
				}
			},
			
			// 跳转到连接页面
			goToConnect() {
				uni.navigateTo({
					url: '/pages/index/index'
				});
			},
			
			// 显示设置
			showSettings() {
				uni.showToast({
					title: '设置功能开发中',
					icon: 'none'
				});
			},
			
			// 打开大厅
			openLobby(item) {
				if (!this.walletConnected) {
					uni.showToast({
						title: '请先连接钱包',
						icon: 'none'
					});
					return;
				}
				
				uni.showToast({
					title: '开启大厅功能',
					icon: 'none'
				});
			},
			
			// 切换侧边栏
			toggleSidebar() {
				console.log('toggleSidebar 被调用，当前状态:', this.sidebarOpen);
				this.sidebarOpen = !this.sidebarOpen;
				console.log('切换后状态:', this.sidebarOpen);
			},
			
			// 关闭侧边栏
			closeSidebar() {
				this.sidebarOpen = false;
			},
			
			// 处理侧边栏菜单点击
			handleSidebarMenuClick(item) {
				console.log('侧边栏菜单点击:', item);
				this.closeSidebar();
			}
		}
	}
</script>

<style>
	.wallet-page {
		min-height: 100vh;
		background-image: url(@/static/back.png);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		color: white;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 40rpx;
		font-size: 28rpx;
		font-weight: bold;
	}
	
	.time {
		color: white;
	}
	
	.status-icons {
		display: flex;
		gap: 10rpx;
	}
	
	.signal, .wifi, .battery {
		color: white;
		font-size: 24rpx;
	}
	
	.header-section {
		padding: 20rpx 40rpx;
	}
	
	.page-selector {
		margin-bottom: 30rpx;
	}
	
	.page-title {
		color: #ff6b6b;
		font-size: 28rpx;
		font-weight: bold;
	}
	
	.user-info {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-bottom: 40rpx;
	}
	
	.avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: linear-gradient(45deg, #667eea, #764ba2);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.avatar-placeholder {
		font-size: 40rpx;
	}
	
	.user-details {
		flex: 1;
	}
	
	.username {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 10rpx;
	}
	
	.user-id {
		display: block;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.7);
	}
	
	.balance-display {
		border-radius: 50rpx;
		padding: 10rpx 10rpx;
		display: flex;
		align-items: center;
		gap: 15rpx;
		border: 2rpx solid #ffffff;
	}
	
	.balance-text {
		color: white;
		font-size: 22rpx;
		font-weight: bold;
		white-space: nowrap;
	}
	
	.balance-value {
		color: white;
		font-size: 28rpx;
		font-weight: bold;
		margin-left: 10rpx;
	}
	
	.add-icon {
		background: white;
		color: #ff6b6b;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		font-weight: bold;
	}
	
	.action-icons {
		display: flex;
		gap: 20rpx;
		cursor: pointer;
		padding: 10rpx;
		border-radius: 10rpx;
		transition: background-color 0.2s ease;
	}
	
	.action-icons:active {
		background: rgba(255, 255, 255, 0.1);
	}
	
	.icon {
		width: 36rpx;
		height: 36rpx;
	}
	
	.main-content {
		padding: 0 40rpx 40rpx;
	}
	
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
	}
	
	.card {
		background: linear-gradient(28deg, #000000 0%, #6A0322 52%, #000000 100%);
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
		border-color: 1px solid #ffffff;
		border: 2rpx solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10rpx);
		display: flex;
		flex-direction: column;
		min-height: 280rpx;
	}
	
	.card-content {
		flex: 1;
		text-align: center;
		margin-bottom: 20rpx;
	}
	
	.time-duration {
		display: block;
		font-size: 36rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 15rpx;
	}
	
	.lobby-type {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 20rpx;
	}
	
	.open-time {
		display: block;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 8rpx;
	}
	
	.time-per-session {
		display: block;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 15rpx;
	}
	
	.remaining-quota {
		display: block;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 20rpx;
	}
	
	.open-btn {
		width: 100%;
		height: 60rpx;
	}
	
	.open-btn:active {
		transform: scale(0.95);
		opacity: 0.8;
	}
	
	.connection-notice {
		background: rgba(255, 107, 107, 0.2);
		border: 1rpx solid rgba(255, 107, 107, 0.5);
		border-radius: 15rpx;
		margin: 20rpx 40rpx;
		padding: 30rpx;
		text-align: center;
		backdrop-filter: blur(10rpx);
	}
	
	.notice-text {
		display: block;
		color: #ff6b6b;
		font-size: 26rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
	}
	
	.connect-btn {
		background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
		border: none;
		border-radius: 12rpx;
		color: white;
		font-size: 24rpx;
		font-weight: bold;
		padding: 15rpx 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
	}
	
	.connect-btn:active {
		transform: scale(0.95);
		opacity: 0.8;
	}
	

	
	/* 遮罩层 */
	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 9998;
	}
</style> 

