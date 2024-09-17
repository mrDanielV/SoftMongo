
Function.prototype.createInterceptor = function(newFn, scope) { 
	var method = this;
	return !Resolute.isFunction(newFn) ?
		this :
		function() {
			var me = this,
				args = arguments;
			newFn.target = me;
			newFn.method = method;
			return (newFn.apply(scope || me || window, args) !== false) ?
					method.apply(me || window, args) :
					null;
		};
};

// Отложение выполнения функции
Function.prototype.defer = function(millis, obj, args, appendArgs){
	var fn = this.createDelegate(obj, args, appendArgs);
	if(millis > 0){
		return setTimeout(fn, millis);
	}
	fn();
	return 0;
}
// Связывание функции со scope
Function.prototype.createDelegate = function(obj, args, appendArgs){
	var method = this;
	return function() {
		var callArgs = args || arguments;
		if (appendArgs === true){
			callArgs = Array.prototype.slice.call(arguments, 0);
			callArgs = callArgs.concat(args);
		}else if (Resolute.isNumber(appendArgs)){
			callArgs = Array.prototype.slice.call(arguments, 0); // copy arguments first
			var applyArgs = [appendArgs, 0].concat(args); // create method call params
			Array.prototype.splice.apply(callArgs, applyArgs); // splice them in
		}
		return method.apply(obj || window, callArgs);
	};
};
Function.prototype.bind = Function.prototype.createDelegate;
// Создание цепочки вызовов функций
Function.prototype.createSequence = function(fcn, scope){
	var method = this;
	return (typeof fcn != 'function') ?
			this :
			function(){
				var retval = method.apply(this || window, arguments);
				fcn.apply(scope || this || window, arguments);
				return retval;
			};
};

// Вызов функции не более одного раза в ms миллисекунд (первый вызов пройдёт, а последующие чаще ms нет
Function.prototype.debounce = function(ms){
	var isCooldown = false;
	var f = this;
	return function() {
		if (isCooldown) return;
		f.apply(this, arguments);
		isCooldown = true;
		setTimeout(function(){isCooldown = false}, ms);
	};
}

// Вызов функции не более одного раза в ms миллисекунд (первый и последующие вызовы не пройдут, пока не пройдет ms)
// В отличии от debounce – если проигнорированный вызов является последним во время «задержки», то он выполняется в конце.
Function.prototype.throttle = function (ms) {
	var isThrottled = false,
		savedArgs,
		savedThis,
		func = this;
	function wrapper() {
		if (isThrottled) {
			savedArgs = arguments;
			savedThis = this;
			return;
		}
		func.apply(this, arguments);
		isThrottled = true;
		setTimeout(function () {
			isThrottled = false;
			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}
	return wrapper;
}