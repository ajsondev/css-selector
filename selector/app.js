import React, { Component } from 'react';
import Scenarii from './scenarii';
import ButtonsField from './buttonsfield';
import './css/app.css';

var debug = true;
const MAX_LEVELS = 5;
//HELPER SCRIPT STUFF
const HELPERS = {
  GETSELECTORS: "getAttributesFromElems",
  SELECT: "selectElem",
  GETNUMMATCHES: "getNumCssMatches"
};

function Button(props){
  return <input type="button" value={props.name}  onClick={() => props.onClick()}/>;
}
function RadioButton(props){
  return <label>{props.value}<input type="radio" checked={props.checked} name={props.name}  onClick={() => props.onClick()}/></label>;
}
class App extends Component {
  constructor(props) {
    super(props);
    this.inMove = false;
    this.backgroundPageConnection = null;
    this._scenarioVariant ="";
    this._field="";
    this.onlyVisible= false;
    this.currentMatch= 0;
    this.state = {
      variants: [],
      numMatch:0,
      curMatch:0,
      selector: "",
      attrsFromElems:[]
    };
  }
  componentDidMount(){
    this.backgroundPageConnection = chrome.runtime.connect({
      name: "devtools-page"
    });
    this.backgroundPageConnection.onMessage.addListener((message) => {
      // Handle responses from the background page, if any
      console.log("Receiving:",message);
      switch(message.action){
        case "selectionChanged":
          this.getAttributesFromElemsUpdatePageAndUpdateSelector();
        break;
        case "scenarioVariants":
           this.setState(Object.assign({}, this.state, {variants:message.variants}));
           this.getAttributesFromElemsUpdatePageAndUpdateSelector();
        break;
      }
    });
    this.backgroundPageConnection.postMessage({action:"getScenarioVariants"});
  }
  render() {
    return (
      <div>
        <div id="buttonLoc" className="body">
          <ButtonsField attrsFromElems={this.state.attrsFromElems}
                        onAttributeClick={(event, checked, rowIdx, colIdx) =>
                          this.handleAttributeClick(event, checked, rowIdx, colIdx)}/>
    		</div>
    		<nav className="footer">
    			<div className="section">
            <div>
              <label> Selector:<input type="text" id="selector" size="60" value={this.state.selector}></input></label>
              <Button name="To Clipboard" onClick={() => this.handleCopySelClick()}>To Clipboard</Button>
            </div>
            <Button name="Previous" onClick={() => this.handleLastMatchClick()}>Prev</Button>
    				<span id="matches">
              <a id="curMatch" className={this.state.numMatch==1?"ok":"nok"}><strong>{this.state.curMatch}</strong></a>
              <a className={this.state.numMatch==1?"ok":"nok"}><strong>/</strong></a>
              <a id="numMatches" className={this.state.numMatch==1?"ok":"nok"}><strong>{this.state.numMatch}</strong></a>
    				</span>
    				<Button name="Next" onClick={() => this.handleNextMatchClick()}>Next</Button>

            <Scenarii variants={this.state.variants} onFieldClick={(variant,index) => this.handleFieldClick(variant,index)}/>
            <div className="section">
				      <Button name="download file" onClick={() => this.handleDownloadfileClick()}>Download</Button>
			     </div>
    			</div>
    		</nav>
      </div>
    );
  }
  handleFieldClick(variant,index) {
    console.log("Setting state to:"+index);
    this.backgroundPageConnection.postMessage({action:"saveScenarioVariant",
                                          variant:this.state.variants[variant].form,
                                          fieldType:this.state.variants[variant].fields[index],
                                          value: this.state.selector
                                          });
  }
  handleDownloadfileClick(){
    //if (debug) console.log("Dowloading:");
    this.backgroundPageConnection.postMessage({action:"downloadExceptionFile"});
  }
  handleGetSelectorsButtonClick(){
    this.getAttributesFromElemsUpdatePageAndUpdateSelector();
    this.currentMatch = 0;
    this.updateMatches(0,false);
    console.log("getSelectorsButtons");
  }
  handleLastMatchClick(){
    //if (debug) console.log("Getting previous match (" + backgroundMgr.currentMatch + ")");
    this.updateMatches(this.state.curMatch-1,true);
    console.log("lastMatch");
    this.inMove = true;
  }
  handleNextMatchClick(){
    //if (debug) console.log("Getting next match (" + backgroundMgr.currentMatch + ")");
    this.updateMatches(this.state.curMatch+1,true);
    this.inMove = true;
  }
  handleCopySelClick(){
    //if (debug) console.log("Copying selectors to clipboard: '" + selectorBuilder.getSelector() + "'");
    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = $("#selector").val();
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();
  }
  handleOnlyVisClick(){
    this.onlyVisible = event.target.checked;
    this.updateMatches(0,false);
  }
  handleAttributeClick(event, checked, rowIdx, colIdx, dontUpdateState, sortedAttrs){
    var _attrsFromElems;
    var _attr;
    if (dontUpdateState){
      _attr = sortedAttrs[rowIdx][colIdx];
    } else{
      _attrsFromElems = $.extend(this.state.attrsFromElems,{});
      _attr =_attrsFromElems[rowIdx][colIdx];
    }
    var _metaPressed = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
    _attr.checked = checked;
    if(checked){
      var _fragmentToAdd = _attr.selectorFragment;
      if(_metaPressed){
        _fragmentToAdd = ":not(" + fragmentToAdd + ")";
        _attr.class = "notted";
      }
      _attr.text = (_attr.name=="tagName"?"<"+_fragmentToAdd+">":_fragmentToAdd);
      selectorBuilder.addSelectorFragment(_attr.selectorFragment, rowIdx, _attr.priority);
    } else {
      var _fragmentToRemove = _attr.selectorFragment;
      var _lastMetaPressed = _attr.metaPressed;
      if(_lastMetaPressed){
        _fragmentToRemove = ":not(" + _fragmentToRemove + ")";
        _attr.class="";
      }
      //label.textContent = attr.selectorFragment;
      _attr.text = (_attr.name=="tagName"?"<"+_attr.selectorFragment+">":_attr.selectorFragment);
      selectorBuilder.removeSelectorFragment(_attr.selectorFragment, rowIdx, _attr.priority);
    }
    if (!dontUpdateState){
      this.setState(Object.assign({}, this.state,
                    {selector: selectorBuilder.getSelector(),attrsFromElems:_attrsFromElems}));
    }
    this.updateMatches(0,false);
  }
  getAttributesFromElemsUpdatePageAndUpdateSelector(){
    if (!this.inMove){
      if (debug) console.log("Getting selectors");
      selectorBuilder.clearSelector();
      runHelperScript(HELPERS.GETSELECTORS, [MAX_LEVELS]).then((attributesAndFrames) => {
        if (debug) console.log(JSON.stringify(attributesAndFrames));
        var _sorted = this.sortAttrsFromElems(attributesAndFrames.attributes.reverse());
        var _attrsFromElem = _sorted[attributesAndFrames.attributes.length-1];
        var _found = false;
        _attrsFromElem.forEach((elem,i)=>{
          elem.selectorFragment = selectorFragmentFromAttr(elem.name, elem.value);
          if (elem.priority < 3 || (elem.priority < 4 && !_found)) {
            this.handleAttributeClick({type: "noevent"}, true, _sorted.length-1, i, true, _sorted);
            if (elem.priority == 2) _found = true;
          }
        });
        this.setState(Object.assign({}, this.state, {attrsFromElems:_sorted,selector:""}));
      });
    }
    this.inMove = false;
  }
  updateMatches(curMatch,inspectCurrentMatch){
    runHelperScript(HELPERS.SELECT, [selectorBuilder.getSelector(), curMatch, this.onlyVisible, inspectCurrentMatch]).then((curAndNumMatches) => {
      if(debug) console.log("Results of updateMatches: " + JSON.stringify(curAndNumMatches));
      this.setState(Object.assign({}, this.state, {selector: selectorBuilder.getSelector(), numMatch:curAndNumMatches.numMatch,curMatch:curAndNumMatches.curMatch}));
    });
  }
  sortAttrsFromElems(attrsFromElems) {
    var _filters = [{attribute:"tagName",priority:1},
                   {attribute:"id",priority:2},
                   {attribute:"name",priority:3},
                   {attribute:"class",priority:4},
                   {attribute:"type",priority:5},
                   {attribute:"placeholder",priority:6}];
    attrsFromElems.forEach((attrsFromElem, index) => {
      var _mappedAttrsFromElem = attrsFromElem.map((attr) => {
        var _index = _filters.map((f)=>{return f.attribute;}).indexOf(attr.name);
        return {name:attr.name, value: attr.value,priority: (_index==-1? _index:_filters[_index].priority)}
      });
      var _filteredAttrsFromElem = _mappedAttrsFromElem.filter((f)=>{ return f.priority != -1;});
      attrsFromElems[index] = _filteredAttrsFromElem.sort((a1,a2)=>{
        if (a1.priority > a2.priority) return 1;
        if (a1.priority < a2.priority) return -1;
        return 0;
      });
    });
    return attrsFromElems;
  }
  updatePage(attributesAndFrames, buttonLoc, buttonCallbackA) {
    if (debug) console.log("Updating page");
    var _attrsFromElems = attributesAndFrames.attributes;
    //WRITE THE UPDATES
    this.setState(Object.assign({}, this.state, {attrsFromElems:this.sortAttrsFromElems(attrsFromElems)}));
    tellDevtoolsToResizePanel();
  }
}

export default App;
