# Hypervote

*Live voting for the masses*

![Hypervote Logo](https://github.com/kittsville/Hypervote/raw/master/public/assets/screenshot.png)

Hypervote is a live voting system that allows people to express themselves democratically through their browsers. Users can vote to express approval, neutrality or disapproval and view those opinions on a constantly updating line graph. Hypervote allows for the simple gauging of a crowd's opinion.

Hypervote is built as a REST API using the PHP microframework [Lumen](http://lumen.laravel.com/). The front-end is a lightweight web app built from modular JavaScript components.

## Requirements

* MySQL, Postgres, SQLite or SQL Server
* Apache
* Composer

## Installation

If you're looking for any help when installing, bear in mind this uses the Lumen micro-framework so guides for setting up Lumen would be of use.

1. Download and unpack the [latest copy](https://github.com/kittsville/Hypervote/archive/master.zip) of Hypervote
2. Create a new site in Apache and set its document root to the `/public` directory
3. Create a new user and database in your chosen DBMS (e.g. MySQL). Note down the username, password and db name
4. Copy `env.example` and rename the copy `.env`
5. Open `.env` in a text editor and add in the connection details from earlier
6. Open the command line in the root of the application and run `composer install` to install all the application's dependencies
7. Run `php artisan migrate` to create the application's tables
8. You're good to go!

### Contributing

As with all my projects: forks, pull requests and bug reports are more than welcome! If you've any queries on getting Hypervote up and running on your local machine or how it works feel free to drop me an email (kittsville[at]gmail.com) or mention me on Twitter (@kittsville).

### License

Hypervote is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).
