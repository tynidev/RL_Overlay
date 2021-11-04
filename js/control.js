$(() => {

    WsSubscribers.init(49322, false);

    $('#send').click(() => {
        WsSubscribers.send("game", event, JSON.parse($('#'+event).val()));
    });

    var event = "update_state";

    $('#event').change(() => {
        $('textarea').hide();
        event = $('#event').val();
        $('#'+event).show();
    })
  });