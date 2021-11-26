// --
// Copyright (C) 2001-2021 OTRS AG, https://otrs.com/
// Copyright (C) 2021 Znuny GmbH, https://znuny.org/
// --
// This software comes with ABSOLUTELY NO WARRANTY. For details, see
// the enclosed file COPYING for license information (GPL). If you
// did not receive this file, see https://www.gnu.org/licenses/gpl-3.0.txt.
// --

"use strict";

var Core = Core || {};
Core.Agent = Core.Agent || {};
Core.Agent.Admin = Core.Agent.Admin || {};

/**
 * @namespace Core.Agent.Admin.Log
 * @memberof Core.Agent.Admin
 * @author OTRS AG
 * @description
 *      This namespace contains the special module functions for log.
 */
 Core.Agent.Admin.Log = (function (TargetNS) {

    /*
    * @name Init
    * @memberof Core.Agent.Admin.Log
    * @function
    * @description
    *      This function initializes log filter and click event for hint hiding.
    */
    TargetNS.Init = function () {

        var urlMySocket = "ws://otrs.m6.mirod.org:8200/ws/log";

        /* initialize filter */
        Core.UI.Table.InitTableFilter($('#FilterLogEntries'), $('#LogEntries'));

        /* create click event for hint hiding */
        $('#HideHint').on('click', function() {
           $(this).parents('.SidebarColumn').hide();
        });

        /* add websocket connection status */
        $('#LogTitle').append( ' <span id="WsStatus" title="Disconnected" style="margin-left:2em">🔴</span> <button id="pauseLog" title="Pause" style="margin-left:2em">⏸️</button><button id="resumeLog" title="Resume"style="display:none;margin-left:2em">▶️</button> <button id="clearLog" title="Clear log output" style="float:right;">🗑️</button>');

        var LogSocket = new WebSocket(urlMySocket);
        var more;
        LogSocket.sendJSON = function(message) { return this.send(JSON.stringify(message)) };
        LogSocket.onopen = function(evt) {
            console.log("opening");
            $('#WsStatus').html('🟢').attr( 'title', 'Connected');
            more = setInterval( function() { LogSocket.sendJSON( { action: 'more' } ); }, 500 );
        };

        LogSocket.onmessage = function (evt) {
            console.log( "Got message " + evt.data );
            var LogLines = JSON.parse(evt.data);
            console.log( 'number of lines: ' + LogLines.length );
            if( LogLines.length ) {
                LogLines.forEach(item => $('#LogEntries tbody').prepend( '<tr class="' + item.errorClass + '">'
                                                                        + '<td>' + item.time + '</td>'
                                                                        + '<td>' + item.priority + '</td>'
                                                                        + '<td>' + item.facility + '</td>'
                                                                        + '<td>' + item.message + '</td>'
                                                                      + '</tr>'));
            }
        };

        LogSocket.onerror = function(error) { console.log('WebSocket Error: ' + error); };

        $('#pauseLog').click( function() {
            window.clearInterval(more);
            $('#pauseLog').hide();
            $('#resumeLog').show();
        });

        $('#resumeLog').click( function() {
            more = setInterval( function() { LogSocket.sendJSON( { action: 'more' } ); }, 500 );
            $('#resumeLog').hide();
            $('#pauseLog').show();
        });

        $('#clearLog').click( function() {
            $('#LogEntries tbody tr').remove();
        });
    };

    Core.Init.RegisterNamespace(TargetNS, 'APP_MODULE');

    return TargetNS;
}(Core.Agent.Admin.Log || {}));
