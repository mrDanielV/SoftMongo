Resolute.qs = function(selector, el){
	if (!el) {el = document;}
	return el.querySelector(selector);
};
Resolute.query = Resolute.qs;

Resolute.qsa = function(selector, el) {
	if (!el) {el = document;}
	return Array.prototype.slice.call(el.querySelectorAll(selector));
};
Resolute.queryAll = Resolute.qsa;

Resolute.namespace('Resolute.cache.items.elements');
Resolute.cache.items.elements = {};

Resolute.get = function(el) {
	if(!el) return null;
	var elm;
	if (typeof el == "string"){
		if (!(elm = document.getElementById(el))) {
			return null;
		};
		if(!Resolute.cache.items.elements[el]){
			Resolute.cache.items.elements[el] = {
				el:  new Resolute.Element(elm),
				data: {},
				events: {}
			}
		};
		return Resolute.cache.items.elements[el].el;
	} else if(el.tagName){
		return new Resolute.Element(el);
	} else if(el instanceof Resolute.Element){
		return el;
	};
	return null;
};

// JSML - JSON Markup Language
Resolute.jsml = {
	snippets:{
		
	},
	mode:'append',
	setMode:function(m){
		Resolute.jsml.mode = m;
	},
	resetMode:function(){
		Resolute.jsml.mode = 'append';
	},
	prop:function(p,v){
		var vl = v;
		if(Resolute.isObject(vl)){
			vl = Resolute.CSS.style2text(vl);
		};
		return ''+p+'="'+vl+'"';
	},
	tagWrap:function(n,a,c){
		return '<'+n+''+((a)?' '+a:'')+'>'+((c)?c:'')+'</'+n+'>';
	},
	parse:function(cfg,dataInput){
		// Получение строки HTML по разметке jsml
		if(!cfg){return ''};
		if(dataInput instanceof Resolute.Data.Observable){
			var data = dataInput;
		} else {
			var data = new Resolute.Data.Observable({data:dataInput});
		};
		if(Resolute.isString(cfg)){
			return cfg.format(data.data);
		};
		if(cfg.conditions && cfg.tpl){
			if(Resolute.match(data,cfg.conditions)){
				return Resolute.jsml.parse(cfg.tpl,data);
			};
			return '';
		};
		if(cfg.conditions && !cfg.tpl && !Resolute.match(data,cfg.conditions)){
			return '';
		};
		if(cfg.proccess && cfg.proccess=='list'){
			// Обработка массива
			var res = '';
			var list = data.get(cfg.data,[]);
			for(var i=0;i<list.length;i++){
				res += Resolute.jsml.parse(cfg.tpl,list[i]);
			};
			return res;
		};
		if(cfg.tpl){
			if(Resolute.jsml.snippets[cfg.tpl]){
				return Resolute.jsml.parse(Resolute.jsml.snippets[cfg.tpl],cfg);
			};
			return '';
		};
		var gu = Resolute.jsml,cnt = '',prop = [];
		if(Resolute.isArray(cfg)){
			for(var q=0;q<cfg.length;q++){
				cnt += gu.parse(cfg[q],data);
			};
			return cnt;
		};
		if(!cfg.tag){cfg.tag = 'div'};
		if(cfg.t){cfg.tag = cfg.t};
		if(cfg.cn){
			if(Resolute.isArray(cfg.cn)){
				for(var q=0;q<cfg.cn.length;q++){
					cnt += gu.parse(cfg.cn[q],data);
				};
			} else {
				cnt = gu.parse(cfg.cn,data);
			}
		};
		if(cfg.id){
			if(cfg.id===true){
				cfg.id = Resolute.id({});
			};
			prop.push(gu.prop('id',cfg.id))
		};
		if(cfg.cls){
			var clsl = (cfg.cls.indexOf('{'))?cfg.cls.format(data.data||{}):cfg.cls;
			prop.push(gu.prop('class', clsl ));
			if(Resolute.path.get(Resolute,'CSS.Forge')){
				Resolute.CSS.Forge.parse(clsl);
			}
		};
		if(cfg.st){prop.push(gu.prop('style',((cfg.st.indexOf('{'))?cfg.st.format(data.data||{}):cfg.st) ) )};
		if(cfg.attr){
			for(var k in cfg.attr){
				if(!Resolute.isString(cfg.attr[k])){
					cfg.attr[k] += '';
				};
				if(data && Resolute.isString(cfg.attr[k])){
					prop.push(gu.prop('data-'+k,cfg.attr[k].format(data.data)));
				} else {
					prop.push(gu.prop('data-'+k,cfg.attr[k]));
				}
			}
		};
		if(cfg.a){
			for(var k in cfg.a){
				if(!Resolute.isString(cfg.a[k])){
					cfg.a[k] += '';
				};
				if(data && Resolute.isString(cfg.a[k])){
					prop.push(gu.prop(k,cfg.a[k].format(data.data)));
				} else {
					prop.push(gu.prop(k,cfg.a[k]));
				}
			}
		};
		if(cfg.drop){
			prop.push(gu.prop('data-dropzone','true'));
		};
		if(cfg.put){
			prop.push(gu.prop('data-tpl-put',cfg.put));
			if(data && !cfg.drop){
				cnt = data.get(cfg.put);
			}
		};
		return gu.tagWrap(cfg.tag,prop.join(' '),cnt);
	},
	apply:function(parentEl,cfg,dataInput,observers,refs,cmps,tplCode){
		// Создание на лету html элементов по разметке
		if(!cfg) return;
		if(Resolute.isArray(cfg)){
			var nodes = [];
			for(var q=0;q<cfg.length;q++){
				nodes.push(Resolute.jsml.apply(parentEl,cfg[q],data,observers,refs,cmps,tplCode));
			};
			return nodes;
		};
		if(dataInput instanceof Resolute.Data.Observable){
			var data = dataInput;
		} else {
			var data = new Resolute.Data.Observable(dataInput);
		};
		var hasDataLink = function(str){
			return /{([^}]+)}/g.test(str);
		};
		var extractPath = function(str){
			var res = [];
			var regx = /{([^}]+)}/g;
			var curr = null;
			while(curr = regx.exec(str)) {
				res.push(curr[1]);
			};
			return res;
		};
		if(Resolute.isString(cfg)){
			var node = parentEl.append({t:'span',cn:cfg.format(data.data)},true);
			if(hasDataLink(cfg) && observers){
				observers.push({node:node,type:'content',paths:extractPath(cfg),tpl:cfg});
			};
			return node;
		};
		if(Resolute.isNumber(cfg)){
			var node = parentEl.append({t:'span',cn:''+cfg+''},true);
			return node;
		};
		if(cfg.conditions && cfg.tpl){
			if(data.matches(cfg.conditions)){
				return Resolute.jsml.apply(parentEl,cfg.tpl,data.data,observers,refs,cmps,tplCode);
			};
		};
		if(cfg.rtype){
			// компонент!!!
			var c = Resolute.create(Resolute.apply({
				renderTo: parentEl,
				fromTpl:tplCode
			}, cfg));
			if(cmps){
				Resolute.path.set(cmps,cfg.ref || c.id,c);
			};
			return;
		};
		if(cfg.conditions && !cfg.tpl && !data.matches(cfg.conditions)){
			return;
		};
		if(cfg.tpl){
			if(Resolute.jsml.snippets[cfg.tpl]){
				return Resolute.jsml.apply(parentEl,Resolute.jsml.snippets[cfg.tpl],data,observers,refs,cmps,tplCode);
			};
			return;
		};
		if(cfg.proccess && cfg.proccess=='list'){
			// Обработка массива
			var list = data.get(cfg.path,[]);
			for(var i=0;i<list.length;i++){
				Resolute.jsml.apply(parentEl,cfg.tpl,list[i],observers,refs,cmps,tplCode);
			};
		};
		var gu = Resolute.jsml,cnt = '',prop = [];
		var applyA = function(c,p,pr,data){
			for(var k in c){
				if(!Resolute.isString(c[k])){
					c[k] += '';
				};
				if(data && Resolute.isString(c[k])){
					pr.push(gu.prop((p=='attr')?'data-'+k:k,c[k].format(data)));
				} else {
					pr.push(gu.prop((p=='attr')?'data-'+k:k,c[k]));
				}
			}
		};
		
		if(cfg.t){cfg.tag = cfg.t};
		if(!cfg.tag){cfg.tag = 'div'};
		if(cfg.id){
			/* if(cfg.id===true){
				cfg.id = Resolute.id({});
			}; */
			prop.push(gu.prop('id',cfg.id))
		};
		
		if(cfg.cls){
			var clsl = (hasDataLink(cfg.cls))?cfg.cls.format(data.data||{}):cfg.cls;
			prop.push(gu.prop('class',clsl));
			if(Resolute.path.get(Resolute,'CSS.Forge')){
				Resolute.CSS.Forge.parse(clsl);
			}
		};
		if(cfg.st){prop.push(gu.prop('style',((hasDataLink(cfg.st))?cfg.st.format(data.data||{}):cfg.st)))};
		if(cfg.attr) applyA(cfg.attr,'attr',prop,data.data);
		if(cfg.a) applyA(cfg.a,'a',prop,data.data);
		if(!cfg.cn && cfg.items){
			cfg.cn = cfg.items;
		};
		var node = new Resolute.Element(gu.tagWrap(cfg.tag,prop.join(' '),(Resolute.isString(cfg.cn))?cfg.cn.format(data.data):''));
		switch(Resolute.jsml.mode){
			case 'append': parentEl.append(node); break;
			case 'after': parentEl.after(node); break;
			case 'before': parentEl.before(node); break;
		};
		
		if(hasDataLink(cfg.cls) && observers){
			observers.push({node:node,type:'class',paths:extractPath(cfg.cls),tpl:cfg.cls});
		};
		if(hasDataLink(cfg.st) && observers){
			observers.push({node:node,type:'style',paths:extractPath(cfg.st),tpl:cfg.st});
		};
		if(Resolute.isString(cfg.cn)){
			if(hasDataLink(cfg.cn) && observers){
				observers.push({node:node,type:'content',paths:extractPath(cfg.cn),tpl:cfg.cn});
			};
		};
		if(cfg.cn && !Resolute.isString(cfg.cn)){
			if(Resolute.isArray(cfg.cn)){
				for(var q=0;q<cfg.cn.length;q++){
					gu.apply(node,cfg.cn[q],data,observers,refs,cmps,tplCode);
				};
			} else {
				gu.apply(node,cfg.cn,data,observers,refs,cmps,tplCode);
			}
		};
		if(cfg.data){
			node.setData(cfg.data);
		};
		if(cfg.listeners){
			var scope = this;
			Resolute.each(cfg.listeners,function(fn,event){
				if(event=='scope'){
					scope = fn;
				} else {
					node.on(event,fn,scope);
				}
			})
		};
		if(refs && Resolute.isObject(refs) && cfg.ref){
			Resolute.path.set(refs,cfg.ref,node);
		};
		if(cfg.ref){
			node.setAttribute('data-ref',cfg.ref);
		};
		if(cfg.animate && node.animate){
			node.animate(cfg.animate);
		};
		return node;
	},
	getMarkup:function(selector,asString){
		// Сборка jsml по имеющейся вёрстке
		if(Resolute.isString(selector)){
			if(selector.indexOf('#')==0){
				var node = document.getElementById(selector);
			} else {
				var node = document.querySelector(selector);
			}
		} else {
			var node = selector;
		};
		var jsml = null;
		if(node){
			jsml = {};
			var tag = node.tagName.toLowerCase();
			if(tag !== 'div'){
				jsml.t = tag;
			};
			for(var i=0;i<node.attributes.length;i++){
				if(node.attributes[i].name.indexOf('data-')==0){
					if(!jsml.attr){jsml.attr = {}};
					jsml.attr[node.attributes[i].name.replace('data-','')] = node.attributes[i].value;
				} else {
					if(node.attributes[i].name == 'class'){
						jsml.cls = node.attributes[i].value;
					} else if(node.attributes[i].name == 'style'){
						jsml.st = node.attributes[i].value;
					} else {
						if(!jsml.a){
							jsml.a = {};
						};
						jsml.a[node.attributes[i].name] = node.attributes[i].value;
					}
				}
			};
			if(node.childElementCount>0){
				jsml.cn = [];
				var subNode = node.firstElementChild;
				for(var i=0;i<node.childElementCount;i++){
					if(!subNode){
						continue;
					};
					if(subNode.nodeName.toLowerCase()=='#text'){
						jsml.cn.push(subNode.textContent);
					} else {
						jsml.cn.push(Resolute.jsml.jsml(subNode));
					};
					subNode = subNode.nextElementSibling;
				};
				if(jsml.cn.length==1){
					jsml.cn = jsml.cn[0];
				}
			} else {
				jsml.cn = node.textContent
			}
		};
		return (asString)?Resolute.encode(jsml):jsml;
	},
	icon:function(icon,cls){
		// Функция для получения разметки для иконки
		// 'fatcow-16-help.png'	- картинка
		// 'fatcow-16-help'
		// 'fatcow-32-help'
		// 'help' -> 'fatcow-16-help'
		// 'mi-help' - векторные https://fonts.google.com/icons?selected=Material+Icons&icon.style=Filled
		if(!icon) return null;
		var vector = ['mi','fa']; // Пока только Material icons. Возможно добавим FontAwesome
		var vectorCls = {
			mi:'icon material-icons'
		};
		var type = 'image'; // Умолчальный тип иконок (картинки)
		var pool = 'fatcow'; // Умолчальный пул иконок (картинки)
		var poolVariant = '16'; // Умолчальный размер иконки
		var iconName = null;
		var parts = icon.split('-');
		var m = null;
		if(vector.present(parts[0])){
			type = 'vector';
			pool = parts[0];
		} else if(parts.length>1){
			pool = parts[0];
		};
		if(type == 'image' && parts[1] && ['16','32'].present(parts[1])){
			poolVariant = parts[1];
		};
		if(parts.length == 2){
			iconName = parts[1];
		}
		if(parts.length == 3){
			iconName = parts[2];
		}
		if(parts.length == 1){
			iconName = parts[0];
		};
		if(type == 'image'){
			if(!iconName.has('.png')){
				iconName += '.png';
			}
			m = {
				t:'img',
				a:{width:poolVariant,height:poolVariant,src:'assets/resources/images/icons/{0}/{1}x{1}/{2}'.format(pool,poolVariant,iconName)}
			};
		} else if(type=='vector'){
			m = {
				t:'span',
				cls:(vectorCls[pool]||'')+((cls)?''+cls:''),
				cn: iconName
			};
		};
		return m;
	}
};

