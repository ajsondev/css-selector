var devtoolsMgr = {
  devToolsPort:null,
  exceptions: null,
  variants : [{form:"login",fields:["username","password","button"]},
              {form:"register",fields:["password","passwordConfirm"]},
              {form:"changepwd",fields:["currentPassword","newPassword","newPasswordConfirm"]},
            ],
  loadExceptions:function(){
    var json_url = "https://infoarmor.splikity.com/extensions/data/login.json";
    return new Promise((resolve,reject)=>{
      $.get(json_url,function(result){
          resolve(JSON.parse(result).exceptionRules);
        },"html").fail(function(){
          resolve(null);
      });
    })
  },
  initialize: function(){
    this.loadExceptions().then(result => {
      this.exceptions = result;
      // normalize forms
      this.exceptions.forEach(e => {
        if (!e.forms){
          e.forms = [];
          e.forms[0] = {type : e.type, fields: $.extend(true, {}, e.fields)};
          delete e.type;
          delete e.fields;
        }
      });
    })
    chrome.devtools.panels.elements.createSidebarPane(
      "CSS Selector",
      function(sidebar) {
  	  	sidebar.setPage("sideBarBackground.html");
  	  	//resize
    		sidebar.onShown.addListener(function(panelWindow){
    			var resizeFunc = function(){
  		    	var newh = (this.document.body.getBoundingClientRect().height + 60) + "px";
  		    	console.log(this.document.body.getBoundingClientRect().height);
  		    	sidebar.setHeight(newh);
    			}
    			var resizeListener = function(event){
    				console.log(event.data);
    				if(event.data == "resize panel"){
    					resizeFunc();
    				}
    			}
    			resizeFunc();
      		panelWindow.onresize = resizeFunc;
      		panelWindow.addEventListener("message", resizeListener, false);
      	});
    });
    chrome.devtools.panels.elements.onSelectionChanged.addListener((result) => {
      console.log("Selection changed ",result);
      if (this.devToolsPort){
        this.devToolsPort.postMessage({action:"selectionChanged"});
      }
      else{
          var _t = setInterval(()=>{
            if (this.devToolsPort){
              clearInterval(_t);
              this.devToolsPort.postMessage({action:"selectionChanged"});
            }
          },100)
      }
    });
    chrome.runtime.onConnect.addListener((port) => {
      this.devToolsPort = port;
      this.devToolsPort.onMessage.addListener((message, sender, sendResponse) => { this.devToolsListener(message, sender, sendResponse)});
    });
  },
  devToolsListener : function (message, sender, sendResponse){
    switch(message.action){
      case "getScenarioVariants":
        this.devToolsPort.postMessage({action:"scenarioVariants",variants:this.variants});
      break;
      case "saveScenarioVariant":
        console.log("Saving ",message)
        this.updateExceptions(message);
      break;
      case "downloadExceptionFile":
        console.log("Downloading...")
        this.downloadExceptionFile();
      break;
    }
  },
  downloadExceptionFile:function(){
    console.log("exporting to JSON file ");
    var now = new Date();
    var id = now.getTime()/1000;
    var filename = "login-"+id+".json";
    var docContent = JSON.stringify({exceptionRules:this.exceptions},null,2)
    let doc = URL.createObjectURL( new Blob([docContent], {type: 'application/octet-binary'}) );
    chrome.downloads.download({ url: doc, filename: filename, conflictAction: 'overwrite', saveAs: true });
  },
  updateExceptions:function(message){
    chrome.tabs.get(chrome.devtools.inspectedWindow.tabId,(info)=>{
      var _URL = new URL(info.url);
      var _url = _URL.origin+_URL.pathname;
      var exceptionRules = this.exceptions.filter(e => {
        var _result = false;
        if (e.pattern.indexOf("/^"+_url) != -1){
          _result = true;
        }
        return _result;
      });
      if (exceptionRules.length){
        var e = exceptionRules[0];
        e.pattern = "/^"+_url;
        var _v = e.forms.find((f)=>{return (f.type == message.variant)});
        if (!_v){
          var _fields = {};
          _fields[message.fieldType] = message.value;
          _v = {type: message.variant, fields:_fields};
          e.forms.push(_v);
        }
        else{
          _v.fields[message.fieldType] = message.value;
        }
        alert("Site: "+JSON.stringify(e,null,2))
      }
      else{
        var _form={};
        _form.type = message.variant;
        var _fields = {};
        _fields[message.fieldType] = message.value;
        _form.fields = _fields;
        this.exceptions.push({pattern:"/^"+_url, forms:[_form]})
        alert("Site: "+JSON.stringify(this.exceptions[this.exceptions.length-1],null,2))
      }
    });
  }
};

devtoolsMgr.initialize();
