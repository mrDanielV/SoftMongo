Resolute.ns('Resolute.Message');

Resolute.Message.YESNO = [
	{code:'yes', name:'Да'},
	{code:'no', name:'Нет'}
];
Resolute.Message.OK = [
	{code:'ok', name:'ОK'}
];

// Менеджер диалогов
Resolute.Message.Manager = {
	instances:{},
	pool:[],
	init:function(){
		window.addEventListener('keyup',Resolute.Message.Manager.onKeyPress);
	},
	get:function(code){
		// Получение диалога по коду
		if(Resolute.Message.Manager.instances[code]){
			return Resolute.Message.Manager.instances[code];
		};
		return null;
	},
	find:function(prop,value){
		for(var code in Resolute.Message.Manager.instances){
			if(Resolute.isObject(prop) && Resolute.match(Resolute.Message.Manager.instances[code],prop)){
				// Поиск по запросу (нескольким свойствам диалога)
				return Resolute.Message.Manager.instances[code];
			};
			if(Resolute.Message.Manager.instances[code] && Resolute.Message.Manager.instances[code][prop] == value){
				// Поиск по определенному значению свойства диалога
				return Resolute.Message.Manager.instances[code];
			}
		};
		return null;
	},
	visible:function(){
		return Resolute.Message.Manager.find('visible',true);
	},
	add:function(item){
		var vis = Resolute.Message.Manager.visible();
		if(vis){
			vis.hide();
			this.pool.push(vis);
		}
		Resolute.Message.Manager.instances[item.id] = item;
		Resolute.Message.Manager.active = item;
		return item;
	},
	remove:function(code){
		var isActive = false;
		if(Resolute.Message.Manager.instances[code]){
			if(Resolute.Message.Manager.active && Resolute.Message.Manager.active.id == code){
				isActive = true;
				Resolute.Message.Manager.active = null;
			};
			if(!Resolute.Message.Manager.instances[code].removing) Resolute.Message.Manager.instances[code].remove();
			(function(){
				Resolute.Message.Manager.instances[code] = null;
				delete Resolute.Message.Manager.instances[code];
			}).defer(220)
		}

		if(isActive){
			this.next();
		}
	},
	next: function(){
		if(Resolute.isEmpty(this.pool)){
			return;
		}

		var l = this.pool.length;
		var item = this.pool[l - 1];
		if(item && item.id && !Resolute.Message.Manager.instances[item.id]){
			this.pool.pop();
			this.next();
		}
		item.show();
		Resolute.Message.Manager.active = item;
		this.pool.pop();
	},
	killEmAll: function(type){
		var wins = Resolute.Message.Manager.instances;
		if(!wins || !R.isObject(wins) || R.isEmpty(wins)){
			return;
		}
		for(code in wins){
			if((type && wins[code].type == type) || !type){
				this.remove(code);
			}
		}
	},
	onKeyPress:function(event){
		// Нажатия кнопок
		var visible = Resolute.Message.Manager.visible();
		if(!visible) return;
		
		// Выбор кнопок клавишами
		if(Resolute.Event.isKey(event,['enter','left','right','space']) && R.xp(visible, 'elements.body')){
			var focusedButton = visible.elements.body.query('.button:focus');
			if(!focusedButton){
				visible.elements.body.query('.button').focus();
			} else {
				if(Resolute.Event.isKey(event,['enter','space'])) focusedButton.dom.click();
				if(Resolute.Event.isKey(event,['left','right'])){
					if(Resolute.Event.isKey(event,'left')){
						var btn = focusedButton.prev();
						if(!btn) btn = focusedButton.up('.footer').last();
					};
					if(Resolute.Event.isKey(event,'right')){
						var btn = focusedButton.next();
						if(!btn) btn = focusedButton.up('.footer').first();
					};
					if(btn){
						btn.focus();
					}
				}
			}
		};
		if(Resolute.Event.isKey(event,'escape')){
			// Закрытие активного диалога
			if(visible && visible.type && visible.closeByEscape){
				visible.close();
			}
		}
	}
};