Resolute.jsml.gizmo = function(cfg){
	this.markup = {};
	Resolute.each(cfg,function(value,key){
		if(['cls','a','attr','st','cn'].has(key)){
			this.markup[key] = cfg[key];
			if(key=='st' && Resolute.isString(cfg[key])){
				this.markup.st = Resolute.CSS.text2style(cfg[key]);
			}
		}
	},this);
};
Resolute.jsml.gizmo.prototype = {
	cls:function(v){
		if(Resolute.isDefined(v)){
			if(!this.markup.cls) this.markup.cls = '';
			this.markup.cls += ' '+v;
		} else {
			return this.markup.cls;
		}
	},
	cn:function(cn,append){
		if(append){
			if(!this.markup.cn) this.markup.cn = [];
			if(Resolute.isObject(this.markup.cn) || Resolute.isPrimitive(this.markup.cn)){
				this.markup.cn = [this.markup.cn];
			};
			if(Resolute.isArray(cn)){
				Resolute.each(cn,function(item){
					this.markup.cn.push(item);
				},this);
			} else {
				this.markup.cn.push(cn);
			};
		} else {
			this.markup.cn = cn;
		}
	},
	a:function(key,value){
		return this._keyValue('a',key,value);
	},
	attr:function(key,value){
		return this._keyValue('attr',key,value);
	},
	_keyValue:function(entity,key,value){
		if(!entity) return null;
		if(Resolute.isDefined(v)){
			if(!this.markup[entity]) this.markup[entity] = {};
			if(value===null){
				if(this.markup[entity][key]) delete this.markup[entity][key];
			} else {
				this.markup[entity][key] = value;
			}
		} else {
			return this.markup[entity];
		}
	},
	st:function(key,value){
		if(!Resolute.isObject(this.markup.st)) this.markup.st = {};
		if(Resolute.isString(key)){
			if(value===null){
				if(this.markup.st[key]) delete this.markup.st[key];
			} else {
				this.markup.st[key] = value;
			}
		} else if(Resolute.isObject(key)){
			Resolute.each(key,function(v,k){
				this.markup.st[k] = v;
			},this)
		} else if(!key){
			return this.markup.st;
		}
	},
	get:function(){
		var res = Resolute.clone(this.markup);
		if(res.st){
			res.st = Resolute.CSS.style2text(res.st);
		}
		return res;
	}
};
Resolute.jsml.gizmo.init = function(cfg){
	return new Resolute.jsml.gizmo(cfg)
};
Resolute.jsml.gizmo.merge = function(g1,g2){
	if(!g2) return g1;
	var gizmo = Resolute.jsml.gizmo.init(g1);
	if(Resolute.isDefined(g2.cls)) gizmo.cls(g2.cls);
	if(Resolute.isDefined(g2.a)) gizmo.a(g2.a);
	if(Resolute.isDefined(g2.attr)) gizmo.attr(g2.attr);
	if(Resolute.isDefined(g2.st)) gizmo.st(g2.st);
	if(Resolute.isDefined(g2.cn)) gizmo.cn(g2.cn);
	return gizmo.get();
}

// Работа с шаблонами вёрстки
Resolute.Markup = {
	cache:{
		items:{},
		add:function(tpl){
			if(!tpl.code){
				tpl.code = 'tpl-'+Resolute.sequence.next('template');
			};
			Resolute.Markup.cache.items[tpl.code] = tpl;
			return Resolute.Markup.cache.items[tpl.code];
		},
		remove:function(code){
			if(Resolute.Markup.cache.items[code].beforeDestroy){
				Resolute.Markup.cache.items[code].beforeDestroy();
			};
			delete Resolute.Markup.cache.items[code];
			// TODO garbageCollect!!!
		},
		get:function(code){
			return Resolute.Markup.cache.items[code] || null;
		}
	},
	pool:{
		refs:{
			elements:{},
			components:{}
		}
	},
	reg:function(m){
		if(Resolute.isArray(m)){
			for(var i=0;i<m.length;i++){
				Resolute.Markup.reg(m[i]);
			};
			return true;
		} else if(m instanceof Resolute.Markup.Template){
			return Resolute.Markup.cache.add(m);
		} else if(Resolute.isObject(m)){
			return Resolute.Markup.cache.add(new Resolute.Markup.Template(m));
		};
	},
	get:function(code){
		return Resolute.Markup.cache.get(code);
	},
	remove:function(code){
		Resolute.Markup.cache.remove(code);
	}
};

