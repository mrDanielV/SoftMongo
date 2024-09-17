Resolute.namespace('Resolute.Data');
//Resolute.get('body').append({cls:'layer rounded expanded2 resolute-blue-bg',cn:{cls:'content p-8',cn:''}})


// Объект, генерирующий события при изменении свойств (путей)
Resolute.Data.Observable = function(config){
	var cfg = config || {};
	this.data = cfg;
	this.silent = false;
	this.cmps = [];
	this.events = {
		set: new Resolute.Event(this, 'set'),
		state: new Resolute.Event(this, 'state'),
		unstate: new Resolute.Event(this, 'unstate')
	};
};
Resolute.Data.Observable.prototype = {
	getData:function(clone){
		return (clone)?Resolute.clone(this.data):this.data;
	},
	setData:function(data,silent){
		// TODO!!! Расчитать разницу между предыдущим и новым объектом и вызвать подписчиков!!!
		this.data = data;
	},
	set:function(path,value){
		if(Resolute.isObject(path)){
			for(var key in path){
				Resolute.path.set(this.data,key,path[key]);
				if(!this.silent) this.fireEvent('set',key,path[key]);
			}
		} else {
			Resolute.path.set(this.data,path,value);
			if(!this.silent) this.fireEvent('set',path,value);
		}
	},
	get:function(path,defaultValue){
		if(arguments.length == 0) return Resolute.clone(this.data);
		return Resolute.path.get(this.data,path,defaultValue);
	},
	unset:function(path){
		if(Resolute.isObject(path)){
			for(var key in path){
				Resolute.path.unset(this.data,key);
				if(!this.silent) this.fireEvent('set',key,null);
			} 
		} else {
			Resolute.path.unset(this.data,path);
			if(!this.silent) this.fireEvent('set',path,null);
		}
	},
	copy:function(form,to,def){
		this.set(to,this.get(from,def));
	},
	on:function(event,fn,scope,options){
		if(Resolute.isArray(event)){
			var o = event;
			var e;
			for (e in o) {
				oe = o[e];
				if (!/^(?:scope|delay|buffer|single)$/.test(e)) {
					this.on(e, oe.fn || oe, oe.scope || o.scope, oe.fn ? oe : o);
				}
			};
			return;
		};
		if(!this.events[event]) return;
		var opt = options || {};
		this.events[event].addListener(fn,scope,opt);
	},
	fireEvent:function(event,path,value){
		if(this.silent) return;
		if(!this.events[event]) return;
		var a = Array.prototype.slice.call(arguments, 0);
		a.push(this.events[event]);
		a.push(this);
		this.events[event].fire.apply(this.events[event], a);
	},
	fireAll:function(event){
		
	},
	matches:function(condition){
		return Resolute.match(this.data,condition);
	},
	state:function(path,state){
		this.event('state',path,state);
	},
	unstate:function(path,state){
		this.event('unstate',path,state);
	},
	event:function(event,path,state){
		if(this.silent) return;
		if(Resolute.isObject(path)){
			Resolute.each(path,function(s,p){
				this.fireEvent(event,p,s);
			},this);
		} else {
			this.fireEvent(event,path,state);
		}
	},
	attach:function(path,cmp){
		// Привязка компонента к пути (храним только id компонентов)
		if(!this.hasComponent(path,cmp)){
			this.cmps.push({path:path,id:cmp});
		};
	},
	detach:function(path,cmp){
		// Отвязка компонента
		var ind = this.hasComponent(path,cmp,true);
		if(ind>=0){
			this.cmps.splice(ind,1);
		};
	},
	hasComponent:function(path,cmp,index){
		var res = false, ind = -1;
		Resolute.each(this.cmps,function(c,i){
			if(c.path == path && c.id == cmp){
				res = true;
				ind = i;
			}
		},this);
		return (index)?ind:res;
	},
	components:function(path){
		var res = [];
		Resolute.each(this.cmps,function(c,i){
			if(c.path){
				if(Resolute.path.matches(path,c.path)){
					res.push(Resolute.getCmp(c.id));
				}
			}
		},this);
		return res;
	}
};

