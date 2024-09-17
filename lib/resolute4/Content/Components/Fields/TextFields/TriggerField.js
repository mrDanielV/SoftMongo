/**
	Resolute.Forms.TriggerField
	Компонент с поддрежкой кнопок рядом с текстовым полем
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.TriggerField = Resolute.extend(Resolute.Forms.TextField, {
	initComponent: function(){
		if(this.cls) this.cls += ' triggerfield';
		Resolute.Forms.TriggerField.superclass.initComponent.call(this);
		// Инициализация событий
		this.addEvents(
			'buttonclick'
		);
	},
	onRender: function(){
		Resolute.Forms.TriggerField.superclass.onRender.call(this);
		// Отрисовка кнопок
		this.initButtons();
	},
	onButtonClick:function(btn){
		this.fireEvent('buttonclick', btn , this);
	},
	isButtonHidden:function(btn){
		var b = this.getButton(btn);
		if(!b) return true;
		if(b.el){
			return b.el.hasClass('resolute-hidden');
		};
		return true;
	},
	showButton:function(btn){
		var b = this.getButton(btn);
		if(!b) return;
		if(b.el){
			b.el.show();
		}
	},
	hideButton:function(btn){
		var b = this.getButton(btn);
		if(!b) return;
		if(b.el){
			b.el.hide();
		}
	},
	getButton:function(btn){
		var c = btn;
		var res = null;
		if(Resolute.isObject(btn) && btn.code) c = btn.code;
		Resolute.each(this.buttons,function(button,index){
			if(button.code==c){
				res = button;
			}
		},this);
		return res;
	},
	removeButton:function(btn){
		
	},
	addButton:function(btn,index){
		if(btn.icon){
			var btnMarkup = {cls:'button has-icon',cn:Resolute.jsml.icon(btn.icon)};
		} else {
			var btnMarkup = {cls:'button text',cn:btn.text};
		};
		var isNew = (index>=0);
		var ind = (isNew)?this.buttons.length:index;
		var btnEl = this.getEl('buttons').append(btnMarkup,true);
		btnEl.data('index',ind);
		if(btn.cls){
			btnEl.addClass(btn.cls);
		};
		if(btn.icon && btn.iconCls){
			btnEl.child('.icon').addClass(btn.iconCls);
		};
		this.mon(btnEl,'click',function(event,el){
			var ind = btnEl.data('index');
			if(!ind) return;
			this.onButtonClick(this.buttons[ind]);
		},this);
		if(isNew){
			this.buttons[ind] = btn;
		};
		this.buttons[ind].el = btnEl;
		if(btn.hidden){
			this.buttons[ind].el.hide();
		};
		if(btn.tooltip){
			this.buttons[ind].el.setAttribute('data-tooltip',btn.tooltip);
		}
	},
	initButtons:function(){
		if(!this.buttons) return;
		var parent = this.getEl().parent('.field');
		if(parent) parent.addClass('trigger');
		this.addEl('buttons',this.getEl().after({cls:'buttons'}));
		Resolute.each(this.buttons,function(btn,index){
			this.addButton(btn,index);
		},this);
	}
});
Resolute.reg('triggerfield', Resolute.Forms.TriggerField);