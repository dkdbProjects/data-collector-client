/*
 * Copyright (c) 2013-2015, Paul Fischer, Intel Corporation. All rights reserved.
 * Please see included README.md file for license terms and conditions.
 */


/*jslint browser:true, devel:true, white:true, vars:true */
/*global $:false, intel:false, moment:false, geo:false */
/*global copyObject:false, addClass:false, removeClass:false */


window.geo = window.geo || {} ;     // don't clobber existing geo object


// The console.log() messages sprinkled in this file are for instruction and debug.
// If you reuse this code you do not need to include them as part of your app.
// Set to "true" if you want the console.log messages to appear.

geo.LOG = true ;
geo.consoleLog = function() {       // only emits console.log messages if geo.LOG != false
    "use strict" ;
    if( geo.LOG ) {
        var args = Array.prototype.slice.call(arguments, 0) ;
        console.log.apply(console, args) ;
    }
} ;


geo.opts = {
    enableHighAccuracy : true,      // true for "fine" position (GPS), false for "coarse" position (network, et al)
    timeout : 15000,                // maximum milliseconds to wait to return a result (default is "Infinity")
    maximumAge : 60000,             // max age in msecs of an acceptable cached position, zero -> no caching, "Infinity" -> return a cached position
    watchId : null                  // holds handle for watchPosition(), pass as null to clearWatch() to terminate the watch
} ;

geo.optsXDK = {
    enableHighAccuracy : true,      // true for "fine" position (GPS), false for "coarse" position (network, et al)
    timeout : 2000,                 // milliseconds interval to return a result (default is 10,000 msecs)
    maximumAge : 60000,             // max age in milliseconds to wait for position before returning error
    watchId : null                  // holds handle for watchPosition(), pass as null to clearWatch() to terminate the watch
} ;



// Called by init-app.js
// Just sets everything to a known state.

geo.initGeoLocate = function() {
    "use strict" ;
    var fName = "geo.initGeoLocate():" ;
    geo.consoleLog(fName, "entry") ;

    try {
        navigator.geolocation.clearWatch(geo.opts.watchId = null) ;
        geo.consoleLog(fName, "navigator try succeeded.") ;
    }
    catch(e) {
        geo.consoleLog(fName, "navigator try failed:", e) ;
    }

    try {
        intel.xdk.geolocation.clearWatch(geo.optsXDK.watchId = null) ;
        geo.consoleLog(fName, "intel.xdk try succeeded.") ;
    }
    catch(e) {
        geo.consoleLog(fName, "intel.xdk try failed:", e) ;
    }

    geo.consoleLog(fName, "exit") ;
} ;



// Two functions to reconfigure geo.opts for use by the geo watch functions.
// Just makes it easier to switch between fine/coarse settings for demo and test.
// Also call the function that gets us a single geo position result.
// Based on code from: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation.getCurrentPosition

geo.btnGeoFine = function() {
    "use strict" ;
    var fName = "geo.btnGeoFine():" ;
    geo.consoleLog(fName, "entry") ;

    var geoOpts = copyObject(geo.opts) ;
    if( geoOpts.maximumAge < 0 )
        geoOpts.maximumAge = Infinity ;         // force use of cached geo values if "cachAge" is negative
    geoOpts.enableHighAccuracy = true ;         // force use of high accuracy measurement (e.g., GPS)
    geo.opts.enableHighAccuracy = true ;        // set to high accuracy for next use by watch function

    geo.locate(geoOpts) ;                       // do a single geo request
    geo.consoleLog(fName, "exit") ;
} ;

geo.btnGeoCoarse = function() {
    "use strict" ;
    var fName = "geo.btnGeoCoarse():" ;
    geo.consoleLog(fName, "entry") ;

    var geoOpts = copyObject(geo.opts) ;
    if( geoOpts.maximumAge < 0 )
        geoOpts.maximumAge = Infinity ;         // force use of cached geo values if "cachAge" is negative
    geoOpts.enableHighAccuracy = false ;        // force use of low accuracy measurement (e.g., network location)
    geo.opts.enableHighAccuracy = false ;       // set to low accuracy for next use by watch function

    geo.locate(geoOpts) ;                       // do a single geo request
    geo.consoleLog(fName, "exit") ;
} ;

