<template>
	<view v-if="isOpen" class="sidebar">
		<!-- 顶部装饰元素 -->
		<view class="top-decoration">
			<image src="@/static/s1.png" mode="aspectFit" class="decoration-image"></image>
		</view>
		
		<!-- 菜单项 -->
		<view class="menu-items">
			<view 
				class="menu-item" 
				v-for="(item, index) in menuItems" 
				:key="index"
				@click="handleMenuClick(item)"
			>
				<view class="menu-icon">
					<image :src="item.icon" mode="aspectFit" class="icon-image"></image>
				</view>
				<text class="menu-text">{{ getMenuText(item) }}</text>
			</view>
		</view>
		
		<!-- 语言选择器 -->
		<view class="language-selector" @click="toggleLanguage">
			<text class="language-text">{{ currentLanguage }} ▼</text>
		</view>
		
		<!-- 底部装饰元素 -->
		<view class="bottom-decoration">
			<image src="@/static/s2.png" mode="aspectFit" class="decoration-image"></image>
		</view>
	</view>
</template>

<script>
import i18n from '@/utils/i18n.js';

export default {
	name: 'Sidebar',
	props: {
		isOpen: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			currentLanguage: '简体中文', // 当前语言
			menuItems: [
				{ 
					key: 'home',
					icon: '/static/x1.png', 
					action: 'home' 
				},
				{ 
					key: 'node_subscription',
					icon: '/static/x2.png', 
					action: 'node' 
				},
				{ 
					key: 'invite_friends',
					icon: '/static/x3.png', 
					action: 'invite' 
				},
				{ 
					key: 'profile',
					icon: '/static/x4.png', 
					action: 'profile' 
				},
				{ 
					key: 'recharge',
					icon: '/static/x5.png', 
					action: 'recharge' 
				},
				{ 
					key: 'records',
					icon: '/static/x6.png', 
					action: 'records' 
				}
			]
		}
	},
	watch: {
		isOpen(newVal) {
			console.log('Sidebar isOpen 变化:', newVal);
		}
	},
	mounted() {
		console.log('=== Sidebar 组件已挂载 ===');
		console.log('isOpen:', this.isOpen);
		// 初始化语言设置
		this.currentLanguage = i18n.getCurrentLanguage();
		console.log('Sidebar 初始化语言:', this.currentLanguage);
		// 测试 i18n 功能
		console.log('测试 i18n 翻译 - 首页:', i18n.t('home'));
		console.log('测试 i18n 翻译 - 节点认购:', i18n.t('node_subscription'));
		// 监听语言切换事件
		console.log('准备添加语言切换监听器');
		i18n.on('languageChanged', this.onLanguageChanged);
		console.log('Sidebar 已添加语言切换监听器');
		console.log('当前监听器数量:', i18n.listeners['languageChanged'] ? i18n.listeners['languageChanged'].length : 0);
		
		// 测试监听器是否工作
		setTimeout(() => {
			console.log('Sidebar: 5秒后测试监听器状态');
			console.log('当前监听器数量:', i18n.listeners['languageChanged'] ? i18n.listeners['languageChanged'].length : 0);
			if (i18n.listeners['languageChanged']) {
				console.log('监听器列表:', i18n.listeners['languageChanged'].map((listener, index) => `监听器${index + 1}: ${listener.name || '匿名函数'}`));
			}
		}, 5000);
	},
	beforeDestroy() {
		// 移除语言切换事件监听
		i18n.off('languageChanged', this.onLanguageChanged);
	},
	methods: {
		// 语言切换事件处理
		onLanguageChanged(newLanguage) {
			console.log('Sidebar 收到语言切换事件:', newLanguage);
			this.currentLanguage = newLanguage;
			// 强制更新组件以重新渲染菜单文本
			this.$forceUpdate();
			console.log('Sidebar 组件已强制更新');
		},
		
		// 获取菜单文本（根据当前语言）
		getMenuText(item) {
			return i18n.t(item.key);
		},
		
		// 切换语言
		toggleLanguage() {
			console.log('=== Sidebar 开始切换语言 ===');
			console.log('切换前语言:', i18n.getCurrentLanguage());
			console.log('切换前组件语言显示:', this.currentLanguage);
			
			const newLanguage = i18n.toggleLanguage();
			
			// 更新当前语言显示
			this.currentLanguage = newLanguage;
			
			// 显示切换提示
			uni.showToast({
				title: i18n.isChinese() ? '已切换到中文' : 'Switched to English',
				icon: 'success',
				duration: 1500
			});
			
			// 强制更新组件
			this.$forceUpdate();
			
			// 直接通知父组件语言已切换
			this.$emit('language-changed', newLanguage);
			
			// 尝试直接调用父组件的更新方法
			if (this.$parent && this.$parent.onLanguageChanged) {
				console.log('直接调用父组件的 onLanguageChanged 方法');
				this.$parent.onLanguageChanged(newLanguage);
			}
			
			// 语言切换后自动关闭侧边栏
			this.$emit('menu-click', 'close');
			console.log('语言切换完成，自动关闭侧边栏');
			
			console.log('=== Sidebar 语言切换完成 ===');
			console.log('切换后语言:', newLanguage);
			console.log('当前i18n语言:', i18n.getCurrentLanguage());
			console.log('测试翻译 - 首页:', i18n.t('home'));
			console.log('测试翻译 - 节点认购:', i18n.t('node_subscription'));
			console.log('当前组件语言显示:', this.currentLanguage);
		},
		
		handleMenuClick(item) {
			// 触发父组件事件
			this.$emit('menu-click', item);
			
			// 根据菜单项执行相应操作
			switch(item.action) {
				case 'home':
					uni.navigateTo({
						url: '/pages/wallet/wallet'
					});
					break;
				case 'node':
					uni.navigateTo({
						url: '/pages/wallet/subscription'
					});
					break;
				case 'invite':
					uni.navigateTo({
						url: '/pages/wallet/invitation'
					});
					break;
				case 'profile':
					uni.showToast({
						title: i18n.t('feature_coming_soon'),
						icon: 'none'
					});
					break;
				case 'recharge':
					uni.navigateTo({
						url: '/pages/wallet/recharge'
					});
					break;
				case 'records':
					uni.showToast({
						title: i18n.t('feature_coming_soon'),
						icon: 'none'
					});
					break;
			}
		}
	}
}
</script>

