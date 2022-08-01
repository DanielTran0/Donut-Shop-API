const { addDays, format } = require('date-fns');

module.exports.generateAllWeekendsInAYear = (year) => {
	const weekends = [];
	let date = new Date(year, 0, 1);

	const firstWeekendDay = date.getDay() === 0 ? 0 : 6;
	while (date.getDay() !== firstWeekendDay) {
		date = addDays(date, 1);
	}

	if (firstWeekendDay === 0) {
		while (date.getFullYear().toString() === year) {
			weekends.push(date);
			date = addDays(date, 6);

			if (date.getFullYear().toString() !== year) break;

			weekends.push(date);
			date = addDays(date, 1);
		}
	} else {
		while (date.getFullYear().toString() === year) {
			weekends.push(date);
			date = addDays(date, 1);

			if (date.getFullYear().toString() !== year) break;

			weekends.push(date);
			date = addDays(date, 6);
		}
	}

	return weekends;
};

module.exports.generateOrderDates = (weekends, orderLimit = 20) => {
	return weekends.map((day) => ({
		date: day,
		dateFormatted: format(day, 'yyyy/MM/dd'),
		remainingOrders: orderLimit,
		dayOff: false,
	}));
};
