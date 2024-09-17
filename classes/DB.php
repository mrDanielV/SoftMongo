<?php
/** Прокси класс между драйверами Mongo для разных версий PHP
	@ Daniel, 2023

	new DB ($connectionLink, $dbase = null, $options = []): instanceof DB
		$connectionLink - строка подключения
		$dbase - имя БД
		$options - опции класса

	Формат строки подключения
		mongodb://LOGIN:PASS@HOST_SRV:PORT/DB?param1=value&param2=value...

	Примеры строк подключения
		mongodb://localhost:27017
		mongodb://user:pass@someurl.ru:27017
		mongodb://user:pass@/srv/test/run/mongodb-27711.sock/dbase1
		mongodb://user:pass@db0.example.com:27017,db1.example.com:27017/?connectTimeoutMS=1000&ssl=true&replicaSet=db1

	Имя БД может быть указано как в строке подключения, так и в параметре $dbase. Приоритетом пользуется параметр $dbase.
		$db = new DB('mongodb://user:pass@/srv/test/run/mongodb-27711.sock', 'dbase1');

	Опции подключения можно обозначить как в строке подключения, так и в $options['connectOptions']:
		$db = new DB('user:pass@db0.example.com:27017,db1.example.com:27017/?connectTimeoutMS=1000&ssl=true', '', ['connectOptions' => ['replicaSet' => 'db1']]);

	Администратор БД, функции, требующие права администратора БД
		Некоторые функции, например listDatabases(), databaseExists() для Mongo5, требуют подключения с правами доступа к коллекции admin БД
		Если основной пользователь таких прав не имеет, можно:
		 - передать логин:пароль администратора в $options['admin'] = 'login:pass'
		 - использовать логин:пароль администратора в функции adminConnect('login:pass') перед вызовом фукнций, требующий наличие прав администратора БД

	DB::getInstance()
		Для экономии ресурсов можно использовать функцию получения текущего подключения вместо инициализации нового экземпляра класса с новым подключением

	Конечные функции работы с БД реализуются на уровне Драйвера.
	При этом программист должен обращаться к классу DB:
		$db = new DB('mongodb://localhost:27017', 'dbase1');
		$r = $db->count('table1');

	Обработка ошибок работы класса
		По умолчанию при возникновении ошибки, она фиксируется в переменной класса
		Получить ошибку можно функцией getError()
			$db = new DB('mongodb://localhost:27017', 'dbase1');
			$r = $db->count('table1');
			if($db->getError()) {
				echo $db->getError();
			}

		С помощью опции "exceptions" можно включить фиксацию ошибок как Exception PHP
 */

class DB {

	// Опции класса (НЕ опции подключения к БД)
	private $options = [
		'exceptions' => false,
		'connectTimeoutMS' => 30000,
		'cursorTimeout' => 30000,
		'maxAwaitTimeMS' => 1800000
	];

	protected static $_self	= null;

	private $connectionLink = null;
	private $mongo = null;
	private $dbase = null;
	private $error = null;
	private $exceptions = false;

	private $user = '';
	private $userDB = '';

	/**
	 * Инициализация экземпляра класса
	 *
	 * @param $connectionLink - строка подключения, описание формата см. выше
	 * @param $dbase - имя БД, может быть указана и в строке подключения, и отдельным параметром (обладает приоритетом)
	 * @param $options - массив опций класса
	 *		- exceptions <bool> - включить формирование Exception при возникновении ошибок класса
	 *		- connectOptions <array> - опции подключения к БД, список опций определён MongoDB
	 *		- admin <string> - строка авторизации к БД admin
	 *		- cursorTimeout - таймаут курсора, корректней менять функцией setCursorTimeout()
	 *		- maxAwaitTimeMS - таймаут подключения для драйвера Mongo5
	 *
	 * @return this
	 */
	public function __construct($connectionLink = '', $dbase = null, $options = []){
		$this->setOptions($options);

		// Реагировать ли на ошибки Эксепшенами
		if($this->getOption('exceptions')) {
			$this->exceptions = true;
		}

		// Базовая установка опционального параметра - Имя БД
		// Поскольку тут еще точно нет покдючения к Драйверу, не нужно использовать $this->setDB();
		$this->dbase = $dbase;

		// Подключение
		if($connectionLink) {
			$this->setConnectionLink($connectionLink);
			$this->connect();
		}

		return $this;
	}

