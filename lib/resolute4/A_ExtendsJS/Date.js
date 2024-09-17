Date.months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
Date.weekDays = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
Date.weekDaysShort = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
Date.holidays = [new Date(2022,4,9)];

Date.prototype.isFestive = function(){
	// Проверка, что дата - праздник
	var dn = this.getDay();
	if(dn == 7 || dn == 0) return true;
	if(Date.holidays){
		var f = false;
		Resolute.each(Date.holidays,function(day){
			if(Resolute.isNumber(day)){
				// TODO
			} else if(Resolute.isObject(day) && day.date){
				// TODO
			} else if(Resolute.isString(day)){
				// TODO
			} else if(Resolute.isDate(day)){
				if(this.isEqual(day,'day')){
					f = true;
				}
			}
		});
		return f;
	};
	return false;
}
Date.prototype.getDaySpec = function(){
	var d = this.getDay();
	if(d==0) d = 7;
	return d;
}
Date.prototype.getDayName = function(local,s){
	var d = this.getDay();
	var names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
	return names[d];
}
Date.prototype.getWeekNumber = function(){
	var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	var dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
	return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

if(!Date.prototype.addDays){
	Date.prototype.addDays = function(days) {
		var date = new Date(this.valueOf());
		date.setDate(date.getDate() + days);
		return date;
	};
};
if(!Date.prototype.addMonths){
	Date.prototype.addMonths = function(months) {
		var date = new Date(this.valueOf()),
			d = date.getDate(); 
		date.setMonth(date.getMonth() + months);
		if (date.getDate() != d) {
		  date.setDate(0);
		}
		return date;
	}
}
if(!Date.prototype.addYears){
	Date.prototype.addYears = function(years) {
		var date = new Date(this.valueOf()); 
		date.setYear(date.getFullYear() + years);
		return date;
	}
}
if(!Date.prototype.addHours){
	Date.prototype.addHours = function(hours) {
		var date = new Date(this.valueOf()); 
		date.setHours(date.getHours() + hours);
		return date;
	}
}
if(!Date.prototype.addMinutes){
	Date.prototype.addMinutes = function(minutes) {
		var date = new Date(this.valueOf()); 
		date.setMinutes(date.getMinutes() + minutes);
		return date;
	}
}
if(!Date.prototype.addSeconds){
	Date.prototype.addSeconds = function(seconds) {
		var date = new Date(this.valueOf()); 
		date.setSeconds(date.getSeconds() + seconds);
		return date;
	}
}
if(!Date.prototype.clone){
	Date.prototype.clone = function() {
		return new Date(this.valueOf());
	}
}
Date.prototype.isEqual = function(date,level){
	var a = [this.getFullYear(), this.getMonth(), this.getDate()];
	var b = [date.getFullYear(), date.getMonth(), date.getDate()];
	if(a[0]==b[0] && a[1] == b[1] && a[2] == b[2]) return true;
	return false;
}