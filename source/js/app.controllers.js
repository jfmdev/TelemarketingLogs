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
var teloCtrls = angular.module('teloCtrls', ['ngAnimate', 'ngDialog', 'toastr', 'autocomplete', 'ngQuickDate']);

// Create controller for the navigation var.
teloCtrls.controller('NavBarController', function ($scope, $http, $location, $route, toastr, ngDialog) {
    $scope.file = "Untitled";
    
    // Initialization function.
    $scope.init = function() {
        // Verify if a backup was saved.
        var backup = amplify.store("backup");
        if(backup !== null) {
            try{
                // Restore backup.
                teloUtil.fillDatabaseWithJson(backup);
            }catch(e) {
                backup = null;
                console.log(e);
            }
        } 
        
        if(backup === null) {
            // Load sample data.
            $http.get('sample.json').success(function(response) {
                teloUtil.fillDatabaseWithJson( response );
                $scope.file = "Sample";
                if(!$scope.$$phase) $scope.$apply();
            });
        }
    };
    
    // Clean the database.
    $scope.clean = function() {
        // Ask for confirmation.
        var confirmDialog = ngDialog.open({
            template: 'views/ConfirmDialog.html',
            className: 'ngdialog-theme-default confirm-dialog',
            controller: function($scope) {
                $scope.message = "Are you sure that you want to create a new file (all the current information is going to be lost)?";
                $scope.acceptLabel = "Yes, create a new file";
                $scope.cancelLabel = "No, keep current data";
                $scope.accept = function() { 
                    // Close dialog.
                    confirmDialog.close(); 

                    // Clean database and file's name. 
                    $scope.file = "Untitled";
                    teloUtil.cleanDB();

                    // Show message.
                    toastr.success('The database has been cleaned', '', {closeButton: true, timeOut:2000, positionClass: 'toast-bottom-right'});

                    // Reload current view.
                    $route.reload();
                };
                $scope.cancel = function() { confirmDialog.close(); };
            }
        });
    };

    // Display the help.
    $scope.help = function() {
        introJs().start();
    };
    
    // Export all data to a file.
    $scope.downloadData = function() {
        var blob = new Blob([JSON.stringify( taffyDB().get() )], {type: "text/plain;charset=utf-8"});
        var filename = $scope.file.indexOf('.tml') < 0? $scope.file + '.tml' : $scope.file;
        saveAs(blob, filename);
    };
    
    // Import a local file.
    $scope.importLocal = function() {
        // Ask for confirmation.
        var confirmDialog = ngDialog.open({
            template: 'views/ConfirmDialog.html',
            className: 'ngdialog-theme-default confirm-dialog',
            controller: function($scope) {
                $scope.message = "Are you sure that you want to open a file (all the current information is going to be lost)?";
                $scope.acceptLabel = "Yes, open a file";
                $scope.cancelLabel = "No, keep current data";
                $scope.accept = function() { 
                    // Close dialog.
                    confirmDialog.close();
                    
                    // Trigger click event on input file element.
                    angular.element('#file_import').trigger('click');
                };
                $scope.cancel = function() { confirmDialog.close(); };
            }
        });
    };
    
    // Actions for when a file has been read.
    $scope.fileRead = function(res, name) {
        // Verify if the read was a success or a failure.
        if(res) {
            // Update file name.
            if(name !== undefined && name !== null) $scope.file = name;
            
            // Show toast message.
            toastr.success('The file has been opened', '', {closeButton: true, timeOut:2000, positionClass: 'toast-bottom-right'});
            
            // Reload current view.
            $route.reload();
        } else {
            // Show an error message.
            toastr.error('The file could not be opened', '', {closeButton: true, timeOut:2000, positionClass: 'toast-bottom-right'});
        }
    };
    
    // Add event for read the file selected.
    document.getElementById('file_import').addEventListener('change', function(evt) { teloUtil.readFile(evt, $scope.fileRead ); }, false);
});

