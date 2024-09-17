// Компонент бегунка для Слайдера
/**
 	Пример инициализации к основному компоненту (полю из семейства Слайдеров)
 	this.roll = new R.SlideRoll({
		slider: <компонент-родитель>,
		renderTo: <ссылка на основной элемент, внутри которого должен быть расположен бегунок - используется только для прорисовки>,
		box: <аналогично renderTo, но используется уже для функционала>,
		track: <ссылка на элемент трекера по которому передвигается бегунок - длинна трекера считается ограничением доступного движения бегунка>,
		leftEl: <ссылка на элемент, ограничивающий бегунок слева - например другой бегунок>,
		rightEl: <ссылка на элемент, ограничивающий бегунок справа - например другой бегунок>,
		alt: <true/false - показывать ли над бегунком его текущее значение при перемещении бегунка>,

		// Для обеспечения дискретного движения необходимо передать:
		discrete: true,
		minValue: <число, минимальное смысловое значение поля Слайдера>,
		maxValue: <число, максимальное смысловое значение поля Слайдера>
	});
 
 	Компонент обеспечивает 
 	 - движение внутри заданного box по ширине заданного track
 	 - порождает событие slide, опираясь на которое можно получить коэффициент (0 - 1) отклонения бегунка от стартовой позиции
 	 - Если заданы slider, discrete, minValue, maxValue - создает дискретное движение от minValue к maxValue с заданным в слайдере шагом

 */
