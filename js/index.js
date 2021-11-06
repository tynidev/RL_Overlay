function PreGamePosition()
{
  $('.scoreboard').css({
    top:"-180px"
  });
  $('.teamboard.left').css({
    left:"-420px"
  });
  $('.teamboard.right').css({
    left:"105%"
  });
  $('.spectating').css({
    left:"-1000px"
  });
}

function ReplayAnimation()
{
  $('.scoreboard').animate({
    top:"-180px"
  });
  $('.teamboard.left').animate({
    left:"-420px"
  });
  $('.teamboard.right').animate({
    left:"105%"
  });
  $('.spectating').animate({
    left:"-1000px"
  });
  $('.spectating-boost').animate({
    opacity:"0"
  });
  $('.minimap').show();
}

function CountdownAnimation()
{
  $('.scoreboard').animate({
    top:"0px"
  });
  $('.teamboard.left').animate({
    left:"-80px"
  });
  $('.teamboard.right').animate({
    left:"2260px"
  });
  $('.spectating').animate({
    left:"-10px"
  });
  $('.spectating-boost').animate({
    opacity:"100"
  });
}

function center() {
  let boost = d3.select('.spectating-boost .boost-ring .boost-num');

  // Get current x and y values.
  let x = 150;
  let y = 150;
  
  // Get bounding box and compute the center point.
  let node = boost.node();
  let bb = node.getBBox();
  let centerX = bb.width / 2;
  let centerY = bb.height / 4;
  
  // Adjust x and y.
  boost.attr('x', x - centerX);
  boost.attr('y', y + centerY - 27);

  let speed = d3.select('.spectating-boost .boost-ring .speed-num');
  
  // Get bounding box and compute the center point.
  node = speed.node();
  bb = node.getBBox();
  centerX = bb.width / 2;
  centerY = bb.height / 4;
  
  // Adjust x and y.
  speed.attr('x', x - centerX);
  speed.attr('y', y + centerY + 20);
}

function SetSpectatingBoost(player)
{
  var el = d3.selectAll('.spectating-boost .boost-ring .fill');
  var circumference = parseInt(el.style('r'), 10) * 2 * Math.PI;

  const offset = circumference - player.boost / 100 * circumference;
  
  let boostTxt = d3.select('.spectating-boost .boost-ring .boost-num');
  boostTxt.text(`${player.boost}`);
  
  let speedText = d3.select('.spectating-boost .boost-ring .speed-num');
  speedText.text(`${player.speed} MPH`);

  center();

  var color = 'rgba(0, 0, 210, 0.85)';
  if(player.team != 0)
  {
    color = 'rgba(255, 119, 0, 0.85)';
  }
  el.style('stroke', color);

  if(player.isSonic)
  {
    speedText.attr('fill', 'rgba(255, 217, 0,1)');
  }
  else
  {
    speedText.attr('fill', 'white');
  }

  el.attr("stroke-dasharray", circumference);
  el.transition()
  .duration(100)
  .ease(d3.easeLinear)
  .attr("stroke-dashoffset", offset)
}

function GetLocation(point){
  return {'X': point.X + 4096, 'Y': point.Y + 6000} 
}

