var index=1;
var last=0;

$(document).ready(function(){
    $(".next").click(function(){
        next();
    });
    $(".pre").click(function(){
        pre();
    });
    $(document).bind('mousewheel', function(event, delta) {
        now=getTime();
        if((now-last)<1000)
            return false;
        last=now;
        if(delta>0)
            pre();
        else
            next();
        return false;
    });
    $(document).keydown(function(event){
        console.log(event.keyCode);
        now=getTime();
        if(event.keyCode == 38||event.keyCode == 87){
            if((now-last)<1000)
                return false;
            last=now;
            pre();
        }else if (event.keyCode == 40||event.keyCode == 83){
            if((now-last)<1000)
                return false;
            last=now;
            next();
        }else if(event.keyCode>=96&&event.keyCode<=105){
            to=event.keyCode-96;
            if(to==0)
                to=10;
            if(to!=index)
                doMove(to,index);
        }else if(event.keyCode>=48&&event.keyCode<=57){
            to=event.keyCode-48;
            if(to==0)
                to=10;
            if(to!=index)
                doMove(to,index);
        }
    });
    play(1);
});
function pre(){
    if(index>1)
        doMove(--index,index+1)
}
function next(){
    if(index<10)
        doMove(++index,index-1);
}
function doMove(moveTo,from){
    console.log(moveTo+" "+from);
    index=moveTo;
    to=((1-moveTo)*100);
    to=to+"%";
    //alert("moveTo:"+to);
    $("#main2").animate({"top":to},1500);
    play(moveTo);
    notPlay(from);
}
function play(index){
    $("#t"+index+" img").css("opacity",0.3);
    $("#t"+index+" p").css("opacity",0.2);
    $("#t"+index+" div").css("opacity",0.2);
    $("#t"+index+" img").animate({"opacity":1},2000);
    $("#t"+index+" p").animate({"opacity":1},3000);
    $("#t"+index+" div").animate({"opacity":1},3000);
}
function notPlay(index){
    $("#t"+index+" img").css("opacity",1);
    $("#t"+index+" p").css("opacity",1);
    $("#t"+index+" div").css("opacity",1);
    $("#t"+index+" img").animate({"opacity":0},1500);
    $("#t"+index+" p").animate({"opacity":0},1500);
    $("#t"+index+" div").animate({"opacity":0},1500);
    $("#t"+index+" img").animate({"opacity":1},1);
    $("#t"+index+" p").animate({"opacity":1},1);
    $("#t"+index+" div").animate({"opacity":1},1);
}
function getTime(){
    return new Date().getTime();
}
