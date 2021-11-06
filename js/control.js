var i = 6;
$(() => {

    WsSubscribers.init(49322, false);

    $('#send').click(() => {
        WsSubscribers.send("game", event, JSON.parse($('#'+event).val()));
    });

    $('#test').click(() => {
        WsSubscribers.send("game", "match_created", JSON.parse($('#match_created').val()));
        WsSubscribers.send("game", "update_state", JSON.parse($('#update_state').val()));
        WsSubscribers.send("game", "series_update", JSON.parse($('#series_update').val()));
        WsSubscribers.send("game", "initialized", JSON.parse($('#initialized').val()));
        WsSubscribers.send("game", "update_state", JSON.parse($('#update_state').val()));
        WsSubscribers.send("game", "pre_countdown_begin", JSON.parse($('#pre_countdown_begin').val()));
    });

    function update_state() {
        i = ++i % 40;
        if(i == 0)
        {
            WsSubscribers.send("game", "goal_scored", JSON.parse($('#goal_scored').val()));
            WsSubscribers.send("game", "replay_start", JSON.parse($('#replay_start').val()));
        }
        if(i == 3)
        {
            WsSubscribers.send("game", "replay_will_end", JSON.parse($('#replay_will_end').val()));
        }
        if(i == 5)
        {
            WsSubscribers.send("game", "replay_end", JSON.parse($('#replay_end').val()));
            WsSubscribers.send("game", "pre_countdown_begin", JSON.parse($('#pre_countdown_begin').val()));
        }
        WsSubscribers.send("game", "update_state", JSON.parse($('#update_state').val()));
    }
    // setInterval(update_state, 300);

    var event = "update_state";

    $('#event').change(() => {
        $('textarea').hide();
        event = $('#event').val();
        $('#'+event).show();
    })
  });