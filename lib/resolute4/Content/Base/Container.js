Resolute.Сontainer = Resolute.extend(Resolute.Component,{
	defaultType:'component',
	itemsRenderTarget:'wrap',
	initComponent:function(){
		Resolute.Сontainer.superclass.initComponent.call(this);
		this.addEvents(
			'afterlayout',
			'beforeadd',
			'beforeremove',
			'afterchildrendered',
			'afterchildsrendered',
			'add',
			'remove'
		);
		// Список дочерних компонентов
		var items = this.items;
		delete this.items;
		// Коллекция дочерних компонентов
		this.items = new Resolute.Collection(false);
		if(items){
			// Добавляем список в коллекцию
			this.add(items);
		};
	},
	add:function(comp){
		// Добавление дочернего компонента: id, конфиг или уже проинициализированный компонент
		var args = arguments.length > 1;
		if(args || Resolute.isArray(comp)){
			var result = [];
			Resolute.each(args ? arguments : comp, function(c){
				result.push(this.add(c));
			}, this);
			return result;
		};
		var c = this.lookupComponent(this.applyDefaults(comp));
		var index = this.items.length;
		if(comp.ref && !this[comp.ref]){
			this[comp.ref] = c;
		};
		this.items.add(c);
		return c;
	},
	remove:function(comp, autoDestroy){
		// Удаление дочернего компонента
		var c = this.getComponent(comp);
		if(c && this.fireEvent('beforeremove', this, c) !== false){
			if(this[comp.ref]){
				this[comp.ref] = null;
				delete this[comp.ref];
			};
			this.doRemove(c, autoDestroy);
			this.fireEvent('remove', this, c);
		}
		return c;
	},
	onRemove: function(c){},
	doRemove: function(c, autoDestroy){
		// Удаление дочернего компонента (фактическое)
		var l = this.layout,
			hasLayout = l && this.rendered;

		if(hasLayout){
			l.onRemove(c);
		}
		this.items.remove(c);
		c.onRemoved();
		this.onRemove(c);
		if(autoDestroy === true || (autoDestroy !== false && this.autoDestroy)){
			c.destroy();
		}
		if(hasLayout){
			l.afterRemove(c);
		}
	},
	removeAll: function(autoDestroy){
		this.initItems();
		var item, rem = [], items = [];
		this.items.each(function(i){
			rem.push(i);
		});
		for (var i = 0, len = rem.length; i < len; ++i){
			item = rem[i];
			this.remove(item, autoDestroy);
			if(item.ownerCmp !== this){
				items.push(item);
			}
		}
		return items;
	},
	child:function(comp,findOne){
		// Получить дочерний компонент по id или запросу
		if(Resolute.isObject(comp) && comp.id){
			comp = comp.id;
		} else if(Resolute.isObject(comp)){
			return this.items.query(comp,findOne);
		};
		return this.items.get(comp);
	},
	lookupComponent:function(comp){
		if(Resolute.isString(comp)){
			// Если строка, то скорее всего это идентификатор компонента. Ищем его в глобальной свалке компонентов.
			return Resolute.ComponentManager.get(comp);
		}else if(!comp.events){
			// Типа конфиг компонента - иницилизируем (создаем)
			return this.createComponent(comp);
		}
		// Уже проинициализированный компонент, возвращаем как есть
		return comp;
	},
	createComponent:function(config, defaultType){
		if (config.render){
			// Типа и так передан проинициализированный компонент
			return config;
		}
		// Создаем компонент и добавляем ссылку на текущий контейнер (ownerCmp)
		var c = Resolute.create(Resolute.apply({
			ownerCmp: this
		}, config), defaultType || this.defaultType);

		return c;
	},
	applyDefaults:function(c){
		var d = this.defaults;
		if(d){
			if(Resolute.isFunction(d)){
				d = d.call(this, c);
			}
			if(Resolute.isString(c)){
				c = Resolute.ComponentMgr.get(c);
				Resolute.apply(c, d);
			}else if(!c.events){
				Resolute.applyIf(c, d);
			}else{
				Resolute.apply(c, d);
			}
		}
		return c;
	},
	render:function(renderTo){
		Resolute.Сontainer.superclass.render.call(this, renderTo);
		if(this.width) this.setWidth(this.width);
		if(this.height) this.setHeight(this.height);
		
		var el = this.getEl(this.itemsRenderTarget);
		// Отрисовка дочерних компонентов
		// Передаем в layout саму отрисовку...
		if(this.layout){
			var layoutCode = null;
			if(Resolute.isString(this.layout)) layoutCode = this.layout;
			if(Resolute.isObject(this.layout) && this.layout.code) layoutCode = this.layout.code;
			var layoutConfig = this.layoutConfig || {};
			if(Resolute.isObject(this.layout) && !this.layoutConfig){
				layoutConfig = this.layout;
				delete layoutConfig.code;
			};
			this.layout = Resolute.Layouts.get(layoutCode,{
				layoutConfig:layoutConfig,
				container:this
			});
			if(this.layout){
				this.items.each(function(item,index,itemsCount){
					this.layout.render(item,el,index,itemsCount);
				},this,function(){
					if(this.layout.afterRender){
						this.layout.afterRender()
					}
				});
				return;
			};
			Resolute.warn('Неверно указан layout у компонента '+this.id);
		} else {
			if(this.items.count() == 0){
				// Нет дочерних элементов
				this.fireEvent('afterchildsrendered',this);
			} else {
				this.items.each(function(item,index,itemsCount){
					if(item.render){
						item.on('afterrender',this.onChildRendered,this);
						item.render(el);
					}
				},this);
			}
		}
	},
	onChildRendered:function(childCmp){
		var rendered = 0;
		this.items.each(function(item){
			if(item.rendered) rendered++;
		},this);
		if(rendered == this.items.count()){
			this.fireEvent('afterchildsrendered',this);
		}
	}
});
Resolute.reg('container', Resolute.Сontainer);