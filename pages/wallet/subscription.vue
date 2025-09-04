<template>
	<view class="subscription-page">
		<!-- 顶部导航栏 -->
		<NavBar :title="nodeSubscriptionTitle" :showMenu="true" @toggle-menu="toggleSidebar" />
		
		<!-- 主要内容区域 -->
		<view class="main-content">
			<!-- 用户级别显示 -->
			<view v-if="userLevel" class="user-level-info">
				<text class="level-text">{{ currentLevelText }}: {{ userLevel }}</text>
			</view>
			
			<view class="image-container">
				<image src="@/static/x10.png" mode="aspectFit" ></image>
			</view>
			
			<!-- 节点认购卡片 -->
			<view class="node-cards-container">
				<!-- v1节点卡片 -->
				<view class="node-card" @click="handleNodeClick('v1')">
					<view class="card-emblem">
						<image src="@/static/x11.png" mode="aspectFit" class="emblem-image"></image>
					</view>
					<view class="card-content">
						<text class="node-title">{{ v1NodeText }}</text>
						<text class="node-subtitle">{{ basicNodeText }}</text>
						<text class="node-price">0.1 USDT</text>
						<image src="@/static/x12.png" mode="aspectFit" class="buy-button-image"></image>
					</view>
				</view>
                
				<!-- v2节点卡片 -->
				<view class="node-card" @click="handleNodeClick('v2')">
					<view class="card-emblem">
						<image src="@/static/x11.png" mode="aspectFit" class="emblem-image"></image>
					</view>
					<view class="card-content">
						<text class="node-title">{{ v2NodeText }}</text>
						<text class="node-subtitle">{{ genesisNodeText }}</text>
						<text class="node-price">1000 USDT</text>
						<image src="@/static/x12.png" mode="aspectFit" class="buy-button-image"></image>
					</view>
				</view>
				
				<!-- v3节点卡片 -->
				<view class="node-card" @click="handleNodeClick('v3')">
					<view class="card-emblem">
						<image src="@/static/x11.png" mode="aspectFit" class="emblem-image"></image>
					</view>
					<view class="card-content">
						<text class="node-title">{{ v3NodeText }}</text>
						<text class="node-subtitle">{{ superNodeText }}</text>
						<text class="node-price">5000 USDT</text>
						<image src="@/static/x12.png" mode="aspectFit" class="buy-button-image"></image>
					</view>
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
	import NavBar from "@/components/NavBar.vue";
	import Sidebar from "@/components/Sidebar.vue";
	import walletManager from "@/utils/wallet-manager.js";
	import { getRechargeContractConfig, getUSDTContractConfig } from "@/config/contracts.js";
	import ajax from '@/utils/ajax.js';
	import i18n from '@/utils/i18n.js';
	
	export default {
		name: "Subscription",
		components: {
			NavBar,
			Sidebar
		},
		data() {
			return {
				sidebarOpen: false, // 侧边栏状态
				userLevel: '', // 用户级别
				loadingLevel: false, // 级别加载状态
				// 国际化文本数据属性
				nodeSubscriptionTitle: '节点认购',
				currentLevelText: '当前级别',
				v1NodeText: 'v1节点',
				basicNodeText: '基础节点',
				v2NodeText: 'v2节点',
				genesisNodeText: '创世节点',
				v3NodeText: 'v3节点',
				superNodeText: '超级节点'
			}
	},
	onLoad() {
		console.log("=== subscription页面加载 ===");
		//this.getUserLevel();
		// 测试 i18n 功能
		console.log("测试 i18n 翻译 - 节点认购标题:", i18n.t('node_subscription_title'));
		console.log("测试 i18n 翻译 - v1节点:", i18n.t('v1_node'));
		// 初始化国际化文本
		this.updateI18nTexts();
		// 监听语言切换事件
		console.log("准备添加语言切换监听器");
		i18n.on('languageChanged', this.onLanguageChanged);
		console.log("subscription页面已添加语言切换监听器");
		console.log("当前监听器数量:", i18n.listeners['languageChanged'] ? i18n.listeners['languageChanged'].length : 0);
		
		// 测试监听器是否工作
		console.log("测试监听器功能");
		setTimeout(() => {
			console.log("5秒后测试监听器状态");
			console.log("当前监听器数量:", i18n.listeners['languageChanged'] ? i18n.listeners['languageChanged'].length : 0);
			if (i18n.listeners['languageChanged']) {
				console.log("监听器列表:", i18n.listeners['languageChanged'].map((listener, index) => `监听器${index + 1}: ${listener.name || '匿名函数'}`));
			}
		}, 5000);
	},
	onShow() {
		console.log("=== subscription页面显示 ===");
		//this.getUserLevel();
		// 确保监听器被注册
		console.log("检查监听器状态");
		console.log("当前监听器数量:", i18n.listeners['languageChanged'] ? i18n.listeners['languageChanged'].length : 0);
		
		// 强制重新注册监听器
		console.log("强制重新注册语言切换监听器");
		i18n.off('languageChanged', this.onLanguageChanged); // 先移除
		i18n.on('languageChanged', this.onLanguageChanged); // 再添加
		console.log("重新注册完成，当前监听器数量:", i18n.listeners['languageChanged'] ? i18n.listeners['languageChanged'].length : 0);
	},
	onUnload() {
		// 移除语言切换事件监听
		i18n.off('languageChanged', this.onLanguageChanged);
	},
		methods: {
			// 语言切换事件处理
			onLanguageChanged(newLanguage) {
				console.log('=== subscription页面收到语言切换事件 ===');
				console.log('事件参数:', newLanguage);
				console.log('当前i18n语言:', i18n.getCurrentLanguage());
				console.log('更新前文本:', {
					nodeSubscriptionTitle: this.nodeSubscriptionTitle,
					v1NodeText: this.v1NodeText,
					basicNodeText: this.basicNodeText
				});
				
				// 直接更新所有国际化文本
				this.nodeSubscriptionTitle = i18n.t('node_subscription_title');
				this.currentLevelText = i18n.t('current_level');
				this.v1NodeText = i18n.t('v1_node');
				this.basicNodeText = i18n.t('basic_node');
				this.v2NodeText = i18n.t('v2_node');
				this.genesisNodeText = i18n.t('genesis_node');
				this.v3NodeText = i18n.t('v3_node');
				this.superNodeText = i18n.t('super_node');
				
				console.log('=== subscription页面文本更新完成 ===');
				console.log('更新后文本:', {
					nodeSubscriptionTitle: this.nodeSubscriptionTitle,
					v1NodeText: this.v1NodeText,
					basicNodeText: this.basicNodeText
				});
			},
			
			// 更新国际化文本
			updateI18nTexts() {
				console.log('初始化国际化文本，当前语言:', i18n.getCurrentLanguage());
				this.nodeSubscriptionTitle = i18n.t('node_subscription_title');
				this.currentLevelText = i18n.t('current_level');
				this.v1NodeText = i18n.t('v1_node');
				this.basicNodeText = i18n.t('basic_node');
				this.v2NodeText = i18n.t('v2_node');
				this.genesisNodeText = i18n.t('genesis_node');
				this.v3NodeText = i18n.t('v3_node');
				this.superNodeText = i18n.t('super_node');
				console.log('国际化文本初始化完成');
			},
			
			// 获取用户级别
			async getUserLevel() {
				try {
					this.loadingLevel = true;
					console.log('开始获取用户级别...');
					
					const result = await ajax.post('/api/wanlshop/user/getuserlvname', {});
					
					console.log('用户级别查询结果:', result);
					
					if (result && result.data) {
						this.userLevel = result.data.lvname || result.data.level || '';
						console.log('当前用户级别:', this.userLevel);
					}
					
				} catch (error) {
					console.error('获取用户级别失败:', error);
					this.userLevel = '';
					
					// 不显示错误提示，因为级别信息不是关键功能
					// uni.showToast({
					//     title: '获取用户级别失败',
					//     icon: 'none'
					// });
				} finally {
					this.loadingLevel = false;
				}
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
			},
			
			// 图片加载成功
			onImageLoad() {
				console.log('图片加载成功: x10.png');
			},
			
			// 图片加载失败
			onImageError(e) {
				console.error('图片加载失败:', e);
				uni.showToast({
					title: '图片加载失败',
					icon: 'none'
				});
			},
			
			// 处理节点点击
			handleNodeClick(nodeType) {
				console.log('点击节点:', nodeType);
				
				// 获取节点价格
				const nodePrices = {
					'v1': 0.1,
					'v2': 1000,
					'v3': 5000
				};
				
				const price = nodePrices[nodeType];
				if (!price) {
					uni.showToast({
						title: '节点类型错误',
						icon: 'none'
					});
					return;
				}
				
				uni.showModal({
					title: i18n.t('confirm_subscription'),
					content: `${i18n.t('confirm_subscription')}${nodeType}${i18n.t('node_subscription')}？\n\n${i18n.t('recharge_amount')}: ${price} USDT\n\n${i18n.t('confirm')}：\n1. ${i18n.t('subscription_processing')}\n2. ${i18n.t('gas_fee_required')}\n3. ${i18n.t('ensure_network_stable')}`,
					success: (res) => {
						if (res.confirm) {
							this.processNodeSubscription(nodeType, price);
						}
					}
				});
			},
			
			// 执行节点认购
			async processNodeSubscription(nodeType, amount) {
				uni.showLoading({
					title: i18n.t('subscription_processing')
				});

				try {
					// 检查钱包服务状态
					if (!walletManager.currentService) {
						throw new Error(i18n.t('please_connect_wallet'));
					}

					// 检查钱包连接状态
					const networkInfo = await walletManager.getNetworkInfo();
					if (!networkInfo.isConnected || !networkInfo.account) {
						throw new Error(i18n.t('please_connect_wallet'));
					}

					console.log("开始节点认购流程，节点类型:", nodeType, "金额:", amount, "USDT");

					// 调用智能合约进行节点认购
					const result = await this.callNodeSubscriptionContract(nodeType, amount);

					if (result.success) {
						// 认购成功
						uni.hideLoading();
						uni.showToast({
							title: i18n.t('subscription_success'),
							icon: "success"
						});

						// 显示成功信息
						setTimeout(() => {
							uni.showModal({
								title: i18n.t('subscription_success'),
								content: `${i18n.t('subscription_success')} ${nodeType} ${i18n.t('node_subscription')}\n\n${i18n.t('recharge_amount')}: ${amount} USDT\n\n${i18n.t('transaction_success')}: ${result.txHash}\n\n${i18n.t('network')}: ${result.networkName}`,
								showCancel: false,
								success: () => {
									// 支付成功后的回调处理
									this.onPaymentSuccess(nodeType, amount, result);
								}
							});
						}, 1000);

					} else {
						throw new Error(result.error || i18n.t('subscription_failed'));
					}

				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: error.message || i18n.t('subscription_failed') + i18n.t('please_try_again'),
						icon: "none"
					});
					console.error("节点认购失败:", error);
				}
			},
			
			// 获取银行信息（包含USDT地址）
			async getBankInfo() {
				try {
					console.log('开始获取银行信息...');
					
					const result = await ajax.get('/api/common/bankinfo');
					
					console.log('银行信息查询结果:', result);
					
					if (result && result.code === 1 && result.data) {
						const usdtAddress = result.data.usdtaddress;
						if (usdtAddress) {
							console.log('获取到USDT地址:', usdtAddress);
							return usdtAddress;
						} else {
							throw new Error('USDT地址为空');
						}
					} else {
						throw new Error(result.msg || '获取银行信息失败');
					}
					
				} catch (error) {
					console.error('获取银行信息失败:', error);
					throw error;
				}
			},

			// 调用节点认购合约
			async callNodeSubscriptionContract(nodeType, amount) {
				try {
					console.log("调用节点认购合约开始");

					// 通过接口获取USDT充值地址
					let contractAddress;
					try {
						contractAddress = await this.getBankInfo();
						console.log("从接口获取的合约地址:", contractAddress);
					} catch (error) {
						console.warn("接口获取合约地址失败，使用配置文件作为降级方案:", error.message);
						
						// 降级方案：使用配置文件中的充值合约地址
						const rechargeConfig = getRechargeContractConfig();
						contractAddress = rechargeConfig.address;
						console.log("使用配置文件中的合约地址:", contractAddress);
					}

					// 使用USDT代币转账方法
					const result = await walletManager.sendUSDTTransaction(
						contractAddress, // 合约地址
						amount // USDT金额
					);

					console.log("节点认购转账结果:", result);

					if (result.success) {
						// 获取网络名称（用于显示）
						const rechargeConfig = getRechargeContractConfig();
						
						return {
							success: true,
							txHash: result.txHash,
							message: "节点认购成功",
							contractAddress: result.contractAddress,
							amount: result.amount,
							nodeType: nodeType,
							networkName: rechargeConfig.networkName
						};
					} else {
						return {
							success: false,
							error: result.error || "节点认购失败"
						};
					}

				} catch (error) {
					console.error("调用节点认购合约失败:", error);
					return {
						success: false,
						error: error.message || "节点认购失败"
					};
				}
			},
			
			// 支付成功回调处理
			async onPaymentSuccess(nodeType, amount, result) {
				console.log('支付成功回调:', {
					nodeType,
					amount,
					txHash: result.txHash,
					contractAddress: result.contractAddress,
					networkName: result.networkName
				});
				
				// 记录购买历史到本地存储
				this.savePurchaseHistory(nodeType, amount, result);
				
				// 调用后端接口更新用户节点状态
				await this.updateUserNode(amount);
				
				// 刷新用户级别（因为购买节点可能影响级别）
				//await this.getUserLevel();
			},
			
			// 更新用户节点状态
			async updateUserNode(amount) {
				try {
					console.log('开始更新用户节点状态，金额:', amount);
					
					const result = await ajax.post('/api/wanlshop/user/upNode', {
						amount: amount
					});
					
					console.log('用户节点状态更新成功:', result);
					
					// 可以在这里处理更新成功后的逻辑
					// 例如显示成功提示、刷新用户数据等
					
				} catch (error) {
					console.error('更新用户节点状态失败:', error);
					
					// 即使后端接口调用失败，也不影响前端的支付成功状态
					// 因为区块链交易已经成功，只是后端同步可能有问题
					uni.showToast({
						title: '节点状态同步中，请稍后查看',
						icon: 'none',
						duration: 3000
					});
				}
			},
			
			// 保存购买历史
			savePurchaseHistory(nodeType, amount, result) {
				try {
					// 获取现有的购买历史
					let purchaseHistory = uni.getStorageSync('node_purchase_history') || [];
					
					// 添加新的购买记录
					const newPurchase = {
						nodeType: nodeType,
						amount: amount,
						txHash: result.txHash,
						contractAddress: result.contractAddress,
						networkName: result.networkName,
						timestamp: new Date().toISOString(),
						status: 'completed'
					};
					
					purchaseHistory.unshift(newPurchase); // 添加到开头
					
					// 只保留最近50条记录
					if (purchaseHistory.length > 50) {
						purchaseHistory = purchaseHistory.slice(0, 50);
					}
					
					// 保存到本地存储
					uni.setStorageSync('node_purchase_history', purchaseHistory);
					
					console.log('购买历史已保存:', newPurchase);
				} catch (error) {
					console.error('保存购买历史失败:', error);
				}
			}
		}
	}
