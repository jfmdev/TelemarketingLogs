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
