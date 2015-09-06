$(function(){
 var from = $.cookie("user");
 var socket = io.connect();
 socket.emit("online", {user:from});
 socket.on("online",function(data){
  if(data.user == from){
    if(data.record){
    showRecord(data.record);
     }
    var sys = '<div class="well" style="color:#CC3300;">System' + ' : you joined！<span>' +now() +'</span></div>';
    $("#person").append('<span style="color:#6699CC">'+from+'</span>');
  }else{
    var sys = '<div class="well" style="color:#CC3300;">System' + ' : ' + data.user +' joined！<span>' +now() +'</span></div>';
  }
  $("#dialog").append(sys);
  $('.well').last()[0].scrollIntoView(false);
});
 socket.on("say", function(data){
  $("#dialog").append('<div class="well"><h4 style="display:inline;">' +data.user + '</h4> <span>' +  now() + '</span><br/><div id="text">' + data.message + '</div></div>');
  $('.well').last()[0].scrollIntoView(false);
});

 socket.on("offline", function(data){
   var sys = '<div class="well" style="color:#CC3300;">System' + ' : ' + data.user +' left！<span>' +now() +'</span></div>';
   $("#dialog").append(sys);
   $('.well').last()[0].scrollIntoView(false);
 });


//get current time
function now() {
  var date = new Date();
  var time = (date.getMonth() + 1)+ '.' + date.getDate() + '.' + date.getFullYear()  + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes());
  return time;
}


//show previous records
function showRecord(record){
  var contents = "";
  for(var i = 0 ; i<record.length; i++){
    contents += '<div class="well"><h4 style="display:inline;">' +record[i].user + '</h4> <span>' +  record[i].time + '</span><br/><div id="text">' + record[i].info + '</div></div>';
  }
  var sys = contents + '<div class="well"><em style="color:#CC0099">previous records above</em></div>';
  $("#dialog").append(sys);
}

  //send message
  $("button").click(function(){
    var message = $("#message").val();
    if(message==""){
      return;
    }
    $("#dialog").append('<div class="well"><h4 style="display:inline;">' +from + '</h4> <span>' +  now() + '</span><br/><div id="text">' + message + '</div></div>');
    socket.emit("say",{user: from, message: message});
    $('.well').last()[0].scrollIntoView(false);
    $("#message").val('').focus();
  });
});

