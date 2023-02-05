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
  $('.replay').animate({
    opacity:"0"
  });
}

function ReplayAnimation()
{
  // $('.scoreboard').animate({
  //   top:"-180px"
  // });
  // $('.teamboard.left').animate({
  //   left:"-420px"
  // });
  // $('.teamboard.right').animate({
  //   left:"105%"
  // });
  $('.spectating').animate({
    left:"-1000px"
  });
  $('.spectating-boost').animate({
    opacity:"0"
  });
  $('.replay').animate({
    opacity:"1"
  });
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
    opacity:"1"
  });
}

function center() {
  let boost = d3.select('.spectating-boost .boost-ring .boost-num');

  // Get current x and y values.
  let x = 155;
  let y = 155;
  
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

  var color = 'var(--blue)';
  if(player.team != 0)
  {
    color = 'var(--orange)';
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
      $('.scoreboard .series-tally .series-text').text(p.series_txt);

      $('.scoreboard .left .name').text(p.teams[0].name);
      $('.scoreboard .right .name').text(p.teams[1].name);

      var games = Math.ceil(p.length / 2);
      if(games <= 1)
      {
        $('.scoreboard .series-tally .mark').hide();
        return;
      }
      for(var i = 1; i <= games; i++)
      {
        $('.scoreboard .series-tally .left').append(`<div class="mark w${i}"></div>`);
        $('.scoreboard .series-tally .right').append(`<div class="mark w${i}"></div>`);
      }

      $('.scoreboard .series-tally .mark').show();

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
  match.OnTimeUpdated((time, seconds, isOT) => {
    
    // If were not showing main elements then animate them in
    if(match.timeStarted && !$('#all').is(":visible")) {
      PreGamePosition();
      $('#all').show();
      CountdownAnimation();
    }

    // Update time
    $('.scoreboard .center .time').text(time);

    if(isOT)
    {
      $('.scoreboard .center .time').css({color: "#fffbb3", "font-size": "60px"});
      return;
    }

    if(seconds <= 10){
      $('.scoreboard .center .time').css({color: "rgb(255, 17, 0)", "font-size": "65px"});
      $('.scoreboard .center .time').animate({
        "font-size": "60px",
        "color": "rgb(209, 35, 23)",
      }, 500).animate({
        "font-size": "65px",
        "color": "rgb(255, 17, 0)",
      }, 500);
    }else if(seconds <= 30){
      $('.scoreboard .center .time').css({color: "#ffa53d", "font-size": "60px"});
    }else if(seconds <= 60){
      $('.scoreboard .center .time').css({color: "#ffe880", "font-size": "60px"});
    }else if(seconds){
      $('.scoreboard .center .time').css({color: "#fffbb3", "font-size": "60px"});
    }
  });

  // Scoreboard
  match.OnTeamsUpdated((teams) => {
    var update = (team, id) => {
      $('.scoreboard ' + id + ' .score').text(team.score);
    };

    update(teams[0], ".left");
    update(teams[1], ".right");
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
      $(id + ' .boost .num').text(player.boost);
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
      $('.spectating').css('background-image', 'linear-gradient(to right, var(--blue), rgba(0, 38, 255, 0.3))');
    }
    else
    {
      $('.spectating').css('background-image', 'linear-gradient(to right, var(--orange), rgba(255, 119, 0, 0.3))');
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

//   element.style {
//     width: 480px;
//     background-image: linear-gradient(to right, rgba(0, 9, 61, 0.86), rgba(0, 0, 0, 98) 370px, rgb(9, 32, 128));
// }

/* <div class="event" style="
    position: absolute;
    left: 428px;
    top: 0px;
    height: 62px;
    padding: 8px 0px 8px 0px;
">
            <img src="assets/stat-icons/save.svg" style="
    height: 62px;
    filter: invert(1);
">
        </div> */

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
            <div class="num"></div>
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
            <div class="num"></div>
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
  
  match.OnInstantReplayEnd(() => { 
    $('.replay').animate({
      opacity:"0"
    });
  });

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

  match.OnGoalScored((data) => {
    var addColorClass = data.scorer.teamnum == 0 ? 'blue' : 'orange';
    var removeColorClass = data.scorer.teamnum == 1 ? 'blue' : 'orange';

    var goalStats = $('.replay .bottom-overlay .goal-stats');
    goalStats.addClass(addColorClass);
    goalStats.removeClass(removeColorClass);

    if(data.assister.id != "")
    {
      $('.replay .bottom-overlay .goal-stats .assist img').show();
      $('.replay .bottom-overlay .goal-stats .assist div').text(data.assister.name);
    }
    else
    {
      $('.replay .bottom-overlay .goal-stats .assist img').hide();
      $('.replay .bottom-overlay .goal-stats .assist div').text("");
    }
    $('.replay .bottom-overlay .goal-stats .goal-speed div').text((Math.ceil(data.goalspeed/1.609)) + "MPH");
    $('.replay .bottom-overlay .goal-stats .scored-by div').text(data.scorer.name);
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