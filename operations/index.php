<?php
/**************************************************************************
 * Основная точка входа запросов от клиентской части
 */
require_once '../includer.php';
header('Content-Type: text/html; charset=utf-8');

if(!session_id()){
	session_start();
}
//**************************************************************************
// Получение параметров запроса
$operation = Utils::getPostParam('operation');
if(!$operation){
	exit;
}

$data = Utils::getPostParam('data');
$quoted = Utils::getPostParam('quoted');
if($quoted){
	$data = str_replace("'", '"', $data);
}
if(is_string($data) && strstr($data, '{')){
	$data = json_decode($data, true);
}

// Вычисление класса-функции
$operationAr = explode('.', $operation);
$class = $operationAr[0];
$function = isset($operationAr[1])?$operationAr[1]:'get';

// Проверка сессии
$freeOperations = ['Auth.login', 'Lang.change'];
if(!in_array($operation, $freeOperations) && !Auth::logged()){
	exit('{"success":false, "error":"noAuth"}');
}

// Обращение к классу-функции запроса
$result = null;
if(class_exists($class) && is_callable([$class, $function])){
	$result = call_user_func_array([$class, $function], [$data]);
}
if(!$result || !isset($result['success'])){
	$result = ['success'=>true, 'data'=>$result];
}

// Формирование ответа
$res = json_encode($result, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
if(!$res){
	echo '{success:false, data:null}';
	exit;
}

echo $res;
//**************************************************************************
?>