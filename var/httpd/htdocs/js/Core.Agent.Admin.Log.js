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

        var urlMySocket = "ws://' + window.location.hostname + ':8200/ws/log";

        /* initialize filter */
        Core.UI.Table.InitTableFilter($('#FilterLogEntries'), $('#LogEntries'));

        /* create click event for hint hiding */
        $('#HideHint').on('click', function() {
           $(this).parents('.SidebarColumn').hide();
        });

        /* add websocket connection status */
        $('#LogTitle').append( ' <span id="WsStatus" title="Disconnected" style="margin-left:2em">🔴</span>');

        var LogSocket = new WebSocket(urlMySocket);
        var more;
        LogSocket.sendJSON = function(message) { return this.send(JSON.stringify(message)) };
        LogSocket.onopen = function(evt) {
            // change status to connected
            $('#WsStatus').html('🟢').attr( 'title', 'Connected');
            // add pause/resume and clear buttons
            $('#LogTitle').append( ' <button id="pauseLog" title="Pause" style="margin-left:2em">⏸️</button><button id="resumeLog" title="Resume"style="display:none;margin-left:2em">▶️</button> <button id="clearLog" title="Clear log output" style="float:right;">🗑️</button>');
            more = setInterval( function() { LogSocket.sendJSON( { action: 'more', since: $('#LastMessage').data('lastmessage') } ); }, 500 );
            // set handlers for the buttons
            $('#pauseLog').click( function() {
                window.clearInterval(more);
                $('#pauseLog').hide();
                $('#resumeLog').show();
            });

            $('#resumeLog').click( function() {
                more = setInterval( function() { LogSocket.sendJSON( { action: 'more', since: $('#LastMessage').data('lastmessage') } ); }, 500 );
                $('#resumeLog').hide();
                $('#pauseLog').show();
            });

            $('#clearLog').click( function() {
                $('#LogEntries tbody tr').remove();
            });
        };

        LogSocket.onmessage = function (evt) {
            var Data = JSON.parse(evt.data);
            $('#LastMessage').data('lastmessage', Data.LastMessage);
            if( Data.LogLines.length ) {
                Data.LogLines.forEach( (item) => {
                    var NewRow= '<tr class="' + item.ErrorClass + ' NewRow">'
                        + '<td>' + item.Time + '</td>'
                        + '<td>' + item.Priority + '</td>'
                        + '<td>' + item.Facility + '</td>'
                        + '<td>' + item.Message + '</td>'
                        + '</tr>';
                    $('#LogEntries tbody').prepend(NewRow)
                    $('#LogEntries tbody tr.NewRow').first().fadeOut().fadeIn().removeClass('NewRow');
                });
            }
        };


        LogSocket.onerror = function(error) { console.error('WebSocket Error: ', error); };


    };

    Core.Init.RegisterNamespace(TargetNS, 'APP_MODULE');

    return TargetNS;
}(Core.Agent.Admin.Log || {}));
