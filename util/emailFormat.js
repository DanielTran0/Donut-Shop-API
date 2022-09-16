const formatOrderItems = (orderItems) => {
	let msg = '';

	for (let i = 0; i < orderItems.length; i += 1) {
		const { saleItem, flavours } = orderItems[i];

		msg += `<br>${saleItem.name} ${saleItem.amount}x - $${saleItem.price}</br>`;
		msg += `<br>Flavours:</br>`;

		for (let j = 0; j < flavours.length; j += 1) {
			const flavour = flavours[j];
			msg += `<br>${flavour.name} ${flavour.quantity}x</br>`;
		}

		msg += '<br></br>';
	}

	return msg;
};

module.exports = { formatOrderItems };