Resolute.Markup.Template = function(cfg){
	this.code = (cfg.code)?cfg.code:'tpl-'+Resolute.sequence.next('template');
	this.prepare = (cfg.prepare)?cfg.prepare:null;
	this.markup = cfg.markup || {};
	this.mode = cfg.mode || 'html';
	this.parentEl = null;
	if(!this.markup.attr) this.markup.attr = {};
	this.observers = [];
	if(cfg.observe){
		this.observe = true;
		this.markup.attr.tpl = this.code;
	};
	if(cfg.data) this.setData(cfg.data); //!!!!!!
	Resolute.Markup.cache.add(this);
};
Resolute.Markup.Template.prototype = {
	setData:function(data){
		if(data instanceof Resolute.Data.Observable){
			this.data = data;
		} else {
			this.data = new Resolute.Data.Observable(data);
		};
		if(this.prepare){
			this.prepare.call(this);
		};
		this.refresh();
		return this;
	},
	onDataChange:function(event,path,value){
		var list = this.getObserveByPath(path);
		for(var i=0;i<list.length;i++){
			switch(list[i].type){
				case 'content':
					list[i].node.update(list[i].tpl.format(this.data.data));
					break;
				case 'style':
					// !!!!!!!!!! TODO
					break;
				case 'attr':
					// !!!!!!!!!! TODO
					break;
				case 'cls':
					// !!!!!!!!!! TODO
					break;
			}
		}
	},
	render:function(parentEl,mode){
		// Отрисовка шаблона
		var renderTo = Resolute.get(parentEl);
		if(!renderTo) return;
		if(this.mode == 'apply'){
			return this.el = this.apply(renderTo);
		} else {
			if(!mode) mode = 'update';
			return this.el = renderTo[mode](this.getHtml(),true);
		}
	},
	refresh:function(){
		// Обновить содержимое
	},
	getObserveByPath:function(path){
		var res = [];
		for(var i=0;i<this.observers.length;i++){
			for(var k=0;k<this.observers[i].paths.length;k++){
				if(Resolute.path.matches(this.observers[i].paths[k],path)){
					res.push(this.observers[i]);
				}
			};
		};
		return res;
	},
	getObservePaths:function(){
		if(!this.observe) return [];
		var res = [];
		for(var i=0;i<this.observers.length;i++){
			if(!this.observers[i].paths) continue;
			res = res.concat(this.observers[i].paths);
		};
		return res;
	},
	getHtml:function(){
		// Получить строку с html
		return Resolute.jsml.parse(this.markup,this.data);
	},
	apply:function(parentEl,refs,cmps){
		// Отрисовать шаблон сразу
		var renderTo = Resolute.get(parentEl);
		if(!renderTo) return;
		var observers = [];
		var nodes = [];
		if(Resolute.isArray(this.markup)){
			for(var i=0;i<this.markup.length;i++){
				var node = Resolute.jsml.apply(renderTo,this.markup[i],this.data,observers,refs,cmps);
				if(node){
					if(this.markup[i].listeners) this.addElemListeners(node,this.markup[i].listeners);
					nodes.push(node);
				}
			};
		} else {
			var node = Resolute.jsml.apply(renderTo,this.markup,this.data,observers,refs,cmps);
			if(node){
				if(this.markup.listeners) this.addElemListeners(node,this.markup.listeners);
			}
		};
		delete this.observers;
		this.observers = [];
		if(observers.length>0){
			this.observers = observers;
		};
		if(this.observe){
			var paths = this.getObservePaths();
			for(var i=0;i<paths.length;i++){
				this.data.on('set',this.onDataChange,this);
				this.data.on('unset',this.onDataChange,this);
			}
		};
		return (nodes.length>0)?nodes:node;
	},
	addElemListeners:function(node,listeners){
		if(!Resolute.isObject(listeners)) return;
		var scope = listeners.scope || window;
		for(var prop in listeners){
			if(listeners.hasOwnProperty(prop) && prop != 'scope'){
				node.on(prop,listeners[prop],scope);
			}
		}
	},
	beforeDestroy:function(){
		// remove listeners!!!
		this.data = null;
		this.observers = null;
	},
	destroy:function(){
		Resolute.Markup.remove(this.code);
	}
};

Resolute.Markup.Template.create = function(quidam){
	if(tpl instanceof Resolute.Markup.Template) return quidam;
	var tpl = null;
	if(Resolute.isString(quidam) && !quidam.includes('<')){
		// Строка - уникальный идентификатор шаблона
		tpl = Resolute.Markup.get(quidam);
	} else if(Resolute.isString(quidam) && quidam.includes('<')){
		// HTML строкой
		// TODO!!!!!
	} else if(Resolute.isObject(quidam) && quidam.markup){
		tpl = new Resolute.Markup.Template(quidam);
	} else if(Resolute.isObject(quidam) && (quidam.t || quidam.cn || quidam.cls)){
		tpl = new Resolute.Markup.Template({markup:quidam});
	};
	return tpl;
};

Resolute.render = function(quidam,renderTo,options){
	var opt = options || {};
	var tpl =  Resolute.Markup.Template.create(quidam);
	if(renderTo){
		var c = {}, r = {};
		tpl.apply(renderTo,r,c);
		if(opt.refsAsArray){
			var cmps = {},
				fnn = function(item,code){cmps[code] = item};
				
			Resolute.each(r,fnn);
			Resolute.each(c,fnn);
			
			return {
				tpl:tpl,
				items:cmps
			}
		};
		return {
			refs:r,
			cmps:c,
			tpl:tpl
		};
	};
	return tpl;
};

Resolute.Element = function(cfg){
	this.dom = null;
	this.id = null;
	var noId = false;
	if(cfg && cfg.isText && cfg.cn){
		this.dom = document.createTextNode(cfg.cn);
		noId = true;
	} else if(cfg && cfg.tagName){
		// Dom элемент
		this.dom = cfg;
		if(this.dom.id){
			this.id = this.dom.id;
		};
		noId = true;
	} else if(cfg && Resolute.isString(cfg)){
		// html
		var tmp = document.createElement('div');
		tmp.innerHTML = cfg;
		this.dom = tmp.children[0].cloneNode(true);
		tmp.remove();
		noId = true;
	} else if(cfg && Resolute.isObject(cfg)){
		// jsml
		var tmp = document.createElement('div');
		tmp.innerHTML = Resolute.jsml.parse(cfg);
		this.dom = tmp.children[0].cloneNode(true);
		tmp.remove();
	};
	if(!this.id && !noId){
		this.dom.id = Resolute.id(this);
		this.id = this.dom.id;
	};
	if(this.dom){
		//this.dom.addEventListener('wheel', this.onWheel.createDelegate(this));
	};
	this.plugins = {};
	if(this.dom && this.getAttribute('data-plugins')){
		var p = this.getAttribute('data-plugins').split(',');
		for(var i=0;i<p.length;i++){
			if(p[i].trim().length>0){
				this.plugin(p[i].trim(),JSON.parse(this.getAttribute('data-plugins-options')||'{}'));
			}
		}
	};
	Resolute.Element.addToCache(this);
};

