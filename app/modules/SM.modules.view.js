// Модуль окна Просмотра любого объекта с возможностью вызвать колбэк-функцию
SM.modules.view = {
	init: function(record, options, callback, scope){
		this.title = R.xp(options, 'title', SM.lang('view.title', 'Просмотр объекта'));
		this.record = record;

		this.callback = callback;
		this.scope = scope || callback;

		this.buttons = [{code: 'close', name: SM.lang('close', 'Закрыть')}];
		if(R.xp(options, 'action')){
			var actionName = R.xp(options, 'action');
			if(!isString(actionName)){
				actionName = 'ОК';
			}
			this.buttons = [
				{code: 'ok', name: actionName},
				{code: 'close', name: SM.lang('close', 'Закрыть')}
			];
		}

		this.validate = true;
		if(R.xp(options, 'validate') === false){
			this.validate = false;
		}

		this.show();
	},
	show: function(){
		// Инициация окна изменения записи
		var parent = this;
		var buttons = this.buttons;

		this.win = new Resolute.Window({
			width: 700,
			//height: 620,
			title: this.title,
			check: this.validate,
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
					},{
						cn: SM.lang('view.001', 'Скопировать в буфер'),
						cls: 'sm_blue_textb href mt-5',
						ref: 'copyBuffer'
					}
				]
			},
			buttons: buttons,
			onAfterRender: function(){
				this.setData();

				var copyBuffer = R.xp(this.elements, 'copyBuffer');
				if(copyBuffer){
					copyBuffer.on('click', this.copyBuffer, this);
				}
			},
			copyBuffer: function(){
				if(this.getData()){
					var text = JSON.stringify(this.data, null, '\t');
					SM.fn.copyBuffer(text);
					R.Notices.alert(SM.lang('view.002', 'Скопировано в буфер'));
				}
			},
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					if(this.getData()){
						if(parent.callback && isFunction(parent.callback)){
							parent.callback.call(parent.scope, this.data);
						}
						this.close();
					}
				}
			},
			validate: function(record){
				if(!this.data){
					R.Msg.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
					return false;
				}

				if(isEmpty(this.data)){
					R.Msg.alert(SM.lang('view.003', 'Сохранение пустого объекта недопустимо!'));
					return false;
				}

				return true;
			},
			getData: function(){
				// сбор данных с формы
				this.data = {};
				var fld = R.xp(this.components, 'record');
				var value = fld.getValue();

				this.data = SM.fn.toJSON(value);
				if(this.check && !this.validate()){
					return;
				}

				return this.data;
			},
			setData: function(){
				// установка данных на форму
				var record = R.clone(parent.record);
				if(record) delete record._id;

				var value = '{\n\t\n}';
				if(record && !isEmpty(record)){
					value = JSON.stringify(record, null, '\t');
				}

				var fld = R.xp(this.components, 'record');
				fld.setValue(value);
			}
		});
	}
};
