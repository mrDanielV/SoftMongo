<?php
/**************************************************************************
 * Настройки подключения MongoDB
 
	Формат 
	 	$connections = [
			[
				'name' => 'имя сервера, отображаемое в softMongo',
				'link' => 'строка подключения в формате MongoDB',
				'dbase' => 'имя БД',
				'options' => []
			]
		];

	Пример
		$connections = [
			[
				'name' => 'Server 1',
				'link' => 'mongodb://LOGIN:PASS@HOST_SRV:PORT/DB?param1=value&param2=value'
			],[
				'name' => 'Server 2',
				'link' => 'mongodb://LOGIN:PASS@HOST_SRV1:PORT1,HOST_SRV2:PORT2/DB?replicaSet=DB1'
			],[
				'name' => 'Server 3',
				'link' => 'mongodb://localhost:27017',
				'dbase' => 'DB1'
			],[
				'name' => 'Server 4',
				'link' => 'mongodb://LOGIN:PASS@HOST_SRV1:PORT1,HOST_SRV2:PORT2/DB?replicaSet=DB1',
				'dbase' => 'DB',
				'options' => [
					'exceptions' => true,
					'admin' => 'admin:adminpass',
					'connectOptions' => ['replicaSet' => 'db1']
				]
			]
		];

	PHP 5.x - используйте JSON-строку:
		$connections = '[
			{
				"name": "БД Резолют",
				"link": "mongodb://LOGIN:PASS@HOST_SRV:PORT/DB",
				"options": {"admin": "adminlogin:adminpassword"}
			}
		]';

 */
$connections = [
	[
		'name' => 'Server 1',
		'link' => 'mongodb://LOGIN:PASS@HOST_SRV:PORT/DB?param1=value&param2=value'
	]
];

define('SM_CONNECTIONS', $connections);
?>
