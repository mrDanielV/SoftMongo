if(!window.Resolute) Resolute = {};
R = Resolute;

Resolute.version = '4.0.0';
Resolute.isReady = false;
Resolute.enableConsoleLog = true;
Resolute.enableGarbageCollector = true;
Resolute.enableListenerCollection = true;
Resolute.enableNestedListenerRemoval = true;
Resolute.namespaceCache = {};

Resolute.match = function(data,query){
	if(!query) return false;
	if(!data) return false;
	var d = data;
	if(data instanceof Resolute.Data.Observable){
		d = data.getData(true);
	};
	var vars = (query['$vars'] && Resolute.isObject(query['$vars']))?query['$vars']:null;
	for(var key in query){
		if(key == '$or' && Resolute.isArray(query[key])){
			var orCnt = 0;
			Resolute.each(query[key],function(item){
				if(vars){
					item['$vars'] = vars;
				};
				if(Resolute.match(d,item)) orCnt++;
			});
			if(orCnt==0) return false;
			continue;
		};
		if(Resolute.isObject(query[key])){
			var snippetsRes = 0, snippetsCount = 0;
			for(var snip in Resolute.match.snippets){
				if(Resolute.isDefined(query[key]['$'+snip]) && Resolute.match.snippets.hasOwnProperty(snip)){
					var qv = query[key]['$'+snip];
					if(Resolute.isString(qv) && vars){
						qv = qv.format(vars);
					};
					if(!Resolute.match.snippets[snip](Resolute.path.get(d,key),qv)){
						return false
					};
				};
			}
		} else {
			var qv = query[key];
			if(Resolute.isString(qv) && vars){
				qv = qv.format(vars);
			};
			if(Resolute.path.get(d,key)!=query[key]){
				return false;
			};
		}
	};
	return true;
};
Resolute.match.snippets = {
	lt:function(v,qv){
		// v - значение из объекта
		// qv - значение из запроса
		return v<qv;
	},
	vars:function(v,qv){
		return true;
	},
	lte:function(v,qv){
		return v<=qv;
	},
	gt:function(v,qv){
		return v>qv;
	},
	gte:function(v,qv){
		return v>=qv;
	},
	ne:function(v,qv){
		return v!=qv;
	},
	eq:function(v,qv){
		return v==qv;
	},
	empty:function(v,qv){
		if(qv===true){
			return !v || !Resolute.isDefined(v) || Resolute.isEmpty(v);
		};
		return v && Resolute.isDefined(v) && !Resolute.isEmpty(v);
	},
	'in':function(v,qv){
		return qv.present(v)
	},
	nin:function(v,qv){
		return !qv.present(v)
	},
	like:function(v,qv){
		if(R.isString(qv)){
			qv = qv.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
		}
		return (new RegExp(qv,'i')).test(v)
	},
	startsWith:function(v,qv){
		if(R.isString(qv)){
			qv = qv.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
		}
		return (new RegExp('^'+qv,'i')).test(v)
	},
	endsWith:function(v,qv){
		if(R.isString(qv)){
			qv = qv.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
		}
		return (new RegExp(qv+'$','i')).test(v)
	},
	distance:function(v,qv){
		// Поиск по расстоянию между двумя точками (одна в объекте, другая в критерии)
		// точка: массив из двух чисел: x и y
		// 
		// Resolute.match({point:[2,2]},{point:{'$distance':{'$from':[5,5],'$gt':4.2,'$lt':4.4}}})
		//
		if(!v) return;
		if(!Resolute.isObject(qv)) return false;
		if(!Resolute.isArray(v)) return false;
		if(!qv['$from'] || !Resolute.isArray(qv['$from']) || qv['$from'].length!=2) return false;
		var a = Math.abs(qv['$from'][0] - v[0]);
		var b = Math.abs(qv['$from'][1] - v[1]);
		var d = {distance:Math.sqrt(a*a + b*b)};
		var distQuery = Resolute.clone(qv);
		delete distQuery['$from'];
		return Resolute.match(d,{distance:distQuery});
	}
}

