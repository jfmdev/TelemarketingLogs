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

// Create controller for projects.
teloCtrls.controller('ProjectViewController', function ($scope, $routeParams, $window, $location, metadataFactory, ngDialog, toastr) {
    // Get project to edit.
    $scope.entry = null;
    if($routeParams.id !== undefined && $routeParams.id !== null && $routeParams.id !== 'new') {
        // Get object from the database.
        $scope.entry = taffyDB({id: parseInt($routeParams.id, 10)}).first();
        
        // Get call rows (clone the array in order to avoid bugs when doing a push over the array).
        var callsAux = taffyDB({type: 'call', projectId: $scope.entry.id}).get();
        $scope.calls = callsAux.slice(0);
    }
    
    // If no entry has been read from the database, return to the list of projectst.
    if($scope.entry === undefined || $scope.entry === null || $scope.entry.type !== 'project') {
        $location.path('/');
    }

});