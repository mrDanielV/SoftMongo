<?php
/**
 * Утилитарный класс работы с директориями
 * @author Daniel Vasiliev
 *		
 *		ОПИСАНИЕ И ПРИМЕРЫ
 *			общий синтаксис для объекта
 *			$dir = new Dir ($pathType (string), $autoCreate (bool), $permission (int)) - все параметры необязательны.
 *			$dir = Dir::obj($pathType (string), $autoCreate (bool), $permission (int))
 *
 *			$pathType - либо путь к директории, либо тип директории в терминах Резолют. Возможные значения см. в переменной класса $types
 *			$autoCreate - флаг автоматического создания директории, если её нет. Создание происходит при инициализации объекта и назначении пути к директории
 *			$permission - разрешения к директории в юникс формате, по умолчанию = 0775
 *
 *			// узнать путь к директории
 *			Dir::obj($pathType)->get();
 *
 *			// ЧТЕНИЕ ДИРЕКТОРИИ
 *			Dir::obj()->read($filters (array), $fileinfo (bool));
 *			$filters - массив настроек фильтрации. Возможные ключи: 'folders' => true/false, 'files' => true/false, 'exts' => ['jpg', ...]
 *			$fileinfo - флаг получения расширенных параметров каждого элемента в директории (наименование, размер, тип, дата создания, расширение (для файлов))
 *						по умолчанию - отключено
 *
 *
 *			// чтение директории - папки и файлы, подряд
 *			Dir::obj($pathType)->read();
 *
 *			// чтение директории - только папки
 *			Dir::obj($pathType)->read(['folders' => true]);
 *
 *			// чтение директории - только файлы
 *			Dir::obj($pathType)->read(['files' => true]);
 *
 *			// чтение подпапки
 *			Dir::obj($pathType)->add($pathPLUS)->read();
 *
 *			// чтение с фильтром по расширениям
 *			Dir::obj($pathType)->read(['exts' => ['png']]);
 *
 *			// чтение возвратом расширенных параметров содержимого папки
 *			Dir::obj($pathType)->read($filters, true);
 *			Dir::obj($pathType)->read(true);
 */

class Dir
{
	private $path = './files/';
	public $types = [
		'files' => './files/',
		'tmp' => null
	]; 
	private $autoCreate = true;
	private $permission = 0775;
	
	/**
	 * Инициализация экземпляра класса
	 *
	 * @param $pathType <string> - строка пути к директории либо константа по типу директории
	 * @param $autoCreate <bool> - создать указанную директорию, если её нет на сервере, по умолчанию = TRUE
	 * @param $permission - права доступа к директории, если она создается, по умолчанию = 0775
	 *
	 * @return this
	 */
	public function __construct($pathType = null, $autoCreate = true, $permission = null){
		$this->types['tmp'] = sys_get_temp_dir();

		if($autoCreate === false){
			$this->autoCreate = false;
		}
		if(!is_null($permission)){
			$this->permission = $permission;
		}
		if($pathType && is_string($pathType)){
			$this->set($pathType);
		}

		return $this;
	}

	// Обеспечение формы вызова Dir::obj()->get()
	public static function obj(){
		// Получение объекта класса (статичный вызов)
		$args = func_get_args();
		if(isset($args[0]) && isset($args[1])){
			return new self($args[0],$args[1]);
		}
		else if(isset($args[0])){
			return new self($args[0]);
		}
		return new self();
	}

	public function setType($type = 'files'){
		if(!$type){
			return null;
		}
		if(isset($this->types[$type])){
			return $this->setPath($this->types[$type]);
		}

		return false;
	}

	public function setPath($path = ''){
		if(!$path){
			$path = FILES_DIR;
		}

		$s = mb_strlen($path);
		$l = mb_substr($path, $s-1, 1);
		if($l != '/'){
			$path.='/';
		}

		$this->path = $path;

		if(!is_dir($this->path) && $this->autoCreate){
			$old = umask(0);
			@ $r = mkdir($this->path, $this->permission, true);
			umask($old);
		}

		return true;
	}