Resolute.isEmpty = function(v, allowBlank){
	return v === null || v === undefined || ((Resolute.isArray(v) && !v.length)) || (!allowBlank ? v === '':false);
};
Resolute.isArray = function(v){
	return toString.apply(v) === '[object Array]';
};
Resolute.isDate = function(v){
	return toString.apply(v) === '[object Date]';
};
Resolute.isObject = function(v){
	return !!v && Object.prototype.toString.call(v) === '[object Object]';
};
Resolute.isPrimitive = function(v){
	return Resolute.isString(v) || Resolute.isNumber(v) || Resolute.isBoolean(v);
};
Resolute.isIterable = function(v){
	if(Resolute.isArray(v) || v.callee){
		return true;
	}
	if(/NodeList|HTMLCollection/.test(toString.call(v))){
		return true;
	}
	return ((typeof v.nextNode != 'undefined' || v.item) && Resolute.isNumber(v.length));
};
Resolute.isFunction = function(v){
	return toString.apply(v) === '[object Function]';
};
Resolute.isNumber = function(v){
	return typeof v === 'number' && isFinite(v);
};
Resolute.isString = function(v){
	return typeof v === 'string';
};
Resolute.isBoolean = function(v){
	return typeof v === 'boolean';
};
Resolute.isElement = function(v){
	return v ? !!v.tagName:false;
};
Resolute.isDefined = function(v){
	return typeof v !== 'undefined';
};
Resolute.isFloat = function(n){
	return Number(n) === n && n % 1 !== 0;
};

Resolute.cache = {
	lastQuote: false,
	engineType: 4,
	currentProduct: '',
	modules: {},
	items:{
		elements:{}
	},
	get:function(path){
		// Получение элемента кэша path - путь до элемента;
	},
	set:function(path,elem){
		// Установка элемента кэша
	},
	remove:function(path){
		// Удаление элемента кэща
	}
};

Resolute.count = function(q){
	// Число элементов массива или число ключей объекта
	if(Resolute.isArray(q)) return q.length;
	if(Resolute.isObject(q)) return Object.keys(q).length;
	return 0;
}

Resolute.each = function(array, fn, scope){
	if(Resolute.isEmpty(array, true)){
		return;
	};
	if(Resolute.isObject(array)){
		var keys = Object.keys(array);
		for(var key in array){
			if(array.hasOwnProperty(key)){
				var isLast = keys.indexOf(key) == (keys.length-1),
					i = keys.indexOf(key);
				if(fn.call(scope || array[key], array[key], key, array, i, isLast) === false){
					return key;
				};
			}
		};
	} else if(!Resolute.isIterable(array) || Resolute.isPrimitive(array)){
		array = [array];
	}
	for(var i = 0, len = array.length; i < len; i++){
		var isLast = (i == len-1);
		if(fn.call(scope || array[i], array[i], i, array, i, isLast) === false){
			return i;
		};
	}
};

Resolute.exec = function(r){
	var res = null;
	eval('var res='+r+';');
	return res;
}

// Внутренние счетчики (например, id узлов или элементов)
Resolute.sequence = {
	cache:{},
	next:function(name){
		if(!Resolute.isDefined(Resolute.sequence.cache[name])){
			Resolute.sequence.cache[name] = 0;
		};
		return Resolute.sequence.cache[name]++;
	}
}

// Получить содержимое свойств объекта в виде массива
Resolute.extract = function(o, props){
	if(!props || props.length==0) return null;
	var res = {};
	for(var i=0;i<props.length;i++){
		if(Resolute.isDefined(o[props[i]])){
			res[props[i]] = o[props[i]];
		}
	};
	return res;
};

Resolute.getDom = function(el, strict){
	//console.log('Resolute.getDom ЗАМЕНИТЬ!!!!')
	if(!el || !document){
		return null;
	}
	if (el.dom){
		return el.dom;
	} else {
		if (typeof el == 'string') {
			return document.getElementById(el);
		} else {
			return el;
		}
	}
};

Resolute.getBody = function(){
	// Возврат тела документа как элемента
	return Resolute.get(document.body);
};

Resolute.applyIf = function(o, c){
	if(o){
		for(var p in c){
			if(!Resolute.isDefined(o[p])){
				o[p] = c[p];
			}
		}
	}
	return o;
};

// Клонирование переменной (если нужно принудительно отвязать ссылку)
Resolute.clone = function(o) {
	if(!o || 'object' !== typeof o){
		return o;
	};
	var c = 'function' === typeof o.pop ? [] : {};
	var p, v;
	for(p in o) {
		if(o.hasOwnProperty(p)) {
			v = o[p];
			if(v && 'object' === typeof v) {
				c[p] = Resolute.clone(v);
			} else {
				c[p] = v;
			}
		}
	};
	return c;
};
// Генерация пароля (для автозаполнения...например в карточке пользователя кнопка "Создать пароль")
Resolute.pass = function(type){
	var p = null;
	switch(type){
		case 'strong':
			// Сложный пароль - смесь букв в разных регистрах, цифр и дополнительных символов
			p = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase()+'$%@_').shuffle();
			break;
		default: p = Math.random().toString(36).slice(2);
	}
	return p;
}

