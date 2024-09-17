// Пикер для выбора даты


Resolute.ns('Resolute.Pickers');
Resolute.Pickers.Date = Resolute.extend(Resolute.Pickers.Base, {
	showFestive:false,
	width: 200,
	height: 200,
	initComponent:function(){
		if(!this.value) this.value = new Date();
		if(!this.shift) this.shift = 0;
		if(Resolute.isNumber(this.value)) this.value = new Date(this.value);
		this.markup = {
			cls:'picker date unselectable',
			ref:'layer',
			cn:[
				{cls:'top flex center',cn:[
					{t:'span',cls:'icon material-icons prev-month',cn:'keyboard_arrow_left',attr:{tooltip:'Предыдущий месяц'},ref:'prev-month'},
					{t:'span',cls:'month-year',cn:Date.months[this.value.getMonth()]+' '+this.value.getFullYear(),attr:{tooltip:'Выбрать месяц/год'},ref:'month-year'},
					{t:'span',cls:'icon material-icons next-month',cn:'keyboard_arrow_right',attr:{tooltip:'Следующий месяц'},ref:'next-month'}
				]},
				{cls:'calend',cn:this.getMonthMarkup(),ref:'calend'}
			]
		};
		Resolute.Pickers.Date.superclass.initComponent.call(this);
	},
	getMonthMarkup:function(v){
		var val = v || this.value,
			today = new Date(),
			weeks = [{cls:'weekdays',cn:[]}],
			month = this.getMonthData(val.getMonth(),val.getFullYear()),
			week = {cls:'week week-',cn:[]},
			weekNum = 1,
			cday = null,
			cl = '';
		Resolute.each(Date.weekDaysShort,function(item){
			weeks[0].cn.push({cls:'day',cn:item});
		});
		for(var d=1;d<=month.days;d++){
			var day = month.begin.clone().addDays(d-1);
			if(weekNum == 1 && d==1 && month.begin.getDaySpec()>1){
				for(var i=1;i<month.begin.getDaySpec();i++){
					cday = day.clone().addDays(-1*(month.begin.getDaySpec()-i));
					cl = (this.maxValue && cday>=this.maxValue)?' disabled':'';
					cl = (this.minValue && cday<=this.minValue)?' disabled':cl;
					if(this.value){
						cl += (cday.isEqual(this.value))?' current':'';
					};
					if(today.isEqual(cday)) cl += ' today';
					if(this.isFestive(cday)) cl += ' festive';
					week.cn.push({cls:'day non'+cl,cn:''+cday.getDate(),a:{date:cday.getTime()}});
				}
			};
			if(week.cn.length==7){
				week.cls = 'week week-'+weekNum;
				weeks.push(Resolute.clone(week));
				delete week;
				var week = {cls:'week week-',cn:[]};
				weekNum++;
			};
			
			cl = (day.isEqual(today))?' today':'';
			if(this.value){
				cl = (day.isEqual(this.value))?' current':cl;
			};
			if(day.getMonth()!=val.getMonth()){
				cl = ' non';
			};
			if((this.maxValue && day>=this.maxValue)||(this.minValue && day<=this.minValue)){
				cl += ' disabled';
			};
			if(this.isFestive(day)) cl += ' festive';
			week.cn.push({cls:'day'+cl,cn:''+day.getDate(),a:{date:day.getTime()}});
		};
		var lastDay = month.end;
		if(week.cn.length<7){
			for(var i=month.end.getDaySpec()+1;i<=7;i++){
				lastDay = month.end.clone().addDays(i-month.end.getDaySpec());
				cl = (this.maxValue && lastDay>=this.maxValue)?' disabled':'';
				cl = (this.minValue && lastDay<=this.minValue)?' disabled':cl;
				if(this.value){
					cl += (lastDay.isEqual(this.value))?' current':'';
				};
				if(today.isEqual(lastDay)) cl += ' today';
				if(this.isFestive(lastDay)) cl += ' festive';
				week.cn.push({cls:'day non'+cl,cn:''+lastDay.getDate(),a:{date:lastDay.getTime()}});
			}
		};
		week.cls = 'week week-'+weekNum;
		weeks.push(Resolute.clone(week));
		var week = {cls:'week week-6',cn:[]};
		if(weeks.length<7){
			for(var i=1;i<=7;i++){
				cday = lastDay.clone().addDays(i);
				cl = (this.maxValue && cday>=this.maxValue)?' disabled':'';
				cl = (this.minValue && cday<=this.minValue)?' disabled':cl;
				if(this.value){
					cl += (cday.isEqual(this.value))?' current':'';
				};
				if(today.isEqual(cday)) cl += ' today';
				if(this.isFestive(cday)) cl += ' festive';
				week.cn.push({cls:'day non'+cl,cn:''+cday.getDate(),a:{date:cday.getTime()}});
			}
			weeks.push(Resolute.clone(week));
		};
		return weeks;
	},
	onRender:function(){
		Resolute.Pickers.Date.superclass.onRender.call(this);
	},
	getMonthData:function(month,year){
		var end = new Date(year,month+1,0,23,59,59)
		return {
			begin: new Date(year,month,1),
			end: end,
			days: end.getDate()
		};
	},
	isFestive:function(date){
		// Проверка, что дата - праздник (TODO)
		if(!this.showFestive) return false;
		return date.isFestive();
	},
	onWheel:function(event){
		if(this.getEl('page').hasClass('hidden')){
			// Прокрутка календаря
			// Прокрутка с зажатым shift будет прокручивать календарь на +- год
			if(event.wheelDelta<0){
				if(event.shiftKey) this.shift+=11;
				this.nextMonth();
			} else {
				if(event.shiftKey) this.shift-=11;
				this.prevMonth();
			};
		} else {
			// Прокрутка лет
			if(event.wheelDelta<0){
				this.nextYears();
			} else {
				this.prevYears();
			};
		};
		return false;
	},
	onClick:function(event){
		var el = Resolute.get(event.target);
		if(el.matches('.week .day')){
			var date = new Date(parseInt(el.getAttribute('date')));
			if(this.maxValue && date>=this.maxValue) return false;
			if(this.minValue && date<=this.minValue) return false;
			if(this.callback){
				this.callback.call(this.scope||this,date);
			};
			return true;
		};
		if(el.hasClass('month-year')){
			this.showYearSelect();
			return false;
		};
		if(el.hasClass('prev-year')){
			this.prevYears();
			return false;
		};
		if(el.hasClass('next-year')){
			this.nextYears();
			return false;
		};
		if(el.hasClass('select')){
			var month = parseInt(this.getEl().query('.page .months .month.current').getAttribute('data'));
			var year = parseInt(this.getEl().query('.page .years .year.current').getAttribute('data'));
			this.updateCalend(new Date(year,month,1));
			this.hidePage();
			return false;
		};
		if(el.hasClass('back')){
			this.hidePage();
			return false;
		};
		if(el.hasClass('prev-month')){
			this.prevMonth();
			return false;
		};
		if(el.hasClass('next-month')){
			this.nextMonth();
			return false;
		};
		if(el.hasClass('month') || el.hasClass('year')){
			if(el.hasClass('month')){
				Resolute.select('.page .months .month.current',this.getEl()).removeClass('current');
				el.addClass('current');
			};
			if(el.hasClass('year')){
				Resolute.select('.page .years .year.current',this.getEl()).removeClass('current');
				el.addClass('current');
			};
			
			return false;
		};
	},
	showPage:function(){
		this.getEl('page').show('hidden');
	},
	hidePage:function(){
		this.getEl('page').hide('hidden');
	},
	showYearSelect:function(){
		var m = [{cls:'months',cn:[]},{cls:'years',cn:[]},{cls:'fbar',cn:[{cls:'button select',cn:'Выбрать'},{cls:'button back',cn:'Назад'}]}];
		var year = this.value.getFullYear();
		Resolute.each(Date.months,function(month,index){
			cl = (this.value.getMonth() == index)?' current':'';
			m[0].cn.push({cls:'month'+cl,cn:month.left(3),a:{data:index}});
		},this);
		m[1].cn.push({cls:'prev-year icon material-icons',cn:'keyboard_arrow_left'});
		m[1].cn.push({cls:'next-year icon material-icons',cn:'keyboard_arrow_right'});
		for(var y = year - 4;y<=year; y++){
			cl = (this.value.getFullYear() == y)?' current':'';
			cl2 = (this.value.getFullYear() == (y+5))?' current':'';
			m[1].cn.push({cls:'year'+cl,cn:''+y,a:{data:y}});
			m[1].cn.push({cls:'year'+cl2,cn:''+(y+5),a:{data:y+5}});
		};
		this.getEl('page').update('');
		Resolute.jsml.apply(this.getEl('page'),m);
		this.getEl('page').show();
		this.shiftYears = 0;
		this.showPage();
	},
	nextMonth:function(){
		this.shift++;
		var d = this.value.clone().addMonths(this.shift);
		this.updateCalend(d);
	},
	prevMonth:function(){
		this.shift--;
		var d = this.value.clone().addMonths(this.shift);
		this.updateCalend(d);
	},
	nextYears:function(){
		this.shiftYears += 10;
		this.updateYears();
	},
	prevYears:function(){
		this.shiftYears -= 10;
		this.updateYears();
	},
	updateCalend:function(d){
		this.currentCalendDate = d;
		this.getEl('calend').update('');
		Resolute.jsml.apply(this.getEl('calend'),this.getMonthMarkup(d));
		this.getEl('month-year').update(Date.months[d.getMonth()]+' '+d.getFullYear());
	},
	updateYears:function(){
		Resolute.select('.years .year',this.getEl('page')).remove();
		var year = this.value.getFullYear()+this.shiftYears;
		var cy = this.value.getFullYear();
		var ys = [];
		for(var y = year - 4;y<=year; y++){
			cl = (cy == y)?' current':'';
			cl2 = (cy == (y+5))?' current':'';
			ys.push({cls:'year'+cl,cn:''+y,a:{data:y}});
			ys.push({cls:'year'+cl2,cn:''+(y+5),a:{data:y+5}});
		};
		Resolute.jsml.apply(this.getEl('page').query('.years'),ys);
	}
});