Resolute.Element.prototype = {
	setId:function(idd){
		if(idd && document.getElementById(idd)) return;
		var id = (idd)?idd:Resolute.id(this);
		if(this.dom) this.dom.id = id;
		this.id = id;
		return this;
	},
	getId:function(){
		return this.dom.id;
	},
	exists:function(){
		// true - элемент реально прорисован в dom, false - элемент создан, но не отрисован в dom
		if(this.dom) return this.dom.isConnected;
		return false;
	},
	plugin:function(name,options){
		// Инициировать плагин для элемента
		if(Resolute.Elements.Plugins[name]){
			if(!this.plugins) this.plugins = {};
			this.plugins[name] = new Resolute.Elements.Plugins[name](this,options||{});
		};
		return this;
	},
	callPlugins:function(method,options){
		// Вызвать у всех плагинов определенный метод
		for(var p in this.plugins){
			if(this.plugins.hasOwnProperty(p) && this.plugins[p][method]){
				this.plugins[p][method](options);
			}
		}
	},
	pluginRemove:function(name){
		// Удалить определенный плагин
		if(this.plugins[name]){
			if(this.plugins[name].remove) this.plugins[name].remove();
			this.plugins[name] = null;
			delete this.plugins[name];
		}
	},
	append:function(el,returnNewNode){
		if(el instanceof Resolute.Element){
			this.dom.appendChild(el.dom);
			if(returnNewNode) return el;
		} else if(Resolute.isObject(el) && el.tagName){
			this.dom.appendChild(el);
			if(returnNewNode) return Resolute.get(el);
		} else if(Resolute.isString(el)){
			var tmp = document.createElement('div');
			tmp.innerHTML = el;
			var nn = tmp.children[0].cloneNode(true);
			this.dom.appendChild(nn);
			tmp.remove();
			if(returnNewNode) return Resolute.get(nn);
		} else if(Resolute.isObject(el) || Resolute.isArray(el)){
			//jsml
			var nn = Resolute.jsml.apply(this,el);
			if(returnNewNode) return nn;
			/* var tmp = document.createElement('div');
			tmp.innerHTML = Resolute.jsml.parse(el);
			var nn = tmp.children[0].cloneNode(true);
			this.dom.appendChild(nn);
			tmp.remove();
			if(returnNewNode) return Resolute.get(nn); */
		};
		return this;
	},
	text:function(){
		return this.dom.textContent;
	},
	update:function(html) {
		if(this.dom) {
			if(Resolute.isString(html)){
				this.dom.innerHTML = html;
			} else if(Resolute.isObject(html)){
				// jsml
				this.dom.innerHTML = Resolute.jsml.parse(html);
			};
			// Обновить плагины
			this.callPlugins('update');
		}
		return this;
	},
	setHtml:function(html) {
		// алиас к this.update() - установка HTML-содержимого элемента
		return this.update(html);
	},
	show:function(css){
		// Показать элемент
		if(Resolute.isString(css)){
			// CSS класс для скрытия
			this.removeClass(css);
			this.hideClass = css;
		} else {
			this.dom.style.display = '';
		};
		return this;
	},
	hide:function(css){
		// Скрыть элемент
		if(Resolute.isString(css)){
			// CSS класс для скрытия
			this.addClass(css);
		} else if(this.hideClass){
			this.addClass(this.hideClass);
			delete this.hideClass;
		} else {
			this.dom.style.display = 'none';
		};
		return this;
	},
	data:function(path,value,def){
		if(!path && !Resolute.isDefined(value)){
			return Resolute.clone(Resolute.path.get(this.dom,'data',{}));
		};
		if(Resolute.isString(path) && !Resolute.isDefined(value)){
			return Resolute.path.get(this.dom,'data.'+path,def);
		};
		
		if(!this.dom.data){
			this.dom.data = {};
		};
		Resolute.path.set(this.dom,'data.'+path,value);
		return this;
	},
	setData:function(data){
		if(!data){
			return this;
		};
		this.dom.data = data;
		return this;
	},
	clone:function(){
		var newEl = this.dom.cloneNode(true);
		return new Resolute.Element(newEl);
	},
	empty:function(){
		while(this.dom.firstChild) this.dom.removeChild(this.dom.firstChild);
		return this;
	},
	parent:function(selector){
		if(selector){
			return Resolute.get(this.dom.closest(selector));
		} else {
			return Resolute.get(this.dom.parentNode);
		}
	},
	up:function(selector){
		if(this.matches(selector)) return this;
		return this.parent(selector);
	},
	next:function(){
		if(!this.dom) return null;
		if(!this.dom.nextSibling) return null;
		return Resolute.get(this.dom.nextSibling);
	},
	prev:function(){
		if(!this.dom) return null;
		if(!this.dom.previousSibling) return null;
		return Resolute.get(this.dom.previousSibling);
	},
	last:function(){
		if(!this.dom) return null;
		if(!this.dom.lastChild) return null;
		return Resolute.get(this.dom.lastChild);
	},
	first:function(){
		if(!this.dom) return null;
		if(!this.dom.firstChild) return null;
		return Resolute.get(this.dom.firstChild);
	},
	matches:function(selector){
		if(this.dom){
			return this.dom.matches(selector);
		};
		return false;
	},
	setAttribute:function(name,value){
		// Установка аттрибута элемента
		this.dom.setAttribute(name,value);
		return this;
	},
	getAttribute:function(name){
		// Получение аттрибута элемента
		var a = this.dom.getAttribute(name);
		if(!isNaN(a) && !isNaN(parseFloat(a))){
			a = parseInt(a);
		};
		return a;
	},
	attr:function(name){
		// Получение аттрибута элемента (алиас)
		return this.getAttribute(name);
	},
	hasAttribute:function(name){
		return this.dom.hasAttribute(name);
	},
	removeAttribute:function(name){
		this.dom.removeAttribute(name);
		return this;
	},
	contains:function(child){
		var c = (child.dom)?child.dom:child;
		return this.dom !== c && this.dom.contains(c);
	},
	query:function(selector,all){
		if(all){
			var res = [];
			this.dom.querySelectorAll(selector).forEach(function(el){
				res.push(Resolute.get(el));
			});
			return res;
		} else {
			return Resolute.get(this.dom.querySelector(selector));
		}
	},
	queryAll:function(selector){
		return this.query(selector,true);
	},
	before:function(el){
		var elm = (el.tagName)?el:((el.dom)?el.dom:null);
		if(!elm && (Resolute.isObject(el)||Resolute.isString(el))){
			elm = new Resolute.Element(el);
		};
		if(elm){
			this.dom.insertAdjacentElement('beforebegin', (elm.dom)?elm.dom:elm);
		};
		return elm;
	},
	after:function(el){
		var elm = (el.tagName)?el:((el.dom)?el.dom:null);
		if(!elm && (Resolute.isObject(el)||Resolute.isString(el))){
			elm = new Resolute.Element(el);
		};
		if(elm){
			this.dom.insertAdjacentElement('afterend', (elm.dom)?elm.dom:elm);
		};
		return elm;
	},
	addClass:function(cls,defer){
		// Добавление CSS стиля к элементу
		if(!cls || !cls.trim()) return;
		cls = cls.trim();

		if(defer){
			this.addClass.defer(defer,this,[cls]);
			return this;
		}
		
		if(cls.indexOf(' ')>=0){
			var clss = cls.split(' ');
			Resolute.each(clss,function(item){
				this.addClass(item);
			},this);
		} else {
			if(Resolute.CSS && Resolute.CSS.Forge){
				Resolute.CSS.Forge.parse(cls);
			};
			this.dom.classList.add(cls);
		}

		return this;
	},
	hasClass:function(cls,kind){
		// Проверка наличия CSS стиля/стилей у элемента
		if(Resolute.isArray(cls)){
			var r = 0;
			Resolute.each(cls,function(c){
				if(this.hasClass(c)) r++;
			},this);
			if(!kind || kind == 'any'){
				return r>0;
			};
			if(kind == 'all'){
				return r == cls.length;
			};
			return false;
		} else {
			return this.dom.classList.contains(cls);
		}
	},
	removeClass:function(cls,fuzzy,defer){
		// Удаление CSS стиля
		if(!cls || !cls.trim()) return;
		cls = cls.trim();

		if(defer){
			this.removeClass.defer(defer,this,[cls,fuzzy]);
			return this;
		}

		if(cls.indexOf(' ')>=0){
			var clss = cls.split(' ');
			Resolute.each(clss,function(item){
				this.removeClass(item,fuzzy);
			},this);
		} else {
			if(!fuzzy){
				this.dom.classList.remove(cls);
			} else {
				var self = this;
				this.dom.classList.forEach(function(item){
					if(item.indexOf(cls)==0){
						self.dom.classList.remove(item);
					}
				});
			};
		}

		return this;
	},
	getClass:function(cls,removePrefix){
		var cl = null;
		this.dom.classList.forEach(function(item){
			if(item.indexOf(cls)==0){
				cl = item;
			}
		});
		if(!cl) return null;
		return (removePrefix)?cl.right(cls):cl;
	},
	replaceClass:function(a,b){
		return this.removeClass(a).addClass(b);
	},
	toggleClass:function(cls){
		return this.hasClass(cls)?this.removeClass(cls):this.addClass(cls);
	},
	scrollIntoView:function(p){
		if(this.dom) this.dom.scrollIntoView(p);
		return this;
	},
	clean:function(forceReclean) {
		Resolute.warn('Element.clean - запрещен к использованию!');
		return;
		// Очистка элемента от пустых узлов и прочего мусора
		var dom = this.dom,
			n   = dom.firstChild,
			ni  = -1;
		/* if(this.data(dom, 'isCleaned') && forceReclean !== true) {
			return this;
		}; */
		while (n) {
			var nx = n.nextSibling;
			if (n.nodeType == 3 && !(/\S/.test(n.nodeValue))) {
				dom.removeChild(n);
			} else {
				n.nodeIndex = ++ni;
			}
			n = nx;
		};
		//this.data(dom, 'isCleaned', true);
		return this;
	},
	remove:function(){
		// Самоудаление элемента
		//this.purgeAllListeners();
		if(this.resizeObserver) Resolute.Element.ResizeObserver.remove(this);
		if(this.dom.parentNode) this.dom.parentNode.removeChild(this.dom);
		if(this.id && Resolute.cache.items.elements[this.id]){
			delete Resolute.cache.items.elements[this.id];
		};
	},
	scroll:function(cfg){
		this.dom.scroll(cfg);
		return this;
	},
	scrollY:function(value){
		this.dom.scroll({
			top:value,
			behavior:smooth
		});
	},
	scrollX:function(value){
		this.dom.scroll({
			left:value,
			behavior:smooth
		});
	},
	getPosition:function(){
		return {left: this.dom.offsetLeft, top: this.dom.offsetTop};
	},
	create:function(cfg){
	},
	focus:function(){
		if(this.dom) this.dom.focus();
		return this;
	},
	inFocus: function(){
		if(this.dom && this.dom == R.xp(window, 'document.activeElement')){
			return true;
		}
		return false;
	},
	textSelect:function(){
		if(!this.dom) return this;
		if (document.selection) {
			var range = document.body.createTextRange();
			range.moveToElementText(this.dom);
			range.select();
		} else if (window.getSelection) {
			var range = document.createRange();
			range.selectNode(this.dom);
			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);
		};
		return this;
	},
	blur:function(){
	},
	onWheel:function(event){
		event.preventDefault();
		
		//event.deltaY 
	},
	getRegion : function(){
		return Resolute.Element.Region.getRegion(this.dom);
	},
	isScrollable : function(){
		var dom = this.dom;
		return dom.scrollHeight > dom.clientHeight || dom.scrollWidth > dom.clientWidth;
	},
	scrollTo : function(side, value){
		this.dom["scroll" + (/top/i.test(side) ? "Top" : "Left")] = value;
		return this;
	},
	getScroll : function(){
		var d = this.dom, 
			doc = document,
			body = doc.body,
			l,
			t,
			ret;

		if(d == doc || d == body){
			l = window.pageXOffset;
			t = window.pageYOffset;
			ret = {left: l || (body ? body.scrollLeft : 0), top: t || (body ? body.scrollTop : 0)};
		}else{
			ret = {left: d.scrollLeft, top: d.scrollTop};
		}
		return ret;
	},
	getStyle:function(st,defaultValue){
		if(!this.dom) return null;
		var v = this.dom.style[st] 
		return (Resolute.isEmpty(v))?((Resolute.isDefined(defaultValue))?defaultValue:''):v;
	},
	getComputedStyle:function(st,defaultValue){
		if(!this.dom) return null;
		var s = window.getComputedStyle(this.dom);
		var v = s[st];
		var cv = (Resolute.isEmpty(v))?((Resolute.isDefined(defaultValue))?defaultValue:''):v;
		if(Resolute.isString(cv)){
			var r = new RegExp('[-0-9]{1,8}px', 'gm');
			if(r.test(cv)){
				cv = parseInt(cv);
			}
		};
		return cv;
	},
	setStyle:function(st,val){
		if(!this.dom) return null;
		this.dom.style[st] = val;
		return this;
	},
	applyStyles:function(prop){
		if(!this.dom) return this;
		if(!prop) return this;
		var tmp, style;
		Resolute.each(prop,function(value,key){
			this.dom.style[chkCache(key)] = value;
		},this);
		return this;
	},
	getAnchorXY : function(anchor, local, size){
		anchor = (anchor || 'tl').toLowerCase();
		size = size || {};
		var vp = this.dom == document.body || this.dom == document,
			w = size.width || vp ? Resolute.getViewWidth() : this.getWidth(),
			h = size.height || vp ? Resolute.getViewHeight() : this.getHeight(),
			xy,
			r = Math.round,
			o = this.getRect(),
			scroll = this.getScroll(),
			extraX = vp ? scroll.left : !local ? o.x : 0,
			extraY = vp ? scroll.top : !local ? o.y : 0,
			hash = {
				c  : [r(w * 0.5), r(h * 0.5)],
				t  : [r(w * 0.5), 0],
				l  : [0, r(h * 0.5)],
				r  : [w, r(h * 0.5)],
				b  : [r(w * 0.5), h],
				tl : [0, 0],
				bl : [0, h],
				br : [w, h],
				tr : [w, 0]
			};
		xy = hash[anchor];
		return [xy[0] + extraX, xy[1] + extraY]; 
	},
	getAlignToXY: function (el, p, offsets) {
		el = Resolute.get(el);

		if (!el || !el.dom) {
			throw "Element.alignToXY with an element that doesn't exist";
		}

		offsets = offsets || [0, 0];
		p = (!p || p == "?" ? "tl-bl?" : (!(/-/).test(p) && p !== "" ? "tl-" + p : p || "tl-bl")).toLowerCase();

		var me = this,
		d = me.dom,
		a1,
		a2,
		x,
		y,
		//constrain the aligned el to viewport if necessary
		w,
		h,
		r,
		dw = Resolute.getViewWidth() - 10, // 10px of margin for ie
		dh = Resolute.getViewHeight() - 10, // 10px of margin for ie
		p1y,
		p1x,
		p2y,
		p2x,
		swapY,
		swapX,
		doc = document,
		docElement = doc.documentElement,
		docBody = doc.body,
		scrollX = (docElement.scrollLeft || docBody.scrollLeft || 0) + 5,
		scrollY = (docElement.scrollTop || docBody.scrollTop || 0) + 5,
		c = false, //constrain to viewport
		p1 = "",
		p2 = "",
		m = p.match(/^([a-z]+)-([a-z]+)(\?)?$/);

		if (!m) {
			throw "Element.alignTo with an invalid alignment " + p;
		}

		p1 = m[1];
		p2 = m[2];
		c = !!m[3];

		//Subtract the aligned el's internal xy from the target's offset xy
		//plus custom offset to get the aligned el's new offset xy
		a1 = me.getAnchorXY(p1, true);
		a2 = el.getAnchorXY(p2, false);

		x = a2[0] - a1[0] + offsets[0];
		y = a2[1] - a1[1] + offsets[1];

		if (c) {
			w = me.getWidth();
			h = me.getHeight();
			r = el.getRegion();
			//If we are at a viewport boundary and the aligned el is anchored on a target border that is
			//perpendicular to the vp border, allow the aligned el to slide on that border,
			//otherwise swap the aligned el to the opposite border of the target.
			p1y = p1.charAt(0);
			p1x = p1.charAt(p1.length - 1);
			p2y = p2.charAt(0);
			p2x = p2.charAt(p2.length - 1);
			swapY = ((p1y == "t" && p2y == "b") || (p1y == "b" && p2y == "t"));
			swapX = ((p1x == "r" && p2x == "l") || (p1x == "l" && p2x == "r"));

			if (x + w > dw + scrollX) {
				x = swapX ? r.left - w : dw + scrollX - w;
			}
			if (x < scrollX) {
				x = swapX ? r.right : scrollX;
			}
			if (y + h > dh + scrollY) {
				y = swapY ? r.top - h : dh + scrollY - h;
			}
			if (y < scrollY) {
				y = swapY ? r.bottom : scrollY;
			}
		}
		
		return [x, y];
	},
	alignTo:function(el, position, offsets, animate){
		return this.setXY(this.getAlignToXY(el, position, offsets));
	},
	setXY:function(xy){
		this.setRect({top:xy[1],left:xy[0]});
	},
	center:function(centerIn){
		return this.alignTo(centerIn || Resolute.getBody(), 'c-c');
	},
	anchorTo:function(el, alignment, offsets, animate, monitorScroll, callback){
		var me = this,
			dom = me.dom,
			scroll = !Resolute.isEmpty(monitorScroll),
			action = function(){
				Resolute.get(dom).alignTo(el, alignment, offsets, animate);
				if(callback) callback.apply(Resolute.get(dom),[]);
			},
			anchor = this.getAnchor();

		this.removeAnchor();
		this.data('_anchor', {
			fn: action,
			scroll: scroll
		});

		Ext.EventManager.onWindowResize(action, null);
		
		if(scroll){
			Ext.EventManager.on(window, 'scroll', action, null,
				{buffer: !isNaN(monitorScroll) ? monitorScroll : 50});
		}
		action.call(me);
		return me;
	},
	removeAnchor:function(){
		var me = this,
			anchor = this.getAnchor();
			
		if(anchor && anchor.fn){
			Ext.EventManager.removeResizeListener(anchor.fn);
			if(anchor.scroll){
				Ext.EventManager.un(window, 'scroll', anchor.fn);
			}
			delete anchor.fn;
		}
		return me;
	},
	getAnchor:function(){
		if(!this.dom) return;
		var anchor = this.data('_anchor');
		if(!anchor) anchor = this.data('_anchor',{});
		return anchor;
	},
	getScrollParent:function(){
		if (!this.dom) return null;
		if (this.dom.scrollHeight > this.dom.clientHeight && !(this.dom.style.overflow && this.dom.style.overflow == 'hidden')) {
			return this;
		} else {
			var p =  this.parent();
			if(!p) return null;
			return p.getScrollParent();
		}
	},
	mask:function(opt){
		if(!this.dom){
			return this;
		};
		if(this.data('masked')){
			this.unmask();
		};
		var options = opt||{};
		var icon = (options.icon===true)?'autorenew':options.icon;
		var markup = {
			cls:'resolute-mask center grid'
		};
		if(options.cls){
			markup.cls += ' '+options.cls;
		};
		if(options.message){
			markup.cn = {
				cls:'resolute-mask-message grid has-icon',
				cn:[
					{cls:'icon material-icons column-1',cn:icon},
					{cls:'message mx-8 column-2',cn:options.message}
				]
			};
		};
		if(options.animate){
			if(Resolute.isString(options.animate)){
				markup.cn.cn[0].cls += ' '+options.animate;
			} else {
				markup.cn.cn[0].cls += ' rotate-center';
			}
		}
		
		this.dom.insertAdjacentHTML('beforeend',Resolute.jsml.parse(markup));
		this.data('maskEl',this.dom.lastChild);
		this.data('masked',true);
		this.addClass('resolute-masked');
		this.callPlugins('mask');
		return this;
	},
	unmask:function(){
		if(!this.data('masked')){
			return this;
		};
		var mel = this.data('maskEl');
		if(mel) Resolute.get(mel).remove();
		this.data('maskEl',null);
		this.data('masked',false);
		this.removeClass('resolute-masked');
		this.callPlugins('unmask');
		return this;
	},
	getMask:function(){
		if(this.data('masked')){
			var mel = this.data('maskEl');
			if(mel) return Resolute.get(mel);
		};
		return null;
	},
	isMasked:function(){
		return this.data('masked')==true;
	},
	child:function(){
		if(!this.dom || this.dom.hasChildNodes()){
			return new Resolute.Element(this.dom.firstChild);
		};
	},
	isText:function(){
		if(this.dom && this.dom.nodeType == 3){
			return true;
		};
		return false;
	},
	isComment:function(){
		if(this.dom && this.dom.nodeType == 8){
			return true;
		};
		return false;
	},
	isElement:function(){
		if(this.dom && this.dom.nodeType == 1){
			return true;
		};
		return false;
	},
	on:function(event,fn,scope){
		this.addListener(event,fn,scope);
		return this;
	},
	un:function(event,fn,scope){
		this.removeListener(event,fn,scope);
		return this;
	},
	getRect:function(){
		if(!this.dom){
			return null;
		};
		var rc = this.dom.getClientRects();
		if(rc.length>0){
			return {
				x:rc[0].x,
				y:rc[0].y,
				top:rc[0].top,
				right:rc[0].right,
				left:rc[0].left,
				bottom:rc[0].bottom,
				width:rc[0].width,
				height:rc[0].height
			};
		} else {
			return null;
		}
	},
	setRect:function(rect){
		if(!this.dom) return null;
		if(!rect) return null;
		if(rect.width) this.setWidth(rect.width);
		if(rect.height) this.setHeight(rect.height);
		if(rect.top) this.setTop(rect.top);
		if(rect.left) this.setLeft(rect.left);
		if(rect.right) this.setRight(rect.right);
		if(rect.bottom) this.setBottom(rect.bottom);
		return this;
	},
	isHidden:function(){
		if(!this.dom) return true;
		var d = this.getComputedStyle('display');
		return (d=='none')?true:false;
	},
	isVisibleInScroll:function(){
		var elr = this.dom.getBoundingClientRect(),
			bottom = elr.bottom,
			height = elr.height,
			top = elr.top,
			container = this.getScrollContainer();
		if(!container) return true;
		var containerRect = container.dom.getBoundingClientRect();
		return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
	},
	inset:function(cfg){
		if(Resolute.isDefined(cfg.top)) this.setTop(cfg.top);
		if(Resolute.isDefined(cfg.bottom)) this.setBottom(cfg.bottom);
		if(Resolute.isDefined(cfg.left)) this.setLeft(cfg.left);
		if(Resolute.isDefined(cfg.right)) this.setRight(cfg.right);
		return this;
	},
	setWidth:function(w){
		if(!this.dom) return null;
		if(Resolute.isNumber(w)){
			w += 'px';
		};
		if(w==null){
			delete this.dom.style.width;
		} else {
			this.dom.style.width = w;
		};
		return this;
	},
	setHeight:function(h){
		if(!this.dom) return null;
		if(Resolute.isNumber(h)){
			h += 'px';
		};
		if(h==null){
			delete this.dom.style.height;
		} else {
			this.dom.style.height = h;
		};
		return this;
	},
	setLeft:function(v){
		if(!this.dom) return null;
		if(v == null) delete this.dom.style.left;
		this.dom.style.left = (Resolute.isNumber(v))?(v+'px'):v;
		return this;
	},
	setTop:function(v){
		if(!this.dom) return null;
		if(v == null) delete this.dom.style.top;
		this.dom.style.top = (Resolute.isNumber(v))?(v+'px'):v;
		return this;
	},
	setRight:function(v){
		if(!this.dom) return null;
		if(v == null) delete this.dom.style.right;
		this.dom.style.right = (Resolute.isNumber(v))?(v+'px'):v;
		return this;
	},
	setBottom:function(v){
		if(!this.dom) return null;
		if(v == null) delete this.dom.style.bottom;
		this.dom.style.bottom = (Resolute.isNumber(v))?(v+'px'):v;
		return this;
	},
	setPosition:function(pos){
		this.dom.style.position = pos || 'relative';
		return this;
	},
	isStyle:function(style,value){
		return this.getStyle(style) == value;
	},
	getWidth:function(checkVisible){
		var r = this.getRect();
		if(r){
			if(checkVisible===true && this.getComputedStyle('display') == 'none') return 0;
			return r.width;
		};
		return 0;
	},
	getHeight:function(checkVisible){
		var r = this.getRect();
		if(r){
			if(checkVisible===true && this.getComputedStyle('display') == 'none') return 0;
			return r.height;
		};
		return 0;
	},
	getSize:function(contentSize){
		return {width: this.getWidth(contentSize), height: this.getHeight(contentSize)};
	},
	getValue:function(asNumber){
		var val = this.dom.value;
		return asNumber ? parseInt(val, 10) : val;
	},
	onResize:function(elements){
		if(this.resizeListener && elements){
			if(elements.length>0){
				this.resizeListener.call(this.resizeListenerScope,this,elements[0].contentRect.toJSON());
			}
		}
	},
	addListener:function(eventName, fn, scope, options){
		if(eventName=='resize'){
			Resolute.Element.ResizeObserver.add(this,fn,scope,options);
			return this;
		};
		Resolute.EventManager.on(this.dom,  eventName, fn, scope || this, options);
		return this;
	},
	removeListener:function(eventName, fn, scope){
		if(eventName == 'resize'){
			Resolute.Element.ResizeObserver.remove(this);
		};
		Resolute.EventManager.removeListener(this.dom,  eventName, fn, scope || this);
		return this;
	},
	removeAllListeners:function(){
		Resolute.Element.ResizeObserver.remove(this);
		Resolute.EventManager.removeAll(this.dom);
		return this;
	},
	purgeAllListeners:function() {
		Resolute.Element.ResizeObserver.remove(this);
		Resolute.EventManager.purgeElement(this, true);
		return this;
	},
	animateByClass:function(cls,callback,scope,defer){
		this.addClass(cls);
		if(callback){
			if(defer){
				(function(){callback.call(scope||this,[this])}).createDelegate(scope||this).defer(defer);
			} else {
				callback.call(scope||this,[this]);
			};
		}
	},
	animate:function(cfg,callback,scope){
		this.animation = Resolute.Element.Animations.reg(cfg);
		this.removeClass()
		if(this.animation){
			this.addClass(this.animation.name);
			this.animation.running = true;
			var self = this;
			(function(){
				if(!self.animation) return;
				self.removeAnimation(self.animation.autoRemoveClass||false);
				if(callback) callback.call(scope||self,[self]);
			}).createDelegate(scope||self).defer(this.animation.duration*1000+5);
		};
	},
	removeAnimation:function(removeClass){
		if(removeClass){
			this.removeClass(this.animation.name);
		}
		this.animation.running = false;
		Resolute.Element.Animations.remove(this.animation);
		delete this.animation;
	},
	nextSibling:function(){
		// Следующий элемент
		if(!this.dom) return null;
		if(!this.dom.nextSibling) return null;
		return Resolute.get(this.dom.nextSibling.id);
	},
	prevSibling:function(){
		// Предыдущий элемент
		if(!this.dom) return null;
		if(!this.dom.previousSibling) return null;
		return Resolute.get(this.dom.previousSibling.id);
	},
	replaceWith:function(el){
		// Заменить текущий элемент переданным элементом
		if(!this.dom) return this;
		var newEl = Resolute.get(el);
		if(!newEl || !newEl.dom) return this;
		this.dom.replaceWith(newEl.dom);
		return this;
	},
	clear:function(){
		// Удаление мусора в разметке (мусор в основном образуется при вставке текста из Word в редактируемый div)
		if(!this.dom) return;
		var toDelete = [];
		var elementPath = [this.dom];
		while(elementPath.length > 0) {
			var el = elementPath.pop();
			for(var i = 0; i < el.childNodes.length; i++) {
				var node = el.childNodes[i];
				if (node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
					toDelete.push(node);
				} else {
					elementPath.push(node);
					if(node.nodeType === 3){
						continue;
					};
					if(node.removeAttribute){
						node.removeAttribute('id');
						node.removeAttribute('lang');
						node.removeAttribute('name');
						node.removeAttribute('class');
					};
					var st = node.getAttribute('style');
					if(st){
						var sts = st.replace('\n','').replace(' mso-','mso-').split(';');
						var stss = [];
						Resolute.each(sts,function(stl){
							if(!stl.startsWith('mso-')){
								stss.push(stl);
							}
						});
						if(stss.length==0){
							node.removeAttribute('style');
						} else {
							node.setAttribute('style',stss.join(';'));
						};
					};
					if(node.isTextContent()){
						node.innerHTML = node.textContent;
					};
					if(node.childNodes.length === 0){
						toDelete.push(node);
					};
				}
			}
		};
		Resolute.each(toDelete,function(item){
			item.parentNode.removeChild(item) 
		});
	},
	tooltip:function(tip){
		// Установка или сброс тултипа
		if(!tip){
			this.removeAttribute('data-tooltip');
		} else {
			this.setAttribute('data-tooltip',tip);
		};
		return this;
	},
	getScrollContainer:function(){
		var elm = this;
		while(elm) {
			ov = elm.getComputedStyle('overflow');
			if(ov && ov == 'auto'){
				return elm;
			};
			elm = elm.parent();
			if(elm.dom.tagName == 'BODY') elm = null;
		};
		return null;
	},
	getZ:function(){
		// Получение эффективного z-index элемента
		var elementZIndex,
			z,
			elm = this,
			zindex = 0;
		while(elm) {
			z = elm.getComputedStyle('z-index');
			if(z && z != 'auto'){
				elementZIndex = parseInt(z);
				if(elementZIndex > zindex) {
					zindex = elementZIndex;
				}
			};
			elm = elm.parent();
		};
		return zindex;
	},
	setResize:function(state, opts){
		// Включение/выключение возможности изменения размера
		if(!this.plugins['Resize']){
			if(state){
				this.plugin('Resize',opts);
			}
		} else {
			if(state){
				if(!this.plugins['Resize'].isResizeInit){
					this.plugins['Resize'].init();
				} else {
					this.plugins['Resize'].remove();
					this.plugin('Resize',opts);
				}
			} else {
				if(this.plugins['Resize'].isResizeInit){
					this.plugins['Resize'].remove();
				}
			}
		}
	}
};

