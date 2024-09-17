Resolute.ns('Resolute.adaptive');

Resolute.adaptive.create = function(t,cfg){
	if(!Resolute.adaptive[t]) return null;
	return new Resolute.adaptive[t](cfg);
};

// Вспомогательный класс для расчета ширин (и расположения) элементов по колонкам (ширины колонок в процентах)
Resolute.adaptive.columns = function(cfg){
	this.rows = 0;
	this.currentRow = -1;
	this.items = [];
	if(cfg && Resolute.isArray(cfg.items)){
		this.add(cfg.items);
	};
};
Resolute.adaptive.columns.prototype = {
	add:function(cfg){
		if(Resolute.isArray(cfg)){
			Resolute.each(cfg,function(item){this.add(item)},this);
		};
		if(cfg.width){
			
		} else {
			cfg.width = 1;
		};
		this.items.push(cfg);
		return this.items.length-1;
	},
	get:function(index){
		if(!this.items[index]) return null;
		return this.items[index];
	},
	has:function(index){
		if(!this.items[index]) return false;
		return true;
	},
	remove:function(index){
		if(this.has(index)) this.items.splice(index,1);
	},
	itemsOnRow:function(row){
		var res = [];
		Resolute.each(this.items,function(item,index){
			if(item.row == row){
				res.push(index);
			}
		},this);
		return res;
	},
	rowWidth:function(row,widthPx){
		var res = 0;
		Resolute.each(this.items,function(item,index){
			if(item.row == row){
				if(widthPx){
					res += item.width*widthPx;
				} else {
					res += item.width;
				}
			}
		},this);
		return res;
	},
	rowsCount:function(){
		var res = [];
		Resolute.each(this.items,function(item,index){
			if(res.indexOf(item.row)==-1){
				res.push(item.row)
			}
		},this);
		return res.length;
	},
	resolve:function(width){
		var currentRow = 0;
		Resolute.each(this.items,function(item,index){
			item.widthPx = width*item.width;
			item.row = currentRow;
			item.rWidth = item.width;
			if((item.widthPx < item.minWidth && this.itemsOnRow(currentRow).length>1) || this.rowWidth(currentRow)>1){
				// Переносим на следующую строку
				currentRow++;
				item.row++;
			};
		},this);
		for(var i=0;i<this.rowsCount();i++){
			var rw = this.rowWidth(i);
			if(rw<1){
				// Если сумма относительных ширин элементов меньше единицы, пересчитываем их пропорционально (расширяем до единицы)
				var itms = this.itemsOnRow(i);
				var k = 1-rw;
				var s = 0;
				Resolute.each(itms,function(item){
					this.items[item].rWidth = parseFloat((this.items[item].width + this.items[item].width*k).toFixed(4));
					s += this.items[item].rWidth;
				},this);
				if(s<1 && this.items[itms[itms.length-1]]){
					this.items[itms[itms.length-1]].rWidth = parseFloat((this.items[itms[itms.length-1]].rWidth+(1-s)).toFixed(4));
				};
			}
		};
		return this.items;
	}
};


// Вспомогательный класс для расчета скрытия элементов на одной линии (пример - ряд кнопок при изменении ширины родителя)
Resolute.adaptive.bar = function(cfg){
	this.items = [];
	if(cfg && Resolute.isArray(cfg.items)){
		this.add(cfg.items);
	};
};
Resolute.adaptive.bar.prototype = {
	add:function(cfg){
		if(Resolute.isArray(cfg)){
			Resolute.each(cfg,function(item){this.add(item)},this);
		};
		if(!cfg.width) cfg.width = 32;
		if(!cfg.marginLeft) cfg.marginLeft = 0;
		if(!cfg.marginRight) cfg.marginRight = 0;
		
		this.items.push(cfg);
		return this.items.length-1;
	},
	get:function(index){
		if(!this.items[index]) return null;
		return this.items[index];
	},
	has:function(index){
		if(!this.items[index]) return false;
		return true;
	},
	remove:function(index){
		if(this.has(index)) this.items.splice(index,1);
	},
	width:function(row,widthPx){
		var res = 0;
		Resolute.each(this.items,function(item,index){
			res += item.width;
			res += item.marginLeft;
			res += item.marginRight;
		},this);
		return res;
	},
	resolve:function(width){
		var acc = 0;
		Resolute.each(this.items,function(item,index){
			acc += item.width;
			acc += item.marginLeft;
			acc += item.marginRight;
			if(acc>width){
				// Избыточная накопленная ширина на данном элементе
				this.items[index].excess = true;
			} else {
				this.items[index].excess = false;
			};
		},this);
		return this.items;
	}
};