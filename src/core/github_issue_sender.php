<?php
/**
 * Script PHP para crear issues en GitHub desde Nexam
 * 
 * Este script recibe datos desde la aplicación Nexam y los envía como issues a un repositorio de GitHub
 * usando un token de acceso personal.
 * 
 * Parámetros esperados:
 * - title: Título del issue
 * - body: Cuerpo del issue (descripción detallada)
 * - labels: Etiquetas separadas por comas (opcional)
 * 
 * Configuración:
 * - GITHUB_TOKEN: Token de acceso personal de GitHub
 * - GITHUB_REPO: Repositorio donde se crearán los issues (formato: usuario/repositorio)
 */

// Configuración - Debes configurar estos valores
define('GITHUB_TOKEN', $_ENV['GITHUB_TOKEN'] ?? 'TU_TOKEN_AQUI'); // Debe configurarse como variable de entorno o cambiarse aquí
define('GITHUB_REPO', $_ENV['GITHUB_REPO'] ?? 'TU_USUARIO/TU_REPOSITORIO'); // Cambiar a tu repositorio

// Permitir solicitudes desde tu frontend (ajusta según tu dominio)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar si es una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

// Leer el cuerpo de la solicitud
$input = json_decode(file_get_contents('php://input'), true);

// Validar los parámetros requeridos
if (!isset($input['title']) || !isset($input['body'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan parámetros requeridos: title y body']);
    exit();
}

$title = trim($input['title']);
$body = trim($input['body']);
$labels = isset($input['labels']) ? explode(',', $input['labels']) : [];
$assignee = $input['assignee'] ?? null;

// Validar longitud de título y cuerpo
if (strlen($title) < 1 || strlen($title) > 255) {
    http_response_code(400);
    echo json_encode(['error' => 'El título debe tener entre 1 y 255 caracteres']);
    exit();
}

if (strlen($body) < 10) {
    http_response_code(400);
    echo json_encode(['error' => 'El cuerpo del issue debe tener al menos 10 caracteres']);
    exit();
}

// Preparar los datos para el issue
$issue_data = [
    'title' => $title,
    'body' => $body,
    'labels' => $labels
];

if ($assignee) {
    $issue_data['assignee'] = $assignee;
}

// Iniciar cURL para enviar el issue a GitHub
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.github.com/repos/' . GITHUB_REPO . '/issues');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($issue_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . GITHUB_TOKEN,
    'User-Agent: Nexam-Issue-Reporter',
    'Accept: application/vnd.github.v3+json',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Verificar la respuesta de GitHub
if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al conectar con la API de GitHub']);
    exit();
}

$decoded_response = json_decode($response, true);

if ($http_code === 401) {
    http_response_code(401);
    echo json_encode(['error' => 'Token de GitHub inválido o sin permisos']);
    exit();
}

if ($http_code === 403) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado - verifique los permisos del token']);
    exit();
}

if ($http_code === 404) {
    http_response_code(404);
    echo json_encode(['error' => 'Repositorio no encontrado']);
    exit();
}

if ($http_code === 201) {
    // Éxito - Issue creado
    $issue_url = $decoded_response['html_url'] ?? 'URL no disponible';
    $issue_number = $decoded_response['number'] ?? 'Número no disponible';
    
    echo json_encode([
        'success' => true,
        'message' => 'Issue creado exitosamente',
        'issue_url' => $issue_url,
        'issue_number' => $issue_number
    ]);
} else {
    // Error - Mostrar detalles
    $error_msg = $decoded_response['message'] ?? 'Error desconocido al crear el issue';
    http_response_code($http_code);
    echo json_encode([
        'error' => 'Error al crear el issue',
        'details' => $error_msg,
        'http_code' => $http_code
    ]);
}
?>