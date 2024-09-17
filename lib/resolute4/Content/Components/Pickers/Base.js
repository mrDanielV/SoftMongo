Resolute.ns('Resolute.Pickers');
Resolute.Pickers.init = function(){
	window.addEventListener('scroll',Resolute.Pickers.onScroll,true);
	window.addEventListener('click',Resolute.Pickers.onClick,true);
	window.addEventListener('wheel',Resolute.Pickers.onWheel,true);
	window.addEventListener('keydown',Resolute.Pickers.onKey,true);
	window.addEventListener('mouseover',Resolute.Pickers.onHover,true);
	window.addEventListener('mouseout',Resolute.Pickers.onOut,true);
};
Resolute.Pickers.onScroll = function(event){
	// Делаем debounce вызова скролла: пока мы не переместим пикер на новую позицию, не даём вызывать снова onScroll. Так же помещаем наш код в requestAnimationFrame для исключения тормозов интерфейса.
	// Результат такого подхода - плавность перемещения пикера и отзывчивость интерфейса
	if(Resolute.Pickers.isScheduledScroll) return;
	Resolute.Pickers.isScheduledScroll = true;
	requestAnimationFrame(function(){
		var node = event.target;
		Resolute.each(Resolute.Pickers.cache,function(picker,id){
			if(picker && picker.alignTo){
				var alignEl = Resolute.get(picker.alignTo),
					targetEl = Resolute.get(node);
				if(targetEl && targetEl.contains(alignEl)){
					picker.align();
				};
				if(!alignEl.isVisibleInScroll()){
					picker.hide();
				}
			}
		});
		Resolute.Pickers.isScheduledScroll = false;
	});
};
Resolute.Pickers.onClick = function(event){
	var node = event.target;
	Resolute.each(Resolute.Pickers.cache,function(picker,id){
		if(picker){
			var targetEl = Resolute.get(node);
			var alignEl = Resolute.get(this.alignTo);
			if(!picker.getEl('layer').contains(targetEl)){
				picker.hide();
				if(targetEl.contains(alignEl) || R.xp(targetEl, 'dom.id') == R.xp(alignEl, 'dom.id')){
					if(!R.xp(picker, 'propagationParentClick')){
						event.stopPropagation();
					}
				}
			} else {
				//event.stopPropagation();
				if(picker.onClick){
					var res = picker.onClick(event);
					if(res === false){
						return;
					};
					picker.hide();
				}
			}
		}
	});
};
Resolute.Pickers.onWheel = function(event){
	var node = event.target;
	Resolute.each(Resolute.Pickers.cache,function(picker,id){
		if(picker){
			var targetEl = Resolute.get(node);
			if(picker.onWheel && picker.getEl().contains(targetEl)){
				var res = picker.onWheel(event);
				if(res === false){
					return;
				}
				event.stopPropagation();
			};
		}
	});
};
Resolute.Pickers.onKey = function(event){
	var node = event.target;
	Resolute.each(Resolute.Pickers.cache, function(picker,id){
		if(picker && !picker.hidden && picker.onKey){
			picker.onKey.call(picker, event);
		}
	});
};
Resolute.Pickers.onHover = function(event){
	var node = event.target;
	Resolute.each(Resolute.Pickers.cache, function(picker,id){
		if(picker && !picker.hidden && picker.onHover){
			picker.onHover.call(picker, event);
		}
	});
};
Resolute.Pickers.onOut = function(event){
	var node = event.target;
	Resolute.each(Resolute.Pickers.cache, function(picker,id){
		if(picker && !picker.hidden && picker.onOut){
			picker.onOut.call(picker, event);
		}
	});
};

Resolute.Pickers.hide = function(){
	Resolute.each(Resolute.Pickers.cache,function(picker,id){
		if(picker){
			picker.hide();
		}
	});
};

Resolute.Pickers.cache = {};

Resolute.Pickers.init();


Resolute.Pickers.Base = Resolute.extend(Resolute.Component, {
	wrap:true,
	resizeEl:'layer',
	hideEl:'layer',
	floating:true,
	pageSlide:'up',
	markup:{
		cls:'picker unselectable',
		ref:'layer'
	},
	initComponent:function(){
		if(!this.width) this.width = 200;
		if(!this.offsets){
			this.offsets = [0,0];
		};
		if(!this.renderTo) this.renderTo = Resolute.getBody();
		if(this.markup.cn && Resolute.isArray(this.markup.cn) && !this.markup.cn.has({ref:'page'})){
			this.markup.cn.push({cls:'page hidden slide-'+this.pageSlide,ref:'page'});
		};
		Resolute.Pickers.Base.superclass.initComponent.call(this);
	},
	align:function(){
		if(this.hidden) return;
		if(!this.rendered) return;
		if(!this.alignTo) return;
		var alignEl = Resolute.get(this.alignTo);
		if(alignEl){
			var ap = this.getEl('layer').getAlignToXY(alignEl,'tl-bl?',this.offsets);
			this.getEl('layer').setRect({top:ap[1],left:ap[0]});
			if(this.autoWidth){
				this.getEl('layer').setWidth(alignEl.getWidth());
			}
		}
	},
	onRender:function(){
		this.align();
		Resolute.Pickers.cache[this.id] = this;
		this.getEl('layer').setStyle('z-index',Resolute.get(this.alignTo).getZ());
	},
	hide:function(){
		if(!this.floating){
			Resolute.Pickers.Base.superclass.hide.call(this);
			return;
		};
		this.hidden = true;
		if(this.onHide) this.onHide.call(this.scope||this);
		this.destroy();
	},
	destroy:function(){
		if(this.floating) delete Resolute.Pickers.cache[this.id];
		Resolute.Pickers.Base.superclass.destroy.call(this);
	}
});

Resolute.Pickers.show = function(picker,cfg){
	if(!Resolute.Pickers[picker]) return false;
	var p = new Resolute.Pickers[picker](cfg);
	Resolute.Tooltips.hide();
	p.show();
	return p;
};