Resolute.SlideRoll = Resolute.extend(Resolute.Component, {
	initComponent: function(){
		this.inDrag = false;
		this.begin = null;

		// Возмодные события элемента - только клик
		this.addEvents('slide', 'change');

		// Разметка элемента
		this.markup = {cls: 'r-slider-roll'};

		// Родительский initComponent
		Resolute.SlideRoll.superclass.initComponent.call(this);
	},
	onRender:function(){
		Resolute.SlideRoll.superclass.onRender.call(this);

		this.body = R.getBody();
		this.roll = this.getEl();

		// Добавление элемента ALT значения бегунка
		if(this.alt){
			this.altEl = this.roll.append({cls:'r-slider-roll-alt'}, true);
			this.altEl.hide();
		}

		// Инициализация прослушивателей на элементах бегунка
		this.initEvents();

		// Ширина элемента бегунка
		this.rw = this.roll.getWidth();

		// Начальное смещение
		if(this.k){
			this.setK.defer(100, this, [this.k]);
		}

		// Флаг наличия завершения процесса перемещения - для исключения дублирования событий "drop" для roll и "click" для box
		this.wasDroped = null;

		// Обновление при изменении размеров окна
		window.addEventListener('resize', this.updateWidth.createDelegate(this));
	},
	initEvents: function(){
		// Инициализация прослушивателей на элементах бегунка
		if(!this.track) {
			return;
		}

		// Движение начинается при клике на бегунок и отслеживается по mousemove до тех пор, пока не будет отжата левая кнопка мыши
		this.roll.on('mousedown', this.onDrag, this);
		this.body.on('mouseup', this.onDrop, this);
		this.body.on('mousemove', this.onMove, this);

		// При клике на основной контейнер бегунка - он передвигается к точке клика
		if(this.box){
			this.box.on('click', this.onBoxClick, this);
		}
	},
	getCoords: function(){
		// Расчет базовых координатных величин начала/конца движения
		var coords = this.track.dom.getBoundingClientRect();

		// Координаты (в px) доступной области перемещения
		this.begin = coords.x;
		this.end = coords.right - this.rw / 2;
		
		// Максимальное отклонение
		this.max = coords.width - this.rw;

		// Ограничения от элементов, установленных справа и слева
		this.left = null;
		this.right = null;
		if(this.leftEl){
			var lc = this.leftEl.dom.getBoundingClientRect();
			this.left = lc.x - this.begin + lc.width;
		}
		if(this.rightEl){
			var rc = this.rightEl.dom.getBoundingClientRect();
			this.right = rc.x - this.begin - this.rw;
		}
	},
	updateWidth: function(){
		// Переустановка при изменении ширины контекста
		this.getCoords();

		var k = this.getK();
		if(k < 0){
			this.setRoll(0);
		}
		else if (k > 1){
			this.setRoll(this.max);	
		}
	},
	onDrag: function(e){
		// Начало движения
		this.inDrag = true;
		this.roll.addClass('move');
		this.setMove(e);

		if(this.alt){
			this.altEl.show();
		}

		this.wasDroped = false;
	},
	onDrop: function(e){
		// Конец движения
		if(this.inDrag){
			this.setMove(e);
			this.fireEvent('change');
			this.wasDroped = true;
		}
		this.inDrag = false;
		this.roll.removeClass('move');

		if(this.alt){
			this.altEl.hide();
		}
	},
	onMove: function(e){
		// Движение
		if(!this.inDrag){
			return;
		}

		this.setMove(e);
	},
	onBoxClick: function(e){
		// Клик по BOX - изменение значения к месту клика
		this.setMove(e);

		if(!this.wasDroped){
			this.fireEvent('change');
		}

		this.wasDroped = false;
	},
	setMove: function(e){
		// Применение движения - от события
		x = this.getEventX(e);
		e.stopPropagation();

		if(this.disabled || this.slider.disabled){
			return;
		}

		// Ограничение слева
		if(this.left && x <= this.left){
			x = this.left;
		}

		// Ограничение справа
		if(this.right && x >= this.right){
			x = this.right;
		}

		// Проверка на дискретность и достижения шага
		if(this.tryStep(x)){
			this.setRoll(x);
		}
	},
	getEventX: function(e){
		// Расчет смещения бегунка (в px) от события
		this.getCoords();

		var x = e.getPageX();
		if(x >= this.end){
			x = this.max;
		}
		else if(x <= this.begin){
			x = 0;
		}
		else{
			var dx = x - this.begin;
			x = dx - this.rw / 2;
		}

		return x;
	},
	setRoll: function(x){
		// Смещение бегунка на заданное (в px) смещение
		//this.roll.setLeft(x);
		this.requestAnim(this.roll.setLeft(x));
		this.setAltValue();
		this.fireEvent('slide');
	},
	setAltValue: function(){
		// обновление значения ALT
		if(!this.alt || !this.altEl || !this.slider){
			return;
		}
		if(this.disabled || this.slider.disabled){
			return;
		}

		var v = this.slider.mathValue();
		this.altEl.setHtml(v + '');
	},
	tryStep: function(x){
		// Определение достижения очередного шага при движении
		// Если заданы шаги и дискретное движение
		if(!this.discrete || !this.slider || !this.step || !isDefined(this.minValue) || !this.maxValue){
			return true;
		}

		// Значение от X
		var k = this.getK(x);
		var v1 = this.slider.mathValue(k);

		// Значени от бегунка
		k = this.getK();
		var v2 = this.slider.mathValue(k);

		if(v1 == v2){
			return false;
		}

		// Если дискретный шаг достигнут, устанавливаем его
		k = this.slider.mathK(v1);
		this.setK(k);

		// И возвращаем FALSE, потому что движение уже совершено
		return false;
	},
	setK: function(k){
		// Установка бегунка на смещение от заданного коэффициента
		if(!this.roll){
			return;
		}
		this.getCoords();

		var x = 0;
		if(k){
			x = k * this.max;
		}

		this.setRoll(x);
	},
	getX: function(){
		// возврат текущего смещения бегунка в px
		if(!this.roll){
			return 0;
		}
		this.getCoords();

		var coords = this.roll.dom.getBoundingClientRect();
		var x = coords.x;

		var dx = x - this.begin;
		
		return dx;
	},
	getK: function(x){
		// возврат коэффициента смещения от позиции в px
		this.getCoords();

		var dx = 0;
		if(isDefined(x)){
			dx = x;
		}else{
			dx = this.getX();
		}
		
		var k = dx / this.max;

		return k;
	},
	getW: function(){
		// возврат ширины бегунка
		return this.rw;
	},
	requestAnim: function(fn){
		// Декларировано, что такая функция может ускорять (избавлять от лагов) любую анимацию (прорисовку) элементов окна
		// Однако фактического видимого подтверждения этому не обнаружено - лаги mousemove остались без изменения
		return (
			window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(fn){
				window.setTimeout(fn, 1000 / 60);
			}
		);
	}
});