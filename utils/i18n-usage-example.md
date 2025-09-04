# 国际化使用示例

## 如何在页面中使用国际化

### 1. 导入国际化工具
```javascript
import i18n from '@/utils/i18n.js';
```

### 2. 在模板中使用
```vue
<template>
  <view>
    <!-- 直接使用 i18n.t() 方法 -->
    <text>{{ i18n.t('home') }}</text>
    <text>{{ i18n.t('connect_wallet') }}</text>
    
    <!-- 在属性中使用 -->
    <NavBar :title="i18n.t('node_subscription_title')" />
    
    <!-- 在条件判断中使用 -->
    <text v-if="i18n.isChinese()">中文内容</text>
    <text v-else>English Content</text>
  </view>
</template>
```

### 3. 在 JavaScript 中使用
```javascript
export default {
  methods: {
    showMessage() {
      uni.showToast({
        title: i18n.t('success'),
        icon: 'success'
      });
    },
    
    handleError() {
      uni.showModal({
        title: i18n.t('error'),
        content: i18n.t('operation_failed'),
        success: (res) => {
          if (res.confirm) {
            // 处理确认
          }
        }
      });
    }
  }
}
```

### 4. 语言切换
```javascript
// 切换语言
const newLanguage = i18n.toggleLanguage();

// 检查当前语言
if (i18n.isChinese()) {
  console.log('当前是中文');
} else {
  console.log('Current is English');
}
```

## 已支持的页面

### ✅ 已完成
- `components/Sidebar.vue` - 侧边栏菜单
- `pages/wallet/subscription.vue` - 节点认购页面

### 🔄 需要更新的页面
- `pages/index/index.vue` - 首页
- `pages/wallet/recharge.vue` - 充值页面
- `pages/wallet/invitation.vue` - 邀请好友页面
- `pages/wallet/wallet.vue` - 钱包页面
- `components/NavBar.vue` - 导航栏组件

## 可用的翻译键

### 通用
- `loading`, `success`, `error`, `confirm`, `cancel`, `ok`, `back`, `save`, `delete`, `edit`, `add`, `search`, `refresh`

### 导航和菜单
- `home`, `node_subscription`, `invite_friends`, `profile`, `recharge`, `records`

### 钱包相关
- `connect_wallet`, `wallet_connected`, `wallet_disconnected`, `current_balance`, `recharge_amount`, `min_amount`, `buy_now`, `recharge_success`, `recharge_failed`

### 节点认购
- `node_subscription_title`, `v1_node`, `v2_node`, `v3_node`, `basic_node`, `genesis_node`, `super_node`, `subscription_success`, `subscription_failed`, `confirm_subscription`, `subscription_processing`

### 邀请好友
- `invite_friends_title`, `invite_link`, `copy_link`, `link_copied`

### 用户级别
- `current_level`, `level_loading`

### 错误信息
- `network_error`, `operation_failed`, `please_try_again`, `feature_coming_soon`, `login_expired`

### 提示信息
- `please_connect_wallet`, `please_enter_valid_amount`, `transaction_success`, `transaction_failed`, `insufficient_balance`, `gas_fee_required`, `ensure_network_stable`
