<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Key extends Model
{
    protected $table = 'key';
    public $timestamps = true;
    
    public function vote()
    {
        return $this->hasOne('App\Vote');
    }
}
