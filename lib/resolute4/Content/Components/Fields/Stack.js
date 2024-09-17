/*

*/
Resolute.ns('Resolute.Forms');
Resolute.Forms.Stack = Resolute.extend(Resolute.Forms.Field, {
	direction:'horizontal',	// Направление отрисовки списка (horizontal - горизонтально; vertical - вертикально)
	initComponent: function(){
		// используемый шаблон поля
		this.fields = Resolute.clone(this.items || []);
		delete this.items;
		this.fieldContainer = true;
		Resolute.each(this.fields,function(fld){
			if(fld.flex){
				if(fld.cls){
					fld.cls += ' flex-'+fld.flex;
				} else {
					fld.cls = 'flex-'+fld.flex;
				}
			};
		},this);
		
		this.markup = this.fields;
		
		this.cls += ' stack';
		
		if(this.direction == 'vertical'){
			this.markup.cls += ' vertical';
		};
		Resolute.Forms.Stack.superclass.initComponent.call(this);
	},
	onRender: function(){
		Resolute.Forms.Stack.superclass.onRender.call(this);
		Resolute.each(this.components,function(fld,id){
			fld.ownerCmp = this;
			fld.on('change',this.onFieldChange,this);
		},this);
	},
	getValue:function(){
		return null;
	},
	setValue:function(){
		return null;
	},
	each:function(fn,scope){
		Resolute.each(this.components,function(fld,index){
			fn.call(scope||this,fld,index);
		},this);
	},
	onFieldChange:function(fld){
		this.fireEvent('change', fld);
	}
});
Resolute.reg('stack', Resolute.Forms.Stack);