$(() => {

  WsSubscribers.init(49322, false);

  const match = new Match(WsSubscribers);
  match.localplayer_support = true;

    WsSubscribers.subscribe("game", "series_update", (p) => { 
      $('.scoreboard .series-tally .left').empty();
      $('.scoreboard .series-tally .right').empty();

      $('.scoreboard .center .box .series').text(p.title);
      $('.scoreboard .series-tally .series-text').text(p.series_txt);

      var games = Math.ceil(p.length / 2);
      if(games <= 1)
      {
        $('.scoreboard .series-tally').hide();
        return;
      }
      for(var i = 1; i <= games; i++)
      {
        $('.scoreboard .series-tally .left').append(`<div class="mark w${i}"></div>`);
        $('.scoreboard .series-tally .right').append(`<div class="mark w${i}"></div>`);
      }

      var w = (games * 62 * 2) + 90;
      $('.scoreboard .series-tally').css({display:"block", "--w":`${w}px`});

      $('.scoreboard .series-tally .mark').each((i, el) => {
        $(el).removeClass('w');
      });

      for(var i = 1; i <= p.teams[0].matches_won; i++)
      {
        var el = $('.scoreboard .series-tally .left .mark.w' + i);
        if(!el.hasClass('w')){
          el.addClass('w');
        }
      }
      for(var i = 1; i <= p.teams[1].matches_won; i++)
      {
        var el = $('.scoreboard .series-tally .right .mark.w' + i);
        if(!el.hasClass('w')){
          el.addClass('w');
        }
      }
    });

  // Match created
  match.OnGameCreated(() => {
    $('#all').hide();
    $('.teamboard .left').empty();
    $('.teamboard .right').empty();
    d3.selectAll('.blue-car').remove();
    d3.selectAll('.orng-car').remove();
    PreGamePosition();
  });

  // Game Initialized
  match.OnFirstCountdown(() => {
    $('#all').show();
  });

  // Time
  match.OnTimeUpdated((time, seconds) => {
    
    // If were not showing main elements then animate them in
    if(match.timeStarted && !$('#all').is(":visible")) {
      PreGamePosition();
      $('#all').show();
      CountdownAnimation();
    }

    // Update time
    $('.scoreboard .center .time').text(time);

    if(seconds <= 10){
      $('.scoreboard .center .time').css({color: "rgb(252 43 28)"});
    }else if(seconds){
      $('.scoreboard .center .time').css({color: "#f1c83d"});
    }
  });

  // Scoreboard
  match.OnTeamsUpdated((teams) => {
    var update = (team, id, name) => {
      $('.scoreboard ' + id + ' .name').text(name);
      $('.scoreboard ' + id + ' .score').text(team.score);
    };
    update(teams[0], ".left", teams[0].name);
    update(teams[1], ".right", teams[1].name);
  });
  
  // Player tags
  match.OnPlayersUpdated((left, right) => {
    center();
    if(match.spectating){
      $('.teamboard .player .boost').show();
    }
    else{
      
      $('.teamboard .player .boost').hide();
    }
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
    var i = 0;
    left.forEach(element => {
      update(element, '.teamboard.left .player#t' + element.team + `-p` + i + `-board`);

      var t = GetLocation(element.location);
      var b = d3.selectAll('.car#t' + element.team + '-p' + i + '-circle');
      b.transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("cx", t.X)
      .attr("cy", t.Y);
      i++;
    });  
    right.forEach(element => {
      update(element, '.teamboard.right .player#t' + element.team + `-p` + i + `-board`);

      var t = GetLocation(element.location);
      var b = d3.selectAll('.car#t' + element.team + '-p' + i + '-circle');
      b.transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("cx", t.X)
      .attr("cy", t.Y);
      i++;
    });
  });
  
  // Spectator
  match.OnSpecatorUpdated((isSpectating, player) => {
    if(player === undefined || !isSpectating)
    {
      $('.spectating').css('visibility', 'hidden');
      $('.spectating-boost').hide();
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

    SetSpectatingBoost(player);
    $('.spectating-boost').show();
  });

  // Active Players changed
  match.OnTeamsChanged((left, right) => {
    $('.teamboard.left').empty();
    $('.teamboard.right').empty();
    d3.selectAll('.blue-car').remove();
    d3.selectAll('.orng-car').remove();

    var minimap = d3.selectAll('#minimap');

    var i = 0;
    left.forEach(element => {
      $('.teamboard.left').append(`<div id="t` + element.team + `-p` + i + `-board" class="player">
        <div class="info">
          <div class="name">
          ` + element.name + `
          </div>
          <div class="stats">
            <div class="stat"><div class="goal">` + element.goals + `</div><img src="assets/stat-icons/goal.svg"/></div>
            <div class="stat"><div class="assist">` + element.assists + `</div><img src="assets/stat-icons/assist.svg"/></div>
            <div class="stat"><div class="save">` + element.saves + `</div><img src="assets/stat-icons/save.svg"/></div>
            <div class="stat"><div class="shots">` + element.shots + `</div><img src="assets/stat-icons/shot-on-goal.svg"/></div>
            <div class="stat"><div class="demo">` + element.demos + `</div><img src="assets/stat-icons/demolition.svg"/></div>
          </div>
          <div class="boost">
            <div class="fill"></div>
          </div>
        </div>
      </div>`);

      var t = GetLocation(element.location);
      minimap.append('svg:circle')
        .attr("cx", t.X)
        .attr("cy", t.Y)
        .attr("r", "192")
        .attr("class", "blue-car car") 
        .attr("id", `t` + element.team + `-p` + i + `-circle`); 
        i++;
    });     

    right.forEach(element => {
      $('.teamboard.right').append(`<div id="t` + element.team + `-p` + i + `-board" class="player">
        <div class="info">
          <div class="name">
          ` + element.name + `
          </div>
          <div class="stats">
            <div class="stat"><div class="goal">` + element.goals + `</div><img src="assets/stat-icons/goal.svg"/></div>
            <div class="stat"><div class="assist">` + element.assists + `</div><img src="assets/stat-icons/assist.svg"/></div>
            <div class="stat"><div class="save">` + element.saves + `</div><img src="assets/stat-icons/save.svg"/></div>
            <div class="stat"><div class="shots">` + element.shots + `</div><img src="assets/stat-icons/shot-on-goal.svg"/></div>
            <div class="stat"><div class="demo">` + element.demos + `</div><img src="assets/stat-icons/demolition.svg"/></div>
          </div>
          <div class="boost">
            <div class="fill"></div>
          </div>
        </div>
      </div>`);

      var t = GetLocation(element.location);
      minimap.append('svg:circle')
        .attr("cx", t.X)
        .attr("cy", t.Y)
        .attr("r", "192")
        .attr("class", "orng-car car")
        .attr("id", `t` + element.team + `-p` + i + `-circle`); 
        i++;
    });        
  });

  // Goal replay started
  match.OnInstantReplayStart(() => { ReplayAnimation(); });
  
  match.OnInstantReplayEnd(() => { $('.minimap').hide(); });

  // Kick off countdown begin
  match.OnCountdown(() => { CountdownAnimation() });

  match.OnBallMove((ball) => {
      var t = GetLocation(ball.location);
      var b = d3.selectAll('#ball');
      b.transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("cx", t.X)
      .attr("cy", t.Y);
  });

  // Game Ended
  match.OnGameEnded(() => {
    $('#all').hide();
    PreGamePosition();
  });

  WsSubscribers.subscribe("game", "match_destroyed", (p) => { 
    $('#all').hide();
    $('.teamboard .left').empty();
    $('.teamboard .right').empty();
    d3.selectAll('.blue-car').remove();
    d3.selectAll('.orng-car').remove();
    PreGamePosition();
  });
});