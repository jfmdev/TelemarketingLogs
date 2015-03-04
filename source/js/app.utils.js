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
var teloUtil = {};

// Declare database.
var taffyDB = TAFFY();

// Declare auxiliar variable.
teloUtil.lastNextId = null;

/**
 * Gets the new id to use in the database.
 * 
 * @returns {Number} The next id to use in the database.
 */
teloUtil.getNextId = function() {
    var id = 1;
    if(taffyDB().count() > 0) {
        id = taffyDB().order('id desc').first().id + 1;
    }
    if(teloUtil.lastNextId !== null && teloUtil.lastNextId >= id) {
        id = teloUtil.lastNextId + 1;
    }
    teloUtil.lastNextId = id;
    
    return id;
};

/**
 * Gets the new order to use in a table of the database.
 * 
 * @param {String} type The table's type.
 * @returns {Number} The next order to use in a table.
 */
teloUtil.getNextOrder = function(type) {
    var ord = 1;
    if(taffyDB({type: type}).count() > 0) {
        ord = taffyDB({type: type}).order('order desc').first().order + 1;
    }
    return ord;
};

/**
 * Store the user's name in the browser's local storage.
 * 
 * @param {String} name The user's name.
 */
teloUtil.setUserName = function(name) {
    // Save name in the local storage.
    amplify.store("username", name);
    
    // Verify if the name must be added into the database.
    var exists = taffyDB({type:"user", name: name});
    if(exists.count() <= 0) {
        // Add the name to the database.
        var id = teloUtil.getNextId();
        taffyDB.insert({id: id, type: "user", name: name});
    }
};

/**
 * Get the user's name, stored in the browser's local storage.
 * 
 * @returns {String} The user's name.
 */
teloUtil.getUserName = function() {
    var res = amplify.store("username");
    return res !== null && res !== undefined? res : '';
};

/**
 * Verify if the user has defined his name.
 * 
 * @returns {Boolean} 'true' is the user's name is defined, 'false' otherwise.
 */
teloUtil.isUserNameDefined = function() {
    var name = teloUtil.getUserName();
    return name.length > 0;
};

/**
 * Transform the first letter of an string to uppercase.
 * 
 * @param {String} someString An string.
 * @returns {String} An string with the first letter uppercased.
 */
teloUtil.firstToUppercase = function(someString) {
    var res = '';
    if(res !== undefined && res !== null) {
        if(someString.length > 1)
            res = someString.charAt(0).toUpperCase() + someString.slice(1);
        else
            res = someString.toUpperCase();
    }
    return res;
};

/**
 * Verify if an entry can be deleted (i.e. do not is referenced by any other entry).
 * 
 * @param {object} entry The entry to delete.
 * @returns {String} 'true' if the entry can be delete, 'false' otherwise.
 */
teloUtil.canBeDeleted = function(entry) {
    if(entry.id === undefined || entry.id === null || entry.id < 0) return false;
    if(entry.type === 'user' && (entry.name === teloUtil.getUserName() || taffyDB({type: 'call', user_id: entry.id}).count() > 0)) return false;
    if(entry.type === 'result' && taffyDB({type: 'call', result_id: entry.id}).count() > 0) return false;
    if(entry.type === 'status' && taffyDB({type: 'call', status_id: entry.id}).count() > 0) return false;
    if(entry.type === 'contact' && taffyDB({type: 'call', contact_id: entry.id}).count() > 0) return false;
    return true;
};

/**
 * Clears the database and loads the default data.
 */
teloUtil.cleanDB = function() {
    // Clean database.
    taffyDB().remove();

    // Add current user.
    if(teloUtil.isUserNameDefined()) {
        teloUtil.setUserName( teloUtil.getUserName() );
    }

    // Add default data.
    taffyDB.insert({id: teloUtil.getNextId(), type: 'status', order: 1, name: 'Pending'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'status', order: 2, name: 'Done'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'status', order: 3, name: 'Cancelled'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'result', order: 1, name: 'Success'});
    taffyDB.insert({id: teloUtil.getNextId(), type: 'result', order: 2, name: 'Failure'});    
};

/**
 * Removes all values in the database and replace them with the values defined in a JSON object.
 * 
 * @param {object} jsonData The new database data.
 */
teloUtil.fillDatabaseWithJson = function(jsonData) {
    // Clean database.
    taffyDB().remove();
    
    // Add new data.
    taffyDB.insert(jsonData);

    // Fix dates.
    var calls = taffyDB({type: 'call'}).get();
    if(calls !== null && calls.length > 0) {
        for(var i=0; i<calls.length; i++) {
            if(typeof(calls[i].deadline) === 'string') {
                taffyDB({type: 'call', id: calls[i].id}).update({deadline: moment(calls[i].deadline).toDate()});
            }
        }
    }

    // Add current user.
    if(teloUtil.isUserNameDefined()) {
        teloUtil.setUserName( teloUtil.getUserName() );
    }
};

/**
 * Returns the id of the default's status value for a new call.
 * 
 * @returns An status id.
 */
teloUtil.getFirstStatusId = function() {
    var status = taffyDB({type: 'status'}).order('order asc').first();
    return status !== undefined && status !== null? status.id : null;
};

/**
 * Read a file selected with an input.
 * 
 * @param {object} evt The event generated by the browser when the file is selected by the user.
 * @param {function} callback A callback which receives a boolean, indicating if the file was read or not, and a string, with the file's name.
 */
teloUtil.readFile = function(evt, callback) {
    //Retrieve the first (and only) File from the FileList object.
    var file = evt.target.files[0]; 

    if (file) {
        var fileReader = new FileReader();
        fileReader.onload = function(e) {
            var res = false;
            try {
                // Get and parse data.
                var contents = e.target.result;
                var jsonData = JSON.parse(contents);

                // Clean database and insert new data.
                teloUtil.fillDatabaseWithJson(jsonData);

                res = true;
            }catch(err) {}
            
            // Invoke callback.
            if(callback !== undefined && callback !== null) callback(res, file.name); 
        };
        fileReader.readAsText(file);
    } else { 
        // Invoke callback.
        if(callback !== undefined && callback !== null) callback(false, null);
    }
};
