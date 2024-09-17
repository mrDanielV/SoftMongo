/**
	Resolute.Forms.SliderField
	Поле интерактивного выбора числового значения в заданном диапазоне

	Параметры {
		minValue: число, нижняя граница значений,
		maxValue: число, верхняя граница значений,
		step: число, шаг изменения значения,
		valueText: true/false - наличие текстового блока с отображение значения поля,
		valuePosition: 'top' / 'left' - расположение блока со значением относительно слайдера
		bar: true/false - наличие прогресс-бара движения,
		alt: true/false - показывать ли над бегунком его текущее значение при перемещении бегунка,
		discrete: true/false - дискретное (прерывистое) движение бегунка,
		points: true/false или <число, цена деления> - параметры сетки значений
				если задано true - сетка формируется с частотой = шагу (step)
		marks: true/false или массив подписей
				если задано true - подписи к каждому элементу сетки или к каждому шагу, если сетки нет
				если задан массив - то это массив строк/разметок подписей, распределяется равномерно по всей оси X
		renderer: '<код рендерера в множестве R.format>' - форматирование значения в текстовой области значения
		disabled: true/false,
		hidden: true/false
	}

	Инициирует два события:
	 - slide - изменение положения бегунка в динамике. Опираясь на это событие можно, например, динамически менять значение зависимого поля
	 - change - изменение значения поля по окончанию движения бегунка

	var slider = new R.Forms.SliderField({renderTo: 'ext-comp-1012'})

	CSS Стили элемента описаны в resolute4-form-slider.css 
 */
Resolute.ns('Resolute.Forms');