Resolute.Message.Manager.init();

Resolute.Message.Box = function(cfg){
	// Базовый класс модальных окон
	this.title = cfg.title || null;
	this.icon = cfg.icon || null;
	this.text = cfg.text || null;
	this.buttons = cfg.buttons || null;
	this.closeByEscape = (Resolute.isBoolean(cfg.closeByEscape))?cfg.closeByEscape:true;
	this.closeByMaskClick = (Resolute.isBoolean(cfg.closeByMaskClick))?cfg.closeByMaskClick:true;
	this.body = Resolute.select('body').first();
	this.width = (cfg.width)?cfg.width:false;
	this.elements = {
		parent:this.body
	};
	this.rendered = false;
	if(cfg.cls){
		this.cls = cfg.cls;
	};
	if(cfg.listeners){
		if(!cfg.listeners.scope){
			cfg.listeners.scope = this;
		};
		this.listeners = cfg.listeners;
	};
	if(cfg.autoHide){
		this.autoHide = (cfg.autoHide===true)?10:cfg.autoHide;
		this.hide.defer(this.autoHide*1000,this);
	};
	this.visible = false;
	if(cfg.autoShow){
		if(Resolute.App && Resolute.App() && Resolute.browser.isMobile){
			Resolute.App().menu.hide();
		};
		this.render();
	}
	this.type = cfg.type || 'alert';
};
Resolute.Message.Box.prototype = {
	render:function(){
		this.elements.mask = new Resolute.Element({cls:'resolute-modal unselectable hidden'});
		if(this.cls){
			this.elements.mask.addClass(this.cls);
		};
		this.id = this.elements.mask.id;
		this.elements.mask.dom.addEventListener('contextmenu',function(e){e.preventDefault();return});
		this.elements.wrap = new Resolute.Element({cls:'resolute-modal-wrap'});
		this.elements.wrap.addClass((this.type)?'modal-'+this.type:'modal-alert');
		if(this.width) this.elements.wrap.setWidth(this.width);
		this.elements.mask.on('click',function(event){
			var el = Resolute.get(event.target);
			if(el && el.hasClass('resolute-modal') && this.closeByMaskClick){
				// Клик по маске - закрываем окно
				this.close();
			}
		},this)
		
		var items = [];
		if(this.title){
			if(this.icon){
				items.push({cls:'caption',cn:[{t:'span',cls:'material-icons',cn:this.icon},{t:'span',cls:'title',cn:this.title}]});
			} else {
				items.push({cls:'caption',cn:[{t:'span',cls:'title',cn:this.title}]});
			}
		};
		if(this.text){
			items.push({cls:'content',cn:this.text});
		};
		if(this.buttons){
			var btns = [];
			for(var i=0;i<this.buttons.length;i++){
				btns.push({cls:'button'+((this.buttons[i].primary)?' primary':''),a:{'data-code':this.buttons[i].code,tabindex:'0'},cn:this.buttons[i].name});
			};
			items.push({cls:'footer',cn:btns});
		};
		this.elements.body = new Resolute.Element({cls:'resolute-modal-body',cn:items});
		this.elements.parent.append(this.elements.mask.append(this.elements.wrap.append(this.elements.body)));
		this.rendered = true;
		
		var btns = this.elements.body.query('.footer .button',true);
		for(var i=0;i<btns.length;i++){
			btns[i].dom.addEventListener('click',this.onButtonClick.createDelegate(this));
		};
		this.elements.body.dom.focus();

		// Закрываем все тултипы и пикеры
		Resolute.Tooltips.hide();
		Resolute.Pickers.hide();
		
		this.show();
	},
	onButtonClick:function(event){
		if(event.target){
			var buttonCode = Resolute.get(event.target).getAttribute('data-code');
			if(this.listeners && this.listeners.onButtonClick){
				this.listeners.onButtonClick.call(this.listeners.scope||this,buttonCode)
			}
		}
	},
	show:function(){
		if(!this.rendered){
			this.render();
		}
		this.visible = true;
		this.elements.mask.removeClass('hidden');
		this.elements.wrap.focus();
	},
	hide:function(){
		if(!this.rendered){
			return;
		}
		this.elements.mask.addClass('hidden');
		//this.remove.defer(220,this);
		this.visible = false;
	},
	close:function(){
		if(!this.rendered){
			return;
		}
		
		this.elements.mask.addClass('hidden');
		//this.remove();
		this.visible = false;
		this.remove.defer(220,this);
	},
	remove:function(){
		this.removing = true;
		if(this.elements.mask.dom.parentNode){
			this.elements.mask.dom.parentNode.removeChild(this.elements.mask.dom);
		};
		this.elements.body = null;
		Resolute.Message.Manager.remove(this.id);
	},
	setTitle:function(title){
		this.title = title;
		if(this.rendered){
			var titleEl = this.elements.body.query('span.title');
			if(titleEl){
				titleEl.update(this.title);
			} else {
				if(this.icon){
					var t = {cls:'caption',cn:[{t:'span',cls:'material-icons',cn:this.icon},{t:'span',cls:'title',cn:this.title}]};
				} else {
					var t = {cls:'caption',cn:[{t:'span',cls:'title',cn:this.title}]};
				};
				this.elements.body.query('.content').before(t);
			}
		}
	}
};

