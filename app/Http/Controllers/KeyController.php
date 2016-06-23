<?php

namespace App\Http\Controllers;

use App\Vote;
use App\Key;
use DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class KeyController extends Controller
{
    public function newKey(Request $request)
    {
        $keyFingerprint = getUserFingerprint($request);
        
        try {
            DB::beginTransaction();
            
            Key::where('fingerprint', $keyFingerprint)->delete();
            
            $key = new Key;
            
            $key->fingerprint = $keyFingerprint;
            $key->api_key     = hash('sha256', openssl_random_pseudo_bytes(64));
            
            $key->expires_at  = KeyController::getExpiresAt();
            
            $saved = $key->save();
            
            DB::commit();
        } catch (\PDOException $e) {
            DB::rollBack();
            
            $saved = false;
        }
        
        if ($saved) {
            return response()->json(['key' => $key->api_key], 201);
        } else {
            return response()->json(['error' => 'Failed to create API key'], 500);
        }
    }
    
    public function derp()
    {
        return 'Hello';
    }
    
    /**
     * Checks the validity of the given API key
     * @param String $apiKey API key
     */
    public function getKey(Request $request, $apiKey)
    {
        if (strlen($apiKey) !== 64) {
            return response()->json(['error' => 'Invalid API Key. All keys are 64 characters long.'], 400);
        }
        
        if (preg_replace("/[^A-Za-z0-9]/", '', $apiKey) !== $apiKey) {
            return response()->json(['error' => 'Invalid API Key. Keys contain only alphanumeric symbols (a-Z and 0-9)'], 400);
        }
        
        $keyQuery = Key::where('api_key', $apiKey);
        
        if ($keyQuery->count() === 0) {
            return response()->json(['error' => 'Key not found. Perhaps it expired?'], 404);
        }
        
        $key = $keyQuery->first();
        
        if ($key->fingerprint !== getUserFingerprint($request)) {
            return response()->json(['error' => 'You are not permitted to use this key'], 403);
        }
        
        $this->refreshKey($key);
        
        $key->save();
        
        return response()->json([
            'key'       => $key->api_key,
            'created'   => $key->created_at->timestamp,
            'last_used' => $key->updated_at->timestamp,
            'expires'   => getTimestamp($key->expires_at),
        ]);
    }
    
    /**
     * Updates an API key's expiry date, allowing it to be valid for 30 more minutes
     * Doesn't save() the $key to the db
     * @param Key $key Instance
     */
    public static function refreshKey(Key $key)
    {
        $key->expires_at = KeyController::getExpiresAt();
        
        return $key;
    }
    
    /**
     * Gets the date an API key just created/refreshed would expire at
     */
    public static function getExpiresAt()
    {
        $timeToExpire = env('KEY_VALID_FOR', 30);
        
        return Carbon::now()->addMinutes($timeToExpire);
    }
    
    /**
     * Deletes any users who's expiry time has past
     * @return void
     */
    public static function cleanupExpiredUsers()
    {
        DB::transaction(function()
        {
            $cleanup_date = Carbon::now()->toDateTimeString();
            
            // Can't use 'whereDate' because it doesn't provide seconds precision
            User::where('expires_at', '<=', $cleanup_date)->delete();
        });
    }
}
