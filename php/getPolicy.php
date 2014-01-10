<?php
// Look, clean up any request variables
$s3           = array();
$bytes        = (isset($_GET['fs']) && is_numeric($_GET['fs'])) ? trim(urldecode($_GET['fs'])) : 0;
$content_type = (isset($_GET['ct']) && ! empty($_GET['ct'])) ? array('Content-Type' => trim(urldecode($_GET['ct']))) : array();
$acl          = (isset($_GET['acl']) && ! empty($_GET['acl'])) ? strtolower(trim(urldecode($_GET['acl']))) : 'public-read';

// Check request
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest' && $bytes > 0 && file_exists('config.php')) {

    // Include S3 Library
    // Include the config
    include_once 'S3.php';
    include_once 'config.php';

    $s3          = S3::getHttpUploadPostParams($access_key, $secret_key, $bucket, '', $acl, 3600, $bytes, '201', array(), $content_type);
    $s3->bucket  = $bucket;
    $s3->cdn_url = $cdn_url;
}

// Print JSON
header('Content-Type: application/json');
print json_encode($s3);