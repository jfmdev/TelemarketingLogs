/*
    Copyright (C) 2014 Jose F. Maldonado
    This file is part of TelemarketingLogs.

    TelemarketingLogs is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    TelemarketingLogs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with TelemarketingLogs. If not, see <http://www.gnu.org/licenses/>.
*/

// Create module for the application.
var teloApp = angular.module('teloApp', ['ngRoute', 'teloCtrls']);

// Define routes.
teloApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'SimpleListController',
            templateUrl: 'views/SimpleList.html'
        })
        .when('/list/:type', {
            controller: 'SimpleListController',
            templateUrl: 'views/SimpleList.html'
        })
        .when('/edit/:type/:id?', {
            controller: 'SimpleFormController',
            templateUrl: 'views/SimpleForm.html'
        })
        .when('/project/:id?', {
            controller: 'ProjectController',
            templateUrl: 'views/Project.html'
        })
        .when('/preferences/:flag?', {
            controller: 'PreferencesController',
            templateUrl: 'views/Preferences.html'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);


// Add listener for change of routes.
teloApp.run(function($rootScope, $location) {
    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        // Verify if the user has selected a name.
        if (!teloUtil.isUserNameDefined()) {
            // The user must choose a name, redirect to the preferences section (if this is not the current destination).
            if ( next.templateUrl !== "views/Preferences.html") {
                $location.path("/preferences/nameNeed");            
            }
        }
    });
});

// Define factory for get the metadata of each type.
teloApp.factory('metadataFactory', function() {
    var metadata = {
        user : {
            fields: ['id', 'name'],
            types: ['number', 'text'],
            plural: 'users'
        },
        result : {
            fields: ['id', 'name', 'order'],
            types: ['number', 'text', 'number'],
            plural: 'results'
        },
        status : {
            fields: ['id', 'name', 'order'],
            types: ['number', 'text', 'number'],
            plural: 'statuses'
        },
        contact  : {
            fields: ['id', 'name', 'telephone', 'cellphone', 'availability', 'active'],
            types: ['number', 'text', 'text', 'text', 'textarea', 'bool'],
            plural: 'contacts'
        },
        project  : {
            fields: ['id', 'name'],
            types: ['number', 'text'],
            plural: 'projects'
        }
    };
    
    var factory = {};
    
    /**
     * Returns the column names of a type.
     * 
     * @param {String} type The type's name.
     * @returns {Array} A list of strings.
     */
    factory.getColumns = function(type) {
        return metadata[type].fields;
    };

    /**
     * Returns the column labels of a type.
     * 
     * @param {String} type The type's name.
     * @returns {Array} A list of strings.
     */
    factory.getColumnNames = function(type) {
        var res = [];
        for(var i=0; i<metadata[type].fields.length; i++) {
            res.push(teloUtil.firstToUppercase(metadata[type].fields[i]));
        }
        return res;
    };

    /**
     * Returns the column date types of a type.
     * 
     * @param {String} type The type's name.
     * @returns {Array} A list of strings.
     */
    factory.getColumnDataTypes = function(type) {
        return metadata[type].types;
    };

    /**
     * Get the plural name of a type.
     * 
     * @param {String} type A type name.
     * @returns {String} The type's name in plural.
     */
    factory.getPlural = function(type) {
        return metadata[type].plural;
    };
    
    /**
     * Get the type of a plural name.
     * 
     * @param {String} plural The type's name in plural.
     * @returns {String} The type's name in singular.
     */
    factory.getType = function(plural) {
        var typeName = '';
        for(var type in metadata) {
            if(metadata[type].plural === plural.toLowerCase()) typeName = type;
        }
        return typeName;
    };
    
    return factory;
});

// Function executed after the page has been loaded.
angular.element(document).ready(function () {
    // TODO: Verificar si la base de datos esta vacia

    // If the database is empty, add default data.
    if(teloUtil.isUserNameDefined()) taffyDB.insert({id: teloUtil.getNextId(), type: 'user', name: amplify.store("username")});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'status', order: 1, name: 'Pending'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'status', order: 2, name: 'Done'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'status', order: 3, name: 'Cancelled'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'result', order: 1, name: 'Success'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'result', order: 2, name: 'Failure'});
});