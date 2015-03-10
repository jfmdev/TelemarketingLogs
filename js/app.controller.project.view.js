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
    // Get the list of statuses and results.
    var statusesAux = taffyDB({type: 'status'}).get();
    $scope.statuses = statusesAux.slice(0);
    var resultsAux = taffyDB({type: 'result'}).get();
    $scope.results = resultsAux.slice(0);    

    // Get project to edit.
    $scope.entry = null;
    if($routeParams.id !== undefined && $routeParams.id !== null && $routeParams.id !== 'new') {
        // Get object from the database.
        $scope.entry = JSON.parse(JSON.stringify( taffyDB({id: parseInt($routeParams.id, 10)}).first() ));
        
        // Get call rows (clone the array in order to avoid bugs when doing a push over the array).
        var callsAux = taffyDB({type: 'call', projectId: $scope.entry.id}).get();
        $scope.calls = callsAux.slice(0);
    }

    // If no entry has been read from the database, return to the list of projectst.
    if($scope.entry === undefined || $scope.entry === null || $scope.entry.type !== 'project') {
        $location.path('/');
    }

    // Define method for show the details of a call.
    $scope.showCallDetails = function(prettyCall) {
        $scope.editCall = prettyCall;
        $scope.index = $scope.prettyCalls.indexOf(prettyCall);
        $scope.editContact = taffyDB({id: parseInt(prettyCall.data.contactId, 10)}).first();

        $scope.editMisc = {
            notCallAgain: $scope.editContact.disable === true,
            callAgainFlag: false,
            callAgainDate: moment().add(7, 'days').toDate(),
            statusId: prettyCall.data.statusId,
            resultId: prettyCall.data.resultId,
            comment: prettyCall.data.comment
        };
    };
    
    /**
     * Display the details of the next or the previous call.
     * 
     * @param {number} mov A number indicating how many calls skip.
     */
    $scope.nextCall = function(mov) {
        $scope.index += mov;
        if($scope.index >= $scope.prettyCalls.length) $scope.index = 0;
        if($scope.index < 0) $scope.index = $scope.prettyCalls.length - 1;
        $scope.showCallDetails($scope.prettyCalls[$scope.index]);
    };
    
    /**
     * Generates an user friendly list of call from the list saved in the database.
     */
    $scope.updatePrettyCalls = function() {
        $scope.prettyCalls = [];
        if($scope.calls !== null) {
            for(var i=0; i<$scope.calls.length; i++) {
                var call = $scope.calls[i];
                var contact = taffyDB({type: 'contact', id: call.contactId}).first();
                var status = taffyDB({type: 'status', id: call.statusId}).first();               
                var result = call.resultId != null? taffyDB({type: 'result', id: call.resultId}).first() : null;
                var userCreation = call.userIdCreation != null? taffyDB({type: 'user', id: call.userIdCreation}).first() : null;
          
                $scope.prettyCalls.push({
                    data: call,
                    contact: contact.name,
                    status: status.name,
                    result: (result !== null? result.name : ''),
                    userCreation: (userCreation !== null && userCreation.name !== undefined? userCreation.name : '-'),
                    deadline: (call.deadline !== null? moment(call.deadline.getTime()).format("l") : null)
                });
            }
        }        
    };
    $scope.updatePrettyCalls();

    /**
     * Save the current changes and display the next call.
     */
    $scope.saveAndNext = function() {
        // Save changes.
        $scope.editCall.data.statusId = $scope.editMisc.statusId;
        $scope.editCall.data.resultId = $scope.editMisc.resultId;
        $scope.editCall.data.comment = $scope.editMisc.comment;
        $scope.editCall.data.userIdLastUpdate = teloUtil.getUserId();
        $scope.editCall.data.dateLastUpdate = new Date();
        taffyDB({id: $scope.editCall.data.id}).update($scope.editCall.data);
        
        // Verify if the contact must be disabled (or enabled).
        if($scope.editMisc.notCallAgain !== $scope.editContact.disable) {
            taffyDB({id: $scope.editContact.id}).update({'disable': $scope.editMisc.notCallAgain});
        }
        
        // TODO: Verify if a new call must be created.
        if($scope.editMisc.callAgainFlag && $scope.editMisc.callAgainDate !== null) {
            var newCall = teloUtil.createEmptyCall();
            newCall.projectId = $scope.editCall.data.projectId;
            newCall.contactId = $scope.editCall.data.contactId;
            newCall.deadline = $scope.editMisc.callAgainDate;
            newCall.userIdCreation = teloUtil.getUserId();
            $scope.calls.push(newCall);
            taffyDB.insert(newCall);
        }
        
        // Update table.
        $scope.updatePrettyCalls();
        
        // Go to the next call.
        $scope.nextCall(1);
    };

    // By default, select the first calls.
    $scope.index = 0;
    if($scope.prettyCalls.length > 0) {
        $scope.showCallDetails($scope.prettyCalls[0]);
    } else {
        $scope.editCall = null;
        $scope.editContact = null;
    }
});