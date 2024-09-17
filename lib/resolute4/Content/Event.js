// Базовое событие (кастомизируемое)
Resolute.Event = function(obj, name){
	// Ext.utils.Event!!!
	this.name = name;
	this.obj = obj;
	this.listeners = [];
};

Resolute.Event.prototype = {
	addListener : function(fn, scope, options){
		var me = this,
			l;
		scope = scope || me.obj;
		if(!me.isListening(fn, scope)){
			l = me.createListener(fn, scope, options);
			if(me.firing){
				me.listeners = me.listeners.slice(0);
			}
			me.listeners.push(l);
		}
	},
	createListener: function(fn, scope, o){
		o = o || {};
		scope = scope || this.obj;
		function createTargeted(h, o, scope){
			return function(){
				if(o.target == arguments[0]){
					h.apply(scope, Array.prototype.slice.call(arguments, 0));
				}
			};
		};

		function createBuffered(h, o, l, scope){
			l.task = new Resolute.DelayedTask();
			return function(){
				l.task.delay(o.buffer, h, scope, Array.prototype.slice.call(arguments, 0));
			};
		};

		function createSingle(h, e, fn, scope){
			return function(){
				e.removeListener(fn, scope);
				return h.apply(scope, arguments);
			};
		};

		function createDelayed(h, o, l, scope){
			return function(){
				var task = new Resolute.DelayedTask(),
					args = Array.prototype.slice.call(arguments, 0);
				if(!l.tasks) {
					l.tasks = [];
				}
				l.tasks.push(task);
				task.delay(o.delay || 10, function(){
					if(l.tasks.remove) l.tasks.remove(task);
					h.apply(scope, args);
				}, scope);
			};
		};
		var l = {
			fn: fn,
			scope: scope,
			options: o
		}, h = fn;
		if(o.target){
			h = createTargeted(h, o, scope);
		}
		if(o.delay){
			h = createDelayed(h, o, l, scope);
		}
		if(o.single){
			h = createSingle(h, this, fn, scope);
		}
		if(o.buffer){
			h = createBuffered(h, o, l, scope);
		}
		l.fireFn = h;
		return l;
	},
	findListener : function(fn, scope){
		var list = this.listeners,
			i = list.length,
			l;

		scope = scope || this.obj;
		while(i--){
			l = list[i];
			if(l){
				if(l.fn == fn && l.scope == scope){
					return i;
				}
			}
		}
		return -1;
	},
	isListening : function(fn, scope){
		return this.findListener(fn, scope) != -1;
	},
	removeListener : function(fn, scope){
		var index,
			l,
			k,
			me = this,
			ret = false;
		if((index = me.findListener(fn, scope)) != -1){
			if (me.firing) {
				me.listeners = me.listeners.slice(0);
			}
			l = me.listeners[index];
			if(l.task) {
				l.task.cancel();
				delete l.task;
			}
			k = l.tasks && l.tasks.length;
			if(k) {
				while(k--) {
					l.tasks[k].cancel();
				}
				delete l.tasks;
			}
			me.listeners.splice(index, 1);
			ret = true;
		}
		return ret;
	},
	clearListeners : function(){
		var me = this,
			l = me.listeners,
			i = l.length;
		while(i--) {
			me.removeListener(l[i].fn, l[i].scope);
		}
	},
	fire : function(){
		var me = this,
			listeners = me.listeners,
			len = listeners.length,
			i = 0,
			l;

		if(len > 0){
			me.firing = true;
			var args = Array.prototype.slice.call(arguments, 0);
			for (; i < len; i++) {
				l = listeners[i];
				if(l && l.fireFn && l.fireFn.apply(l.scope || me.obj || window, args) === false) {
					return (me.firing = false);
				}
			}
		}
		me.firing = false;
		return true;
	}
};

// Именные названия кодов клавиш
Resolute.Event.Key = {
	backspace:9,
	space:32,
	tab:9,
	delete:45,
	enter:13,
	up:38,
	down:40,
	left:37,
	right:39,
	escape:27
};
// Проверка участия клавиш в событии
Resolute.Event.isKey = function(event,key,mod){
	if(Resolute.isArray(key)){
		var res = 0;
		Resolute.each(key,function(item){
			if(Resolute.Event.isKey(event,item)) res++;
		});
		return res > 0;
	};
	if(Resolute.isNumber(event)){
		var eb = event;
	} else {
		var eb = event.keyCode || event.button;
	};
	if(!eb) return false;
	var k = Resolute.Event.Key[key];
	if(!k) return false;
	if(k == eb) return true;
	return false;
}