// Глобальный объект для подписки на изменения размеров элементов
Resolute.Element.ResizeObserver = {
	instance:null,
	pool:{},
	init:function(){
		Resolute.Element.ResizeObserver.instance = new ResizeObserver(Resolute.Element.ResizeObserver.onResize);
	},
	add:function(el,fn,scope){
		if(!el || !el.dom) return;
		if(!el.id) el.setId();
		var id = el.getId();
		if(!Resolute.Element.ResizeObserver.pool[id]){
			Resolute.Element.ResizeObserver.pool[id] = {
				id:id,
				listeners:[]
			}
		};
		Resolute.Element.ResizeObserver.pool[id].listeners.push({fn:fn,scope:scope});
		Resolute.Element.ResizeObserver.instance.observe(el.dom);
	},
	remove:function(el){
		if(!el || !el.dom) return;
		Resolute.Element.ResizeObserver.instance.unobserve(el.dom);
	},
	onResize:function(elements){
		for(var element of elements){
			if(Resolute.Element.ResizeObserver.pool[element.id]){
				Resolute.each(Resolute.Element.ResizeObserver.pool[element.id].listeners,function(listener){
					listener.fn.call(listener.scope,Resolute.get(element.id),elements[0].contentRect.toJSON());
				})
			}
		}
	}
};
Resolute.Element.ResizeObserver.init();

