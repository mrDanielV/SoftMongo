<?php
/** Класс работы с MongoDB для PHP5, Драйвер: \MongoClient
 *	@ Daniel, 2023
 *	
 *	Поддержка набора функций для работы с БД
 *	Для подключения требует строку подключения (описание формата в классе \DB)
 *	Желательно использование в контексте прокси класса \DB
 */

class Mongo5 {

	use CommonMongoT;

	public $con = null;
	private $dbase = null;
	private $db = null;
	private $collection = null;
	private $options = [];

	private $parent = null;
	private $error = null;

	/**
	 * Инициализация экземпляра класса
	 *
	 * @param $connectionLink - строка подключения, описание формата см. в классе \DB
	 * @param $options - массив опций класса \DB, используются
	 *		- admin <string> - строка авторизации к БД admin
	 *		- cursorTimeout - таймаут курсора, корректней менять функцией setCursorTimeout()
	 * @param $parent - ссылка на экземпляр класса \DB
	 *
	 * @return this
	 */
	public function __construct($connectionLink = '', $options = [], $parent = null){
		$this->options = $options;

		$this->setParent($parent);

		$this->connect($connectionLink);

		return $this;
	}

	/**
	 * Подключение к серверу и БД, возвращает экземпляр класса \MongoClient
	 *
	 * @param $connectionLink - строка подключения, описание формата см. в классе \DB
	 *
	 * @return instanceof \MongoClient
	 */
	public function connect($connectionLink = ''){
		if(!$connectionLink) {
			$this->setError(Lang::get('serverErrors.Mongo.002', 'DB: Не указан URL подключения к MongoDB'));
			return null;
		}

		try {
			$this->con = new \MongoClient($connectionLink, ['connect' => true, 'wTimeoutMS' => 0]);
		} catch (Error $e) {
			$this->setError($e->getMessage());
		} catch (Exception $e) {
			$this->setError($e->getMessage());
			return false;
		}

		return $this->con;
	}

	/**
	 * Установка (изменение) БД, отличной от БД в строке подключения
	 *
	 * @param $dbase - имя БД
	 *
	 * @return this
	 */
	public function setDB($dbase = null) {
		if(!$dbase) {
			$this->setError(Lang::get('serverErrors.DB.003', 'DB: Не указано имя базы данных'));
			return false;
		}

		$this->dbase = $dbase;

		if($this->con) {
			try {
				$this->db = $this->con->selectDB($this->dbase);
			} catch (\Error $e) {
				$this->setError($e->getMessage());
				return false;
			} catch (\Exception $e) {
				$this->setError($e->getMessage());
				return false;
			}
		}

		return $this;
	}

	/**
	 * Установка таймаута выполнения запросов в милисекундах, для отключения таймаута: setCursorTimeout()
	 *
	 * @param $ms <int> - таймаут в милисекундах
	 */
	public function setCursorTimeout($ms = 0) {
		$this->setOption('cursorTimeout', $ms);
	}

	/**
	 * Выполнение команды в формате MongoDB
	 *
	 * @param $cmd <array> - команда в формате ['<имя команды>' => '<параметр>', ...], пример: ['collStats' => 'test']
	 * @param $dbase <string> - имя БД
	 *
	 * @return <array>/false
	 */
	public function command($cmd = [], $dbname = null) {
		if(empty($cmd)) {
			$this->setError(Lang::get('serverErrors.Mongo.003', 'DB command: Не указана команда'));
			return false;
		}
		if($dbname) {
			$r = $this->setDB($dbname);
			if(!$r) {
				return false;
			}
		}

		$res = null;

		try {
			$res = $this->db->command($cmd);
		} catch (\Error $e) {
			$this->setError($e->getMessage());
			return false;
		} catch (\Exception $e) {
			$this->setError($e->getMessage());
			return false;
		}

		return $res;
	}

