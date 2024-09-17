<?php
/**************************************************************************
 * Формирование JS содержимого SoftMongo, @autor Daniel, 2022
 */
require_once 'includer.php';
session_start();

$content = '';

// Подключение JS-библиотек
// Фреймворк Resolute4
$content.= AutoloaderJS::getFiles(['./lib/resolute4']);

// Язык интерфейса
$lang = (new Lang())->getData('json');
$content.= "\n".'SMlang = '.$lang.';'."\n";

// Собственные JS-модули
$content.= file_get_contents('./app/init.js');
$content.= AutoloaderJS::getFiles(['./app/components']);
$content.= AutoloaderJS::getFiles(['./app/modules']);

// Login VS Application
$page = './app/app.js';
if(!Auth::logged()){
	$page = './app/login.js';
}
$content.= file_get_contents($page);

// Вывод всего подгтовленного JS-кода
ob_end_clean();
ob_start('ob_gzhandler');
echo $content;
//**************************************************************************
?>
