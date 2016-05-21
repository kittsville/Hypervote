<?php

namespace App\Http\Middleware;

use Closure;
use App\Key;
use App\Http\Controllers\KeyController;
use Illuminate\Http\Request;
use Carbon\Carbon;
use DB;

class APIKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $guard
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $guard = null)
    {
        $api_key = $request->input('api_key');
        
        if (is_null($api_key)) {
            return response()->json(['error' => 'API key required, go to "keys/new"'], 403);
        }
        
        DB::beginTransaction();
        
        $keyQuery = Key::where('api_key', $api_key)->lockForUpdate();
        
        if ($keyQuery->count() === 0) {
            return response()->json(['error' => 'API key invalid'], 403);
        }
        
        $key = $keyQuery->first();
        
        if ($key->fingerprint !== getUserFingerprint($request)) {
            return response()->json(['error' => 'API key invalid'], 403);
        }
        
        KeyController::refreshKey($key);
        
        $key->save();
        
        DB::commit();

        return $next($request);
    }
}
