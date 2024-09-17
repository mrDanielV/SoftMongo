Resolute.namespace('Resolute.Grid');

Resolute.Grid.Columns = function(cols,grid){
	this.items = [];
	this.grid = grid;
	this.addEvents(
		'add',
		'remove'
	);
	if(cols && Resolute.isArray(cols)){
		Resolute.each(cols,function(item,index){
			var cfg = item;
			cfg.index = index;
			if(!cfg.order) cfg.order = index;
			this.add(cfg);
		},this);
	};
};
Resolute.extend(Resolute.Grid.Columns, Resolute.Observable, {
	add:function(cfg){
		if(Resolute.isString(cfg)){
			cfg = {
				type:cfg,
				isSticky:true,
				resizable:false,
				width: 32
			}
		};
		if(!cfg.listeners){
			cfg.listeners = {
				show:this.onColumnShow,
				hide:this.onColumnHide,
				width:this.onColumnWidthChange,
				order:this.onColumnOrderChange,
				sticky:this.onColumnStickyChange,
				rotate:this.onColumnRotateChange,
				scope:this
			};
		};
		if(!cfg.type) cfg.type = 'column';
		cfg.columns = this;
		cfg.grid = this.grid;
		this.items.push(new Resolute.Grid.Column(cfg));
		this.fireEvent('add',cfg);
	},
	get:function(col,all){
		// Получить колонку (по индексу, коду или по запросу)
		if(Resolute.isNumber(col)){
			return this.items[col];
		} else if(Resolute.isObject(col)){
			var res = (all)?[]:null;
			this.each(function(c,index){
				if(Resolute.match(c,col)){
					if(all){
						res.push(c);
					} else {
						res = c;
					}
				}
			},this);
			return res;
		} else if(Resolute.isString(col)){
			// По path колонки
			this.each(function(c,index){
				if(с.path == col || c.code == col){
					if(all){
						res.push(c);
					} else {
						res = c;
					}
				}
			},this);
		};
		return null;
	},
	remove:function(col){
		this.fireEvent('remove',cfg);
	},
	each:function(fn,scope,finalFn){
		Resolute.each(this.items,fn,scope||this);
		if(finalFn){
			finalFn.call(scope||this);
		}
	},
	width:function(){
		
	},
	state:function(cfg){
		// Получение/установка состояния колонок грида (порядок, ширины и прочее)
		if(cfg){
			
		} else {
			var res = [];
			this.each(function(col,index){
				res.push({
					index:index,
					order:col.order,
					width:col.el.getWidth(),
					hidden:col.isHidden,
					sticky:col.isSticky,
					rotated:col.isRotated
				})
			},this);
			return res;
		}
	},
	getMaxColumnHeight:function(obj){
		var m = 0, column = null;
		this.each(function(col,index){
			var h = col.el.getHeight();
			if(h>m){
				m = h;
				column = col;
			}
		});
		return (obj)?{height:m,column:column}:m;
	},
	onColumnShow:function(col){
		
	},
	onColumnHide:function(col){
		
	},
	onColumnWidthChange:function(col){
		
	},
	onColumnOrderChange:function(col){
		
	},
	onColumnStickyChange:function(col){
		
	},
	onColumnRotateChange:function(col){
		this.grid.syncSize();
	}
});

