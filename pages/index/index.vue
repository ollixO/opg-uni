<template>
	<view class="content">
		<!-- 背景图 -->
		<image class="background-image" src="/static/register.png" mode="aspectFill"></image>
		
		<!-- 连接钱包按钮 -->
		<view class="connect-button-container">
			<button class="connect-button" @click="connectWallet">
				<image class="button-image" src="/static/register1.png" mode="aspectFit"></image>
			</button>
		</view>
		
		<!-- 连接成功提示 -->
		<view v-if="walletConnected" class="success-section">
			<view class="success-card">
				<text class="success-title">钱包连接成功！</text>
				<text class="success-desc">正在跳转到钱包页面...</text>
			</view>
		</view>
	</view>
</template>

<script>
	import walletManager from '../../utils/wallet-manager.js';
	
	export default {
		data() {
			return {
				walletConnected: false
			}
		},
		methods: {
			// 连接钱包按钮点击事件
			async connectWallet() {
				console.log('点击连接钱包按钮');
				try {
					const result = await walletManager.connectWallet();
					if (result.success) {
						this.walletConnected = true;
						// 连接成功后跳转到钱包页面
						setTimeout(() => {
							uni.navigateTo({
								url: '/pages/wallet/wallet',
								success: () => {
									console.log('跳转到钱包页面成功');
								},
								fail: (error) => {
									console.error('跳转失败:', error);
									uni.showToast({
										title: '跳转失败',
										icon: 'none'
									});
								}
							});
						}, 1000);
					} else {
						uni.showToast({
							title: '连接失败: ' + result.error,
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('连接钱包失败:', error);
					uni.showToast({
						title: '连接失败',
						icon: 'none'
					});
				}
			}
		}
	}
</script>

<style>
	.content {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
	}
	
	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}
	
	.connect-button-container {
		position: absolute;
		bottom: 200rpx;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
	}
	
	.connect-button {
		background: transparent;
		border: none;
		padding: 0;
		width: 400rpx;
		height: 150rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.button-image {
		width: 100%;
		height: 100%;
	}
	
	.success-section {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 20;
		padding: 40rpx 20rpx;
	}
	
	.success-card {
		background: rgba(0, 255, 0, 0.15);
		backdrop-filter: blur(15rpx);
		border-radius: 20rpx;
		padding: 40rpx;
		text-align: center;
		border: 1rpx solid rgba(0, 255, 0, 0.3);
	}
	
	.success-icon {
		display: block;
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}
	
	.success-title {
		display: block;
		font-size: 36rpx;
		color: white;
		font-weight: bold;
		margin-bottom: 15rpx;
	}
	
	.success-desc {
		display: block;
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
	}
</style>