	/**
	 * Служебное, вызов методов класса-драйвера
	 */
	public function __call($method, $arguments){
		// Вызов методов класса-драйвера
		if($this->getError()) {
			return false;
		}

		if(!$this->mongo || !method_exists($this->mongo, $method)) {
			$this->setError(Lang::get('serverErrors.DB.001', 'DB: Не известная функция - ') . $method . '()');
			return false;
		}

		try {
			return call_user_func_array([$this->mongo, $method], $arguments);
		} catch (\Error $e) {
			$this->setError($e->getMessage());
			return false;
		} catch (\Exception $e) {
			$this->setError($e->getMessage());
			return false;
		}
	}

	/**
	 * Подключение к серверу и БД, возвращает экземпляр класса драйвера
	 *
	 * @param $connectionLink - строка подключения, описание формата см. выше
	 * @param $dbase - имя БД, может быть указана и в строке подключения, и отдельным параметром (обладает приоритетом)
	 *
	 * @return instanceof Mongo7 / Mongo5
	 */
	public function connect($connectionLink = '', $dbase = null){
		// Подключение к серверу и БД, возвращает экземпляр класса драйвера
		if($dbase) {
			$this->setDB($dbase);
		}
		if($connectionLink) {
			$this->setConnectionLink($connectionLink);
		}

		// Установленные в __construct или тут - не важно, - но строка соединения и имя БД на этом этапе обязательны
		if(!$this->connectionLink) {
			$this->setError(Lang::get('serverErrors.DB.002', 'DB: Не указан URL подключения к MongoDB'));
			return false;
		}
		if(!$this->dbase) {
			$this->setError(Lang::get('serverErrors.DB.003', 'DB: Не указано имя базы данных'));
			return false;
		}

		// Сохранение исходного пользователя
		if(!$this->mongo) {
			$this->saveUser();
		}

		// Выбор Драйвера и подключение
		if(class_exists('\MongoDB\Driver\Manager')) {
			$this->mongo = new Mongo7($this->connectionLink, $this->options, $this);
		}
		else if(class_exists('\MongoClient') && PHP_VERSION_ID < 70000) {
			$this->mongo = new Mongo5($this->connectionLink, $this->options, $this);
		}
		else {
			$this->setError(Lang::get('serverErrors.DB.004', 'DB: Не установлен драйвер MongoDB'));
		}

		// Повторная установка БД для проведения её в Драйвер
		$this->setDB($this->dbase);

		if($this->mongo && $this->mongo->getError()) {
			$this->setError($this->mongo->getError());
		}

		return $this->mongo;
	}

	/**
	 * Обновление существующего подключения. Если поключения нет, создается новое
	 *
	 * @param $connectionLink - строка подключения, описание формата см. выше
	 * @param $dbase - имя БД, может быть указана и в строке подключения, и отдельным параметром (обладает приоритетом)
	 *
	 * @return instanceof Mongo7 / Mongo5
	 */
	public function reconnect($connectionLink = '', $dbase = null) {
		// Обновление существующего подключения
		if(!$this->mongo) {
			return $this->connect($connectionLink, $dbase);
		}
		if(!$connectionLink) {
			$connectionLink = $this->connectionLink;
		}

		if($dbase) {
			$connectionLink = str_replace($this->dbase, $dbase, $connectionLink);
			$this->setDB($dbase);
		}

		$this->connectionLink = $connectionLink;

		$this->mongo->connect($this->connectionLink, $this->options, $this);

		return $this->mongo;
	}

