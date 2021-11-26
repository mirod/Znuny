package OTRS::LiveLog;

use Dancer2;
use Dancer2::Plugin::WebSocket;

use Kernel::System::Log;

use JSON::XS;
use POSIX qw(strftime);

our $msg = "message00001";

websocket_on_login sub {
    my( $conn, $env ) = @_;
    debug( "creating ws (websocket_on_login)" );
};

websocket_on_open sub {
    my( $conn, $env ) = @_;
    debug( "creating ws (websocket_on_open)" );
};

websocket_on_message sub {
    my ( $conn, $message ) = @_;
    debug( "message: [", $message,"]");
    if( $message->{action} eq 'more' ) {
        my @loglines;
        foreach (0..int(rand(3))) {
            push @loglines, create_message($msg++);
        }
        $conn->send( [@loglines] );
    }
};

websocket_on_error sub {
    my $env = shift;
    debug( "websocket_on_error");
    return [
        500,
        ["Content-Type" => "text/plain"],
        ["Error: " . $env->{"plack.app.websocket.error"}]
    ];
};

sub create_message {
    my( $id ) = @_;
    my $type = (qw(Error Warning Notice Confirmation))[int rand(4)];
   return { errorClass => $type, time => strftime( "%c", localtime()), priority => lc($type), facility => 'log-server', message => $id++ };
}

true;
