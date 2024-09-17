// Страница авторизации Resolute SoftMongo
SM.login = {
	markup: {
		cls: 'sm_login_body',
		cn: [
			{cls: 'sm_login_form', cn: [
				{cls: 'sm_login_top', cn: [
					{cls: 'sm_login_logo', cn: ''},
					{cls: 'sm_login_title', cn: 'Resolute SoftMongo'}
				]},
				{cls: 'sm_login_center  form', cn: [
					{cls: 'sm_login_content', cn: [
						{
							rtype: 'textfield',
							label: SM.lang('login.001', 'Логин'),
							ref: 'login'
						},
						{
							rtype: 'textfield',
							label: SM.lang('login.002', 'Пароль'),
							ref: 'password',
							password: true
						}
					]},
					{cls: 'sm_login_bottom', cn: [
						{cls: 'sm_lang unselectable', ref: 'langSelect', cn: SMlang.name},
						{cn: '', st: 'flex: 1'},
						{cls: 'sm_form_btn', cn: SM.lang('login.003', 'Войти'), ref: 'enter'}
					]}
				]}
			]},
			{cls: 'sm_login_upper'}
		]
	},
	init: function(){
		this.render();
	},
	render: function(){
		this.body = R.getBody();
		this.body.setHtml('');

		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.components = {};
		tmp.apply(this.body, this.items, this.components);

		var enterBtn = R.xp(this.items, 'enter');
		if(enterBtn){
			enterBtn.on('click', this.onEnter, this);
		}

		var langSelect = R.xp(this.items, 'langSelect');
		if(langSelect){
			langSelect.on('click', this.toggleLangs, this);
		}

		this.body.on('keyup', this.onKey, this);
	},
	onEnter: function(){
		// сбор данных с формы и запуск процедуры авторизации
		var login = R.xp(this.components, 'login').getValue();
		var password = R.xp(this.components, 'password').getValue();

		// Базовая валидация данных
		if(!login || !password){
			R.Msg.alert(SM.lang('login.004', 'Введите логин/пароль'));
			return;
		}
		if(login.length > 20 || login.length < 3 || password.length > 20  || password.length < 3){
			R.Msg.alert(SM.lang('login.005', 'Некорректные логин/пароль'));
			return;
		}

		// Запрос за сервер
		var w = R.Msg.wait();
		R.request({
			url: 'operations/',
			params: {
				operation: 'Auth.login',
				data: R.encode({login: login, password: password})
			},
			onSuccess: function(r){
				w.close();
				this.enter();
			},
			onFailure: function(r){
				w.close();
				R.Msg.alert(r.msg);
			},
			scope: this
		});
	},
	onKey: function(e){
		if(e.keyCode == 13){
			this.onEnter();
		}
	},
	enter: function(){
		window.document.location.reload();
	},
	toggleLangs: function() {
		// Список выбора языка интерфейса
		var langSelect = R.xp(this.items, 'langSelect');
		if(!langSelect){
			return;
		}

		this.langsMenu = Resolute.Pickers.show('Menu', {
			alignTo: langSelect,
			offsets: [0, 0],
			items: SMlang.list,
			callback: SM.view.onSelectLang,
			scope:this
		});
		if(this.langsMenu.getEl()){
			this.langsMenu.getEl().setStyle('min-width', '130px');
			this.langsMenu.getEl().setStyle('max-height', '200px');
			this.langsMenu.getEl().setStyle('overflow-y', 'auto');
			this.langsMenu.getEl().setStyle('box-shadow', '#666 1px 1px 5px -1px');
		}
	}
};

R.onReady(function(){
	SM.login.init();
});
