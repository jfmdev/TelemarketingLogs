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

// Create module for the controllers.
var teloCtrls = angular.module('teloCtrls', ['ngAnimate', 'toastr']);

// Create controller for projects.
teloCtrls.controller('ProjectsController', function ($scope) {
            
});

// Create controller for the navigation var.
teloCtrls.controller('NavBarController', function ($scope) {
    $scope.file = "Untitled";
});

// Create controller for simple lists.
teloCtrls.controller('SimpleListController', function ($scope, $routeParams) {
    // Define type, title and columns.
    $scope.type = $routeParams.type === 'results'? 'result' : ($routeParams.type === 'users'? 'user' : 'status');
    $scope.title = teloUtil.firstToUppercase($routeParams.type);
    $scope.columns = ['id', 'name'];
    if($scope.type !== 'user') $scope.columns.push('order');
    
    // Get rows.
    $scope.rows = taffyDB({type: $scope.type}).get();
});

// Create controller for simple forms.
teloCtrls.controller('SimpleFormController', function ($scope) {
            
});

// Create controller for preferences.
teloCtrls.controller('PreferencesController', function ($scope, $routeParams, $location, toastr) {
    // Verify if the warning must be show.
    $scope.showWarning = !teloUtil.isUserNameDefined() && $routeParams.flag === 'nameNeed';
    
    // Initialize variables related to the success message.
    $scope.showSuccess = false;
    
    // Initialize preferences.
    $scope.prefs = {
        name: teloUtil.getUserName()
    };
    
    // Define autocomplete values for the name field.
    // TODO: http://ngmodules.org/modules/ngAutocomplete
    
    // Define action for submit the form.
    $scope.save = function() {
        // Save the user name.
        teloUtil.setUserName($scope.prefs.name);
        
        // Show success message.
        toastr.success('Your preferences have been updated', '', {closeButton: true, timeOut:2000});

        // Verify if the user was redirected for having an empty username.
        if($routeParams.flag === 'nameNeed') {
            // Verify if the user put a name.
            if(teloUtil.isUserNameDefined()) {
                // Redirect to original section.
                $location.path("/");
            }
        }
    };
});

