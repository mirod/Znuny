var urlMySocket = "ws://otrs.m6.mirod.org:8200/ws";

$(document).ready( function {

    // add disconnected status
    $('.ContentColumn h2').append( ' <span id="WsStatus">🔴</span>');

    var mySocket = new WebSocket(urlMySocket);
    mySocket.onopen = function(evt) {
        console.log("opening");
        $('#WsStatus').html('🟢');
        var more = setInterval( function() { mySocket.send( { action = 'more'); }, 1000 );
    };


    mySocket.onmessage = function (evt) {
        console.log( "Got message " + evt.data );
    };


});

