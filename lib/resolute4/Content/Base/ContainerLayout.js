Resolute.namespace('Resolute.Layouts');
Resolute.Layouts.list = {};
Resolute.Layouts.register = function(code,cmp){
	Resolute.Layouts.list[code] = cmp;
};
Resolute.Layouts.get = function(layout,cfg){
	if(Resolute.Layouts.list[layout]) return new Resolute.Layouts.list[layout](cfg);
	return null;
};
Resolute.Layouts.reg = Resolute.Layouts.register;


// Форма с полями (каждый компонент внутри контейнера отрисовывается как поле с лейблом и прочим)
Resolute.Layouts.Form2 = function(cfg){
	Resolute.apply(this,cfg);
	this.fieldTpl = new Resolute.Markup.Template({
		code:'Resolute.FormField',
		layout:this,
		markup:{
			cls:'field',
			st:'grid-template-columns: {labelWidth}px;',
			cn:[
				{t:'label',cls:'{labelCls}',st:'width:{labelWidth}px;',cn:'{label}',ref:'label'},
				{cls:'wrap',ref:'body',cn:[
					{cls:'helptext',cn:'{helpText}',ref:'helpText'}
				]}
			]
		},
		prepare:function(){
			this.data.silent = true;
			this.data.set('labelCls','');
			if(this.data.matches({'mandatory':true})) this.data.set('labelCls','mandatory');
			this.data.silent = false;
		}
	});
};
Resolute.Layouts.Form2.prototype = {
	type:'form',
	setLabel:function(label){
		this.getEl('label').update(label);
	},
	setHelpText:function(txt){
		this.getEl('helpText').update(txt);
	},
	showHelpText:function(){
		if(this.helpText){
			this.getEl('helpText').show();
		}
	},
	hideHelpText:function(){
		if(this.helpText){
			this.getEl('helpText').hide();
		}
	},
	setMandatoryStyle:function(){
		if(this.mandatory){
			this.getEl('label').addClass('mandatory');
		} else {
			this.getEl('label').removeClass('mandatory');
		}
	},
	onShow:function(){
		var fldEl = this.getEl().parent('.field');
		if(fldEl) fldEl.show();
	},
	onHide:function(){
		var fldEl = this.getEl().parent('.field');
		if(fldEl) fldEl.hide();
	},
	enrich:function(cmp){
		var methods = ['setLabel','setMandatoryStyle','setHelpText','showHelpText','hideHelpText','onShow','onHide'];
		Resolute.each(methods,function(method){
			cmp[method] = Resolute.Layouts.Form2.prototype[method];
		});
	},
	render:function(cmp,el){
		var elems = {};
		this.fieldTpl.setData(cmp).apply(el,elems);
		this.enrich(cmp);
		if(cmp.render) cmp.render(elems.body);
		cmp.addEl(elems);
		if(!cmp.helpText || Resolute.isEmpty(cmp.helpText)){
			cmp.getEl('helpText').hide();
		};
		var labelEl = cmp.getEl('label');
		if(labelEl.exists()){
			// При клике на лэйбл - фокусируем на основном элементе компонента
			cmp.mon(labelEl,'click',function(){
				if(this.selectText) this.selectText();
				this.getEl('main').dom.focus();
			},cmp);
		};
	}
};
Resolute.Layouts.reg('form2',Resolute.Layouts.Form2);


// Простое заполнение одним компонентом всего контейнера
Resolute.Layouts.Fit = function(cfg){
	Resolute.apply(this,cfg);
	this.cmpTpl = new Resolute.Markup.Template({
		code:'Resolute.Fit',
		layout:this,
		markup:{
			cls:'component-body relative fill',ref:'body'
		}
	});
};

Resolute.Layouts.Fit.prototype = {
	type:'fit',
	render:function(cmp,el){
		if(cmp.render){
			cmp.render(el);
			cmp.getEl().addClass('fill');
		};
	}
};
Resolute.Layouts.reg('fit',Resolute.Layouts.Fit);


// Карточки - переключение между ними. Аналог закладок, но без визуального управления
Resolute.Layouts.Card = function(cfg){
	Resolute.apply(this,cfg);
	this.cmpTpl = new Resolute.Markup.Template({
		code:'Resolute.Card',
		layout:this,
		markup:{
			cls:'component-body relative fill',ref:'body'
		}
	});
	this.init();
};

