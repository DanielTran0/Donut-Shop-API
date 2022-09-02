const OrderDate = require('../models/orderDate');
const {
	calculateAmountAndCostOfOrderItems,
} = require('./orderValidationMethods');

const addCancelledAmountBackToOrderDate = async (orderItems, date) => {
	const { totalAmount } = calculateAmountAndCostOfOrderItems(orderItems);

	const orderDate = await OrderDate.findOne({ date });
	orderDate.remainingOrders += totalAmount;

	await orderDate.save();
};

module.exports = { addCancelledAmountBackToOrderDate };
