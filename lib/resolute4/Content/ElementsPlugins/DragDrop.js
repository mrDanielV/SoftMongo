// Drag & Drop
/**
	Пример
	var el = R.get('<el_id>');
	el.plugin('DragDrop', {
		onDrag: function(dd){
			console.log('onDrag', dd.getPosition());
		},
		onMove: function(dd){
			console.log('onMove', dd.getPosition());
		},
		onDrop: function(dd){
			console.log('onDrop', dd.getPosition());
		},
		onEnd: function(dd){
			console.log('onEnd', dd.getPosition());
		},
		scope: this
	});

	ОПЦИИ
		onDrag: function(dd) - кастомная (перадаваемая) функция обработки начала движения
			- dd - объект библиотеки DragDrop (this)
		onDrop: function(dd)- кастомная (перадаваемая) функция обработки конца движения
			- dd - объект библиотеки DragDrop (this)
		onMove: function(dd)- кастомная (перадаваемая) функция обработки процесса движения
			- dd - объект библиотеки DragDrop (this)
		onEnd: function(dd)- кастомная (перадаваемая) прерывание движения, вызывается всегда, в отличие от onDrop
			- dd - объект библиотеки DragDrop (this)
		scope: заданное (отличное от this) окружение для вызова кастомных функций
		mode: 'self'/'copy'/'box'/'external' - тип передвигаемого элемента, по умолчанию = self
			- self - передвигается сам элемент
			- copy - передвигается копия элемента
			- box - передвигается тривиальная копия элемента: прямоугольник с окантовкой, равный по размеру элементу
			- external - элемент, переданный извне, автоматическое значение, назначаемое при наличии moveEl
		moveEl: экземпляр Resolute.Element - передвигаемый элемент, переданный опционально
		moveMode: 'vertical' / 'horizontal' - опциональная возможность передвижения только по вертикали или горизонтали, по умолчанию отключено
		finish: true/false - Опция приземления основного элемента при окончании движения, по умолчанию = true
			- true - передвинуть элемент на место окончания движения
			- false - ничего не делать c основным элементом
		inside: экземпляр Resolute.Element - элемент, ограничивающий основную область передвижения основного элемента
		excludes: [] - массив экземпляров Resolute.Element - элементы, ограничивающие движение внутри основной области, элементы-препятствия для передвигаемого элемента

	Сервисные функции для обработки результатов перемещения
		getPosition() - Получение текущих координат передвигаемого элемента
		getUnder(selector) - Получение элемента под передвигаемым - по текущим координатам ЦЕНТРА передвигаемого элемента
			Если не указан selector, возвращается верхний элемент
		setOnStart() - Возврат элемента на исходную позицию
		getStart() - Получение начальных координат передвигаемого элемента
 */