	public function addPath($path = ''){
		if(!$path || !$this->path){
			return $this;
		}

		$s = mb_strlen($path);
		$l = mb_substr($path, $s-1, 1);
		if($l != '/'){
			$path.='/';
		}

		$this->path.=$path;
		
		if(!is_dir($this->path) && $this->autoCreate){
			$old = umask(0);
			@ $r = mkdir($this->path, $this->permission, true);
			umask($old);
		}

		return $this;
	}

	public function add($path = ''){
		return $this->addPath($path);
	}

	public function set($pathType = ''){
		if(!mb_strstr($pathType, '/')){
			$this->setType($pathType);
		}
		else{
			$this->setPath($pathType);
		}

		return $this;
	}

	public function get(){
		return $this->path;
	}

	public function up(){
		if(!$this->path || !mb_strstr($this->path, '/')){
			return $this;
		}

		$path = $this->path;
		$s = mb_strlen($path);
		$l = mb_substr($path, $s-1, 1);
		if($l != '/'){
			$path.='/';
		}
		
		$folders = explode('/', $path);
		$n = sizeof($folders);

		unset($folders[$n-1]);
		unset($folders[$n-2]);
		$this->path = implode('/', $folders).'/';

		return $this;
	}

	// чтение директории. Возможные фильтры: ['folders' => true/false, 'files' => true/false, 'exts' => ['jpg', ...]]
	public function read($filters = [], $fileinfo = null){
		$result = [];

		@ $cdir = scandir($this->path);
		if(!$cdir || empty($cdir)){
			return [];
		}

		// если передан один параметр и это TRUE/FALSE - считаем, что передали $fileinfo
		if(is_bool($filters) && is_null($fileinfo)){
			$fileinfo = $filters;
		}

		// фильтры
		$folders = isset($filters['folders'])?$filters['folders']:null;
		$files = isset($filters['files'])?$filters['files']:null;
		$exts = isset($filters['exts'])?$filters['exts']:null;

		if(is_null($folders) && is_null($files)){
			$folders = true;
			$files = true;
		}
		else if($files && is_null($folders)){
			$folders = false;
		}
		else if($folders && is_null($files)){
			$files = false;
		}

		foreach ($cdir as $key => $item) {
			if(in_array($item, ['.','..'])){
				continue;
			}

			$names = explode('.', $item);
			$s = sizeof($names);
			$ext = null;
			if($s > 1){
				$ext = $names[$s-1];
			}

			$addItem = $item;

			// возврат в виде массива с расширенными параметрами
			if($fileinfo){
				$addItem = [
					'name' => $item,
					'type' => is_dir($this->path.$item)?'folder':'file',
					'size' => filesize($this->path.$item),
					'date' => filectime($this->path.$item)*1000,
					'ext' => $ext
				];
			}

			// папки
			if($folders && is_dir($this->path.$item)){
				$result[] = $addItem;
			}

			// файлы
			if($files && is_file($this->path.$item)){

				// фильтр по рисширениям
				if($exts && is_array($exts)){
					if($ext && in_array($ext, $exts)){
						$result[] = $addItem;
						continue;
					}
				}
				// без фильтра
				else{
					$result[] = $addItem;
				}
			}
		}

		return $result;
	}

	public function remove($recursion = false) {
		if(!$this->path) {
			return null;
		}

		if(!$recursion) {
			return rmdir($this->path);
		}

		return $this->rremove($this->path);
	}

	public function rremove($path = '') {
		if(!$path) {
			return null;
		}

		$files = array_diff(scandir($path), ['.', '..']);
		foreach ($files as $file) {
			(is_dir("$path/$file")) ? $this->rremove("$path/$file") : unlink("$path/$file");
		}

		return rmdir($path);
	}

	public function setAutoCreate($autoCreate = true){
		$this->autoCreate = $autoCreate;

		return $this;
	}

	public function setPermission($permission = null){
		if(is_null($permission)){
			$permission = 0775;
		}
		$this->permission = $permission;

		if($this->path && $this->permission){
			$old = umask(0);
			@ chmod($this->path, $this->permission);
			umask($old);
		}

		return $this;
	}

}
?>