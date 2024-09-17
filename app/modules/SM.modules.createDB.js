// Модуль формы (окна) создания БД
SM.modules.createDB = {
	init: function(){
		this.showForm();
	},
	showForm: function(){
		// Окно создания новой БД
		var parent = this;

		this.createWindow = new Resolute.Window({
			width: 480,
			title: SM.lang('query.createDB.title', 'Создание новой БД'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			items:[
				{
					cls: 'form',
					cn: [
						{
							rtype: 'textfield',
							ref: 'name'
						}
					]
				}
				
			],
			buttons:[
				{code: 'create', name: SM.lang('create', 'Создать')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onButtonClick: function(btn) {
				if(btn == 'create'){
					var data = {
						name: this.name.getValue()
					};
					this.close();
					parent.createDB(data);
				}
			}
		});
	},
	createDB: function(data){
		// Создание БД - запрос на сервер
		var newname = R.xp(data, 'name');
		SM.request('createDB', {name: newname}, function(r){}, this);
	}
};
