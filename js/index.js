$(() => {

  $('#all').hide(); // hide initially on load

  WsSubscribers.init(49322, false);

  const match = new Match(WsSubscribers);

  // Match created
  match.OnGameCreated(() => {
    $('#all').hide();
    $('.teamboard .left').empty();
    $('.teamboard .right').empty();
    $('.scoreboard').css({
      top:"-180px"
    });
    $('.teamboard.left').css({
      left:"-420px"
    });
    $('.teamboard.right').css({
      left:"2565px"
    });
    $('.spectating').css({
      left:"-1000px"
    });
    if(match.game.isSeries)
       $('.series-tally').show();
     else
       $('.series-tally').hide();
  });

  // Game Initialized
  match.OnFirstCountdown(() => {
    $('#all').show();
  });

  // Time
  match.OnTimeUpdated((time) => {
    $('body').show();
    $('.scoreboard .center .time').text(time);
  });

  // Scoreboard
  match.OnTeamsUpdated((teams) => {
    var update = (team, id) => {
      $('.scoreboard ' + id + ' .name').text(team.name);
      $('.scoreboard ' + id + ' .score').text(team.score);
    };
    update(teams[0], ".left");
    update(teams[1], ".right");
    if(match.game.isSeries)
       $('.series-tally').show();
     else
       $('.series-tally').hide();
  });
  
  // Player tags
  match.OnPlayersUpdated((left, right) => {
    var update = (player, id) => {
      $(id + ' .name').text(player.name);
      $(id + ' .boost .fill').animate({
        width: player.boost + "%",
      }, 80);
      $(id + ' .stats .stat .save').text(player.saves);
      $(id + ' .stats .stat .goal').text(player.goals);
      $(id + ' .stats .stat .assist').text(player.assists);
      $(id + ' .stats .stat .demo').text(player.demos);
      $(id + ' .stats .stat .shots').text(player.shots);
    };
    left.forEach(element => {
      var id = element.primaryID == "0" ? element.id : element.primaryID;
      update(element, '.teamboard.left #' + id);
    });  
    right.forEach(element => {
      var id = element.primaryID == "0" ? element.id : element.primaryID;
      update(element, '.teamboard.right #' + id);
    });
  });
  
  // Spectator
  match.OnSpecatorUpdated((isSpectating, player) => {
    if(player === undefined || !isSpectating)
    {
      $('.spectating').css('visibility', 'hidden');
      return;
    }

    if(player.team == 0)
    {
      $('.spectating').css('background-image', 'linear-gradient(to right, rgba(0, 0, 255, 1), rgba(0, 0, 255, 0.3))');
    }
    else
    {
      $('.spectating').css('background-image', 'linear-gradient(to right, rgba(255, 119, 0, 1), rgba(255, 119, 0, 0.3))');
    }
    $('.spectating').css('visibility', 'visible');
    $('.spectating .name').text(player.name);
    $('.spectating .location').text(player.name);
    $('.spectating .boost .fill').animate({
      width: player.boost + "%",
    }, 100);
    $('.spectating .stats .save').text(player.saves);
    $('.spectating .stats .goal').text(player.goals);
    $('.spectating .stats .assist').text(player.assists);
    $('.spectating .stats .demo').text(player.demos);
    $('.spectating .stats .shots').text(player.shots);
  });

  // Active Players changed
  match.OnTeamsChanged((left, right) => {
    $('.teamboard.left').empty();
    $('.teamboard.right').empty();

    left.forEach(element => {
      var id = element.primaryID == "0" ? element.id : element.primaryID;
      $('.teamboard.left').append(`<div id="` + id + `"class="player">
      <div class="name">
      ` + element.name + `
      </div>
      <div class="boost">
        <div class="fill"></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="goal">` + element.goals + `</div><img src="assets/stat-icons/goal.svg"/></div>
        <div class="stat"><div class="assist">` + element.assists + `</div><img src="assets/stat-icons/assist.svg"/></div>
        <div class="stat"><div class="save">` + element.saves + `</div><img src="assets/stat-icons/save.svg"/></div>
        <div class="stat"><div class="shots">` + element.shots + `</div><img src="assets/stat-icons/shot-on-goal.svg"/></div>
        <div class="stat"><div class="demo">` + element.demos + `</div><img src="assets/stat-icons/demolition.svg"/></div>
      </div>
    </div>`);
    });

    right.forEach(element => {
      var id = element.primaryID == "0" ? element.id : element.primaryID;
      $('.teamboard.right').append(`<div id="` + id + `"class="player">
      <div class="name">
      ` + element.name + `
      </div>
      <div class="boost">
        <div class="fill"></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="goal">` + element.goals + `</div><img src="assets/stat-icons/goal.svg"/></div>
        <div class="stat"><div class="assist">` + element.assists + `</div><img src="assets/stat-icons/assist.svg"/></div>
        <div class="stat"><div class="save">` + element.saves + `</div><img src="assets/stat-icons/save.svg"/></div>
        <div class="stat"><div class="shots">` + element.shots + `</div><img src="assets/stat-icons/shot-on-goal.svg"/></div>
        <div class="stat"><div class="demo">` + element.demos + `</div><img src="assets/stat-icons/demolition.svg"/></div>
      </div>
    </div>`);
    });        
  });

  // Goal replay started
  match.OnInstantReplayStart(() => {
    $('.scoreboard').animate({
      top:"-180px"
    });
    $('.teamboard.left').animate({
      left:"-420px"
    });
    $('.teamboard.right').animate({
      left:"2565px"
    });
    $('.spectating').animate({
      left:"-1000px"
    });
  });
  
  // Kick off countdown begin
  match.OnCountdown(() => {
    $('.scoreboard').animate({
      top:"0px"
    });
    $('.teamboard.left').animate({
      left:"15px"
    });
    $('.teamboard.right').animate({
      left:"2145px"
    });
    $('.spectating').animate({
      left:"0px"
    });
  });

  // Game Ended
  match.OnGameEnded(() => {
    $('#all').hide();
  });
});