Resolute.Layouts.Card.prototype = {
	type: 'card',
	init:function(){
		if(Resolute.isEmpty(this.container.activeItem)){
			this.container.activeItem = 0;
		};
		this.container.setActiveItem = this.setActiveItem.createDelegate(this.container);
		this.container.nextItem = this.nextItem.createDelegate(this.container);
		this.container.prevItem = this.prevItem.createDelegate(this.container);
		this.container.getItem = this.getItem.createDelegate(this.container);
		this.container.isFirst = this.isFirst.createDelegate(this.container);
		this.container.isLast = this.isLast.createDelegate(this.container);
		this.container.each = this.each.createDelegate(this.container);
	},
	each:function(fn,scope){
		this.items.each(function(cmp,index,count){
			cmp.items.each(fn,scope||this);
		},this);
	},
	nextItem:function(){
		this.setActiveItem(this.activeItem+1);
	},
	prevItem:function(){
		this.setActiveItem(this.activeItem-1);
	},
	isFirst:function(){
		return this.activeItem == 0;
	},
	isLast:function(){
		return (this.activeItem == (this.items.count()-1));
	},
	getItem: function(i){
		var el = null;
		this.items.each( function(item,index){
			if(Resolute.isString(i)){
				if(item.code == i || item.id == i){
					el = item.getEl('wrap');
				}
			} else if(Resolute.isNumber(i)){
				if(i == index){
					el = item.getEl('wrap');
				}
			}
		});
		return el;
	},
	setActiveItem:function(i){
		if(i>=this.items.count()) return;
		if(i<0) return;
		if(Resolute.isNumber(i)){
			this.activeItem = i;
		} else if(Resolute.isString(i)){
			this.activeItem = this.items.indexOfKey(i);
		};
		this.items.each(function(item,index){
			var eq = false;
			if(Resolute.isString(i)){
				// По коду или id
				if(item.code == i || item.id == i){
					eq = true;
				}
			} else if(Resolute.isNumber(i)){
				if(i == index){
					eq = true;
				}
			};
			if(eq){
				item.getEl('wrap').removeClass('resolute-hidden');
			} else {
				item.getEl('wrap').addClass('resolute-hidden');
			}
		})
	},
	render:function(cmp,el,index,itemsCount){
		if(cmp.render){
			cmp.render(el);
			cmp.getEl('wrap').addClass('relative fill').setAttribute('data-index',index);
			
			if(index != this.container.activeItem){
				cmp.getEl('wrap').addClass('resolute-hidden');
			};
		};
	}
};
Resolute.Layouts.reg('card',Resolute.Layouts.Card);


// Регионы - аналог border layout в ExtJS
Resolute.Layouts.Regions = function(cfg){
	Resolute.apply(this,cfg);
	this.shiftProps = {
		north:'top',
		west:'left',
		east:'right',
		south:'bottom'
	};
	this.shiftPropsSize = {
		north:'height',
		west:'width',
		east:'width',
		south:'height'
	};
	this.cmpTpl = new Resolute.Markup.Template({
		code:'Resolute.Regions',
		layout:this,
		markup:{
			cls:'component-body relative fill',ref:'body'
		}
	});
	this.init();
};

