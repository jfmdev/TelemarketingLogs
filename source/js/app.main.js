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
var teleLogsApp = angular.module('teleLogsApp', ['ngRoute', 'teleLogsCtrls']);

// Define routes.
teleLogsApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'ProjectsController',
            templateUrl: 'views/Projects.html'
        })
        .when('/preferences/', {
            controller: 'PreferencesController',
            templateUrl: 'views/Preferences.html'
        })
        .when('/preferences/:flag', {
            controller: 'PreferencesController',
            templateUrl: 'views/Preferences.html'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);


// Add listener for change of routes.
teleLogsApp.run(function($rootScope, $location) {
    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        // Verify if the user has selected a name.
        if (!teleLogsUtil.isUserNameDefined()) {
            // The user must choose a name, redirect to the preferences section (if this is not the current destination).
            if ( next.templateUrl !== "views/Preferences.html") {
                $location.path("/preferences/nameNeed");            
            }
        }
    });
});