</script>

<style scoped>
.subscription-page {
	min-height: 100vh;
	background-image: url(@/static/back.png);
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	padding: 0;
}

.main-content {
	padding: 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	min-height: calc(100vh - 200rpx);
}

/* 用户级别信息 */
.user-level-info {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 20rpx;
	padding: 20rpx 30rpx;
	margin-bottom: 30rpx;
	backdrop-filter: blur(10px);
	border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.level-text {
	color: #fff;
	font-size: 28rpx;
	font-weight: 500;
}

.image-container {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
}

.question-block-image {
	width: 100%;
	max-width: 600rpx;
	height: auto;
}

/* 节点卡片容器 */
.node-cards-container {
	display: flex;
	justify-content: space-between;
	width: 100%;
	max-width: 600rpx;
	gap: 20rpx;
	flex-wrap: wrap;
}

/* 节点卡片 */
.node-card {
	width: 48%;
	background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(106, 3, 34, 0.6) 100%);
	border-radius: 20rpx;
	padding: 30rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 2rpx solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
	transition: all 0.3s ease;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}

.node-card:active {
	transform: scale(0.98);
}

/* 卡片徽章 */
.card-emblem {
	margin-bottom: 20rpx;
}

.emblem-image {
	width: 120rpx;
	height: 120rpx;
}

/* 卡片内容 */
.card-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

.node-title {
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
}

.node-subtitle {
	color: rgba(255, 255, 255, 0.8);
	font-size: 24rpx;
	margin-bottom: 10rpx;
}

.node-price {
	color: #4CAF50;
	font-size: 28rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
}

/* 购买按钮图片 */
.buy-button-image {
	width: 100%;
	height: 60rpx;
	transition: all 0.3s ease;
}

.buy-button-image:active {
	transform: scale(0.95);
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