// Модуль окна Добавления/Изменения/Просмотра записи БД
SM.modules.collection.upsert = {
	init: function(record, options){
		this.mode = 'insert';
		this.record = {};
		if(record && R.xp(record, '_id')){
			this.record = record;
			this.mode = 'update';
		}
		if(record && (!R.xp(record, '_id') || R.xp(options, 'mode') == 'view')){
			this.record = record;
			this.mode = 'view';
		}

		this.title = SM.lang('upsert.title.add', 'Добавление записи');
		if(this.mode == 'update'){
			this.title = SM.lang('upsert.title.edit', 'Изменение записи');
		}
		else if(this.mode == 'view'){
			this.title = SM.lang('upsert.title.view', 'Просмотр записи');
		}

		this.view = SM.modules.collection.view;

		this.show();
	},
	show: function(){
		// Инициация окна изменения записи
		var parent = this;

		var buttons = [
			{code: 'save', name: SM.lang('save', 'Сохранить')},
			{code: 'close', name: SM.lang('cancel', 'Отмена')}
		];
		if(this.mode == 'view'){
			buttons = [
				{code: 'close', name: SM.lang('close', 'Закрыть')}
			];
		}

		this.win = new Resolute.Window({
			width: 700,
			//height: 620,
			title: this.title,
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cn: [
					{
						cn: [
							{
								rtype: 'textarea',
								ref: 'record',
								attr: { spellcheck:'false' },
								style: 'width: 99%;',
								tab: true,
								codding: true,
								resize: 'none',
								height: 500
							}
						]
					}
				]
			},
			buttons: buttons,
			onAfterRender: function(){
				this.setData();
			},
			onButtonClick: function(btn) {
				if(btn == 'save'){
					if(this.getData()){
						this.close();
						parent.save(this.data);
					}
				}
			},
			getData: function(){
				// сбор данных с формы
				this.data = {};
				var fld = R.xp(this.components, 'record');
				var value = fld.getValue();

				var record = SM.fn.toJSON(value);
				if(!record){
					R.Msg.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
					return false;
				}

				if(isEmpty(record)){
					R.Msg.alert(SM.lang('upsert.alerts.001', 'Сохранение пустого объекта недопустимо!'));
					return false;	
				}

				if(record) delete record._id;

				if(parent.record && R.xp(parent.record, '_id')){
					record._id = parent.record._id;
				}

				this.data = record;

				return this.data;
			},
			setData: function(){
				// установка данных на форму
				var record = R.clone(parent.record);
				if(record) delete record._id;

				var value = '{\n\t\n}';
				if(record && isObject(record) && !isEmpty(record)){
					value = JSON.stringify(record, null, '\t');
				}

				var fld = R.xp(this.components, 'record');
				fld.setValue(value);
			}
		});
	},
	save: function(record){
		// сохранение записи
		SM.request('upsert', {record: record}, function(r){
			R.Notices.alert(SM.lang('upsert.alerts.002', 'Запись сохранена!'));
			this.afterSave();
		}, this);
	},
	afterSave: function(){
		// завершение процедуры работы с изменением записи
		var params = null;
		if(this.mode == 'update'){
			params = {saveQuery: true};
		}
		this.view.refresh(params);
	}
};
