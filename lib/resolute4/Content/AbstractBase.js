// Абстрактный базовый класс с поддержкой superclass и прочего
// 
Resolute.AbstractBase = function(){};
Resolute.apply(Resolute.AbstractBase, {
	$isClass: true,
	callParent: function(args) {
		var method;
		return (method = this.callParent.caller) && (method.$previous ||
			((method = method.$owner ? method : method.caller) &&
					method.$owner.superclass.self[method.$name])).apply(this, args || noArgs);
	}
});
Resolute.AbstractBase.prototype = {
	constructor: function(){},
	callParent: function(args) {
		var method,
			superMethod = (method = this.callParent.caller) && (method.$previous ||
					((method = method.$owner ? method : method.caller) &&
							method.$owner.superclass[method.$name]));
		return superMethod.apply(this, args || noArgs);
	}
};