<?php
class S3 {

    /**
     * Get upload POST parameters for form uploads
     *
     * @param string $bucket Bucket name
     * @param string $uriPrefix Object URI prefix
     * @param constant $acl ACL constant
     * @param integer $lifetime Lifetime in seconds
     * @param integer $maxFileSize Maximum filesize in bytes (default 5MB)
     * @param string $successRedirect Redirect URL or 200 / 201 status code
     * @param array $amzHeaders Array of x-amz-meta-* headers
     * @param array $headers Array of request headers or content type as a string
     * @param boolean $flashVars Includes additional "Filename" variable posted by Flash
     * @return object
     */
    public static function getHttpUploadPostParams($access_key, $secret_key, $bucket, $uriPrefix = '', $acl = self::ACL_PRIVATE, $lifetime = 3600, $maxFileSize = 5242880, $successRedirect = "201", $amzHeaders = array(), $headers = array(), $flashVars = false)
    {
        // Create policy object
        $policy = new stdClass;
        $policy->expiration = gmdate('Y-m-d\TH:i:s\Z', (time() + $lifetime));
        $policy->conditions = array();
        $obj = new stdClass;
        $obj->bucket = $bucket;
        array_push($policy->conditions, $obj);
        $obj = new stdClass;
        $obj->acl = $acl;
        array_push($policy->conditions, $obj);

        $obj = new stdClass; // 200 for non-redirect uploads
        if (is_numeric($successRedirect) && in_array((int) $successRedirect, array(200, 201)))
            $obj->success_action_status = (string) $successRedirect;
        else // URL
            $obj->success_action_redirect = $successRedirect;
        array_push($policy->conditions, $obj);

        array_push($policy->conditions, array('starts-with', '$key', $uriPrefix));
        if ($flashVars)
            array_push($policy->conditions, array('starts-with', '$Filename', ''));
        foreach (array_keys($headers) as $headerKey)
            array_push($policy->conditions, array('starts-with', '$' . $headerKey, ''));
        foreach ($amzHeaders as $headerKey => $headerVal)
        {
            $obj = new stdClass;
            $obj->{$headerKey} = (string) $headerVal;
            array_push($policy->conditions, $obj);
        }
        array_push($policy->conditions, array('content-length-range', 0, $maxFileSize));
        $policy = base64_encode(str_replace('\/', '/', json_encode($policy)));

        // Create parameters
        $params = new stdClass;
        $params->AWSAccessKeyId = $access_key;
        $params->key = $uriPrefix . '${filename}';
        $params->acl = $acl;
        $params->policy = $policy;
        unset($policy);
        $params->signature = self::__getHash($secret_key, $params->policy);
        if (is_numeric($successRedirect) && in_array((int) $successRedirect, array(200, 201)))
            $params->success_action_status = (string) $successRedirect;
        else
            $params->success_action_redirect = $successRedirect;
        foreach ($headers as $headerKey => $headerVal)
            $params->{$headerKey} = (string) $headerVal;
        foreach ($amzHeaders as $headerKey => $headerVal)
            $params->{$headerKey} = (string) $headerVal;
        return $params;
    }

    /**
     * Creates a HMAC-SHA1 hash
     *
     * This uses the hash extension if loaded
     *
     * @internal Used by __getSignature()
     * @param string $string String to sign
     * @return string
     */
    private static function __getHash($secret_key, $policy)
    {
        return base64_encode(extension_loaded('hash') ?
                        hash_hmac('sha1', $policy, $secret_key, true) : pack('H*', sha1(
                                        (str_pad($secret_key, 64, chr(0x00)) ^ (str_repeat(chr(0x5c), 64))) .
                                        pack('H*', sha1((str_pad($secret_key, 64, chr(0x00)) ^
                                                        (str_repeat(chr(0x36), 64))) . $policy)))));
    }

}