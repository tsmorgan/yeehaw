var socket = io();

socket.on('connect', () => console.log("——— connected") );
socket.on('disconnect', () => console.log("———disconnected") );

/**
 * When server updates the array of users
 */
socket.on('users', (users,hidden) => {

  var button_text = (hidden) ? "show" : 'hide';
  $('#hide_link span').text(button_text);

  // console.log('users:', users);
  var content = '';
  users.forEach(el => { 
    const num = (hidden) ? 'X' : el.choice ;
    content += "<tr><td>"+el.name;
    if (el.choice) content += '</td><td class="vote">'+num;
    content += "<tr></td>";
  });
  $("#users").html(content);

  const choices = _.filter(users, (user) => {
    const parsedInt = parseInt(user.choice, 10);
    return !isNaN(parsedInt);
  }).map((user) => parseInt(user.choice, 10));
  
  // var choices = _.map(users, (user) => parseInt(user.choice, 10));
  // console.log(choices);
  var analysed = analyzeNumbers(choices);
  console.log(analysed);

  $("#a_num").text(analysed.count+'/'+users.length);
  $("#a_high").text(analysed.max);
  $("#a_low").text(analysed.min);
  $("#a_ran").text(analysed.range);  
  $("#a_ave").text(checkNum(analysed.mean));
  $("#a_med").text(checkNum(analysed.median));

  function checkNum(num) {
    if (isNaN(num)) return '';
    else return Math.round(num,2);
  }

});

/**
 * When server sends reset command
 */
socket.on('reset',num => {
  $(".card").removeClass('card-flipped');
});

/**
 * jquery dom ui stuff
 */
$(document).on("ready", function () {

  setName(Cookies.get('username'))
  
  /**
   * when user submits a new username
   */
  $("#username_button").on("click", function (e) {
      e.preventDefault();
      setName($("#username").val());            
  });

  /**
   * when user chooses a card
   */
  $(".card").click(function (e) { 
    e.preventDefault();
    $(".card").removeClass('card-flipped');
    $(this).toggleClass('card-flipped');

    var num = $($(this).find('h2')[0]).text();
    socket.emit('choice', num);
  });

  /**
   * when user clicks to trigger a reset
   */
  $("#reset_link").click(function (e) { 
    e.preventDefault();
    socket.emit('reset', 1);
    console.log("reset click");
  });

  /**
   * when user clicks to hide or show
   */
  $("#hide_link").click(function (e) { 
    e.preventDefault();
    socket.emit('toggle');
    console.log("hide toggle click");
  });

  var admin = ['hide admin','show admin'];
  $("#admin").click(function (e) { 
    e.preventDefault();
    $("#admin_functions").toggleClass("hidden");
    const a = $(this).find("a");
    console.log(a);
    if ($(a).text() == admin[0]) $(a).text(admin[1]);
    else $(a).text(admin[0]);
  });

}); // end - jquery doc ready

/**
 * reusable function to react to a username 
 * being either entered or retrieved from cookies.
 */
function setName(un)
{
  if (un !== undefined) {          
    $("#login").toggleClass("hidden");          
    $("#app").toggleClass("hidden");          
    $("#name").html(un);
    Cookies.set('username', un, { expires: 1 });
    socket.emit('new user', un);
  } else {
    console.log("No name passed");
  }
}

/**
 * reusable function to analysis the choices
 * probably a bit of an overkill but hey...
 */
function analyzeNumbers(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return {
      median: 'blah',
      mean: 'blah',
      min: '',
      max: '',
      sum: '',
      range: '',
      count: 0,
      sortedNumbers: [],
    };
  }

  // Sort the numbers in ascending order
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const count = sortedNumbers.length;
  const sum = sortedNumbers.reduce((acc, num) => acc + num, 0);
  const median =
    count % 2 === 0
      ? (sortedNumbers[count / 2 - 1] + sortedNumbers[count / 2]) / 2
      : sortedNumbers[Math.floor(count / 2)];
  const mean = sum / count;
  const min = sortedNumbers[0];
  const max = sortedNumbers[count - 1];
  const range = max - min;

  return { median, mean, min, max, sum, range, count, sortedNumbers, };
}