// Отдельная колонка
Resolute.Grid.Column = function(cfg){
	this.name = cfg.name;
	this.columns = cfg.columns;
	this.grid = cfg.grid;
	this.width = cfg.width || 120;
	this.cls = cfg.cls || null;
	
	
	this.isAttached = false;
	this.attachTo = null;
	
	this.renderer = cfg.renderer || null;
	if(this.renderer){
		var rend = [];
		if(Resolute.isObject(this.renderer)){
			rend.push(this.renderer)
		} else if(Resolute.isString(this.renderer)){
			rend.push({code:this.renderer})
		} else if(Resolute.isArray(this.renderer)){
			rend = Resolute.clone(this.renderer)
		};
		this.renderer = rend;
	} else {
		this.renderer = [];
	}
	this.editable = cfg.editable || false;
	this.resizable = cfg.resizable || false;
	this.order = cfg.order || 0;
	this.isSticky = cfg.sticky || false;
	this.isHidden = cfg.hidden || false;
	this.isRotated = cfg.rotated || false;
	this.cellTpl = cfg.cellTpl || null;
	this.el = cfg.el || null;
	this.code = cfg.code || null;
	
	this.path = cfg.path || null;
	this.type = cfg.type || 'column';
	if(this.type == 'number') this.cls += ' number';
	this.index = cfg.index || 0;
	
	this.attached = [];
	
	this.addEvents(
		'show',
		'hide',
		'order',
		'sticky',
		'rotate',
		'width'
	);
};
Resolute.extend(Resolute.Grid.Column, Resolute.Observable,{
	headerMarkup:function(){
		var m = {
			cls:'column flex center col-'+this.index,
			a:{column:this.index},
			cn:[
				{t:'span',cls:'name',cn:this.name},
				{t:'span',cls:'resizer'}
			]
		};
		if(this.isHidden) m.cls += ' resolute-hidden';
		if(this.isRotated) m.cls += ' rotated';
		if(this.isSticky) m.cls += ' sticky';
		if(this.cls) m.cls += ' '+this.cls;

		return m;
	},
	cellMarkup:function(data){
		if(this.path){
			var v = '{'+this.path+'}';
		} else if(this.cellTpl){
			var v = this.cellTpl;
		} else if(this.type != 'column'){
			if(this.type == 'number'){
				var v = '{_rowNumber}';
			}
		}
		
		var cf = {
			cls:'cell col-'+this.index+((this.cls)?' '+this.cls:''),
			attr:{},
			cn:v || '&nbsp;'
		};
		if(this.path) cf.attr.path = this.path;
		if(this.renderer.length>0 && this.path){
			Resolute.each(this.renderer,function(renderer){
				if(Resolute.isString(renderer)){
					renderer = {code:renderer}
				};
				cf = Resolute.Grid.renderers.apply(renderer.code,{
					path:this.path,
					data:data,
					markup:cf,
					params:(renderer.params)?renderer.params:{}
				})
			},this)
		};
		return cf;
	},
	hasRenderer:function(code){
		var res = false;
		Resolute.each(this.renderer,function(r){
			if(Resolute.isString(r) && r==code) res = true;
			if(r.code == code) res = true;
		});
		return res;
	},
	setEl:function(el){
		this.el = el;
	},
	show:function(){
		// Показать колонку
		var rule = Resolute.CSS.getStyleSheetRule(this.grid.styleSheet,'#'+this.grid.id+' .col-'+this.index);
		if(rule){
			rule.style.display = 'flex';
		}
		this.fireEvent('show',this);
	},
	hide:function(){
		// Скрыть колонку
		var rule = Resolute.CSS.getStyleSheetRule(this.grid.styleSheet,'#'+this.grid.id+' .col-'+this.index);
		if(rule){
			rule.style.display = 'none';
		}
		this.fireEvent('hide',this);
	},
	attach:function(col){
		var clmn = this.columns.get(col);
		if(!clmn) return;
		clmn.attached.push(this.index);
		Resolute.select('.cell.col-'+clmn.index,this.grid.getEl('body')).each(function(el){
			var rowEl = el.up('.row'),
				code = parseInt(rowEl.getAttribute('data-code'));
			el.addClass('merged').removeAttribute('data-path').empty('').dom.style = '';
			var data = this.grid.data.get(code);
			if(clmn.path){
				var cf = clmn.cellMarkup(data);
				cf.cls = 'cell sub';
				console.log(Resolute.jsml.apply(el,cf,data));
			};
			if(this.path){
				var cf = this.cellMarkup(data);
				cf.cls = 'cell sub';
				Resolute.jsml.apply(el,cf,data);
			};
		},this);
		this.isAttached = true;
		this.attachTo = col;
		this.hide();
	},
	unattach:function(){
		
	},
	getOrder:function(o){
		return this.setOrder();
	},
	setOrder:function(o){
		// Установка/чтение порядка размещения колонки
		var rule = Resolute.CSS.getStyleSheetRule(this.columns.grid.styleSheet,'#'+this.columns.grid.id+' .col-'+this.index);
		if(Resolute.isDefined(o)){
			if(rule){
				rule.style.order = o;
				this.fireEvent('order',this,o);
			};
			return this;
		};
		var or = this.index;
		if(rule && rule.style.order){
			or = rule.style.order;
		};
		return or;
	},
	getWidth:function(){
		return this.setWidth();
	},
	setWidth:function(w){
		// Установка/чтение ширины колонки
		if(Resolute.isDefined(w)){
			var rule = Resolute.CSS.getStyleSheetRule(this.columns.grid.styleSheet,'#'+this.columns.grid.id+' .col-'+this.index);
			if(rule){
				rule.style.width = (Resolute.isNumber(w))?w+'px':w;
				this.columns.grid.syncSize();
				this.fireEvent('width',this,w);
			};
			return this;
		};
		return this.el.getWidth();
	},
	sticky:function(s){
		// Установка/чтение признака закрепления колонки слева
		if(Resolute.isDefined(s) && s===true){
			// Получаем ширины предыдущих закрепленных колонок
			var prevWidth = 0;
			Resolute.each(this.columns.get({isSticky:true,isHidden:false},true),function(col){
				prevWidth += col.el.getWidth();
			},this);
		}
		if(s===true) this.isSticky = true;
		if(s===false) this.isSticky = false;
		var rule = Resolute.CSS.getStyleSheetRule(this.columns.grid.styleSheet,'#'+this.columns.grid.id+' .col-'+this.index);
		if(!rule) return;
		if(!this.isSticky){
			rule.style.position = 'relative';
			rule.style.left = 'unset';
			rule.style.zIndex = 'unset';
			rule.style.order = this.index;
		} else {
			rule.style.position = 'sticky';
			rule.style.top = 0;
			rule.style.left = prevWidth+'px';
			rule.style.zIndex = 1;
			rule.style.order = -1;
			console.log(prevWidth);
		};
		this.fireEvent('sticky',this,this.isSticky);
		return (Resolute.isDefined(s))?this:this.isSticky;
	},
	name:function(n){
		if(n){
			this.name = n;
			if(this.el) this.el.query('.cn').update(n);
		};
		return (Resolute.isDefined(s))?this:this.name;
	},
	rotate:function(s){
		if(s===true) this.isRotated = true;
		if(!s || s===false) this.isRotated = false;
		if(this.el){
			if(this.isRotated){
				this.el.addClass('rotated');
				var h = this.columns.getMaxColumnHeight(true),
					ch = this.el.query('.name').getHeight();
				if(h.height<ch){
					this.el.setHeight(ch+28);
					h.column.el.setHeight('auto');
				} else {
					this.el.setHeight('auto');
				}
			} else {
				this.el.removeClass('rotated');
				this.el.setHeight('auto');
			};
			this.columns.grid.syncSize();
			this.fireEvent('rotate',this);
		};
		return this;
	}
});