Resolute.Message.WaitBox = function(cfg){
	// Базовый класс модальных окон
	this.body = Resolute.select('body').first();
	this.closeByEscape = false;
	this.elements = {
		parent:this.body
	};
	this.rendered = false;
	if(cfg.cls){
		this.cls = cfg.cls;
	};
	if(cfg.listeners){
		if(!cfg.listeners.scope){
			cfg.listeners.scope = this;
		};
		this.listeners = cfg.listeners;
	};
	if(cfg.title){
		this.title = cfg.title;
	};
	if(cfg.autoHide){
		this.autoHide = (cfg.autoHide===true)?10:cfg.autoHide;
		this.hide.defer(this.autoHide*1000,this);
	};
	this.visible = false;
	this.type = 'wait';
	if(cfg.autoShow){
		this.render();
	}
};
Resolute.Message.WaitBox.prototype = {
	render:function(){
		this.elements.mask = new Resolute.Element({cls:'resolute-modal resolute-wait unselectable hidden'});
		if(this.cls){
			this.elements.mask.addClass(this.cls);
		};
		this.id = this.elements.mask.id;
		this.elements.mask.dom.addEventListener('contextmenu',function(e){e.preventDefault();return});
		this.elements.wrap = new Resolute.Element({cls:'resolute-wait-wrap'});
		this.elements.wrap.addClass((this.type)?'modal-'+this.type:'modal-wait');
		var items = [];
		if(this.title){
			items.push({cls:'title',cn:this.title});
		};
		items.push({cls:'resolute-ellipsis',cn:[{cls:'c1'},{cls:'c2'},{cls:'c3'},{cls:'c4'}]});
		this.elements.body = new Resolute.Element({cls:'resolute-wait-body',cn:items});
		this.elements.parent.append(this.elements.mask.append(this.elements.wrap.append(this.elements.body)));
		this.rendered = true;
		this.elements.body.dom.focus();
		this.show();
	},
	show:function(){
		if(!this.rendered){
			this.render();
		};
		this.visible = true;
		this.elements.mask.removeClass('hidden');
	},
	hide:function(){
		if(!this.rendered){
			return;
		};
		this.elements.mask.addClass('hidden');
		//this.remove.defer(220,this);
		this.visible = false;
	},
	close:function(){
		if(!this.rendered){
			return;
		}
		Resolute.Message.Manager.remove(this.id);
		//this.remove();
		this.remove.defer(220,this);
	},
	remove:function(){
		if(this.elements.mask.dom.parentNode){
			this.elements.mask.dom.parentNode.removeChild(this.elements.mask.dom);
		};
		this.elements.body = null;
	}
};

