<?php

/** КЛАСС ФУНКЦИЙ ДЛЯ ОБЕСПЕЧЕНИЯ АВТОПОДКЛЮЧЕНИЯ JS-файлов
  *	@autor Daniel, 2019
  * (c) Resolute Insurance
  */

class AutoloaderJS
{
	const FICHFOLDER = 'resolute/'; // далее /<Fich>
	const EXTS = ['js','json'];
	/**
	 * Основная функция получения файлов JS для подключения
	 * @return
	 *	текст содержимого всех подключаемых файлов
	 */
	public static function getFiles($folders = [], $separator = PHP_EOL, $exceptFiles = []){
		$result = '';
		$filesList = [];

		if(!$folders || !is_array($folders) || empty($folders)){
			return '';
		}

		// Получение списка файлов по массиву директорий
		foreach ($folders as $folderUrl) {
			if(!is_dir($folderUrl)){
				continue;
			}

			$files = self::getDirFiles($folderUrl);
			if($files && is_array($files) && !empty($files)){
				$filesList = array_merge($filesList, $files);
			}
		}

		// чтение файлов по списку
		foreach ($filesList as $fileName) {
			if(file_exists($fileName) && !in_array($fileName, $exceptFiles)){
				$content = file_get_contents($fileName);
				if($content){
					$result.=$separator.$separator.'/* begin of ['.$fileName.'] */'.$separator;
					$result.=$content.$separator;
					$result.='/* end of ['.$fileName.'] */'.$separator;
				}				
			}
		}

		return $result;		
	}

	/**
	 * Функция получения Фишек типа Рендереров и Vtype'ов
	 * @return
	 *	текст содержимого для подключения в application.php
	 */
	public static function getFiches($type = null){
		$result = '';
		if(!$type || !is_string($type)){
			return $result;
		}

		$coreFolder = self::FICHFOLDER.'core/'.$type;
		$customerFolder = self::FICHFOLDER.'customer/'.$type;
		$folders = [$coreFolder,$customerFolder];

		// получаем скрипт инициализации "фишек", если его нет, то и делать больше нечего
		$initFile = self::FICHFOLDER.'core/'.$type.'/__init.js';
		$initContent = null;
		if(file_exists($initFile)){
			$initContent = file_get_contents($initFile);
		}
		if(!$initContent){
			return $result;
		}

		// получаем список объектов "фишек" через запятую
		$sep = ','.PHP_EOL;
		$fiches = self::getFiles($folders, $sep, [$initFile]);
		if(!$fiches){
			return $result;
		}

		// оборачиваем в массив
		$FichesArray = 'Resolute.cache.'.$type.' = ['.PHP_EOL;
		$FichesArray.= $fiches;
		$FichesArray.= '];'.PHP_EOL;

		// собираем результат воедино
		$result = $FichesArray.PHP_EOL.$initContent.PHP_EOL;

		return $result;
	}

	/** Функция получения массива путей файлов внутри директории (по всем вложенным директориям)
	 */
	public static function getDirFiles($dir, $list = []){
		$result = [];
		if(!$dir || !is_dir($dir)){
			return false;
		}

		// добавить "/" к пути директории, если его там нет
		$l = mb_strlen($dir);
		$last = substr($dir, $l-1);
		if($last!='/'){
			$dir.='/';
		}

		// цикл чтения содержимого директории
		$list = scandir($dir);
		$dirs = [];
		foreach ($list as $name) {
			if($name=='.' || $name=='..'){
				continue;
			}

			$type = filetype($dir.$name);

			// вложенная директория 
			if($type=='dir'){
				$dirs[]=$dir.$name.'/';
			}
			// файл
			else if($type=='file'){
				// проверка соответствия расширения
				$ext = self::getExt($name);
				if(in_array($ext, self::EXTS)){
					$result[]=$dir.$name;
				}
			}
		}

		foreach ($dirs as $d) {
			$res = self::getDirFiles($d, $result);
			if($res){
				$result = array_merge($result, $res);
			}
		}

		return $result;
	}

	private static function getExt($fileName = ''){
		$arr = explode('.', $fileName);
		$arrL = sizeof($arr);
		$ext = isset($arr[$arrL-1])?$arr[$arrL-1]:null;
		return $ext;
	}

	private static function xp(&$o, $p=null, $def=null) {
		return ArrayUtils::getVal($o, $p, $def,  array('earlyReturnPrimitive' => true));
	}
}
?>