Resolute.Layouts.Regions.prototype = {
	type: 'regions',
	init:function(){
		// Инициализация (должен быть один центральный регион!)
		this.hasCenter = false;
		this.hasNorth = false;
		this.hasSouth = false;
		this.hasWest = false;
		this.hasEast = false;
		this.codes = {}; // Ссылки на регионы по произвольному коду региона
		
		this.container.items.each(function(cmp,index){
			if(cmp.region){
				this['has'+cmp.region.upperFirst()] = true;
				this['is'+cmp.region.upperFirst()+'Collapsed'] = (cmp.collapsed===true);
				this['is'+cmp.region.upperFirst()+'Floating'] = (cmp.floating===true);
				if(cmp.floating===true){
					//cmp.collapseMode = 'hide';
				};
			}
		},this);
		
		if(!this.hasCenter){
			Resolute.warn('Компонент '+this.container.id+' должен иметь центральный регион!')
		}
		this.container.each = this.each.createDelegate(this.container);
	},
	get:function(region,returnEl){
		if(!region.in(['center','north','south','west','east'])){
			if(!this.codes[region]){
				return null;
			} else {
				region = this.codes[region];
			}
		};
		if(!this['has'+region.upperFirst()]) return null;
		return (returnEl)?this['region'+region.upperFirst()].getEl('wrap'):this['region'+region.upperFirst()];
	},
	each:function(fn,scope){
		this.items.each(function(cmp,index,count){
			cmp.items.each(fn,scope||this);
		},this);
	},
	enrich:function(cmp){
		//cmp.getWidth = Resolute.Layouts.Regions.prototype.getItemWidth;
		//cmp.getHeight = Resolute.Layouts.Regions.prototype.getItemHeight;
	},
	getItemWidth:function(){
		if(!this.rendered) return 0;
		if(this.region){
			var parent = this.parent();
			if(parent){
				
			}
		} else {
			return this.elements.wrap.getWidth();
		}
	},
	getItemHeight:function(){
		
	},
	collapse:function(region){
		// Скрыть регион
		if(region == 'center') return;
		var reg = this.get(region,true);
		if(!reg) return;
		var regCmp = this['region'+region.upperFirst()];
		var mode = regCmp.collapseMode||'hide';
		this['is'+region.upperFirst()+'Collapsed'] = true;
		if(mode == 'hide'){
			reg.hide();
		} else if(mode=='shift'){
			reg.setStyle(this.shiftProps[region],reg.getRect()[this.shiftPropsSize[region]]*-1+'px').removeClass('shadow',200);
		};
		this.container.getEl().addClass('region-'+region+'-collapsed');
		this.syncSize(region);
		if(regCmp && regCmp.layout && regCmp.layout.doLayout){
			regCmp.layout.doLayout();
		}
	},
	expand:function(region){
		// Показать регион
		if(region == 'center') return;
		var reg = this.get(region,true);
		if(!reg) return;
		var mode = this['region'+region.upperFirst()].collapseMode||'hide';
		this['is'+region.upperFirst()+'Collapsed'] = false;
		if(mode == 'hide'){
			reg.show();
		} else if(mode=='shift'){
			reg.setStyle(this.shiftProps[region],'0px');
			if(this.isFloating(region)) reg.addClass('shadow'); 
		};
		this.container.getEl().removeClass('region-'+region+'-collapsed');
		this.syncSize(region);
	},
	toggle:function(region){
		if(this.isCollapsed(region)){
			this.expand(region);
		} else {
			this.collapse(region);
		}
	},
	isFloating:function(region){
		if(region == 'center') return false;
		if(this.codes[region]){
			region = this.codes[region];
		}
		if(this['has'+region.upperFirst()]){
			if(this['is'+region.upperFirst()+'Floating']) return true;
		};
		return false;
	},
	isCollapsed:function(region){
		// Скрыт ли регион
		if(region == 'center') return false;
		if(this.codes[region]){
			region = this.codes[region];
		}
		if(!this['has'+region.upperFirst()]){
			return true
		} else {
			return this['is'+region.upperFirst()+'Collapsed'];
		}
	},
	_isHidden:function(region){
		// Скрыт ли регион
		if(region == 'center') return false;
		if(this.codes[region]){
			region = this.codes[region];
		}
		if(!this['has'+region.upperFirst()]){
			return true
		} else {
			if(this['is'+region.upperFirst()+'Floating']) return true;
			return this['is'+region.upperFirst()+'Collapsed'];
		}
	},
	render:function(cmp,el,index,itemsCount){
		if(cmp.render){
			if(!cmp.region || !cmp.region.in(['center','north','south','west','east'])){
				Resolute.warn('Компонент '+cmp.id+' должен иметь ссылку на регион!');
				return false;
			};
			//this.enrich(cmp);
			cmp.render(el);
			if(cmp.region.in(['west','east'])){
				if(!cmp.width) cmp.setWidth(180);
			};
			if(cmp.region.in(['north','south'])){
				if(!cmp.height) cmp.setHeight(32);
			};
			this['region'+cmp.region.upperFirst()] = cmp;
			if(cmp.code){
				this.codes[cmp.code] = cmp.region;
			};
			var cls = '';
			if(cmp.floating) cls += ' floatable';
			cmp.getEl('wrap').addClass('region'+cls).addClass(cmp.region).setAttribute('data-region',cmp.region);
		};
	},
	doLayout:function(){
		this.syncSize('west');
		this.syncSize('east');
		this.syncSize('north');
		this.syncSize('south');
		this.syncSize('center');
	},
	syncSize:function(region){
		if(region == 'west'){
			if(this._isHidden(region)){
				this.get('center',true).dom.style.left = '0px';
			} else {
				this.get('center',true).dom.style.left = this.get('west',true).dom.style.width;
			};
		};
		if(region == 'east'){
			if(this._isHidden(region)){
				this.get('center',true).dom.style.right = '0px';
			} else {
				this.get('center',true).dom.style.right = this.get('east',true).dom.style.width;
			}
		};
		if(region == 'north'){
			if(this._isHidden(region)){
				this.get('center',true).dom.style.top = '0px';
				if(this.hasWest) this.get('west',true).dom.style.top = '0px';
				if(this.hasEast) this.get('east',true).dom.style.top = '0px';
			} else {
				var nh = this.get('north',true).dom.style.height;
				this.get('center',true).dom.style.top = nh;
				if(this.hasWest) this.get('west',true).dom.style.top = nh;
				if(this.hasEast) this.get('east',true).dom.style.top = nh;
			}
		};
		if(region == 'south'){
			if(this._isHidden(region)){
				this.get('center',true).dom.style.bottom = '0px';
				if(this.hasWest) this.get('west',true).dom.style.bottom = '0px';
				if(this.hasEast) this.get('east',true).dom.style.bottom = '0px';
			} else {
				var sh = this.get('south',true).dom.style.height;
				this.get('center',true).dom.style.bottom = sh;
				if(this.hasWest) this.get('west',true).dom.style.bottom = sh;
				if(this.hasEast) this.get('east',true).dom.style.bottom = sh;
			}
		};
	},
	afterRender:function(){
		this.doLayout();
		Resolute.each(['north','south','west','east'],function(region){
			if(this.isCollapsed(region)){
				this.collapse(region);
				this.container.getEl().addClass('region-'+region+'-collapsed');
			} else if(this.isFloating(region)){
				this.get(region,true).addClass('shadow');
			}
			if(this['has'+region.upperFirst()]){
				this.container.getEl().addClass('has-'+region+'-region');
			}
		},this);
	},
	onResize:function(item){
		item.every(function(el){
			var elm = Resolute.get(item);
			if(!elm) return true;
			return true;
		})
	}
};
Resolute.Layouts.reg('regions',Resolute.Layouts.Regions);