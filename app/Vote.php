<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    protected $table = 'vote';
    public $timestamps = true;
    protected $fillable = array('type', 'expires_at');
    
    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['created_at', 'updated_at', 'deleted_at'];
    
    public function key()
    {
        return $this->belongsTo('App\Key');
    }
}
