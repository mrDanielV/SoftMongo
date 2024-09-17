<?php
/**
 * Класс обслуживащий функционал мультиязычности SoftMongo
 *		Предполагает наличие JSON-файлов заданной структуры с переводами текстовок интерфейса
 *		Файлы языков должны быть расположены в директории, заданной в "private $dir" и именоваться по правилу "smlang_<код языка>.json"
 *	
 * @author Daniel Vasiliev
 *
 *		@input lang = 'eng' - код языка интерфейса
 */


class Lang {

	private $dir = './lang/';
	private $filetmpname = 'smlang_<code>.json';
	private $lang = '';
	public $result = null;
	public $error = null;
	public $msg = null;

	public static $langsList = [];
	public static $data = [];

	public function __construct($lang = null) {
		if(!$lang) {
			$lang = $this->getCode();
		}

		$this->setLang($lang);

		return $this;
	}

	/** Статическая форма вызова с получением результата работы класса
	 * 
	 *	@input lang = 'eng' - код языка интерфейса
	 */
	public static function init ($lang = null) {
		return new self($lang);
	}

	/** Основная функция получения фразы на текущем языке
	 * 
	 *	@input path = '' - путь к фразе в JSON-файле языка
	 *	@input def = '' - значение по умолчанию, если путь не найден в файле или файла не существует
	 */
	public static function get ($path = '', $def = '') {
		if(!$path) {
			return $def;
		}

		$self = new self();
		$self->upDir();

		$data = $self->getData();

		$value = Utils::xp($data, 'values.'.$path, $def);

		return $value;
	}

	/** Статическая функция установки/изменения текущего языка
	 * 
	 *	@input lang = 'eng' - код языка интерфейса
	 */
	public static function change ($lang = null) {
		$success = [ 'success' => true, 'data' => null ];
		if(!$lang) {
			return null;
		}

		// Объект класса и установка (изменение) языка
		$self = new self($lang);

		return $success;
	}

	/** Получение кода текущего языка
	 */
	public function getCode() {
		$code = Utils::xp($_SESSION, 'SM_LANG');
		if(!$code) {
			$code = Utils::xp($_COOKIE, 'SM_LANG');
		}
		if(!$code) {
			$code = $this->lang;
		}
		if(!$code) {
			$code = SM_LANG;
		}

		return $code;
	}

	/** Установка текущего язцыка, фиксация в cookie и сессии
	 * 
	 *	@input lang = 'eng' - код языка интерфейса
	 */
	public function setLang($lang = null) {
		if(!$lang) {
			$this->setError('The language of interface is not specified');
			return null;
		}

		$this->lang = $lang;

		setcookie('SM_LANG', '', time() - 3600);
		unset($_COOKIE['SM_LANG']);
		unset($_SESSION['SM_LANG']);

		setcookie('SM_LANG', $this->lang, 0);
		$_COOKIE['SM_LANG'] = $this->lang;
		$_SESSION['SM_LANG'] = $this->lang;

		return $this->lang;
	}

	/** Формирование полного объекта данных, включающего в себя список доступных системе языков и объектом фраз текущего языка
	 * 
	 *	@input format = 'array' / 'json' - формат возврата результата
	 *	@input update = true / false - начитать заново из файлов, даже если объект уже есть в памяти
	 */
	public function getData($format = 'array', $update = false) {
		$code = $this->getCode();

		// сохраненный ранее в память объект данных языка
		if(!empty(self::$data) && !$update && Utils::xp(self::$data, 'code') == $code) {
			$this->result = self::$data;
		}
		// чтение объекта данных языка из файла
		else {
			$this->result = $this->readLangFile($code);	
		}

		if(empty($this->result)) {
			return $this->result;
		}

		// Добавление списка доступных языков к объекту данных языка
		$this->result['list'] = $this->getLangsList();
		self::$data = $this->result;

		if($format == 'json') {
			$this->result = json_encode($this->result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
		}
		

		return $this->result;
	}
	
	/** Физическое чтение файла языка
	 * 
	 *	@input code = '' - код языка
	 */
	public function readLangFile($code = null) {
		if(!$code) {
			$code = $this->lang;
		}
		if(!$code) {
			return null;
		}

		$filename = $this->dir.$this->filetmpname;

		$filename = str_replace('<code>', $code, $filename);
		$content = file_get_contents($filename);
		$content = json_decode($content, true);

		return $content;
	}

	/** Фомирование списка доступных языков по языковым файлам, доступным системе
	 * 
	 *	@input update = true / false - начитать заново из файлов, даже если список уже есть в памяти
	 */
	public function getLangsList($update = false) {
		if(!empty(self::$langsList) && !$update) {
			return self::$langsList;
		}

		$result = [];
		$dir = new Dir($this->dir);
		$files = $dir->read(['folders' => false, 'files' => true, 'exts' => ['json']]);

		if(empty($files)) {
			return $result;
		}

		foreach ($files as $name) {
			$file = new File($this->dir.$name);
			$content = $file->get();
			$data = json_decode($content, true);

			if($data) {
				$result[] = ['code' => Utils::xp($data, 'code'), 'name' => Utils::xp($data, 'name')];
			}
		}

		return $result;
	}

	public function getDir($dir = null) {
		return $this->dir;
	}

	public function setDir($dir = null) {
		if($dir) {
			$this->dir = $dir;
		}
		return $this->dir;
	}

	public function upDir($dir = null) {
		// Для запросов из клиента сделать шаг на уровень выше для директории
		$this->setDir('../'.$this->getDir());
	}

	public function setError($error = null) {
		$this->error = $error;

		return $this;
	}

	public function getError() {
		return $this->error;
	}
}
?>