// Create controller for simple lists.
teloCtrls.controller('SimpleListController', function ($scope, $routeParams, metadataFactory) {
    // Define type, title and columns.
    $scope.type = 'project';
    if($routeParams.type !== undefined && $routeParams.type !== null) {
        $scope.type = metadataFactory.getType($routeParams.type);
    }
    $scope.title = teloUtil.firstToUppercase(metadataFactory.getPlural($scope.type));
    $scope.columns = metadataFactory.getColumns($scope.type);
    $scope.datatypes = metadataFactory.getColumnDataTypes($scope.type);
    $scope.labels = metadataFactory.getColumnNames($scope.type);
    $scope.predicate = $scope.columns.indexOf('order') < 0? "name" : 'order';
    $scope.baseEditUrl = $scope.type !== 'project'? "#/edit/" + $scope.type : "#/project";
    
    // Get rows.
    $scope.rows = taffyDB({type: $scope.type}).get();
});

// Create controller for simple forms.
teloCtrls.controller('SimpleFormController', function ($scope, $routeParams, $window, $location, metadataFactory, ngDialog) {
    // Get row to edit.
    $scope.entry = null;
    if($routeParams.id !== undefined && $routeParams.id !== null && $routeParams.id !== 'new') {
        // Get object from the database.
        $scope.entry = taffyDB({id: parseInt($routeParams.id, 10)}).first();
    }
    
    // If no entry has been read from the database, create an empty object.
    if($scope.entry === undefined || $scope.entry === null) {
        $scope.entry = {};
        var columns = metadataFactory.getColumns($routeParams.type);
        for(var i=0; i<columns.length; i++) {
            $scope.entry[columns[i]] = null;
        }
        $scope.entry.type = $routeParams.type;
    }

    // Define labels and fields.
    $scope.title = teloUtil.firstToUppercase($routeParams.type);
    $scope.columns = metadataFactory.getColumns($routeParams.type);
    $scope.labels = metadataFactory.getColumnNames($routeParams.type);
    $scope.datatypes = metadataFactory.getColumnDataTypes($routeParams.type);
    $scope.canBeDeleted = teloUtil.canBeDeleted($scope.entry);
    
    // Define behaviour for the cancel button.
    $scope.cancel = function() {
        $window.history.back();
    };
    
    // Define behaviour for the save button.
    $scope.save = function() {
        if($scope.entry.id === null || $scope.entry.id === undefined) {
            $scope.entry.id = teloUtil.getNextId();
            taffyDB.insert($scope.entry);
        } else {
            taffyDB({id: $scope.entry.id}).update($scope.entry);
        }
        $location.path("/list/" + metadataFactory.getPlural($scope.entry.type));
    };
    
    // Define behaviour for the delete button.
    $scope.delete = function() {
        // Ask for confirmation.
        var mainScope = $scope;
        var confirmDialog = ngDialog.open({
            template: 'views/ConfirmDialog.html',
            className: 'ngdialog-theme-default confirm-dialog',
            controller: function($scope) {
                $scope.message = 'Are you sure that you want to delete the ' + mainScope.entry.type + ' "'+mainScope.entry.name+'"?';
                $scope.acceptLabel = 'Yes, delete "' + mainScope.entry.name + '"';
                $scope.cancelLabel = "No, keep the " + mainScope.entry.type;
                $scope.accept = function() { 
                    // Close dialog.
                    confirmDialog.close();
                    
                    // Delete register and go back to the list.
                    taffyDB({id: mainScope.entry.id}).remove();
                    $location.path("/list/" + metadataFactory.getPlural(mainScope.entry.type));
                };
                $scope.cancel = function() { confirmDialog.close(); };
            }
        });
    };
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
    
    // Get list of users (for the autocomplete input).
    $scope.users = taffyDB({type: 'user'}).select("name");
    
    // Define action for submit the form.
    $scope.save = function() {
        // Save the user name.
        teloUtil.setUserName($scope.prefs.name);
        
        // Show success message.
        toastr.success('Your preferences have been updated', '', {closeButton: true, timeOut:2000, positionClass: 'toast-bottom-right'});

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