Resolute.Element.Animations = {
	cache:{},
	reg:function(cfg){
		if(!cfg.name) cfg.name = 'anim-'+Resolute.code(true);
		var styleSheet = null;
		if(!Resolute.CSS.hasStyleSheet('ResoluteAnimations')){
			styleSheet = Resolute.CSS.create('','ResoluteAnimations');
		} else {
			styleSheet = Resolute.CSS.getStyleSheet('ResoluteAnimations');
		};
		if(!styleSheet) return null;
		if(Resolute.Element.Animations.has(cfg)){
			Resolute.Element.Animations.remove(cfg);
		};
		var ruleCfg = {
			animationName:cfg.name,
			animationDuration:cfg.duration+'s',
			animationFillMode:'both',
			animationIterationCount:1
		};
		if(cfg.delay) ruleCfg.animationDelay = cfg.delay;
		if(cfg.fn) ruleCfg.animationTimingFunction = cfg.fn;
		if(cfg.count) ruleCfg.animationIterationCount = cfg.count;
		if(cfg.dir) ruleCfg.animationDirection = cfg.dir;
		
		var cssText = Resolute.CSS.rule2text('.'+cfg.name,ruleCfg);
		styleSheet.insertRule(cssText);
		var keyFrames = [];
		for(var key in cfg){
			if(['name','duration','delay','fn','count','dir'].present(key)) continue;
			if(cfg.hasOwnProperty(key)){
				if(Resolute.isArray(cfg[key])){
					for(var i=0;i<cfg[key].length;i++){
						if(!keyFrames[i]) keyFrames[i] = {};
						keyFrames[i][key] = cfg[key][i];
					};
				};
			};
		};
		cssText = '@keyframes '+cfg.name+'{';
		for(var i=0;i<keyFrames.length;i++){
			var perc = Math.ceil((i/(keyFrames.length-1))*100);
			cssText += Resolute.CSS.rule2text(perc+'%',keyFrames[i]);
		};
		cssText += '}';
		styleSheet.insertRule(cssText);
		Resolute.Element.Animations.cache[cfg.name] = cfg;
		return cfg;
	},
	has:function(cfg){
		var name = (Resolute.isString(cfg))?cfg:cfg.name;
		var styleSheet = Resolute.CSS.getStyleSheet('ResoluteAnimations');
		for(var i=0;i<styleSheet.rules.length;i++){
			var rname = (styleSheet.rules[i].selectorText)?styleSheet.rules[i].selectorText.right('.'):((styleSheet.rules[i].name)?styleSheet.rules[i].name:null);
			if(rname === name){
				return true;
			}
		};
		return false;
	},
	remove:function(cfg){
		var name = (Resolute.isString(cfg))?cfg:cfg.name;
		var styleSheet = Resolute.CSS.getStyleSheet('ResoluteAnimations');
		for(var i=0;i<styleSheet.rules.length;i++){
			var rname = (styleSheet.rules[i].selectorText)?styleSheet.rules[i].selectorText.right('.'):((styleSheet.rules[i].name)?styleSheet.rules[i].name:null);
			if(rname === name){
				styleSheet.deleteRule(i);
				delete Resolute.Element.Animations.cache[name];
			}
		}
	}
};

