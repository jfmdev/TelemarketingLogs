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
teloCtrls.controller('ProjectController', function ($scope, $routeParams, $window, $location, metadataFactory, ngDialog, toastr) {
    // Get project to edit.
    $scope.entry = null;
    if($routeParams.id !== undefined && $routeParams.id !== null && $routeParams.id !== 'new') {
        // Get object from the database.
        $scope.entry = taffyDB({id: parseInt($routeParams.id, 10)}).first();
        
        // Get call rows (clone the array in order to avoid bugs when doing a push over the array).
        var callsAux = taffyDB({type: 'call', projectId: $scope.entry.id}).get();
        $scope.calls = callsAux.slice(0);
    }
    
    // Initialize flags.
    $scope.changesMade = false;
    
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

    // Method invoked when the KeyUp event is triggered in the field for enter the project name.
    $scope.projectNameModified = function() {
        $scope.changesMade = true;
    };

    // Define behaviour for the 'add call' button.
    var parentScope = $scope;
    $scope.addCall = function(bulk, call) {
        var isAdd = bulk || call === undefined || call === null;
        
        // Show call form in a dialog.
        var callDialog = ngDialog.open({
            template: 'views/CallAdd.html',
            className: 'ngdialog-theme-default confirm-dialog',
            controller: function($scope, $location) {
                // Get list of clients.
                $scope.clients = taffyDB({type: 'contact'}).get();               
                $scope.deadline = isAdd || call.deadline === null? new Date() : call.deadline;
                $scope.bulk = bulk;
                if(!bulk) {
                    $scope.client = $scope.clients.length > 0? $scope.clients[0].id : "";
                    if(!isAdd) $scope.client = call.contactId;
                }
                
                // Add the 'selected' property to the clients.
                if($scope.clients !== null && $scope.clients.length !== undefined) {
                    for(var i=0; i<$scope.clients.length; i++) $scope.clients[i].selected = false;
                }
                
                // Behaviour for the save button.
                $scope.save = function() {
                    // Change flag.
                    parentScope.changesMade = true;

                    // Add call(s) to the project (do not yet add them to the database).
                    if(!bulk) {
                        // Add or update call.
                        if(isAdd) {
                            var newCall = teloUtil.createEmptyCall();
                            newCall.id = teloUtil.getNextId();
                            newCall.contactId = $scope.client;
                            newCall.deadline = $scope.deadline;
                            parentScope.calls.push(newCall);
                        } else {
                            for(var k=0; k<parentScope.calls.length; k++) {
                                var otherCall = parentScope.calls[k];
                                if(otherCall.id === call.id) {
                                    otherCall.contactId = $scope.client;
                                    otherCall.deadline = $scope.deadline;
                                }
                            }
                        }
                    } else {
                        // Add a call for each selected contact.
                        for(var i=0; i<$scope.clients.length; i++) {
                            if($scope.clients[i].selected) {
                                var newCall = teloUtil.createEmptyCall();
                                newCall.id = teloUtil.getNextId();
                                newCall.contactId = $scope.clients[i].id;
                                newCall.deadline = $scope.deadline;
                                parentScope.calls.push(newCall);
                            }
                        }
                    }
                    
                    // Update calls list.
                    parentScope.updatePrettyCalls();
                    
                    // Close dialog.
                    callDialog.close();
                };
                // Behaviour for the cancel button
                $scope.cancel = function() {
                    // Close dialog.
                    callDialog.close();
                };
                // Behaviour for the contacts link.
                $scope.goToContacts = function() {
                    // Close the dialog and redirect to the contacts section.
                    $location.path('/list/contacts');
                    callDialog.close();
                };
                // Behaviour for the 'select all' and 'select none' links.
                $scope.selectAll = function(res) {
                    if($scope.clients !== null && $scope.clients.length !== undefined) {
                        for(var i=0; i<$scope.clients.length; i++) $scope.clients[i].selected = res;
                    }
                };
            }
        });
    };
    
    // Define behaviour for the edit button for calls.
    $scope.editCall = function(call) {
        // Show call form in a dialog.    
        $scope.addCall(false, call);
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
        // Verify if confirmation must be asked.
        if($scope.changesMade) {
            // Ask confirmation before delete.
            var confirmDialog = ngDialog.open({
                template: 'views/ConfirmDialog.html',
                className: 'ngdialog-theme-default confirm-dialog',
                controller: function($scope) {
                    $scope.message = "Are you sure that you want to go back (all unsaved changed are going to be lost)?";
                    $scope.acceptLabel = "Yes, return and discard changes";
                    $scope.cancelLabel = "No, stay in this page";
                    $scope.accept = function() { 
                        // Go back and close dialog.
                        $window.history.back();
                        confirmDialog.close();
                    };
                    $scope.cancel = function() { confirmDialog.close(); };
                }
            });            
        } else {
            // Go back.
            $window.history.back();
        }        
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
                    data: call,
                    contact: client.name,
                    status: status.name,
                    deadline: (call.deadline !== null? moment(call.deadline.getTime()).format("l") : null)
                });
            }
        }        
    };
    $scope.updatePrettyCalls();
});