// Пинг к серверу для проверки и проверки текущей сессии
SM.modules.pinger = function(){
	R.request({
		url: 'operations/',
		params: {
			operation: 'Auth.ping'
		},
		disableSuccessCheck: true,
		scope: this
	});
}
