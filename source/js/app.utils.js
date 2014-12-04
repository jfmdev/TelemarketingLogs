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

// Declare namespace.
var teleLogsUtil = {};

// Declare database.
var taffyDB = TAFFY();

/**
 * Store the user's name in the browser's local storage.
 * 
 * @param {string} name The user's name.
 */
teleLogsUtil.setUserName = function(name) {
    // Save name in the local storage.
    amplify.store("username", name);
    
    // Verify if the name must be added into the database.
    var exists = taffyDB({type:"user", name: name});
    if(exists.count() <= 0) {
        // The name must be added. Define the row's id.
        var id = 1;
        if(taffyDB().count() > 0) {
            id = taffyDB().order('id desc').first().id + 1;
        }
        
        // Add the name to the database.
        taffyDB.insert({id: id, type: "user", name: name});
    }
};

/**
 * Get the user's name, stored in the browser's local storage.
 * 
 * @returns {string} The user's name.
 */
teleLogsUtil.getUserName = function() {
    var res = amplify.store("username");
    return res !== null && res !== undefined? res : '';
};

/**
 * Verify if the user has defined his name.
 * 
 * @returns {boolean} 'true' is the user's name is defined, 'false' otherwise.
 */
teleLogsUtil.isUserNameDefined = function() {
    var name = teleLogsUtil.getUserName();
    return name.length > 0;
};
