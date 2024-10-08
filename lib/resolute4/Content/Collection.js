// Коллекция объектов
Resolute.Collection = function(allowFunctions, keyFn){
	this.items = [];
	this.map = {};
	this.keys = [];
	this.length = 0;
	this.addEvents(
		'clear',
		'add',
		'replace',
		'remove',
		'sort'
	);
	this.allowFunctions = allowFunctions === true;
	if(keyFn){
		this.getKey = keyFn;
	}
	Resolute.Collection.superclass.constructor.call(this);
};

Resolute.extend(Resolute.Collection, Resolute.Observable, {
	allowFunctions : false,
	add : function(key, o){
		if(arguments.length == 1){
			o = arguments[0];
			key = this.getKey(o);
		}
		if(typeof key != 'undefined' && key !== null){
			var old = this.map[key];
			if(typeof old != 'undefined'){
				return this.replace(key, o);
			}
			this.map[key] = o;
		}
		this.length++;
		this.items.push(o);
		this.keys.push(key);
		this.fireEvent('add', this.length-1, o, key);
		return o;
	},
	getKey : function(o){
		 return o.id || o.code;
	},
	count:function(){
		return this.items.length;
	},
	replace : function(key, o){
		if(arguments.length == 1){
			o = arguments[0];
			key = this.getKey(o);
		}
		var old = this.map[key];
		if(typeof key == 'undefined' || key === null || typeof old == 'undefined'){
			 return this.add(key, o);
		}
		var index = this.indexOfKey(key);
		this.items[index] = o;
		this.map[key] = o;
		this.fireEvent('replace', key, old, o);
		return o;
	},
	addAll : function(objs){
		if(arguments.length > 1 || Resolute.isArray(objs)){
			var args = arguments.length > 1 ? arguments : objs;
			for(var i = 0, len = args.length; i < len; i++){
				this.add(args[i]);
			}
		}else{
			for(var key in objs){
				if(this.allowFunctions || typeof objs[key] != 'function'){
					this.add(key, objs[key]);
				}
			}
		}
	},
	each : function(fn, scope,finalFn){
		var items = [].concat(this.items);
		for(var i = 0, len = items.length; i < len; i++){
			if(fn.call(scope || items[i], items[i], i, len) === false){
				break;
			}
		};
		if(finalFn){
			finalFn.call(scope || items[i]);
		}
	},
	eachKey : function(fn, scope){
		for(var i = 0, len = this.keys.length; i < len; i++){
			fn.call(scope || window, this.keys[i], this.items[i], i, len);
		}
	},
	find : function(fn, scope){
		for(var i = 0, len = this.items.length; i < len; i++){
			if(fn.call(scope || window, this.items[i], this.keys[i])){
				return this.items[i];
			}
		}
		return null;
	},
	insert : function(index, key, o){
		if(arguments.length == 2){
			o = arguments[1];
			key = this.getKey(o);
		}
		if(this.containsKey(key)){
			this.suspendEvents();
			this.removeKey(key);
			this.resumeEvents();
		}
		if(index >= this.length){
			return this.add(key, o);
		}
		this.length++;
		this.items.splice(index, 0, o);
		if(typeof key != 'undefined' && key !== null){
			this.map[key] = o;
		}
		this.keys.splice(index, 0, key);
		this.fireEvent('add', index, o, key);
		return o;
	},
	remove : function(o){
		return this.removeAt(this.indexOf(o));
	},
	removeAt : function(index){
		if(index < this.length && index >= 0){
			this.length--;
			var o = this.items[index];
			this.items.splice(index, 1);
			var key = this.keys[index];
			if(typeof key != 'undefined'){
				delete this.map[key];
			}
			this.keys.splice(index, 1);
			this.fireEvent('remove', o, key);
			return o;
		}
		return false;
	},
	removeKey : function(key){
		return this.removeAt(this.indexOfKey(key));
	},
	getCount : function(){
		return this.length;
	},
	indexOf : function(o){
		return this.items.indexOf(o);
	},
	indexOfKey : function(key){
		return this.keys.indexOf(key);
	},
	query:function(q,findOne){
		// Поиск по запросу
		var res = [];
		this.each(function(item){
			if(Resolute.match(item,q)){
				res.push(item);
			};
		},this);
		if(findOne){
			return (res.length>0)?res[0]:null;
		};
		return res;
	},
	item : function(key){
		var mk = this.map[key],
			item = mk !== undefined ? mk : (typeof key == 'number') ? this.items[key] : undefined;
		return typeof item != 'function' || this.allowFunctions ? item : null;
	},
	itemAt : function(index){
		return this.items[index];
	},
	key : function(key){
		return this.map[key];
	},
	contains : function(o){
		return this.indexOf(o) != -1;
	},
	containsKey : function(key){
		return typeof this.map[key] != 'undefined';
	},
	clear : function(){
		this.length = 0;
		this.items = [];
		this.keys = [];
		this.map = {};
		this.fireEvent('clear');
	},
	first : function(){
		return this.items[0];
	},
	last : function(){
		return this.items[this.length-1];
	},
	_sort : function(property, dir, fn){
		var i, len,
			dsc   = String(dir).toUpperCase() == 'DESC' ? -1 : 1,
			c     = [],
			keys  = this.keys,
			items = this.items;
		fn = fn || function(a, b) {
			return a - b;
		};
		for(i = 0, len = items.length; i < len; i++){
			c[c.length] = {
				key  : keys[i],
				value: items[i],
				index: i
			};
		}
		c.sort(function(a, b){
			var v = fn(a[property], b[property]) * dsc;
			if(v === 0){
				v = (a.index < b.index ? -1 : 1);
			}
			return v;
		});
		for(i = 0, len = c.length; i < len; i++){
			items[i] = c[i].value;
			keys[i]  = c[i].key;
		}
		this.fireEvent('sort', this);
	},
	sort : function(dir, fn){
		this._sort('value', dir, fn);
	},
	reorder: function(mapping) {
		this.suspendEvents();

		var items = this.items,
			index = 0,
			length = items.length,
			order = [],
			remaining = [],
			oldIndex;
		for (oldIndex in mapping) {
			order[mapping[oldIndex]] = items[oldIndex];
		}

		for (index = 0; index < length; index++) {
			if (mapping[index] == undefined) {
				remaining.push(items[index]);
			}
		}

		for (index = 0; index < length; index++) {
			if (order[index] == undefined) {
				order[index] = remaining.shift();
			}
		}

		this.clear();
		this.addAll(order);

		this.resumeEvents();
		this.fireEvent('sort', this);
	},
	keySort : function(dir, fn){
		this._sort('key', dir, fn || function(a, b){
			var v1 = String(a).toUpperCase(), v2 = String(b).toUpperCase();
			return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
		});
	},
	getRange : function(start, end){
		var items = this.items;
		if(items.length < 1){
			return [];
		}
		start = start || 0;
		end = Math.min(typeof end == 'undefined' ? this.length-1 : end, this.length-1);
		var i, r = [];
		if(start <= end){
			for(i = start; i <= end; i++) {
				r[r.length] = items[i];
			}
		}else{
			for(i = start; i >= end; i--) {
				r[r.length] = items[i];
			}
		}
		return r;
	},
	filter : function(property, value, anyMatch, caseSensitive){
		if(Resolute.isEmpty(value, false)){
			return this.clone();
		}
		value = this.createValueMatcher(value, anyMatch, caseSensitive);
		return this.filterBy(function(o){
			return o && value.test(o[property]);
		});
	},
	filterBy : function(fn, scope){
		var r = new Resolute.Collection();
		r.getKey = this.getKey;
		var k = this.keys, it = this.items;
		for(var i = 0, len = it.length; i < len; i++){
			if(fn.call(scope||this, it[i], k[i])){
				r.add(k[i], it[i]);
			}
		}
		return r;
	},
	findIndex : function(property, value, start, anyMatch, caseSensitive){
		if(Resolute.isEmpty(value, false)){
			return -1;
		}
		value = this.createValueMatcher(value, anyMatch, caseSensitive);
		return this.findIndexBy(function(o){
			return o && value.test(o[property]);
		}, null, start);
	},
	findIndexBy : function(fn, scope, start){
		var k = this.keys, it = this.items;
		for(var i = (start||0), len = it.length; i < len; i++){
			if(fn.call(scope||this, it[i], k[i])){
				return i;
			}
		}
		return -1;
	},
	createValueMatcher : function(value, anyMatch, caseSensitive, exactMatch) {
		if (!value.exec) { // not a regex
			var er = Resolute.escapeRe;
			value = String(value);

			if (anyMatch === true) {
				value = er(value);
			} else {
				value = '^' + er(value);
				if (exactMatch === true) {
					value += '$';
				}
			}
			value = new RegExp(value, caseSensitive ? '' : 'i');
		 }
		 return value;
	},
	clone : function(){
		var r = new Resolute.Collection();
		var k = this.keys, it = this.items;
		for(var i = 0, len = it.length; i < len; i++){
			r.add(k[i], it[i]);
		}
		r.getKey = this.getKey;
		return r;
	}
});
Resolute.Collection.prototype.get = Resolute.Collection.prototype.item;