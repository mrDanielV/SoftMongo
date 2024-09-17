// Менеджер всех компонентов
Resolute.ComponentManager = function(){
	var all = new Resolute.Collection();
	var types = {};
	return {
		register:function(c){
			all.add(c);
		},
		unregister:function(c){
			all.remove(c);
		},
		get:function(id){
			return all.get(id);
		},
		query:function(q,findOne){
			// Поиск компонентов по запросу
			return all.query(q,findOne);
		},
		onAvailable:function(id, fn, scope){
			all.on('add', function(index, o){
				if(o.id == id){
					fn.call(scope || o, o);
					all.un('add', fn, scope);
				}
			});
		},
		all : all,
		types : types,
		isRegistered:function(rtype){
			// Проверка, зарегистрирован ли переданный rtype 
			return types[rtype] !== undefined;
		},
		registerType:function(rtype, cls){
			// Регистрация rtype 
			types[rtype] = cls;
			cls.rtype = rtype;
		},
		create : function(config, defaultType){
			return config.render ? config : new types[config.rtype || defaultType](config);
		}
	};
}();

Resolute.reg = Resolute.ComponentManager.registerType;
Resolute.create = Resolute.ComponentManager.create;
Resolute.getCmp = Resolute.ComponentManager.get;
Resolute.getComponent = Resolute.ComponentManager.get;