Resolute.observe = function(data){
	return new Resolute.Data.Observable(data);
};
RData = Resolute.observe;



/* var d = {d:0,s:4};
this.data = d.data();

this.data.on('set','content.policyHolder.firstName',function(){},this);

this.data.set('content.policyHolder',this.data.get('content.insuredPerson'))
 */
// Коллекции объектов

// Атомарная запись в коллекции
Resolute.Data.Record = function(cfg,options,collection,index){
	this.code = cfg.code;
	this.dirty = false;
	this.data = cfg;
	this.deleted = false;
	if(!this.code){
		this.code = Resolute.uuid();
		this.data.code = this.code;
	};
	if(collection){
		this.collection = collection;
		this.index = index || 0;
	};
	Resolute.Data.Record.superclass.constructor.call(this);
};
Resolute.extend(Resolute.Data.Record,Resolute.Observable,{
	get:function(path,def){
		return Resolute.path.get(this.data,path,def);
	},
	set:function(path,value,isUnset){
		var operation = (isUnset===true)?'unset':'set';
		if(Resolute.isObject(path)){
			for(var key in path){
				if(Resolute.isObject(path[key]) && !Resolute.isEmpty(path[key].$inc)){
					var originalValue = Resolute.path.get(this.data,key);
					path[key] = originalValue+path[key].$inc;
					Resolute.path[operation](this.data,key,path[key]);
					this.fireEvent(operation,{path:key,value:path[key]},this);
				} else {
					Resolute.path[operation](this.data,key,path[key]);
					this.fireEvent(operation,{path:key,value:path[key]},this);
				};
				//Resolute.path[operation](this.data,key,path[key]);
				if(this.collection){
					this.collection.fireEvent('update',{
						path:key,
						value:path[key],
						record:this,
						index:this.index
					});
				};
				this.dirty = true;
			}
		} else {
			if(Resolute.isObject(value) && !Resolute.isEmpty(value.$inc)){
				var originalValue = Resolute.path.get(this.data,path);
				value == originalValue+value.$inc;
				Resolute.path[operation](this.data,path,value);
				this.fireEvent(operation,{path:path,value:value},this);
			} else {
				Resolute.path[operation](this.data,path,value);
				this.fireEvent(operation,{path:path,value:value},this);
			};
			if(this.collection){
				this.collection.fireEvent('update',{
					path:path,
					value:value,
					record:this,
					index:this.index
				});
			};
			this.dirty = true;
		};
	},
	unset:function(path,value){
		this.set(path,value,true);
	},
	remove:function(){
		if(this.collection && this.index!=null){
			var rec = this.collection.items[this.index];
			this.collection.items.splice(this.index,1);
			this.collection.fireEvent('remove',{
				index:this.index,
				record:rec
			});
			this.deleted = true;
		};
	},
	condition:function(query){
		if(!query){
			return true;
		};
		return Resolute.match(this.data,query);
	}
});