	/**
	 * Список БД сервера
	 * пользователь должен обладать правом доступа к коллекции "admin"!
	 *
	 * Если существует отдельный пользователь с правами администратора БД, используейте:
	 *	1. опцию 'admin' = 'login:pass' при инициации класса DB
	 *	2. или функцию $DB->adminConnect() перед вызовом $DB->listDatabases(). 
	 * Для отмены подключения с правами администратора используйте $DB->userConnect();
	 *
	 * @param $listOnly <bool> - вернуть только массив-список имён БД, иначе - полный массив-ответ от БД (включая статистику по списку БД)
	 * @param $options <array> - не используется! В параметрах сохранён для консистентности функций с драйвером Mongo7
	 *
	 * @return <array>
	 */
	public function listDatabases($listOnly = true, $options = []) {
		$admined = false;
		if($this->getOption('admin') && $this->parent) {
			$this->parent->adminConnect();
			$admined = true;
		}

		$res = $this->con->listDBs();

		if($listOnly) {
			$res = isset($res['databases'])?$res['databases']:[];
		}

		if($admined) {
			$this->parent->userConnect();
		}

		return $res;
	}

	/**
	 * Проверить, существует ли БД с именем $dbase в текущем подключении/сервере
	 * пользователь должен обладать правом доступа к коллекции "admin"!
	 *
	 * @param $dbase <string> - имя БД
	 *
	 * @return <bool>
	 */
	public function databaseExists($dbase = '') {
		$list = $this->listDatabases();

		foreach ($list as $v) {
			if ($v['name'] === $dbase) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Список коллекций текущей БД
	 *
	 * @param $listOnly <bool> - вернуть только массив-список имён коллекций, иначе - полный массив-ответ от БД (включая статистику по списку коллекций)
	 *		  опция $listOnly = false поддерживается искусственно для консистентности функций с драйвером Mongo7
	 *
	 * @return <array> - отсортированный по алфавиту массов имён
	 */
	public function collectionList($listOnly = true) {
		if(!$this->db) {
			$this->setError('DB collectionList: '.Lang::get('serverErrors.Mongo.conn', 'Нет подключения к БД'));
			return false;
		}

		$res = $this->db->getCollectionNames();
		if(empty($res)) {
			return $res;
		}

		sort($res, SORT_STRING);

		if(!$listOnly) {
			$list = [];
			foreach ($res as $name) {
				$list[] = ['name' => $name];
			}
			$res = $list;
		}

		return $res;
	}

	/**
	 * Проверка существования коллекции с указанным именем
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <bool>
	 */
	public function collectionExists($collection = '') {
		if(!$collection) {
			$this->setError('DB collectionExists: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$list = $this->collectionList();
		if($list === false) {
			return false;
		}

		if(in_array($collection, $list)) {
			return true;
		}

		return false;
	}

	/**
	 * Статистика по коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function collectionStats($collection = '') {
		if(!$this->db) {
			$this->setError('DB collectionStats: '.Lang::get('serverErrors.Mongo.conn', 'Нет подключения к БД'));
			return false;
		}
		if(!$collection) {
			$this->setError('DB collectionStats: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$res = $this->command(['collStats' => $collection]);

		return $res;
	}

	/**
	 * Создание коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $options <array> - опции создания коллекции
	 *
	 * @return <array>/false
	 */
	public function createCollection($collection = '', $options = []) {
		if(!$collection) {
			$this->setError('DB createCollection: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = ['create' => $collection];

		if (!empty($options)) {
			$cmd = array_merge($cmd, $options);
		}

		$res = $this->command($cmd);
		
		return $res;
	}

	/**
	 * Удаление коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function dropCollection($collection = '') {
		if(!$collection) {
			$this->setError('DB dropCollection: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = ['drop' => $collection];
		$res = $this->command($cmd);
		
		return $res;
	}

	/**
	 * Статистика по серверу
	 *
	 * @return <array>
	 */
	public function serverStats() {
		$res = $this->command(['serverStatus' => 1]);

		return $res;
	}

	/**
	 * Статистика по текущей БД
	 *
	 * @return <array>
	 */
	public function stats() {
		$res = $this->command(['dbStats' => 1]);

		return $res;
	}

	/**
	 * Получение индексов коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function listIndexes($collection = '') {
		return $this->getIndexes($collection);
	}

	/**
	 * Получение индексов коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function getIndexes($collection = '') {
		if(!$collection) {
			$this->setError('DB getIndexes: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$res = $this->command(['listIndexes' => $collection]);

		if($res && isset($res['cursor']['firstBatch'])) {
			$res = $res['cursor']['firstBatch'];
		}

		return $res;
	}

	/**
	 * Создание индекса в коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $key <string>/<array> - ключи (пути) полей индекса
	 *			могут быть строкой ('path.path1') или массивом (['path.path1' => 1, 'path3' => -1]) с указанием направления индексирования (убывание/возрастание)
	 * @param $options <array> - опции создаваемого индекса, например - уникальность значений: ['unique' => true]
	 *			см. https://www.mongodb.com/docs/current/reference/command/createIndexes/
	 * @param $name <string> - имя индекса, 
	 *			если имя не указано, то формируется автоматически от ключа. 
	 *			именно поэтому $name - последний параметр функции
	 *
	 * @return <array>/false
	 */
	public function createIndex($collection = '', $key = '', $options = [], $name = '') {
		if(!$collection) {
			$this->setError('DB createIndex: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!$key) {
			$this->setError(Lang::get('serverErrors.Mongo.004', 'DB createIndex: Не указан ключ (путь) индекса'));
			return false;
		}

		// Формирование ключа
		if (is_string($key)) {
			$path = $key;
			$key = [];
			$key[$path] = 1;
		}
		if (!is_array($key)) {
			$this->setError(Lang::get('serverErrors.Mongo.005', 'DB createIndex: Некорректный ключ индекса'));
			return false;
		}

		// Автоматическое формирование наименования индекса
		if (!$name) {
			$names = [];
			foreach ($key as $keyName => $value) {
				$names[] = $keyName;
				$names[] = $value;
			}
			$name = implode('_', $names);
		}

		// Формирование индекса
		$index = [
			'key'	=> $key,
			'name'	=> $name,
		];
		if(!empty($options)){
			$index = array_merge($options, $index);
		}

		$cmd = ['createIndexes' => $collection, 'indexes' => [$index]];

		$res = $this->command($cmd);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Удаление индекса по его наименованию
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $name <string> - имя индекса
	 *
	 * @return <array>/false
	 */
	public function dropIndex($collection = '', $name = '') {
		if(!$collection) {
			$this->setError('DB dropIndex: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!$name) {
			$this->setError(Lang::get('serverErrors.Mongo.006', 'DB dropIndex: Не указано наименование индекса'));
			return false;
		}


		$cmd = ['dropIndexes' => $collection, 'index' => $name];

		$res = $this->command($cmd);

		return $res;
	}

	/**
	 * Запрос количества записей в коллекции по заданному фильтру
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр запроса
	 *
	 * @return <int>/null/false
	 */
	public function count($collection = '', $filter = []) {
		if(!$collection) {
			$this->setError('DB count: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!$this->db) {
			$this->setError('DB count: '.Lang::get('serverErrors.Mongo.conn', 'Нет подключения к БД'));
			return false;
		}

		$res = $this->db->selectCollection($collection)->count($filter);

		return $res;
	}

	/**
	 * Полный запрос записей коллекции по заданному фильтру
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр запроса
	 * @param $fields <array> - массив ключей полей, отображаемых в ответе. 
	 *		По умолчанию = [] -> возврат полного объекта записи БД
	 *		могут быть перечислены в формате (['f1' => 1, 'f2' => 1]), а могут быть массивом имён полей (['f1', f2])
	 * @param $sort <array> - массив ключей сортировки результата, формат ['path' => 1/-1, ...]
	 * @param $limit <int> - ограничение на количество записей, возвращаемых по запросу. 
	 *		По умолчанию не ограничено
	 * @param $skip <int> - массив-фильтр запроса
	 *		По умолчанию не ограничено
	 *
	 * @return \MongoCursor/false
	 */
	public function find($collection, $filter = [], $fields = [], $sort = [], $limit = false, $skip = 0) {
		if(!$collection) {
			$this->setError('DB find: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$limit = intval($limit);
		$skip = intval($skip);

		// поля: могут быть перечислены в формате (['f1' => 1, 'f2' => 1]), а могут быть массивом имён полей (['f1', f2])
		if(!empty($fields) && isset($fields[0]) && is_string($fields[0])) {
			$flds = [];
			if(!in_array('_id', $fields)) {
				$flds['_id'] = 0;
			}
			foreach ($fields as $key => $name) {
				$flds[$name] = 1;
			}
			$fields = $flds;
		}

		$cur = $this->db->selectCollection($collection)->find($filter, $fields);

		$cursorTimeout = $this->getOption('cursorTimeout');
		if($cursorTimeout && intval($cursorTimeout)) {
			$cur->timeout($cursorTimeout);
		}

		if (count($sort) > 0) {
			$cur = $cur->sort($sort);
		}
		if ($skip != 0) {
			$cur = $cur->skip($skip);
		}
		if ($limit != false) {
			$cur = $cur->limit($limit);
		}

		try {
			$cur->hasNext();
		} catch (\MongoCursorTimeoutException $e) {
			$this->setError(Lang::get('serverErrors.Mongo.007', 'DB find: Превышен таймаут для выполнения запроса'));
			return false;
	    }
		
		return $cur;
	}

	/**
	 * Запрос на получение 1 записи коллекции по заданному фильтру
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр запроса
	 * @param $fields <array> - массив ключей полей, отображаемых в ответе. 
	 *		По умолчанию = [] -> возврат полного объекта записи БД
	 *		могут быть перечислены в формате (['f1' => 1, 'f2' => 1]), а могут быть массивом имён полей (['f1', f2])
	 * @param $sort <array> - массив ключей сортировки результата, формат ['path' => 1/-1, ...]
	 * @param $decode <bool> - вернуть результат в виде ассоциативного массива
	 *
	 * @return <array>/<object>/false
	 */
	public function findOne($collection = '', $filter = [], $fields = [], $sort = [], $decode = false) {
		$cur = $this->find($collection, $filter, $fields, $sort, 1);
		if($cur === false) {
			return false;
		}

		$res = $this->getCursorFirst($cur, $decode);

		return $res;
	}

	/**
	 * Добавить запись в коллекцию
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $record <array> - массив объекта записи
	 *
	 * @return <array>/false
	 */
	public function insert($collection = '', $record = []) {
		if(!$collection) {
			$this->setError('DB insert: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!is_array($record) || empty($record)) {
			$this->setError(Lang::get('serverErrors.Mongo.008', 'DB insert: Ошибка формата объекта записи'));
			return false;
		}

		$res = $this->db->selectCollection($collection)->insert($record);

		return $res;
	}

	/**
	 * Обновить запись в коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр критерия поиска записи
	 * @param $object <array> - массив объекта обновления
	 * @param $options <array> - массив опций операции: ['multi' => 0/1, 'upsert' => 0/1]
	 *
	 * @return <array>/false
	 */
	public function update($collection = '', $filter = [], $object = null, $options = []) {
		if(!$collection) {
			$this->setError('DB update: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$options = array_merge(['multi' => 1, 'upsert' => 0], $options);

		if(isset($options['multi'])) {
			$options['multiple'] = $options['multi'];
			unset($options['multi']);
		}

		$res = $this->db->selectCollection($collection)->update($filter, $object, $options);

		if(isset($res['nModified'])) {
			$res['u'] = $res['nModified'];
		}

		return $res;
	}

	/**
	 * Сохранить запись в коллекции
	 *	Сохранение существующей / создание новой записи (UPSERT)
	 *	Идентификация существования записи осуществляется по MongoID в объекте записи ($record['_id'] = instanceof \MongoId)
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $record <array> - массив объекта записи
	 *
	 * @return <array>/false
	 */
	public function save($collection = '', $record = []) {
		$oid = (is_array($record['_id']) && isset($record['_id']['$id']))?$record['_id']['$id']:null;
		if($oid){
			$record['_id'] = new MongoId($oid);
		}

		if (isset($record['_id'])) {
			return $this->update($collection, ['_id' => $record['_id']], $record, ['multi' => 0, 'upsert' => 1]);
		} else {
			return $this->insert($collection, $record);
		}
	}

	/**
	 * Удаление записей в коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр критерия поиска записи
	 * @param $options <array> - НЕ ИСПОЛЬЗУЕТСЯ в этой версии Драйвера
	 *
	 * @return <array>/false
	 */
	public function delete($collection = '', $filter = [], $options = []) {
		if(!$collection) {
			$this->setError('DB delete: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$res = $this->db->selectCollection($collection)->remove($filter);

		return $res;
	}

	/**
	 * Удаление записей в коллекции (алиас к delete)
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр критерия поиска записи
	 * @param $options <array> - НЕ ИСПОЛЬЗУЕТСЯ в этой версии Драйвера
	 *
	 * @return <array>/false
	 */
	public function remove($collection = '', $filter = [], $options = []) {
		return $this->delete($collection, $filter, $options);
	}

	/**
	 * Запрос на агрегацию в коллекции $collection по массиву этапов $pipeline
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $pipeline <array> - массив запросов-этапов агрегации
	 		см. https://www.mongodb.com/docs/manual/core/aggregation-pipeline/
	 		см. https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
	 * @param $raw <bool> - вернуть первую запись результата в виде массива
	 * @param $options <array> - НЕ ИСПОЛЬЗУЕТСЯ в этой версии Драйвера
	 *
	 * @return <array>/false
	 */
	public function aggregate($collection = '', $pipeline = [], $raw = false, $options = []) {
		if(!$collection) {
			$this->setError('DB aggregate: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(empty($pipeline)) {
			$this->setError(Lang::get('serverErrors.Mongo.009', 'DB aggregate: Не указана последовательность этапов агрегации (pipeline)'));
			return false;
		}

		$pipeline = $this->setSTDMongoParams($pipeline);

		$col = $this->db->selectCollection($collection);
		$res = $col->aggregate($pipeline);

		if($raw && isset($res['result'][0])){
			$res = $res['result'][0];
		}

		return $res;
	}

	/**
	 * Аналитика запроса
	 *	Только для типа FIND, общего плана (allPlansExecution)) запроса
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтра запроса - аналогично функции find()
	 * @param $sort <array> - сортировка, применяемая к запросу (влияет на выбираемый план запроса) - аналогично функции find()
	 *
	 * @return <array>/false
	 */
	public function explain($collection, $filter = [], $sort = []) {
		if(!$collection) {
			$this->setError('DB explain: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(empty($filter)) {
			$filter = new \stdClass($filter);
		}

		$explain = [
			'find' => $collection,
			'filter' => $filter
		];
		if(!empty($sort)){
			$explain['sort'] = $sort;
		}

		$cmd = [ 'explain' => $explain ];
		$res = $this->command($cmd);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Выполнение MongoScript в контексте БД
	 *
	 * @param $script <string> - MongoScript JS программый код
	 * @param $args <array> - не используется для PHP5
	 *
	 * @return <array>/false
	 */
	public function execute($script = '', $args = []) {
		if(!$script) {
			$this->setError(Lang::get('serverErrors.Mongo.010', 'DB execute: пустая команда на выполнение'));
			return false;
		}

		return $this->db->execute($script);
	}

	/**
	 * Утилитарная. Представить курсор Mongo в виде массива
	 * @param $cur <instanceof \MongoCursor> - курсор MongoDB
	 * @param $first <bool> - вернуть только первый элемент массива результатов
	 * @param $decode <bool> - декодировать из объекта в массив
	 *
	 * @return <array>/null
	 */
	public function getCursorArray($cur = null, $first = false, $decode = true) {
		// утилитарная: представить курсор Mongo в виде массива
		if(!$cur){
			return null;
		}
		$res = [];

		if(is_object($cur)){
			foreach ($cur as $item) {
				$res[] = $item;
			}
		}else {
			$res = $cur;
		}

		if($first && is_array($res) && isset($res[0])) {
			$res = $res[0];
		}

		if($res && $decode){
			$res = json_decode(json_encode($res), true);
		}

		return $res;
	}

	/**
	 * Утилитарная. Получить в виде массива первую запись из курсора Mongo
	 * @param $cur <instanceof \MongoCursor> - курсор MongoDB
	 * @param $decode <bool> - декодировать из объекта в массив
	 *
	 * @return <array>/null
	 */
	public function getCursorFirst($cur = null, $decode = true) {
		// утилитарная: получить в форме массива первую запись курсора Mongo
		return $this->getCursorArray($cur, true, $decode);
	}
}
?>