// Копирование свойств из config в object (defaults - объект для дефолтных значений)
Resolute.apply = function(object, config, defaults){
	if(defaults){
		Resolute.apply(object, defaults);
	}
	if(object && config && typeof config == 'object'){
		for(var p in config){
			object[p] = config[p];
		}
	}
	return object;
};

Resolute.addMembers = function (cls, target, members, handleNonEnumerables) {
	var i, name, member;
	for (name in members) {
		if (members.hasOwnProperty(name)) {
			member = members[name];
			if (typeof member == 'function') {
				member.$owner = cls;
				member.$name = name;
			}

			target[name] = member;
		}
	}
	if(handleNonEnumerables && nonEnumerables) {
		for (i = nonEnumerables.length; i-- > 0; ) {
			name = nonEnumerables[i];
			if (members.hasOwnProperty(name)) {
				member = members[name];
				if (typeof member == 'function') {
					member.$owner = cls;
					member.$name = name;
				}
				target[name] = member;
			}
		}
	}
};
Resolute.define = function (className, body, createdFn) {
	var override = body.override,
		cls, extend, name, namespace;

	if (override) {
		delete body.override;
		cls = Resolute.getClassByName(override);
		Resolute.override(cls, body);
	} else {
		if (className) {
			namespace = Resolute.createNamespace(className, true);
			name = className.substring(className.lastIndexOf('.')+1);
		}

		cls = function ctor () {
			this.constructor.apply(this, arguments);
		}

		if (className) {
			cls.displayName = className;
		}
		Resolute.apply(cls, Resolute.AbstractBase);

		if (typeof body == 'function') {
			body = body(cls);
		}

		extend = body.extend;
		if (extend) {
			delete body.extend;
			if (typeof extend == 'string') {
				extend = Resolute.getClassByName(extend);
			}
		} else {
			extend = Base;
		}

		Resolute.extend(cls, extend, body);
		if (cls.prototype.constructor === cls) {
			delete cls.prototype.constructor;
		}

		// Not extending a class which derives from Base...
		if (!cls.prototype.$isClass) {
			Resolute.applyIf(cls.prototype, Base.prototype);
		}
		cls.prototype.self = cls;
		
		if (body.rtype) {
			Resolute.reg(body.rtype, cls);
		}
		cls = body.singleton ? new cls() : cls;
		if (className) {
			namespace[name] = cls;
		}
	}

	if (createdFn) {
		createdFn.call(cls);
	}

	return cls;
};
Resolute.override = function (target, overrides) {
	var proto, statics;
	if (overrides) {
		if (target.$isClass) {
			statics = overrides.statics;
			if (statics) {
				delete overrides.statics;
			}

			Resolute.addMembers(target, target.prototype, overrides, true);
			if (statics) {
				Resolute.addMembers(target, target, statics);
			}
		} else if (typeof target == 'function') {
			proto = target.prototype;
			Resolute.apply(proto, overrides);
			if(Resolute.isIE && overrides.hasOwnProperty('toString')){
				proto.toString = overrides.toString;
			}
		} else {
			var owner = target.self,
				name, value;

			if (owner && owner.$isClass) {
				for (name in overrides) {
					if (overrides.hasOwnProperty(name)) {
						value = overrides[name];

						if (typeof value == 'function') {
							//<debug>
							if (owner.$className) {
								value.displayName = owner.$className + '#' + name;
							}
							//</debug>

							value.$name = name;
							value.$owner = owner;
							value.$previous = target.hasOwnProperty(name)
								? target[name] // already hooked, so call previous hook
								: callOverrideParent; // calls by name on prototype
						}

						target[name] = value;
					}
				}
			} else {
				Resolute.apply(target, overrides);

				if (!target.constructor.$isClass) {
					target.constructor.prototype.callParent = Base.prototype.callParent;
					target.constructor.callParent = Base.callParent;
				}
			}
		}
	}
};
Resolute.extend = function(sb, sp, overrides){
	var ovvr = function(o){
		for(var m in o){
			this[m] = o[m];
		}
	};
	var oc = Object.prototype.constructor;

	if(typeof sp == 'object'){
		overrides = sp;
		sp = sb;
		sb = overrides.constructor != oc ? overrides.constructor : function(){sp.apply(this, arguments);};
	}
	var F = function(){},
		sbp,
		spp = sp.prototype;

	F.prototype = spp;
	sbp = sb.prototype = new F();
	sbp.constructor=sb;
	sb.superclass=spp;
	if(spp.constructor == oc){
		spp.constructor=sp;
	}
	sb.override = function(o){
		Resolute.override(sb, o);
	};
	sbp.superclass = sbp.supr = (function(){
		return spp;
	});
	sbp.override = ovvr;
	Resolute.override(sb, overrides);
	sb.extend = function(o){return Resolute.extend(sb, o);};
	return sb;
};