Resolute.Message.show = function(cfg, onBtnClick){
	cfg.autoShow = true;
	// В конфиге обращения основной текст можно передавать как text и как msg
	if(!cfg.text && cfg.msg){
		cfg.text = cfg.msg;
	}

	// Кнопки могут быть массивом [{code, name}, ...], а могут быть объектом {code:name, ...}
	if(cfg.buttons){
		if(R.isObject(cfg.buttons) && !R.isEmpty(cfg.buttons)){
			var btns = [];
			for(code in cfg.buttons){
				var name = cfg.buttons[code];
				btns.push({code:code, name:name});
			}
			cfg.buttons = btns;
		}
	}
	// В конфиге функцию обработки нажатия кнопок можно передавать как onBtnClick и как fn
	if(!onBtnClick && cfg.fn){
		onBtnClick = cfg.fn;
	}

	// Обработка нажатия кнопки
	cfg.listeners = {
		onButtonClick: function(btnCode){
			if(onBtnClick && Resolute.isFunction(onBtnClick)){
				var scope = this;
				if(cfg.scope){
					scope = cfg.scope;
				}
				onBtnClick.call(scope, btnCode);
			}
			this.close();
		}
	};

	if(!cfg.buttons){
		cfg.buttons = [
			{code:'yes',name:cfg.buttonText||'OK'}
		];
	};
	cfg.type = 'alert';

	// Окно с тем же текстом - игнорируем
	if(cfg.text){
		var same = Resolute.Message.Manager.find('text', cfg.text);
		if(same){
			return null;
		}
	}
	return Resolute.Message.Manager.add(new Resolute.Message.Box(cfg));
};
Resolute.Message.alert = function(title,message,icon){
	if(!message && Resolute.isObject(title)){
		return Resolute.Message.show(title);
	} else {
		if(!message && title && Resolute.isString(title)){
			message = title;
			title = '';
		}
		return Resolute.Message.show({title:title,text:message,icon:icon||null});
	}
};
Resolute.Message.confirm = function(message, func, scope, buttons, icon){
	if(!isDefined(buttons)){
		buttons = Resolute.Message.YESNO
	}

	if(!message){
		message = 'Вы уверены, что хотите совершить выбранное действие?';
	}

	return Resolute.Message.show({text:message, buttons:buttons, scope:scope||null, icon:icon||null}, func);
};
Resolute.Message.ask = function(message, fucnOnYes, scope, buttons){
	if(!message){
		message = 'Вы уверены, что хотите совершить выбранное действие?';
	}
	Resolute.Message.confirm(message, function(btn){
		if(!isFunction(fucnOnYes)){
			this.hide();
			return;
		}
		if(btn == 'yes') fucnOnYes.call(scope);
	}, this, buttons);
};
Resolute.Message.hide = function(win){
	if(isDefined(win)){
		var id = null;
		if(isObject(win) && win.id){
			id = win.id;
		}
		else if(isString(win)){
			id = win;
		}
		Resolute.Message.Manager.remove(id);
		return;
	}
	if(Resolute.Message.Manager.active){
		Resolute.Message.Manager.remove(Resolute.Message.Manager.active.id);
	}
};
Resolute.Message.hideAll = function(type){
	Resolute.Message.Manager.killEmAll(type);
};
Resolute.Message.wait = function(cfg){
	if(isString(cfg)){
		cfg = {title: cfg};
	}
	if(!cfg){
		var cfg = {};
	};
	cfg.autoShow = true;
	return Resolute.Message.Manager.add(new Resolute.Message.WaitBox(cfg));
};

Resolute.Msg = Resolute.Message;