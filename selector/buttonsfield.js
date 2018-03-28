import React, { Component } from 'react';

function ToggleButton(props){
  var _id = props.name + Math.round(Math.random()*100000);
  return <td className="toggle-button">
    <input id={_id} value={props.name} type="checkbox" col={props.col} line={props.line} checked={props.checked} onChange={(event) => props.onAttributeClick(
        event, event.target.checked, props.line, props.col
    )}/>
    <label htmlFor={_id} unselectable="" className={props.className}>{props.text}</label>
  </td>
}

function ButtonRow(props){
  var _listAttr;
  if (props.attrsFromElem.length){
    _listAttr = props.attrsFromElem.map((a,col) => {
      var _class = "";
      a.selectorFragment = selectorFragmentFromAttr(a.name,a.value)
      var _text = (a.name=="tagName"?"<"+a.selectorFragment+">":a.selectorFragment);
      return <ToggleButton name={a.name} key={col.toString()} className={_class} checked={a.checked} text={_text} line={props.line} col={col} onAttributeClick={(event, checked, line, col) => props.onAttributeClick(event, checked, line, col)}/>
    });
  };
  return <div>{_listAttr}</div>;
}

class ButtonsField extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  render() {
    var _listRows = [];
    if (this.props.attrsFromElems.length){
      _listRows = this.props.attrsFromElems.map((r,index) =>
        <ButtonRow key={index} line={index} attrsFromElem={this.props.attrsFromElems[index]} onAttributeClick={(event, checked, line, col) => this.props.onAttributeClick(event, checked, line, col)}/>
      );
    };
    return (<div>
              {_listRows}
            </div>
    );
  }
  clickForDefaultSelector(attrsFromElems) {
    var _attrsFromElem = attrsFromElems[attrsFromElems.length-1];
    var _found = false;
    var _time = 500;
    _attrsFromElem.forEach((elem,i)=>{
      if (elem.priority < 3 || (elem.priority < 4 && !_found)) {
        setTimeout(()=>{
          $("input[line='"+(attrsFromElems.length-1)+"'][col='"+i+"']").click();
        },_time)
        _time+=1000;

        if (elem.priority == 2) _found = true;
      }
     });
  }
}

export default ButtonsField;