// Результат выполнения запроса к коллекции (аналог курсора)
Resolute.Data.QueryResult = function(collection,items){
	this.collection = collection;
	this.items = items;
	this.limitAmount = this.items.length;
	this.skipAmount = 0;
};
Resolute.Data.QueryResult.prototype = {
	remove:function(){
		this.each(function(item){item.remove()},null,true);
	},
	count:function(){
		return this.items.length;
	},
	map:function(path,opt){
		var pks = this.reduce(path,true);
		if(opt && opt.collection){
			var query = opt.query || {};
			query[opt.key||'code'] = {'$in':pks};
			return this.collection.store.collection(opt.collection).find(query)
		};
		return null;
	},
	data:function(fields){
		var res = [];
		this.each(function(item){
			if(fields){
				var itm = {};
				for(var i=0;i<fields.length;i++){
					Resolute.path.set(itm,fields[i],Resolute.path.get(item,fields[i]));
				};
				res.push(itm);
			} else {
				res.push(item);
			}
		});
		return res;
	},
	convert:function(fields,data){
		var res = [];
		if(Resolute.isEmpty(fields)) return res;
		this.each(function(item){
			var itm = {};
			for(var key in fields){
				if(!fields.hasOwnProperty(key)) continue;
				if(Resolute.isString(fields[key])){
					Resolute.path.set(itm,key,Resolute.path.get(item,fields[key]));
				} else if(Resolute.isObject(fields[key])){
					if(Resolute.isDefined(fields[key]['$path'])){
						Resolute.path.set(itm,key,Resolute.path.get(item,fields[key]['$path'],fields[key]['$path'],fields[key]['$default']||null));
					};
					if(Resolute.isDefined(fields[key]['$value'])){
						Resolute.path.set(itm,key,fields[key]['$value']);
					};
					if(Resolute.isDefined(fields[key]['$data'])){
						Resolute.path.set(itm,key,Resolute.path.get(data,fields[key]['$data']));
					}
				};
			}
			res.push(itm);
		});
		return res;
	},
	reduce:function(path,uniq){
		var res = [];
		this.each(function(item){
			var val = item.get(path);
			if(uniq){
				if(res.indexOf(val)<0){
					res.push(val);
				};
			} else {
				res.push(val);
			}
		},null,true);
		return res;
	},
	each:function(fn,scope,asObject){
		var index = 0;
		for(var i=this.skipAmount;i<this.limitAmount;i++){
			if(!this.collection.items[this.items[i]]){
				continue;
			};
			var data = this.collection.items[this.items[i]];//(asObject)?:this.collection.items[this.items[i]].data;
			if((this.collection instanceof Resolute.Data.TreeCollection) && this.collection.hideRoot && data.code == 'root'){
				continue;
			};
			fn.call(scope||this,(asObject)?data:data.data,this.collection,this,index);
			index++;
		}
	},
	at:function(index,asObject){
		if(index<0 || index>=this.items.length){
			return null;
		};
		if(this.collection.items[this.items[index]]){
			return (asObject)?this.collection.items[this.items[index]]:this.collection.items[this.items[index]].data
		};
		return null;
	},
	first:function(asObject){
		if(this.collection.items[this.items[0]]){
			return (asObject)?this.collection.items[this.items[0]]:this.collection.items[this.items[0]].data
		};
		return null;
	},
	last:function(asObject){
		if(this.collection.items[this.items[this.limit]]){
			return (asObject)?this.collection.items[this.items[this.limit]]:this.collection.items[this.items[this.limit]].data
		};
		return null;
	},
	sort:function(field,d){
		var self = this;
		var dir = (Resolute.isDefined(d))?d:1;
		var path = field;
		if(!field) field = {code:1};
		if(Resolute.isObject(field)){
			Resolute.each(field,function(sd,sp){
				dir = sd;
				path = sp;
			})
		};
		this.items.sort(function(a,b){
			if(self.collection.items[a].get(path)<self.collection.items[b].get(path)){
				return -1*dir
			} else {
				return 1*dir;
			}
		});
		return this
	},
	limit:function(limit){
		this.limitAmount = (limit)?limit:this.items.length;
		return this;
	},
	skip:function(skip){
		this.skipAmount = (skip)?skip:0;
		return this;
	}
};

// Запрос данных с сервера (разработчикам не нужна! использутся внутри Resolute.Data)
Resolute.Data.Request = function(config){
	this.connection = new Resolute.Connection();
	this.maskEl = null;
	this.scope = null;
	this.onSuccess = Resolute.emptyFn;
	this.onFailure = Resolute.emptyFn;
};
Resolute.Data.Request.prototype = {
	scope:function(s){
		// Установить скоуп для событий
		this.scope = s;
		return this;
	},
	success:function(fn){
		// Установить обработчик успешного запроса 
		this.onSuccess = fn;
		return this;
	},
	failure:function(fn){
		// Установить обработчик ошибки запроса
		this.onFailure = fn;
		return this;
	},
	wait:function(fn){
		// Функция на время ожидания ответа (??? нужна ли)
		return this;
	},
	mask:function(element){
		// Указать элемент для маскирования во время выполнения запроса (маска будет снята автоматически)
		if(Resolute.isString(element)){
			this.maskEl = element;
		} else if(element instanceof Resolute.Element){
			this.maskEl = element.id;
		};
		return this;
	}
};


