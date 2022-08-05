const doAllOrderItemNamesExist = (
	orderItems,
	originalSaleItems,
	originalFlavours
) => {
	const saleItemNames = {};
	const flavourNames = {};
	const orderSaleItemNames = [];
	const orderFlavourNames = [];

	originalSaleItems.forEach((saleItem) => {
		saleItemNames[saleItem.name] = true;
	});
	originalFlavours.forEach((flavour) => {
		flavourNames[flavour.name] = true;
	});

	for (let i = 0; i < orderItems.length; i += 1) {
		const { saleItem, flavours } = orderItems[i];
		orderSaleItemNames.push(saleItem.name);

		for (let j = 0; j < flavours.length; j += 1) {
			orderFlavourNames.push(flavours[j].name);
		}
	}

	const allSaleItemNamesExist = orderSaleItemNames.every(
		(name) => saleItemNames[name]
	);
	const allFlavourNamesExist = orderFlavourNames.every(
		(name) => flavourNames[name]
	);

	return allSaleItemNamesExist && allFlavourNamesExist;
};

const addSaleItemPriceAndQuantityToOrder = (orderItems, originalSaleItems) => {
	for (let i = 0; i < orderItems.length; i += 1) {
		const { saleItem } = orderItems[i];

		for (let j = 0; j < originalSaleItems.length; j += 1) {
			if (saleItem.name === originalSaleItems[j].name) {
				saleItem.quantity = originalSaleItems[j].quantity;
				saleItem.price = originalSaleItems[j].price;
				break;
			}
		}
	}
};

const validFlavourQuantity = (orderItems) => {
	for (let i = 0; i < orderItems.length; i += 1) {
		const { saleItem, flavours } = orderItems[i];
		let totalQuantity = saleItem.amount * saleItem.quantity;

		for (let j = 0; j < flavours.length; j += 1) {
			totalQuantity -= flavours[j].quantity;
		}

		if (totalQuantity !== 0) return false;
	}

	return true;
};

const calculateAmountAndCostOfOrderItems = (orderItems) => {
	let totalAmount = 0;
	let totalCost = 0;

	for (let i = 0; i < orderItems.length; i += 1) {
		const { saleItem } = orderItems[i];
		totalAmount += saleItem.amount;
		totalCost += saleItem.amount * saleItem.price;
	}

	return { totalAmount, totalCost };
};

module.exports = {
	doAllOrderItemNamesExist,
	addSaleItemPriceAndQuantityToOrder,
	validFlavourQuantity,
	calculateAmountAndCostOfOrderItems,
};
