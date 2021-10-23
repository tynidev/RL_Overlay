$(() => {

    WsSubscribers.init(49322, false);

    series = {}
    series.teams = []
    series.teams.push({
        'name' : 'TYNI',
        'score': 5
    });
    series.teams.push({
        'name' : 'MOSES',
        'score': 2
    });

    $('#send').click(() => {
        WsSubscribers.send("game", event, JSON.parse($('#'+event).text()));
    });

    var event = "update_state";

    $('#event').change(() => {
        $('textarea').hide();
        event = $('#event').val();
        $('#'+event).show();
    })
  });