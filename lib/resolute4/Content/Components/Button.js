/**
	Resolute.Forms.Button
	Базовый компонент кнопки формы. 

	Инициализация вне контекста:  
	var btn = new R.Forms.Button({
		renderTo: '<id родителя, куда нужно прорисовать поле>', 
		label: '<Надпись на кнопке>',
		icon: '<materialicon>',
		callback: <function>,
		scope: <callback scope>,
		tooltip: '<текст плавающей подсказки к элементу>',
		disabled: true/false,
		hidden: true/false
	});

	Компонент обеспечивает:
	- прорисовку элемента поля 
	- обработка клика: 
	 - инициация события для внешних прослушивателей 
	 и/или 
	 - возврат события в переданную функцию callback в окружении scope

	CSS Стили элемента описаны в resolute4-form-button.css 
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.Button = Resolute.extend(Resolute.Component, {
	label: 'Button',
	initComponent: function(){
		// Возмодные события элемента - только клик
		this.addEvents('click');

		// Разметка элемента
		this.markup = {cls: 'resolute-form-button unselectable', cn:[], a: {tabindex: 0}};
		if(this.icon){
			var icon = R.CSS.snippets.get('materialicon', this.icon);
			this.markup.cn.push(icon);
			this.markup.cls+= ' iconed';
		}
		this.markup.cn.push({cls: 'label', cn: this.label || ''});

		if(!this.width){
			this.markup.st = 'width: max-content';
		}

		// Родительский initComponent
		Resolute.Forms.Button.superclass.initComponent.call(this);
	},
	onRender:function(){
		Resolute.Forms.Button.superclass.onRender.call(this);

		if(this.hidden){
			this.hide();
		}
		if(this.tooltip){
			this.setTooltip(this.tooltip);
		}

		this.mon(this.getEl(), 'click', this.onClick, this);
		this.mon(this.getEl(), 'keyup', this.onClick, this);
	},
	onClick: function(e){
		// обработка клика
		if(this.disabled){
			return;
		}

		// Кнопки клавиатуры - только Enter и Space
		if(e && e.getKey && e.getKey() && !inArray(e.getKey(), [13, 32])){
			return;
		}

		// Событие для внешних прослушивателей
		this.fireEvent('click', this);

		// Если передан callback, вызываем его в пространстве scope
		if(this.callback && isFunction(this.callback)){
			var scope = this.scope || this;
			this.callback.call(scope);
		}
	}
});
Resolute.reg('button', Resolute.Forms.Button);