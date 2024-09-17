<?php
/**
 * Утилитарный класс работы с файлами
 * @author Daniel Vasiliev
 *		
 *		ОПИСАНИЕ И ПРИМЕРЫ
 *			общий синтаксис для объекта
 *		$file = new File ($filename (string), $dir (string)) - все параметры необязательны.
 *		$file = File::obj($filename (string), $dir (string))
 *
 *		$filename - либо путь к файлу, либо имя файла
 *		$dir - путь к директории файла, либо тип директории (тип директории - смысловой код стандартных директорий Резолют, см. класс Dir)
 *
 *		При отсутствии указанной директории, по умолчанию используется системный временный каталог PHP (чаще всего /tmp/)
 *		При отсутствии имени файла, имя генерируется как условно уникальное стровое значение
 *
 *		// узнать путь к директории
 *		Dir::obj($pathType)->get();
 *
 *		// ПРИМЕРЫ инициализации файла по пути
 *		$file = new File('tmp/ttt/yyy.php'); 	// указание файла с путём к нему
 *		$file = new File('yyy.php', 'tmp/ttt');	// указание файла и директории раздельно
 *		$file = new File('yyy.php', 'files'); 	// указание файла и типа директории (см. класс Dir)
 *		$file = new File('yyy.php'); 			// указание файла без директории - директорией будет временная папка PHP
 *		$file = new File(); 					// файл со случайным сгенерированным именем во временной папке PHP
 *
 *		// GETs
 *		Получение пути к файлу
 *		File::obj()->getPath();
 *
 *		Получить путь к директории файла
 *		File::obj()->getDir();
 *
 *		Получить имя файла без пути
 *		File::obj()->getName();
 *
 *		Получить расширение файла
 *		File::obj()->getExt();
 *
 *		Получить размер файла в байтах
 *		File::obj()->getSize();
 *
 *		Получить дату создания файла
 *		File::obj()->getDate();
 *
 *		Получить расширенные параметры файла - возвращается массив с именем, расширением, датой, размером, директорией и полным путем файла
 *		File::obj()->info();
 *
 *		// ЧТЕНИЕ и ВЫВОД файла
 *		$content = File::obj('0199e6ec6cf725b19a31387b.png', 'attachments')->get(); // чтение файла строкой
 *		File::obj('0199e6ec6cf725b19a31387b.png', 'attachments')->get('browser'); // открытие файла в браузере
 *		File::obj('0199e6ec6cf725b19a31387b.png', 'attachments')->get('upload'); // скачивание файла в браузере
 *
 *		// ЗАПИСЬ в файла
 *		$res = File::obj('yyy.txt')->write('test test'); // запись в файл (файл и директория создаются автоматически)
 *
 *		// КОПИРОВАНИЕ и ПЕРЕМЕЩЕНИЕ файла
 *		// Копирование
 *		File::obj()->copy($newFilename (string), $newDir (string)); - копирование файла
 *			параметры аналогичны инициализации объекта класса
 *			При отсутствии $newDir копирование осуществляется в текущую директорию объекта класса File
 *		Пример копировани:	
 *		$res = File::obj('yyy.txt')->copy('zzz.txt', 'attachments'); - копирует файл yyy.txt из папки TMP в папку Вложений Резолют с именем zzz.txt
 *
 *		// Перемещение - совершенно аналогично копированию, но с удалением исходного файла
 *		File::obj()->move($newFilename (string), $newDir (string)); - перемещение файла
 */

class File
{
	private $dir = null; // объект класса Dir
	private $filename = '';
	
	/**
	 * Инициализация экземпляра класса
	 *
	 * @param $filename <string> - строка пути к файлу либо имя файла без пути
	 * @param $dir <string>/<instanceof Dir> - директория (объект Dir или строка пути) размещения файла
	 *
	 * @return this
	 */
	// Передается либо путь к файлу, имя файла и директория (путь/тип). Тип директории: см. класс Dir
	public function __construct($filename = null, $dir = null){
		
		// базовая установка директории, если она была передана
		if(!is_null($dir)){
			if(is_object($dir)){
				$this->dir = $dir;
			}
			else{
				$this->dir = new Dir($dir);	
			}
		}

		// уствновка имени файла и директории по переданному имени/пути
		$this->setFile($filename);

		// Если директория не указана и получить её не удалось, устанавливаем как временную папку PHP
		if(!$this->dir){
			$this->dir = new Dir('tmp');
		}

		return $this;
	}
	// Обеспечение формы вызова File::obj()->get()
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

	public function setFile($filename = null){
		if(!$filename){
			$filename = Utils::getUUID().'';
		}

		// Если имя файла содержит слэши, считаем, что путь к директории файла есть в его имени
		if(mb_strstr($filename, '/')){
			$pathInfo = pathinfo($filename);
			$dirname = self::xp($pathInfo, 'dirname');
			if($dirname){
				// если Каталог был передан отдельно, то добавляем путь к нему
				if(is_object($this->dir) && $this->getDir() != Dir::obj('tmp')->get()){
					$this->dir->addPath($dirname);	
				}
				// Если каталог не был передан, устанавливаем его из пути в имени файла
				else{
					$this->dir = new Dir($dirname.'/');
				}
			}

			// устанавливаем имя файла без каталога
			$this->filename = self::xp($pathInfo, 'basename', '');
		}
		// Иначе - устанавливаем так или иначе директорию по $dir
		else{
			$this->filename = $filename;
		}

		return $this;
	}

