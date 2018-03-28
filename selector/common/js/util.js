function selectorFragmentFromAttr(attrName, attrVal){
  var selectorFragment;
  switch(attrName){
    case "tagName":
      selectorFragment = attrVal;
    break;
    case "class":
      selectorFragment = "." + attrVal;
    break;
    default:
      selectorFragment = "[" + attrName + "='" + attrVal + "']";
  }
  return selectorFragment;
}
//http://stackoverflow.com/questions/448981/what-characters-are-valid-in-css-clazz-selectors
function isValidSelector(selector) {
  if (typeof(selector) != "string")
    return false;
  if (selector.length < 2)
    return false;
  var pattern = new RegExp("^\-?[_a-zA-Z]+[_a-zA-Z0-9-]*$");

  var firstChar = selector.charAt(0);
  if (firstChar == '#' || firstChar == '.') {
    selector = selector.substring(1);
  }

  return pattern.test(selector);
}

function tellDevtoolsToResizePanel() {
  window.postMessage("resize panel", "*");
}

function runHelperScript(script, args) {
  var evalStr = "(function(){return (typeof " + script + " !== 'undefined');}());";
  return new Promise((resolve,reject)=>{
    chrome.devtools.inspectedWindow.eval(evalStr, (alreadyInjected, isException) => {
      if (isException) {
        if (debug) console.log("Exception when checking if " + script + " is defined:")
        if (debug) console.log(isException);
      }

      //unroll args into script
      var evalStr = "var lastSelectedElem = $0; var myInspect = inspect;";
      if (!alreadyInjected) {
        evalStr += injectString;
      }

      evalStr += script + '(';
      if (args.length > 0) evalStr += '"' + args[0] + '"';
      for (var i = 1; i < args.length; i++) {
        evalStr += ', "' + args[i] + '"';
      }
      evalStr += ');';

      console.log(evalStr);
      chrome.devtools.inspectedWindow.eval(evalStr, (result, isException) => {
        if (isException) {
          if (debug) console.log("Exception when running " + script + ":")
          if (debug) console.log(isException);
        }
        resolve(result);
      });
    });
  });
}

//HELPFUL FUNCTIONS
function removeFromArray(arr, obj){
  var index = arr.indexOf(obj);
  if (index > -1) {
      arr.splice(index, 1);
  }
}

function isBlank(o){
  return (o == undefined || o == null || o == "");
}

function isValidSelector(selector) {
  if (typeof(selector) != "string" || selector.length < 2){
    return false;
  }
  var isValidSelectorPattern = new RegExp("^\-?[_a-zA-Z]+[_a-zA-Z0-9-]*$");
  var firstChar = selector.charAt(0);
  if (firstChar == '#' || firstChar == '.') {
    selector = selector.substring(1);
  }
  return isValidSelectorPattern.test(selector);
}
