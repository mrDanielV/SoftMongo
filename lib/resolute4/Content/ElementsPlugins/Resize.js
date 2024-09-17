// Палгин для изменения размеров элемента
Resolute.namespace('Resolute.Elements.Plugins');
Resolute.Elements.Plugins.create('Resize',{
	init:function(){
		this.sides = {};
		if(this.options.sides) this.sides = this.options.sides;
		this.isResizeInit = false;
		var sides = ['nw','n','ne','e','se','s','sw','w'];

		Resolute.each(sides,function(side){
			if(this.sides[side] || this.sides.all){
				this.el.append({cls:'resizer '+side,attr:{side:side}});
			}
		},this);
		if(this.el.getComputedStyle('position') == 'static'){
			this.el.setStyle('position','relative');
		};
		this.resizeWash = Resolute.getBody().query('.resizer-wash') || Resolute.getBody().append({cls:'resizer-wash hidden'},true);
		
		this.isResizeInit = true;
		this.el.on('mousedown',this.onMouseDown,this);
		this.resizeWash.on('mousemove',this.onMouseMove,this);
		this.resizeWash.on('mouseup',this.onMouseUp,this);
	},
	remove:function(){
		this.isResizeInit = false;
		this.el.un('mousedown',this.onMouseDown,this);
		this.resizeWash.un('mousemove',this.onMouseMove,this);
		this.resizeWash.un('mouseup',this.onMouseUp,this);
		Resolute.select('.resizer',this.el).remove();
	},
	onMouseDown:function(event){
		var el = Resolute.get(event.target);
		if(el.matches('.resizer')){
			this.elRect = this.el.getRect();
			
			this.isResizeStart = true;
			this.resizeStartXY = event.xy;
			this.resizeWash.removeClass('hidden');
			
			this.resizeBorder = Resolute.getBody().append({cls:'resizer-border'},true);
			this.resizeBorder.setRect({
				top:this.elRect.top,
				left:this.elRect.left,
				width:this.elRect.width,
				height:this.elRect.height
			});
			
			this.activeSide = el.getAttribute('data-side');
			this.resizeWash.addClass(this.activeSide);
		}
	},
	onMouseMove:function(event){
		if(this.isResizeStart){
			this.resizeCurrentXY = event.xy;
			if(this.isScheduledResize) return;
			this.isScheduledResize = true;
			requestAnimationFrame(this.mouseMove.createDelegate(this));
		};
	},
	mouseMove:function(){
		if(!this.resizeCurrentXY) return;
		var diffX = this.resizeCurrentXY[0]-this.resizeStartXY[0],
			diffY = this.resizeCurrentXY[1]-this.resizeStartXY[1];

		this._syncEl(this.resizeBorder,diffX,diffY);
		this.isScheduledResize = false;
	},
	onMouseUp:function(event){
		if(this.isResizeStart){
			var xy = event.xy,
				diffX = xy[0]-this.resizeStartXY[0],
				diffY = xy[1]-this.resizeStartXY[1];

			this.resizeBorder.remove();
			this.resizeWash.addClass('hidden').removeClass('nw n ne e se s sw w');

			this._syncEl(this.el,diffX,diffY);

			this.resizeStartXY = null;
			this.resizeCurrentXY = null;
			this.activeSide = null;
			this.elRect = this.el.getRect();
			
			this.isResizeStart = false;
		}
	},
	_syncEl:function(el,diffX,diffY){
		// PRIVATE
		switch(this.activeSide){
			case 'e':
					el.setWidth(this.elRect.width+diffX);
				break;
			case 's':
					el.setHeight(this.elRect.height+diffY);
				break;
			case 'n':
					el.setTop(this.elRect.top+diffY);
					el.setHeight(this.elRect.height-diffY);
				break;
			case 'w':
					el.setLeft(this.elRect.left+diffX);
					el.setWidth(this.elRect.width-diffX);
				break;
			case 'se':
					el.setWidth(this.elRect.width+diffX);
					el.setHeight(this.elRect.height+diffY);
				break;
			case 'nw':
					el.setTop(this.elRect.top+diffY);
					el.setHeight(this.elRect.height-diffY);
					el.setLeft(this.elRect.left+diffX);
					el.setWidth(this.elRect.width-diffX);
				break;
			case 'sw':
					el.setHeight(this.elRect.height+diffY);
					el.setLeft(this.elRect.left+diffX);
					el.setWidth(this.elRect.width-diffX);
				break;
			case 'ne':
					el.setWidth(this.elRect.width+diffX);
					el.setTop(this.elRect.top+diffY);
					el.setHeight(this.elRect.height-diffY);
				break;
		};
	}
});