	public function setDir($dir = null){
		if(!$dir){
			$dir = 'tmp';
		}
		if(is_object($dir)){
			$this->dir = $dir;
		}
		else{
			$this->dir = new Dir($dir);	
		}
		
		return $this;
	}

	public function get($mode = null, $name = null){
		// чтение файла, 
		//	$mode - тип возврата: null - строкой, 'browser' - c заголовками на показ в браузере, 'upload' - c заголовками на скачивание
		//	$name - имя файла для именования в ответе в поток
		$path = $this->getPath();
		if(!is_file($path)){
			return null;
		}

		$content = file_get_contents($path);
		if(!$name){
			$name = $this->getName();	
		}

		// возврат строкой
		if(!$mode){
			return $content;
		}
		
		// открытие в браузере
		if($mode == 'browser'){
			@ $mime = mime_content_type($path);
			if($mime){
				header('Content-Type: '.$mime);
				header('Content-Disposition: inline; filename="'.$name.'"');
			}else{
				header('Content-Description: File Transfer');
				header('Content-Type: application/octet-stream');
				header('Content-Disposition: attachment; filename="'.$name.'"');
				header('Content-Transfer-Encoding: binary');
			}
			header('Expires: 0');
			header('Cache-Control: must-revalidate');
			header('Pragma: public');
			header('Content-Length: '.strlen($content));
			echo $content; 
			exit();
		}

		// скачивание в браузере
		if($mode == 'upload'){
			header('Content-Description: File Transfer');
			header('Content-Type: application/octet-stream');
			header('Content-Disposition: attachment; filename="'.$name.'"');
			header('Content-Transfer-Encoding: binary');
			header('Expires: 0');
			header('Cache-Control: must-revalidate');
			header('Pragma: public');
			header('Content-Length: '.strlen($content));
			echo $content; 
			exit();
		}

		return false;
	}

	public function read(){
		return $this->get();
	}

	public function write($content = '', $mode = 'w'){
		$path = $this->getPath();

		@ $file = fopen($path, $mode);
		if(!$file){
			return false;
		}
		fwrite($file, $content);
		fclose($file);

		return true;
	}

	public function upload($fName = 'file', $named = true){
		// загрузка из $_FILES в назначенный файл
		if(!isset($_FILES[$fName]) || !isset($_FILES[$fName]['tmp_name'])){
			return false;
		}

		if($named) {
			$this->filename = $_FILES[$fName]['name'];
		}
		
		$path = $this->getPath();
		if(!$path){
			return false;
		}

		$this->delete();
		@ move_uploaded_file($_FILES[$fName]['tmp_name'], $path);

		if(!is_file($path)){
			return false;
		}

		return true;
	}

	public function move($newFilename = null, $newDir = null){
		$path = $this->getPath();
		if(!is_file($path)){
			return null;
		}
		if(is_null($newFilename) && is_null($newDir)){
			return null;
		}

		if(is_null($newFilename)){
			$newFilename = $this->getName();
		}
		if(is_null($newDir)){
			$newDir = $this->getDir();
		}
		$newFile = new self($newFilename, $newDir);
		$newPath = $newFile->getPath();

		@ $res = rename($path, $newPath);

		return $res;
	}

	public function rename($newName = null){
		if(!$newName || !is_string($newName)){
			return null;
		}
		$path = $this->getPath();
		if(!$path || !is_file($path)){
			return null;
		}

		$this->filename = $newName;
		$newPath = $this->getPath();
		@ $res = rename($path, $newPath);

		return $res;
	}

	public function copy($newFilename = null, $newDir = null){
		$path = $this->getPath();
		if(!is_file($path)){
			return null;
		}
		if(is_null($newFilename) && is_null($newDir)){
			return null;
		}

		if(is_null($newFilename)){
			$newFilename = $this->getName();
		}
		if(is_null($newDir)){
			$newDir = $this->getDir();
		}
		$newFile = new self($newFilename, $newDir);
		$newPath = $newFile->getPath();

		@ $res = copy($path, $newPath);

		return $res;
	}

	public function delete(){
		$path = $this->getPath();
		if(is_file($path)){
			@ unlink($path);
		}
		return true;
	}

	public function exist(){
		return file_exists($this->getPath());
	}

	public function getPath(){
		$dir = $this->dir->get();
		$last = mb_substr($dir, mb_strlen($dir)-1);
		if($last != '/'){
			$dir = $dir.'/';
		}
		return $dir.$this->filename;
	}

	public function getName(){
		return $this->filename;
	}

	public function getExt(){
		if(!$this->filename || !is_string($this->filename)){
			return '';
		}
		$parts = explode('.', $this->filename);
		$l = sizeof($parts);
		if($l<2){
			return '';
		}
		$ext = $parts[$l-1];
		return $ext;
	}

	public function getDir(){
		if(!is_object($this->dir)){
			return null;
		}
		return $this->dir->get();
	}

	public function getSize(){
		$path = $this->getPath();
		if(is_file($path)){
			return filesize($path);
		}
		return null;
	}

	public function getDate(){
		$path = $this->getPath();
		if(is_file($path)){
			return filectime($path)*1000;
		}
		return null;
	}

	public function getData(){
		$path = $this->getPath();
		if(!is_file($path)){
			return null;
		}

		$data = [
			'name'	=> $this->getName(),
			'ext'	=> $this->getExt(),
			'size'	=> $this->getSize(),
			'date'	=> $this->getDate(),
			'path'	=> $path,
			'dir'	=> $this->dir->get()
		];

		return $data;
	}

	public function info(){
		return $this->getData();
	}

	private static function xp(&$o, $p = null, $def = null) {
		return Utils::xp($o, $p, $def);
	}

}
?>