// База для плагинов
Resolute.namespace('Resolute.Elements.Plugins');
Resolute.Elements.Plugins.Base = function(el,options){
	this.el = el; // Resolute.Element
	this.options = options || {};
	if(this.init) this.init();
};

Resolute.Elements.Plugins.Base.prototype = {
	enrich:function(methods){
		Resolute.each(methods,function(method){
			this.el[method] = this.prototype[method];
		})
	}
};

// Фабрика создания плагинов
Resolute.Elements.Plugins.create = function(name,cfg){
	Resolute.Elements.Plugins[name] = Resolute.extend(Resolute.Elements.Plugins.Base,cfg);
};