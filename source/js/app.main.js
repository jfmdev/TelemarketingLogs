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
            controller: 'ProjectsController',
            templateUrl: 'views/Projects.html'
        })
        .when('/list/:type', {
            controller: 'SimpleListController',
            templateUrl: 'views/SimpleList.html'
        })
        .when('/edit/:type/:id?', {
            controller: 'SimpleFormController',
            templateUrl: 'views/SimpleForm.html'
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