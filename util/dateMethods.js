const { addDays, addWeeks, format, isAfter, isBefore } = require('date-fns');

const formatDateToString = (date) => {
	return format(date, 'yyyy/MM/dd');
};

const formatTimeToString = (date) => {
	return format(date, 'hh:mm aaa');
};

const formatDateToStringFull = (date) => {
	return format(date, 'PPPP');
};

const generateAllWeekendsInAYear = (year) => {
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

const generateOrderDates = (weekends, orderLimit = 20) => {
	return weekends.map((day) => ({
		date: formatDateToString(day),
		remainingOrders: orderLimit,
		dayOff: false,
		orders: [],
	}));
};

const generate3WeekDateRange = (isSunday) => {
	const currentDate = new Date();
	let thirdSunday = addWeeks(currentDate, 2);

	while (thirdSunday.getDay() !== 0) {
		thirdSunday = addDays(thirdSunday, 1);
	}

	return {
		startDate: isSunday
			? formatDateToString(addDays(currentDate, -1))
			: formatDateToString(currentDate),
		endDate: formatDateToString(thirdSunday),
	};
};

const isOrderDateIn3WeekRange = (orderDate) => {
	const { startDate, endDate } = generate3WeekDateRange();
	const start = addDays(new Date(startDate), -1);
	const end = addDays(new Date(endDate), 1);

	if (isAfter(new Date(orderDate), start) && isBefore(new Date(orderDate), end))
		return true;

	return false;
};

const isOrderBeforeFridayDeadline = (date, orderDate) => {
	let fridayDeadline = new Date(date);
	fridayDeadline.setHours(18);
	fridayDeadline.setMinutes(0);

	while (fridayDeadline.getDay() !== 5) {
		fridayDeadline = addDays(fridayDeadline, 1);
	}

	if (
		isAfter(fridayDeadline, new Date(orderDate)) ||
		isAfter(new Date(date), fridayDeadline)
	) {
		return false;
	}

	return true;
};

module.exports = {
	formatDateToString,
	formatTimeToString,
	formatDateToStringFull,
	generateAllWeekendsInAYear,
	generateOrderDates,
	generate3WeekDateRange,
	isOrderDateIn3WeekRange,
	isOrderBeforeFridayDeadline,
};
