package OTRS::LiveLog;

use Dancer2;
use Dancer2::Plugin::WebSocket;

use Kernel::System::Log;

use JSON::XS;
use Kernel::System::Log;
use Kernel::System::ObjectManager;
use Digest::MD5 qw(md5_hex);

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
        $conn->send( GetLogSince( $message->{since} ) );
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


# based on Kernel::Module::AdminLog::Run
sub GetLogSince {
    my($since) = @_;
    local $Kernel::OM = Kernel::System::ObjectManager->new(
        'Kernel::System::Log' => {
            LogPrefix => 'InstallScriptX',  # not required, but highly recommend
        },
    );
    my $Log = $Kernel::OM->Get('Kernel::System::Log')->GetLog() || '';

    # Split data to lines.
    my @Messages = split /\n/, $Log;

    # create the data to send back
    my $data = { LastMessage => 0, LogLines => [] };

    # Create months map.
    my %MonthMap;
    my @Months = qw(Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec);
    @MonthMap{@Months} = ( 1 .. 12 );

    # Get current user time zone.
    #my $TimeZone = $Self->{UserTimeZone} || $Kernel::OM->Create('Kernel::System::DateTime')->UserDefaultTimeZoneGet();
    my $TimeZone = $Kernel::OM->Create('Kernel::System::DateTime')->UserDefaultTimeZoneGet();

    foreach my $Row (@Messages) {
        my $MD5 = md5_hex($Row);
        $data->{LastMessage} ||= $MD5;
        last if $MD5 eq $since ;

        my @Parts = split /;;/, $Row;
        next if !$Parts[3];

        my $ErrorClass = ( $Parts[1] =~ /error/ ) ? 'Error' : '';

        # Create date and time object from ctime log stamp.
        my @Time = split ' ', $Parts[0];
        my $DateTimeObject = $Kernel::OM->Create(
            'Kernel::System::DateTime',
            ObjectParams => {
                String => "$Time[4]-$MonthMap{$Time[1]}-$Time[2] $Time[3]",
            },
        );

        # Converts the date and time of this object to the user time zone.
        $DateTimeObject->ToTimeZone(
            TimeZone => $TimeZone,
        );

        # Output time back as ctime string with time zone.
        $Parts[0] = $DateTimeObject->ToCTimeString() . " ($TimeZone)";

        unshift @{$data->{LogLines}}, {
                ErrorClass => $ErrorClass,
                Time       => $Parts[0],
                Priority   => $Parts[1],
                Facility   => $Parts[2],
                Message    => $Parts[3],
            };
    }
    return $data;
}


true;
