/**
	Resolute.Forms.TextArea
	Многострочное текстовое поле формы.

	var tafield = new R.Forms.TextArea({renderTo: 'ext-comp-1012', mandatory: true, height: 100, resize: true, grow: true})

	Инициализация вне контекста:  
	var field = new R.Forms.TextArea({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		mandatory: true/false,
		height: <integer - высота элемента в px>,
		resize: false ('none') / true ('vertical') / 'both', - пользовательское "растяжение" элемента
		grow: true/false, - автоматическое растяжение элемента по вертикали при вводе текста
		tab: true/false, - разрешить ввод TAB в текст
		codding: false, // сохранение отступов новой строки, автокавычки, автоскобки
		прочие параметры - см. по коду + см. TextField
	});

	Компонент является расширением Resolute.Forms.TextField и обеспечивает:
	- Ввод многострочного текста
	- Возможность авто-растяжение поля ввода по вертикали по мере ввода текста
 */
Resolute.ns('Resolute.Forms');

Resolute.Forms.TextArea = Resolute.extend(Resolute.Forms.TextField, {
	resize: false, // пользовательское изменение размеров: false ('none') / true ('vertical') / 'both'
	grow: false, // авторастяжение по вертикали
	growMax: 0, // Максимальный предел (px) авторастяжения по вертикали
	tab: false,	// разрешить ввод TAB в текст
	codding: false, // сохранение отступов новой строки, автокавычки, автоскобки
	showClearButton: false,
	errors: {
	},
	initComponent: function(){
		this.addEvents('grow');

		// Совмещение ошибок
		this.errors = R.apply(Resolute.Forms.TextArea.superclass.errors, this.errors);

		// используемый шаблон поля
		this.markup = {t: 'textarea',ref:'main',a:{spellcheck:'false'}};

		if(this.width){
			this.markup.st = 'width: ' + this.width + 'px;';
		}
		if(this.attr){
			this.markup.a = this.attr;
		}

		this.cls += ' textarea';
		
		// Вызов initComponent Resolute.Forms.TextField
		Resolute.Forms.TextArea.superclass.initComponent.call(this);
	},
	onRender: function(){
		// разница высоты между wrap и textinput
		var wrap = this.getEl('field');
		this.wrapHd = wrap.getHeight() - this.el.getHeight();

		// Вызов onRender Resolute.Forms.TextField
		Resolute.Forms.TextArea.superclass.onRender.call(this);

		// Инициализация высоты
		this.setHeight();

		// Установка раздвигаемости элемента
		if(this.resize !== false){
			this.setResize();
		}

		// сохранение начальной высоты элемента
		this.initHeight = this.height;

		this.getEl().on('resize', this.onResize, this);
		this.autoSize();
	},
	setText: function(){
		// Переопределение родительского setText() ради вызова авторастяжения при назначении текста
		Resolute.Forms.TextArea.superclass.setText.call(this);
		this.autoSize();
	},
	beforeKey: function(e){
		// На нажатие клавиши
		var key = e.getKey();

		// Ввод TAB в текст
		if(this.tab && key == 9){
			e.stopEvent();
			this.insertAtCursor('\t');
		}
	},
	onKey: function(e){
		// обеспечение функционала "codding"
		var key = e.getKey();

		if(this.codding){
			var el = this.getEl();
			var text = this.getText();
			var pos = el.dom.selectionStart;

			// На Enter - сохранение отступов строки
			if(key == 13){
				var textBefore = text.substring(0, pos);
				var lines = textBefore.split('\n');
				var nlines = lines.length;
				var prevLine = lines[nlines - 1];
				var tabs = prevLine.match(/^\s+/);
				if(tabs && isArray(tabs)){
					this.insertAtCursor('\n' + tabs[0]);
					e.stopEvent();
				}
			}

			// автокавычки и автоскобки
			if(inArray(key, [34, 39, 91, 123])){
				var visavis = {91: 93, 123: 125};
				var s1 = String.fromCharCode(key);
				var s2 = String.fromCharCode(key);
				if(visavis[key]){
					s2 = String.fromCharCode(visavis[key]);
				}
				var ss = s1 + s2;
				this.insertAtCursor(ss);
				el.dom.setRangeText('', pos + 1, pos + 1, 'end');
				e.stopEvent();
			}
		}
	},
	setHeight: function(h){
		// изменение высоты элемента
		if(!this.rendered){
			return;
		}
		
		if(!isDefined(h)){
			h = this.height;
		}
		
		h = parseInt(h);
		if(!isNumber(h)){
			h = 55;
		}

		this.height = h;

		var el = this.getEl();
		if(el){
			el.setHeight(h - this.wrapHd);
		}
	},
	setResize: function(resize){
		// установка свойства пользовательского изменения размера элемента
		// CSS resize, ограниченное значениями нет (false, 'none'), по-вертикали (true, 'vertical') и как угодно ('both')
		if(!this.rendered){
			return;
		}
		
		if(!isDefined(resize)){
			resize = this.resize;
		}
		this.resize = resize;

		if(this.resize === false || this.resize == 'none'){
			this.resize = 'none';
		}
		else if(this.resize && this.resize != 'both'){
			this.resize = 'vertical';
		}

		var el = this.getEl();
		if(el){
			el.dom.style.resize = this.resize;
		}
	},
	onResize: function(){
		var el = this.getEl();
		var wrap = this.getEl('field');
		if(!el){
			return;
		}

		var h = el.getHeight();
		if(h && wrap){
			wrap.setHeight(h + this.wrapHd);
		}
	},
	afterKey: function(e, cc){
		// реакция на ввод текста, вызов авторастяжения
		if(!cc){
			return;
		}
		var k = e.getKey();

		this.autoSize(k);
	},
	autoSize: function(k){
		// авторастяжение элемента по вертикали
		if(!this.grow || !this.rendered){
			return;
		}
		var el = this.getEl();
		var wrap = this.getEl('field');

		if(k == 8 || k == 46){
			this.el.setHeight(this.initHeight + 8);
			if(wrap) wrap.setHeight(this.initHeight + 8 + this.wrapHd);
		}

		var scrH = el.dom.scrollHeight;
		var h = el.getHeight();
		
		if(this.growMax && scrH > this.growMax) {
			scrH = this.growMax;
		}
		
		if(scrH > h){
			el.setHeight(scrH + 8);
			if(wrap) wrap.setHeight(scrH + 8 + this.wrapHd);
		}

		this.onResize();

		this.fireEvent('grow', this);
	},
	insertAtCursor: function(text){
		var el = this.getEl();
		if(!el || R.xp(el.dom, 'selectionStart') === null){
			return;
		}

		var start = el.dom.selectionStart;
		var end = el.dom.selectionEnd;
		el.dom.setRangeText(text, start, end, 'end');

		this.setValue(this.el.dom.value);
	}
});
Resolute.reg('textarea', Resolute.Forms.TextArea);
