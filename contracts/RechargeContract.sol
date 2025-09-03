// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RechargeContract
 * @dev 充值智能合约，支持TRX充值、余额查询、提现等功能
 * @author Your Name
 */
contract RechargeContract is ReentrancyGuard, Ownable, Pausable {
    
    // 事件定义
    event Recharge(address indexed user, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 timestamp);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event MinRechargeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxRechargeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    
    // 状态变量
    uint256 public rechargeFee = 0; // 充值手续费（以基点计算，100 = 1%）
    uint256 public minRechargeAmount = 10 * 10**6; // 最小充值金额（10 TRX，以sun为单位）
    uint256 public maxRechargeAmount = 1000000 * 10**6; // 最大充值金额（1,000,000 TRX）
    
    // 用户余额映射
    mapping(address => uint256) public userBalances;
    
    // 用户充值记录
    mapping(address => uint256[]) public userRechargeHistory;
    
    // 用户充值次数
    mapping(address => uint256) public userRechargeCount;
    
    // 合约统计信息
    uint256 public totalRechargeAmount;
    uint256 public totalUserCount;
    uint256 public totalRechargeCount;
    
    // 构造函数
    constructor() {
        // 设置合约拥有者
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev 充值函数 - 用户可以通过此函数充值TRX
     * @param amount 充值金额（以sun为单位）
     */
    function recharge(uint256 amount) external payable whenNotPaused nonReentrant {
        require(amount >= minRechargeAmount, "Amount too small");
        require(amount <= maxRechargeAmount, "Amount too large");
        require(msg.value == amount, "Incorrect amount sent");
        
        // 计算手续费
        uint256 fee = (amount * rechargeFee) / 10000;
        uint256 actualAmount = amount - fee;
        
        // 更新用户余额
        userBalances[msg.sender] += actualAmount;
        
        // 记录充值历史
        userRechargeHistory[msg.sender].push(amount);
        userRechargeCount[msg.sender]++;
        
        // 更新统计信息
        totalRechargeAmount += amount;
        if (userBalances[msg.sender] == actualAmount) {
            totalUserCount++;
        }
        totalRechargeCount++;
        
        // 发送事件
        emit Recharge(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev 查询用户余额
     * @param user 用户地址
     * @return 用户余额
     */
    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }
    
    /**
     * @dev 查询用户充值历史
     * @param user 用户地址
     * @return 充值金额数组
     */
    function getRechargeHistory(address user) external view returns (uint256[] memory) {
        return userRechargeHistory[user];
    }
    
    /**
     * @dev 查询用户充值次数
     * @param user 用户地址
     * @return 充值次数
     */
    function getRechargeCount(address user) external view returns (uint256) {
        return userRechargeCount[user];
    }
    
    /**
     * @dev 提现函数 - 用户提取充值余额
     * @param amount 提现金额
     */
    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        
        // 更新余额
        userBalances[msg.sender] -= amount;
        
        // 发送TRX给用户
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        // 发送事件
        emit Withdraw(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev 紧急提现 - 合约拥有者可以提取合约中的TRX
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 amount = address(this).balance;
        require(amount > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdraw(owner(), amount, block.timestamp);
    }
    
    /**
     * @dev 更新充值手续费
     * @param newFee 新的手续费率（基点）
     */
    function updateRechargeFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // 最大10%
        uint256 oldFee = rechargeFee;
        rechargeFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev 更新最小充值金额
     * @param newAmount 新的最小充值金额
     */
    function updateMinRechargeAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        require(newAmount < maxRechargeAmount, "Amount must be less than max");
        uint256 oldAmount = minRechargeAmount;
        minRechargeAmount = newAmount;
        emit MinRechargeAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @dev 更新最大充值金额
     * @param newAmount 新的最大充值金额
     */
    function updateMaxRechargeAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > minRechargeAmount, "Amount must be greater than min");
        uint256 oldAmount = maxRechargeAmount;
        maxRechargeAmount = newAmount;
        emit MaxRechargeAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 获取合约统计信息
     * @return 总充值金额、用户数量、充值次数
     */
    function getContractStats() external view returns (
        uint256 totalAmount,
        uint256 userCount,
        uint256 rechargeCount
    ) {
        return (totalRechargeAmount, totalUserCount, totalRechargeCount);
    }
    
    /**
     * @dev 获取用户统计信息
     * @param user 用户地址
     * @return 余额、充值次数、充值历史
     */
    function getUserStats(address user) external view returns (
        uint256 balance,
        uint256 rechargeCount,
        uint256[] memory history
    ) {
        return (
            userBalances[user],
            userRechargeCount[user],
            userRechargeHistory[user]
        );
    }
    
    /**
     * @dev 接收TRX的回退函数
     */
    receive() external payable {
        // 自动调用充值函数
        recharge(msg.value);
    }
    
    /**
     * @dev 查询合约TRX余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 