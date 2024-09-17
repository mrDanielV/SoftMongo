/**
	Resolute.Forms.DisplayField
	DIV c заданным текстом

	var display = new R.Forms.DisplayField({renderTo: 'ext-comp-1012', html: '111'})

	Инициализация вне контекста:  
	var display = new R.Forms.DisplayField({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		html:'', // текст
		style: '' // CSS-стили
	});
 */
Resolute.ns('Resolute.Forms');

Resolute.Forms.DisplayField = Resolute.extend(Resolute.Forms.Field, {
	html: '',
	initComponent: function(){
		this.markup = {t: 'div', cn: this.html};
		this.html = null;
		this.cls += ' display';
		
		// Вызов initComponent родителя
		Resolute.Forms.DisplayField.superclass.initComponent.call(this);
	},
	setText: function(html){
		// установка текстового значения в поле
		if(!this.rendered || !this.getEl()){
			return;
		}

		var text = html || this.value;
		if(!text || !isString(text)){
			text = '';
		}

		this.getEl().setHtml(text);
	},
	setHtml: function(html){
		this.setText(html);
	},
	setValue: function(v){
		// установка значения
		Resolute.Forms.DisplayField.superclass.setValue.call(this, v);

		this.value = v;
		this.setText();

		this.onSetValue();
	}
});
Resolute.reg('display', Resolute.Forms.DisplayField);
