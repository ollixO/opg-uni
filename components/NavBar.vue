<template>
	<view class="nav-bar">
		<view class="back-btn" @click="goBack">
			<image class="back-icon" src="../static/left.png"></image>
		</view>
		<text class="page-title">{{ title }}</text>
		<view class="menu-btn" @click="toggleMenu" v-if="showMenu">
			<image class="menu-icon" src="../static/right.png"></image>
		</view>
	</view>
</template>

<script>
export default {
	name: 'NavBar',
	props: {
		title: {
			type: String,
			default: '页面标题'
		},
		showMenu: {
			type: Boolean,
			default: false
		}
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		toggleMenu() {
			this.$emit('toggle-menu');
		}
	}
}
</script>

<style scoped>
.nav-bar {
	display: flex;
	align-items: center;
	padding: 40rpx 30rpx;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
	position: relative;
}

.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	position: absolute;
	left: 30rpx;
	z-index: 1;
}

.back-icon {
	width: 19rpx;
	height: 34rpx;
}

.page-title {
	font-size: 36rpx;
	font-weight: bold;
	color: white;
	text-align: center;
	width: 100%;
}

.menu-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	position: absolute;
	right: 30rpx;
	z-index: 1;
}

.menu-icon {
	width: 36rpx;
	height: 36rpx;
}
</style> 