geo.btnGeoFineXDK = function() {
    "use strict" ;
    var fName = "geo.btnGeoFineXDK():" ;
    geo.consoleLog(fName, "entry") ;

    var geoOpts = copyObject(geo.optsXDK) ;
    if( geoOpts.maximumAge < 0 )
        geoOpts.maximumAge = Infinity ;         // force use of cached geo values if "cachAge" is negative
    geoOpts.enableHighAccuracy = true ;         // force use of high accuracy measurement (e.g., GPS)
    geo.optsXDK.enableHighAccuracy = true ;     // set to high accuracy for next use by watch function

    geo.locateXDK(geoOpts) ;                    // do a single geo request
    geo.consoleLog(fName, "exit") ;
} ;

geo.btnGeoCoarseXDK = function() {
    "use strict" ;
    var fName = "geo.btnGeoCoarseXDK():" ;
    geo.consoleLog(fName, "entry") ;

    var geoOpts = copyObject(geo.optsXDK) ;
    if( geoOpts.maximumAge < 0 )
        geoOpts.maximumAge = Infinity ;         // force use of cached geo values if "cachAge" is negative
    geoOpts.enableHighAccuracy = false ;        // force use of low accuracy measurement (e.g., network location)
    geo.optsXDK.enableHighAccuracy = false ;    // set to low accuracy for next use by watch function

    geo.locateXDK(geoOpts) ;                    // do a single geo request
    geo.consoleLog(fName, "exit") ;
} ;



// Perform a single geo request (no watch).
// Print results into watch output cells.
// This function uses the W3C browser geoLocate API.
// The Cordova plugin will polyfill in case the standard API does not exist in the webview.
// Including the Cordova plugin eliminates an extra confusing geo security request.

geo.locate = function(geoOpts) {
    "use strict" ;
    var fName = "geo.locate():" ;
    geo.consoleLog(fName, "entry") ;
    
    var accuracy = geoOpts.enableHighAccuracy ? "fine" : "coarse" ;

    function onSuccess(pos) {
        geo.consoleLog(fName, "onSuccess") ;
        document.getElementById("geo-info").value = fName + " onSuccess " ;
        if( window.moment )
            document.getElementById("geo-mode").value = accuracy + " " + moment().format("HH:mm:ss.SSS") ;
        else
            document.getElementById("geo-mode").value = accuracy ;

        document.getElementById("geo-latitude").value = pos.coords.latitude ;
        document.getElementById("geo-longitude").value = pos.coords.longitude ;
        
        //document.getElementById("geo-accuracy").value = pos.coords.accuracy ;
        //document.getElementById("geo-altitude").value = pos.coords.altitude ;
        //document.getElementById("geo-altAcc").value = pos.coords.altitudeAccuracy ;
        //document.getElementById("geo-heading").value = pos.coords.heading ;
        //document.getElementById("geo-speed").value = pos.coords.speed ;
        //document.getElementById("geo-timestamp").value = pos.timestamp ;
        
        writeToFile("gps.locale.output", getDateToStr() + "," + 
                                  pos.coords.latitude.toFixed(6) + "," +
                                  pos.coords.longitude.toFixed(6)
        );
        client.lat = "" + pos.coords.latitude.toFixed(6);
        client.lon = "" + pos.coords.longitude.toFixed(6);
        //gmap.processSnapToRoadResponse("-35.27801,149.12958|-35.28032,149.12907|-35.28099,149.12929|-35.28144,149.12984|-35.28194,149.13003|-35.28282,149.12956|-35.28302,149.12881|-35.28473,149.12836");
    }

    function onFail(err) {
        geo.consoleLog(fName, "onFail") ;
        document.getElementById("geo-info").value = fName + " onFail " ;
        if( window.moment )
            document.getElementById("geo-mode").value = accuracy + " " + moment().format("HH:mm:ss.SSS") ;
        else
            document.getElementById("geo-mode").value = accuracy ;
        document.getElementById("geo-latitude").value = err.code ;
        document.getElementById("geo-longitude").value = err.message ;
        
        //document.getElementById("geo-accuracy").value = "" ;
        //document.getElementById("geo-altitude").value = "" ;
        //document.getElementById("geo-altAcc").value = "" ;
        //document.getElementById("geo-heading").value = "" ;
        //document.getElementById("geo-speed").value = "" ;
        //document.getElementById("geo-timestamp").value = "" ;
        geo.consoleLog(fName, 'geoError(' + err.code + '): ' + err.message) ;
        // 1: PERMISSION_DENIED
        // 2: POSITION_UNAVAILABLE
        // 3: TIMEOUT
    }

    try {
        navigator.geolocation.getCurrentPosition(onSuccess, onFail, geoOpts) ;
    }
    catch(e) {
        geo.consoleLog(fName, "try failed - device API not present?", e) ;
    }

    geo.consoleLog(fName, "exit") ;
} ;