// Коллекция объектов
Resolute.Data.Collection = function(config){
	var cfg = config || {};
	this.items = [];
	this.codeType = (cfg.codeType=='uuid')?'uuid':'number'; // number| uuid
	this.code = null;
	this.queryItems = [];
	if(cfg.store){
		this.store = cfg.store;
	};
	this.listeners = [];
	if(cfg.listeners){
		this.on(cfg.listeners);
	};
	this.indexes = {};
	if(cfg.items){
		Resolute.each(cfg.items,function(item){
			this.add(item);
		},this);
	};
	//this.lastSync = Date.create().getTime();
};
Resolute.Data.Collection.prototype = {
	createIndex:function(field){
		this.indexes[field] = {};
		for(var i=0;i<this.items.length;i++){
			this.indexes[field][this.items[i].get(field)] = i;
		};
		// To do: nullable
	},
	hasIndex:function(field){
		return (this.indexes && this.indexes[field]);
	},
	removeIndex:function(field){
		if(this.hasIndex(field)){
			this.index[field] = null;
		}
	},
	add:function(cfg){
		var code = (this.codeType=='uuid')?Resolute.uuid():Resolute.code();
		var index = this.items.length;
		if(cfg.code){
			code = cfg.code;
		};
		cfg.code = code;
		this.items.push(new Resolute.Data.Record(cfg,null,this,index));
		//this.items[index].on('set',this.onRecordChange,this);//function(opt,record){console.log(record)});
		if(this.hasIndex('code')){
			this.indexes['code'][this.items[index].get('code')] = index;
		};
		this.fireEvent('add',{
			record:this.items[index],
			index:index
		});
		return this.items[index];
	},
	insert:function(cfg){
		this.add(cfg);
	},
	setData: function(items) {
		this.items = [];
		this.indexes = {};

		if(isEmpty(items)) {
			items = [];
		}
		if(items && !isArray(items)) {
			items = [items];
		}

		R.each(items, function(item){
			this.add(item);
		}, this);
	},
	save: function(cfg) {
		var code = R.xp(cfg, 'code');
		if(this.exists(code)) {
			this.update({code: code}, cfg);
		}else{
			this.add(cfg);
		}
	},
	setCode:function(code){
		this.code = code;
	},
	exists:function(code){
		for(var i=0;i<this.items.length;i++){
			if(!this.items[i]){
				continue;
			};
			if(this.items[i].code==code){
				return true;
			};
		};
		return false;
	},
	distinct:function(path,query){
		return this.find(query).reduce(path,true);
	},
	aggregate:function(pipeline){
		// TODO
	},
	find:function(query){
		this.queryItems = [];
		for(var i=0;i<this.items.length;i++){
			if(!this.items[i]){
				continue;
			};
			if(Resolute.match(this.items[i].data,query)){
				this.queryItems.push(i);
			};
		};
		return new Resolute.Data.QueryResult(this,this.queryItems);
	},
	findOne:function(query,dataOnly){
		for(var i=0;i<this.items.length;i++){
			if(!this.items[i]){
				continue;
			};
			if(Resolute.match(this.items[i].data,query)){
				return (dataOnly)?this.items[i]:this.items[i].data;
			};
		};
		return null;
	},
	each:function(fn,scope){
		for(var i=0;i<this.items.length;i++){
			if(!this.items[i]){
				continue;
			};
			fn.call(scope||this,this.items[i],this,i);
		};
	},
	update:function(query,set){
		var items = this.find(query);
		items.each(function(item,index){
			// silent!!!
			if(set['$set']){
				item.set(set['$set']);
			} else if(set['$unset']){
				item.unset(set['$unset']);
			} else {
				item.set(set);
			};
			/* console.log('collection update');
			this.fireEvent('update',{
				record:item,
				index:index
			}); */
		},this,true);
	},
	get:function(code){
		if(this.indexes && this.hasIndex){
			if(this.hasIndex('code')){
				var i = this.indexes[field][value];
				return this.items[i];
			}
		};
		return this.getByField('code',code);
	},
	getData:function(code,clearInternal){
		if(!code){
			var res = [];
			this.each(function(rec){
				res.push(this.clearInternalFields(rec.data));
			},this);
			return res;
		} else {
			var d = this.get(code);
			return (d)?this.clearInternalFields(d.data):null;
		}
	},
	clearInternalFields:function(rec){
		if(Resolute.isObject(rec)){
			var data = Resolute.clone(rec);
			Resolute.each(data,function(val,key,obj){
				if(key.startsWith('_')){
					delete obj[key];
				}
			},this);
			return data;
		};
		return rec;
	},
	getByIndex:function(index){
		return (this.items[index])?this.items[index]:null;
	},
	getByField:function(field,value){
		for(var i=0;i<this.items.length;i++){
			if(!this.items[i]){
				continue;
			};
			if(this.items[i].get(field)==value){
				return this.items[i];
			};
		};
		return null;
	},
	remove:function(query){
		this.find(query).remove();
	},
	clear:function(){
		for(var i=0;i<this.items.length;i++){
			delete this.items[i];
		};
		delete this.items[i];
		this.items = [];
		this.fireEvent('clear',{collection:this});
	},
	count:function(query){
		if(!query){
			return this.items.length;
		} else {
			return this.find(query).count();
		}
	},
	on:function(event,listener,scope){
		if(Resolute.isObject(event)){
			for(var key in event){
				if(!event.hasOwnProperty(key)){
					continue;
				};
				this.on(key,event[key],event.scope||this);
			};
		} else {
			if(!this.hasListener(event,listener,scope)){
				this.listeners.push({
					event:event,
					fn:listener,
					scope:scope
				});
			};
		}
	},
	hasListener:function(event,listener,scope){
		for(var i=0;i<this.listeners.length;i++){
			if(this.listeners[i].event == event && this.listeners[i].fn == listener && this.listeners[i].scope == scope){
				return true;
			};
		};
		return false;
	},
	un:function(event,listener,scope){
		for(var i=0;i<this.listeners.length;i++){
			if(this.listeners[i].event == event && this.listeners[i].fn == listener && this.listeners[i].scope == scope){
				this.listeners.splice(i,1);
				return;
			};
		};
	},
	fireEvent:function(event,data){
		for(var i=0;i<this.listeners.length;i++){
			if(this.listeners[i].event == event){
				data.code = event;
				this.listeners[i].fn.call(this.listeners[i].scope||this,data);
			};
		};
	},
	request:function(config){
		
	}
};