// Краткое создание класса с методами
/*
	Resolute.test = Resolute.class(function(cfg){
		this.name = cfg;
	},{
		getName:function(){
			return this.name;
		},
		setName:function(name){
			this.name = name;
		}
	});
	
	является аналогом:
	
	Resolute.test = function(cfg){
		this.name = cfg;
	};
	Resolute.prototype = {
		getName:function(){
			return this.name;
		},
		setName:function(name){
			this.name = name;
		}
	}

	Конструктора может не быть!
	
	Resolute.test = Resolute.class({
		getName:function(){
			return this.name;
		},
		setName:function(name){
			this.name = name;
		}
	});
	
	это аналогично:
	
	Resolute.test = function(){};
	Resolute.prototype = {
		getName:function(){
			return this.name;
		},
		setName:function(name){
			this.name = name;
		}
	}
	
	Так же можно расширять имеющиеся классы:
	
	Resolute.test = Resolute.class({
		extends:'Resolute.Observable',
		getName:function(){
			return this.name;
		},
		setName:function(name){
			this.name = name;
		}
	});
	

*/
Resolute.class = function(cfg,opt){
	var cnstr = function(){};
	var opts = null;
	var hasOriginalConstructor = false;
	if(Resolute.isFunction(cfg)){
		cnstr = cfg;
		hasOriginalConstructor = true;
		if(Resolute.isObject(opt)){
			opts = opt;
		};
	} else if(Resolute.isObject(cfg) && cfg.constructor){
		cnstr = cfg.constructor;
		hasOriginalConstructor = true;
		delete cfg.constructor;
		opts = cfg;
	};
	if(opts.extends){
		var ext = Resolute.path.get(window,opts.extends);
		if(ext){
			delete opts.extends;
			if(hasOriginalConstructor){
				return Resolute.extend(cnstr,ext,opts);
			} else {
				return Resolute.extend(ext,opts);
			}
		}
	} else {
		cnstr.prototype = opts;
	};
	return cnstr;
};

Resolute.createNamespace = function (namespaceOrClass, isClass) {
	var cache = Resolute.namespaceCache,
		namespace = isClass ? namespaceOrClass.substring(0, namespaceOrClass.lastIndexOf('.'))
					: namespaceOrClass,
		ns = cache[namespace],
		i, n, part, parts, partials;
	if (!ns) {
		ns = Resolute;
		if (namespace) {
			partials = [];
			parts = namespace.split('.');
			for (i = 0, n = parts.length; i < n; ++i) {
				part = parts[i];
				ns = ns[part] || (ns[part] = {});
				partials.push(part);
				cache[partials.join('.')] = ns;
			}
		}
	}
	return ns;
}
Resolute.namespace = function(){
	// Создание namespace (пустого!)
	var len1 = arguments.length,
		i = 0,
		len2,
		j,
		main,
		ns,
		sub,
		current;

	for(; i < len1; ++i) {
		main = arguments[i];
		ns = arguments[i].split('.');
		current = window[ns[0]];
		if (current === undefined) {
			current = window[ns[0]] = {};
		}
		sub = ns.slice(1);
		len2 = sub.length;
		for(j = 0; j < len2; ++j) {
			current = current[sub[j]] = current[sub[j]] || {};
		}
	}
	return current;
};
Resolute.ns = Resolute.namespace;

// Пустая функция  - для заглушек
Resolute.emptyFn = function(){};

// Преобразование объекта в JSON строку
Resolute.encode = function(o){
	return JSON.stringify(o);
};
// Преобразование JSON строки в объект
Resolute.decode = function(o){
	return JSON.parse(o);
};

// Отложенная функция
Resolute.DelayedTask = function(fn, scope, args){
	var me = this,
		id,
		call = function(){
			clearInterval(id);
			id = null;
			fn.apply(scope, args || []);
		};
	me.delay = function(delay, newFn, newScope, newArgs){
		me.cancel();
		fn = newFn || fn;
		scope = newScope || scope;
		args = newArgs || args;
		id = setInterval(call, delay);
	};
	me.cancel = function(){
		if(id){
			clearInterval(id);
			id = null;
		}
	};
};

