#!/usr/bin/env perl

use strict;
use warnings;

use FindBin;
use lib "$FindBin::Bin/../lib";

use Plack::Builder;

use OTRS::LiveLog;

builder {
    mount( OTRS::LiveLog->websocket_mount );
    mount '/ws' => OTRS::LiveLog->to_app;
}
