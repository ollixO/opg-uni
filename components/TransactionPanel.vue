<template>
  <view class="transaction-panel">
    <view class="panel-header">
      <text class="panel-title">交易操作</text>
    </view>
    
    <view class="send-form">
      <view class="form-item">
        <text class="form-label">接收地址</text>
        <input class="form-input" v-model="toAddress" placeholder="请输入接收地址" type="text" />
      </view>
      
      <view class="form-item">
        <text class="form-label">发送数量 (TRX)</text>
        <input class="form-input" v-model="amount" placeholder="0.000000" type="number" />
      </view>
      
      <button class="send-btn" @click="sendTransaction" :disabled="!canSend || sending">
        {{ sending ? '发送中...' : '发送交易' }}
      </button>
    </view>
    
    <view class="transaction-history">
      <view class="history-header">
        <text class="history-title">交易历史</text>
        <button class="refresh-btn" @click="loadTransactionHistory">刷新</button>
      </view>
      
      <view v-if="transactions.length === 0" class="empty-history">
        <text class="empty-text">暂无交易记录</text>
      </view>
      
      <view v-else class="transaction-list">
        <view v-for="(tx, index) in transactions" :key="index" class="transaction-item">
          <view class="tx-header">
            <text class="tx-id">{{ formatTxId(tx.txID) }}</text>
            <text class="tx-status" :class="getStatusClass(tx.ret[0].contractRet)">
              {{ getStatusText(tx.ret[0].contractRet) }}
            </text>
          </view>
          <view class="tx-details">
            <text class="tx-amount">{{ formatAmount(tx.raw_data.contract[0].parameter.value.amount) }} TRX</text>
            <text class="tx-time">{{ formatTime(tx.block_timestamp) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import walletManager from '../utils/wallet-manager.js';

export default {
  name: 'TransactionPanel',
  data() {
    return {
      toAddress: '',
      amount: '',
      sending: false,
      transactions: [],
      loadingHistory: false
    };
  },
  computed: {
    		canSend() {
			return this.toAddress.trim() && parseFloat(this.amount) > 0 && walletManager.isConnected;
		}
  },
  	mounted() {
		if (walletManager.isConnected) {
			this.loadTransactionHistory();
		}
	},
  methods: {
    async sendTransaction() {
      if (!this.canSend) return;
      
      this.sending = true;
      try {
        const result = await walletManager.sendTransaction(this.toAddress, parseFloat(this.amount));
        
        if (result.success) {
          uni.showToast({ title: '交易发送成功', icon: 'success' });
          this.toAddress = '';
          this.amount = '';
          this.loadTransactionHistory();
        } else {
          uni.showToast({ title: result.error || '交易失败', icon: 'error' });
        }
      } catch (error) {
        uni.showToast({ title: '交易异常', icon: 'error' });
      } finally {
        this.sending = false;
      }
    },
    
    async loadTransactionHistory() {
      if (!walletManager.isConnected) return;
      
      this.loadingHistory = true;
      try {
        const result = await walletManager.getTransactionHistory();
        if (result.success) {
          this.transactions = result.transactions || [];
        }
      } catch (error) {
        console.error('加载交易历史失败:', error);
      } finally {
        this.loadingHistory = false;
      }
    },
    
    formatTxId(txId) {
      if (!txId) return '';
      return txId.substring(0, 8) + '...' + txId.substring(txId.length - 8);
    },
    
    formatAmount(amount) {
      if (!amount) return '0';
      return (amount / 1000000).toFixed(6);
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN');
    },
    
    getStatusClass(status) {
      switch (status) {
        case 'SUCCESS': return 'status-success';
        case 'FAILED': return 'status-failed';
        default: return 'status-pending';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'SUCCESS': return '成功';
        case 'FAILED': return '失败';
        default: return '处理中';
      }
    }
  }
};
</script>

<style scoped>
.transaction-panel {
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx 20rpx;
  text-align: center;
}

.panel-title {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

.send-form {
  padding: 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #fafafa;
}

.form-input:focus {
  border-color: #667eea;
  background: white;
}

.send-btn {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 25rpx 60rpx;
  font-size: 30rpx;
  font-weight: bold;
  width: 100%;
}

.send-btn:disabled {
  opacity: 0.6;
}

.transaction-history {
  padding: 30rpx 20rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.history-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.refresh-btn {
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 25rpx;
  padding: 15rpx 30rpx;
  font-size: 24rpx;
}

.empty-history {
  text-align: center;
  padding: 60rpx 20rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.transaction-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.transaction-item {
  border: 1rpx solid #f0f0f0;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  background: #fafafa;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.tx-id {
  font-size: 24rpx;
  color: #666;
  font-family: monospace;
}

.tx-status {
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-weight: bold;
}

.status-success {
  background: #f6ffed;
  color: #52c41a;
}

.status-failed {
  background: #fff2f0;
  color: #ff4d4f;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.tx-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tx-amount {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.tx-time {
  font-size: 22rpx;
  color: #999;
}
</style> 