Array.prototype.store = function(code){
	return new Resolute.Data.Collection({items:this});
}

Resolute.Data.create = function(data){
	if(!Resolute.isDefined(data)) return new Resolute.Data.Collection();
	if(Resolute.isString(data)){
		return Resolute.Store.collection(data);
	} else if(Resolute.isArray(data)){
		return new Resolute.Data.Collection({items:data});
	};
	if(!(data instanceof Resolute.Data.Collection)){
		return new Resolute.Data.Collection();
	};
};


// TODO !!! В разработке
Resolute.Data.ViewManager = function(collectionManager){
	this.store = collectionManager || Resolute.Store;
	this.items = {};
};
Resolute.Data.ViewManager.prototype = {
	create:function(cfg){
		var code = (cfg.code)?cfg.code:Resolute.uuid();
		this.items[code] = cfg;
		return code;
	},
	run:function(code){
		if(!this.items[code]) return null;
		var instance = this.store;
		if(this.items[code].items){
			for(var i=0;i<this.items[code].items.length;i++){
				var oper = this.items[code].items[i].operation;
				var params = this.items[code].items[i].params;
				if(!Resolute.isDefined(params)){
					params = [];
				};
				if(!Resolute.isArray(params)) params = [params];
				instance = instance[oper].apply(instance,params);
			}
		};
		if(Resolute.isArray(instance)){
			var tempCollection = this.store.create({
				code:'view-'+code,
				items:instance
			});
			return tempCollection
		} else {
			return instance;
		}
	},
	data:function(code,fields){
		return this.run(code).data(fields||null);
	}
};


