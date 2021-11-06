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

    var event = "update_state";

    $('#event').change(() => {
        $('textarea').hide();
        event = $('#event').val();
        $('#'+event).show();
    })
  });