// Пикер для комбобокса

Resolute.ns('Resolute.Pickers');
Resolute.Pickers.List = Resolute.extend(Resolute.Pickers.Base, {
	initComponent:function(){
		//if(!this.width) this.width = 'auto';
		if(!this.height) this.height = 'auto';
		this.autoWidth = true;
		this.markup = {
			cls:'picker list unselectable',
			//a:{tabindex:'0'},
			ref:'layer'
		};
		Resolute.Pickers.List.superclass.initComponent.call(this);
	},
	onRender:function(){
		Resolute.Pickers.List.superclass.onRender.call(this);
		this.view = new Resolute.ListView({
			data:this.data,
			query: this.query,
			value:this.value,
			multiselect:this.multiselect,
			cls:'bgcolor-fff',
			itemTpl:this.itemTpl,
			renderTo:this.getEl('layer'),
			listeners:{
				itemInternalClick:function(listview,el,clickCode,data){
					listview.select(data,false,true);
					console.log('click2',arguments);
				},
				itemClick:function(cmp,el,data){
					if(this.callback){
						this.callback.call(this.scope||this,cmp.getSelected());
					};
					this.hide();
					return true;
				},
				scope:this
			}
		});
		//this.view.getEl().focus();
	},
	onKey: function(event){
		// Обработка передвижения стрелками по элементам списка и выбора клавишей Enter (Esc - закрыть)
		if(!Resolute.Event.isKey(event,['down','up','left','right','enter','escape'])) return;
		
		event.preventDefault();
		
		if(Resolute.Event.isKey(event,'down')){
			this.view.hoverMove(1);
		} else if(Resolute.Event.isKey(event,'up')){
			this.view.hoverMove(-1);
		} else if(Resolute.Event.isKey(event,'left')){
			this.view.hoverFirst();
		} else if(Resolute.Event.isKey(event,'right')){
			this.view.hoverLast();
		} else if(Resolute.Event.isKey(event,'enter')){
			this.view.clickHover();
		} else if(Resolute.Event.isKey(event,'escape')){
			this.hide();
		}
	}
});