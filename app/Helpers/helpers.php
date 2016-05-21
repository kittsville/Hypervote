<?php

use Illuminate\Http\Request;

/**
 * Generates unique fingerprint for user
 *
 * I'm gambling Andrea won't figure out how terrible this
 * fingerprinting is until the AGM is already over.
 * Seriously, look at how bad it is.
 *
 * @param  \Illuminate\Http\Request  $request
 * @return String                    $fingerprint
 */
function getUserFingerprint(Request $request) {
    return hash('sha256',
        env('APP_SALT', '') . 
        '|' . $request->server('SERVER_NAME') .
        '|' . $request->server('HTTP_USER_AGENT') .
        '|' . $request->ip()
    );
}

/**
 * Converts SQL date/time string into Unix timestamp
 * String $string
 */
function getTimestamp($string) {
    return (new \DateTime($string))->getTimestamp();
}