Resolute.Forms.SliderField = Resolute.extend(Resolute.Forms.Field, {
	minValue: 0,
	maxValue: 100,
	step: 1,
	valueText: true,
	valuePosition: 'top',
	bar: true,
	discrete: false,
	alt: true,
	points: null,
	marks: null,
	initComponent: function(){
		// прогресс-бар
		var barM = '';
		if(this.bar){
			barM = {cls: 'r-slider-bar', ref: 'bar'};
		}

		// разметка для сетки
		var pointsM = '';
		if(this.points){
			pointsM = {cls: 'r-slider-points-bar', cn: [
					{cls: 'r-slider-points', cn: this.initPoins()}
				]
			};
		}

		// разметка для подписей
		var marksM = '';
		if(this.marks){
			marksM = {cls: 'r-slider-marks-bar', cn: [
					{cls: 'r-slider-marks', cn: this.initMarks()}
				]
			};
		}

		// Разметка поля
		this.markup = [
			{cls: 'r-slider-value', ref: 'value'},
			{cls: 'r-slider-box', ref: 'box', a:{tabindex:'0'}, cn: [
				{cls: 'r-slider-track', ref: 'track'},
				pointsM, barM, marksM
			]}
		];
		
		this.cls += ' slider';

		// CSS-класс для расположения блока значения
		valuePosition = this.valuePosition || 'top';
		this.cls += ' valued-' + valuePosition;
		
		// Вызов initComponent родителя
		Resolute.Forms.SliderField.superclass.initComponent.call(this);

		// Инициализация событий
		this.addEvents(
			'slide','change'
		);
	},
	initEvents: function(){
		if(!this.getEl()){
			return;
		}
		if(!this.getEl() || Resolute.isArray(this.getEl())){
			this.elements.main = this.getEl('field');
		}
		this.getEl().on('focus', this.onFocus, this);
		this.getEl().on('blur', this.onBlur, this);
	},
	onRender: function(){
		// Инициализация бегунка
		this.initRoll();

		// Родительский Рендер - важно вызвать после this.initRoll()
		Resolute.Forms.SliderField.superclass.onRender.call(this);

		if(!this.valueText){
			this.getEl('value').hide();
		}

		// Слушаем клавиши стрелок для изменения значения
		this.mon(this.getEl(), 'keydown', this.onKey, this);

		// При изменении размеров окна, обновляем отрисовку значения
		window.addEventListener('resize', function(){
			this.updateWidth.defer(200, this);
		}.createDelegate(this));
	},
	updateWidth: function(){
		// При изменении размеров окна, обновляем отрисовку значения
		this.setValue(this.getValue());
	},
	initRoll: function(){
		// Инициализация бегунка
		this.roll = new R.SlideRoll({
			slider: this, 
			renderTo: this.getEl('box'),
			box: this.getEl('box'),
			track: this.getEl('track'),
			minValue: this.minValue,
			maxValue: this.maxValue,
			step: this.step,
			discrete: this.discrete,
			alt: this.alt
		});

		this.roll.on('slide', this.onSlide, this);
		this.roll.on('change', this.onSlideChange, this);

		// Установка значения по умолчанию / первоначально переданного значения поля
		this.setValue.defer(100, this, [this.value]);
	},
	initPoins: function(){
		// Формирование макета элементов сетки значений
		if(!this.points){
			return '';
		}

		// Цена деления сетки
		var pStep = this.step;
		if(isNumber(this.points)){
			pStep = this.points;
		}

		// Количество
		var n = round((this.maxValue - this.minValue) / pStep);

		// Массив элементов сетки
		var list = [];
		for (var i = 0; i < n; i++) {
			list.push({cls: 'r-slider-point'});
		}

		return list;
	},
	initMarks: function(){
		// Формирование макета элементов подписей - цены деления
		// Всегда добавляем 1 элемент в начале и 1 элемент в конце - для центрирования подписей
		if(!this.marks){
			return '';
		}

		// Авто-формируемый массив значений
		if(!isArray(this.marks)){
			var pStep = this.step;
			if(isNumber(this.points)){
				pStep = this.points;
			}

			var n = round((this.maxValue - this.minValue) / pStep);

			this.marks = [this.minValue + ''];
			for (var i = 1; i < n; i++) {
				var mark = i * pStep;
				this.marks.push(mark + '');
			}
			this.marks.push(this.maxValue + '');
		}
		// Переданный массив значений
		else{
			var l = this.marks.length;
			var marks = ['' + this.marks[0]];
			R.each(this.marks, function(m, i){
				if(i == 0 || i == (l - 1)){
					return;
				}
				marks.push(m);
			});
			marks.push('' + this.marks[l - 1]);
			this.marks = marks;
		}

		// Массив элементов подписей
		var list = [];
		R.each(this.marks, function(m){
			list.push({cls: 'r-slider-mark', cn: m});
		});

		return list;
	},
	onSlide: function(){
		// На перемещение бегунка
		this.setTextValue();

		// Прогресс-бар
		if(this.bar){
			var rw = this.roll.getW(); 
			var x = this.roll.getX(); 
			this.getEl('bar').setWidth(x + rw / 2);
		}

		// Событие для прослушивающих
		this.fireEvent('slide', this);
	},
	onSlideChange: function(){
		// Изменение значения бегунка - остановка движения
		var value = this.mathValue();
		this.setValue(value);

		// Для отработки события изменения значения поля в Field
		this.fireEvent('change', this);
	},
	onKey: function(e){
		// Слушаем клавиши стрелок для изменения значения
		var k = e.getKey();

		if(inArray(k, [37, 38, 39, 40]) && !this.disabled){
			e.stopEvent();

			if(inArray(k, [37, 40])){
				this.setValue(this.getValue() - this.step);
			}else{
				this.setValue(this.getValue() + this.step);
			}

			this.fireEvent('change', this);
		}
	},
	postBlur: function(){
		// после потери фокуса - переопределения Field.postBlur() для подавления родительского fireEvent('change')
		// У слайдера изменение происходит не на потерю фокуса, а на остановку бегунка 
	},
	setTextValue: function(v){
		// Установка отображаемого в текстовой области значения
		// В том числе динамически во время перемещения бегунка
		if(!isDefined(v)){
			v = this.mathValue();
		}

		this.value = v;

		if(!this.getEl('value') || !this.valueText){
			return;
		}

		if(this.renderer){
			v = R.format.get(this.renderer, v)
		}

		this.getEl('value').setHtml(v + '');
	},
	setValue: function(v){
		// Установка значения
		if(!isDefined(v) || !isNumber(v)){
			v = null;
		}
		this.value = v;

		// Значение строго ограничено
		if(this.value !== null && this.value < this.minValue){
			this.value = this.minValue;
		}
		if(this.value !== null && this.value > this.maxValue){
			this.value = this.maxValue;
		}
		
		// Применение к бегунку
		var k = this.mathK(this.value);
		this.roll.setK(k);

		// Применение значения к текстовому элементу и прогресс-бару
		this.onSlide()

		this.onSetValue();
	},
	getValue: function(){
		this.value = this.roundSteps(this.value);
		return this.value;
	},
	roundSteps: function(v){
		// округление значения к ближайшему шагу
		var nsteps = round((v - this.minValue) / this.step);

		// Применение шагов
		v = this.minValue + this.step * nsteps;

		return v;
	},
	mathValue: function(k){
		// Расчет числового значения поля от коэффициента смещения
		if(!this.roll){
			return this.minValue;
		}

		if(!isDefined(k)){
			k = this.roll.getK();
		}

		var v = (this.maxValue - this.minValue) * k + this.minValue;

		if(v < this.minValue){
			v = this.minValue;
		}

		v = this.roundSteps(v);

		return v;
	},
	mathK: function(v){
		// Расчет коэффициента смещения бегунка от числового значения поля
		if(!v && v !== 0){
			v = this.minValue;
		}
		
		var k = (v - this.minValue) / (this.maxValue - this.minValue);
		
		if(k < 0){
			k = 0;
		}
		if(k > 1){
			k = 1;
		}

		return k;
	}
});
Resolute.reg('slider', Resolute.Forms.SliderField);