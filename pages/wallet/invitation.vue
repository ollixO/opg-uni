<template>
	<view class="invitation-page">
	
		
		
		<NavBar title="邀请好友" :showMenu="true" @toggle-menu="toggleSidebar" />
		
		<!-- 主要内容区域 -->
		<view class="main-content">
			<!-- 问号方块图形 -->
			<view class="question-block-container">
				<image src="/static/x7.png" mode="aspectFit" class="question-block-image"></image>
			</view>
			
			<!-- 邀请卡片 -->
			<view class="invitation-card">
				<!-- 卡片头部金色横幅 -->
				<view class="card-header">
					<image src="/static/x8.png" mode="aspectFit" class="card-title-image"></image>
				</view>
				
				<!-- 卡片内容 -->
				<view class="card-body">
					<view class="link-label">
						<text class="label-text">邀请链接:</text>
					</view>
					
					<view class="link-display">
						<text class="link-text">{{ inviteLink }}</text>
					</view>
					
					<button class="copy-link-btn" @click="copyInviteLink">
						<image src="/static/x9.png" mode="aspectFit" class="copy-btn-image"></image>
					</button>
				</view>
			</view>
		</view>
		
		<!-- 侧边栏组件 -->
		<Sidebar 
			:isOpen="sidebarOpen" 
			@menu-click="handleSidebarMenuClick"
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
import NavBar from "../../components/NavBar.vue";
import Sidebar from "../../components/Sidebar.vue";

export default {
	data() {
		return {
			inviteCode: '', // 邀请码
			inviteLink: '', // 邀请链接
			sidebarOpen: false // 侧边栏状态
		}
	},
    components: {
            NavBar,
            Sidebar
    },
	onLoad() {
		this.initInviteData();
	},
			methods: {
			// 初始化邀请数据
			initInviteData() {
				// 生成邀请链接
				this.inviteLink = this.generateInviteLink();
				console.log('邀请链接:', this.inviteLink);
			},
			
			// 生成邀请链接
			generateInviteLink() {
				// 获取当前域名
				let baseUrl = '';
				// #ifdef H5
				baseUrl = window.location.origin + window.location.pathname;
				// #endif
				
				// #ifndef H5
				baseUrl = 'https://opg.easyenjoy.world';
				// #endif
				
				// 获取存储的邀请码
				const inviteCode = uni.getStorageSync('invite_code') || '';
				
				// 生成邀请链接
				if (inviteCode) {
					return `${baseUrl}?invite_code=${inviteCode}`;
				} else {
					return baseUrl;
				}
			},
			
			// 复制邀请链接
			copyInviteLink() {
				// #ifdef H5
				if (navigator.clipboard) {
					navigator.clipboard.writeText(this.inviteLink).then(() => {
						uni.showToast({
							title: '邀请链接已复制',
							icon: 'success'
						});
					}).catch(() => {
						this.fallbackCopy(this.inviteLink);
					});
				} else {
					this.fallbackCopy(this.inviteLink);
				}
				// #endif
				
				// #ifndef H5
				uni.setClipboardData({
					data: this.inviteLink,
					success: () => {
						uni.showToast({
							title: '邀请链接已复制',
							icon: 'success'
						});
					}
				});
				// #endif
			},
			
			// 备用复制方法
			fallbackCopy(text) {
				const textArea = document.createElement('textarea');
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
				try {
					document.execCommand('copy');
					uni.showToast({
						title: '已复制到剪贴板',
						icon: 'success'
					});
				} catch (err) {
					uni.showToast({
						title: '复制失败',
						icon: 'none'
					});
				}
				document.body.removeChild(textArea);
			},
			
			// 切换菜单
			toggleMenu() {
				uni.navigateBack();
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

<style scoped>
.invitation-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #000000 0%, #6A0322 100%);
	color: white;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	position: relative;
}

/* 状态栏 */
.status-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
	color: white;
}

.status-icons {
	display: flex;
	gap: 10rpx;
	font-size: 24rpx;
}

/* 头部标题 */
.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 40rpx;
	margin-bottom: 60rpx;
}

.header-title {
	font-size: 48rpx;
	font-weight: bold;
	color: white;
}

.menu-icon {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 10rpx;
}

.menu-text {
	font-size: 32rpx;
	color: white;
}

/* 主要内容区域 */
.main-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 40rpx;
	height: calc(100vh - 200rpx);
}

/* 问号方块图片 */
.question-block-container {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 40rpx;
	margin-top: 160rpx;
}

.question-block-image {
	width: 300rpx;
	height: 300rpx;
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%, 100% { transform: translateY(0rpx); }
	50% { transform: translateY(-20rpx); }
}

/* 邀请卡片 */
.invitation-card {
	width: 100%;
	max-width: 600rpx;
	background: linear-gradient(28deg, #000000 0%, #6A0322 52%, #000000 100%);
	border-radius: 30rpx;
	overflow: visible;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
	border: 2rpx solid #ffffff;
}

/* 卡片头部 */
.card-header {
	background: transparent;
	padding: 10rpx 30rpx 20rpx 30rpx;
	text-align: center;
	position: relative;
}

.card-title-image {
	width: 200rpx;
	height: 60rpx;
	position: relative;
	z-index: 2;
	margin-top: -20rpx;
}

/* 卡片内容 */
.card-body {
	padding: 40rpx 30rpx;
}

.link-label {
	margin-bottom: 20rpx;
}

.label-text {
	font-size: 32rpx;
	color: white;
	font-weight: 500;
}

.link-display {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 15rpx;
	padding: 25rpx;
	margin-bottom: 30rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.link-text {
	font-size: 24rpx;
	color: white;
	word-break: break-all;
	line-height: 1.4;
}

.copy-link-btn {
	width: 100%;
	background: transparent;
	border: none;
	padding: 20rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
	transition: all 0.3s ease;
}

.copy-link-btn:active {
	transform: translateY(2rpx);
}

.copy-btn-image {
	width: 100%;
	height: 100rpx;
	object-fit: contain;
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