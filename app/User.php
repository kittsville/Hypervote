<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'user';
    public $timestamps = true;
    
    public function vote()
    {
        return $this->hasOne('App\Vote');
    }
}