// Проверка равны ли два объекта
Resolute.equal = function(a, b){
	if (a === b)
		return true;
	if (a && b && typeof a == 'object' && typeof b == 'object') {
		if (a.constructor !== b.constructor)
			return false;
		var length,
		i,
		keys;
		if (Array.isArray(a)) {
			length = a.length;
			if (length != b.length)
				return false;
			for (i = length; i-- !== 0; )
				if (!Resolute.equal(a[i], b[i]))
					return false;
			return true;
		}
		if (a.constructor === RegExp)
			return a.source === b.source && a.flags === b.flags;
		if (a.valueOf !== Object.prototype.valueOf)
			return a.valueOf() === b.valueOf();
		if (a.toString !== Object.prototype.toString)
			return a.toString() === b.toString();

		keys = Object.keys(a);
		length = keys.length;
		if (length !== Object.keys(b).length)
			return false;

		for (i = length; i-- !== 0; )
			if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
				return false;

		for (i = length; i-- !== 0; ) {
			var key = keys[i];
			if (!Resolute.equal(a[key], b[key]))
				return false;
		}

		return true;
	}
	return a !== a && b !== b;
}


Resolute.getViewWidth = function(full){
	return full ? Resolute.getDocumentWidth() : Resolute.getViewportWidth();
};

Resolute.getViewHeight = function(full){
	return full ? Resolute.getDocumentHeight() : Resolute.getViewportHeight();
};

Resolute.getDocumentHeight = function(){
	return Math.max(document.body.scrollHeight, Resolute.getViewportHeight());
};

Resolute.getDocumentWidth = function(){
	return Math.max(document.body.scrollWidth, Resolute.getViewportWidth());
};

Resolute.getViewportHeight = function(){
	return window.innerHeight;
};

Resolute.getViewportWidth = function(){
	return window.innerWidth;
};

// TODO remove
Resolute.num = function(v, defaultValue){
	v = Number(Resolute.isEmpty(v) || Resolute.isArray(v) || typeof v == 'boolean' || (typeof v == 'string' && v.trim().length == 0) ? NaN : v);
	return isNaN(v) ? defaultValue : v;
};

Resolute.enrich = function(cmp,methods,prefix){
	// Обогатить cmp методами methods (с добавлением префиксов: префикс=list метод=add => получим в результате addList; метод=isHidden => isListHidden)
	Resolute.each(methods,function(value,key){
		var methodName = key;
		if(methods.hasOwnProperty(key)){
			if(prefix){
				if(methodName.startsWith('is') && methodName.isUpper(2)){
					methodName = 'is'+prefix.upperFirst()+methodName.slice(2);
				} else {
					methodName = key+prefix.upperFirst();
				}
			};
			cmp[methodName] = methods[key];
		}
	});
};

// Локализация
Resolute.locale = {
	code: 'rus',
	name: 'Русский',
	list:{
		rus:{code:'rus',name:'Русский'}
	},
	def:function(path,loc){
		return Resolute.locale.getDef(path,loc);
	},
	setDef:function(path,value,loc){
		var l = Resolute.locale.code;
		if(Resolute.isObject(path)){
			if(Resolute.isString(value)) l = value;
			var ps = path.paths();
			Resolute.each(ps,function(lpath){
				Resolute.locale.setDef(lpath.path,lpath.value,l);
			});
			return;
		};
		if(!loc) l = Resolute.locale.code;
		Resolute.path.set(Resolute.locale.list,l+'.'+path,value);
	},
	getDef:function(path,loc){
		if(!loc) loc = Resolute.locale.code;
		Resolute.path.get(Resolute.locale.list,loc+'.'+path);
	},
	set:function(loc,desc){
		Resolute.locale.code = loc;
		if(desc){
			Resolute.locale.name = desc;
		};
		// Загрузить описание локали с сервера
		// TODO
	},
	get:function(asObject){
		if(asObject){
			return {
				code:Resolute.locale.code,
				name:Resolute.locale.name
			}
		} else {
			return Resolute.locale.code;
		}
	}
};

Resolute.log = function(){
	if(Resolute.enableConsoleLog){
		console.log.apply(null,arguments);
	}
};
Resolute.warn = function(){
	if(Resolute.enableConsoleLog){
		console.warn.apply(null,arguments);
	}
};


window.addEventListener('offline',function(event){
	console.log('offline');
});
window.addEventListener('online',function(event){
	console.log('online');
});

/*
onLoad!!!

Resolute.locale.setDef('Date.weekBeginDay',0);
Resolute.locale.setDef('Date.weekDays',['Пн','Вт','Ср','Чт','Пт','Сб','Вс']);
Resolute.locale.setDef('Date.weekDaysFull',['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']);
*/