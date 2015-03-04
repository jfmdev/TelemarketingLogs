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

// Create controller for projects.
teloCtrls.controller('ProjectController', function ($scope, $routeParams, $window, $location, metadataFactory, ngDialog, toastr) {
    // Get project to edit.
    $scope.entry = null;
    if($routeParams.id !== undefined && $routeParams.id !== null && $routeParams.id !== 'new') {
        // Get object from the database.
        $scope.entry = taffyDB({id: parseInt($routeParams.id, 10)}).first();
        
        // Get call rows
        $scope.calls = taffyDB({type: 'call', projectId: $scope.entry.id}).get();
    }
    
    // If no entry has been read from the database, create an empty object.
    if($scope.entry === undefined || $scope.entry === null || $scope.entry.type !== 'project') {
        $scope.entry = {};
        var columns = metadataFactory.getColumns('project');
        for(var i=0; i<columns.length; i++) {
            $scope.entry[columns[i]] = null;
        }
        $scope.entry.type = 'project';
        $scope.calls = [];
    }

    // Define behaviour for the 'add call' button.
    var parentScope = $scope;
    $scope.addCall = function(bulk) {
        // Show call form in a dialog.
        var callDialog = ngDialog.open({
            template: 'views/CallAdd.html',
            className: 'ngdialog-theme-default confirm-dialog',
            controller: function($scope, $location) {
                // Get list of clients.
                $scope.clients = taffyDB({type: 'contact'}).get();
                $scope.deadline = new Date();
                $scope.bulk = bulk;
                if(!bulk) $scope.client = $scope.clients.length > 0? $scope.clients[0].id : "";
                
                // Add the 'selected' property to the clients.
                if($scope.clients !== null && $scope.clients.length !== undefined) {
                    for(var i=0; i<$scope.clients.length; i++) $scope.clients[i].selected = false;
                }
                
                $scope.save = function() { 
                    // Add call(s) to the project (do not yet add them to the database).
                    if(!bulk) {
                        // Add call.
                        parentScope.calls.push({type: 'call', id: teloUtil.getNextId(), projectId: null, contactId: $scope.client, deadline: $scope.deadline, statusId: teloUtil.getFirstStatusId()});
                    } else {
                        // Add a call for each selected contact.
                        for(var i=0; i<$scope.clients.length; i++) {
                            if($scope.clients[i].selected) {
                                parentScope.calls.push({type: 'call', id: teloUtil.getNextId(), projectId:null, contactId: $scope.clients[i].id, deadline: $scope.deadline, statusId: teloUtil.getFirstStatusId()});
                            }
                        }
                    }
                    
                    // Update calls list.
                    parentScope.updatePrettyCalls();
                    
                    // Close dialog.
                    callDialog.close();
                };
                $scope.cancel = function() {
                    // Close dialog.
                    callDialog.close();
                };
                $scope.goToContacts = function() {
                    // Close the dialog and redirect to the contacts section.
                    $location.path('/list/contacts');
                    callDialog.close();
                };
            }
        });
    };
    
    // Define behaviour for the edit button for calls.
    $scope.editCall = function(id) {
        // TODO: Show call form in a dialog.
console.log('editCall: ' + id); // TODO: BORRAR        
    };
    
    // Define behaviour for the delete button for calls.
    $scope.deleteCall = function(id) {
        if(id !== undefined && id !== null) {
            // Ask confirmation before delete.
            var parentScope = $scope;
            var confirmDialog = ngDialog.open({
                template: 'views/ConfirmDialog.html',
                className: 'ngdialog-theme-default confirm-dialog',
                controller: function($scope) {
                    $scope.message = "Are you sure that you want to delete this call (this operation is irreversible)?";
                    $scope.acceptLabel = "Yes, delete the call";
                    $scope.cancelLabel = "No, keep the call";
                    $scope.accept = function() { 
                        // Remove call.
                        var oldList = parentScope.calls;                 
                        parentScope.calls = [];
                        for(var i=0; i<oldList.length; i++) {
                            if(oldList[i].id !== id) {
                                parentScope.calls.push(oldList[i]);
                            }
                        }
                        parentScope.updatePrettyCalls();

                        // Close dialog.
                        confirmDialog.close(); 
                    };
                    $scope.cancel = function() { confirmDialog.close(); };
                }
            });            
        }
    };
    
    // Define behaviour for the cancel button.
    $scope.cancel = function() {
        // Go back.
        $window.history.back();
    };
    
    // Define behaviour for the save button.
    $scope.save = function() {
        // Verify that the project's name is not empty.
        if($scope.entry.name === null || $scope.entry.name === '') {
            toastr.error('The project name cannot be empty', '', {closeButton: true, timeOut:2000, positionClass: 'toast-bottom-right'});
            return;
        }
        
        // Save project and calls.
        if($scope.entry.id === null || $scope.entry.id === undefined) {
            // Create project.
            $scope.entry.id = teloUtil.getNextId();
            taffyDB.insert($scope.entry);
        } else {
            // Update project.
            taffyDB({id: $scope.entry.id}).update($scope.entry);
        }
        
        // Save calls.
        try {
            taffyDB({type: 'call', projectId: $scope.entry.id}).remove();
        }catch(err) { console.log(err); }
        for(var i=0; i<$scope.calls.length; i++) {
            $scope.calls[i].projectId = $scope.entry.id;
            if($scope.calls[i].id === undefined || $scope.calls[i].id === null) $scope.calls[i].id = teloUtil.getNextId();
            taffyDB.insert($scope.calls[i]);
        }
        
        // Show success message
        toastr.success('The project has been saved', '', {closeButton: true, timeOut:2000, positionClass: 'toast-bottom-right'});
    };
    
    // Define behaviour for the delete button.
    $scope.delete = function() {
        // Ask for confirmation.
        var mainScope = $scope;
        var confirmDialog = ngDialog.open({
            template: 'views/ConfirmDialog.html',
            className: 'ngdialog-theme-default confirm-dialog',
            controller: function($scope) {
                $scope.message = 'Are you sure that you want to delete the project "'+mainScope.entry.name+'" along with all his calls?';
                $scope.acceptLabel = 'Yes, delete "' + mainScope.entry.name + '"';
                $scope.cancelLabel = "No, keep the project";
                $scope.accept = function() { 
                    // Close dialog.
                    confirmDialog.close();
                    
                    // Delete registers and go back to the project list.
                    taffyDB({type: 'project', id: mainScope.entry.id}).remove();
                    taffyDB({type: 'call', projectId: mainScope.entry.id}).remove();
                    $location.path('/');
                };
                $scope.cancel = function() { confirmDialog.close(); };
            }
        });
    };
    
    /**
     * Generates an user friendly list of call from the list saved in the database.
     */
    $scope.updatePrettyCalls = function() {
        $scope.prettyCalls = [];
        if($scope.calls !== null) {
            for(var i=0; i<$scope.calls.length; i++) {
                var call = $scope.calls[i];
                var client = taffyDB({type: 'contact', id: call.contactId}).first();
                var status = taffyDB({type: 'status', id: call.statusId}).first();          
                $scope.prettyCalls.push({
                    id: call.id,
                    contact: client.name,
                    status: status.name,
                    deadline: (call.deadline !== null? moment(call.deadline.getTime()).format("l") : null)
                });
            }
        }        
    };
    $scope.updatePrettyCalls();
});

// Create controller for the navigation var.
teloCtrls.controller('NavBarController', function ($scope, $http, $location, toastr, ngDialog) {
    $scope.file = "Untitled";
    
    // Initialization function.
    $scope.init = function() {
        // Load sample data.
        $http.get('sample.json').success(function(response) {
            teloUtil.fillDatabaseWithJson( response );
            $scope.file = "Sample";
            if(!$scope.$$phase) $scope.$apply();
        });
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

                    // Go to main view.
                    $location.path('/');
                };
                $scope.cancel = function() { confirmDialog.close(); };
            }
        });
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
            
            // Go to main view.
            $location.path('/');
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