Resolute.Data.CollectionManager = function(){
	this.items = {};
	this.externalCollections = {};
	this.view = new Resolute.Data.ViewManager(this);
};
Resolute.Data.CollectionManager.prototype = {
	create:function(collection){
		if(Resolute.isString(collection)){
			if(this.items[collection]){
				return this.items[collection];
			};
			this.items[collection] = new Resolute.Data.Collection({store:this});
			this.items[collection].setCode(collection);
			return this.items[collection];
		} else if(Resolute.isObject(collection)){
			var code = collection.code;
			var type = collection.type || 'Collection';
			if(!Resolute.Data[type]){
				type = 'Collection';
			};
			var items = collection.items||[];
			if(this.items[code]){
				// пересобрать items!!! для view
				this.items[code].clear();
				for(var i=0;i<items.length;i++){
					this.items[code].add(items[i]);
				};
				return this.items[code];
			};
			this.items[code] = new Resolute.Data[type]({store:this});
			this.items[code].setCode(code);
			this.items[code].hideRoot = collection.hideRoot || false;
			for(var i=0;i<items.length;i++){
				this.items[code].add(items[i]);
			};
			if(collection.external){
				this.externalCollections[code] = collection.external;
				this.syncCollection(code);
			};
			if(type == 'TreeCollection' && items.length>0){
				this.items[code].rebuild();
			}
			return this.items[code];
		}
	},
	link:function(){
		
	},
	unlink:function(){
		
	},
	add:function(collectionObject){
		if(!collectionObject.store){
			collectionObject.store = this;
		};
		this.items[collectionObject.code] = collectionObject;
	},
	collections:function(){
		var res = [];
		for(var code in this.items){
			res.push(code);
		};
		return res;
	},
	collection:function(code){
		if(!this.items[code]){
			this.create(code);
		};
		return this.items[code];
	},
	has:function(code){
		return (this.items[code])?true:false;
	},
	select:function(code){
		return this.collection(code);
	},
	sync2:function(){
		/* var params = {register:[]};
		for(var key in this.externalCollections){
			params.register.push({
				code: this.externalCollections[key].register,
				alias: key,
				query:(this.externalCollections[key].query)?this.externalCollections[key].query:null
			});
			this.select(key).fireEvent('beforeLoad',{collection:this.externalCollections[key]});
		};
		Resolute.ServerRequest({
			url: Resolute.getPath('registers'),
			params: {
				operation: 'registers.get',
				params: Resolute.encode(params)
			},
			onSuccess: function(d){
				if(d.success){
					for(var collection in d.result){
						this.items[collection].clear();
						for(var i=0;i<d.result[collection].length;i++){
							this.items[collection].add(d.result[collection][i]);
						};
						//this.items[collection].lastSync = Date.create().getTime();
					};
				}
			},
			onFailture: Resolute.emptyFn,
			onServerError: Resolute.emptyFn,
			scope: this
		}); */
	},
	sync:function(){
		for(var key in this.externalCollections){
			this.syncCollection(key);
		}
	},
	syncCollection:function(key){
		if(this.externalCollections[key] && this.externalCollections[key].url){
			this.items[key].fireEvent('beforeload',{collection:this});
			Resolute.request({
				url: this.externalCollections[key].url,
				params: this.externalCollections[key].params||null,
				disableSuccessCheck:true,
				disableCache:true,
				onSuccess: function(d){
					this.items[key].clear();
					var list = d;
					if(this.externalCollections[key].path){
						list = Resolute.path.get(d,this.externalCollections[key].path,[]);
					};
					for(var i=0;i<list.length;i++){
						this.items[key].add(list[i]);
					};
					if(this.externalCollections[key].onLoad){
						this.externalCollections[key].onLoad.call(this.externalCollections[key].scope||this,this,d);
					};
					this.items[key].fireEvent('load',{collection:this});
				},
				onFailure: Resolute.emptyFn,
				scope: this
			});
		}
	},
	drop:function(code){
		delete this.items[code];
		if(this.externalCollections[code]){
			delete this.externalCollections[code];
		};
	},
	get:function(cfg){
		if(Resolute.isString(cfg) && cfg.indexOf('view:')==0){
			return this.view.run(cfg.replace('view:',''));
		};
		if(Resolute.isString(cfg) && cfg.indexOf('collection:')==0){
			var coll = cfg.replace('collection:','');
			if(this.has(coll))
				return this.collection(coll);
		};
		if(Resolute.isString(cfg) && this.has(cfg)){
			return this.collection(cfg);
		};
	}
};