// Perform a single geo request (no watch).
// This function is based on the XDK geoLocate API.

geo.locateXDK = function(geoOpts) {
    "use strict" ;
    var fName = "geo.locateXDK():" ;
    geo.consoleLog(fName, "entry") ;

    var accuracy = geoOpts.enableHighAccuracy ? "fine" : "coarse" ;

    function onSuccess(pos) {
        geo.consoleLog(fName, "onSuccess") ;
        document.getElementById("geo-info").value = fName + " onSuccess " ;
        if( window.moment )
            document.getElementById("geo-mode").value = accuracy + " " + moment().format("HH:mm:ss.SSS") ;
        else
            document.getElementById("geo-mode").value = accuracy ;
        document.getElementById("geo-latitude").value = pos.coords.latitude ;
        document.getElementById("geo-longitude").value = pos.coords.longitude ;
        
        writeToFile("gps.locale.xdk.output", getDateToStr() + "," + 
                                  pos.coords.latitude.toFixed(6) + "," +
                                  pos.coords.longitude.toFixed(6)
        );
    }

    function onFail(err) {
        geo.consoleLog(fName, "onFail") ;
        document.getElementById("geo-info").value = fName + " onFail " ;
        if( window.moment )
            document.getElementById("geo-mode").value = accuracy + " " + moment().format("HH:mm:ss.SSS") ;
        else
            document.getElementById("geo-mode").value = accuracy ;
        document.getElementById("geo-latitude").value = err ;
        document.getElementById("geo-longitude").value = "" ;
        geo.consoleLog(fName, "geoError(" + err + ")") ;
    }

    try {
        intel.xdk.geolocation.getCurrentPosition(onSuccess, onFail, geoOpts) ;
    }
    catch(e) {
        geo.consoleLog(fName, "try failed - device API not present?", e) ;
    }

    geo.consoleLog(fName, "exit") ;
} ;



// Watch function that updates geo location continuously.
// Stops when the geo button is pushed a second time.
// This function uses the W3C browser geoLocate API.
// The Cordova plugin will polyfill in case the standard API does not exist in the webview.
// Including the Cordova plugin also eliminates a confusing geo security request.

