<?php

namespace App\Http\Controllers;

use App\Vote;

class VoteController extends Controller
{
    public function getVotes() {
        return response()->json([
            'timestamp' => time(),
            'up'        => rand(0, 10),//Vote::where(['type' => 'up'])->count(),
            'down'      => rand(0, 10),//Vote::where(['type' => 'down'])->count(),
            'neutral'   => rand(0, 10),//Vote::where(['type' => 'neutral'])->count(),
        ]);
    }
}
