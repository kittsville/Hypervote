<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

use Illuminate\Http\Request;

$app->get('/', function () use ($app) {
    return 'How did you get here?';
});

$app->group(['prefix' => '/api/v1','namespace' => 'App\Http\Controllers'], function () use ($app) {
    $app->get('keys', function () {
        return response()->json(['error' => 'Nothing to see here'], 501);
    });
    
    $app->post('keys/new',   'KeyController@newKey');
    $app->get('keys/{key}', 'KeyController@getKey');
    
    $app->get('votes', 'VoteController@getVotes');
    $app->post('votes/{voteType}', [
        'middleware' => 'api',
        'uses'       => 'VoteController@vote',
    ]);
});