Resolute.namespace('Resolute.Elements.Plugins');
Resolute.Elements.Plugins.create('DragDrop', {
	mode: 'self',
	finish: true,
	init:function(a, b, c){
		this.inDrag = false;
		this.body = R.getBody();
		this.start = {};
		
		// Инициализация событий
		this.initEvents();

		// Установка опций
		this.setCfg(this.options);
	},
	setCfg: function(cfg){
		// установка объекта опций, переданных при инициализации плагина
		// принимаются строго определенные опции
		if(!isDefined(cfg) || !isObject(cfg)){
			cfg = this.options;
		}
		this.options = cfg;

		// Кастомные функции обработки движения
		this.onDrag = R.xp(cfg, 'onDrag'); // Кастомная функция на начало движения
		this.onDrop = R.xp(cfg, 'onDrop'); // Кастомная функция на конец движения
		this.onMove = R.xp(cfg, 'onMove'); // Кастомная функция на процесс движения

		// Окружение для функций
		this.scope = this;
		if(cfg.scope){
			this.scope = cfg.scope;
		}

		// Прочие принимаемые опции
		this.moveMode = R.xp(cfg, 'moveMode'); // Ограничение движения только по горизонтали или вертикали
		this.inside = R.xp(cfg, 'inside'); // Элемент, ограничивающий область передвижения основного элемента
		this.excludes = R.xp(cfg, 'excludes'); // Элементы-преграды, ограничивающий область передвижения основного элемента

		// Условно принимаемые опции (переопределение опций, установленных по умолчанию)
		if(R.xp(cfg, 'mode')){
			this.mode = R.xp(cfg, 'mode'); // Тип передвигаемого элемента (см. this.initMoveEl())
		}
		if(R.xp(cfg, 'moveEl')){
			this.moveEl = R.xp(cfg, 'moveEl'); // Передвигаемый элемент (см. this.initMoveEl())
			this.moveEl.hide();
			this.mode = 'external';
		}
		if(isDefined(cfg.finish)){
			this.finish = R.xp(cfg, 'finish'); // Передвигать основной элемент
		}
	},
	initEvents: function(){
		// Инициализация прослушивателей на элементe
		this.el.on('mousedown', this.drag, this);
		this.body.on('mouseup', this.drop, this);
		this.body.on('mousemove', this.move, this);
	},
	initMove: function(e){
		// Инициализация движения, расчет стартовых координат и величин
		// Показать передвигаемый элемент и навесить доп. классы на элементы
		this.moveEl.show();
		this.moveEl.setStyle('position', 'absolute');
		this.moveEl.addClass('inmove');
		this.el.addClass('dragdrop');

		var scrolls = this.getParentsScrolls(this.moveEl);
		
		// Стартовое позиционирование передвигаемого элемента относительно основного
		var elTop = this.el.getPosition().top;
		var elLeft = this.el.getPosition().left;
		this.moveEl.setTop(elTop);
		this.moveEl.setLeft(elLeft);

		// Фиксируем стартовую позицию
		this.start.left = this.moveEl.getPosition().left - R.xp(scrolls, 'left');
		this.start.top = this.moveEl.getPosition().top - R.xp(scrolls, 'top');
		this.start.x = e.getPageX();
		this.start.y = e.getPageY();

		// Фиксируем текущую позицию = стартовой
		this.top = this.start.top;
		this.left = this.start.left;
		this.x = this.start.x;
		this.y = this.start.y;

		// Ширина и длинна передвигаемого элемента
		this.w = this.moveEl.getWidth();
		this.h = this.moveEl.getHeight();

		// Ограничения на передвижения внутри заданной области
		if(this.inside && this.inside.getPosition){
			this.minLeft = this.inside.getPosition().left;
			this.minTop = this.inside.getPosition().top;
			this.maxLeft = this.minLeft + this.inside.getWidth() - this.w;
			this.maxTop = this.minTop + this.inside.getHeight() - this.h;
		}

		if(this.mode != 'self'){
			this.moveEl.hide();
		}
	},
	initMoveEl: function(){
		// Инициализация передвигаемого элемента (this.mode, this.moveEl)
		// Варианты значений: 
		//  self - передвигается сам элемент
		//	copy - передвигается копия элемента
		//	box - передвигается тривиальная копия элемента: прямоугольник с окантовкой, равный по размеру элементу
		// Помимо этих вариантов, можно передать сам передвигаемый элемент: this.moveEl, в этом случае this.mode передавать не нужно

		// передвигаемый элемент передан извне
		if(this.moveEl && this.mode == 'external'){
			this.moveEl.hide();
		}

		// self - передвигается сам элемент
		else if(this.mode == 'self'){
			this.moveEl = this.el;
		}

		// copy - передвигается копия элемента
		else if(this.mode == 'copy'){
			this.moveEl = this.el.clone();
			delete this.moveEl.id;
			delete this.moveEl.dom.id;
			this.el.parent().append(this.moveEl);
			this.moveEl.hide();
		}

		// self - передвигается сам элемент
		else if(this.mode == 'box'){
			var box = {st: 'border: 1px solid #000'};
			this.moveEl = this.el.parent().append(box, true);
			this.moveEl.setWidth(this.el.getWidth() - 2);
			this.moveEl.setHeight(this.el.getHeight() - 2);
			this.moveEl.hide();
		}
	},
	endMove: function(){
		// Действие с передвигаемым элементом по окончанию движения
		this.moveEl.removeClass('inmove');
		this.el.removeClass('dragdrop');

		// Если опция приземления = drop, перемещаем в конечную позицию основной элемент
		if(this.finish){
			this.el.setStyle('position', 'absolute');
			this.el.setTop(this.top);
			this.el.setLeft(this.left);
		}

		// Переданный извне moveEl скрывается
		if(this.mode == 'external'){
			this.moveEl.hide();
		}
		// Создаваемые элементы moveEl - удаляются
		if(this.mode == 'copy' || this.mode == 'box'){
			this.moveEl.remove();
		}

		// Вызов кастомной функции обработки конца движения
		this.endFail();
	},
	drag: function(e){
		// Начало движения
		this.inDrag = true;
		this.initMoveEl();
		this.initMove(e);
		this.setMove(e);

		// Вызов кастомной функции обработки начала движения
		if(this.onDrag && isFunction(this.onDrag)){
			this.onDrag.call(this.scope, this);
		}
	},
	drop: function(e){
		// Конец движения
		if(this.inDrag){
			// Для фиксации движения нужен сдвиг хотя бы на 2px
			if(Math.abs(this.start.y - this.y) < 2 && Math.abs(this.start.x - this.x) < 2){
				this.endMove();
				this.inDrag = false;
				return;
			}

			this.setMove(e);

			// Вызов кастомной функции обработки конца движения
			if(this.onDrop && isFunction(this.onDrop)){
				this.onDrop.call(this.scope, this);
			}

			this.endMove();
		}

		this.inDrag = false;
	},
	move: function(e){
		// Движение
		if(!this.inDrag){
			return;
		}

		// Для начала отрисовки движения нужен сдвиг хотя бы на 1px
		if(Math.abs(this.start.y - this.y) > 1 || Math.abs(this.start.x - this.x) > 1){
			this.moveEl.show();
		}

		this.setMove(e);

		if(this.moveEl.isHidden()){
			this.endFail();
			return;
		}

		// Вызов кастомной функции обработки движения
		if(this.onMove && isFunction(this.onMove)){
			this.onMove.call(this.scope, this);
		}
	},
	endFail: function(){
		// Кастомизация любого окончания процесса после его начала
		if(this.onEnd && isFunction(this.onEnd)){
			this.onEnd.call(this.scope, this);
		}
	},
	setMove: function(e){
		// Применение движения - от события
		e.stopPropagation();
		e.stopEvent();

		// Координаты мыши
		var x = e.getPageX();
		var y = e.getPageY();

		// Координаты передвигаемого элемента с учетом стартового смещения мыши внутри него
		var left = this.start.left + (x - this.start.x);
		var top = this.start.top + (y - this.start.y);

		// Движение по вертикали/горизонтали
		if(this.moveMode && this.moveMode == 'vertical'){
			left = this.start.left;
		}
		if(this.moveMode && this.moveMode == 'horizontal'){
			top = this.start.top;
		}

		// Препятствия
		if(this.excludes || !isEmpty(this.excludes)){
			var ex = this.tryExcludes(top, left);
			if(ex){
				left = ex.left;
				top = ex.top;
			}
		}

		// Ограничение на движение внутри элемента
		if(this.inside){
			if(left <= this.minLeft) left = this.minLeft;
			if(left >= this.maxLeft) left = this.maxLeft;
			if(top <= this.minTop) top = this.minTop;
			if(top >= this.maxTop) top = this.maxTop;
		}

		// Установка движения
		this.moveEl.setLeft(left);
		this.moveEl.setTop(top);

		// Фиксируем новое положение
		this.top = top;
		this.left = left;
		this.right = left + this.w;
		this.bottom = top + this.h;
		this.x = e.getPageX();
		this.y = e.getPageY();
	},
	tryExcludes: function(top, left){
		// Проверка пересечения передвигаемого элемента с элементами-препятствиями
		// Возвращает допустимые top, left с учетом препятствий
		// На входе расчетные top, left будущего положения передвигаемого элемента
		if(!top || ! left || !this.excludes || isEmpty(this.excludes)){
			return null;
		}
		var result = {top: top, left: left};

		// Расчетные right / bottom
		var right = left + this.w;
		var bottom = top + this.h;

		// Проверка пересечений с каждой из преград
		R.each(this.excludes, function(exEl){
			if(!exEl || !exEl.getPosition){
				return;
			}

			// Координаты и величины преграды
			var l = exEl.getPosition().left;
			var t = exEl.getPosition().top;
			var r = l + exEl.getWidth();
			var b = t + exEl.getHeight();

			// Проверка наличия пересечения с преградой
			if(bottom < t) return;
			if(top > b) return;
			if(left > r) return;
			if(right < l) return;

			// Отклонения между moveEl и преградой (относительно moveEl)
			var dleft = Math.abs(left - r);
			var dright = Math.abs(right - l);
			var dtop = Math.abs(top - b);
			var dbottom = Math.abs(bottom - t);

			// По наименьшему отклонению прилепляем moveEl к соответствующей стороне преграды
			if([dleft, dright, dtop, dbottom].min() == dleft){
				result.left = r;
			}
			else if([dleft, dright, dtop, dbottom].min() == dright){
				result.left = l - this.w;
			}
			else if([dleft, dright, dtop, dbottom].min() == dtop){
				result.top = b;
			}
			else if([dleft, dright, dtop, dbottom].min() == dbottom){
				result.top = t - this.h;
			}
		}, this);

		return result;
	},
	getPosition: function(){
		// Получение текущих координат передвигаемого элемента
		return {
			x: this.x,
			y: this.y,
			top: this.top,
			left: this.left
		}
	},
	getUnder: function(selector){
		// Получение элемента под передвигаемым - по текущим координатам ЦЕНТРА передвигаемого элемента
		// Если не указан selector, возвращается верхний элемент
		var centerX = this.left + this.w / 2;
		var centerY = this.top + this.h / 2;

		// Учет отклонения от верхней части окна из-за абсолютных элементов (document.elementsFromPoint их не учитывает)
		var dt = R.xp(this.moveEl.dom.getBoundingClientRect(), 'top');
		if(dt){
			dt = dt - this.top;
			centerY = centerY + dt;
		}

		// Получение элементов по координатам
		var els = document.elementsFromPoint(centerX, centerY);
		if(!els || !isArray(els) || isEmpty(els) || els.length < 2){
			return null;
		}

		// получение DOM элемента без селектора
		var domEl = els[0];
		if(domEl === this.moveEl.dom){
			domEl = els[1];
		}

		// Поиск по селектору в массиве els
		if(selector && isString(selector)){
			domEl = null;
			for (var i = 1; i < els.length; i++) {
				if(domEl) continue;
				
				var dEl = els[i];
				var parent = dEl.parentElement;
				if(!parent) continue;
				
				var pEls = parent.querySelectorAll(selector);
				R.each(pEls, function(pEl){
					if(pEl === dEl && pEl !== this.moveEl.dom){
						domEl = dEl;
					}
				}, this);
			}
		}
		if(!domEl){
			return null;
		}

		// Получение Resolute элемента
		var el = R.get(domEl);

		return el;
	},
	getStart: function(){
		// Получение исходных координат передвигаемого элемента
		return this.start
	},
	setOnStart: function(){
		// Возврат элемента на исходную позицию
		if(this.inDrag){
			this.endMove();
		}
		this.el.setTop(this.start.top);
		this.el.setLeft(this.start.left);
	},
	requestAnim: function(fn){
		// Декларировано, что такая функция может ускорять (избавлять от лагов) любую анимацию (прорисовку) элементов окна
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
	},
	getParents: function(el){
		// Сервисная: получение всех родителей элемента
		if(!el || !el.dom || !el.parent){
			return null;
		}

		var parents = [];
		var cel = el;
		while (cel.dom.tagName !== "BODY") {
			cel = cel.parent();
			parents.push(cel);
		}

		return parents;
	},
	getParentsScrolls: function(el){
		// Сервисная: вычисление суммарного скролла родителей элемента
		var scroll = {top: 0, left: 0};

		var parents = this.getParents(el);
		if(!parents || isEmpty(parents)){
			return scroll;
		}

		R.each(parents, function(p){
			scroll.top+= p.dom.scrollTop;
			scroll.left+= p.dom.scrollLeft;
		}, this);

		return scroll;
	}
});