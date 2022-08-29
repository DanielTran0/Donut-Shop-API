const OrderDate = require('../models/orderDate');
const {
	calculateAmountAndCostOfOrderItems,
} = require('./orderValidationMethods');

const addCancelledAmountBackToOrderDate = async (orderItems, date) => {
	const { totalAmount } = calculateAmountAndCostOfOrderItems(orderItems);
	console.log(totalAmount);

	const orderDate = await OrderDate.findOne({ date });
	orderDate.remainingOrders += totalAmount;
	console.log(orderDate.remainingOrders);

	await orderDate.save();
};

module.exports = { addCancelledAmountBackToOrderDate };