Resolute.Element.get = function(el){
	var ex,
		elm,
		id;
	if(!el){ return null; }
	if (typeof el == "string") { // element id
		if (!(elm = document.getElementById(el))) {
			return null;
		}
		if (Resolute.cache.items.elements[el] && Resolute.cache.items.elements[el].el) {
			ex = Resolute.cache.items.elements[el].el;
			ex.dom = elm;
		} else {
			ex = Resolute.Element.addToCache(new Resolute.Element(elm));
		}
		return ex;
	} else if (el.tagName) {
		if(!(id = el.id)){
			id = Resolute.id(el);
		}
		if (Resolute.cache.items.elements[id] && Resolute.cache.items.elements[id].el) {
			ex = Resolute.cache.items.elements[id].el;
			ex.dom = el;
		} else {
			ex = Resolute.Element.addToCache(new Resolute.Element(el));
		}
		return ex;
	} else if (el instanceof Resolute.Element) {
		if(el != docEl){
			el.dom = document.getElementById(el.id) || el.dom;
		}
		return el;
	} else if(el.isComposite) {
		return el;
	} else if(Resolute.isArray(el)) {
		return Resolute.Element.select(el);
	}
	return null;
};

Resolute.Element.clearing = {
	empty:function(el){
		if(el && el.dom && el.exist()){
			var cnt = el.dom.textContent;
		}
	}
}

Resolute.Element.Region = function(t, r, b, l) {
	var me = this;
	me.top = t;
	me[1] = t;
	me.right = r;
	me.bottom = b;
	me.left = l;
	me[0] = l;
};

Resolute.Element.Region.prototype = {
	contains : function(region) {
		var me = this;
		return ( region.left >= me.left &&
				 region.right <= me.right &&
				 region.top >= me.top &&
				 region.bottom <= me.bottom );
	},
	getArea : function() {
		var me = this;
		return ( (me.bottom - me.top) * (me.right - me.left) );
	},
	intersect : function(region) {
		var me = this,
			t = Math.max(me.top, region.top),
			r = Math.min(me.right, region.right),
			b = Math.min(me.bottom, region.bottom),
			l = Math.max(me.left, region.left);

		if (b >= t && r >= l) {
			return new Resolute.Element.Region(t, r, b, l);
		}
	},
	union : function(region) {
		var me = this,
			t = Math.min(me.top, region.top),
			r = Math.max(me.right, region.right),
			b = Math.max(me.bottom, region.bottom),
			l = Math.min(me.left, region.left);

		return new Resolute.Element.Region(t, r, b, l);
	},
	constrainTo : function(r) {
		var me = this;
		me.top = me.top.constrain(r.top, r.bottom);
		me.bottom = me.bottom.constrain(r.top, r.bottom);
		me.left = me.left.constrain(r.left, r.right);
		me.right = me.right.constrain(r.left, r.right);
		return me;
	},
	adjust : function(t, l, b, r) {
		var me = this;
		me.top += t;
		me.left += l;
		me.right += r;
		me.bottom += b;
		return me;
	}
};

