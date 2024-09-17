# Resolute SoftMongo
> The MongoDB client user interface, created in PHP

## General information
Resolute SoftMongo is a client/server WEB application written in PHP and Resolute JS frameworks, providing an ergonomic user interface for connecting and working with document-oriented MongoDB databases. The application is intended primarily for IT specialists and is the ideological successor of RockMongo and a competitor of MongoDBCompas.

## Authorization (logging in SoftMongo)
Access and authorization in the SoftMongo interface is configured in a file authorize.cfg.php.
Authorization is provided by the login and password of the application user and an optional secret GET parameter.

## Configuring connection to MongoDB servers
SoftMongo allows you to set up multiple connections to different MongoDB servers. 
The connections are described in the file connect.cfg.php , configuration format:
````
$connections = [
	[
		'name' => 'the server name displayed in softMongo',
		'link' => 'connection string in MongoDB format',
		'dbase' => 'DB name',
		'options' => []
	]
];
````
> A more detailed description in the file connect.cfg.php.

## A brief description of the program's features
An authorized SoftMongo user gets the opportunity to select a MongoDB server from the list of servers to which connections are configured in connect.cfg.php. Then select the database on the server and then work with the database collections and collection records.

Subsequently, SoftMongo automatically opens immediately the database that the user was working with for the last time. Information about this is stored in the session cookie.

### Navigate through connected servers, databases, and collections
The connected servers selection section opens when you log in to the program, if a previous SoftMongo session has not been saved on the PC, and you can always get to this section by clicking on the "Servers" button at the top of the interface.

In the same place, at the top of the interface, there is a "Databases" button, which opens the database selection page for the current server.
The selection of the current database is also available in the drop-down list in the upper left area of the interface: above the collections navigation block.

Next to the name of the current database there is a button for getting general information about the database: a section showing resource statistics, the number and list of database collections.

### Working with collections and collection records
The Collections navigation area allows you to select the current collection for further work with it. The list of database collections displayed in this area can be filtered for easier navigation.

Basic collection work allows you to create collections, delete them, clear, import, export collection records, add new records and edit existing ones. 

The main area of work with collection records allows you to query any structure for a collection. Including a request to update or delete records selected according to a specified selection condition.

In the collection's record viewer section, a request to retrieve all records is used by default.

The result of the query execution is visualized in the central part of the interface in the form of blocks for each record. These are interactive blocks for working with the JSON record structure. in which a menu of actions with this node is available for each node of the structure. The menu is called by clicking on the node name and then on the menu icon.

#### Export and import of collection records
SoftMongo allows you to export and import records from one or more collections to/from a text file generated using the SoftMongo format. The file contains, in fact, "insert" instructions for each entry. When working with export and import, it is important to remember that the format is unique for SoftMongo, that is, you can export and import only from SoftMongo d SoftMongo. Exporting from third-party programs is not supported.

#### Indexing collections
The program allows you to create indexes, including, with respect to uniqueness at the database level, for any set of fields. You can work with indexes either by selecting the appropriate menu item of the collection, or an item similar to the menu of the record node.

### Aggregation
In the collection menu there is an "Aggregation" item with a module that allows you to create any pipeline of aggregation stages supported by MongoDB installed on the current server version. The description of the aggregation steps can be saved as JSON or files and uploaded as a file or JSON instructions. The result of the aggregation operation can be exported in SoftMongo format.

> (с) 2024 Daniel Vasiliev, Vitaly Krylov 