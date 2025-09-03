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
				<text class="menu-text">{{ item.text }}</text>
			</view>
		</view>
		
		<!-- 语言选择器 -->
		<view class="language-selector">
			<text class="language-text">简体中文 ▼</text>
		</view>
		
		<!-- 底部装饰元素 -->
		<view class="bottom-decoration">
			<image src="@/static/s2.png" mode="aspectFit" class="decoration-image"></image>
		</view>
	</view>
</template>

<script>
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
			menuItems: [
				{ text: '首页', icon: '@/static/x1.png', action: 'home' },
				{ text: '节点认购', icon: '@/static/x2.png', action: 'node' },
				{ text: '邀请好友', icon: '@/static/x3.png', action: 'invite' },
				{ text: '个人中心', icon: '@/static/x4.png', action: 'profile' },
				{ text: '充值', icon: '@/static/x5.png', action: 'recharge' },
				{ text: '记录', icon: '@/static/x6.png', action: 'records' }
			]
		}
	},
	watch: {
		isOpen(newVal) {
			console.log('Sidebar isOpen 变化:', newVal);
		}
	},
	mounted() {
		console.log('Sidebar 组件已挂载, isOpen:', this.isOpen);
	},
	methods: {
		handleMenuClick(item) {
			// 触发父组件事件
			this.$emit('menu-click', item);
			
			// 根据菜单项执行相应操作
			switch(item.action) {
				case 'home':
					uni.switchTab({
						url: '/pages/index/index'
					});
					break;
				case 'node':
					uni.showToast({
						title: '节点认购功能开发中',
						icon: 'none'
					});
					break;
				case 'invite':
					uni.navigateTo({
						url: '/pages/wallet/invitation'
					});
					break;
				case 'profile':
					uni.showToast({
						title: '个人中心功能开发中',
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
						title: '记录功能开发中',
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
}

.language-text {
	color: white;
	font-size: 26rpx;
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