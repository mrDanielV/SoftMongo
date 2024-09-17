// Для всяких внутренних настроек, конфигов и прочего...
Resolute.Misc = {};

// Таблицы проверки символов Unicode (языки)
Resolute.Misc.unicodeScripts = [
	{name:'Arabic',range:'\u0600-\u06FF'},
	{name:'Cyrillic',range:'\u0400-\u04FF'},
	{name:'Devanagari',range:'\u0900-\u097F'},
	{name:'Greek',range:'\u0370-\u03FF'},
	{name:'Hangul',range:'\uAC00-\uD7AF\u1100-\u11FF'},
	{name:'Han Kanji',range:'\u4E00-\u9FFF\uF900-\uFAFF'},
	{name:'Hebrew',range:'\u0590-\u05FF'},
	{name:'Hiragana',range:'\u3040-\u309F\u30FB-\u30FC'},
	{name:'Kana',range:'\u3040-\u30FF\uFF61-\uFF9F'},
	{name:'Katakana',range:'\u30A0-\u30FF\uFF61-\uFF9F'},
	{name:'Latin',range:'\u0001-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F'},
	{name:'Thai',range:'\u0E00-\u0E7F'}
];
Resolute.Misc.unicodeScriptsBuild = function(){
	/* var s = Resolute.Misc.unicodeScripts;
	for(var i=0;i<s.length;i++){
		var scrIs = new RegExp('^['+s[i].range+'\\s]+$','u');
		var scrHas = new RegExp('['+s[i].range+']$','u');
		String.prototype['is'+s[i].name] = function(){
			return scrIs.test(this);
		}
		String.prototype['has'+s[i].name] = function(){
			return scrHas.test(this);
		}
	}; */
};
//Resolute.Misc.unicodeScriptsBuild();

Resolute.Misc.cipher = function(salt){
	// IE11 - ломается в РГС
/* 	const textToChars = text => text.split('').map(c => c.charCodeAt(0));
	const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
	const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
	return text => text.split('')
		.map(textToChars)
		.map(applySaltToChar)
		.map(byteHex)
		.join(''); */
};
Resolute.Misc.decipher = function(salt){
	// IE11 - ломается в РГС
/* 	const textToChars = text => text.split('').map(c => c.charCodeAt(0));
	const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
	return encoded => encoded.match(/.{1,2}/g)
		.map(hex => parseInt(hex, 16))
		.map(applySaltToChar)
		.map(charCode => String.fromCharCode(charCode))
		.join(''); */
};