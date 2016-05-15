<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    protected $table = 'votes';
    public $timestamps = true;
    
    public function user()
    {
        return $this->hasOne('App\User');
    }
}
