
Resolute.id = function(el, prefix){
	el = Resolute.getDom(el, true) || {};
	if (!el.id) {
		var ss = Resolute.sequence.next('id');
		el.id = (prefix || 'resolute-gen') + (++ss);
	}
	return el.id;
},

/*#
Возвращает уникальный идентификатор в виде uuid
#*/
Resolute.uuid = function(){
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (dt + Math.random()*16)%16 | 0;
		dt = Math.floor(dt/16);
		return (c=='x' ? r :(r&0x3|0x8)).toString(16);
	});
	return uuid;
};

/*#
Возвращает уникальный идентификатор в виде числа, либо в виде обратимого хэша этого числа (для сокрытия поледовательного id)
Вызов без параметров - возвращает число
Высов с true - возвращает строку с хэшем
При передаче на вход строки - преобразует хэш в число
При передаче на вход числа - преобразует в хэш строку

Resolute.code()					>	1631884643853253 
Resolute.code(true)				>	'1ec63085ou5'
Resolute.code('1ec63085ou5')	>	1631884643853253
Resolute.code(1631884643853253)	>	'1ec63085ou5'
#*/
Resolute.code = function(asString){
	if(Resolute.isString(asString)){
		return parseInt(asString,32)
	} else if(Resolute.isNumber(asString)){
		return parseInt(asString+'',10).toString(32);
	} else {
		var n = Math.round((new Date()).getTime()*1000+Math.random()*1000);
		return (asString)?parseInt(n+'',10).toString(32):n;
	}
};
Resolute.mcode = function(){
	var v = (new Date()).getTime()-1637800000;
	return Math.round(v*1000+Math.random()*1000)
}

// То же что и Resolute.code но с дополнительным усложением возможности разбора (типа шифрование)
// Resolute.hcode() > '8s7prr42de1'
// Resolute.hcode('8s7prr42de1') > 1632848716799880
Resolute.hcode = function(val){
	if(Resolute.isString(val)) return Resolute.code(val.reverse());
	return Resolute.code(true).reverse();
};