// Глобальное хранилище (аналог локальной БД с множеством коллекций)
Resolute.Store = new Resolute.Data.CollectionManager();

// Коллекция для хранения древовидных данных
Resolute.Data.TreeCollection = Resolute.extend(Resolute.Data.Collection,{
	initComponent:function(){
		this.root = null;
		this.rebuilded = false;
		Resolute.Data.TreeCollection.superclass.initComponent.call(this);
	},
	add:function(cfg){
		var code = Resolute.uuid();
		var index = this.items.length;
		if(cfg.code){
			code = cfg.code;
		};
		cfg.code = code;
		this.items.push(new Resolute.Data.Record(cfg,null,this,index));
		this.rebuilded = false;
		this.fireEvent('add',{
			record:this.items[index],
			index:index
		});
	},
	getData:function(code){
		var d = this.get(code);
		var data = (d)?Resolute.clone(d.data):null;
		return data;
	},
	getDescendants:function(code){
		this.checkRebuild();
		var item = this.get(code);
		return this.find({code:{$ne:code},'tree.left':{$gt:item.get('tree.left')},'tree.right':{$lt:item.get('tree.right')}});
	},
	getDescendantsCount:function(code){
		// Только для целей перестройки данных дерева!
		var count = 0;
		var item = this.get(code);
		var childs = this.find({parent:item.get('code')}).reduce('code');
		if(childs.length==0){
			return 0;
		};
		count += childs.length;
		for(var i=0;i<childs.length;i++){
			count += this.getDescendantsCount(childs[i]);
		};
		return count;
	},
	rebuild:function(){
		// Перестройка дерева
		// Nested Set Model
		var leafCount = 0;
		var count = this.items.length;
		if(!this.root){
			this.getRoot();
		};
		// Обновляем гранцы рута
		this.update({code:this.root.get('code')},{'tree.left':1,'tree.right':count*2,'tree.level':0});
		// Признаки наличия прямых потомков и числа предков узла
		for(var i=0;i<this.items.length;i++){
			this.items[i].set('tree.hasChilds',(this.find({parent:this.items[i].get('code')}).count()>0));
			this.items[i].set('tree.descendantsCount',this.getDescendantsCount(this.items[i].get('code')));
		};
		var self = this;
		var go = function(node,level){
			var left = node.get('tree.left');
			var right = node.get('tree.right');
			var childs = self.find({parent:node.get('code')}).items;
			var lastLeft = left;
			for(var i=0;i<childs.length;i++){
				self.items[childs[i]].set('tree.left',lastLeft+1);
				if(self.items[childs[i]].get('tree.hasChilds')){
					self.items[childs[i]].set('tree.right',lastLeft+2+self.items[childs[i]].get('tree.descendantsCount')*2);
				} else {
					self.items[childs[i]].set('tree.right',lastLeft+2);
				};
				self.items[childs[i]].set('tree.level',level+1);
				lastLeft = self.items[childs[i]].get('tree.right');
				go(self.items[childs[i]],level+1);
			}
		};
		go(this.root,0);
		this.rebuilded = true;
	},
	getPath:function(code,field){
		var path = [];
		var item = this.get(code);
		path.push(item.get(field||'code'));
		var hasParent = true;
		do{
			var p = item.get('parent');
			if(p){
				p = this.get(p);
				path.push(p.get(field||'code'));
				hasParent = true;
				item = p;
			} else {
				hasParent = false;
			}
		} while (hasParent);
		return path;
	},
	getRoot:function(){
		// Поиск корня дерева
		if(this.root){
			// Кэш
			return this.root;
		} else {
			// Возможно, задано несколько корней, добавим один общий
			var roots = this.find({parent:{'$empty':true}});
			if(roots.count()>1){
				// Несколько корней, добавим общий и привяжем корни к нему
				this.update({parent:{$empty:true}},{parent:'root'});
				this.add({code:'root',name:'Root'});
				this.root = this.get('root');
			} else {
				this.root = this.findOne({parent:{$empty:true}},true);
			};
		};
		return this.root
	},
	checkRebuild:function(){
		if(!this.rebuilded){
			this.rebuild();
		}
	},
	hasChilds:function(code){
		this.checkRebuild();
		var item = this.get(code);
		if(item){
			return (item.get('tree.hasChilds')==true);
		};
		return false;
	},
	isLeaf:function(code){
		return !this.hasChilds(code);
	}
});