<style scoped>
.sidebar {
	position: fixed;
	top: 0;
	right: 0;
	width: 50%;
	height: 100vh;
	background: #000000;
	z-index: 9999;
	display: flex;
	flex-direction: column;
}

/* 顶部装饰 */
.top-decoration {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx 0;
	position: relative;
}

.decoration-image {
	width: 480rpx;
	height: 160rpx;
}

/* 菜单项 */
.menu-items {
	flex: 1;
	padding: 40rpx 20rpx;
    
}

.menu-item {
	display: flex;
	gap: 20rpx;
    text-align: center;
	padding: 30rpx 20rpx;
	margin-bottom: 20rpx;
	border-radius: 15rpx;
	transition: background-color 0.2s ease;
}

.menu-item:active {
	background: rgba(255, 255, 255, 0.1);
}

.menu-icon {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}
.menu-icon image {
	width: 100%;
	height: 100%;
}
.icon-image {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
}

.menu-text {
	color: white;
	font-size: 28rpx;
}

/* 语言选择器 */
.language-selector {
	padding: 30rpx 20rpx;
	text-align: center;
	border-top: 1rpx solid rgba(255, 255, 255, 0.1);
	transition: background-color 0.2s ease;
	cursor: pointer;
}

.language-selector:active {
	background: rgba(255, 255, 255, 0.1);
}

.language-text {
	color: white;
	font-size: 26rpx;
	user-select: none;
}

/* 底部装饰 */
.bottom-decoration {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx 0;
	position: relative;
}
</style> 