Resolute.Element.Region.getRegion = function(el) {
	var p = Resolute.Dom.getXY(el),
		t = p[1],
		r = p[0] + el.offsetWidth,
		b = p[1] + el.offsetHeight,
		l = p[0];

	return new Resolute.Element.Region(t, r, b, l);
};	
Resolute.Element.Point = function(x, y) {
	if (Resolute.isArray(x)) {
		y = x[1];
		x = x[0];
	}
	var me = this;
	me.x = me.right = me.left = me[0] = x;
	me.y = me.top = me.bottom = me[1] = y;
};

Resolute.Element.Point.prototype = new Resolute.Element.Region();

var flyFn = function(){};
flyFn.prototype = Resolute.Element.prototype;

Resolute.Element.Flyweight = function(dom){
	this.dom = dom;
};

Resolute.Element.Flyweight.prototype = new flyFn();
Resolute.Element.Flyweight.prototype.isFlyweight = true;
Resolute.Element._flyweights = {};
Resolute.Element.fly = function(el, named){
	var ret = null;
	named = named || '_global';

	if (el = Resolute.getDom(el)) {
		(Resolute.Element._flyweights[named] = Resolute.Element._flyweights[named] || new Resolute.Element.Flyweight()).dom = el;
		ret = Resolute.Element._flyweights[named];
	}
	return ret;
};

Resolute.fly = Resolute.Element.fly;

Resolute.Element.select = function(selector, root,dataQuery){
	var els;
	if(typeof selector == "string"){
		if(root){
			var rootEl = Resolute.get(root);
			if(rootEl && rootEl.dom){
				els = rootEl.dom.querySelectorAll(selector);
			}
		} else {
			els = document.querySelectorAll(selector);
		};
	} else if(selector.length !== undefined){
		els = selector;
	} else {
		throw "Invalid selector in Resolute.select: must be a string or an array of elements";
	};
	if(dataQuery){
		var res = [];
		for(var i=0;i<els.length;i++){
			var elem = Resolute.get(els[i]);
			if(elem){
				if(Resolute.match(elem.data(),dataQuery)){
					res.push(els[i]);
				}
			}
		};
		els = res;
	}
	return new Resolute.CompositeElement(els);
};

Resolute.select = function(selector,root,dataQuery){
	if(Resolute.isObject(selector)){
		return Resolute.Component.select(selector,root);
	} else if(Resolute.isString(selector)){
		return Resolute.Element.select(selector,root,dataQuery);
	};
	throw "Invalid selector in Resolute.select: must be a string or an object";
	return null;
};

Resolute.Element.addToCache = function(el, id){
	id = id || el.id;
	if(!id) return el;
	if(Resolute.cache.items.elements[id]) return el;
	Resolute.cache.items.elements[id] = {
		el:  el,
		data: {},
		events: {}
	};
	return el;
};

Resolute.Element.data = function(el, key, value){
	el = Resolute.get(el);
	if (!el) {
		return null;
	}
	var c = Resolute.cache.items.elements[el.id].data;
	if(arguments.length == 1){
		return c;
	}else if(arguments.length == 2){
		return c[key];
	}else{
		return (c[key] = value);
	}
};

Resolute.CompositeElement = function(els, root){
	this.elements = [];
	this.add(els, root);
};
Resolute.CompositeElement.prototype = {
	isComposite: true,
	getElement:function(el){
		var e = new Resolute.Element.Flyweight();
		e.dom = el;
		e.id = el.id;
		return e;
	},
	aggWidth:function(){
		var w = 0;
		this.each(function(el){
			w += el.getWidth();
			w += el.getComputedStyle('marginLeft',0);
			w += el.getComputedStyle('marginRight',0);
		});
		return w;
	},
	aggHeight:function(){
		var h = 0;
		this.each(function(el){
			if(el.getComputedStyle('display') != 'none'){
				h += el.getHeight();
				h += el.getComputedStyle('marginTop',0);
				h += el.getComputedStyle('marginBottom',0);
			}
		});
		return h;
	},
	transformElement:function(el){
		return Resolute.getDom(el);
	},
	getCount:function(){
		return this.elements.length;
	},
	add:function(els, root){
		var me = this,
			elements = me.elements;
		if(!els){
			return this;
		}
		if(typeof els == "string"){
			els = Resolute.Element.select(els, root);
		}else if(els.isComposite){
			els = els.elements;
		}else if(!Resolute.isIterable(els)){
			els = [els];
		}

		for(var i = 0, len = els.length; i < len; ++i){
			elements.push(me.transformElement(els[i]));
		}
		return me;
	},
	invoke:function(fn, args){
		var me = this,
			els = me.elements,
			len = els.length,
			e,
			i;

		for(i = 0; i < len; i++) {
			e = els[i];
			if(e){
				Resolute.Element.prototype[fn].apply(me.getElement(e), args);
			}
		}
		return me;
	},
	item:function(index){
		var me = this,
			el = me.elements[index],
			out = null;

		if(el){
			out = me.getElement(el);
		}
		return out;
	},
	addListener:function(eventName, handler, scope, opt){
		var els = this.elements,
			len = els.length,
			i, e;

		for(i = 0; i<len; i++) {
			e = els[i];
			if(e) {
				Resolute.EventManager.on(e, eventName, handler, scope || e, opt);
			}
		}
		return this;
	},
	each:function(fn, scope){
		var me = this,
			els = me.elements,
			len = els.length,
			i, e;

		for(i = 0; i<len; i++) {
			e = els[i];
			if(e){
				e = this.getElement(e);
				if(fn.call(scope || e, e, me, i) === false){
					break;
				}
			}
		}
		return me;
	},
	fill:function(els){
		var me = this;
		me.elements = [];
		me.add(els);
		return me;
	},
	filter:function(selector){
		var els = [],
			me = this,
			fn = Resolute.isFunction(selector) ? selector
				: function(el){
					return el.is(selector);
				};

		me.each(function(el, self, i) {
			if (fn(el, i) !== false) {
				els[els.length] = me.transformElement(el);
			}
		});
		
		me.elements = els;
		return me;
	},
	indexOf:function(el){
		return this.elements.indexOf(this.transformElement(el));
	},
	replaceElement:function(el, replacement, domReplace){
		var index = !isNaN(el) ? el : this.indexOf(el),
			d;
		if(index > -1){
			replacement = Resolute.getDom(replacement);
			if(domReplace){
				d = this.elements[index];
				d.parentNode.insertBefore(replacement, d);
				Resolute.removeNode(d);
			}
			this.elements.splice(index, 1, replacement);
		}
		return this;
	},
	clear:function(){
		this.elements = [];
	},
	addElements:function(els, root){
		if(!els){
			return this;
		}
		if(typeof els == "string"){
			els = Resolute.Element.select(els, root);
		}
		var yels = this.elements;
		Resolute.each(els, function(e) {
			yels.push(Resolute.get(e));
		});
		return this;
	},
	first:function(){
		return this.item(0);
	},
	last:function(){
		return this.item(this.getCount()-1);
	},
	contains:function(el){
		return this.indexOf(el) != -1;
	},
	removeElement:function(keys, removeDom){
		var me = this,
			els = this.elements,
			el;
		Resolute.each(keys, function(val){
			if ((el = (els[val] || els[val = me.indexOf(val)]))) {
				if(removeDom){
					if(el.dom){
						el.remove();
					}else{
						Resolute.removeNode(el);
					}
				}
				els.splice(val, 1);
			}
		});
		return this;
	}
};
Resolute.CompositeElement.importElementMethods = function() {
	var fnName,
		ElProto = Resolute.Element.prototype,
		CelProto = Resolute.CompositeElement.prototype;

	for (fnName in ElProto) {
		if (typeof ElProto[fnName] == 'function'){
			(function(fnName) {
				CelProto[fnName] = CelProto[fnName] || function() {
					return this.invoke(fnName, arguments);
				};
			}).call(CelProto, fnName);

		}
	}
};

Resolute.CompositeElement.importElementMethods();

// Сборка мусора для элементов
Resolute.garbageCollectInterval = 15000; // Интервал сборки мусора (мс). Можно переопределять по необходимости.

Resolute.garbageCollect = function(){
	if(!Resolute.enableGarbageCollector && Resolute.Element.collectorThreadId){
		clearInterval(Resolute.Element.collectorThreadId);
		Resolute.Element.collectorThreadId = null;
	} else {
		var eid,
			el,
			d,
			o,
			cnt = 0;
		for(eid in Resolute.cache.items.elements){
			o = Resolute.cache.items.elements[eid];
			if(o.skipGC || o.skipGarbageCollector){
				Resolute.EventManager.removeFromSpecialCache(o.el);
				continue;
			}
			el = o.el;
			d = el.dom;
			if(!d || !d.parentNode || (!d.offsetParent && !document.getElementById(eid))){
				if(Resolute.enableListenerCollection){
					Resolute.EventManager.removeAll(d);
				}
				delete Resolute.cache.items.elements[eid];
				cnt++;
			}
		};
		if(cnt>0){
			Resolute.log('Очистка мусора: удалено '+cnt+' объектов');
		}
	}
}
if(Resolute.enableGarbageCollector){
	Resolute.Element.collectorThreadId = setInterval(Resolute.garbageCollect, Resolute.garbageCollectInterval||15000);
};