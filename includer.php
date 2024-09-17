<?php
//**************************************************************************
@ini_set( 'upload_max_size' , '256M' );
@ini_set( 'post_max_size', '256M');
@ini_set( 'max_execution_time', '300' );

if(is_file('authorize.custom.php') || is_file('../authorize.custom.php')){
	require_once 'authorize.custom.php';
}else{
	require_once 'authorize.cfg.php';
}
if(!defined('SM_LOGIN') || !defined('SM_PASSWORD')){
	require_once 'authorize.cfg.php';
}

if(is_file('connect.custom.php') || is_file('../connect.custom.php')){
	require_once 'connect.custom.php';
}else{
	require_once 'connect.cfg.php';
}
if(!defined('SM_CONNECTIONS')){
	require_once 'connect.cfg.php';
}
/***************************************************************************
 * Подключение PHP-классов
 */

// Текущая глубина относительно корня
$baseDir = str_replace($_SERVER['DOCUMENT_ROOT'], '', __DIR__);
$deepDir = str_replace($baseDir, '', $_SERVER['REQUEST_URI']);
$deepA = explode('/', $deepDir);
$deep = sizeof($deepA) - 1;
$root = '';
for ($i = 1; $i < $deep; $i++) { 
	$root.='../';
}
if(!$root) {
	$root = './';
}

// Подключение классов
function loadClasses($dir = ''){
	$loaded = [];
	if($dir && is_dir($dir)){
		$list = scandir($dir, SCANDIR_SORT_ASCENDING);
		foreach ($list as $filename) {
			if($filename == '.' || $filename == '..' || !mb_strstr($filename, '.php')){
				continue;
			}
			$file = $dir.$filename;
			if (is_file($file) && is_readable($file)) {
				require_once $file;
				$loaded[] = $file;
			}
		}
	}

	return $loaded;
}

loadClasses($root.'classes/');
//**************************************************************************
?>
