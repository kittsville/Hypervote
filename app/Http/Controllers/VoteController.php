<?php

namespace App\Http\Controllers;

use App\Vote;
use App\Key;
use DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VoteController extends Controller
{
    public function getVotes() {
        $this->cleanupExpiredVotes();
        
        return response()->json([
            'timestamp'  => time(),
            'approve'    => Vote::where(['type' => 'approve'])->count(),
            'disapprove' => Vote::where(['type' => 'disapprove'])->count(),
            'neutral'    => Vote::where(['type' => 'neutral'])->count(),
        ]);
    }
    
    public function vote(Request $request, $voteType) {
        $voteTypes = ['approve', 'neutral', 'disapprove'];
        
        if (!in_array($voteType, $voteTypes)) {
            return response()->json(['error' => 'Vote type does not exist'], 400);
        }
        
        try {
            DB::beginTransaction();
            
            $key = Key::where('api_key', $request->input('api_key'))->firstOrFail();
            
            $key->vote()->delete();
            
            $vote = new Vote([
                'type'       => $voteType,
                'expires_at' => $this->getExpiresAt(),
            ]);
            
            $key->vote()->save($vote);
            
            DB::commit();
        } catch (\PDOException $e) {
            DB::rollBack();
            
            return response()->json(['error' => 'Oh noes! Something went wrong.'], 500);
        }
        
        return response()->json([
            'type'    => $voteType,
            'created' => $vote->created_at->timestamp,
            'expires' => getTimestamp($vote->expires_at),
        ], 201);
    }
    
    /**
     * Gets the date a vote created/refreshed would expire at
     */
    private function getExpiresAt()
    {
        $timeToExpire = env('VOTE_VALID_FOR', 60);
        
        return Carbon::now()->addSeconds($timeToExpire);
    }
    
    /**
     * Deletes any votes who's expiry time has past
     * @return void
     */
    private function cleanupExpiredVotes()
    {
        DB::transaction(function()
        {
            $cleanup_date = Carbon::now()->toDateTimeString();
            
            // Can't use 'whereDate' because it doesn't provide seconds precision
            Vote::where('expires_at', '<=', $cleanup_date)->delete();
        });
    }
}