	/**
	 * Установка текущей БД
	 *
	 * @param $dbase <string> - имя БД
	 * @param $updateConnection <bool> - обновить поключение
	 *
	 * @return instanceof Mongo7 / Mongo5
	 */
	public function setDB($dbase = null, $updateConnection = false) {
		// Пустое значение будет установлено, но спровоцирует внутреннюю ошибку
		$this->setError();
		if(!$dbase) {
			$this->setError(Lang::get('serverErrors.DB.005', 'DB: Не указано наименование БД'));
		}

		$this->dbase = $dbase;

		// При наличии объекта класса Драйвера - установка БД в нём: далее в Драйвере будет использоваться именно эта БД
		if($this->mongo) {
			$this->mongo->setDB($dbase);

			if($updateConnection) {
				$this->reconnect($this->connectionLink, $dbase);
			}
		}

		return $this;
	}

	/**
	 * Получение имени текущей БД
	 *
	 * @return <string>
	 */
	public function getDB() {
		return $this->dbase;
	}

	/**
	 * Условное получение текущего экземпляра класса - если он есть, иначе - инициация
	 *
	 * @param $connectionLink - строка подключения, описание формата см. выше
	 * @param $dbase - имя БД, может быть указана и в строке подключения, и отдельным параметром (обладает приоритетом)
	 * @param $options - массив опций класса, см. описание __construct
	 *
	 * @return this
	 */
	public static function getInstance($connectionLink = '', $dbase = null, $options = []){
		// Условное получение текущего экземпляра класса - если он есть, иначе - инициация
		if(is_null(self::$_self)) {
			self::$_self = new self($connectionLink, $dbase, $options);
		}

		return self::$_self;
	}

	/**
	 * Служебное. Формирование корректной ссылки на подключение
	 *
	 * @param $connectionLink <string> - строка подключения, описание формата см. выше
	 *
	 * @return $connectionLink
	 */
	public function setConnectionLink($connectionLink = '') {
		// Формирование корректной ссылки на подключение
		if(!$connectionLink) {
			$this->setError(Lang::get('serverErrors.DB.006', 'DB: Не указана строка подключения к серверу БД'));
			return $this;
		}

		// Заменить "/" на "%2F" в connectionLink сокета: находится между "@" и ".sock"
		if (preg_match('/@(.*?)\.sock/', $connectionLink, $match) == 1) {
			$url = $match[1];
			$socket = str_replace('/', '%2F', $url);
			$connectionLink = str_replace($url, $socket, $connectionLink);
		}

		// Разбор строки стандартным parse_url()
		$parts = parse_url($connectionLink);
		if(!$parts) {
			$this->setError(Lang::get('serverErrors.DB.007', 'DB: Ошибка в формате строки подключения к БД'));
			return $this;
		}

		// Получить Имя БД из строки (между последним / и либо концом строки, либо знаком "?")
		if(isset($parts['path']) && $parts['path'] && !$this->dbase) {
			$dbase = str_replace('/', '', $parts['path']);
			$this->setDB($dbase);
		}
		if(!$this->dbase) {
			$this->setDB('admin');
		}

		// Опции подключения - совмещаем укзанное в строке с $options['connectOptions']
		$params = isset($parts['query'])?$parts['query']:'';
		parse_str($params, $gets);
		$connectOptions = $this->getOption('connectOptions');
		if($connectOptions && is_array($connectOptions)) {
			$gets = array_merge($gets, $connectOptions);
		}
		$gets = http_build_query($gets);

		// Собираем конечный результат: строка до БД + БД + опции подключения
		$parts['path'] = '/'.$this->dbase;
		$parts['query'] = $gets;
		if(PHP_VERSION_ID < 70000) {
			$parts['host'] = str_replace('%2F', '/', $parts['host']);
		}
		$this->connectionLink = $this->buildURL($parts);

		return $this;
	}

	/**
	 * Служебное. Сохранение исходного пользователя подключения
	 */
	public function saveUser() {
		// Сохранение исходного пользователя подключения
		if(!$this->connectionLink) {
			return null;
		}

		$parts = explode('@', $this->connectionLink);
		$this->user = str_replace('mongodb://', '', $parts[0]);
		$this->userDB = $this->dbase;

		return $this->user;
	}

