<template>
	<view class="content">
		<!-- 背景图 -->
		<image class="background-image" src="@/static/register.png" mode="aspectFill"></image>
		
		<!-- 连接钱包按钮 -->
		<view class="connect-button-container">
			<button class="connect-button" @click="connectWallet">
				<image class="button-image" src="@/static/register1.png" mode="aspectFit"></image>
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
	import walletManager from '@/utils/wallet-manager.js';
	import ajax from '@/utils/ajax.js';
	
	export default {
		data() {
			return {
				walletConnected: false,
				loading: false,
				inviteCode: '', // 邀请码
				walletAddress: '' // 钱包地址
			}
		},
		onLoad(options) {
			console.log('index页面加载', options);
			// 获取邀请码
			this.getInviteCode(options);
			// 页面加载时可以进行一些初始化操作
			this.initPage();
		},
		methods: {
			// 获取邀请码
			getInviteCode(options) {
				// 方式1: 从页面参数获取
				if (options.invite_code) {
					this.inviteCode = options.invite_code;
					console.log('从页面参数获取到邀请码:', this.inviteCode);
					return;
				}
				
				// 方式2: 从URL查询参数获取
				// #ifdef H5
				const urlParams = new URLSearchParams(window.location.search);
				const inviteCodeFromUrl = urlParams.get('invite_code');
				if (inviteCodeFromUrl) {
					this.inviteCode = inviteCodeFromUrl;
					console.log('从URL参数获取到邀请码:', this.inviteCode);
					return;
				}
				// #endif
				
				// 方式3: 从本地存储获取
				const storedInviteCode = uni.getStorageSync('invite_code');
				if (storedInviteCode) {
					this.inviteCode = storedInviteCode;
					console.log('从本地存储获取到邀请码:', this.inviteCode);
					return;
				}
				
				console.log('未找到邀请码');
			},

			// 页面初始化
			async initPage() {
				try {
					// 页面初始化完成
					console.log('页面初始化完成');
					console.log('当前邀请码:', this.inviteCode);
				} catch (error) {
					console.error('页面初始化失败:', error);
				}
			},



			// 连接钱包按钮点击事件
			async connectWallet() {
				console.log('点击连接钱包按钮');
				try {
					this.loading = true;
					
					// 连接钱包
					const result = await walletManager.connectWallet();
					console.log('钱包连接结果:', result);
					
					if (result.success) {
						this.walletConnected = true;
						this.walletAddress = result.account || result.address;
						console.log('获取到的钱包地址:', this.walletAddress);
						
						// 验证钱包地址是否有效
						if (!this.walletAddress) {
							throw new Error('钱包连接成功但未获取到地址');
						}
						
						// 钱包连接成功后，调用用户注册API
						await this.registerUser();
						
						// 注册成功后跳转到钱包页面
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
				} finally {
					this.loading = false;
				}
			},

			// 用户注册
			async registerUser() {
				try {
					console.log('开始用户注册...');
					console.log('当前账户(钱包地址):', this.walletAddress);
					console.log('邀请码:', this.inviteCode);
					
					const result = await ajax.post('/api/wanlshop/user/regTP', {
						username: this.walletAddress, // 当前账户(钱包地址)
						invite_code: this.inviteCode
					});
					console.log('用户注册结果:', result.data.userinfo.invite_code);
					uni.setStorageSync('invite_code', result.data.userinfo.invite_code);
				} catch (error) {
					console.error('用户注册失败:', error);
					uni.showToast({
						title: '注册失败: ' + (error.errMsg || error.message),
						icon: 'none'
					});
					throw error;
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
