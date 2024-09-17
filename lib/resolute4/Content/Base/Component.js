// Визуальный компонент
/*	Разметра может быть передана в конфиге следующим образом:
	1) свойство html - всегда строка с разметкой
	2) свойство markup - объект jsml
	3) свойство tpl - инстанс класса Resolute.Markup.Template
	
	1 и 2 в конечном счете ведут к созданию this.tpl (инстанс Resolute.Markup.Template)
*/

Resolute.Component = function(cfg){
	this.initialConfig = cfg;
	Resolute.apply(this,cfg);
	this.addEvents(
		'added',
		'disable',
		'enable',
		'beforeshow',
		'show',
		'beforehide',
		'hide',
		'removed',
		'beforerender',
		'render',
		'afterrender',
		'beforedestroy',
		'destroy',
		'resize',
		'move'
	);
	if(!this.id){
		this.id = 'resolute-cmp-'+(Resolute.sequence.next('cmp')+1000);
	};
	Resolute.ComponentManager.register(this);
	Resolute.Component.superclass.constructor.call(this);
	
	this.rendered = false;
	
	this.initComponent();
	
	this.nestedRender = false;
	
	if(this.items && !this.ignoreItemsMarkup){
		this.markup = this.items;
		this.nestedRender = true;
	}
	if(this.cn){
		this.markup = this.cn;
		this.nestedRender = true;
	}

	if(Resolute.isString(this.html)){
		this.tpl = new Resolute.Markup.Template({markup:{cn:this.html}});
		delete this.html;
	} else if(Resolute.isObject(this.markup) || Resolute.isArray(this.markup)){
		this.tpl = new Resolute.Markup.Template({markup:this.markup});
		delete this.markup;
		if(this.cn) delete this.cn;
	}

	if(this.style && this.tpl){
		this.tpl.markup.st = this.style;
	}

	if(this.data && this.tpl){
		// Переданы данные для связывания
		this.tpl.setData(this.data);
	}
	
	// Базовые флаги состояния, будут переопределены в render() от initialConfig
	this.hidden = true;
	this.disabled = false;
	
	if(this.renderTo) this.renderTo = Resolute.get(this.renderTo);
	this.elements = {};	// Элементы полученные в ходе применения разметки (именные, по полю ref)
	this.components = {}; // Компоненты полученные в ходе применения разметки (именные, по полю ref)
	
	if(this.renderTo && !this.deferredRender){
		this.render();
	}
};
Resolute.extend(Resolute.Component, Resolute.Observable, {
	ctype:'Resolute.Component',
	wrap:true,
	resizeEl: 'wrap',
	hideEl: 'wrap',
	deferRenderEvent:false,
	initComponent:function(){
	},
	render:function(renderTo){
		if(this.rendered) return false;
		
		this.elements.container = Resolute.get((renderTo)?renderTo:this.renderTo); // Ссылка на элемент, в котором отрисовывается текущий компонент
		delete this.renderTo;
		
		if(!this.elements.container){
			return false;
		}

		// Создадим у родителя div для размещения разметки текущего компонента (Обертка вокруг разметки компонента)
		if(this.wrap){
			this.elements.wrap = this.elements.container.append({id:this.id,cls:'component'},true);
		} else {
			this.elements.wrap = this.elements.container;
		}
		if(this.cls && isString(this.cls)){
			this.cls = this.cls.trim();
			this.elements.wrap.addClass(this.cls);
		}
		if(this.ref){
			this.elements.wrap.setAttribute('data-ref',this.ref);
		};
		// Отрисовка компонента
		if(this.tpl){
			var mm = this.tpl.apply(this.elements.wrap,this.elements,this.components);
			if(!this.elements.main){
				this.elements.main = mm;
			}
			if(Resolute.isArray(this.elements.main)){
				// Множество элементов...так не хорошо, делаем ссылку на родительский контейнер
				this.elements.main = this.elements.container;
			}
		}

		if(this.width) this.getEl(this.resizeEl).setWidth(this.width);
		if(this.height) this.getEl(this.resizeEl).setHeight(this.height);
		
		this.tooltips = [];
		
		this.rendered = true;
		this.hidden = false;
		
		if(this.elements.main) this.el = this.elements.main;

		if(R.xp(this, 'initialConfig.disabled')) {
			this.disable();
		}
		if(R.xp(this, 'initialConfig.hidden')) {
			this.hide();
		}

		if(!this.deferRenderEvent){
			if(this.onRender) this.onRender();
			this.fireEvent('afterrender',this);
		}
	},
	getChildComponents:function(query,onlyIds){
		// Получение списка дочерних компонентов
		// query - необязательный объект с запросом для отбора компонентов
		// onlyIds - true|false получение только идентификаторов компонентов
		var cmps = [];
		
		Resolute.each(this.getEl().query('.component',true),function(node){ 
			if(node.id){
				if(onlyIds){
					cmps.push(node.id);
				} else {
					var c = Resolute.getCmp(node.id);
					if(c){
						if(Resolute.isObject(query)){
							if(Resolute.match(c,query)) cmps.push(c);
						} else {
							cmps.push(c);
						}
					}
				}
			}
		},this);
		return cmps;
	},
	getCmps:function(query,onlyIds){
		return this.getChildComponents(query,onlyIds);
	},
	onRender:Resolute.emptyFn,
	setTooltip:function(cfg){
		if(!cfg){
			this.unsetTooltip();
			return;
		};
		if(this.tooltipCode) Resolute.Tooltips.unreg(this.tooltipCode);
		this.tooltip = cfg;
		this.tooltipCode = Resolute.Tooltip(cfg);
		this.tooltips.push(this.tooltipCode);
		if(this.rendered){
			this.getEl(this.tooltipEl||'main').setAttribute('data-tooltip',this.tooltipCode);
		};
	},
	unsetTooltip:function(){
		this.tooltip = null;
		if(this.tooltipCode){
			Resolute.Tooltips.unreg(this.tooltipCode);
			this.tooltips.remove(this.tooltipCode);
		};
		this.tooltipCode = null;
		if(this.rendered){
			this.getEl(this.tooltipEl||'main').removeAttribute('data-tooltip');
		};
	},
	refresh:function(data){
		// Обновление разметки (TODO)
		this.tpl.refresh();
	},
	getData:function(){
		// Получение данных, связанных с компонентом
		return this.tpl.data;
	},
	getEl:function(code){
		// Получение именных ссылок на подэлементы компонента
		var elName = code || 'main';
		if(!this.elements[elName]) elName = 'wrap';
		if(!this.elements[elName]) return new Resolute.Element({});
		return this.elements[elName];
	},
	getCompositeEl:function(codes){
		var res = [];
		Resolute.each(this.elements,function(el,code){
			if(codes.present(code)) res.push(el.dom);
		},this);
		return new Resolute.CompositeElement(res);
	},
	hasEl:function(code){
		// Проверка наличия именной ссыли на подэлемент компонента
		return (this.elements[code])?true:false;
	},
	addEl:function(code,el){
		// Добавление именного элемента
		if(Resolute.isString(code)){
			this.elements[code] = el;
		} else if(Resolute.isDefined(code) && Resolute.isObject(code)){
			for(var k in code){
				var ell = code[k];
				if(Resolute.isString(ell)) ell = Resolute.get(ell);
				this.elements[k] = ell;
			}
		}
	},
	removeEl:function(code){
		if(this.elements[code]){
			this.elements[code].remove();
			delete this.elements[code];
		}
	},
	isEl:function(code,el){
		// Проверяет, является ли переданный элемент именным элементом компонента
		return Resolute.get(el).dom == this.getEl(code).dom;
	},
	getCmp:function(code){
		// Поиск дочернего компонента по его REF-коду или по запросу
		if(isString(code)){
			code = {ref: code};
		}

		var c = this.getChildComponents(code);
		if(c && c.length && c[0]){
			return c[0];
		}

		return null;
	},
	hasCmp:function(code){
		return (this.components[code])?true:false;
	},
	setWidth:function(v){
		this.width = v;
		if(this.rendered && this.elements[this.resizeEl]) this.elements[this.resizeEl].setWidth(v);
		return this;
	},
	setHeight:function(v){
		this.height = v;
		if(this.rendered) this.elements[this.resizeEl].setHeight(v);
		return this;
	},
	getWidth:function(){
		if(!this.rendered) return 0;
		return this.elements[this.resizeEl].getWidth();
	},
	getHeight:function(byItems,itemsHeightByContent){
		if(!this.rendered) return 0;
		if(byItems && this.items && this.items.count()>0){
			var h = 0;
			this.items.each(function(item){
				h += item.getHeight(itemsHeightByContent);
			});
			return h;
		} else {
			return this.elements[this.resizeEl].getHeight();
		}
	},
	show:function(){
		if(!this.rendered){
			this.render();
		} else {
			this.getEl(this.hideEl).removeClass('resolute-hidden');
		};
		this.hidden = false;
		if(this.onShow) this.onShow();
		this.fireEvent('show', this);
	},
	hide:function(){
		if(this.rendered){
			this.getEl(this.hideEl).addClass('resolute-hidden');
		};
		this.hidden = true;
		if(this.onHide) this.onHide();
		this.fireEvent('hide', this);
	},
	isHidden:function(){
		return this.hidden;
	},
	enable:function(){
		if(!this.rendered){
			this.render();
		} else {
			this.elements.wrap.removeClass('resolute-disabled');
		};
		this.disabled = false;
		var el = this.getEl();
		if(el){
			el.dom.disabled = false;
		};
		if(this.onEnable) this.onEnable();
	},
	disable:function(){
		if(this.rendered){
			this.elements.wrap.addClass('resolute-disabled');
		}
		this.disabled = true;
		var el = this.getEl();
		if(el){
			el.dom.disabled = true;
		}
		if(this.onDisable) this.onDisable();
	},
	isDisabled:function(){
		return this.disabled;
	},
	focus:function(){
		// TODO
		this.elements.wrap.focus();
	},
	blur:function(){
		// TODO
		this.elements.wrap.blur();
	},
	doLayout:function(){
		// 
	},
	getRType:function(){
		// Получение типа компонента
		return this.constructor.rtype;
	},
	getRTypes:function(){
		// Получение всей иерархии наследования в виде строки
		var tc = this.constructor;
		if(!tc.rtypes){
			var c = [], sc = this;
			while(sc && sc.constructor.rtype){
				c.unshift(sc.constructor.rtype);
				sc = sc.constructor.superclass;
			}
			tc.rtypeChain = c;
			tc.rtypes = c.join('/');
		}
		return tc.rtypes;
	},
	isRType:function(rtype, shallow){
		// shallow = false - проверка что текущий компонент является предком переданного rtype
		if (Resolute.isFunction(rtype)){
			rtype = rtype.rtype;
		} else if(Resolute.isObject(rtype)){
			rtype = rtype.constructor.rtype;
		}
		return !shallow ? ('/' + this.getRTypes() + '/').indexOf('/' + rtype + '/') != -1 : this.constructor.rtype == rtype;
	},
	findParentBy:function(fn){
		// Поиск родителя по функции
		for (var p = this.ownerCmp; (p != null) && !fn(p, this); p = p.ownerCmp);
		return p || null;
	},
	findParentByType:function(rtype, shallow){
		// Поиск родителя по типу
		return this.findParentBy(function(c){
			return c.isRType(rtype, shallow);
		});
	},
	parent:function(query){
		// Поиск одного родителя (на любом уровне выше) по запросу
		if(!query){
			// Если запрос не передан, возврат прямого родителя (если есть)
			return (this.ownerCmp)?this.ownerCmp:null;
		};
		return this.findParentBy(function(c){
			return Resolute.match(c, query);
		});
	},
	bubble:function(fn, scope, args){
		// Вызов fn для каждого компонента вверх по иерархии (текущий->родитель->родитель родителя ...)
		// если fn возвращает false то остановка
		var p = this;
		while(p){
			if(fn.apply(scope || p, args || [p]) === false){
				break;
			}
			p = p.ownerCmp;
		}
		return this;
	},
	nextSibling:function(){
		// Следующий сосед компонента
		if(this.ownerCmp){
			var index = this.ownerCmp.items.indexOf(this);
			if(index != -1 && index+1 < this.ownerCmp.items.getCount()){
				return this.ownerCmp.items.itemAt(index+1);
			}
		}
		return null;
	},
	previousSibling:function(){
		// Предыдущий сосед компонента
		if(this.ownerCmp){
			var index = this.ownerCmp.items.indexOf(this);
			if(index > 0){
				return this.ownerCmp.items.itemAt(index-1);
			}
		}
		return null;
	},
	clearMons:function(){
		Resolute.each(this.mons, function(m){
			m.item.un(m.ename, m.fn, m.scope);
		}, this);
		this.mons = [];
	},
	createMons:function(){
		if(!this.mons){
			this.mons = [];
			this.on('beforedestroy', this.clearMons, this, {single: true});
		}
	},
	purgeListeners:function(){
		Resolute.Component.superclass.purgeListeners.call(this);
		if(this.mons){
			this.on('beforedestroy', this.clearMons, this, {single: true});
		}
	},
	mon:function(item, ename, fn, scope, opt){
		this.createMons();
		if(Resolute.isObject(ename)){
			var propRe = /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/;
			var o = ename;
			for(var e in o){
				if(propRe.test(e)){
					continue;
				}
				if(Resolute.isFunction(o[e])){
					this.mons.push({
						item: item, ename: e, fn: o[e], scope: o.scope
					});
					item.on(e, o[e], o.scope, o);
				}else{
					this.mons.push({
						item: item, ename: e, fn: o[e], scope: o.scope
					});
					item.on(e, o[e]);
				}
			}
			return;
		}
		this.mons.push({
			item: item, ename: ename, fn: fn, scope: scope
		});
		item.on(ename, fn, scope, opt);
	},
	mun:function(item, ename, fn, scope){
		var found, mon;
		this.createMons();
		for(var i = 0, len = this.mons.length; i < len; ++i){
			mon = this.mons[i];
			if(item === mon.item && ename == mon.ename && fn === mon.fn && scope === mon.scope){
				this.mons.splice(i, 1);
				item.un(ename, fn, scope);
				found = true;
				break;
			}
		}
		return found;
	},
	getBubbleTarget : function(){
		return this.ownerCmp;
	},
	destroy:function(){
		// Уничтожение компонента
		if(!this.isDestroyed){
			if(this.fireEvent('beforedestroy', this) !== false){
				this.destroying = true;
				this.beforeDestroy();
				if(this.ownerCmp && this.ownerCmp.remove){
					this.ownerCmp.remove(this, false);
				}
				if(this.rendered){
					// Удалим разметку
					for(var el in this.elements){
						if(this.elements.hasOwnProperty(el) && (this.elements[el] instanceof Resolute.Element)){
							if(el == 'container') continue;
							if(!this.wrap && el == 'wrap') continue;
							this.elements[el].remove();
						}
					};
				};
				if(this.tpl){
					this.tpl.destroy();
				};
				if(this.focusTask && this.focusTask.cancel){
					this.focusTask.cancel();
				};
				if(this.tooltips && this.tooltips.length>0){
					Resolute.each(this.tooltips,function(code){
						Resolute.Tooltips.unreg(code);
					});
				};
				this.onDestroy();
				Resolute.ComponentManager.unregister(this);
				this.fireEvent('destroy', this);
				this.purgeListeners();
				this.destroying = false;
				this.isDestroyed = true;
			}
		}
	},
	deleteMembers:function(){
		var args = arguments;
		for(var i = 0, len = args.length; i < len; ++i){
			delete this[args[i]];
		}
	},
	onRemoved: Resolute.emptyFn,
	beforeDestroy: Resolute.emptyFn,
	onDestroy: Resolute.emptyFn
});

Resolute.reg('component',Resolute.Component);