	/**
	 * Служебное. Установка подключения к БД admin c правом администратора БД
	 */
	public function adminConnect($userPass = 'user:pass') {
		// Установка подключения к БД admin c правом администратора БД
		// Если не указан параметр $userPass, использует опцию 'admin' = 'user:pass'
		if(!$this->connectionLink) {
			$this->setError(Lang::get('serverErrors.DB.008', 'DB: не установлена строка подключения к БД'));
			return false;
		}
		if($userPass == 'user:pass') {
			$userPass = '';
		}
		if(!$userPass) {
			$userPass = $this->getOption('admin');
		}
		if(!$userPass) {
			$this->setError(Lang::get('serverErrors.DB.009', 'DB: не указаны логин/пароль администратора БД'));
			return false;
		}
		
		$parts = explode('@', $this->connectionLink);
		$link = implode('@', ['mongodb://'.$userPass, $parts[1]]);

		$this->reconnect($link, 'admin');

		return $this;
	}

	/**
	 * Служебное. Обновление подключения с правами основного пользователя, указанного при подключении
	 */
	public function userConnect($userPass = 'user:pass') {
		if(!$this->connectionLink) {
			$this->setError(Lang::get('serverErrors.DB.010', 'DB: не установлена строка подключения к БД'));
			return false;
		}
		if($userPass == 'user:pass') {
			$userPass = '';
		}
		if(!$userPass) {
			$userPass = $this->user;
		}
		if(!$userPass) {
			$this->setError(Lang::get('serverErrors.DB.011', 'DB: не указаны логин/пароль пользователя БД'));
			return false;
		}
		
		$parts = explode('@', $this->connectionLink);
		$link = implode('@', ['mongodb://'.$userPass, $parts[1]]);

		$this->reconnect($link, $this->userDB);

		return $this;
	}

	/**
	 * Получить текущее поключение
	 *
	 * @return instanceof \MongoDB\Driver\Manager / \MongoClient
	 */
	public function getConnection() {
		if(!$this->mongo) {
			return null;
		}
		return $this->mongo->con;
	}

	/**
	 * Установить текущий набор опций класса
	 *
	 * @param $options <array> - массив опций класса, см. описание __contruct
	 */
	public function setOptions($options = []) {
		if(is_array($options)){
			$this->options = array_merge($this->options, $options);
		}
	}

	/**
	 * Установить значение отдельной опции класса
	 *
	 * @param $name <string> - имя опции
	 * @param $value <string> - значение
	 *
	 * @return $value
	 */
	public function setOption($name = '', $value = '') {
		return $this->options[$name] = $value;
	}

	/**
	 * Получить значение отдельной опции класса
	 *
	 * @param $name <string> - имя опции
	 *
	 * @return $value / NULL
	 */
	public function getOption($name = '') {
		return isset($this->options[$name])?$this->options[$name]:null;
	}

	/**
	 * Установить текущее значение (состояние) ошибки класса
	 *
	 * @param $error <string>/null - ошибка
	 *
	 * @return <string>/null
	 */
	public function setError($error = null) {
		$this->error = $error;

		if($this->exceptions && $error) {
			 throw new Exception($error);
		}
		
		return $this->error;
	}

	/**
	 * Получить текущее значение (состояние) ошибки класса
	 *
	 * @return <string>/null
	 */
	public function getError() {
		return $this->error;
	}

	private function buildURL(array $parts) {
		return (isset($parts['scheme']) ? "{$parts['scheme']}:" : '') .
			((isset($parts['user']) || isset($parts['host'])) ? '//' : '') .
			(isset($parts['user']) ? "{$parts['user']}" : '') .
			(isset($parts['pass']) ? ":{$parts['pass']}" : '') .
			(isset($parts['user']) ? '@' : '') .
			(isset($parts['host']) ? "{$parts['host']}" : '') .
			(isset($parts['port']) ? ":{$parts['port']}" : '') .
			(isset($parts['path']) ? "{$parts['path']}" : '') .
			((isset($parts['query']) && $parts['query']) ? "?{$parts['query']}" : '') .
			(isset($parts['fragment']) ? "#{$parts['fragment']}" : '');
	}
}
?>