var components=[
    "base/app-layout",
    "base/app-content"
]

function listDir(path) {
    window.resolveLocalFileSystemURL(path,
        function (fileSystem) {
            var reader = fileSystem.createReader();
            reader.readEntries(
                function (entries) {
                    console.log(entries);
                },
                function (err) {
                    console.log(err);
                }
            );
        }, function (err) {
            console.log(err);
        }
    );
}

function readLocalFile(file, callback, error){
    if (window.resolveLocalFileSystemURL){
        window.resolveLocalFileSystemURL(file,function(entry){
             entry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function() {
                        callback(this.result);
                };
                reader.readAsText(file);
                })
             }, error)
    }else if (error){
        error("Can't load file");
    }
}


var loadData=function(url,callback, error){

    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function (aEvt) {
        //console.log("state",req.readyState);
        if (req.readyState == 4) {
            if(req.status == 200){
                callback(req.responseText);
            }
            else{
                if (!window.cordova){
                    return;
                }
                var file=cordova.file.applicationDirectory+"www/"+url;
                readLocalFile(file,callback,error);
            }
        }
    };
    req.onerror=function(err){
        if (!window.cordova){
            if(error){
                error("Error loading "+url+" "+err);
            }
            return;
        }
        var file=cordova.file.applicationDirectory+"www/"+url;
        readLocalFile(file,callback,error);
    }
    req.send(null)
}

var vueData={
    el: '#app',
    data: {
        contents : {
            "title" : "Loading"
        },
        appLayout: "",
        debug: false
    },
    created:function(){
        var self=this;
        this.loadComponents(components,function(){
            self.$el.className+=" loaded";
            // console.log("Components loaded");
            self.appLayout="app-layout";
        },0)
    },
    mounted:function(){
        console.log("mounted",this.contents);
    },
    methods: {
        loadComponents:function(list,callback, pos){
            // console.log('loadComponents');
            var self = this;
            if (!pos){
                pos=0;
            }
            // console.log("Loading",pos,list[pos]);
            if (!list[pos]){
                callback(pos);
                return;
            }
            this.loadComponent(list[pos],function(text){
                self.loadComponents(list, callback, pos+1);
            })
        },
        loadComponent:function(id, callback){
            var suffix = '?' + (new Date()).getTime();
            loadData("components/"+id+".html"+suffix,function(text){
                // console.log("component",id);
                callback(text);
                var e=document.createElement("div");
                e.id="component-"+id;
                e.innerHTML=text;
                document.body.appendChild(e);
                var scripts=e.querySelectorAll("script[type='text/javascript']");
                for(var i=0; i<scripts.length; i++){
                    var script=scripts[i];
                    if (script.src){
                        var sc=document.createElement("SCRIPT");
                        sc.src=script.src;
                        document.body.appendChild(sc);
                    }else{
                        eval(script.innerHTML);
                    }    
                }
                
                     },function(err){
                     console.log(err);
                     })
        },
        loadView:function(view){
            var self=this;
            console.log("Load view",view);
            loadData("data/"+view+".json?"+Math.random(),function(text){
                var json=JSON.parse(text);
                console.log("json",json,self.contents);
                self.contents=json;
                document.title=json.title;
            })
        }
    }
}

document.addEventListener("deviceready",function(){
  var app = new Vue(vueData);
});

if (!window.cordova && !window.ae){
    var event = new CustomEvent('deviceready');
    document.dispatchEvent(event);   
}

