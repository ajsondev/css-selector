import React, { Component } from 'react';

function Button(props){
  return <input type="button" value={props.name}  onClick={() => props.onClick()}/>;
}
function RadioButton(props){
  return <label>{props.value}<input type="radio" checked={props.checked} name={props.name}  onChange={() => props.onClick()}/></label>;
}
class Scenarii extends Component {
  constructor(props) {
    super(props);
    this.state = {
      variant: 0,
      field: 0
    };
  }

  render() {
    const _listButtonsVariants = this.props.variants.map((v, index) =>
      <RadioButton value={v.form} key={index.toString()} checked={index==this.state.variant?true:false} name="scenario" onClick={() => this.handleVariantClick(index)}/>
    );
    var _listButtonsFields = [];
    if (this.props.variants.length){
      _listButtonsFields = this.props.variants[this.state.variant].fields.map((f,index) =>
        <Button name={f} key={index.toString()} onClick={() => this.props.onFieldClick(this.state.variant,index)}/>
      );
    }

    return (<div className="section">
              <span>{_listButtonsVariants}</span>
              <span>{_listButtonsFields}</span>
            </div>
    );
  }
  handleVariantClick(index) {
    console.log("Setting state to:"+index);
    this.setState({variant:index})
  }
}

export default Scenarii;