/*
// Тест
	Resolute.Store.create({
		code:'testRegister1',
		items:[
			{code:'a',name:'Элемент А',actual:true,},
			{code:'b',name:'Элемент B',actual:true,},
			{code:'c',name:'Элемент C',actual:false},
			{code:'d',name:'Элемент D',actual:true}
		]
	});
	Resolute.Store.create({
		code:'testRegister2',
		items:[
			{code:'1',name:'Значение 1',element:'a',rate:1},
			{code:'2',name:'Значение 2',element:'b',rate:11},
			{code:'21',name:'Значение 2.1',element:'a',rate:3},
			{code:'3',name:'Значение 3',element:'c',rate:2},
			{code:'31',name:'Значение 3.1',element:'c'},
			{code:'4',name:'Значение 4',element:'d',rate:51},
			{code:'41',name:'Значение 4.1',element:'d',rate:44},
			{code:'5',name:'Значение 5',element:'c',rate:42},
			{code:'51',name:'Значение 5.1',element:'d',rate:42}
		]
	});
	Resolute.Store.create({
		code:'tree',
		type:'TreeCollection',
		items:[
			{code:'1',name:'Clothing'},
			{code:'2',name:'Mens',parent:'1'},
			{code:'3',name:'Womens',parent:'1'},
			{code:'4',name:'Suits',parent:'2'},
			{code:'5',name:'Slacks',parent:'4'},
			{code:'6',name:'Jackets',parent:'4'},
			{code:'7',name:'Dresses',parent:'3'},
			{code:'8',name:'Skirts',parent:'3'},
			{code:'9',name:'Blouses',parent:'3'},
			{code:'10',name:'Evening Gows',parent:'7'},
			{code:'11',name:'Sun Dresses',parent:'7'},
			{code:'12',name:'Polo',parent:'2'},
			{code:'13',name:'Classic',parent:'12'}
		]
	});
	
	// Получить только те записи первого справочника, которые использутся во втором (по ссылке в поле element во втором справочнике)
 	Resolute.Store.select('testRegister2').find({rate:{'$lt':30}}).map('element',{collection:'testRegister1',query:{actual:true}}).data(['code','name']);
	
	Resolute.Store.view.create({
		code:'someView',
		items:[
			{operation:'select',params:'testRegister2'},
			{operation:'find'},
			{operation:'sort',params:{code:-1}},
			{operation:'map',params:['element',{collection:'testRegister1',query:{actual:true}}]},
			{operation:'convert',params:[
				{
					code: 'code',
					name: 'name',
					type: {
						$data: 'some.test.value'
					}
				},
				{some:{test:{value:{code:1,name:'Demo'}}}}
			]}
		]
	}); */
	//Resolute.Store.view.run('someView')