var last_lat = -1.0;
var last_lng = -1.0;
geo.btnGeo = function() {
    "use strict" ;
    var fName = "geo.btnGeo():" ;
    geo.consoleLog(fName, "entry") ;
    var geoOpts = copyObject(geo.opts) ;
    if( geoOpts.maximumAge < 0 )
        geoOpts.maximumAge = Infinity ;    // force use of cached geo values if "cachAge" is negative
    var accuracy = geoOpts.enableHighAccuracy ? "fine" : "coarse" ;

    function onSuccess(pos) {
        geo.consoleLog(fName, "onSuccess " + pos.coords.latitude.toFixed(6) + " " + pos.coords.longitude.toFixed(6)) ;
        document.getElementById("geo-info").value = fName + " onSuccess " ;
        document.getElementById("geo-latitude").value = pos.coords.latitude ;
        document.getElementById("geo-longitude").value = pos.coords.longitude ;
        document.getElementById("geo-speed").value =  pos.coords.speed ;
        
        writeToFile("gps.geo.output", getDateToStr() + "," + 
                                  pos.coords.latitude.toFixed(6) + "," +
                                  pos.coords.longitude.toFixed(6) + "," +
                                  pos.coords.speed.toFixed(6) 
        );
        if(last_lat == -1 && last_lng == -1) {
            geo.consoleLog("not paint");
            last_lat = pos.coords.latitude.toFixed(6);
            last_lng = pos.coords.longitude.toFixed(6);
        } else {
            geo.consoleLog("paint");
            var str = last_lat + "," + last_lng + "|" + pos.coords.latitude.toFixed(6) + "," + pos.coords.longitude.toFixed(6);
            last_lat = pos.coords.latitude.toFixed(6);
            last_lng = pos.coords.longitude.toFixed(6);
            gmap.runSnapToRoad(str);
        }
    }

    function onFail(err) {
        geo.consoleLog(fName, "onFail") ;
        document.getElementById("geo-info").value = fName + " onFail " ;
        document.getElementById("geo-latitude").value = err.code ;
        document.getElementById("geo-longitude").value = err.message ;

        geo.consoleLog(fName, "geoError(" + err.code + "): " + err.message) ;
    }

    if( geo.opts.watchId === null ) {               // let's start watching geo position
        try {                                       // watch and update geo at timeout or on change
            geo.opts.watchId = navigator.geolocation.watchPosition(onSuccess, onFail, geoOpts) ;
            addClass("cl_btnOn", document.getElementById("id_btnGeo")) ;
            geo.consoleLog(fName, "btnGeo enabled.") ;
        }
        catch(e) {
            geo.consoleLog(fName, "try failed - device API not present?", e) ;
        }
    }
    else {
        try {
            navigator.geolocation.clearWatch(geo.opts.watchId) ;
        }
        catch(e) {
            geo.consoleLog(fName, "try failed - device API not present?", e) ;
        }
        geo.opts.watchId = null ;
        removeClass("cl_btnOn", document.getElementById("id_btnGeo")) ;
        geo.consoleLog(fName, "btnGeo disabled.") ;
    }

    geo.consoleLog(fName, "exit") ;
} ;

// Watch function that updates geo location continuously.
// Stops when the geo button is pushed a second time.
// This function uses the XDK browser geoLocate API.

geo.btnGeoXDK = function() {
    "use strict" ;
    var fName = "geo.btnGeoXDK():" ;
    geo.consoleLog(fName, "entry") ;

    var geoOpts = copyObject(geo.optsXDK) ;
    if( geoOpts.maximumAge < 0 )
        geoOpts.maximumAge = Infinity ;    // force use of cached geo values if "cachAge" is negative
    var accuracy = geoOpts.enableHighAccuracy ? "fine" : "coarse" ;

    function onSuccess(pos) {
        geo.consoleLog(fName, "onSuccess") ;
        document.getElementById("geo-info").value = fName + " onSuccess " ;
        document.getElementById("geo-latitude").value = pos.coords.latitude ;
        document.getElementById("geo-longitude").value = pos.coords.longitude ;

        writeToFile("gps.geo.xdk.output", getDateToStr() + "," + 
                                  pos.coords.latitude.toFixed(6) + "," +
                                  pos.coords.longitude.toFixed(6)
        );
    }

    function onFail(err) {
        geo.consoleLog(fName, "onFail geoError(" + err + ")") ;
        document.getElementById("geo-info").value = fName + " onFail " ;
        document.getElementById("geo-latitude").value = err ;
        document.getElementById("geo-longitude").value = "" ;
    }

    if( geo.optsXDK.watchId === null ) {            // let's start watching geo position
        try {                                       // watch and update geo at timeout or on change
            geo.optsXDK.watchId = intel.xdk.geolocation.watchPosition(onSuccess, onFail, geoOpts) ;
            addClass("cl_btnOn", document.getElementById("id_btnGeoXDK")) ;
            geo.consoleLog(fName, "btnGeoXDK enabled.") ;
        }
        catch(e) {
            geo.consoleLog(fName, "try failed - device API not present?", e) ;
        }
    }
    else {
        try {
            intel.xdk.geolocation.clearWatch(geo.optsXDK.watchId) ;
        }
        catch(e) {
            geo.consoleLog(fName, "try failed - device API not present?", e) ;
        }
        geo.optsXDK.watchId = null ;
        removeClass("cl_btnOn", document.getElementById("id_btnGeoXDK")) ;
        geo.consoleLog(fName, "btnGeoXDK disabled.") ;
    }

    geo.consoleLog(fName, "exit") ;
} ;
